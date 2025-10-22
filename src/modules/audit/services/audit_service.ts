import { PrismaClient, AuditTrail as PrismaAuditTrail } from '@prisma/client'
import { AuditTrailDto } from '../dto/audit_dto'

// Define the AuditTrail type to match the Prisma model
export type AuditTrail = PrismaAuditTrail

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AuditTrailData {
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_data?: any
  new_data?: any
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
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          old_data: data.old_data,
          new_data: data.new_data,
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
  ): Promise<{ audit_trails: AuditTrail[]; pagination: Pagination }> {
    const whereClause: any = {}
    
    if (filters) {
      if (filters.action) {
        whereClause.action = filters.action
      }
      if (filters.entity_type) {
        whereClause.entity_type = filters.entity_type
      }
      if (filters.user_id) {
        whereClause.user_id = filters.user_id
      }
      if (filters.start_date || filters.end_date) {
        whereClause.created_at = {}
        if (filters.start_date) {
          whereClause.created_at.gte = filters.start_date
        }
        if (filters.end_date) {
          whereClause.created_at.lte = filters.end_date
        }
      }
    }

    try {
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      })

      const total = await this.prisma.auditTrail.count({
        where: whereClause,
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
      console.error('Error getting audit trails:', error)
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

  async getAuditTrailById(id: string): Promise<AuditTrail | null> {
    try {
      const auditTrail = await this.prisma.auditTrail.findUnique({
        where: { id },
      })

      return auditTrail
    } catch (error) {
      console.error('Error getting audit trail by ID:', error)
      return null
    }
  }

  async getAuditTrailsByUserId(
    user_id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ audit_trails: AuditTrail[]; pagination: Pagination }> {
    try {
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: { user_id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
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
  ): Promise<{ audit_trails: AuditTrail[]; pagination: Pagination }> {
    try {
      const auditTrails = await this.prisma.auditTrail.findMany({
        where: { entity_type },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      })

      const total = await this.prisma.auditTrail.count({
        where: { entity_type },
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
}