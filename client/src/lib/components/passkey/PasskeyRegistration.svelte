<script lang="ts">
  import { onMount } from 'svelte';
  import { registerPasskey } from '$lib/datasource/passkey.datasource';
  import { authStateStore } from '$lib/state/auth.state.svelte';

  // Define prop for callback function using Svelte 5 runes
  interface Props {
    onPasskeyRegistered?: () => void;
  }
  let { onPasskeyRegistered }: Props = $props();

  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);
  let passkeyName = $state('');
  
  // Get application name from environment
  const appName = import.meta.env.VITE_APP_NAME || 'Elysian Realm';

  async function handleRegisterPasskey() {
    if (!authStateStore.user?.email) return;
    
    isLoading = true;
    error = null;
    success = false;

    try {
      await registerPasskey(authStateStore.user.email, passkeyName || undefined, undefined);
      success = true;
      // Call the callback function if provided
      if (onPasskeyRegistered) {
        onPasskeyRegistered();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to register passkey';
      console.error('Passkey registration error:', err);
    } finally {
      isLoading = false;
    }
  }

  // Check if WebAuthn is supported
  let isWebAuthnSupported = $state(false);
  
  onMount(() => {
    isWebAuthnSupported = !!window.PublicKeyCredential;
  });
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Register Passkey</h2>
    <p class="text-base-content/70">
      Register a passkey to sign in to {appName} without needing to remember passwords.
    </p>
    
    {#if !isWebAuthnSupported}
      <div class="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Passkeys are not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.</span>
      </div>
    {/if}
    
    {#if success}
      <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Passkey registered successfully!</span>
      </div>
    {/if}
    
    {#if error}
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    {/if}
    
    <!-- Passkey name input field -->
    <div class="form-control">
      <div class="label">
        <span class="label-text">Passkey Name (Optional)</span>
      </div>
      <input 
        type="text" 
        class="input input-bordered"
        placeholder="e.g., My Phone, Work Laptop"
        bind:value={passkeyName}
        maxlength="100"
      />
      <div class="label">
        <span class="label-text-alt">Enter a name to identify this passkey</span>
      </div>
    </div>
    
    <div class="card-actions justify-end">
      <button 
        class="btn btn-primary" 
        onclick={handleRegisterPasskey}
        disabled={isLoading || !isWebAuthnSupported}
      >
        {#if isLoading}
          <span class="loading loading-spinner loading-sm mr-2"></span>
          Registering...
        {:else}
          Register Passkey
        {/if}
      </button>
    </div>
  </div>
</div>