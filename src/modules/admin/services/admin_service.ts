import { PrismaClient, User as PrismaUser, Role as PrismaRole } from '@prisma/client'
import { PERMISSIONS, getAllPermissionStrings, getAdminPermissions, getSuperAdminPermissions } from '../permissions'

// Only create custom types where we need to transform data
type RoleWithPermissions = Omit<PrismaRole, 'permissions'> & {
  permissions?: string[] // Parsed from JSON
}

type UserWithRole = PrismaUser & {
  role: PrismaRole
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: UserWithRole[]; pagination: Pagination }> {
    const users = await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { role: true },
    })

    const total = await this.prisma.user.count()

    return {
      users: users as UserWithRole[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string): Promise<UserWithRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    return user as UserWithRole | null
  }

  async updateUser(id: string, data: Partial<PrismaUser>): Promise<UserWithRole | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: { role: true },
      })

      return user as UserWithRole
    } catch (error) {
      return null
    }
  }

  async createUser(data: { name: string; email: string; role_id: string }): Promise<UserWithRole | null> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.prisma.user.findUnique({
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

      // Create the user with a placeholder password (will need to be reset)
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: 'temporary_password', // Temporary password, should be reset by user
        },
        include: { role: true },
      })

      return user as UserWithRole
    } catch (error) {
      return null
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      })
      return true
    } catch (error) {
      return false
    }
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
        permissions: data.permissions ? data.permissions : undefined
      }
      
      const role = await this.prisma.role.create({
        data: roleData,
      })

      return {
        ...role,
        permissions: role.permissions ? role.permissions : []
      } as RoleWithPermissions
    } catch (error) {
      return null
    }
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }): Promise<RoleWithPermissions | null> {
    try {
      const roleData = {
        ...data,
        permissions: data.permissions !== undefined ? data.permissions : undefined
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