// src/utils/password.ts
import { PrismaClient } from '@prisma/client'

/**
 * Hash a password using Bun's built-in bcrypt implementation
 * @param password The plain text password to hash
 * @param cost The bcrypt cost factor (between 4-31, default is 10)
 * @returns The hashed password
 */
export async function hashPassword(password: string, cost: number = 10): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: cost,
  });
}

/**
 * Verify a password against a hash using Bun's built-in bcrypt implementation
 * @param password The plain text password
 * @param hash The hashed password
 * @returns Whether the password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Create a user with a hashed password
 * @param prisma The Prisma client instance
 * @param userData The user data including plain text password
 * @returns The created user with hashed password
 */
export async function createUserWithHashedPassword(
  prisma: PrismaClient,
  userData: { name: string; email: string; password: string; role_id: string }
) {
  const { password, ...rest } = userData;
  const hashedPassword = await hashPassword(password);
  
  return await prisma.admin.create({
    data: {
      ...rest,
      password: hashedPassword,
    },
  });
}