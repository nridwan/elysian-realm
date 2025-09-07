<script lang="ts">
  import { authStateStore } from '$lib/state/auth.state.svelte';
</script>

<svelte:head>
  <title>Dashboard - Elysian Realm</title>
</svelte:head>

<div class="p-4">
  <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
  
  {#if authStateStore.user}
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">Welcome, {authStateStore.user.name}!</h2>
        <p>Email: {authStateStore.user.email}</p>
        <p>Role: {authStateStore.user.role.name}</p>
        <p>Permissions: {authStateStore.user.role.permissions.join(', ')}</p>
      </div>
    </div>
  {/if}
</div>