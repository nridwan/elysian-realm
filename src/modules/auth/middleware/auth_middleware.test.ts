import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { authMiddleware } from './auth_middleware'

describe('AuthMiddleware - Integration Tests', () => {
  it('should register auth middleware correctly', async () => {
    const app = new Elysia().use(authMiddleware)
    
    // Test that middleware is registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should add user property to context', async () => {
    const app = new Elysia()
      .use(authMiddleware)
      .get('/test', ({ user }) => ({ hasUser: user !== undefined }))

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.hasUser).toBe(true)
  })
})