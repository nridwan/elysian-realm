import { prisma } from './auth_service_factory'
import { PasskeyService } from './passkey_service'

// Create and export the PasskeyService instance
export const passkeyService = new PasskeyService(prisma)