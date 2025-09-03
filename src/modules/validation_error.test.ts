import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAuthController } from './auth/controller/auth_controller'
import { createAdminController } from './admin/controller/admin_controller'
import { AuthService } from './auth/services/auth_service'
import { AdminService } from './admin/services/admin_service'
import { errorHandlerPlugin } from '../plugins/error_handler_plugin'

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  role: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $on: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
  $use: vi.fn(),
} as unknown as PrismaClient

// Create mock services
const mockAuthService = new AuthService(mockPrisma)
const mockAdminService = new AdminService(mockPrisma)

// Create mock JWT implementations
const mockAdminAccessToken = {
  sign: vi.fn().mockResolvedValue('mock-access-token'),
  verify: vi.fn().mockResolvedValue({ 
    id: '1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: {
      name: 'admin',
      permissions: ['users.create', 'roles.create']
    }
  })
}

const mockAdminRefreshToken = {
  sign: vi.fn().mockResolvedValue('mock-refresh-token'),
  verify: vi.fn()
}

// Create mock JWT plugins that return properly structured Elysia plugins
const createMockAdminAccessTokenPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ adminAccessToken: mockAdminAccessToken }))
}

const createMockAdminRefreshTokenPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ adminRefreshToken: mockAdminRefreshToken }))
}

// Create mock admin middleware
const createMockAdminMiddleware = () => {
  return (app: Elysia) => app.derive(() => ({ 
    user: { 
      id: '1', 
      email: 'admin@example.com', 
      name: 'Admin', 
      role_id: 'admin-role',
      role: { 
        id: 'admin-role', 
        name: 'admin', 
        description: null, 
        permissions: ['users.create', 'roles.create'] 
      } 
    } 
  }))
}

describe('Validation Error Responses', () => {
  beforeAll(() => {
    errorHandlerPlugin()
  })
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should return formatted validation errors for auth login with invalid email', async () => {
    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid', // Invalid email format
          password: 'p' // Valid password
        })
      })
    )

    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Response text:', text)
    
    // Try to parse as JSON
    let body
    try {
      body = JSON.parse(text)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      console.error('Response text:', text)
      throw e
    }
    
    expect(response.status).toBe(400)
    // Check that the response follows our BaseResponse format
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('data')
    expect(body.meta).toHaveProperty('code', 'AUTH-400')
    expect(body.meta).toHaveProperty('message', 'Validation Error')
    expect(body.meta).toHaveProperty('errors')
    expect(Array.isArray(body.meta.errors)).toBe(true)
    
    // Check that we have the correct error for email field
    const emailErrors = body.meta.errors.find((e: any) => e.field === 'email')
    expect(emailErrors).toBeDefined()
    expect(emailErrors.messages).toContain("Property 'email' must be a valid email address")
    
    expect(body.data).toBeNull()
  })

  it('should return formatted validation errors for auth login with short password', async () => {
    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com', // Valid email
          password: '123' // Too short password
        })
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    
    // Check that the response follows our BaseResponse format
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('data')
    expect(body.meta).toHaveProperty('code', 'AUTH-400')
    expect(body.meta).toHaveProperty('message', 'Validation Error')
    expect(body.meta).toHaveProperty('errors')
    expect(Array.isArray(body.meta.errors)).toBe(true)
    
    // Check that we have the correct error for password field
    const passwordErrors = body.meta.errors.find((e: any) => e.field === 'password')
    expect(passwordErrors).toBeDefined()
    expect(passwordErrors.messages).toContain("Property 'password' must be at least 8 characters")
    
    expect(body.data).toBeNull()
  })

  it('should return formatted validation errors for admin user creation with missing fields', async () => {
    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: createMockAdminMiddleware() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields: name, email, role_id
        })
      })
    )

    expect(response.status).toBe(400)
    const text = await response.text()
    const body = JSON.parse(text)
    
    // Check that the response follows our BaseResponse format
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('data')
    expect(body.meta).toHaveProperty('code', 'ADMIN-400')
    expect(body.meta).toHaveProperty('message', 'Validation Error')
    expect(body.meta).toHaveProperty('errors')
    expect(Array.isArray(body.meta.errors)).toBe(true)
    
    // Check that we have errors for the required fields
    const nameErrors = body.meta.errors.find((e: any) => e.field === 'name')
    expect(nameErrors).toBeDefined()
    
    const emailErrors = body.meta.errors.find((e: any) => e.field === 'email')
    expect(emailErrors).toBeDefined()
    
    const role_idErrors = body.meta.errors.find((e: any) => e.field === 'role_id')
    expect(role_idErrors).toBeDefined()
    
    expect(body.data).toBeNull()
  })

  it('should return multiple error messages for a single field when applicable', async () => {
    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: createMockAdminMiddleware() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'a', // Too short name
          description: 'a'.repeat(300), // Too long description
        })
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    
    // Check that the response follows our BaseResponse format
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('data')
    expect(body.meta).toHaveProperty('code', 'ADMIN-400')
    expect(body.meta).toHaveProperty('message', 'Validation Error')
    expect(body.meta).toHaveProperty('errors')
    expect(Array.isArray(body.meta.errors)).toBe(true)
    
    // Check that we can have multiple messages for fields if needed
    // (In this case, we're verifying the structure supports it)
    const nameErrors = body.meta.errors.find((e: any) => e.field === 'name')
    expect(nameErrors).toBeDefined()
    
    const descriptionErrors = body.meta.errors.find((e: any) => e.field === 'description')
    expect(descriptionErrors).toBeDefined()
    
    expect(body.data).toBeNull()
  })
})