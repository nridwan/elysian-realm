<script lang="ts">
  import { authStateStore, checkAuthAndRedirect } from '$lib/state/auth.state.svelte';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  // Check auth and redirect if needed
  onMount(() => {
    checkAuthAndRedirect();
  });

  // This will run on client-side navigation
  let previousPathname = '';

  // Subscribe to page changes for route protection
  $effect(() => {
    const currentPage = page;
    // Only check if the pathname has actually changed
    if (currentPage.url.pathname !== previousPathname) {
      previousPathname = currentPage.url.pathname;
      checkAuthAndRedirect();
    }
  });

  let { children } = $props();
</script>

<div class="min-h-screen bg-base-200">
  {@render children()}
</div>