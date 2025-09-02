import Elysia from 'elysia'
import { AuthService } from '../services/auth_service'
import { LoginDto, RefreshTokenDto, AuthTokenResponseDto } from '../dto/auth_dto'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin, type RefreshTokenPayload } from '../../../plugins/jwt'
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
                permissions: (user.role.permissions ?? []) as string[]
              }
            })

            // Generate refresh token with user id and email
            const refreshTokenValue = await adminRefreshToken.sign({
              id: user.id,
              email: user.email
            })

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
            detail: {
              tags: ['Auth'],
              summary: 'User Login',
              description: 'Authenticate a user with email and password to receive access and refresh tokens'
            }
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

            // Requery user by ID to get fresh user data including role and permissions
            const result = await service.refreshAccessToken(payload.id)
            
            // If there was an error during token refresh
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

            // Generate new access token with fresh user data
            const user = result.user!
            const newAccessToken = await adminAccessToken.sign({
              id: user.id,
              email: user.email,
              name: user.name,
              role: {
                name: user.role.name,
                permissions: (user.role.permissions ?? []) as string[]
              }
            })

            // Generate new refresh token
            const newRefreshToken = await adminRefreshToken.sign({
              id: user.id,
              email: user.email
            })

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
            detail: {
              tags: ['Auth'],
              summary: 'Refresh Token',
              description: 'Refresh access token using a valid refresh token'
            }
          }
        )
    )
}

export const authController = createAuthController()