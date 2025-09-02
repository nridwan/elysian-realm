import Elysia from 'elysia'
import { PrismaClient } from '@prisma/client'
import jwtPlugin from '../../../plugins/jwt'

const prisma = new PrismaClient()

// Extend the Elysia context to include our user type
export interface UserContext {
  user: {
    id: string
    email: string
    name: string
    roleId: string
    role: {
      id: string
      name: string
      description: string | null
      permissions: {
        id: string
        name: string
        description: string | null
      }[]
    }
  } | null
}

export const authMiddleware = (app: Elysia) =>
  app.use(jwtPlugin).derive(async ({ jwt, headers }) => {
    const authHeader = headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.substring(7)
    const payload = await jwt.verify(token)

    if (!payload) {
      return { user: null }
    }

    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: { include: { permissions: true } } },
    })

    return { user }
  })