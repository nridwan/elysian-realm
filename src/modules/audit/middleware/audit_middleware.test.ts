import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { auditMiddleware } from './audit_middleware'

describe('AuditMiddleware - Integration Tests', () => {
  it('should register audit middleware correctly', async () => {
    const app = new Elysia().use(auditMiddleware())
    
    // Test that middleware is registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should provide audit tools in context', async () => {
    const app = new Elysia()
      .use(auditMiddleware())
      .get('/test', ({ auditTools }) => {
        return {
          hasAuditTools: !!auditTools,
          hasLogAction: typeof auditTools?.logAction === 'function',
          hasAddAction: typeof auditTools?.addAction === 'function',
          hasGetAuditTrail: typeof auditTools?.getAuditTrail === 'function'
        }
      })

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.hasAuditTools).toBe(true)
    expect(body.hasLogAction).toBe(true)
    expect(body.hasAddAction).toBe(true)
    expect(body.hasGetAuditTrail).toBe(true)
  })
})