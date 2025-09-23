import { goto } from "$app/navigation";
import { authStateStore, hasPermission } from "$lib/state/auth.state.svelte";

// Map of routes to required permissions following the backend format
const routePermissions: Record<string, string> = {
  // Admin Management
  '/admin/users': 'admins.read',
  '/admin/roles': 'roles.read',
};

export function checkRouteAccess(pathname: string): boolean {
  // If admin is not authenticated, redirect to login
  if (!authStateStore.isAuthenticated) {
    goto('/auth/login');
    return false;
  }
  
  // Check if this route requires specific permissions
  const requiredPermission = routePermissions[pathname];
  if (requiredPermission) {
    // Check if admin has the required permission
    if (!hasPermission(requiredPermission)) {
      // Redirect to unauthorized page or dashboard
      goto('/');
      return false;
    }
  }
  
  // Admin has access
  return true;
}