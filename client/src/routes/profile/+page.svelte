<script lang="ts">
  import { onMount } from 'svelte';
  import { authStateStore } from '$lib/state/auth.state.svelte';
  import PasskeyRegistration from '$lib/components/passkey/PasskeyRegistration.svelte';
  import PasskeyManagement from '$lib/components/passkey/PasskeyManagement.svelte';

  // Get application name from environment
  const appName = import.meta.env.VITE_APP_NAME || 'Elysian Realm';

  // Refs to access the child component methods
  let passkeyManagementRef: PasskeyManagement | undefined;

  // Redirect to login if not authenticated
  onMount(() => {
    if (!authStateStore.isAuthenticated) {
      // In a real app, you would use goto('/auth/login') here
      // But we'll just leave it as is for now since this is a protected route
    }
  });

  // Callback function to refresh passkeys after registration
  function handlePasskeyRegistered() {
    // Call the refresh method on the PasskeyManagement component
    if (passkeyManagementRef?.refresh) {
      passkeyManagementRef.refresh();
    }
  }
</script>

<svelte:head>
  <title>Profile - {appName}</title>
</svelte:head>

<div class="p-4 md:p-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold">Profile</h1>
      <p class="text-base-content/70">Manage your {appName} account settings</p>
    </div>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Account Information</h2>
        {#if authStateStore.user}
          <div class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Name</span>
              </label>
              <div class="input input-bordered w-full flex items-center">
                {authStateStore.user.name}
              </div>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <div class="input input-bordered w-full flex items-center">
                {authStateStore.user.email}
              </div>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Role</span>
              </label>
              <div class="input input-bordered w-full flex items-center">
                <span class="badge badge-ghost">
                  {authStateStore.user.role.name}
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="lg:col-span-2">
      <PasskeyRegistration onPasskeyRegistered={handlePasskeyRegistered} />
    </div>
    
    <div class="lg:col-span-2">
      <PasskeyManagement bind:this={passkeyManagementRef} />
    </div>
  </div>
</div>