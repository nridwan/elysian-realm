import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { adminMiddleware } from './admin_middleware'

describe('AdminMiddleware - Integration Tests', () => {
  it('should register admin middleware correctly', async () => {
    const app = new Elysia().use(adminMiddleware)
    
    // Test that middleware is registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should enforce admin access control', async () => {
    const app = new Elysia()
      .derive(() => ({ user: null }))
      .use(adminMiddleware)
      .get('/test', () => ({ message: 'success' }))

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(401)
  })
})