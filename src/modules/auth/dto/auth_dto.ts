import { t } from 'elysia'
import { BaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

export const LoginDto = t.Object({
  email: t.String(),
  password: t.String(),
})

export const TokenResponseDataDto = t.Object({
  access_token: t.String(),
  refresh_token: t.String(),
})

export const RefreshTokenDto = t.Object({
  refresh_token: t.String(),
})

export const AuthTokenResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([TokenResponseDataDto, t.Null()]),
})

export const AuthPaginationQueryDto = PaginationQueryDto