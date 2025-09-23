<script lang="ts">
  import { onMount } from 'svelte';
  import * as adminsDatasource from '$lib/datasource/users.datasource';
  import * as rolesDatasource from '$lib/datasource/roles.datasource';
  import PermissionGuard from '$lib/components/PermissionGuard.svelte';

  let admins = $state<adminsDatasource.Admin[]>([]);
  let roles = $state<rolesDatasource.Role[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedAdmin = $state<adminsDatasource.Admin | null>(null);
  let newAdmin = $state<adminsDatasource.CreateAdminRequest>({ name: '', email: '', role_id: '' });
  let editingAdmin = $state<Partial<adminsDatasource.UpdateAdminRequest>>({ name: '', email: '', role_id: '' });

  onMount(async () => {
    await Promise.all([loadAdmins(), loadRoles()]);
  });

  async function loadAdmins() {
    try {
      loading = true;
      error = null;
      
      const response = await adminsDatasource.getAdmins();
      admins = response.data;
    } catch (err) {
      error = 'Failed to load admins';
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
      console.error('Failed to load roles for admin form', err);
    }
  }

  async function handleCreateAdmin(event: Event) {
    event.preventDefault();
    try {
      await adminsDatasource.createAdmin(newAdmin);
      await loadAdmins();
      showCreateModal = false;
      newAdmin = { name: '', email: '', role_id: '' };
    } catch (err) {
      error = 'Failed to create admin';
      console.error(err);
    }
  }

  function openEditModal(admin: adminsDatasource.Admin) {
    selectedAdmin = admin;
    editingAdmin = { 
      name: admin.name, 
      email: admin.email, 
      role_id: admin.role_id 
    };
    showEditModal = true;
  }

  async function handleUpdateAdmin(event: Event) {
    event.preventDefault();
    if (!selectedAdmin) return;
    
    try {
      // Convert to proper UpdateAdminRequest type
      const updateRequest: adminsDatasource.UpdateAdminRequest = {};
      if (editingAdmin.name !== undefined) updateRequest.name = editingAdmin.name;
      if (editingAdmin.email !== undefined) updateRequest.email = editingAdmin.email;
      if (editingAdmin.role_id !== undefined) updateRequest.role_id = editingAdmin.role_id;
      
      await adminsDatasource.updateAdmin(selectedAdmin.id, updateRequest);
      await loadAdmins();
      showEditModal = false;
      selectedAdmin = null;
      editingAdmin = { name: '', email: '', role_id: '' };
    } catch (err) {
      error = 'Failed to update admin';
      console.error(err);
    }
  }

  function openDeleteModal(admin: adminsDatasource.Admin) {
    selectedAdmin = admin;
    showDeleteModal = true;
  }

  async function handleDeleteAdmin(event: Event) {
    event.preventDefault();
    if (!selectedAdmin) return;
    
    try {
      await adminsDatasource.deleteAdmin(selectedAdmin.id);
      await loadAdmins();
      showDeleteModal = false;
      selectedAdmin = null;
    } catch (err) {
      error = 'Failed to delete admin';
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title>Admin Management - Elysian Realm</title>
</svelte:head>

<PermissionGuard permissions={['admins.read']} showDenied>
  <div class="p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">Admin Management</h1>
        <p class="text-base-content/70">Manage admins and their roles</p>
      </div>
      <PermissionGuard permissions={['admins.create']}>
        <button class="btn btn-primary" onclick={() => showCreateModal = true}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Admin
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
            {#each admins as admin}
              <tr class="hover">
                <td class="font-medium">{admin.name}</td>
                <td>{admin.email}</td>
                <td>
                  <div class="badge badge-ghost badge-sm">
                    {admin.role.name}
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <PermissionGuard permissions={['admins.update']}>
                      <button 
                        class="btn btn-sm btn-ghost" 
                        onclick={() => openEditModal(admin)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permissions={['admins.delete']}>
                      <button 
                        class="btn btn-sm btn-ghost text-error" 
                        onclick={() => openDeleteModal(admin)}
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
                    <p class="text-base-content/70">No admins found</p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Create Admin Modal -->
  {#if showCreateModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleCreateAdmin}>
          <h3 class="font-bold text-lg">Create New Admin</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="admin-name-create">
                <span class="label-text">Full Name</span>
              </label>
              <input 
                id="admin-name-create"
                type="text" 
                placeholder="Admin full name" 
                class="input input-bordered w-full" 
                bind:value={newAdmin.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="admin-email-create">
                <span class="label-text">Email Address</span>
              </label>
              <input 
                id="admin-email-create"
                type="email" 
                placeholder="admin@example.com" 
                class="input input-bordered w-full" 
                bind:value={newAdmin.email}
              />
            </div>
            <div class="form-control">
              <label class="label" for="admin-role-create">
                <span class="label-text">Role</span>
              </label>
              <select id="admin-role-create" class="select select-bordered w-full" bind:value={newAdmin.role_id}>
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

  <!-- Edit Admin Modal -->
  {#if showEditModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleUpdateAdmin}>
          <h3 class="font-bold text-lg">Edit Admin</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="admin-name-edit">
                <span class="label-text">Full Name</span>
              </label>
              <input 
                id="admin-name-edit"
                type="text" 
                placeholder="Admin full name" 
                class="input input-bordered w-full" 
                bind:value={editingAdmin.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="admin-email-edit">
                <span class="label-text">Email Address</span>
              </label>
              <input 
                id="admin-email-edit"
                type="email" 
                placeholder="admin@example.com" 
                class="input input-bordered w-full" 
                bind:value={editingAdmin.email}
              />
            </div>
            <div class="form-control">
              <label class="label" for="admin-role-edit">
                <span class="label-text">Role</span>
              </label>
              <select id="admin-role-edit" class="select select-bordered w-full" bind:value={editingAdmin.role_id}>
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

  <!-- Delete Admin Modal -->
  {#if showDeleteModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form onsubmit={handleDeleteAdmin}>
          <h3 class="font-bold text-lg">Delete Admin</h3>
          <div class="py-4">
            <div class="flex items-center gap-4 p-4 bg-warning/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-warning" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="font-medium">Are you sure?</p>
                <p class="text-sm">You're about to delete the admin <span class="font-semibold">"{selectedAdmin?.name}"</span>. This action cannot be undone.</p>
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