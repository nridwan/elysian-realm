import { prisma } from '../../../prisma/client'
import { PasskeyService } from './passkey_service'

// Create and export the PasskeyService instance
export const passkeyService = new PasskeyService(prisma)