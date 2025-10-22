import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAdminController } from './admin_controller'
import { AdminService } from '../services/admin_service'
import { adminMiddleware } from '../middleware/admin_middleware'
import { auditMiddleware } from '../../audit/middleware/audit_middleware'

// Mock Prisma client with Bun.mock
const mockPrisma = {
  admin: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve({})),
  },
  role: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    create: mock(() => Promise.resolve({})),
  },
  $on: mock(() => Promise.resolve({})),
  $connect: mock(() => Promise.resolve({})),
  $disconnect: mock(() => Promise.resolve({})),
  $executeRaw: mock(() => Promise.resolve({})),
  $queryRaw: mock(() => Promise.resolve({})),
  $transaction: mock(() => Promise.resolve({})),
  $use: mock(() => Promise.resolve({})),
} as unknown as PrismaClient

// Create a mock admin service
const mockAdminService = new AdminService(mockPrisma)

// Create mock middleware that bypasses authentication and provides permissions
const mockAuthMiddleware = (app: Elysia) => {
  return app.derive(() => ({
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role_id: '1',
      role: {
        id: '1',
        name: 'admin',
        description: null,
        permissions: [
          'admins.read',
          'admins.create',
          'admins.update',
          'admins.delete',
          'roles.read',
          'roles.create',
          'roles.update',
          'roles.delete'
        ],
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  }))
}

describe('AdminController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Since Bun doesn't have a direct equivalent of vi.clearAllMocks(),
    // we'll just continue using the mocks as-is for now.
    // The tests should properly manage their own mocks.
  })

  it('should get admins list successfully', async () => {
    // Mock the getUsers method
    const originalGetUsers = mockAdminService.getUsers;
    const mockResult = {
      users: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test Admin',
          password: 'hashedPassword',
          role_id: '1',
          created_at: new Date(),
          updated_at: new Date(),
          role: {
            id: '1',
            name: 'admin',
            description: null,
            permissions: null,
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      }
    };
    mockAdminService.getUsers = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('ADMIN-200')
    expect(body.meta.message).toBe('Admins retrieved successfully')
    expect(body.data.data).toHaveLength(1)
    expect(body.data.total).toBe(1)
    
    // Restore the original method
    mockAdminService.getUsers = originalGetUsers;
  })

  it('should get admin by ID successfully', async () => {
    // Mock the getUserById method
    const originalGetUserById = mockAdminService.getUserById;
    const mockResult = {
      id: '1',
      email: 'test@example.com',
      name: 'Test Admin',
      password: 'hashedPassword',
      role_id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        id: '1',
        name: 'admin',
        description: null,
        permissions: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    };
    mockAdminService.getUserById = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('ADMIN-200')
    expect(body.meta.message).toBe('Admin retrieved successfully')
    expect(body.data.user.id).toBe('1')
    expect(body.data.user.email).toBe('test@example.com')
    
    // Restore the original method
    mockAdminService.getUserById = originalGetUserById;
  })

  it('should return error when admin not found', async () => {
    // Mock the getUserById method to return null
    const originalGetUserById = mockAdminService.getUserById;
    mockAdminService.getUserById = mock(() => Promise.resolve(null)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/999', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200) // The endpoint returns 200 with error object
    const body = await response.json()
    expect(body.meta.code).toBe('ADMIN-404')
    expect(body.meta.message).toBe('Admin not found')
    
    // Restore the original method
    mockAdminService.getUserById = originalGetUserById;
  })

  it('should update admin successfully', async () => {
    // Mock the updateUser method
    const originalUpdateUser = mockAdminService.updateUser;
    const mockResult = {
      id: '1',
      email: 'updated@example.com',
      name: 'Updated Admin',
      password: 'hashedPassword',
      role_id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      role: {
        id: '1',
        name: 'admin',
        description: null,
        permissions: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    };
    mockAdminService.updateUser = mock(() => Promise.resolve(mockResult)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddleware as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated Admin',
          email: 'updated@example.com'
        })
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.code).toBe('ADMIN-200')
    expect(body.meta.message).toBe('Admin updated successfully')
    expect(body.data.user.email).toBe('updated@example.com')
    
    // Restore the original method
    mockAdminService.updateUser = originalUpdateUser;
  })

  it('should deny access when admin lacks required permission', async () => {
    // Create a mock middleware that provides a user without the required permission
    const mockAuthMiddlewareWithoutPermission = (app: Elysia) => {
      return app.derive(() => ({
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role_id: '1',
          role: {
            id: '1',
            name: 'admin',
            description: null,
            permissions: ['admins.read'], // Missing 'admins.delete' permission
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      }))
    }

    // Mock the deleteUser method to return true (but it shouldn't be called due to permission denial)
    const originalDeleteUser = mockAdminService.deleteUser;
    mockAdminService.deleteUser = mock(() => Promise.resolve(true)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddlewareWithoutPermission as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddlewareWithoutPermission as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', { 
        method: 'DELETE'
      })
    )

    // Should get 403 Forbidden due to insufficient permissions
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.meta.code).toBe('PERMISSION-403')
    expect(body.meta.message).toBe('Forbidden: Insufficient permissions')
    // The service method should not be called
    
    // Restore the original method
    mockAdminService.deleteUser = originalDeleteUser;
  })
  
  it('should deny access when admin is not authenticated', async () => {
    // Create a mock middleware that provides no user
    const mockAuthMiddlewareNoUser = (app: Elysia) => {
      return app.derive(() => ({
        user: null
      }))
    }

    // Mock the deleteUser method to return true (but it shouldn't be called due to authentication failure)
    const originalDeleteUser = mockAdminService.deleteUser;
    mockAdminService.deleteUser = mock(() => Promise.resolve(true)) as any;

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddlewareNoUser as any}),
        auditMiddleware: auditMiddleware({auth: mockAuthMiddlewareNoUser as any}),
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/admins/1', { 
        method: 'DELETE'
      })
    )

    // Should get 401 Unauthorized
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.meta.code).toBe('PERMISSION-401')
    expect(body.meta.message).toBe('Unauthorized')
    // The service method should not be called
    
    // Restore the original method
    mockAdminService.deleteUser = originalDeleteUser;
  })
})