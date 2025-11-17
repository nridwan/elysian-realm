import { t } from 'elysia'
import { createBaseMetaDto } from '../../../dto/base.dto'

// User DTOs
export const UserDto = t.Object({
  id: t.String({
    description: 'Unique identifier for the user',
    examples: ['user_123456']
  }),
  email: t.String({
    description: 'User email address',
    examples: ['user@example.com'],
    minLength: 5,
    format: 'email',
  }),
  name: t.String({
    description: 'User full name',
    examples: ['John Doe'],
    minLength: 2,
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
      examples: ['Administrator'],
      minLength: 2,
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
    examples: ['Administrator'],
    minLength: 2,
  }),
  description: t.Union([t.String({
    description: 'Role description',
    examples: ['Full system access'],
    maxLength: 255,
  }), t.Null()]),
  permissions: t.Optional(t.Array(t.String({
    description: 'Array of permissions assigned to the role',
    examples: ['admins.read', 'admins.create'],
    minLength: 1,
  }), {
    description: 'Optional array of permissions'
  })),
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

// Admin Success Response DTOs
export const AdminUsersSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200'],
    messageExamples: ['Admins retrieved successfully']
  }),
  data: UsersResponseDataDto,
})

export const AdminUserSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200'],
    messageExamples: ['Admin retrieved successfully']
  }),
  data: UserResponseDataDto,
})

export const AdminRolesSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200'],
    messageExamples: ['Roles retrieved successfully']
  }),
  data: RolesResponseDataDto,
})

export const AdminRoleSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200'],
    messageExamples: ['Role retrieved successfully']
  }),
  data: RoleResponseDataDto,
})

export const AdminAvailablePermissionsSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200'],
    messageExamples: ['Available permissions retrieved successfully']
  }),
  data: AvailablePermissionsResponseDataDto,
})

export const AdminSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-200', 'ADMIN-201'],
    messageExamples: ['Admin created successfully', 'Admin updated successfully', 'Admin deleted successfully', 'Role created successfully', 'Role updated successfully', 'Role deleted successfully']
  }),
  data: t.Object({}),
})

// Admin Error Response DTOs
export const AdminUsersErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-404'],
    messageExamples: ['Admins not found'],
    errorExamples: [
      { field: 'page', messages: ['Page must be a positive integer'] },
      { field: 'limit', messages: ['Limit must be between 1 and 100'] }
    ]
  }),
  data: t.Null(),
})

export const AdminUserErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-404'],
    messageExamples: ['Admin not found'],
    errorExamples: [
      { field: 'id', messages: ['Admin ID not found'] }
    ]
  }),
  data: t.Optional(t.Null()),
})

export const AdminRolesErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-404'],
    messageExamples: ['Roles not found']
  }),
  data: t.Null(),
})

export const AdminRoleErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-404'],
    messageExamples: ['Role not found'],
    errorExamples: [
      { field: 'id', messages: ['Role ID not found'] }
    ]
  }),
  data: t.Null(),
})

export const AdminAvailablePermissionsErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-404'],
    messageExamples: ['Available permissions not found']
  }),
  data: t.Null(),
})

export const AdminCreateUserErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-500'],
    messageExamples: ['Failed to create admin', 'Admin creation failed'],
    errorExamples: [
      { field: 'email', messages: ['Email is required', 'Email must be valid', 'Email already exists'] },
      { field: 'name', messages: ['Name is required', 'Name must be at least 2 characters'] },
      { field: 'password', messages: ['Password is required', 'Password must be at least 8 characters'] },
      { field: 'role_id', messages: ['Role ID is required'] }
    ]
  }),
  data: t.Null(),
})

export const AdminUpdateUserErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-404'],
    messageExamples: ['Failed to update admin', 'Admin not found'],
    errorExamples: [
      { field: 'email', messages: ['Email must be valid', 'Email already exists'] },
      { field: 'name', messages: ['Name must be at least 2 characters'] },
      { field: 'role_id', messages: ['Role ID is required'] },
      { field: 'id', messages: ['Admin ID not found'] }
    ]
  }),
  data: t.Null(),
})

export const AdminDeleteUserErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-404'],
    messageExamples: ['Failed to delete admin', 'Admin not found'],
    errorExamples: [
      { field: 'id', messages: ['Admin ID not found'] }
    ]
  }),
  data: t.Null(),
})

export const AdminCreateRoleErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-500'],
    messageExamples: ['Failed to create role', 'Role creation failed'],
    errorExamples: [
      { field: 'name', messages: ['Role name is required', 'Role name must be at least 2 characters'] },
      { field: 'permissions', messages: ['Invalid permission format'] }
    ]
  }),
  data: t.Null(),
})

export const AdminUpdateRoleErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-404'],
    messageExamples: ['Failed to update role', 'Role not found'],
    errorExamples: [
      { field: 'name', messages: ['Role name must be at least 2 characters'] },
      { field: 'permissions', messages: ['Invalid permission format'] },
      { field: 'id', messages: ['Role ID not found'] }
    ]
  }),
  data: t.Null(),
})

export const AdminErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['ADMIN-400', 'ADMIN-404', 'ADMIN-500'],
    messageExamples: ['Invalid input data', 'Admin not found', 'Failed to delete admin', 'Failed to update admin'],
    errorExamples: [
      { field: 'email', messages: ['Email is required', 'Email must be valid'] },
      { field: 'name', messages: ['Name is required', 'Name must be at least 2 characters'] },
      { field: 'role_id', messages: ['Role ID is required'] }
    ]
  }),
  data: t.Null(),
})

// Request DTOs for creating/updating entities
export const CreateUserRequestDto = t.Object({
  name: t.String({
    description: 'User full name',
    examples: ['John Doe'],
    minLength: 2,
  }),
  email: t.String({
    description: 'User email address',
    examples: ['user@example.com'],
    minLength: 5,
    format: 'email',
  }),
  password: t.String({
    description: 'User password',
    examples: ['securePassword123'],
    minLength: 8,
  }),
  role_id: t.String({
    description: 'Role identifier to assign to the user',
    examples: ['role_admin'],
    minLength: 1,
  }),
})

export const UpdateUserRequestDto = t.Partial(
  t.Object({
    name: t.String({
      description: 'User full name',
      examples: ['John Doe'],
      minLength: 2,
    }),
    email: t.String({
      description: 'User email address',
      examples: ['user@example.com'],
      minLength: 5,
      format: 'email',
    }),
    role_id: t.String({
      description: 'Role identifier to assign to the user',
      examples: ['role_admin'],
      minLength: 1,
    }),
  })
)

export const CreateRoleRequestDto = t.Object({
  name: t.String({
    description: 'Role name',
    examples: ['Administrator'],
    minLength: 2,
  }),
  description: t.Optional(t.String({
    description: 'Role description',
    examples: ['Full system access'],
    maxLength: 255,
  })),
  permissions: t.Optional(t.Array(t.String({
    description: 'Array of permissions for this role',
    examples: ['admins.read', 'admins.create'],
    minLength: 1,
  }), {
    description: 'Optional array of permissions'
  })),
})

export const UpdateRoleRequestDto = t.Partial(
  t.Object({
    name: t.String({
      description: 'Role name',
      examples: ['Administrator'],
      minLength: 2,
    }),
    description: t.Optional(t.String({
      description: 'Role description',
      examples: ['Full system access'],
      maxLength: 255,
    })),
    permissions: t.Optional(t.Array(t.String({
      description: 'Array of permissions for this role',
      examples: ['admins.read', 'admins.create'],
      minLength: 1,
    }), {
      description: 'Optional array of permissions'
    })),
  })
)

// Query and param DTOs
export {PaginationQueryDto as AdminPaginationQueryDto} from '../../../dto/base.dto'

export const IdParamDto = t.Object({
  id: t.String({
    description: 'Unique identifier',
    examples: ['user_123456', 'role_admin'],
    minLength: 1,
  }),
})