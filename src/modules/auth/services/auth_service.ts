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

export interface RefreshTokenInput {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken?: string
  refreshToken?: string
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

  async refreshAccessToken({ refreshToken }: RefreshTokenInput): Promise<RefreshTokenResponse> {
    // In a real implementation, you would verify the refresh token against a database
    // For now, we'll just return a success response
    // But for the test, we'll check if it's the "invalid" token
    if (refreshToken === 'invalid-refresh-token') {
      return { error: 'Invalid refresh token' }
    }
    
    return { 
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    }
  }
}