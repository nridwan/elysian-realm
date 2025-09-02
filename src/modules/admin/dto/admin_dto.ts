import { t } from 'elysia'
import { BaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

// User DTOs
export const UserDto = t.Object({
  id: t.String({
    description: 'Unique identifier for the user',
    examples: ['user_123456']
  }),
  email: t.String({
    description: 'User email address',
    examples: ['user@example.com']
  }),
  name: t.String({
    description: 'User full name',
    examples: ['John Doe']
  }),
  role_id: t.String({
    description: 'Identifier of the role assigned to the user',
    examples: ['role_admin']
  }),
  role: t.Object({
    id: t.String({
      description: 'Unique identifier for the role',
      examples: ['role_admin']
    }),
    name: t.String({
      description: 'Role name',
      examples: ['Administrator']
    }),
    description: t.Union([t.String({
      description: 'Role description',
      examples: ['Full system access']
    }), t.Null()]),
  }, {
    description: 'Role information assigned to the user'
  }),
}, {
  description: 'User data structure'
})

export const UsersResponseDataDto = t.Object({
  page: t.Number({
    description: 'Current page number',
    examples: [1]
  }),
  limit: t.Number({
    description: 'Number of items per page',
    examples: [10]
  }),
  total: t.Number({
    description: 'Total number of users',
    examples: [100]
  }),
  pages: t.Number({
    description: 'Total number of pages',
    examples: [10]
  }),
  data: t.Array(UserDto, {
    description: 'Array of users for the current page'
  }),
}, {
  description: 'Paginated user response data'
})

// Role DTOs
export const RoleDto = t.Object({
  id: t.String({
    description: 'Unique identifier for the role',
    examples: ['role_admin']
  }),
  name: t.String({
    description: 'Role name',
    examples: ['Administrator']
  }),
  description: t.Union([t.String({
    description: 'Role description',
    examples: ['Full system access']
  }), t.Null()]),
  permissions: t.Optional(t.Array(t.String({
    description: 'Array of permissions assigned to the role',
    examples: ['users.read', 'users.create']
  })), {
    description: 'Optional array of permissions'
  }),
}, {
  description: 'Role data structure'
})

export const RolesResponseDataDto = t.Object({
  roles: t.Array(RoleDto, {
    description: 'Array of all roles'
  }),
}, {
  description: 'Roles response data'
})

export const UserResponseDataDto = t.Object({
  user: UserDto,
}, {
  description: 'Single user response data'
})

export const RoleResponseDataDto = t.Object({
  role: RoleDto,
}, {
  description: 'Single role response data'
})

// Available Permissions DTO
export const AvailablePermissionsResponseDataDto = t.Object({
  permissions: t.Record(t.String({
    description: 'Category name',
    examples: ['users', 'roles']
  }), t.Array(t.String({
    description: 'Permission name',
    examples: ['read', 'create', 'update', 'delete']
  })), {
    description: 'Record of permission categories and their available actions'
  }),
}, {
  description: 'Available permissions response data'
})

// Admin Response DTOs - using union types to handle both success and error cases
export const AdminUsersResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([UsersResponseDataDto, t.Null()], {
    description: 'Paginated user data or null if request failed'
  }),
})

export const AdminUserResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([UserResponseDataDto, t.Null()], {
    description: 'User data or null if request failed'
  }),
})

export const AdminRolesResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([RolesResponseDataDto, t.Null()], {
    description: 'Roles data or null if request failed'
  }),
})

export const AdminRoleResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([RoleResponseDataDto, t.Null()], {
    description: 'Role data or null if request failed'
  }),
})

export const AdminAvailablePermissionsResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([AvailablePermissionsResponseDataDto, t.Null()], {
    description: 'Available permissions data or null if request failed'
  }),
})

export const AdminSuccessResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([t.Object({}), t.Null()], {
    description: 'Empty object for successful operations or null if failed'
  }),
})

export const AdminErrorResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Null(),
})

// Query and param DTOs
export const AdminPaginationQueryDto = PaginationQueryDto

export const IdParamDto = t.Object({
  id: t.String({
    description: 'Unique identifier',
    examples: ['user_123456', 'role_admin']
  }),
})