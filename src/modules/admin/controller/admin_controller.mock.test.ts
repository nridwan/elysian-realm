import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Elysia } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { createAdminController } from './admin_controller'
import { AdminService } from '../services/admin_service'
import { adminMiddleware } from '../middleware/admin_middleware'

// Mock Prisma client
const mockPrisma = {
  admin: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  role: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
  $on: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
  $use: vi.fn(),
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
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should get admins list successfully', async () => {
    // Mock the getUsers method
    vi.spyOn(mockAdminService, 'getUsers').mockResolvedValue({
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
    })

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any})
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
    expect(mockAdminService.getUsers).toHaveBeenCalledWith(1, 10)
  })

  it('should get admin by ID successfully', async () => {
    // Mock the getUserById method
    vi.spyOn(mockAdminService, 'getUserById').mockResolvedValue({
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
    })

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any})
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
    expect(mockAdminService.getUserById).toHaveBeenCalledWith('1')
  })

  it('should return error when admin not found', async () => {
    // Mock the getUserById method to return null
    vi.spyOn(mockAdminService, 'getUserById').mockResolvedValue(null)

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any})
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
    expect(mockAdminService.getUserById).toHaveBeenCalledWith('999')
  })

  it('should update admin successfully', async () => {
    // Mock the updateUser method
    vi.spyOn(mockAdminService, 'updateUser').mockResolvedValue({
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
    })

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddleware as any})
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
    expect(mockAdminService.updateUser).toHaveBeenCalledWith('1', {
      name: 'Updated Admin',
      email: 'updated@example.com'
    })
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
    vi.spyOn(mockAdminService, 'deleteUser').mockResolvedValue(true)

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddlewareWithoutPermission as any})
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
    expect(mockAdminService.deleteUser).not.toHaveBeenCalled()
  })
  
  it('should deny access when admin is not authenticated', async () => {
    // Create a mock middleware that provides no user
    const mockAuthMiddlewareNoUser = (app: Elysia) => {
      return app.derive(() => ({
        user: null
      }))
    }

    // Mock the deleteUser method to return true (but it shouldn't be called due to authentication failure)
    vi.spyOn(mockAdminService, 'deleteUser').mockResolvedValue(true)

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        adminMiddleware: adminMiddleware({auth: mockAuthMiddlewareNoUser as any})
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
    expect(mockAdminService.deleteUser).not.toHaveBeenCalled()
  })
})