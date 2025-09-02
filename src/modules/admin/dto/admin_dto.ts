import { t } from 'elysia'
import { BaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

// User DTOs
export const UserDto = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  role_id: t.String(),
  role: t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Union([t.String(), t.Null()]),
  }),
})

export const UsersResponseDataDto = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  pages: t.Number(),
  data: t.Array(UserDto),
})

// Role DTOs
export const RoleDto = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  permissions: t.Optional(t.Array(t.String())),
})

export const RolesResponseDataDto = t.Object({
  roles: t.Array(RoleDto),
})

export const UserResponseDataDto = t.Object({
  user: UserDto,
})

export const RoleResponseDataDto = t.Object({
  role: RoleDto,
})

// Available Permissions DTO
export const AvailablePermissionsResponseDataDto = t.Object({
  permissions: t.Record(t.String(), t.Array(t.String())),
})

// Admin Response DTOs - using union types to handle both success and error cases
export const AdminUsersResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([UsersResponseDataDto, t.Null()]),
})

export const AdminUserResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([UserResponseDataDto, t.Null()]),
})

export const AdminRolesResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([RolesResponseDataDto, t.Null()]),
})

export const AdminRoleResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([RoleResponseDataDto, t.Null()]),
})

export const AdminAvailablePermissionsResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([AvailablePermissionsResponseDataDto, t.Null()]),
})

export const AdminSuccessResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([t.Object({}), t.Null()]),
})

export const AdminErrorResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Null(),
})

// Query and param DTOs
export const AdminPaginationQueryDto = PaginationQueryDto

export const IdParamDto = t.Object({
  id: t.String(),
})