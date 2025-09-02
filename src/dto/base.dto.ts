import { t, TSchema } from 'elysia'

// Base response meta structure
export const BaseMetaDto = t.Object({
  code: t.String(),
  message: t.String(),
  errors: t.Optional(t.Array(t.Object({
    field: t.String(),
    message: t.String()
  })))
})

// Generic base response structure
export const createBaseResponseDto = <T extends TSchema>(dataSchema: T) => {
  return t.Object({
    meta: BaseMetaDto,
    data: dataSchema
  })
}

// Generic pagination structure
export const createPaginationDto = <T extends TSchema>(itemSchema: T) => {
  return t.Object({
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
    pages: t.Number(),
    data: t.Array(itemSchema)
  })
}

// Pagination query parameters
export const PaginationQueryDto = t.Object({
  page: t.Optional(t.String()),
  limit: t.Optional(t.String())
})

// Re-export the base response and pagination DTOs for convenience
export const BaseResponseDto = createBaseResponseDto(t.Unknown())
export const PaginationDto = createPaginationDto(t.Unknown())

// Common response DTOs
export const SuccessResponseDto = createBaseResponseDto(t.Object({}))
export const ErrorResponseDto = createBaseResponseDto(t.Null())