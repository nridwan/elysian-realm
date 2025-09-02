import { PrismaClient, User as PrismaUser, Role as PrismaRole } from '@prisma/client'
import { compareSync } from 'bcrypt'

// Define the user type with role included
type UserWithRole = PrismaUser & {
  role: PrismaRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  user?: UserWithRole
  error?: string
}

export interface RefreshTokenResponse {
  user?: UserWithRole
  error?: string
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login({ email, password }: LoginInput): Promise<LoginResponse> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    if (!user) {
      return { error: 'Invalid credentials' }
    }

    // Check password
    const isValid = compareSync(password, user.password)
    if (!isValid) {
      return { error: 'Invalid credentials' }
    }

    return { user: user as UserWithRole }
  }

  async refreshAccessToken(userId: string): Promise<RefreshTokenResponse> {
    try {
      // Requery the user from the database to get fresh data including role and permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      })

      if (!user) {
        return { error: 'User not found' }
      }

      return { user: user as UserWithRole }
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return { error: 'Failed to refresh token' }
    }
  }
}