import { PrismaClient } from '@prisma/client'
import { AuthService } from './auth_service'

// Create a single instance of PrismaClient for the application
export const prisma = new PrismaClient()

// Create and export the AuthService instance
export const authService = new AuthService(prisma)