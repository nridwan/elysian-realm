import Elysia, { t } from 'elysia'
import * as dto from '../dto/admin_dto'
import { authMiddleware } from '../../auth/middleware/auth_middleware'
import { adminMiddleware } from '../middleware/admin_middleware'
import { adminService } from '../services/admin_service_factory'
import { AdminService } from '../services/admin_service'

interface AdminControllerOptions {
  service?: AdminService
  authMiddleware?: typeof authMiddleware
  adminMiddleware?: typeof adminMiddleware
}

export const createAdminController = (options: AdminControllerOptions = {}) => {
  const service = options.service || adminService
  const auth = options.authMiddleware || authMiddleware
  const admin = options.adminMiddleware || adminMiddleware

  return new Elysia({ name: 'admin-controller' })
    .use(auth)
    .use(admin)
    .group('/api/admin', (app) =>
      app
        // User management
        .get(
          '/users',
          async ({ query }) => {
            const { page = '1', limit = '10' } = query
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            return await service.getUsers(pageNum, limitNum)
          },
          {
            query: dto.PaginationQueryDto,
            response: dto.UsersResponseDto,
          }
        )
        .get(
          '/users/:id',
          async ({ params }) => {
            const { id } = params
            const user = await service.getUserById(id)

            if (!user) {
              return { error: 'User not found' }
            }

            return { user }
          },
          {
            params: dto.IdParamDto,
            response: t.Union([dto.UserResponseDto, dto.ErrorResponseDto]),
          }
        )
        .put(
          '/users/:id',
          async ({ params, body }) => {
            const { id } = params
            const user = await service.updateUser(id, body)

            if (!user) {
              return { error: 'Failed to update user' }
            }

            return { user }
          },
          {
            params: dto.IdParamDto,
            body: t.Partial(
              t.Object({
                name: t.String(),
                email: t.String(),
                roleId: t.String(),
              })
            ),
            response: t.Union([dto.UserResponseDto, dto.ErrorResponseDto]),
          }
        )
        .delete(
          '/users/:id',
          async ({ params }) => {
            const { id } = params
            const success = await service.deleteUser(id)

            if (!success) {
              return { error: 'Failed to delete user' }
            }

            return { message: 'User deleted successfully' }
          },
          {
            params: dto.IdParamDto,
            response: t.Union([dto.SuccessResponseDto, dto.ErrorResponseDto]),
          }
        )
        // Role management
        .get(
          '/roles',
          async () => {
            const roles = await service.getRoles()
            return { roles }
          },
          {
            response: dto.RolesResponseDto,
          }
        )
        .post(
          '/roles',
          async ({ body }) => {
            const role = await service.createRole(body)

            if (!role) {
              return { error: 'Failed to create role' }
            }

            return { role }
          },
          {
            body: t.Object({
              name: t.String(),
              description: t.Optional(t.String()),
            }),
            response: t.Union([dto.RoleResponseDto, dto.ErrorResponseDto]),
          }
        )
        .put(
          '/roles/:id',
          async ({ params, body }) => {
            const { id } = params
            const role = await service.updateRole(id, body)

            if (!role) {
              return { error: 'Failed to update role' }
            }

            return { role }
          },
          {
            params: dto.IdParamDto,
            body: t.Partial(
              t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
              })
            ),
            response: t.Union([dto.RoleResponseDto, dto.ErrorResponseDto]),
          }
        )
        .delete(
          '/roles/:id',
          async ({ params }) => {
            const { id } = params
            const success = await service.deleteRole(id)

            if (!success) {
              return { error: 'Failed to delete role' }
            }

            return { message: 'Role deleted successfully' }
          },
          {
            params: dto.IdParamDto,
            response: t.Union([dto.SuccessResponseDto, dto.ErrorResponseDto]),
          }
        )
        // Permission management
        .get(
          '/permissions',
          async () => {
            const permissions = await service.getPermissions()
            return { permissions }
          },
          {
            response: dto.PermissionsResponseDto,
          }
        )
        .post(
          '/permissions',
          async ({ body }) => {
            const permission = await service.createPermission(body)

            if (!permission) {
              return { error: 'Failed to create permission' }
            }

            return { permission }
          },
          {
            body: t.Object({
              name: t.String(),
              description: t.Optional(t.String()),
            }),
            response: t.Union([dto.PermissionResponseDto, dto.ErrorResponseDto]),
          }
        )
    )
}

export const adminController = createAdminController()