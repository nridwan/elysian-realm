<script lang="ts">
  import { onMount } from 'svelte';
  import * as usersDatasource from '$lib/datasource/users.datasource';
  import * as rolesDatasource from '$lib/datasource/roles.datasource';
  import PermissionGuard from '$lib/components/PermissionGuard.svelte';

  let users = $state<usersDatasource.User[]>([]);
  let roles = $state<rolesDatasource.Role[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedUser = $state<usersDatasource.User | null>(null);
  let newUser = $state<usersDatasource.CreateUserRequest>({ name: '', email: '', role_id: '' });
  let editingUser = $state<Partial<usersDatasource.UpdateUserRequest>>({ name: '', email: '', role_id: '' });

  onMount(async () => {
    await Promise.all([loadUsers(), loadRoles()]);
  });

  async function loadUsers() {
    try {
      loading = true;
      error = null;
      
      const response = await usersDatasource.getUsers();
      users = response.data;
    } catch (err) {
      error = 'Failed to load users';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function loadRoles() {
    try {
      const response = await rolesDatasource.getRoles();
      roles = response.roles;
    } catch (err) {
      console.error('Failed to load roles for user form', err);
    }
  }

  async function handleCreateUser(event: Event) {
    event.preventDefault();
    try {
      await usersDatasource.createUser(newUser);
      await loadUsers();
      showCreateModal = false;
      newUser = { name: '', email: '', role_id: '' };
    } catch (err) {
      error = 'Failed to create user';
      console.error(err);
    }
  }

  function openEditModal(user: usersDatasource.User) {
    selectedUser = user;
    editingUser = { 
      name: user.name, 
      email: user.email, 
      role_id: user.role_id 
    };
    showEditModal = true;
  }

  async function handleUpdateUser(event: Event) {
    event.preventDefault();
    if (!selectedUser) return;
    
    try {
      // Convert to proper UpdateUserRequest type
      const updateRequest: usersDatasource.UpdateUserRequest = {};
      if (editingUser.name !== undefined) updateRequest.name = editingUser.name;
      if (editingUser.email !== undefined) updateRequest.email = editingUser.email;
      if (editingUser.role_id !== undefined) updateRequest.role_id = editingUser.role_id;
      
      await usersDatasource.updateUser(selectedUser.id, updateRequest);
      await loadUsers();
      showEditModal = false;
      selectedUser = null;
      editingUser = { name: '', email: '', role_id: '' };
    } catch (err) {
      error = 'Failed to update user';
      console.error(err);
    }
  }

  function openDeleteModal(user: usersDatasource.User) {
    selectedUser = user;
    showDeleteModal = true;
  }

  async function handleDeleteUser(event: Event) {
    event.preventDefault();
    if (!selectedUser) return;
    
    try {
      await usersDatasource.deleteUser(selectedUser.id);
      await loadUsers();
      showDeleteModal = false;
      selectedUser = null;
    } catch (err) {
      error = 'Failed to delete user';
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title>User Management - Elysian Realm</title>
</svelte:head>

<PermissionGuard permissions={['users.read']} showDenied>
  <div class="p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">User Management</h1>
        <p class="text-base-content/70">Manage users and their roles</p>
      </div>
      <PermissionGuard permissions={['users.create']}>
        <button class="btn btn-primary" onclick={() => showCreateModal = true}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add User
        </button>
      </PermissionGuard>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-base-200">
        <table class="table table-zebra w-full">
          <thead class="bg-base-200">
            <tr>
              <th class="normal-case">Name</th>
              <th class="normal-case">Email</th>
              <th class="normal-case">Role</th>
              <th class="normal-case text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class="hover">
                <td class="font-medium">{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <div class="badge badge-ghost badge-sm">
                    {user.role.name}
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <PermissionGuard permissions={['users.update']}>
                      <button 
                        class="btn btn-sm btn-ghost" 
                        onclick={() => openEditModal(user)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permissions={['users.delete']}>
                      <button 
                        class="btn btn-sm btn-ghost text-error" 
                        onclick={() => openDeleteModal(user)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </PermissionGuard>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="4" class="text-center py-8">
                  <div class="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p class="text-base-content/70">No users found</p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Create User Modal -->
  {#if showCreateModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleCreateUser}>
          <h3 class="font-bold text-lg">Create New User</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="user-name-create">
                <span class="label-text">Full Name</span>
              </label>
              <input 
                id="user-name-create"
                type="text" 
                placeholder="User full name" 
                class="input input-bordered w-full" 
                bind:value={newUser.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="user-email-create">
                <span class="label-text">Email Address</span>
              </label>
              <input 
                id="user-email-create"
                type="email" 
                placeholder="user@example.com" 
                class="input input-bordered w-full" 
                bind:value={newUser.email}
              />
            </div>
            <div class="form-control">
              <label class="label" for="user-role-create">
                <span class="label-text">Role</span>
              </label>
              <select id="user-role-create" class="select select-bordered w-full" bind:value={newUser.role_id}>
                <option disabled selected value="">Select a role</option>
                {#each roles as role}
                  <option value={role.id}>{role.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onclick={() => showCreateModal = false}>Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Edit User Modal -->
  {#if showEditModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleUpdateUser}>
          <h3 class="font-bold text-lg">Edit User</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="user-name-edit">
                <span class="label-text">Full Name</span>
              </label>
              <input 
                id="user-name-edit"
                type="text" 
                placeholder="User full name" 
                class="input input-bordered w-full" 
                bind:value={editingUser.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="user-email-edit">
                <span class="label-text">Email Address</span>
              </label>
              <input 
                id="user-email-edit"
                type="email" 
                placeholder="user@example.com" 
                class="input input-bordered w-full" 
                bind:value={editingUser.email}
              />
            </div>
            <div class="form-control">
              <label class="label" for="user-role-edit">
                <span class="label-text">Role</span>
              </label>
              <select id="user-role-edit" class="select select-bordered w-full" bind:value={editingUser.role_id}>
                <option disabled value="">Select a role</option>
                {#each roles as role}
                  <option value={role.id}>{role.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onclick={() => showEditModal = false}>Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Delete User Modal -->
  {#if showDeleteModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form onsubmit={handleDeleteUser}>
          <h3 class="font-bold text-lg">Delete User</h3>
          <div class="py-4">
            <div class="flex items-center gap-4 p-4 bg-warning/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-warning" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="font-medium">Are you sure?</p>
                <p class="text-sm">You're about to delete the user <span class="font-semibold">"{selectedUser?.name}"</span>. This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onclick={() => showDeleteModal = false}>Cancel</button>
            <button type="submit" class="btn btn-error">Delete</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</PermissionGuard>