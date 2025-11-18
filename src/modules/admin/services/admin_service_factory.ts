import { AdminService } from './admin_service'
import { prisma } from '../../../prisma/client'

// Create and export the AdminService instance
export const adminService = new AdminService(prisma)