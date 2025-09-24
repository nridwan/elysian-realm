<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStateStore } from '$lib/state/auth.state.svelte';
  import PasskeyRegistration from '$lib/components/passkey/PasskeyRegistration.svelte';

  // Redirect to login if not authenticated
  onMount(() => {
    if (!authStateStore.isAuthenticated) {
      goto('/auth/login');
    }
  });
</script>

<svelte:head>
  <title>Register Passkey - {import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
  <div class="w-full max-w-md">
    <PasskeyRegistration />
    
    <div class="text-center mt-6">
      <button 
        class="btn btn-ghost" 
        onclick={() => goto('/')}
      >
        Back to Dashboard
      </button>
    </div>
  </div>
</div>