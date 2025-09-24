<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { v4 } from 'uuid';
  import { login, authStateStore, authenticateWithTokens } from '$lib/state/auth.state.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { authenticateWithPasskeyPasswordless } from '$lib/datasource/passkey.datasource';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let showPasskeyOption = $state(false);

  // Check if WebAuthn is supported
  let isWebAuthnSupported = $state(false);
  
  onMount(() => {
    if (authStateStore.isAuthenticated) {
      goto('/');
    }
    
    isWebAuthnSupported = !!window.PublicKeyCredential;
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect to dashboard or previous page
        goto('/');
      } else {
        error = result.error || 'Login failed';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handlePasskeyLogin() {
    isLoading = true;
    error = null;

    try {
      const result = await authenticateWithPasskeyPasswordless(v4());
      
      if (result?.access_token && result?.refresh_token) {
        // Update auth state using the new authenticateWithTokens function
        const authResult = await authenticateWithTokens(result.access_token, result.refresh_token);
        
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

  async function handleRegisterPasskey() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }
    
    isLoading = true;
    error = null;

    try {
      // For now, we'll redirect to a passkey registration page
      // In a more complete implementation, we would show a registration modal
      goto('/auth/passkey/register');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to register passkey';
      console.error('Passkey registration error:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - {import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md shadow-xl bg-base-100">
    <div class="card-body">
      <div class="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div class="text-center mb-6">
        <div class="flex justify-center mb-4">
          <div class="bg-primary w-16 h-16 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl font-bold">Welcome Back</h2>
        <p class="text-base-content/70">Sign in to your account</p>
      </div>
      
      {#if error}
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}
      
      {#if showPasskeyOption}
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">Enhance Your Security</h3>
            <div class="text-xs">You don't have any passkeys registered yet. Would you like to register one now?</div>
          </div>
          <div class="flex-none">
            <button 
              class="btn btn-sm btn-ghost" 
              onclick={handleRegisterPasskey}
              disabled={isLoading}
            >
              Register Passkey
            </button>
          </div>
        </div>
      {/if}
      
      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="form-control">
          <label class="label" for="email">
            <span class="label-text">Email Address</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="email@example.com"
            class="input input-bordered w-full"
            bind:value={email}
            required
            disabled={isLoading}
          />
        </div>
        
        <div class="form-control">
          <label class="label" for="password">
            <span class="label-text">Password</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            class="input input-bordered w-full"
            bind:value={password}
            required
            disabled={isLoading}
          />
        </div>
        
        <div class="form-control mt-6">
          <button 
            class="btn btn-primary w-full mb-4" 
            type="submit"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Signing in...
            {:else}
              Sign In
            {/if}
          </button>
          
          {#if isWebAuthnSupported}
            <div class="divider">OR</div>
            
            <button 
              type="button"
              class="btn btn-outline w-full" 
              onclick={handlePasskeyLogin}
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="loading loading-spinner loading-sm mr-2"></span>
                Authenticating...
              {:else}
                Sign In with Passkey
              {/if}
            </button>
          {/if}
        </div>
      </form>
    </div>
  </div>
</div>