<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { login, authStateStore } from '$lib/state/auth.state.svelte';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Redirect to dashboard if already authenticated
  onMount(() => {
    if (authStateStore.isAuthenticated) {
      goto('/');
    }
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
</script>

<svelte:head>
  <title>Login - Elysian Realm</title>
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
            class="btn btn-primary w-full" 
            type="submit"
            class:loading={isLoading}
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner"></span>
              Signing in...
            {:else}
              Sign In
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>