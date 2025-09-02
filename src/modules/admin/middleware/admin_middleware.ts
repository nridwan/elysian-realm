import Elysia from 'elysia'
import { UserContext } from '../../auth/middleware/auth_middleware'

export const adminMiddleware = (app: Elysia) =>
  app.guard({
    beforeHandle: ({ user, set }: UserContext & { set: any }) => {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
      if (user.role.name !== 'admin' && user.role.name !== 'superadmin') {
        set.status = 403
        return { error: 'Forbidden' }
      }
    },
  })