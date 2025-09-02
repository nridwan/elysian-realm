import { t } from 'elysia'

export const LoginDto = t.Object({
  email: t.String(),
  password: t.String(),
})

export const RegisterDto = t.Object({
  email: t.String(),
  password: t.String(),
  name: t.String(),
})

export const TokenResponseDto = t.Object({
  token: t.String(),
})

export const ErrorResponseDto = t.Object({
  error: t.String(),
})