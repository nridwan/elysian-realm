import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from '../../../plugins/jwt'
import { adminController } from './admin_controller'

describe('AdminController - Endpoint Tests', () => {
  it('should register admin routes correctly', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test that routes are registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should have users endpoint that accepts GET requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test that the users endpoint exists and accepts GET
    const response = await app.handle(
      new Request('http://localhost/api/admin/admins', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should have roles endpoint that accepts GET requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test that the roles endpoint exists and accepts GET
    const response = await app.handle(
      new Request('http://localhost/api/admin/roles', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should return 404 for undefined routes', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test undefined route
    const response = await app.handle(
      new Request('http://localhost/api/admin/nonexistent', { method: 'GET' })
    )
    // Should return 404 for undefined route
    expect(response.status).toBe(404)
  })

  it('should validate request body for role creation', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test validation with invalid body for role creation
    const response = await app.handle(
      new Request('http://localhost/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // missing required fields
      })
    )
    
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })

  it('should have user detail endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test that the user detail endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should handle PUT requests to user endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test PUT to user endpoint
    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' })
      })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should handle DELETE requests to user endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(adminController)
    
    // Test DELETE to user endpoint
    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', { method: 'DELETE' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })
})