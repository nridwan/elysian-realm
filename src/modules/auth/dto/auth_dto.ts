import { t } from 'elysia'
import { BaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

export const LoginDto = t.Object({
  email: t.String({
    description: 'User email address for authentication',
    examples: ['user@example.com']
  }),
  password: t.String({
    description: 'User password for authentication',
    examples: ['password123']
  }),
})

export const TokenResponseDataDto = t.Object({
  access_token: t.String({
    description: 'JWT access token for API authentication',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']
  }),
  refresh_token: t.String({
    description: 'Refresh token for obtaining new access tokens',
    examples: ['dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gdGV4dA==']
  }),
})

export const RefreshTokenDto = t.Object({
  refresh_token: t.String({
    description: 'Valid refresh token for obtaining new access tokens',
    examples: ['dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gdGV4dA==']
  }),
})

export const AuthTokenResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([TokenResponseDataDto, t.Null()], {
    description: 'Authentication token data or null if authentication failed'
  }),
})

export const AuthPaginationQueryDto = PaginationQueryDto