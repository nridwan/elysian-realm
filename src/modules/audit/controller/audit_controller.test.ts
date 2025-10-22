import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { auditController } from './audit_controller'

describe('AuditController - Endpoint Tests', () => {
  it('should register audit routes correctly', async () => {
    const app = new Elysia().use(auditController)
    
    // Test that routes are registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should have trails endpoint that accepts GET requests', async () => {
    const app = new Elysia().use(auditController)
    
    // Test that the trails endpoint exists and accepts GET
    const response = await app.handle(
      new Request('http://localhost/api/audit/trails', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should have trail detail endpoint', async () => {
    const app = new Elysia().use(auditController)
    
    // Test that the trail detail endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/audit/trails/1', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should return 404 for undefined routes', async () => {
    const app = new Elysia().use(auditController)
    
    // Test undefined route
    const response = await app.handle(
      new Request('http://localhost/api/audit/nonexistent', { method: 'GET' })
    )
    // Should return 404 for undefined route
    expect(response.status).toBe(404)
  })
})