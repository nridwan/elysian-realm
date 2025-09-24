<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserPasskeys, deletePasskey } from '$lib/datasource/passkey.datasource';

  type Passkey = {
    id: string;
    name: string | null;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
    created_at: string;
    updated_at: string;
  };

  let passkeys = $state<Passkey[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showDeleteModal = $state(false);
  let selectedPasskey = $state<Passkey | null>(null);
  
  // Get application name from environment
  const appName = import.meta.env.VITE_APP_NAME || 'Elysian Realm';

  onMount(async () => {
    await loadPasskeys();
  });

  async function loadPasskeys() {
    try {
      loading = true;
      error = null;
      
      const response = await getUserPasskeys();
      passkeys = response || [];
    } catch (err) {
      error = 'Failed to load passkeys';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function openDeleteModal(passkey: Passkey) {
    selectedPasskey = passkey;
    showDeleteModal = true;
  }

  async function handleDeletePasskey(event: Event) {
    event.preventDefault()
    if (!selectedPasskey) return;
    
    try {
      await deletePasskey(selectedPasskey.id);
      await loadPasskeys();
      showDeleteModal = false;
      selectedPasskey = null;
    } catch (err) {
      error = 'Failed to delete passkey';
      console.error(err);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  // Make refresh method available externally
  export { loadPasskeys as refresh };
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Passkey Management</h2>
    <p class="text-base-content/70">
      Manage your registered passkeys for secure authentication to {appName}.
    </p>
    
    {#if error}
      <div class="alert alert-error mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    {/if}
    
    <div class="mt-4">
      {#if loading}
        <div class="flex justify-center items-center h-32">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else if passkeys.length === 0}
        <div class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p class="text-base-content/70">You don't have any passkeys registered for {appName} yet.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Device</th>
                <th>Created</th>
                <th>Backed Up</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each passkeys as passkey}
                <tr class="hover">
                  <td>
                    <div class="font-medium">{passkey.name || 'Unnamed Passkey'}</div>
                    <div class="text-sm text-base-content/70">
                      {passkey.name ? passkey.deviceType || 'Unknown Device' : 'No name set'}
                    </div>
                  </td>
                  <td>
                    <div class="font-medium">{passkey.deviceType || 'Unknown Device'}</div>
                    <div class="text-sm text-base-content/70">
                      {passkey.transports.join(', ') || 'Unknown Transport'}
                    </div>
                  </td>
                  <td>{formatDate(passkey.created_at)}</td>
                  <td>
                    {#if passkey.backedUp}
                      <span class="badge badge-success badge-xs">Yes</span>
                    {:else}
                      <span class="badge badge-ghost badge-xs">No</span>
                    {/if}
                  </td>
                  <td class="text-right">
                    <button 
                      class="btn btn-sm btn-error btn-outline" 
                      onclick={() => openDeleteModal(passkey)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Delete Passkey Modal -->
{#if showDeleteModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <form onsubmit={handleDeletePasskey}>
        <h3 class="font-bold text-lg">Delete Passkey</h3>
        <div class="py-4">
          <div class="flex items-center gap-4 p-4 bg-warning/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-warning" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-medium">Are you sure?</p>
              <p class="text-sm">You're about to delete this passkey. You'll need to register a new one to use passkey authentication on this device for {appName}.</p>
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button type="button" class="btn" onclick={() => { showDeleteModal = false; selectedPasskey = null; }}>Cancel</button>
          <button type="submit" class="btn btn-error">Delete</button>
        </div>
      </form>
    </div>
  </div>
{/if}