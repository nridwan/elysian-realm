import { describe, it, expect, vi } from 'vitest'
import { AuthService } from './auth_service'

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

describe('AuthService - Logic Tests', () => {
  it('should have AuthService class', () => {
    const service = new AuthService(mockPrisma)
    expect(service).toBeInstanceOf(AuthService)
  })

  it('should have login method', () => {
    const service = new AuthService(mockPrisma)
    expect(typeof service.login).toBe('function')
  })

  it('should have register method', () => {
    const service = new AuthService(mockPrisma)
    expect(typeof service.register).toBe('function')
  })

  it('should be able to create instances with required dependencies', () => {
    // This test verifies we can instantiate the service with its dependencies
    expect(() => new AuthService(mockPrisma)).not.toThrow()
  })
})