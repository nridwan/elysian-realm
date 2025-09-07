<script lang="ts">
  import "../app.css";
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { authStateStore, checkAuthAndRedirect } from '$lib/state/auth.state.svelte';
  import { onMount } from 'svelte';

  let mounted = $state(false);

  // Check auth and redirect if needed
  onMount(() => {
    mounted = true;
    checkAuthAndRedirect();
  });

  let { children } = $props();
</script>

{#if authStateStore.isAuthenticated}
  <div class="flex h-screen">
    <Sidebar />
    <main class="flex-1 overflow-auto p-6 bg-base-100">
      {@render children()}
    </main>
  </div>
{:else if mounted}
  {@render children()}
{/if}