import { describe, it, expect, mock } from 'bun:test'
import { PrismaClient } from '@prisma/client'
import { AuthService } from './auth_service'

// Mock Prisma client with Bun.mock
const mockPrisma = {
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

describe('AuthService - Logic Tests', () => {
  it('should have AuthService class', () => {
    const service = new AuthService(mockPrisma)
    expect(service).toBeInstanceOf(AuthService)
  })

  it('should have login method', () => {
    const service = new AuthService(mockPrisma)
    expect(typeof service.login).toBe('function')
  })

  it('should have refreshAccessToken method', () => {
    const service = new AuthService(mockPrisma)
    expect(typeof service.refreshAccessToken).toBe('function')
  })

  it('should be able to create instances with required dependencies', () => {
    // This test verifies we can instantiate the service with its dependencies
    expect(() => new AuthService(mockPrisma)).not.toThrow()
  })

  describe('refreshAccessToken', () => {
    it('should return user data when user exists', async () => {
      // Mock the Prisma client to return a user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: {
          id: 'role-id',
          name: 'admin',
          description: 'Administrator role',
          permissions: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.admin.findUnique = mock(() => Promise.resolve(mockUser)) as any;

      const service = new AuthService(mockPrisma)
      const result = await service.refreshAccessToken('test-user-id')
      
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com',
        })
      })
    })

    it('should return error when user does not exist', async () => {
      // Mock the Prisma client to return null (user not found)
      mockPrisma.admin.findUnique = mock(() => Promise.resolve(null)) as any;

      const service = new AuthService(mockPrisma)
      const result = await service.refreshAccessToken('non-existent-user-id')
      
      expect(result).toEqual({
        error: 'User not found'
      })
    })
  })
})