import Elysia, { t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { tokenConfig } from '../config/token.config'
import { config } from '../config/config'

// Define the JWT payload type
export interface JWTPayload {
  id: string
  email: string
  name: string
  role: {
    name: string
    permissions: string[] | null
  }
}

// Define the refresh token payload type
export interface RefreshTokenPayload {
  id: string
  email: string
}

// Create JWT plugins for admin access and refresh tokens
export const adminAccessTokenPlugin = jwt({
  name: 'adminAccessToken',
  secret: config.jwt.secret,
  alg: 'HS256',
  aud: 'adminAccessToken',
  exp: tokenConfig.accessToken.expiresIn,
  schema: t.Object({
    id: t.String(),
    email: t.String(),
    name: t.String(),
    role: t.Object({
      name: t.String(),
      permissions: t.Union([t.Array(t.String()), t.Null()])
    })
  }),
})

export const adminRefreshTokenPlugin = jwt({
  name: 'adminRefreshToken',
  secret: config.jwt.refreshTokenSecret,
  alg: 'HS256',
  aud: 'adminAuthToken',
  exp: tokenConfig.refreshToken.expiresIn,
  schema: t.Object({
    id: t.String(),
    email: t.String(),
  }),
})

export default adminAccessTokenPlugin