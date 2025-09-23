import { hasPermission, hasRole } from '../state/auth.state.svelte';

// Common permissions
export const PERMISSIONS = {
  ADMINS: {
    READ: 'admins.read',
    CREATE: 'admins.create',
    UPDATE: 'admins.update',
    DELETE: 'admins.delete',
  },
  ROLES: {
    READ: 'roles.read',
    CREATE: 'roles.create',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },
};

// Check if user has any of the required permissions
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(permission));
}

// Check if user has all of the required permissions
export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(permission));
}

// Guard for protecting routes based on permissions
export function canAccessRoute(requiredPermissions: string[], matchAll: boolean = false): boolean {
  if (!requiredPermissions.length) {
    return true; // No permissions required
  }
  
  if (matchAll) {
    return hasAllPermissions(requiredPermissions);
  } else {
    return hasAnyPermission(requiredPermissions);
  }
}

// Guard for protecting routes based on roles
export function canAccessRouteByRole(allowedRoles: string[]): boolean {
  if (!allowedRoles.length) {
    return true; // No roles required
  }
  
  return allowedRoles.some(role => hasRole(role));
}

// Predefined route guards
export const routeGuards = {
  admin: () => hasRole('Super Admin') || hasRole('Administrator'),
  users: {
    read: () => canAccessRoute([PERMISSIONS.ADMINS.READ]),
    create: () => canAccessRoute([PERMISSIONS.ADMINS.CREATE]),
    update: () => canAccessRoute([PERMISSIONS.ADMINS.UPDATE]),
    delete: () => canAccessRoute([PERMISSIONS.ADMINS.DELETE]),
  },
  roles: {
    read: () => canAccessRoute([PERMISSIONS.ROLES.READ]),
    create: () => canAccessRoute([PERMISSIONS.ROLES.CREATE]),
    update: () => canAccessRoute([PERMISSIONS.ROLES.UPDATE]),
    delete: () => canAccessRoute([PERMISSIONS.ROLES.DELETE]),
  },
};