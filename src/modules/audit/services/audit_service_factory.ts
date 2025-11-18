import { AuditService } from './audit_service'
import { prisma } from '../../../prisma/client'

// Create and export the AuditService instance
export const auditService = new AuditService(prisma)