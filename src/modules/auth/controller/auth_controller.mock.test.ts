import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAuthController } from './auth_controller'
import { AuthService } from '../services/auth_service'
import { AuditContext } from '../../audit/middleware/audit_middleware'

// Mock Prisma client with Bun.mock
const mockPrisma = {
  user: {
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
  },
  role: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  $on: mock(() => Promise.resolve({})),
  $connect: mock(() => Promise.resolve({})),
  $disconnect: mock(() => Promise.resolve({})),
  $executeRaw: mock(() => Promise.resolve({})),
  $queryRaw: mock(() => Promise.resolve({})),
  $transaction: mock(() => Promise.resolve({})),
  $use: mock(() => Promise.resolve({})),
} as unknown as PrismaClient

// Create a mock auth service
const mockAuthService = new AuthService(mockPrisma)

// Create mock JWT implementations
const mockAdminAccessToken = {
  sign: mock(() => Promise.resolve('mock-access-token')),
  verify: mock(() => Promise.resolve({ 
    id: '1', 
    email: 'test@example.com', 
    name: 'Test User',
    role: {
      name: 'admin',
      permissions: ['admins.read', 'admins.create']
    }
  }))
}

const mockAdminRefreshToken = {
  sign: mock(() => Promise.resolve('mock-refresh-token')),
  verify: mock(() => Promise.resolve({}))
}

// Create mock JWT plugins that return properly structured Elysia plugins
const createMockAdminAccessTokenPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ adminAccessToken: mockAdminAccessToken }))
}

const createMockAdminRefreshTokenPlugin = () => {
  return (app: Elysia) => app.derive(() => ({ adminRefreshToken: mockAdminRefreshToken }))
}

// Mock auditMiddleware to bypass actual audit functionality
const mockAuditMiddleware = (app: Elysia) => {
  return app
    .derive(() => {
      // Mock audit context
      const auditContext: AuditContext = {
        actionRecorded: false,
        initialAction: null,
        changes: [],
        rollbackPending: false,
      };

      // Mock audit tools with new enhanced API
      const auditTools = {
        recordStartAction: (action: string) => {
          if (!auditContext.actionRecorded) {
            auditContext.initialAction = action;
            auditContext.actionRecorded = true;
          }
        },
        recordChange: (table_name: string, old_value?: any, new_value?: any) => {
          const change = {
            table_name,
            old_value,
            new_value
          };
          auditContext.changes.push(change);
        },
        markForRollback: () => {
          auditContext.rollbackPending = true;
        },
        flushAudit: async () => {
          return null;
        },
        getAuditChanges: () => {
          return auditContext.changes.length > 0 ? [...auditContext.changes] : null;
        },
      };

      return {
        auditContext,
        auditTools,
      };
    });
}

describe('AuthController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Since Bun doesn't have a direct equivalent of vi.clearAllMocks(),
    // we'll just continue using the mocks as-is for now.
    // The tests should properly manage their own mocks.
  })

  it('should login successfully with valid credentials', async () => {
    // Mock the login method to return a successful response
    const originalLogin = mockAuthService.login;
    const mockResult = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        role_id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: '1',
          name: 'admin',
          description: null,
          permissions: JSON.stringify(['admins.read', 'admins.create']),
          created_at: new Date(),
          updated_at: new Date()
        }
      }
    };
    mockAuthService.login = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any,
        auditMiddleware: mockAuditMiddleware as any
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
    
    // Restore the original method
    mockAuthService.login = originalLogin;
  })

  it('should return 401 for invalid credentials', async () => {
    // Mock the login method to return an error
    const originalLogin = mockAuthService.login;
    mockAuthService.login = mock(() => Promise.resolve({ error: 'Invalid credentials' })) as any;

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any,
        auditMiddleware: mockAuditMiddleware as any
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
    
    // Restore the original method
    mockAuthService.login = originalLogin;
  })

  it('should refresh token successfully with valid refresh token', async () => {
    // Mock the refresh token verification to return a payload
    const originalVerify = mockAdminRefreshToken.verify;
    mockAdminRefreshToken.verify = mock(() => Promise.resolve({ 
      id: '1', 
      email: 'test@example.com'
    })) as any;

    // Mock the refreshAccessToken method to return a user
    const originalRefreshAccessToken = mockAuthService.refreshAccessToken;
    const mockResult = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        role_id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        role: {
          id: '1',
          name: 'admin',
          description: null,
          permissions: JSON.stringify(['admins.read', 'admins.create']),
          created_at: new Date(),
          updated_at: new Date()
        }
      }
    };
    mockAuthService.refreshAccessToken = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any,
        auditMiddleware: mockAuditMiddleware as any
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
    
    // Restore the original methods
    mockAdminRefreshToken.verify = originalVerify;
    mockAuthService.refreshAccessToken = originalRefreshAccessToken;
  })

  it('should return 401 for invalid refresh token', async () => {
    // Mock the refresh token verification to return null (invalid token)
    const originalVerify = mockAdminRefreshToken.verify;
    mockAdminRefreshToken.verify = mock(() => Promise.resolve(null)) as any;

    const app = new Elysia()
      .use(createAuthController({ 
        service: mockAuthService,
        adminAccessTokenPlugin: createMockAdminAccessTokenPlugin() as any,
        adminRefreshTokenPlugin: createMockAdminRefreshTokenPlugin() as any,
        auditMiddleware: mockAuditMiddleware as any
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
    
    // Restore the original method
    mockAdminRefreshToken.verify = originalVerify;
  })
})