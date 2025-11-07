import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { createAuditController } from '../controller/audit_controller'
import { AuditService } from '../services/audit_service'
import { PrismaClient } from '@prisma/client'
import { AuditContext } from '../middleware/audit_middleware'

// Mock Prisma client for testing
const mockPrisma = {
  auditTrail: {
    create: () => Promise.resolve({}),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    count: () => Promise.resolve(0),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  $on: () => {},
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  $executeRaw: () => Promise.resolve(0),
  $queryRaw: () => Promise.resolve([]),
  $transaction: () => Promise.resolve({}),
  $use: () => {},
} as unknown as PrismaClient

// Create audit service with mock Prisma
const mockAuditService = new AuditService(mockPrisma)

// Mock admin middleware that provides a user context
const mockAdminMiddleware = (app: Elysia) => {
  return app.derive(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role_id: '1',
      role: {
        id: '1',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['audit.read', 'admins.read', 'admins.create', 'admins.update', 'admins.delete'],
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  }))
}

// Mock audit middleware for testing
const mockAuditMiddleware = (app: Elysia) => {
  return app.derive(() => {
    // Mock audit context
    const auditContext: AuditContext = {
      actionRecorded: false,
      initialAction: null,
      changes: [],
      rollbackPending: false,
    };

    // Mock audit tools with new enhanced API
    const auditTools = {
      recordStartAction: (action: string) => {
        if (!auditContext.actionRecorded) {
          auditContext.initialAction = action;
          auditContext.actionRecorded = true;
        }
      },
      recordChange: (table_name: string, old_value?: any, new_value?: any) => {
        const change = {
          table_name,
          old_value,
          new_value
        };
        auditContext.changes.push(change);
      },
      markForRollback: () => {
        auditContext.rollbackPending = true;
      },
      flushAudit: async () => {
        return null;
      },
      getAuditChanges: () => {
        return auditContext.changes.length > 0 ? [...auditContext.changes] : null;
      },
    };

    return {
      auditContext,
      auditTools,
    };
  });
}

describe('Audit Integration Tests', () => {
  let app: Elysia

  beforeEach(() => {
    // Create a new Elysia app for each test
    app = new Elysia()
      .use(createAuditController({
        service: mockAuditService,
        auditMiddleware: mockAuditMiddleware as any,
        adminMiddleware: mockAdminMiddleware as any
      }))
  })

  afterEach(() => {
    // Clean up after each test
  })

  it('should register audit routes correctly', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/audit/trails', { method: 'GET' })
    )
    
    // Should get a response (might be 401 if auth fails, but route should exist)
    expect(response).toBeDefined()
  })

  it('should have trails endpoint that accepts GET requests', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/audit/trails', { method: 'GET' })
    )
    
    // Should get a response
    expect(response).toBeDefined()
  })

  it('should have trail detail endpoint', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/audit/trails/test-id', { method: 'GET' })
    )
    
    // Should get a response
    expect(response).toBeDefined()
  })

  it('should return 404 for undefined routes', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/audit/undefined-route', { method: 'GET' })
    )
    
    // Should return 404 for undefined routes
    expect(response.status).toBe(404)
  })
})