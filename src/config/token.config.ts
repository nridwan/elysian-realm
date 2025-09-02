import { config } from './config'

// Token configuration
export const tokenConfig = {
  accessToken: {
    expiresIn: config.token.accessTokenExpiresIn, // 5 minutes default
  },
  refreshToken: {
    expiresIn: config.token.refreshTokenExpiresIn, // 2 months default
  },
}