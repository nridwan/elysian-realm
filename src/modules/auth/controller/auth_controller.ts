import Elysia from 'elysia'
import { AuthService } from '../services/auth_service'
import { LoginDto, RefreshTokenDto, AuthTokenResponseDto } from '../dto/auth_dto'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from '../../../plugins/jwt'
import { responsePlugin } from '../../../plugins/response_plugin'
import { authService } from '../services/auth_service_factory'
import { passkeyService } from '../services/passkey_service_factory'
import { auditMiddleware } from '../../audit/middleware/audit_middleware'

interface AuthControllerOptions {
  service?: AuthService
  adminAccessTokenPlugin?: typeof adminAccessTokenPlugin
  adminRefreshTokenPlugin?: typeof adminRefreshTokenPlugin
  auditMiddleware?: ReturnType<typeof auditMiddleware>
}

export const createAuthController = (options: AuthControllerOptions = {}) => {
  const service = options.service || authService
  const adminAccessTokenJwt = options.adminAccessTokenPlugin || adminAccessTokenPlugin
  const adminRefreshTokenJwt = options.adminRefreshTokenPlugin || adminRefreshTokenPlugin
  const audit = options.auditMiddleware || auditMiddleware()

  return new Elysia({ name: 'auth-controller' })
    .use(responsePlugin({ defaultServiceName: 'AUTH' }))
    .use(adminAccessTokenJwt)
    .use(adminRefreshTokenJwt)
    .use(audit)
    .group('/api/auth', (app) =>
      app
        .post(
          '/login',
          async ({ body, adminAccessToken, adminRefreshToken, set, responseTools, auditTools }) => {
            const { email, password } = body
            const result = await service.login({ email, password })

            if (result.error) {
              set.status = 401
              // Log failed login attempt - this is a crucial auth event worth tracking
              auditTools.recordStartAction('auth.login.failed')
              auditTools.recordChange('', 
                null,
                { email: email, success: false, reason: result.error }
              )
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

            // Log successful login - this is a crucial auth event worth tracking
            auditTools.recordStartAction('auth.login.success')
            auditTools.recordChange('', 
              null,
              { 
                email: email, 
                success: true,
                user_id: user.id,
                has_passkeys: hasPasskeys
              }
            )

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
          async ({ body, adminAccessToken, adminRefreshToken, set, responseTools, auditTools }) => {
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