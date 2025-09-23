import { describe, it, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { AuthService } from './modules/auth/services/auth_service'
import { AdminService } from './modules/admin/services/admin_service'

describe('Module Structure', () => {
  it('should have auth module with correct structure', () => {
    // Create a mock PrismaClient
    const prisma = {
      admin: {
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
    
    // This test verifies that we can instantiate the auth service
    const authService = new AuthService(prisma)
    expect(authService).toBeInstanceOf(AuthService)
  })

  it('should have admin module with correct structure', () => {
    // Create a mock PrismaClient
    const prisma = {
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
    
    // This test verifies that we can instantiate the admin service
    const adminService = new AdminService(prisma)
    expect(adminService).toBeInstanceOf(AdminService)
  })

  it('should be able to mock auth service methods', async () => {
    // Mock Bun.password.verify
    global.Bun = {
      password: {
        verify: vi.fn().mockResolvedValue(true),
      },
    } as any;
    
    // Create a mock PrismaClient
    const prisma = {
      admin: {
        findUnique: vi.fn(),
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
    
    const authService = new AuthService(prisma)
    
    // Mock the login method
    prisma.admin.findUnique = vi.fn().mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: '$2b$10$hashedPassword', // Properly hashed password
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
    }) as any
    
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
        findMany: vi.fn(),
        count: vi.fn(),
      },
      role: {
        findMany: vi.fn(),
      },
      $on: vi.fn(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $executeRaw: vi.fn(),
      $queryRaw: vi.fn(),
      $transaction: vi.fn(),
      $use: vi.fn(),
    } as unknown as PrismaClient
    
    const adminService = new AdminService(prisma)
    
    // Mock the getUsers method
    prisma.admin.findMany = vi.fn().mockResolvedValue([
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
    ]) as any
    
    prisma.admin.count = vi.fn().mockResolvedValue(1) as any
    
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