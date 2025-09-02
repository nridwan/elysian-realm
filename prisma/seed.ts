import { PrismaClient } from '@prisma/client'
import { getAdminPermissions, getSuperAdminPermissions } from '../src/modules/admin/permissions'

const prisma = new PrismaClient()

async function seedRolesAndUsers() {
  console.log('Seeding roles and users...')

  // Create default roles with permissions as JSON array
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role',
      permissions: getAdminPermissions()
    },
  })

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {
      // Update super admin permissions to ensure they have the latest permissions
      permissions: getSuperAdminPermissions()
    },
    create: {
      name: 'superadmin',
      description: 'Super Administrator role',
      permissions: getSuperAdminPermissions()
    },
  })

  // Create super admin user
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: '$2a$12$gQkFcBZFwyy6uEU6QDj8EOcQZfE1frPF5nLZSPfjfTLKltY3Hwo0y', // 'password' hashed
      name: 'Super Admin',
      roleId: superAdminRole.id,
    },
  })

  console.log('Seed data created/updated successfully')
  console.log(`Admin role: ${adminRole.name}`)
  console.log(`Super Admin role: ${superAdminRole.name}`)
  console.log(`Super Admin user: ${superAdminUser.email}`)
}

async function main() {
  try {
    await seedRolesAndUsers()
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

// Export the seeding function for use in custom scripts
export { seedRolesAndUsers }

main()