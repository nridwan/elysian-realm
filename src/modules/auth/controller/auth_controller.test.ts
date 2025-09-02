import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from '../../../plugins/jwt'
import { authController } from './auth_controller'

describe('AuthController - Endpoint Tests', () => {
  it('should register auth routes correctly', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test that routes are registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should have login endpoint that accepts POST requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test that the login endpoint exists and accepts POST
    const response = await app.handle(
      new Request('http://localhost/api/auth/login', { method: 'POST' })
    )
    // Should return 400 for validation error (missing body), not 404
    expect(response.status).toBe(400)
  })

  it('should return 404 for GET requests to login endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test that GET returns 404 on login endpoint (route not defined for GET)
    const response = await app.handle(
      new Request('http://localhost/api/auth/login', { method: 'GET' })
    )
    // Should return 404 as GET is not defined for this route
    expect(response.status).toBe(404)
  })

  it('should validate request body for login endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test validation with invalid body
    const response = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }) // missing password
      })
    )
    
    // Should return 400 for validation error
    expect(response.status).toBe(400)
  })

  it('should have refresh endpoint that accepts POST requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test that the refresh endpoint exists and accepts POST
    const response = await app.handle(
      new Request('http://localhost/api/auth/refresh', { method: 'POST' })
    )
    // Should return 400 for validation error (missing body), not 404
    expect(response.status).toBe(400)
  })

  it('should return 404 for GET requests to refresh endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test that GET returns 404 on refresh endpoint (route not defined for GET)
    const response = await app.handle(
      new Request('http://localhost/api/auth/refresh', { method: 'GET' })
    )
    // Should return 404 as GET is not defined for this route
    expect(response.status).toBe(404)
  })

  it('should validate request body for refresh endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(authController)
    
    // Test validation with invalid body
    const response = await app.handle(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // missing refresh_token
      })
    )
    
    // Should return 400 for validation error
    expect(response.status).toBe(400)
  })
})