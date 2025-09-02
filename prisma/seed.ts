import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default permissions
  const permissions = await prisma.permission.createMany({
    data: [
      { name: 'read_users', description: 'Read users' },
      { name: 'write_users', description: 'Create/Update users' },
      { name: 'delete_users', description: 'Delete users' },
      { name: 'manage_roles', description: 'Manage roles' },
      { name: 'manage_permissions', description: 'Manage permissions' },
    ],
    skipDuplicates: true,
  })

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role',
    },
  })

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      description: 'Super Administrator role',
    },
  })

  // Assign permissions to roles
  // Admin role gets basic user management
  const adminPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: ['read_users', 'write_users'],
      },
    },
  })

  // Super admin gets all permissions
  const allPermissions = await prisma.permission.findMany()

  // Assign permissions to roles
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: adminPermissions.map((p) => ({ id: p.id })),
      },
    },
  })

  await prisma.role.update({
    where: { id: superAdminRole.id },
    data: {
      permissions: {
        connect: allPermissions.map((p) => ({ id: p.id })),
      },
    },
  })

  // Create super admin user
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: '$2b$10$rVvAXbLzG8tOTpSWH1H3qOq4A3QVQD7bR5gQ4H3cH2b3cH2b3cH2b', // 'password' hashed
      name: 'Super Admin',
      roleId: superAdminRole.id,
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })