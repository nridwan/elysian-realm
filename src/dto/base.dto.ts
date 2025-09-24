import { t, TSchema } from 'elysia'

// Base response meta structure
export const BaseMetaDto = t.Object({
  code: t.String({
    description: 'Response status code',
    examples: ['AUTH-200', 'ADMIN-404']
  }),
  message: t.String({
    description: 'Human-readable response message',
    examples: ['Login successful', 'User not found']
  }),
  errors: t.Optional(t.Array(t.Object({
    field: t.String({
      description: 'Field that caused the error',
      examples: ['email', 'password']
    }),
    messages: t.Array(t.String(), {
      description: 'Error messages for the field',
      examples: [['Email is required', 'Email must be valid']]
    })
  }), {
    description: 'List of validation errors'
  }))
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
    page: t.Number({
      description: 'Current page number',
      examples: [1]
    }),
    limit: t.Number({
      description: 'Number of items per page',
      examples: [10]
    }),
    total: t.Number({
      description: 'Total number of items',
      examples: [100]
    }),
    pages: t.Number({
      description: 'Total number of pages',
      examples: [10]
    }),
    data: t.Array(itemSchema, {
      description: 'Array of items for the current page'
    })
  })
}

// Pagination query parameters
export const PaginationQueryDto = t.Object({
  page: t.Optional(t.String({
    description: 'Page number to retrieve (default: 1)',
    examples: ['1']
  })),
  limit: t.Optional(t.String({
    description: 'Number of items per page (default: 10)',
    examples: ['10']
  }))
})

// Re-export the base response and pagination DTOs for convenience
export const BaseResponseDto = createBaseResponseDto(t.Unknown())
export const PaginationDto = createPaginationDto(t.Unknown())

// Common response DTOs
export const SuccessResponseDto = createBaseResponseDto(t.Object({}))
export const ErrorResponseDto = createBaseResponseDto(t.Null())

// Specific response DTOs for passkey operations
export const PasskeyOptionsResponseDto = createBaseResponseDto(t.Object({
  options: t.Unknown()
}))

export const PasskeyRegistrationResponseDto = createBaseResponseDto(t.Object({
  success: t.Boolean()
}))

export const PasskeyAuthenticationResponseDto = createBaseResponseDto(t.Object({
  access_token: t.String(),
  refresh_token: t.String()
}))

export const PasskeyListResponseDto = createBaseResponseDto(t.Array(t.Object({
  id: t.String(),
  deviceType: t.String(),
  backedUp: t.Boolean(),
  transports: t.Array(t.String()),
  created_at: t.String(), // ISO date string
  updated_at: t.String()  // ISO date string
})))

export const PasskeyDeleteResponseDto = createBaseResponseDto(t.Object({
  success: t.Boolean()
}))