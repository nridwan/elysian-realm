import { PrismaClient } from '@prisma/client'
import { AuditService } from './audit_service'

// Create a single instance of PrismaClient for the application
export const prisma = new PrismaClient()

// Create and export the AuditService instance
export const auditService = new AuditService(prisma)