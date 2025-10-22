import { describe, it, expect, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { auditMiddleware } from './audit_middleware'
import { AuditService, AuditTrailData } from '../services/audit_service'

// Mock the audit service
const mockCreateAuditTrail = mock((data: AuditTrailData) => Promise.resolve({ 
  id: '1', 
  user_id: data.user_id,
  action: data.action,
  ip_address: data.ip_address,
  user_agent: data.user_agent,
  created_at: new Date(),
  updated_at: new Date()
}))
const mockAuditService: AuditService = {
  createAuditTrail: mockCreateAuditTrail,
} as any

// Mock auth middleware to bypass authentication for testing
const mockAuthMiddleware = (app: Elysia) => {
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
        permissions: ['admins.read', 'admins.create', 'admins.update', 'admins.delete'],
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  }))
}

describe('AuditMiddleware - Mocked Service Tests', () => {
  it('should register audit middleware correctly', async () => {
    const app = new Elysia().use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
    
    // Test that middleware is registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should provide audit tools in context', async () => {
    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test', ({ auditTools }) => {
        return {
          hasAuditTools: !!auditTools,
          hasRecordStartAction: typeof auditTools?.recordStartAction === 'function',
          hasRecordChange: typeof auditTools?.recordChange === 'function',
          hasMarkForRollback: typeof auditTools?.markForRollback === 'function',
          hasFlushAudit: typeof auditTools?.flushAudit === 'function',
          hasGetAuditChanges: typeof auditTools?.getAuditChanges === 'function'
        }
      })

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.hasAuditTools).toBe(true)
    expect(body.hasRecordStartAction).toBe(true)
    expect(body.hasRecordChange).toBe(true)
    expect(body.hasMarkForRollback).toBe(true)
    expect(body.hasFlushAudit).toBe(true)
    expect(body.hasGetAuditChanges).toBe(true)
  })

  it('should call audit service when recordStartAction and recordChange are used and onAfterHandle is triggered', async () => {
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-audit', async ({ auditTools }) => {
        // Record the start action
        auditTools?.recordStartAction('TEST_ACTION')
        // Record a change
        auditTools?.recordChange('test_table', null, { id: 'test-id', name: 'test-name' })
        return { success: true }
      })

    const response = await app.handle(new Request('http://localhost/test-audit'))
    expect(response.status).toBe(200)
    
    // Check that createAuditTrail was called in the onAfterHandle hook with single audit containing changes
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('TEST_ACTION')
    expect(callArgs.user_id).toBe('test-user-id') // From mock user
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes).toBeArray()
    expect(callArgs.changes!.length).toBe(1)
    expect(callArgs.changes![0].table_name).toBe('test_table')
    expect(callArgs.changes![0].new_value).toEqual({ id: 'test-id', name: 'test-name' })
  })

  it('should call audit service when recordStartAction and flushAudit are used directly', async () => {
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-log', async ({ auditTools }) => {
        // Record the start action
        auditTools?.recordStartAction('DIRECT_LOG_ACTION')
        // Record a change
        auditTools?.recordChange('direct_test_table', null, { id: 'direct-test-id', name: 'direct-test-name' })
        // Flush the audit directly
        await auditTools?.flushAudit()
        return { success: true }
      })

    const response = await app.handle(new Request('http://localhost/test-log'))
    expect(response.status).toBe(200)
    
    // Check that createAuditTrail was called via flushAudit
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('DIRECT_LOG_ACTION')
    expect(callArgs.user_id).toBe('test-user-id') // From mock user context
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes).toBeArray()
    expect(callArgs.changes!.length).toBe(1)
    expect(callArgs.changes![0].table_name).toBe('direct_test_table')
    expect(callArgs.changes![0].new_value).toEqual({ id: 'direct-test-id', name: 'direct-test-name' })
  })

  it('should handle errors from audit service gracefully', async () => {
    // Mock the service to throw an error
    const errorMockCreateAuditTrail = mock((data: AuditTrailData) => Promise.reject(new Error('Audit service error')))
    const errorMockAuditService: AuditService = {
      createAuditTrail: errorMockCreateAuditTrail,
    } as any

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: errorMockAuditService }))
      .get('/test-error', async ({ auditTools }) => {
        // Record the start action
        auditTools?.recordStartAction('ERROR_TEST_ACTION')
        // Record a change
        auditTools?.recordChange('error_test_table', null, { id: 'error-test-id' })
        return { success: true }
      })

    const response = await app.handle(new Request('http://localhost/test-error'))
    expect(response.status).toBe(200)
    // The main request should still succeed even if audit fails
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('should handle cases where user is not authenticated', async () => {
    // Mock auth middleware without user
    const mockAuthMiddlewareNoUser = (app: Elysia) => {
      return app.derive(() => ({
        user: null
      }))
    }

    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddlewareNoUser as any, service: mockAuditService }))
      .get('/test-no-user', async ({ auditTools }) => {
        // Record the start action
        auditTools?.recordStartAction('NO_USER_ACTION')
        // Record a change
        auditTools?.recordChange('no_user_test_table', null, { id: 'no-user-test-id' })
        return { success: true }
      })

    const response = await app.handle(new Request('http://localhost/test-no-user'))
    expect(response.status).toBe(200)
    
    // Check that createAuditTrail was called but user_id is not set
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('NO_USER_ACTION')
    expect(callArgs.user_id).toBeUndefined() // No user authenticated
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes).toBeArray()
    expect(callArgs.changes!.length).toBe(1)
    expect(callArgs.changes![0].table_name).toBe('no_user_test_table')
  })

  it('should capture IP address and user agent correctly', async () => {
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-headers', async ({ auditTools }) => {
        // Record the start action and flush directly to test headers
        auditTools?.recordStartAction('HEADER_TEST_ACTION')
        auditTools?.recordChange('header_test_table', null, { id: 'header-test-id' })
        await auditTools?.flushAudit()
        return { success: true }
      })

    const request = new Request('http://localhost/test-headers', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Test-Agent/1.0'
      }
    })

    const response = await app.handle(request)
    expect(response.status).toBe(200)
    
    // Check that headers were captured correctly
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('HEADER_TEST_ACTION')
    expect(callArgs.ip_address).toBe('192.168.1.1')
    expect(callArgs.user_agent).toBe('Test-Agent/1.0')
  })

  it('should record action name at controller start when using enhanced audit tools', async () => {
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-start-audit', async ({ auditTools }) => {
        // Record the action at the start of the controller
        auditTools?.recordStartAction('TEST_CONTROLLER_START')
        auditTools?.recordChange('test_controller_table', null, { id: 'test-start-id' })
        
        // Simulate some operations
        return { success: true, message: 'Action recorded at start' }
      })

    const response = await app.handle(new Request('http://localhost/test-start-audit'))
    expect(response.status).toBe(200)
    
    // Check that the action was recorded
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('TEST_CONTROLLER_START')
    expect(callArgs.user_id).toBe('test-user-id')
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes!.length).toBe(1)
    expect(callArgs.changes![0].table_name).toBe('test_controller_table')
  })

  it('should track multiple data changes in a single request', async () => {
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-multiple-changes', async ({ auditTools }) => {
        // Record the initial action
        auditTools?.recordStartAction('MULTI_OPERATION_CONTROLLER')

        // Simulate multiple data changes - all should be grouped into single audit row
        auditTools?.recordChange('user', { name: 'John', email: 'john@example.com' }, { name: 'John Doe', email: 'john.doe@example.com' })
        auditTools?.recordChange('role', { permissions: ['read'] }, { permissions: ['read', 'write'] })

        return { success: true, operations: 2 }
      })

    const response = await app.handle(new Request('http://localhost/test-multiple-changes'))
    expect(response.status).toBe(200)
    
    // Check that all operations were grouped into a single audit row
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1) // Single audit call with multiple changes
    
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('MULTI_OPERATION_CONTROLLER')
    expect(callArgs.user_id).toBe('test-user-id')
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes).toBeArray()
    expect(callArgs.changes!.length).toBe(2) // Two changes in single audit
    
    // Check the individual changes
    expect(callArgs.changes![0].table_name).toBe('user')
    expect(callArgs.changes![0].old_value).toEqual({ name: 'John', email: 'john@example.com' })
    expect(callArgs.changes![0].new_value).toEqual({ name: 'John Doe', email: 'john.doe@example.com' })
    
    expect(callArgs.changes![1].table_name).toBe('role')
    expect(callArgs.changes![1].old_value).toEqual({ permissions: ['read'] })
    expect(callArgs.changes![1].new_value).toEqual({ permissions: ['read', 'write'] })
  })

  it('should support rollback functionality by allowing marking audit for rollback', async () => {
    // Test that when markForRollback is called, no audit is recorded
    
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-rollback', async ({ auditTools }) => {
        // Record the start action and some changes
        auditTools?.recordStartAction('ROLLBACK_TEST_ACTION')
        auditTools?.recordChange('rollback_test_table', { status: 'active' }, { status: 'inactive' })
        
        // Mark for rollback - this should prevent the audit from being logged
        auditTools?.markForRollback()
        
        return { success: false, rollback_needed: true }
      })

    const response = await app.handle(new Request('http://localhost/test-rollback'))
    expect(response.status).toBe(200)
    
    // No audit should be recorded when marked for rollback
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(0)
  })

  it('should log single audit row when multiple changes are grouped', async () => {
    // Test the core functionality: single audit row with multiple changes
    
    // Reset the mock to track calls
    mockCreateAuditTrail.mockReset()

    const app = new Elysia()
      .use(auditMiddleware({ auth: mockAuthMiddleware as any, service: mockAuditService }))
      .get('/test-single-audit-multi-changes', async ({ auditTools }) => {
        // Record action at controller start
        auditTools?.recordStartAction('COMPLEX_CONTROLLER_EXECUTION')
        
        // Record multiple changes that should be grouped in single audit
        auditTools?.recordChange('users', null, { id: 'user-1', name: 'User One' })
        auditTools?.recordChange('roles', null, { id: 'role-1', name: 'Admin' })
        auditTools?.recordChange('permissions', null, { id: 'perm-1', name: 'read' })
        
        return { success: true, changes: 3 }
      })

    const response = await app.handle(new Request('http://localhost/test-single-audit-multi-changes'))
    expect(response.status).toBe(200)
    
    // Should create single audit row with all changes
    expect(mockCreateAuditTrail).toHaveBeenCalledTimes(1)
    const callArgs = mockCreateAuditTrail.mock.calls[0][0]
    expect(callArgs.action).toBe('COMPLEX_CONTROLLER_EXECUTION')
    expect(callArgs.user_id).toBe('test-user-id')
    expect(callArgs.changes).toBeDefined()
    expect(callArgs.changes).toBeArray()
    expect(callArgs.changes!.length).toBe(3) // Three changes in single audit
    
    // Verify all changes are properly recorded
    expect(callArgs.changes![0].table_name).toBe('users')
    expect(callArgs.changes![1].table_name).toBe('roles')
    expect(callArgs.changes![2].table_name).toBe('permissions')
  })
})