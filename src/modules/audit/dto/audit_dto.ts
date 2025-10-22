import { t } from 'elysia'
import { BaseMetaDto, PaginationQueryDto } from '../../../dto/base.dto'

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
  action: t.String({
    description: 'Action performed by the user',
    examples: ['user.create', 'user.update', 'user.delete']
  }),
  entity_type: t.String({
    description: 'Type of entity affected by the action',
    examples: ['user', 'role', 'permission']
  }),
  entity_id: t.Union([t.String({
    description: 'ID of the entity affected',
    examples: ['entity_123456']
  }), t.Null()]),
  old_data: t.Union([t.Any(), t.Null()], {
    description: 'Previous state of the entity before the action'
  }),
  new_data: t.Union([t.Any(), t.Null()], {
    description: 'New state of the entity after the action'
  }),
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

// Audit Response DTOs
export const AuditTrailsResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([AuditTrailsResponseDataDto, t.Null()], {
    description: 'Paginated audit trail data or null if request failed'
  }),
})

export const AuditTrailResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([AuditTrailResponseDataDto, t.Null()], {
    description: 'Audit trail data or null if request failed'
  }),
})

export const AuditSuccessResponseDto = t.Object({
  meta: BaseMetaDto,
  data: t.Union([t.Object({}), t.Null()], {
    description: 'Empty object for successful operations or null if failed'
  }),
})

export const AuditErrorResponseDto = t.Object({
  meta: BaseMetaDto,
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
      description: 'Filter by entity type',
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