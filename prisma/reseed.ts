#!/usr/bin/env tsx
/**
 * Custom re-seeding script for updating roles with latest permissions
 * Usage: npx tsx prisma/reseed.ts
 */

import { PrismaClient } from '@prisma/client'
import { getSuperAdminPermissions } from '../src/modules/admin/permissions'

async function reseedRoles() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Updating roles with latest permissions...')
    
    // Update super admin role with latest permissions
    const superAdminRole = await prisma.role.update({
      where: { name: 'superadmin' },
      data: {
        permissions: getSuperAdminPermissions()
      }
    })
    
    console.log('Super Admin role updated successfully')
    console.log(`Permissions: ${JSON.stringify(superAdminRole.permissions as string, null, 2)}`)
    
    // Optionally, update other roles as needed
    const adminRole = await prisma.role.update({
      where: { name: 'admin' },
      data: {
        permissions: [
          "admins.read",
          "admins.create"
        ]
      }
    })
    
    console.log('Admin role updated successfully')
    console.log(`Permissions: ${JSON.stringify(adminRole.permissions as string, null, 2)}`)
    
  } catch (error) {
    console.error('Error updating roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the re-seeding function
reseedRoles()