import Elysia from 'elysia'
import { PasskeyService } from '../services/passkey_service'
import { 
  PasskeyRegistrationStartDto, 
  PasskeyRegistrationFinishDto,
  PasskeyAuthenticationStartDto,
  PasskeyAuthenticationFinishDto,
  PasskeyOptionsSuccessResponseDto,
  PasskeyOptionsErrorResponseDto,
  PasskeyRegistrationSuccessResponseDto,
  PasskeyRegistrationErrorResponseDto,
  PasskeyAuthenticationSuccessResponseDto,
  PasskeyAuthenticationErrorResponseDto,
  PasskeyListSuccessResponseDto,
  PasskeyListErrorResponseDto,
  PasskeyDeleteSuccessResponseDto,
  PasskeyDeleteErrorResponseDto,
  PasswordlessAuthenticationStartDto,
} from '../dto/passkey_dto'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from '../../../plugins/jwt'
import { responsePlugin } from '../../../plugins/response_plugin'
import { passkeyService } from '../services/passkey_service_factory'
import { PrismaClient } from '@prisma/client'
import { adminMiddleware } from '../../admin/middleware/admin_middleware'
import { auditMiddleware } from '../../audit/middleware/audit_middleware'
import { ErrorResponseDto } from '../../../dto/base.dto'

interface PasskeyControllerOptions {
  service?: PasskeyService
  adminAccessTokenPlugin?: typeof adminAccessTokenPlugin
  adminRefreshTokenPlugin?: typeof adminRefreshTokenPlugin
  adminMiddleware?: ReturnType<typeof adminMiddleware>
  auditMiddleware?: ReturnType<typeof auditMiddleware>
}

export const createPasskeyController = (options: PasskeyControllerOptions = {}) => {
  const service = options.service || passkeyService
  const adminAccessTokenJwt = options.adminAccessTokenPlugin || adminAccessTokenPlugin
  const adminRefreshTokenJwt = options.adminRefreshTokenPlugin || adminRefreshTokenPlugin
  const admin = options.adminMiddleware || adminMiddleware({response: responsePlugin({ defaultServiceName: 'PASSKEY' })})
  const audit = options.auditMiddleware || auditMiddleware()

  return new Elysia({ name: 'passkey-controller' })
    .use(adminAccessTokenJwt)
    .use(adminRefreshTokenJwt)
    .use(admin)
    .use(audit)
    .group('/api/auth/passkeys', (app) => 
      app
        .get(
          '/',
          async ({ user, set, responseTools, auditTools }) => {
            user = user!
            const result = await service.getUserPasskeys(user.id)
            
            if (!result.success) {
              set.status = 400
              return responseTools.generateErrorResponse(result.error!, '400', result.error)
            }
            
            return responseTools.generateResponse(
              result.passkeys,
              '200',
              'auth.passkeys_retrieved_successfully'
            )
          },
          {
            response: {
              200: PasskeyListSuccessResponseDto,
              400: PasskeyListErrorResponseDto,
            },
            needAuth: true,
            detail: {
              tags: ['Passkey'],
              summary: 'Get User Passkeys',
              description: 'Retrieve all passkeys associated with the authenticated user'
            }
          }
        )
        // Delete a passkey (requires auth)
        .delete(
          '/:id',
          async ({ user, params, set, responseTools, auditTools }) => {
            user = user!
            const { id } = params
            
            // Get the existing passkey to log the old data
            const existingPasskeysResult = await service.getUserPasskeys(user.id)
            const existingPasskey = existingPasskeysResult.passkeys?.find(p => p.id === id) || null
            
            const result = await service.deletePasskey(user.id, id)
            
            if (!result.success) {
              set.status = 400
              // Log failed deletion - this is a crucial action worth tracking
              auditTools.recordStartAction('passkey.delete.failed')
              auditTools.recordChange('passkeys', 
                null,
                { user_id: user.id, passkey_id: id, success: false, reason: result.error }
              )
              return responseTools.generateErrorResponse(result.error!, '400', result.error)
            }
            
            // Log successful deletion - this is a crucial action worth tracking
            auditTools.recordStartAction('passkey.delete.success')
            auditTools.recordChange('passkeys', 
              existingPasskey,
              { user_id: user.id, passkey_id: id, success: true }
            )
            
            return responseTools.generateResponse(
              { success: true },
              '200',
              'auth.passkey_deleted_successfully'
            )
          },
          {
            response: {
              200: PasskeyDeleteSuccessResponseDto,
              400: PasskeyDeleteErrorResponseDto,
            },
            needAuth: true,
            detail: {
              tags: ['Passkey'],
              summary: 'Delete Passkey',
              description: 'Delete a passkey associated with the authenticated user'
            }
          }
        )
    )
    .group('/api/auth/passkey', (app) =>
      app
        // Add audit middleware to the second group too
        .use(audit)
        // Start passkey authentication with email (no auth required)
        .post(
          '/login',
          async ({ body, set, responseTools, auditTools }) => {
            const { email, uuid } = body
            
            const authenticationOptions = await service.generateAuthenticationOptions({ email, uuid })
            
            if (!authenticationOptions.success) {
              set.status = 400
              return responseTools.generateErrorResponse(authenticationOptions.error!, '400', authenticationOptions.error)
            }
            
            return responseTools.generateResponse(
              { options: authenticationOptions.options! },
              '200',
              'auth.authentication_options_generated_successfully'
            )
          },
          {
            body: PasskeyAuthenticationStartDto,
            response: {
              200: PasskeyOptionsSuccessResponseDto,
              400: PasskeyOptionsErrorResponseDto,
            },
            detail: {
              tags: ['Passkey'],
              summary: 'Start Passkey Authentication',
              description: 'Generate options for authenticating with a passkey'
            }
          }
        )
        // Start passwordless passkey authentication (no auth required, no email)
        .post(
          '/login/passwordless',
          async ({ body, set, responseTools, auditTools }) => {
            const { uuid } = body
            const authenticationOptions = await service.generatePasswordlessAuthenticationOptions(uuid)
            
            if (!authenticationOptions.success) {
              set.status = 400
              return responseTools.generateErrorResponse(authenticationOptions.error!, '400', authenticationOptions.error)
            }
            
            return responseTools.generateResponse(
              { options: authenticationOptions.options! },
              '200',
              'auth.passwordless_authentication_options_generated_successfully'
            )
          },
          {
            body: PasswordlessAuthenticationStartDto,
            response: {
              200: PasskeyOptionsSuccessResponseDto,
              400: PasskeyOptionsErrorResponseDto,
            },
            detail: {
              tags: ['Passkey'],
              summary: 'Start Passwordless Passkey Authentication',
              description: 'Generate options for passwordless passkey authentication (no email required)'
            }
          }
        )
        // Finish passkey authentication (no auth required)
        .post(
          '/login/finish',
          async ({ body, adminAccessToken, adminRefreshToken, set, responseTools, auditTools }) => {
            const { response, uuid } = body
            // Pass empty user ID for passwordless authentication, as the passkey ID will identify the user
            const verification = await service.verifyAuthenticationResponse('', response, uuid)
            
            if (!verification.success) {
              set.status = 401
              // Log failed authentication finish - this is a crucial auth event worth tracking
              auditTools.recordStartAction('passkey.auth.finish.failed')
              auditTools.recordChange('', 
                null,
                { uuid: uuid, success: false, reason: verification.error }
              )
              return responseTools.generateErrorResponse(verification.error!, '401', verification.error)
            }
            
            // Get user data for token generation using the userId returned from verification
            const prisma = new PrismaClient()
            const user = await prisma.admin.findUnique({
              where: { id: verification.userId! },
              include: { role: true },
            })
            
            if (!user) {
              set.status = 401
              // Log failed authentication due to user not found - this is a crucial auth event worth tracking
              auditTools.recordStartAction('passkey.auth.finish.failed')
              auditTools.recordChange('', 
                null,
                { uuid: uuid, user_id: verification.userId, success: false, reason: 'User not found' }
              )
              return responseTools.generateErrorResponse('auth.user_not_found_error', '401', 'auth.user_not_found_error')
            }
            
            // Generate access token with user profile and permissions
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
            
            // Log successful authentication finish with token generation - this is a crucial auth event worth tracking
            auditTools.recordStartAction('passkey.auth.finish.success')
            auditTools.recordChange('', 
              null,
              { 
                uuid: uuid, 
                user_id: user.id, 
                email: user.email, 
                success: true 
              }
            )
            
            return responseTools.generateResponse({
              access_token: accessTokenValue,
              refresh_token: refreshTokenValue
            }, '200', 'auth.login_successful')
          },
          {
            body: PasskeyAuthenticationFinishDto,
            response: {
              200: PasskeyAuthenticationSuccessResponseDto,
              401: PasskeyAuthenticationErrorResponseDto,
            },
            detail: {
              tags: ['Passkey'],
              summary: 'Finish Passkey Authentication',
              description: 'Verify authentication response and generate tokens'
            }
          }
        )
        // Start passkey registration (requires auth)
        .post(
          '/register',
          async ({ user, body, set, responseTools, auditTools }) => {
            const { email, name, uuid } = body
            user = user!
            
            // Verify the email matches the authenticated user
            if (user.email !== email) {
              set.status = 403
              return responseTools.generateErrorResponse('auth.email_does_not_match_authenticated_user', '403', 'auth.email_does_not_match_authenticated_user')
            }
            
            const registrationOptions = await service.generateRegistrationOptions({
              userId: user.id,
              email: user.email,
              name: user.name,
              passKeyName: name,
              uuid
            })
            
            if (!registrationOptions.success) {
              set.status = 400
              return responseTools.generateErrorResponse(registrationOptions.error!, '400', registrationOptions.error)
            }
            
            return responseTools.generateResponse(
              { options: registrationOptions.options! },
              '200',
              'auth.registration_options_generated_successfully'
            )
          },
          {
            body: PasskeyRegistrationStartDto,
            response: {
              200: PasskeyOptionsSuccessResponseDto,
              400: PasskeyOptionsErrorResponseDto,
              403: PasskeyOptionsErrorResponseDto,
            },
            needAuth: true,
            detail: {
              tags: ['Passkey'],
              summary: 'Start Passkey Registration',
              description: 'Generate options for registering a new passkey (requires authentication)'
            }
          }
        )
        // Finish passkey registration (requires auth)
        .post(
          '/register/finish',
          async ({ user, body, set, responseTools, adminAccessToken, auditTools }) => {
            user = user!
            const { response, uuid } = body
            const verification = await service.verifyRegistrationResponse(user.id, response, uuid)
            
            if (!verification.success) {
              set.status = 400
              // Log failed registration finish - this is a crucial create operation worth tracking
              auditTools.recordStartAction('passkey.register.finish.failed')
              auditTools.recordChange('', 
                null,
                { user_id: user.id, uuid: uuid, success: false, reason: verification.error }
              )
              return responseTools.generateErrorResponse(verification.error!, '400', verification.error)
            }
            
            // Log successful registration finish (this is a create operation) - this is a crucial action worth tracking
            auditTools.recordStartAction('passkey.register.finish.success')
            auditTools.recordChange('passkeys', 
              null,
              { user_id: user.id, uuid: uuid, success: true }
            )
            
            return responseTools.generateResponse(
              { success: true },
              '200',
              'auth.passkey_registered_successfully'
            )
          },
          {
            body: PasskeyRegistrationFinishDto,
            response: {
              200: PasskeyRegistrationSuccessResponseDto,
              400: PasskeyRegistrationErrorResponseDto,
            },
            needAuth: true,
            detail: {
              tags: ['Passkey'],
              summary: 'Finish Passkey Registration',
              description: 'Verify and store a new passkey (requires authentication)'
            }
          }
        )
    )
}

export const passkeyController = createPasskeyController()