import Elysia, { t } from 'elysia'
import * as dto from '../dto/admin_dto'
import { adminMiddleware } from '../middleware/admin_middleware'
import { adminService } from '../services/admin_service_factory'
import { AdminService } from '../services/admin_service'
import { responsePlugin } from '../../../plugins/response_plugin'

interface AdminControllerOptions {
  service?: AdminService
  adminMiddleware?: ReturnType<typeof adminMiddleware>
}

export const createAdminController = (options: AdminControllerOptions = {}) => {
  const service = options.service || adminService
  const admin = options.adminMiddleware || adminMiddleware()

  return new Elysia({ name: 'admin-controller' })
    .use(responsePlugin({ defaultServiceName: 'ADMIN' }))
    .group('/api/admin', (app) =>
      app
        .use(admin)
        // User management
        .get(
          '/users',
          async ({ query, responseTools }) => {
            const { page = '1', limit = '10' } = query
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            const result = await service.getUsers(pageNum, limitNum)
            
            return responseTools.generateResponse({
              page: result.pagination.page,
              limit: result.pagination.limit,
              total: result.pagination.total,
              pages: result.pagination.pages,
              data: result.users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                role_id: user.role_id,
                role: {
                  id: user.role.id,
                  name: user.role.name,
                  description: user.role.description,
                }
              }))
            }, '200', 'Users retrieved successfully')
          },
          {
            query: dto.AdminPaginationQueryDto,
            response: dto.AdminUsersResponseDto,
            hasPermission: 'users.read',
            detail: {
              tags: ['Admin'],
              summary: 'Get Users',
              description: 'Retrieve a paginated list of users',
              security: [{ jwt: [] }]
            }
          }
        )
        .get(
          '/users/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const user = await service.getUserById(id)

            if (!user) {
              return responseTools.generateErrorResponse('User not found', '404', 'User not found')
            }

            return responseTools.generateResponse({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role_id: user.role_id,
                role: {
                  id: user.role.id,
                  name: user.role.name,
                  description: user.role.description,
                }
              }
            }, '200', 'User retrieved successfully')
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'users.read',
            detail: {
              tags: ['Admin'],
              summary: 'Get User by ID',
              description: 'Retrieve a specific user by their ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .put(
          '/users/:id',
          async ({ params, body, responseTools }) => {
            const { id } = params
            const user = await service.updateUser(id, body)

            if (!user) {
              return responseTools.generateErrorResponse('Failed to update user', '400', 'Failed to update user')
            }

            return responseTools.generateResponse({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role_id: user.role_id,
                role: {
                  id: user.role.id,
                  name: user.role.name,
                  description: user.role.description,
                }
              }
            }, '200', 'User updated successfully')
          },
          {
            params: dto.IdParamDto,
            body: dto.UpdateUserRequestDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'users.update',
            detail: {
              tags: ['Admin'],
              summary: 'Update User',
              description: 'Update a user by their ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .post(
          '/users',
          async ({ body, responseTools }) => {
            const user = await service.createUser(body)

            if (!user) {
              return responseTools.generateErrorResponse('Failed to create user', '400', 'Failed to create user')
            }

            return responseTools.generateResponse({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role_id: user.role_id,
                role: {
                  id: user.role.id,
                  name: user.role.name,
                  description: user.role.description,
                }
              }
            }, '200', 'User created successfully')
          },
          {
            body: dto.CreateUserRequestDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'users.create',
            detail: {
              tags: ['Admin'],
              summary: 'Create User',
              description: 'Create a new user',
              security: [{ jwt: [] }]
            }
          }
        )
        .delete(
          '/users/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const success = await service.deleteUser(id)

            if (!success) {
              return responseTools.generateErrorResponse('Failed to delete user', '400', 'Failed to delete user')
            }

            return responseTools.generateResponse({}, '200', 'User deleted successfully')
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminSuccessResponseDto,
            hasPermission: 'users.delete',
            detail: {
              tags: ['Admin'],
              summary: 'Delete User',
              description: 'Delete a user by their ID',
              security: [{ jwt: [] }]
            }
          }
        )
        // Role management
        .get(
          '/roles',
          async ({ responseTools }) => {
            const roles = await service.getRoles()
            
            return responseTools.generateResponse({
              roles: roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions
              }))
            }, '200', 'Roles retrieved successfully')
          },
          {
            response: dto.AdminRolesResponseDto,
            hasPermission: 'roles.read',
            detail: {
              tags: ['Admin'],
              summary: 'Get Roles',
              description: 'Retrieve all roles',
              security: [{ jwt: [] }]
            }
          }
        )
        .post(
          '/roles',
          async ({ body, responseTools }) => {
            const role = await service.createRole(body)

            if (!role) {
              return responseTools.generateErrorResponse('Failed to create role', '400', 'Failed to create role')
            }

            return responseTools.generateResponse({
              role: {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions
              }
            }, '200', 'Role created successfully')
          },
          {
            body: dto.CreateRoleRequestDto,
            response: dto.AdminRoleResponseDto,
            hasPermission: 'roles.create',
            detail: {
              tags: ['Admin'],
              summary: 'Create Role',
              description: 'Create a new role',
              security: [{ jwt: [] }]
            }
          }
        )
        .put(
          '/roles/:id',
          async ({ params, body, responseTools }) => {
            const { id } = params
            const role = await service.updateRole(id, body)

            if (!role) {
              return responseTools.generateErrorResponse('Failed to update role', '400', 'Failed to update role')
            }

            return responseTools.generateResponse({
              role: {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions
              }
            }, '200', 'Role updated successfully')
          },
          {
            params: dto.IdParamDto,
            body: dto.UpdateRoleRequestDto,
            response: dto.AdminRoleResponseDto,
            hasPermission: 'roles.read',
            detail: {
              tags: ['Admin'],
              summary: 'Update Role',
              description: 'Update a role by its ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .delete(
          '/roles/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const success = await service.deleteRole(id)

            if (!success) {
              return responseTools.generateErrorResponse('Failed to delete role', '400', 'Failed to delete role')
            }

            return responseTools.generateResponse({}, '200', 'Role deleted successfully')
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminSuccessResponseDto,
            hasPermission: 'roles.delete',
            detail: {
              tags: ['Admin'],
              summary: 'Delete Role',
              description: 'Delete a role by its ID',
              security: [{ jwt: [] }]
            }
          }
        )
        // Available permissions
        .get(
          '/permissions/available',
          async ({ responseTools }) => {
            const permissions = service.getAllAvailablePermissions()
            
            return responseTools.generateResponse({ permissions }, '200', 'Permissions retrieved successfully')
          },
          {
            response: dto.AdminAvailablePermissionsResponseDto,
            detail: {
              tags: ['Admin'],
              summary: 'Get Available Permissions',
              description: 'Retrieve all available permissions',
              security: [{ jwt: [] }]
            }
          }
        )
    )
}

export const adminController = createAdminController()