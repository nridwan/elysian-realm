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
        // Admin management
        .get(
          '/admins',
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
            }, '200', 'Admins retrieved successfully')
          },
          {
            query: dto.AdminPaginationQueryDto,
            response: dto.AdminUsersResponseDto,
            hasPermission: 'admins.read',
            detail: {
              tags: ['Admin'],
              summary: 'Get Admins',
              description: 'Retrieve a paginated list of admins',
              security: [{ jwt: [] }]
            }
          }
        )
        .get(
          '/admins/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const user = await service.getUserById(id)

            if (!user) {
              return responseTools.generateErrorResponse('Admin not found', '404', 'Admin not found')
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
            }, '200', 'Admin retrieved successfully')
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'admins.read',
            detail: {
              tags: ['Admin'],
              summary: 'Get Admin by ID',
              description: 'Retrieve a specific admin by their ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .put(
          '/admins/:id',
          async ({ params, body, responseTools }) => {
            const { id } = params
            const user = await service.updateUser(id, body)

            if (!user) {
              return responseTools.generateErrorResponse('Failed to update admin', '400', 'Failed to update admin')
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
            }, '200', 'Admin updated successfully')
          },
          {
            params: dto.IdParamDto,
            body: dto.UpdateUserRequestDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'admins.update',
            detail: {
              tags: ['Admin'],
              summary: 'Update Admin',
              description: 'Update an admin by their ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .post(
          '/admins',
          async ({ body, responseTools }) => {
            const user = await service.createUser(body)

            if (!user) {
              return responseTools.generateErrorResponse('Failed to create admin', '400', 'Failed to create admin')
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
            }, '200', 'Admin created successfully')
          },
          {
            body: dto.CreateUserRequestDto,
            response: dto.AdminUserResponseDto,
            hasPermission: 'admins.create',
            detail: {
              tags: ['Admin'],
              summary: 'Create Admin',
              description: 'Create a new admin',
              security: [{ jwt: [] }]
            }
          }
        )
        .delete(
          '/admins/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const success = await service.deleteUser(id)

            if (!success) {
              return responseTools.generateErrorResponse('Failed to delete admin', '400', 'Failed to delete admin')
            }

            return responseTools.generateResponse({}, '200', 'Admin deleted successfully')
          },
          {
            params: dto.IdParamDto,
            response: dto.AdminSuccessResponseDto,
            hasPermission: 'admins.delete',
            detail: {
              tags: ['Admin'],
              summary: 'Delete Admin',
              description: 'Delete an admin by their ID',
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