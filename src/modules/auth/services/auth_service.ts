import { PrismaClient } from '@prisma/client'
import { compareSync, hashSync } from 'bcrypt'
import { JWTPayload } from '../../../plugins/jwt'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token?: string
  error?: string
}

export interface IPrismaClient {
  user: {
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
  }
  role: {
    findUnique: (args: any) => Promise<any>
  }
}

export class AuthService {
  constructor(private prisma: IPrismaClient) {}

  async login({ email, password }: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    })

    if (!user) {
      return { error: 'Invalid credentials' }
    }

    // Check password
    const isValid = compareSync(password, user.password)
    if (!isValid) {
      return { error: 'Invalid credentials' }
    }

    return { token: `${user.id}|${user.email}|${user.role.name}` } // Placeholder for JWT token
  }

  async register({ email, password, name }: RegisterInput): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: 'User already exists' }
    }

    // Hash password
    const hashedPassword = hashSync(password, 10)

    // Get default role (admin)
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'admin' },
    })

    if (!defaultRole) {
      return { error: 'Default role not found' }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: defaultRole.id,
      },
      include: { role: { include: { permissions: true } } },
    })

    return { token: `${user.id}|${user.email}|${user.role.name}` } // Placeholder for JWT token
  }
}