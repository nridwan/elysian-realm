import { describe, it, expect, vi } from 'vitest'
import { AuthService } from './modules/auth/services/auth_service'
import { AdminService } from './modules/admin/services/admin_service'
import { compareSync } from 'bcrypt'

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compareSync: vi.fn().mockReturnValue(true),
  hashSync: vi.fn().mockReturnValue('hashedPassword')
}))

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  role: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
  permission: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}

describe('Module Structure', () => {
  it('should have auth module with correct structure', () => {
    // This test verifies that we can instantiate the auth service
    const authService = new AuthService(mockPrisma)
    expect(authService).toBeInstanceOf(AuthService)
  })

  it('should have admin module with correct structure', () => {
    // This test verifies that we can instantiate the admin service
    const adminService = new AdminService(mockPrisma)
    expect(adminService).toBeInstanceOf(AdminService)
  })

  it('should be able to mock auth service methods', async () => {
    const authService = new AuthService(mockPrisma)
    
    // Mock the login method
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: { name: 'admin' }
    })
    
    const result = await authService.login({ email: 'test@example.com', password: 'password' })
    expect(result).toHaveProperty('token')
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { role: { include: { permissions: true } } },
    })
  })

  it('should be able to mock admin service methods', async () => {
    const adminService = new AdminService(mockPrisma)
    
    // Mock the getUsers method
    mockPrisma.user.findMany.mockResolvedValue([
      { id: '1', email: 'test@example.com', name: 'Test User', roleId: '1', role: { id: '1', name: 'admin', description: null } }
    ])
    mockPrisma.user.count.mockResolvedValue(1)
    
    const result = await adminService.getUsers(1, 10)
    expect(result.users).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      include: { role: true },
    })
  })
})