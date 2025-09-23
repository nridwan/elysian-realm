// Shared permissions definition
export const PERMISSIONS = {
  admins: ["read", "create", "update", "delete"],
  roles: ["read", "create", "update", "delete"]
}

// Generate all permission strings from the PERMISSIONS object
export const getAllPermissionStrings = (): string[] => {
  const permissionStrings: string[] = []
  for (const [module, actions] of Object.entries(PERMISSIONS)) {
    for (const action of actions) {
      permissionStrings.push(`${module}.${action}`)
    }
  }
  return permissionStrings
}

// Generate super admin permissions (all permissions)
export const getSuperAdminPermissions = (): string[] => {
  return getAllPermissionStrings()
}

// Generate admin permissions (limited permissions)
export const getAdminPermissions = (): string[] => {
  return [
    "admins.read",
    "admins.create"
  ]
}