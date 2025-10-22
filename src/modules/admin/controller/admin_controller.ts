import Elysia, { t } from 'elysia'
import * as dto from '../dto/admin_dto'
import { adminMiddleware } from '../middleware/admin_middleware'
import { adminService } from '../services/admin_service_factory'
import { AdminService } from '../services/admin_service'
import { responsePlugin } from '../../../plugins/response_plugin'
import { auditMiddleware } from '../../audit/middleware/audit_middleware'

interface AdminControllerOptions {
  service?: AdminService
  adminMiddleware?: ReturnType<typeof adminMiddleware>
  auditMiddleware?: ReturnType<typeof auditMiddleware>
}

export const createAdminController = (options: AdminControllerOptions = {}) => {
  const service = options.service || adminService
  const admin = options.adminMiddleware || adminMiddleware()
  const audit = options.auditMiddleware || auditMiddleware()

  return new Elysia({ name: 'admin-controller' })
    .use(responsePlugin({ defaultServiceName: 'ADMIN' }))
    .group('/api/admin', (app) =>
      app
        .use(admin)
        .use(audit)
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
          async ({ params, body, responseTools, user, auditTools }) => {
            const { id } = params
            // Get the current user data to capture old data for audit trail
            const existingUser = await service.getUserById(id)
            
            const updatedUser = await service.updateUser(id, body)

            if (!updatedUser) {
              return responseTools.generateErrorResponse('Failed to update admin', '400', 'Failed to update admin')
            }

            // Log the update action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'admin.update',
                entity_type: 'admin',
                entity_id: id,
                old_data: existingUser ? {
                  email: existingUser.email,
                  name: existingUser.name,
                  role_id: existingUser.role_id
                } : null,
                new_data: {
                  email: updatedUser.email,
                  name: updatedUser.name,
                  role_id: updatedUser.role_id
                }
              })
            }

            return responseTools.generateResponse({
              user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role_id: updatedUser.role_id,
                role: {
                  id: updatedUser.role.id,
                  name: updatedUser.role.name,
                  description: updatedUser.role.description,
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
          async ({ body, responseTools, user, auditTools }) => {
            const createdUser = await service.createUser(body)

            if (!createdUser) {
              return responseTools.generateErrorResponse('Failed to create admin', '400', 'Failed to create admin')
            }

            // Log the create action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'admin.create',
                entity_type: 'admin',
                entity_id: createdUser.id,
                old_data: null,
                new_data: {
                  email: createdUser.email,
                  name: createdUser.name,
                  role_id: createdUser.role_id
                }
              })
            }

            return responseTools.generateResponse({
              user: {
                id: createdUser.id,
                email: createdUser.email,
                name: createdUser.name,
                role_id: createdUser.role_id,
                role: {
                  id: createdUser.role.id,
                  name: createdUser.role.name,
                  description: createdUser.role.description,
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
          async ({ params, responseTools, user, auditTools }) => {
            const { id } = params
            // Get the current user data to capture old data for audit trail
            const existingUser = await service.getUserById(id)
            
            const success = await service.deleteUser(id)

            if (!success) {
              return responseTools.generateErrorResponse('Failed to delete admin', '400', 'Failed to delete admin')
            }

            // Log the delete action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'admin.delete',
                entity_type: 'admin',
                entity_id: id,
                old_data: existingUser ? {
                  email: existingUser.email,
                  name: existingUser.name,
                  role_id: existingUser.role_id
                } : null,
                new_data: null
              })
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
          async ({ body, responseTools, user, auditTools }) => {
            const createdRole = await service.createRole(body)

            if (!createdRole) {
              return responseTools.generateErrorResponse('Failed to create role', '400', 'Failed to create role')
            }

            // Log the create action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'role.create',
                entity_type: 'role',
                entity_id: createdRole.id,
                old_data: null,
                new_data: {
                  name: createdRole.name,
                  description: createdRole.description,
                  permissions: createdRole.permissions
                }
              })
            }

            return responseTools.generateResponse({
              role: {
                id: createdRole.id,
                name: createdRole.name,
                description: createdRole.description,
                permissions: createdRole.permissions
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
          async ({ params, body, responseTools, user, auditTools }) => {
            const { id } = params
            // Get the current role data to capture old data for audit trail
            const existingRole = await service.getRoles().then(roles => roles.find(r => r.id === id))
            
            const updatedRole = await service.updateRole(id, body)

            if (!updatedRole) {
              return responseTools.generateErrorResponse('Failed to update role', '400', 'Failed to update role')
            }

            // Log the update action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'role.update',
                entity_type: 'role',
                entity_id: id,
                old_data: existingRole ? {
                  name: existingRole.name,
                  description: existingRole.description,
                  permissions: existingRole.permissions
                } : null,
                new_data: {
                  name: updatedRole.name,
                  description: updatedRole.description,
                  permissions: updatedRole.permissions
                }
              })
            }

            return responseTools.generateResponse({
              role: {
                id: updatedRole.id,
                name: updatedRole.name,
                description: updatedRole.description,
                permissions: updatedRole.permissions
              }
            }, '200', 'Role updated successfully')
          },
          {
            params: dto.IdParamDto,
            body: dto.UpdateRoleRequestDto,
            response: dto.AdminRoleResponseDto,
            hasPermission: 'roles.update',
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
          async ({ params, responseTools, user, auditTools }) => {
            const { id } = params
            // Get the current role data to capture old data for audit trail
            const existingRole = await service.getRoles().then(roles => roles.find(r => r.id === id))
            
            const success = await service.deleteRole(id)

            if (!success) {
              return responseTools.generateErrorResponse('Failed to delete role', '400', 'Failed to delete role')
            }

            // Log the delete action in audit trail
            if (auditTools) {
              auditTools.addAction({
                user_id: user?.id,
                action: 'role.delete',
                entity_type: 'role',
                entity_id: id,
                old_data: existingRole ? {
                  name: existingRole.name,
                  description: existingRole.description,
                  permissions: existingRole.permissions
                } : null,
                new_data: null
              })
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