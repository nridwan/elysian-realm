import { t } from 'elysia'

// User DTOs
export const UserDto = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  roleId: t.String(),
  role: t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Union([t.String(), t.Null()]),
  }),
})

export const UsersResponseDto = t.Object({
  users: t.Array(UserDto),
  pagination: t.Object({
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
    pages: t.Number(),
  }),
})

export const UserResponseDto = t.Object({
  user: UserDto,
})

// Role DTOs
export const RoleDto = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  permissions: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        description: t.Union([t.String(), t.Null()]),
      })
    )
  ),
})

export const RolesResponseDto = t.Object({
  roles: t.Array(RoleDto),
})

export const RoleResponseDto = t.Object({
  role: RoleDto,
})

// Permission DTOs
export const PermissionDto = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
})

export const PermissionsResponseDto = t.Object({
  permissions: t.Array(PermissionDto),
})

export const PermissionResponseDto = t.Object({
  permission: PermissionDto,
})

// Error DTO
export const ErrorResponseDto = t.Object({
  error: t.String(),
})

// Success DTO
export const SuccessResponseDto = t.Object({
  message: t.String(),
})

// Query and param DTOs
export const PaginationQueryDto = t.Optional(
  t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
  })
)

export const IdParamDto = t.Object({
  id: t.String(),
})