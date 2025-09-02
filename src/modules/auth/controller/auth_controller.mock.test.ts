import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Elysia } from 'elysia'
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
}

// Create a mock auth service
const mockAuthService = new AuthService(mockPrisma)

// Create a mock JWT implementation
const mockJwt = {
  sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  verify: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com', role: 'admin' })
}

// Create a mock JWT plugin that returns a properly structured Elysia plugin
const createMockJwtPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ jwt: mockJwt }))
}

describe('AuthController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should login successfully with valid credentials', async () => {
    // Mock the login method to return a successful response
    vi.spyOn(mockAuthService, 'login').mockResolvedValue({
      token: '1|test@example.com|admin'
    })

    const app = new Elysia()
      .use(createMockJwtPlugin())
      .use(createAuthController({ 
        service: mockAuthService
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
    expect(body).toHaveProperty('token')
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
      .use(createMockJwtPlugin())
      .use(createAuthController({ 
        service: mockAuthService
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
    expect(body).toHaveProperty('error', 'Invalid credentials')
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
  })

  it('should register successfully with valid data', async () => {
    // Mock the register method to return a successful response
    vi.spyOn(mockAuthService, 'register').mockResolvedValue({
      token: '1|test@example.com|admin'
    })

    const app = new Elysia()
      .use(createMockJwtPlugin())
      .use(createAuthController({ 
        service: mockAuthService
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('token')
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    })
  })

  it('should return 400 when user already exists', async () => {
    // Mock the register method to return an error
    vi.spyOn(mockAuthService, 'register').mockResolvedValue({
      error: 'User already exists'
    })

    const app = new Elysia()
      .use(createMockJwtPlugin())
      .use(createAuthController({ 
        service: mockAuthService
      }))

    const response = await app.handle(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        })
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error', 'User already exists')
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Existing User'
    })
  })
})