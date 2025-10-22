import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAuditController } from './audit_controller'
import { AuditService } from '../services/audit_service'
import { auditMiddleware } from '../middleware/audit_middleware'

// Mock Prisma client with Bun.mock
const mockPrisma = {
  auditTrail: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve({})),
  },
  $on: mock(() => Promise.resolve({})),
  $connect: mock(() => Promise.resolve({})),
  $disconnect: mock(() => Promise.resolve({})),
  $executeRaw: mock(() => Promise.resolve({})),
  $queryRaw: mock(() => Promise.resolve({})),
  $transaction: mock(() => Promise.resolve({})),
  $use: mock(() => Promise.resolve({})),
} as unknown as PrismaClient

// Create a mock audit service
const mockAuditService = new AuditService(mockPrisma)

// Create mock middleware that bypasses authentication and provides permissions
const mockAuthMiddleware = (app: Elysia) => {
  return app.derive(() => ({
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role_id: '1',
      role: {
        id: '1',
        name: 'admin',
        description: null,
        permissions: [
          'audit.read',
          'audit.create',
          'audit.update',
          'audit.delete'
        ],
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  }))
}

describe('AuditController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Since Bun doesn't have a direct equivalent of vi.clearAllMocks(),
    // we'll just continue using the mocks as-is for now.
    // The tests should properly manage their own mocks.
  })

  it('should get audit trails list successfully', async () => {
    // Mock the getAuditTrails method
    const originalGetAuditTrails = mockAuditService.getAuditTrails;
    const mockResult = {
      audit_trails: [
        {
          id: '1',
          user_id: 'user1',
          action: 'user.create',
          entity_type: 'user',
          entity_id: 'entity1',
          old_data: null,
          new_data: { name: 'Test User', email: 'test@example.com' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: new Date(),
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      }
    };
    mockAuditService.getAuditTrails = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAuditController({ 
        service: mockAuditService,
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any})
      }))

    const response = await app.handle(
      new Request('http://localhost/api/audit/trails', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('AUDIT-200')
    expect(body.meta.message).toBe('Audit trails retrieved successfully')
    expect(body.data.data).toHaveLength(1)
    expect(body.data.total).toBe(1)
    
    // Restore the original method
    mockAuditService.getAuditTrails = originalGetAuditTrails;
  })

  it('should get audit trail by ID successfully', async () => {
    // Mock the getAuditTrailById method
    const originalGetAuditTrailById = mockAuditService.getAuditTrailById;
    const mockResult = {
      id: '1',
      user_id: 'user1',
      action: 'user.create',
      entity_type: 'user',
      entity_id: 'entity1',
      old_data: null,
      new_data: { name: 'Test User', email: 'test@example.com' },
      ip_address: '127.0.0.1',
      user_agent: 'test-agent',
      created_at: new Date(),
    };
    mockAuditService.getAuditTrailById = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAuditController({ 
        service: mockAuditService,
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any})
      }))

    const response = await app.handle(
      new Request('http://localhost/api/audit/trails/1', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('AUDIT-200')
    expect(body.meta.message).toBe('Audit trail retrieved successfully')
    expect(body.data.audit_trail.id).toBe('1')
    expect(body.data.audit_trail.action).toBe('user.create')
    
    // Restore the original method
    mockAuditService.getAuditTrailById = originalGetAuditTrailById;
  })

  it('should return error when audit trail not found', async () => {
    // Mock the getAuditTrailById method to return null
    const originalGetAuditTrailById = mockAuditService.getAuditTrailById;
    mockAuditService.getAuditTrailById = mock(() => Promise.resolve(null)) as any;

    const app = new Elysia()
      .use(createAuditController({ 
        service: mockAuditService,
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any})
      }))

    const response = await app.handle(
      new Request('http://localhost/api/audit/trails/999', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200) // Returns success but with error message
    const body = await response.json()
    expect(body.meta.code).toBe('AUDIT-404')
    expect(body.meta.message).toBe('Audit trail not found')
    expect(body.data).toBeNull()
    
    // Restore the original method
    mockAuditService.getAuditTrailById = originalGetAuditTrailById;
  })
})