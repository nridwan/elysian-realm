import type { LayoutLoad } from './$types';
import { initializeAuth } from '$lib/state/auth.state.svelte';

export const load: LayoutLoad = async ({ url }) => {
  // Initialize auth state when the app loads
  await initializeAuth();
  
  return {
    url: url.pathname
  };
};