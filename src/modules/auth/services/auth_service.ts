import { PrismaClient, Admin as PrismaAdmin, Role as PrismaRole } from '@prisma/client'

// Define the user type with role included
type AdminWithRole = PrismaAdmin & {
  role: PrismaRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  user?: AdminWithRole
  error?: string
}

export interface RefreshTokenResponse {
  user?: AdminWithRole
  error?: string
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login({ email, password }: LoginInput): Promise<LoginResponse> {
    // Find user
    const user = await this.prisma.admin.findUnique({
      where: { email },
      include: { role: true },
    })

    if (!user) {
      return { error: 'Invalid credentials' }
    }

    // Check password using Bun's password verification
    const isValid = await Bun.password.verify(password, user.password)
    if (!isValid) {
      return { error: 'Invalid credentials' }
    }

    return { user: user as AdminWithRole }
  }

  async refreshAccessToken(userId: string): Promise<RefreshTokenResponse> {
    try {
      // Requery the user from the database to get fresh data including role and permissions
      const user = await this.prisma.admin.findUnique({
        where: { id: userId },
        include: { role: true },
      })

      if (!user) {
        return { error: 'User not found' }
      }

      return { user: user as AdminWithRole }
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return { error: 'Failed to refresh token' }
    }
  }
}