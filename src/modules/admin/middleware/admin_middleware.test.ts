import { describe, it, expect, vi } from 'vitest'
import { Elysia } from 'elysia'
import { adminMiddleware } from './admin_middleware'

describe('AdminMiddleware - Integration Tests', () => {
  it('should register admin middleware correctly', async () => {
    const app = new Elysia().use(adminMiddleware())
    
    // Test that middleware is registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should enforce admin access control', async () => {
    const app = new Elysia()
      .use(adminMiddleware())
      .get('/test', () => ({ message: 'success' }), {needAuth: true})

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(401)
  })
  
  it('should allow access when user is authenticated', async () => {
    const app = new Elysia()
      .use(adminMiddleware())
      .derive(() => ({ 
        user: { 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User',
          role_id: '1',
          role: { 
            id: '1', 
            name: 'admin', 
            description: null,
            permissions: ['admins.read', 'admins.create']
          }
        } 
      }))
      .get('/test', () => ({ message: 'success' }))

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(200)
  })
  
  it('should enforce permission access control with macro', async () => {
    const app = new Elysia()
      .use(adminMiddleware())
      .derive(() => ({ user: null }))
      .get('/test', () => ({ message: 'success' }), {
        hasPermission: 'admins.read'
      })

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(401)
  })
  
  it('should allow access when user has required permission', async () => {
    const app = new Elysia()
      .use(adminMiddleware())
      .derive(() => ({ 
        user: { 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User',
          role_id: '1',
          role: { 
            id: '1', 
            name: 'admin', 
            description: null,
            permissions: ['admins.read', 'admins.create']
          }
        } 
      }))
      .get('/test', () => ({ message: 'success' }), {
        hasPermission: 'admins.read'
      })

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(200)
  })
  
  it('should deny access when user lacks required permission', async () => {
    const app = new Elysia()
      .use(adminMiddleware())
      .derive(() => ({ 
        user: { 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User',
          role_id: '1',
          role: { 
            id: '1', 
            name: 'admin', 
            description: null,
            permissions: ['admins.read'] as string[] | null
          }
        } 
      }))
      .get('/test', () => ({ message: 'success' }), {
        hasPermission: 'admins.delete'
      })

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(403)
  })
})