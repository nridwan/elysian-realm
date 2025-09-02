import { PrismaClient } from '@prisma/client'
import { AdminService } from './admin_service'

// Create a single instance of PrismaClient for the application
export const prisma = new PrismaClient()

// Create and export the AdminService instance
export const adminService = new AdminService(prisma)