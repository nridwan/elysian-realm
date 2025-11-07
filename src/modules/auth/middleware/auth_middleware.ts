import Elysia from 'elysia'
import { adminAccessTokenPlugin } from '../../../plugins/jwt'

// Extend the Elysia context to include our user type
export interface UserContext {
  user: {
    id: string
    email: string
    name: string
    role_id: string
    role: {
      id: string
      name: string
      description: string | null
      permissions: string[] | null
    }
  } | null
}

export const authMiddleware = (app: Elysia) =>
  app.use(adminAccessTokenPlugin).derive(async ({ adminAccessToken, headers }) => {
    const authHeader = headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.substring(7)
    const payload = await adminAccessToken.verify(token)

    if (!payload) {
      return { user: null }
    }

    // Construct user object from JWT payload - no database query needed
    const user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role_id: '', // Not available in JWT, will be empty
      role: {
        id: '', // Not available in JWT, will be empty
        name: payload.role.name,
        description: null, // Not available in JWT, will be null
        permissions: payload.role.permissions
      }
    }

    return { user }
  })