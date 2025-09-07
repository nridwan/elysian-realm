import { hasPermission, hasRole } from '../state/auth.state.svelte';

// Common permissions
export const PERMISSIONS = {
  USERS: {
    READ: 'users.read',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
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
    read: () => canAccessRoute([PERMISSIONS.USERS.READ]),
    create: () => canAccessRoute([PERMISSIONS.USERS.CREATE]),
    update: () => canAccessRoute([PERMISSIONS.USERS.UPDATE]),
    delete: () => canAccessRoute([PERMISSIONS.USERS.DELETE]),
  },
  roles: {
    read: () => canAccessRoute([PERMISSIONS.ROLES.READ]),
    create: () => canAccessRoute([PERMISSIONS.ROLES.CREATE]),
    update: () => canAccessRoute([PERMISSIONS.ROLES.UPDATE]),
    delete: () => canAccessRoute([PERMISSIONS.ROLES.DELETE]),
  },
};