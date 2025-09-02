import Elysia, { t } from 'elysia'
import { LoginInput, RegisterInput, AuthService } from '../services/auth_service'
import { LoginDto, RegisterDto, TokenResponseDto, ErrorResponseDto } from '../dto/auth_dto'
import jwtPlugin, { type JWTPayload } from '../../../plugins/jwt'
import { authService } from '../services/auth_service_factory'

interface AuthControllerOptions {
  service?: AuthService
  jwtPlugin?: typeof jwtPlugin
}

export const createAuthController = (options: AuthControllerOptions = {}) => {
  const service = options.service || authService
  const jwt = options.jwtPlugin || jwtPlugin

  return new Elysia({ name: 'auth-controller' })
    .use(jwt)
    .group('/api/auth', (app) =>
      app
        .post(
          '/login',
          async ({ body, jwt, set }) => {
            const { email, password } = body
            const result = await service.login({ email, password } as LoginInput)

            if (result.error) {
              set.status = 401
              return { error: result.error }
            }

            // Generate JWT token
            const [id, emailFromToken, role] = result.token!.split('|')
            const token = await jwt.sign({
              id,
              email: emailFromToken,
              role,
            } as JWTPayload)

            return { token }
          },
          {
            body: LoginDto,
            response: {
              200: TokenResponseDto,
              401: ErrorResponseDto,
            },
          }
        )
        .post(
          '/register',
          async ({ body, jwt, set }) => {
            const { email, password, name } = body
            const result = await service.register({ email, password, name } as RegisterInput)

            if (result.error) {
              set.status = 400
              return { error: result.error }
            }

            // Generate JWT token
            const [id, emailFromToken, role] = result.token!.split('|')
            const token = await jwt.sign({
              id,
              email: emailFromToken,
              role,
            } as JWTPayload)

            return { token }
          },
          {
            body: RegisterDto,
            response: {
              200: TokenResponseDto,
              400: ErrorResponseDto,
            },
          }
        )
    )
}

export const authController = createAuthController()