import Elysia, { t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { tokenConfig } from '../config/token.config'
import { config } from '../config/config'

// Define the JWT payload type
export const JWTPayload = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  role: t.Object({
    name: t.String(),
    permissions: t.Array(t.String())
  }),
  hasPasskeys: t.Optional(t.Boolean())
})

export type TokenPayload = {
  id: string
  email: string
  name: string
  role: {
    name: string
    permissions: string[]
  }
  hasPasskeys?: boolean
}

// Define the refresh token payload type
export const RefreshTokenPayload = t.Object({
    id: t.String(),
    email: t.String(),
  })

export type RefreshTokenPayloadType = {
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
  schema: JWTPayload,
})

export const adminRefreshTokenPlugin = jwt({
  name: 'adminRefreshToken',
  secret: config.jwt.refreshTokenSecret,
  alg: 'HS256',
  aud: 'adminAuthToken',
  exp: tokenConfig.refreshToken.expiresIn,
  schema: RefreshTokenPayload,
})

export default adminAccessTokenPlugin