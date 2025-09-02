import Elysia, { t } from 'elysia'
import { jwt } from '@elysiajs/jwt'

// Define the JWT payload type
export interface JWTPayload {
  id: string
  email: string
  role: string
}

// Create a JWT plugin using the Elysia plugin pattern
export const jwtPlugin = jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'supersecretkey',
    schema: t.Object({
      id: t.String(),
      email: t.String(),
      role: t.String(),
    }),
  })

export default jwtPlugin