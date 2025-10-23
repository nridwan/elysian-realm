import { PrismaClient, AuditTrail as PrismaAuditTrail, Admin as PrismaAdmin } from '@prisma/client'
import { AuditTrailDto } from '../dto/audit_dto'

// Define the AuditTrail type to match the Prisma model
export type AuditTrail = PrismaAuditTrail

// Define the AuditTrailWithUser type to include user information
export type AuditTrailWithUser = PrismaAuditTrail & {
  user?: Pick<PrismaAdmin, 'id' | 'email' | 'name'> | null
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AuditTrailData {
  user_id?: string
  action: string
  changes?: Array<{
    table_name: string
    old_value?: any
    new_value?: any
  }>
  ip_address?: string
  user_agent?: string
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async createAuditTrail(data: AuditTrailData): Promise<AuditTrail | null> {
    try {
      const auditTrail = await this.prisma.auditTrail.create({
        data: {
          user_id: data.user_id,
          action: data.action,
          changes: data.changes,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      })

      return auditTrail
    } catch (error) {
      console.error('Error creating audit trail:', error)
      return null
    }
  }

  async getAuditTrails(
    page: number = 1,
    limit: number = 10,
    filters?: {
      action?: string
      entity_type?: string
      user_id?: string
      start_date?: Date
      end_date?: Date
    }
  ): Promise<{ audit_trails: AuditTrailWithUser[]; pagination: Pagination }> {
    const whereClause: any = {}
    
    if (filters) {
      if (filters.action) {
        whereClause.action = filters.action
      }
      if (filters.user_id) {
        whereClause.user_id = filters.user_id
      }
      // Handle entity_type filter by searching within the changes array
      if (filters.entity_type) {
        whereClause.changes = {
          path: ['$[*].table_name'],
          equals: filters.entity_type
        }
      }
      if (filters.start_date || filters.end_date) {
        whereClause.created_at = {}
        if (filters.start_date) {
          // Parse start_date as ISO string
          whereClause.created_at.gte = new Date(filters.start_date)
        }
        if (filters.end_date) {
          // Parse end_date as ISO string
          whereClause.created_at.lte = new Date(filters.end_date)
        }
      }
    }

    try {
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        // Include user information when available
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      })

      const total = await this.prisma.auditTrail.count({
        where: whereClause,
      })

      return {
        audit_trails: auditTrails as AuditTrailWithUser[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Error getting audit trails:', error)
      return {
        audit_trails: [] as AuditTrailWithUser[],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 1,
        },
      }
    }
  }

  async getAuditTrailById(id: string): Promise<AuditTrailWithUser | null> {
    try {
      const auditTrail = await this.prisma.auditTrail.findUnique({
        where: { id },
        // Include user information when available
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      })

      return auditTrail as AuditTrailWithUser | null
    } catch (error) {
      console.error('Error getting audit trail by ID:', error)
      return null
    }
  }

  async getAuditTrailsByUserId(
    user_id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ audit_trails: AuditTrailWithUser[]; pagination: Pagination }> {
    try {
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: { user_id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        // Include user information when available
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      })

      const total = await this.prisma.auditTrail.count({
        where: { user_id },
      })

      return {
        audit_trails: auditTrails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Error getting audit trails by user ID:', error)
      return {
        audit_trails: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 1,
        },
      }
    }
  }

  async getAuditTrailsByEntityType(
    entity_type: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ audit_trails: AuditTrailWithUser[]; pagination: Pagination }> {
    try {
      // Search for audits that contain changes for the specified entity type
      // This is done by searching within the changes array for matching table_name
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: {
          changes: { 
            path: ['$[*].table_name'],  // Search within the changes array for table_name
            equals: entity_type
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        // Include user information when available
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      })

      const total = await this.prisma.auditTrail.count({
        where: {
          changes: { 
            path: ['$[*].table_name'],  // Search within the changes array for table_name
            equals: entity_type
          }
        },
      })

      return {
        audit_trails: auditTrails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Error getting audit trails by entity type:', error)
      return {
        audit_trails: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 1,
        },
      }
    }
  }

  async markAuditAsRolledBack(id: string): Promise<AuditTrail | null> {
    try {
      const auditTrail = await this.prisma.auditTrail.update({
        where: { id },
        data: { is_rolled_back: true },
      })

      return auditTrail
    } catch (error) {
      console.error('Error marking audit as rolled back:', error)
      return null
    }
  }
}