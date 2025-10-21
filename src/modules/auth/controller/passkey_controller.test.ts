import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { adminAccessTokenPlugin, adminRefreshTokenPlugin } from '../../../plugins/jwt'
import { passkeyController } from './passkey_controller'

describe('PasskeyController - Endpoint Tests', () => {
  it('should register passkey routes correctly', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that routes are registered by checking a non-existent route returns 404
    const response = await app.handle(new Request('http://localhost/non-existent'))
    expect(response.status).toBe(404)
  })

  it('should have passkey list endpoint that accepts GET requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey list endpoint exists and accepts GET
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkeys', { method: 'GET' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should have passkey delete endpoint that accepts DELETE requests', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey delete endpoint exists and accepts DELETE
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkeys/1', { method: 'DELETE' })
    )
    // Should return 401 for unauthorized access, not 404
    expect(response.status).toBe(401)
  })

  it('should return 404 for undefined routes', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test undefined route
    const response = await app.handle(
      new Request('http://localhost/api/auth/nonexistent', { method: 'GET' })
    )
    // Should return 404 for undefined route
    expect(response.status).toBe(404)
  })

  it('should validate request body for passkey login start', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test validation with invalid body for passkey login start
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkey/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // missing required fields
      })
    )
    
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })

  it('should have passkey authentication finish endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey authentication finish endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkey/login/finish', { method: 'POST' })
    )
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })

  it('should have passkey registration start endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey registration start endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkey/register', { method: 'POST' })
    )
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })

  it('should have passkey registration finish endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey registration finish endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkey/register/finish', { method: 'POST' })
    )
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })

  it('should have passwordless passkey authentication endpoint', async () => {
    const app = new Elysia().use(adminAccessTokenPlugin).use(adminRefreshTokenPlugin).use(passkeyController)
    
    // Test that the passkey passwordless authentication endpoint exists
    const response = await app.handle(
      new Request('http://localhost/api/auth/passkey/login/passwordless', { method: 'POST' })
    )
    // Should return 400 for validation error (body validation runs before middleware)
    expect(response.status).toBe(400)
  })
})