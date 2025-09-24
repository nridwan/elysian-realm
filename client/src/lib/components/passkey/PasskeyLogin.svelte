<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authenticateWithPasskeyPasswordless } from '$lib/datasource/passkey.datasource';
  import { authenticateWithTokens } from '$lib/state/auth.state.svelte';
	import { v4 } from 'uuid';

  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Get application name from environment
  const appName = import.meta.env.VITE_APP_NAME || 'Elysian Realm';

  // Check if WebAuthn is supported
  let isWebAuthnSupported = $state(false);
  
  onMount(() => {
    isWebAuthnSupported = !!window.PublicKeyCredential;
  });

  async function handlePasskeyLogin() {
    isLoading = true;
    error = null;

    try {
      // Call passwordless authentication function
      const result = await authenticateWithPasskeyPasswordless(v4());
      
      // Handle successful authentication
      if (result.data?.access_token && result.data?.refresh_token) {
        // Update auth state using the new authenticateWithTokens function
        const authResult = await authenticateWithTokens(result.data.access_token, result.data.refresh_token);
        
        if (authResult.success) {
          // Redirect to dashboard
          goto('/');
        } else {
          error = authResult.error || 'Failed to set authentication state';
        }
      } else {
        error = 'Authentication failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to authenticate with passkey';
      console.error('Passkey authentication error:', err);
    } finally {
      isLoading = false;
    }
  }

  // Fallback to email/password login
  async function handleEmailLogin() {
    // This would redirect to the regular login page
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Passkey Login - {appName}</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md shadow-xl bg-base-100">
    <div class="card-body">
      <div class="text-center mb-6">
        <div class="flex justify-center mb-4">
          <div class="bg-primary w-16 h-16 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-bold">Passkey Login</h2>
        <p class="text-base-content/70">Sign in to {appName} with your passkey</p>
      </div>
      
      {#if !isWebAuthnSupported}
        <div class="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Passkeys are not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.</span>
        </div>
      {/if}
      
      {#if error}
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}
      
      <div class="form-control mt-6">
        <button 
          class="btn btn-primary w-full mb-4" 
          onclick={handlePasskeyLogin}
          disabled={isLoading || !isWebAuthnSupported}
        >
          {#if isLoading}
            <span class="loading loading-spinner loading-sm mr-2"></span>
            Authenticating...
          {:else}
            Sign In with Passkey
          {/if}
        </button>
        
        <div class="divider">OR</div>
        
        <button 
          class="btn btn-outline w-full" 
          onclick={handleEmailLogin}
          disabled={isLoading}
        >
          Sign In with Email
        </button>
      </div>
    </div>
  </div>
</div>