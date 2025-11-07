import { PrismaClient, Admin as PrismaAdmin, Role as PrismaRole } from '@prisma/client'
import { PERMISSIONS, getAllPermissionStrings, getAdminPermissions, getSuperAdminPermissions } from '../permissions'
import { hashPassword } from '../../../utils/password'
import { getCurrentSpan } from '@elysiajs/opentelemetry'

// Only create custom types where we need to transform data
type RoleWithPermissions = Omit<PrismaRole, 'permissions'> & {
  permissions?: string[] // Parsed from JSON
}

type AdminWithRole = PrismaAdmin & {
  role: PrismaRole
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export class AdminService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: AdminWithRole[]; pagination: Pagination }> {
    const users = await this.prisma.admin.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { role: true },
    })

    const total = await this.prisma.admin.count()

    return {
      users: users as AdminWithRole[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string): Promise<AdminWithRole | null> {
    const user = await this.prisma.admin.findUnique({
      where: { id },
      include: { role: true },
    })

    return user as AdminWithRole | null
  }

  async updateUser(id: string, data: Partial<PrismaAdmin>): Promise<AdminWithRole | null> {
    try {
      const user = await this.prisma.admin.update({
        where: { id },
        data,
        include: { role: true },
      })

      return user as AdminWithRole
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return null
    }
  }

  async createUser(data: { name: string; email: string; password: string; role_id: string }): Promise<AdminWithRole | null> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.prisma.admin.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        return null // User already exists
      }

      // Check if the role exists
      const role = await this.prisma.role.findUnique({
        where: { id: data.role_id }
      })

      if (!role) {
        return null // Role doesn't exist
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(data.password);

      // Create the user with the hashed password
      const user = await this.prisma.admin.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role_id: data.role_id,
        },
        include: { role: true },
      })

      return user as AdminWithRole
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return null
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.prisma.admin.delete({
        where: { id },
      })
      return true
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return false
    }
  }

  async getRole(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.prisma.role.findUnique({
      where: { id }
    })

    if (!role) {
      return null
    }

    return {
      ...role,
      permissions: role.permissions ? role.permissions : []
    } as RoleWithPermissions
  }

  async getRoles(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany()
    
    // Parse permissions JSON for each role
    return roles.map(role => ({
      ...role,
      permissions: role.permissions ? role.permissions : []
    })) as RoleWithPermissions[]
  }

  async createRole(data: { name: string; description?: string; permissions?: string[] }): Promise<RoleWithPermissions | null> {
    try {
      const roleData = {
        ...data,
        permissions: data.permissions ?? undefined
      }
      
      const role = await this.prisma.role.create({
        data: roleData,
      })

      return {
        ...role,
        permissions: role.permissions ? role.permissions : []
      } as RoleWithPermissions
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return null
    }
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }): Promise<RoleWithPermissions | null> {
    try {
      const roleData = {
        ...data,
        permissions: data.permissions ?? undefined
      }
      
      const role = await this.prisma.role.update({
        where: { id },
        data: roleData,
      })

      return {
        ...role,
        permissions: role.permissions ? role.permissions : []
      } as RoleWithPermissions
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return null
    }
  }

  async deleteRole(id: string): Promise<boolean> {
    try {
      await this.prisma.role.delete({
        where: { id },
      })
      return true
    } catch (error) {
      getCurrentSpan()?.recordException(error as Error)
      return false
    }
  }
  
  // Get all available permissions in the required format
  getAllAvailablePermissions(): Record<string, string[]> {
    // Create a mutable copy of the permissions
    const mutablePermissions: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(PERMISSIONS)) {
      mutablePermissions[key] = [...value]
    }
    return mutablePermissions
  }
  
  // Get all permission strings
  getAllPermissionStrings(): string[] {
    return getAllPermissionStrings()
  }
  
  // Get super admin permissions
  getSuperAdminPermissions(): string[] {
    return getSuperAdminPermissions()
  }
  
  // Get admin permissions
  getAdminPermissions(): string[] {
    return getAdminPermissions()
  }
}