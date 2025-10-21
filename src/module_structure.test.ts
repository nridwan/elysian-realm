import { describe, it, expect, mock } from 'bun:test'
import { PrismaClient } from '@prisma/client'
import { AuthService } from './modules/auth/services/auth_service'
import { AdminService } from './modules/admin/services/admin_service'

describe('Module Structure', () => {
  it('should have auth module with correct structure', () => {
    // Create a mock PrismaClient
    const prisma = {
      admin: {
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
    
    // This test verifies that we can instantiate the auth service
    const authService = new AuthService(prisma)
    expect(authService).toBeInstanceOf(AuthService)
  })

  it('should have admin module with correct structure', () => {
    // Create a mock PrismaClient
    const prisma = {
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
    
    // This test verifies that we can instantiate the admin service
    const adminService = new AdminService(prisma)
    expect(adminService).toBeInstanceOf(AdminService)
  })

  it('should be able to mock auth service methods', async () => {
    // Create a mock PrismaClient
    const prisma = {
      admin: {
        findUnique: mock(() => Promise.resolve(null)),
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
    
    const authService = new AuthService(prisma)
    
    // Mock the login method
    prisma.admin.findUnique = mock(() => Promise.resolve({
      id: '1',
      email: 'test@example.com',
      // Use a properly formatted bcrypt hash for "password"
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // bcrypt hash of "password"
      name: 'Test User',
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
    })) as any;
    
    await authService.login({ email: 'test@example.com', password: 'password' })
    expect(prisma.admin.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { role: true },
    })
  })

  it('should be able to mock admin service methods', async () => {
    // Create a mock PrismaClient
    const prisma = {
      admin: {
        findMany: mock(() => Promise.resolve([])),
        count: mock(() => Promise.resolve(0)),
      },
      role: {
        findMany: mock(() => Promise.resolve([])),
      },
      $on: mock(() => Promise.resolve({})),
      $connect: mock(() => Promise.resolve({})),
      $disconnect: mock(() => Promise.resolve({})),
      $executeRaw: mock(() => Promise.resolve({})),
      $queryRaw: mock(() => Promise.resolve({})),
      $transaction: mock(() => Promise.resolve({})),
      $use: mock(() => Promise.resolve({})),
    } as unknown as PrismaClient
    
    const adminService = new AdminService(prisma)
    
    // Mock the getUsers method
    prisma.admin.findMany = mock(() => Promise.resolve([
      { 
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
          permissions: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      }
    ])) as any;
    
    prisma.admin.count = mock(() => Promise.resolve(1)) as any;
    
    const result = await adminService.getUsers(1, 10)
    expect(result.users).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
    expect(prisma.admin.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      include: { role: true },
    })
  })
})