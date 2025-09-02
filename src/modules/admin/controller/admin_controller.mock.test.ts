import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Elysia } from 'elysia'
import { createAdminController } from './admin_controller'
import { AdminService } from '../services/admin_service'

// Mock Prisma client
const mockPrisma = {
  user: {
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
  permission: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}

// Create a mock admin service
const mockAdminService = new AdminService(mockPrisma)

// Create mock middleware that bypasses authentication
const mockAuthMiddleware = (app: Elysia) => {
  return app.derive(() => ({
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      roleId: '1',
      role: {
        id: '1',
        name: 'admin',
        description: null,
        permissions: []
      }
    }
  }))
}

const mockAdminMiddleware = (app: Elysia) => {
  return app
}

describe('AdminController - Mocked Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('should get users list successfully', async () => {
    // Mock the getUsers method
    vi.spyOn(mockAdminService, 'getUsers').mockResolvedValue({
      users: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          roleId: '1',
          role: {
            id: '1',
            name: 'admin',
            description: null
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
        authMiddleware: mockAuthMiddleware,
        adminMiddleware: mockAdminMiddleware
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.users).toHaveLength(1)
    expect(body.pagination.total).toBe(1)
    expect(mockAdminService.getUsers).toHaveBeenCalledWith(1, 10)
  })

  it('should get user by ID successfully', async () => {
    // Mock the getUserById method
    vi.spyOn(mockAdminService, 'getUserById').mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roleId: '1',
      role: {
        id: '1',
        name: 'admin',
        description: null
      }
    })

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        authMiddleware: mockAuthMiddleware,
        adminMiddleware: mockAdminMiddleware
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users/1', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user.id).toBe('1')
    expect(body.user.email).toBe('test@example.com')
    expect(mockAdminService.getUserById).toHaveBeenCalledWith('1')
  })

  it('should return error when user not found', async () => {
    // Mock the getUserById method to return null
    vi.spyOn(mockAdminService, 'getUserById').mockResolvedValue(null)

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        authMiddleware: mockAuthMiddleware,
        adminMiddleware: mockAdminMiddleware
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users/999', { 
        method: 'GET'
      })
    )

    expect(response.status).toBe(200) // The endpoint returns 200 with error object
    const body = await response.json()
    expect(body).toHaveProperty('error', 'User not found')
    expect(mockAdminService.getUserById).toHaveBeenCalledWith('999')
  })

  it('should update user successfully', async () => {
    // Mock the updateUser method
    vi.spyOn(mockAdminService, 'updateUser').mockResolvedValue({
      id: '1',
      email: 'updated@example.com',
      name: 'Updated User',
      roleId: '1',
      role: {
        id: '1',
        name: 'admin',
        description: null
      }
    })

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        authMiddleware: mockAuthMiddleware,
        adminMiddleware: mockAdminMiddleware
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users/1', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated User',
          email: 'updated@example.com'
        })
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user.email).toBe('updated@example.com')
    expect(mockAdminService.updateUser).toHaveBeenCalledWith('1', {
      name: 'Updated User',
      email: 'updated@example.com'
    })
  })

  it('should delete user successfully', async () => {
    // Mock the deleteUser method to return true
    vi.spyOn(mockAdminService, 'deleteUser').mockResolvedValue(true)

    const app = new Elysia()
      .use(createAdminController({ 
        service: mockAdminService,
        authMiddleware: mockAuthMiddleware,
        adminMiddleware: mockAdminMiddleware
      }))

    const response = await app.handle(
      new Request('http://localhost/api/admin/users/1', { 
        method: 'DELETE'
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('message', 'User deleted successfully')
    expect(mockAdminService.deleteUser).toHaveBeenCalledWith('1')
  })
})