import { describe, it, expect, mock } from 'bun:test'
import { PrismaClient } from '@prisma/client'
import { AdminService } from './admin_service'

// Mock Prisma client with Bun.mock
const mockPrisma = {
  user: {
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

describe('AdminService - Logic Tests', () => {
  it('should have AdminService class', () => {
    const service = new AdminService(mockPrisma)
    expect(service).toBeInstanceOf(AdminService)
  })

  it('should have all required methods', () => {
    const service = new AdminService(mockPrisma)
    
    expect(typeof service.getUsers).toBe('function')
    expect(typeof service.getUserById).toBe('function')
    expect(typeof service.updateUser).toBe('function')
    expect(typeof service.deleteUser).toBe('function')
    expect(typeof service.getRoles).toBe('function')
    expect(typeof service.getRole).toBe('function')
    expect(typeof service.createRole).toBe('function')
    expect(typeof service.updateRole).toBe('function')
    expect(typeof service.deleteRole).toBe('function')
    expect(typeof service.getAllAvailablePermissions).toBe('function')
  })

  it('should be able to create instances with required dependencies', () => {
    // This test verifies we can instantiate the service with its dependencies
    expect(() => new AdminService(mockPrisma)).not.toThrow()
  })

  it('should get role by id successfully', async () => {
    const mockRole = {
      id: 'role-1',
      name: 'admin',
      description: 'Administrator role',
      permissions: ['admins.read', 'admins.create', 'admins.update', 'admins.delete']
    }

    // Mock the findUnique method to return the mock role
    mockPrisma.role.findUnique = mock(() => Promise.resolve(mockRole)) as any

    const service = new AdminService(mockPrisma)
    const result = await service.getRole('role-1')

    expect(result).toEqual({
      ...mockRole,
      permissions: mockRole.permissions
    } as any)
  })

  it('should return null when role is not found', async () => {
    // Mock the findUnique method to return null
    mockPrisma.role.findUnique = mock(() => Promise.resolve(null)) as any

    const service = new AdminService(mockPrisma)
    const result = await service.getRole('non-existent-id')

    expect(result).toBeNull()
  })
})