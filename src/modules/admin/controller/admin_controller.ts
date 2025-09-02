import Elysia, { t } from 'elysia'
import * as dto from '../dto/admin_dto'
import { adminMiddleware } from '../middleware/admin_middleware'
import { adminService } from '../services/admin_service_factory'
import { AdminService } from '../services/admin_service'

interface AdminControllerOptions {
  service?: AdminService
  adminMiddleware?: ReturnType<typeof adminMiddleware>
}

export const createAdminController = (options: AdminControllerOptions = {}) => {
  const service = options.service || adminService
  const admin = options.adminMiddleware || adminMiddleware()

  return new Elysia({ name: 'admin-controller' })
    .group('/api/admin', (app) =>
      app
        .use(admin)
        // User management
        .get(
          '/users',
          async ({ query }) => {
            const { page = '1', limit = '10' } = query
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            const result = await service.getUsers(pageNum, limitNum)
            
            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Users retrieved successfully',
              },
              data: {
                page: result.pagination.page,
                limit: result.pagination.limit,
                total: result.pagination.total,
                pages: result.pagination.pages,
                data: result.users.map(user => ({
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role_id: user.roleId,
                  role: {
                    id: user.role.id,
                    name: user.role.name,
                    description: user.role.description,
                  }
                }))
              }
            }
          },
          {
            query: dto.AdminPaginationQueryDto,
            response: dto.AdminUsersResponseDto,
            hasPermission: 'users.read'
          }
        )
        .get(
          '/users/:id',
          async ({ params }) => {
            const { id } = params
            const user = await service.getUserById(id)

            if (!user) {
              return {
                meta: {
                  code: 'ADMIN-404',
                  message: 'User not found',
                },
                data: null
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'User retrieved successfully',
              },
              data: {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role_id: user.roleId,
                  role: {
                    id: user.role.id,
                    name: user.role.name,
                    description: user.role.description,
                  }
                }
              }
            }
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'users.read'
          }
        )
        .put(
          '/users/:id',
          async ({ params, body }) => {
            const { id } = params
            const user = await service.updateUser(id, body)

            if (!user) {
              return {
                meta: {
                  code: 'ADMIN-400',
                  message: 'Failed to update user',
                },
                data: null
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'User updated successfully',
              },
              data: {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role_id: user.roleId,
                  role: {
                    id: user.role.id,
                    name: user.role.name,
                    description: user.role.description,
                  }
                }
              }
            }
          },
          {
            params: dto.IdParamDto,
            body: t.Partial(
              t.Object({
                name: t.String(),
                email: t.String(),
                role_id: t.String(),
              })
            ),
            response: dto.AdminUserResponseDto,
            hasPermission: 'users.update'
          }
        )
        .delete(
          '/users/:id',
          async ({ params }) => {
            const { id } = params
            const success = await service.deleteUser(id)

            if (!success) {
              return {
                meta: {
                  code: 'ADMIN-400',
                  message: 'Failed to delete user',
                },
                data: {}
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'User deleted successfully',
              },
              data: {}
            }
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminSuccessResponseDto,
            hasPermission: 'users.delete'
          }
        )
        // Role management
        .get(
          '/roles',
          async () => {
            const roles = await service.getRoles()
            
            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Roles retrieved successfully',
              },
              data: {
                roles: roles.map(role => ({
                  id: role.id,
                  name: role.name,
                  description: role.description,
                  permissions: role.permissions
                }))
              }
            }
          },
          {
            response: dto.AdminRolesResponseDto,
            hasPermission: 'roles.read'
          }
        )
        .post(
          '/roles',
          async ({ body }) => {
            const role = await service.createRole(body)

            if (!role) {
              return {
                meta: {
                  code: 'ADMIN-400',
                  message: 'Failed to create role',
                },
                data: null
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Role created successfully',
              },
              data: {
                role: {
                  id: role.id,
                  name: role.name,
                  description: role.description,
                  permissions: role.permissions
                }
              }
            }
          },
          {
            body: t.Object({
              name: t.String(),
              description: t.Optional(t.String()),
              permissions: t.Optional(t.Array(t.String())),
            }),
            response: dto.AdminRoleResponseDto,
            hasPermission: 'roles.create'
          }
        )
        .put(
          '/roles/:id',
          async ({ params, body }) => {
            const { id } = params
            const role = await service.updateRole(id, body)

            if (!role) {
              return {
                meta: {
                  code: 'ADMIN-400',
                  message: 'Failed to update role',
                },
                data: null
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Role updated successfully',
              },
              data: {
                role: {
                  id: role.id,
                  name: role.name,
                  description: role.description,
                  permissions: role.permissions
                }
              }
            }
          },
          {
            params: dto.IdParamDto,
            body: t.Partial(
              t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
                permissions: t.Optional(t.Array(t.String())),
              })
            ),
            response: dto.AdminRoleResponseDto,
            hasPermission: 'roles.read'
          }
        )
        .delete(
          '/roles/:id',
          async ({ params }) => {
            const { id } = params
            const success = await service.deleteRole(id)

            if (!success) {
              return {
                meta: {
                  code: 'ADMIN-400',
                  message: 'Failed to delete role',
                },
                data: {}
              }
            }

            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Role deleted successfully',
              },
              data: {}
            }
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminSuccessResponseDto,
            hasPermission: 'roles.delete'
          }
        )
        // Available permissions
        .get(
          '/permissions/available',
          async () => {
            const permissions = service.getAllAvailablePermissions()
            
            return {
              meta: {
                code: 'ADMIN-200',
                message: 'Permissions retrieved successfully',
              },
              data: { permissions }
            }
          },
          {
            response: dto.AdminAvailablePermissionsResponseDto,
          }
        )
    )
}

export const adminController = createAdminController()