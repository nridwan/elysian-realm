import { Elysia } from 'elysia'
import { authController } from './auth/controller/auth_controller'
import { adminController } from './admin/controller/admin_controller'
import { passkeyController } from './auth/controller/passkey_controller'

export const loadModules = (app: Elysia) => {
  return app
    .use(authController)
    .use(adminController)
    .use(passkeyController)
}