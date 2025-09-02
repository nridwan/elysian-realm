import { PrismaClient } from '@prisma/client'

export interface User {
  id: string
  email: string
  name: string
  roleId: string
  role: {
    id: string
    name: string
    description: string | null
  }
}

export interface Role {
  id: string
  name: string
  description: string | null
  permissions?: {
    id: string
    name: string
    description: string | null
  }[]
}

export interface Permission {
  id: string
  name: string
  description: string | null
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface IPrismaClient {
  user: {
    findMany: (args: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    count: (args?: any) => Promise<number>
    create: (args: any) => Promise<any>
  }
  role: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
  }
  permission: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
}

export class AdminService {
  constructor(private prisma: IPrismaClient) {}

  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; pagination: Pagination }> {
    const users = await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { role: true },
    })

    const total = await this.prisma.user.count()

    return {
      users: users as User[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    return user as User | null
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: { role: true },
      })

      return user as User
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

  async getRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      include: { permissions: true },
    })

    return roles as Role[]
  }

  async createRole(data: { name: string; description?: string }): Promise<Role | null> {
    try {
      const role = await this.prisma.role.create({
        data,
      })

      return role as Role
    } catch (error) {
      return null
    }
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data,
      })

      return role as Role
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

  async getPermissions(): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany()
    return permissions as Permission[]
  }

  async createPermission(data: { name: string; description?: string }): Promise<Permission | null> {
    try {
      const permission = await this.prisma.permission.create({
        data,
      })

      return permission as Permission
    } catch (error) {
      return null
    }
  }
}