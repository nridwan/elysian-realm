import { t } from 'elysia'
import { createBaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

export const AuditTrailChangesDto = t.Union([t.Array(t.Object({
    table_name: t.String({
      description: 'Name of the table that was changed',
      examples: ['user', 'role', 'permission']
    }),
    old_value: t.Union([t.Any(), t.Null()], {
      description: 'Previous state of the record before the action'
    }),
    new_value: t.Union([t.Any(), t.Null()], {
      description: 'New state of the record after the action'
    }),
  })), t.Null()], {
    description: 'Array of changes made during the action'
  })

// AuditTrail DTOs
export const AuditTrailDto = t.Object({
  id: t.String({
    description: 'Unique identifier for the audit trail entry',
    examples: ['audit_123456']
  }),
  user_id: t.Union([t.String({
    description: 'ID of the user who performed the action',
    examples: ['user_123456']
  }), t.Null()]),
  user: t.Union([t.Object({
    id: t.String({
      description: 'ID of the user who performed the action',
      examples: ['user_123456']
    }),
    email: t.String({
      description: 'Email of the user who performed the action',
      examples: ['user@example.com']
    }),
    name: t.String({
      description: 'Name of the user who performed the action',
      examples: ['John Doe']
    }),
  }), t.Null()], {
    description: 'User information of the user who performed the action'
  }),
  action: t.String({
    description: 'Action performed by the user',
    examples: ['user.create', 'user.update', 'user.delete']
  }),
  changes: AuditTrailChangesDto,
  ip_address: t.Union([t.String({
    description: 'IP address of the user who performed the action',
    examples: ['192.168.1.1']
  }), t.Null()]),
  user_agent: t.Union([t.String({
    description: 'User agent string of the user who performed the action',
    examples: ['Mozilla/5.0...']
  }), t.Null()]),
  created_at: t.Date({
    description: 'Timestamp when the audit trail entry was created',
    examples: ['2023-01-01T00:00:00.000Z']
  }),
  is_rolled_back: t.Boolean({
    description: 'Whether this audit has been marked as rolled back',
    examples: [false, true]
  }),
}, {
  description: 'Audit trail data structure'
})

export const AuditTrailsResponseDataDto = t.Object({
  page: t.Number({
    description: 'Current page number',
    examples: [1]
  }),
  limit: t.Number({
    description: 'Number of items per page',
    examples: [10]
  }),
  total: t.Number({
    description: 'Total number of audit trails',
    examples: [100]
  }),
  pages: t.Number({
    description: 'Total number of pages',
    examples: [10]
  }),
  data: t.Array(AuditTrailDto, {
    description: 'Array of audit trails for the current page'
  }),
}, {
  description: 'Paginated audit trail response data'
})

export const AuditTrailResponseDataDto = t.Object({
  audit_trail: AuditTrailDto,
}, {
  description: 'Single audit trail response data'
})

// Audit Success Response DTOs
export const AuditTrailsSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-200'],
    messageExamples: ['Audit trails retrieved successfully']
  }),
  data: AuditTrailsResponseDataDto,
})

export const AuditTrailSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-200'],
    messageExamples: ['Audit trail retrieved successfully']
  }),
  data: AuditTrailResponseDataDto,
})

export const AuditSuccessResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-200', 'AUDIT-201'],
    messageExamples: ['Audit operation successful', 'Audit rollback completed']
  }),
  data: t.Object({}),
})

// Audit Error Response DTOs
export const AuditTrailsErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-404'],
    messageExamples: ['Audit trails not found']
  }),
  data: t.Null(),
})

export const AuditTrailErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-404'],
    messageExamples: ['Audit trail not found']
  }),
  data: t.Null(),
})

export const AuditErrorResponseDto = t.Object({
  meta: createBaseMetaDto({
    codeExamples: ['AUDIT-400', 'AUDIT-403', 'AUDIT-500'],
    messageExamples: ['Invalid audit data', 'Access denied to audit data', 'Audit retrieval failed'],
    errorExamples: [
      { field: 'user_id', messages: ['User ID must be valid'] },
      { field: 'action', messages: ['Action type is required'] }
    ]
  }),
  data: t.Null(),
})

// Request DTOs
export const AuditPaginationQueryDto = t.Composite([
  PaginationQueryDto,
  t.Object({
    action: t.Optional(t.String({
      description: 'Filter by action type',
      examples: ['user.create', 'user.update']
    })),
    entity_type: t.Optional(t.String({
      description: 'Filter by entity type (searches within changes array)',
      examples: ['user', 'role']
    })),
    user_id: t.Optional(t.String({
      description: 'Filter by user ID',
      examples: ['user_123']
    })),
    start_date: t.Optional(t.String({
      description: 'Filter by start date',
      examples: ['2023-01-01']
    })),
    end_date: t.Optional(t.String({
      description: 'Filter by end date',
      examples: ['2023-12-31']
    })),
  })
])