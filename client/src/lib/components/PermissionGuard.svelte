<script lang="ts">
  import { authStateStore } from '$lib/state/auth.state.svelte';
  import { canAccessRoute, canAccessRouteByRole } from '$lib/utils/permission-guard';
	import type { Snippet } from 'svelte';

  type $Props = {
    permissions?: string[];
    roles?: string[];
    matchAllPermissions?: boolean;
    showDenied?: boolean;
    children: Snippet;
  };

  let { 
    children,
    permissions = [], 
    roles = [],
    showDenied = false, 
    matchAllPermissions = false 
  }: $Props = $props();

  let canAccess = $derived(
    authStateStore.isAuthenticated && 
    (permissions.length === 0 || canAccessRoute(permissions, matchAllPermissions)) &&
    (roles.length === 0 || canAccessRouteByRole(roles))
  );
</script>

{#if canAccess}
  {@render children()}
{:else if !authStateStore.isAuthenticated}
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h2 class="text-2xl font-bold mb-4">Authentication Required</h2>
    <p class="mb-4">Please log in to access this page.</p>
    <a href="/auth/login" class="btn btn-primary">Go to Login</a>
  </div>
{:else if showDenied}
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h2 class="text-2xl font-bold mb-4">Access Denied</h2>
    <p class="mb-4">You don't have permission to access this page.</p>
    <a href="/" class="btn btn-primary">Go to Dashboard</a>
  </div>
{/if}