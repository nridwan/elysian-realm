import { AuthService } from './auth_service'
import { prisma } from '../../../prisma/client'

// Create and export the AuthService instance
export const authService = new AuthService(prisma)