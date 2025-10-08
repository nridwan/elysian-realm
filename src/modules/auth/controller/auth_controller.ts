import Elysia from 'elysia'
import { AuthService } from '../services/auth_service'
import { LoginDto, RefreshTokenDto, AuthTokenResponseDto } from '../dto/auth_dto'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin, type RefreshTokenPayload } from '../../../plugins/jwt'
import { responsePlugin } from '../../../plugins/response_plugin'
import { authService } from '../services/auth_service_factory'
import { passkeyService } from '../services/passkey_service_factory'

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
    .use(responsePlugin({ defaultServiceName: 'AUTH' }))
    .use(adminAccessTokenJwt)
    .use(adminRefreshTokenJwt)
    .group('/api/auth', (app) =>
      app
        .post(
          '/login',
          async ({ body, adminAccessToken, adminRefreshToken, set, responseTools }) => {
            const { email, password } = body
            const result = await service.login({ email, password })

            if (result.error) {
              set.status = 401
              return responseTools.generateErrorResponse(result.error, '401', result.error)
            }

            // Check if user has passkeys
            const passkeyCheck = await passkeyService.getUserPasskeys(result.user!.id)
            const hasPasskeys = passkeyCheck.success && passkeyCheck.passkeys && passkeyCheck.passkeys.length > 0

            // Generate access token with user profile and permissions
            const user = result.user!
            const accessTokenValue = await adminAccessToken.sign({
              id: user.id,
              email: user.email,
              name: user.name,
              role: {
                name: user.role.name,
                permissions: (user.role.permissions ?? []) as string[]
              },
              has_passkeys: hasPasskeys // Add passkey information to token
            })

            // Generate refresh token with user id and email
            const refreshTokenValue = await adminRefreshToken.sign({
              id: user.id,
              email: user.email
            })

            return responseTools.generateResponse({
              access_token: accessTokenValue,
              refresh_token: refreshTokenValue,
              has_passkeys: hasPasskeys
            }, '200', 'Login successful')
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
          async ({ body, adminAccessToken, adminRefreshToken, set, responseTools }) => {
            const { refresh_token: refreshTokenValue } = body
            
            // Verify the refresh token
            const payload = await adminRefreshToken.verify(refreshTokenValue)
            if (!payload) {
              set.status = 401
              return responseTools.generateErrorResponse('Invalid refresh token', '401', 'Invalid refresh token')
            }

            // Requery user by ID to get fresh user data including role and permissions
            const result = await service.refreshAccessToken(payload.id)
            
            // If there was an error during token refresh
            if (result.error) {
              set.status = 401
              return responseTools.generateErrorResponse(result.error, '401', result.error)
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

            return responseTools.generateResponse({
              access_token: newAccessToken,
              refresh_token: newRefreshToken
            }, '200', 'Token refreshed successfully')
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