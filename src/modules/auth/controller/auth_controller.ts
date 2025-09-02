import Elysia from 'elysia'
import { AuthService } from '../services/auth_service'
import { LoginDto, RefreshTokenDto, TokenResponseDataDto, AuthTokenResponseDto } from '../dto/auth_dto'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin, type JWTPayload, type RefreshTokenPayload } from '../../../plugins/jwt'
import { authService } from '../services/auth_service_factory'

interface AuthControllerOptions {
  service?: AuthService
  adminAccessTokenPlugin?: typeof adminAccessTokenPlugin
  adminRefreshTokenPlugin?: typeof adminRefreshTokenPlugin
}

export const createAuthController = (options: AuthControllerOptions = {}) => {
  const service = options.service || authService
  const adminAccessTokenJwt = options.adminAccessTokenPlugin || adminAccessTokenPlugin
  const adminRefreshTokenJwt = options.adminRefreshTokenPlugin || adminRefreshTokenPlugin

  return new Elysia({ name: 'auth-controller' })
    .use(adminAccessTokenJwt)
    .use(adminRefreshTokenJwt)
    .group('/api/auth', (app) =>
      app
        .post(
          '/login',
          async ({ body, adminAccessToken, adminRefreshToken, set }) => {
            const { email, password } = body
            const result = await service.login({ email, password })

            if (result.error) {
              set.status = 401
              return {
                meta: {
                  code: 'AUTH-401',
                  message: result.error,
                },
                data: null
              }
            }

            // Generate access token with user profile and permissions
            const user = result.user!
            const accessTokenValue = await adminAccessToken.sign({
              id: user.id,
              email: user.email,
              name: user.name,
              role: {
                name: user.role.name,
                permissions: user.role.permissions
              }
            } as JWTPayload)

            // Generate refresh token with user id and email
            const refreshTokenValue = await adminRefreshToken.sign({
              id: user.id,
              email: user.email
            } as RefreshTokenPayload)

            return {
              meta: {
                code: 'AUTH-200',
                message: 'Login successful',
              },
              data: {
                access_token: accessTokenValue,
                refresh_token: refreshTokenValue
              }
            }
          },
          {
            body: LoginDto,
            response: {
              200: AuthTokenResponseDto,
              401: AuthTokenResponseDto,
            },
          }
        )
        .post(
          '/refresh',
          async ({ body, adminAccessToken, adminRefreshToken, set }) => {
            const { refresh_token: refreshTokenValue } = body
            
            // Verify the refresh token
            const payload = await adminRefreshToken.verify(refreshTokenValue)
            if (!payload) {
              set.status = 401
              return {
                meta: {
                  code: 'AUTH-401',
                  message: 'Invalid refresh token',
                },
                data: null
              }
            }

            // In a real implementation, you would check if the refresh token exists in the database
            // and hasn't been revoked. For now, we'll just generate new tokens.

            // Generate new access token
            const newAccessToken = await adminAccessToken.sign({
              id: payload.id,
              email: payload.email,
              name: payload.email.split('@')[0], // Simple name extraction
              role: {
                name: 'user', // Default role, in real implementation you would fetch from DB
                permissions: []
              }
            } as unknown as JWTPayload)

            // Generate new refresh token
            const newRefreshToken = await adminRefreshToken.sign({
              id: payload.id,
              email: payload.email
            } as RefreshTokenPayload)

            return {
              meta: {
                code: 'AUTH-200',
                message: 'Token refreshed successfully',
              },
              data: {
                access_token: newAccessToken,
                refresh_token: newRefreshToken
              }
            }
          },
          {
            body: RefreshTokenDto,
            response: {
              200: AuthTokenResponseDto,
              401: AuthTokenResponseDto,
            },
          }
        )
    )
}

export const authController = createAuthController()