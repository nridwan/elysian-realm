import Elysia, { t } from 'elysia'
import * as dto from '../dto/audit_dto'
import { auditMiddleware } from '../middleware/audit_middleware'
import { auditService } from '../services/audit_service_factory'
import { AuditService } from '../services/audit_service'
import { responsePlugin } from '../../../plugins/response_plugin'
import { adminMiddleware } from '../../admin/middleware/admin_middleware'

interface AuditControllerOptions {
  service?: AuditService
  auditMiddleware?: ReturnType<typeof auditMiddleware>
  adminMiddleware?: ReturnType<typeof adminMiddleware>
}

export const createAuditController = (options: AuditControllerOptions = {}) => {
  const service = options.service || auditService
  const audit = options.auditMiddleware || auditMiddleware()
  const admin = options.adminMiddleware || adminMiddleware()

  return new Elysia({ name: 'audit-controller' })
    .use(responsePlugin({ defaultServiceName: 'AUDIT' }))
    .group('/api/audit', (app) =>
      app
        .use(admin)
        .use(audit)
        .get(
          '/trails',
          async ({ query, responseTools }) => {
            const { page = '1', limit = '10', action, entity_type, user_id, start_date, end_date } = query
            const pageNum = Number.parseInt(page)
            const limitNum = Number.parseInt(limit)

            const filters: any = {}
            if (action) filters.action = action
            // Note: entity_type filter now searches within changes array (handled in service)
            if (entity_type) filters.entity_type = entity_type
            if (user_id) filters.user_id = user_id
            if (start_date) filters.start_date = new Date(start_date)
            if (end_date) filters.end_date = new Date(end_date)

            const result = await service.getAuditTrails(pageNum, limitNum, filters)
            
            return responseTools.generateResponse({
              page: result.pagination.page,
              limit: result.pagination.limit,
              total: result.pagination.total,
              pages: result.pagination.pages,
              data: result.audit_trails.map(auditTrail => ({
                id: auditTrail.id,
                user_id: auditTrail.user_id,
                user: auditTrail.user ? {
                  id: auditTrail.user.id,
                  email: auditTrail.user.email,
                  name: auditTrail.user.name,
                } : null,
                action: auditTrail.action,
                changes: auditTrail.changes as (typeof dto.AuditTrailChangesDto.static),
                ip_address: auditTrail.ip_address,
                user_agent: auditTrail.user_agent,
                created_at: auditTrail.created_at,
                is_rolled_back: auditTrail.is_rolled_back,
              }))
            }, '200', 'Audit trails retrieved successfully')
          },
          {
            query: dto.AuditPaginationQueryDto,
            response: dto.AuditTrailsResponseDto,
            hasPermission: 'audit.read',
            detail: {
              tags: ['Audit'],
              summary: 'Get Audit Trails',
              description: 'Retrieve a paginated list of audit trails with optional filtering by action, entity type, user, and date range',
              security: [{ jwt: [] }]
            }
          }
        )
        .get(
          '/trails/:id',
          async ({ params, responseTools }) => {
            const { id } = params
            const auditTrail = await service.getAuditTrailById(id)

            if (!auditTrail) {
              return responseTools.generateErrorResponse('Audit trail not found', '404', 'Audit trail not found')
            }

            return responseTools.generateResponse({
              audit_trail: {
                id: auditTrail.id,
                user_id: auditTrail.user_id,
                user: auditTrail.user ? {
                  id: auditTrail.user.id,
                  email: auditTrail.user.email,
                  name: auditTrail.user.name,
                } : null,
                action: auditTrail.action,
                changes: auditTrail.changes as (typeof dto.AuditTrailChangesDto.static),
                ip_address: auditTrail.ip_address,
                user_agent: auditTrail.user_agent,
                created_at: auditTrail.created_at,
                is_rolled_back: auditTrail.is_rolled_back,
              }
            }, '200', 'Audit trail retrieved successfully')
          },
          {
            params: t.Object({
              id: t.String({
                description: 'Audit trail ID',
                examples: ['audit_123456']
              })
            }),
            response: dto.AuditTrailResponseDto,
            hasPermission: 'audit.read',
            detail: {
              tags: ['Audit'],
              summary: 'Get Audit Trail by ID',
              description: 'Retrieve a specific audit trail by its ID',
              security: [{ jwt: [] }]
            }
          }
        )
        .get(
          '/trails/user/:userId',
          async ({ params, query, responseTools }) => {
            const { userId } = params
            const { page = '1', limit = '10' } = query
            const pageNum = Number.parseInt(page)
            const limitNum = Number.parseInt(limit)

            const result = await service.getAuditTrailsByUserId(userId, pageNum, limitNum)
            
            return responseTools.generateResponse({
              page: result.pagination.page,
              limit: result.pagination.limit,
              total: result.pagination.total,
              pages: result.pagination.pages,
              data: result.audit_trails.map(auditTrail => ({
                id: auditTrail.id,
                user_id: auditTrail.user_id,
                user: auditTrail.user ? {
                  id: auditTrail.user.id,
                  email: auditTrail.user.email,
                  name: auditTrail.user.name,
                } : null,
                action: auditTrail.action,
                changes: auditTrail.changes as (typeof dto.AuditTrailChangesDto.static),
                ip_address: auditTrail.ip_address,
                user_agent: auditTrail.user_agent,
                created_at: auditTrail.created_at,
                is_rolled_back: auditTrail.is_rolled_back,
              }))
            }, '200', 'User audit trails retrieved successfully')
          },
          {
            params: t.Object({
              userId: t.String({
                description: 'User ID',
                examples: ['user_123456']
              })
            }),
            query: dto.AuditPaginationQueryDto,
            response: dto.AuditTrailsResponseDto,
            hasPermission: 'audit.read',
            detail: {
              tags: ['Audit'],
              summary: 'Get Audit Trails by User',
              description: 'Retrieve a paginated list of audit trails for a specific user',
              security: [{ jwt: [] }]
            }
          }
        )
        .get(
          '/trails/entity/:entityType',
          async ({ params, query, responseTools }) => {
            const { entityType } = params
            const { page = '1', limit = '10' } = query
            const pageNum = Number.parseInt(page)
            const limitNum = Number.parseInt(limit)

            const result = await service.getAuditTrailsByEntityType(entityType, pageNum, limitNum)
            
            return responseTools.generateResponse({
              page: result.pagination.page,
              limit: result.pagination.limit,
              total: result.pagination.total,
              pages: result.pagination.pages,
              data: result.audit_trails.map(auditTrail => ({
                id: auditTrail.id,
                user_id: auditTrail.user_id,
                user: auditTrail.user ? {
                  id: auditTrail.user.id,
                  email: auditTrail.user.email,
                  name: auditTrail.user.name,
                } : null,
                action: auditTrail.action,
                changes: auditTrail.changes as (typeof dto.AuditTrailChangesDto.static),
                ip_address: auditTrail.ip_address,
                user_agent: auditTrail.user_agent,
                created_at: auditTrail.created_at,
                is_rolled_back: auditTrail.is_rolled_back,
              }))
            }, '200', 'Entity audit trails retrieved successfully')
          },
          {
            params: t.Object({
              entityType: t.String({
                description: 'Entity type',
                examples: ['user', 'role']
              })
            }),
            query: dto.AuditPaginationQueryDto,
            response: dto.AuditTrailsResponseDto,
            hasPermission: 'audit.read',
            detail: {
              tags: ['Audit'],
              summary: 'Get Audit Trails by Entity Type',
              description: 'Retrieve a paginated list of audit trails for a specific entity type',
              security: [{ jwt: [] }]
            }
          }
        )
    )
}

// Default export for the audit controller module
export const auditController = createAuditController()