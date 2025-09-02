import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAuthController } from './auth_controller'
import { AuthService } from '../services/auth_service'

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  role: {
    findUnique: vi.fn(),
  },
  $on: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
  $use: vi.fn(),
} as unknown as PrismaClient

// Create a mock auth service
const mockAuthService = new AuthService(mockPrisma)

// Create mock JWT implementations
const mockAdminAccessToken = {
  sign: vi.fn().mockResolvedValue('mock-access-token'),
  verify: vi.fn().mockResolvedValue({ 
    id: '1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: {
      name: 'admin',
      permissions: ['users.read', 'users.create']
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

describe('AuthController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should login successfully with valid credentials', async () => {
    // Mock the login method to return a successful response
    vi.spyOn(mockAuthService, 'login').mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        roleId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: '1',
          name: 'admin',
          description: null,
          permissions: JSON.stringify(['users.read', 'users.create']),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    })

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
          email: 'test@example.com',
          password: 'password123'
        })
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('AUTH-200')
    expect(body.meta.message).toBe('Login successful')
    expect(body.data).toHaveProperty('access_token')
    expect(body.data).toHaveProperty('refresh_token')
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should return 401 for invalid credentials', async () => {
    // Mock the login method to return an error
    vi.spyOn(mockAuthService, 'login').mockResolvedValue({
      error: 'Invalid credentials'
    })

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
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })
    )

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.meta.code).toBe('AUTH-401')
    expect(body.meta.message).toBe('Invalid credentials')
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
  })

  it('should refresh token successfully with valid refresh token', async () => {
    // Mock the refresh token verification to return a payload
    mockAdminRefreshToken.verify.mockResolvedValue({ 
      id: '1', 
      email: 'test@example.com'
    })

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: 'valid-refresh-token'
        })
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('AUTH-200')
    expect(body.meta.message).toBe('Token refreshed successfully')
    expect(body.data).toHaveProperty('access_token')
    expect(body.data).toHaveProperty('refresh_token')
  })

  it('should return 401 for invalid refresh token', async () => {
    // Mock the refresh token verification to return null (invalid token)
    mockAdminRefreshToken.verify.mockResolvedValue(null)

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: 'invalid-refresh-token'
        })
      })
    )

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.meta.code).toBe('AUTH-401')
    expect(body.meta.message).toBe('Invalid refresh token')
  })
})