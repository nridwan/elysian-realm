<script lang="ts">
  import { onMount } from 'svelte';
  import * as rolesDatasource from '$lib/datasource/roles.datasource';
  import * as permissionsDatasource from '$lib/datasource/permissions.datasource';
  import PermissionGuard from '$lib/components/PermissionGuard.svelte';

  let roles = $state<rolesDatasource.Role[]>([]);
  let availablePermissions = $state<permissionsDatasource.AvailablePermissions>({});
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedRole = $state<rolesDatasource.Role | null>(null);
  let newRole = $state<rolesDatasource.CreateRoleRequest>({ name: '', description: '', permissions: [] });
  let editingRole = $state<Partial<rolesDatasource.UpdateRoleRequest>>({ name: '', description: '' });

  onMount(async () => {
    await Promise.all([loadRoles(), loadAvailablePermissions()]);
  });

  async function loadRoles() {
    try {
      loading = true;
      error = null;
      
      const response = await rolesDatasource.getRoles();
      roles = response.roles;
    } catch (err) {
      error = 'Failed to load roles';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function loadAvailablePermissions() {
    try {
      const response = await permissionsDatasource.getAvailablePermissions();
      availablePermissions = response.permissions;
    } catch (err) {
      console.error('Failed to load available permissions', err);
    }
  }

  async function handleCreateRole(event: Event) {
    event.preventDefault();
    try {
      await rolesDatasource.createRole(newRole);
      await loadRoles();
      showCreateModal = false;
      newRole = { name: '', description: '', permissions: [] };
    } catch (err) {
      error = 'Failed to create role';
      console.error(err);
    }
  }

  function openEditModal(role: rolesDatasource.Role) {
    selectedRole = role;
    editingRole = { 
      name: role.name, 
      description: role.description || ''
    };
    if (role.permissions) {
      editingRole.permissions = [...role.permissions];
    }
    showEditModal = true;
  }

  async function handleUpdateRole(event: Event) {
    event.preventDefault();
    if (!selectedRole) return;
    
    try {
      // Convert to proper UpdateRoleRequest type
      const updateRequest: rolesDatasource.UpdateRoleRequest = {};
      if (editingRole.name !== undefined) updateRequest.name = editingRole.name;
      if (editingRole.description !== undefined) updateRequest.description = editingRole.description;
      if (editingRole.permissions !== undefined) updateRequest.permissions = editingRole.permissions;
      
      await rolesDatasource.updateRole(selectedRole.id, updateRequest);
      await loadRoles();
      showEditModal = false;
      selectedRole = null;
      editingRole = { name: '', description: '' };
    } catch (err) {
      error = 'Failed to update role';
      console.error(err);
    }
  }

  function openDeleteModal(role: rolesDatasource.Role) {
    selectedRole = role;
    showDeleteModal = true;
  }

  async function handleDeleteRole(event: Event) {
    event.preventDefault();
    if (!selectedRole) return;
    
    try {
      await rolesDatasource.deleteRole(selectedRole.id);
      await loadRoles();
      showDeleteModal = false;
      selectedRole = null;
    } catch (err) {
      error = 'Failed to delete role';
      console.error(err);
    }
  }

  // Permission management functions
  function togglePermissionInNewRole(permission: string) {
    if (!newRole.permissions) {
      newRole.permissions = [];
    }
    
    const index = newRole.permissions.indexOf(permission);
    if (index >= 0) {
      // Remove permission
      newRole.permissions.splice(index, 1);
    } else {
      // Add permission
      newRole.permissions.push(permission);
    }
  }

  function togglePermissionInEditingRole(permission: string) {
    if (!editingRole.permissions) {
      editingRole.permissions = [];
    }
    
    const index = editingRole.permissions.indexOf(permission);
    if (index >= 0) {
      // Remove permission
      editingRole.permissions.splice(index, 1);
    } else {
      // Add permission
      editingRole.permissions.push(permission);
    }
  }

  function hasPermissionInNewRole(permission: string): boolean {
    return !!newRole.permissions && newRole.permissions.includes(permission);
  }

  function hasPermissionInEditingRole(permission: string): boolean {
    return !!editingRole.permissions && editingRole.permissions.includes(permission);
  }
</script>

<svelte:head>
  <title>Role Management - {import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</title>
</svelte:head>

<PermissionGuard permissions={['roles.read']} showDenied>
  <div class="p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">Role Management</h1>
        <p class="text-base-content/70">Manage roles and their permissions</p>
      </div>
      <PermissionGuard permissions={['roles.create']}>
        <button class="btn btn-primary" onclick={() => showCreateModal = true}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Role
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
              <th class="normal-case">Description</th>
              <th class="normal-case">Permissions</th>
              <th class="normal-case text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each roles as role}
              <tr class="hover">
                <td class="font-medium">{role.name}</td>
                <td>{role.description || 'No description'}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    {#if role.permissions && role.permissions.length > 0}
                      {#each role.permissions.slice(0, 3) as permission}
                        <span class="badge badge-sm badge-ghost">{permission}</span>
                      {/each}
                      {#if role.permissions.length > 3}
                        <span class="badge badge-sm badge-ghost">+{role.permissions.length - 3} more</span>
                      {/if}
                    {:else}
                      <span class="text-base-content/50 text-sm">No permissions</span>
                    {/if}
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <PermissionGuard permissions={['roles.update']}>
                      <button 
                        class="btn btn-sm btn-ghost" 
                        onclick={() => openEditModal(role)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permissions={['roles.delete']}>
                      <button 
                        class="btn btn-sm btn-ghost text-error" 
                        onclick={() => openDeleteModal(role)}
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
                <td colspan="3" class="text-center py-8">
                  <div class="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-base-content/70">No roles found</p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Create Role Modal -->
  {#if showCreateModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleCreateRole}>
          <h3 class="font-bold text-lg">Create New Role</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="role-name-create">
                <span class="label-text">Name</span>
              </label>
              <input 
                id="role-name-create"
                type="text" 
                placeholder="Role name" 
                class="input input-bordered w-full" 
                bind:value={newRole.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="role-description-create">
                <span class="label-text">Description</span>
              </label>
              <textarea 
                id="role-description-create"
                placeholder="Role description" 
                class="textarea textarea-bordered w-full" 
                bind:value={newRole.description}
                rows="3"
              ></textarea>
            </div>
            
            <!-- Permissions Section -->
            <div class="form-control">
              <div class="label">
                <span class="label-text">Permissions</span>
              </div>
              <div class="border border-base-300 rounded-lg p-4">
                <div class="grid grid-cols-[1fr_repeat(4,minmax(0,100px))] gap-4 items-center">
                  <div class="font-medium">Resource</div>
                  <div class="text-center font-medium">Read</div>
                  <div class="text-center font-medium">Create</div>
                  <div class="text-center font-medium">Update</div>
                  <div class="text-center font-medium">Delete</div>
                  
                  {#each Object.entries(availablePermissions) as [resource, actions]}
                    <div class="capitalize">{resource}</div>
                    <div class="text-center">
                      {#if actions.includes('read')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInNewRole(`${resource}.read`)}
                          onclick={() => togglePermissionInNewRole(`${resource}.read`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('create')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInNewRole(`${resource}.create`)}
                          onclick={() => togglePermissionInNewRole(`${resource}.create`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('update')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInNewRole(`${resource}.update`)}
                          onclick={() => togglePermissionInNewRole(`${resource}.update`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('delete')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInNewRole(`${resource}.delete`)}
                          onclick={() => togglePermissionInNewRole(`${resource}.delete`)}
                        />
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
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

  <!-- Edit Role Modal -->
  {#if showEditModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-lg">
        <form onsubmit={handleUpdateRole}>
          <h3 class="font-bold text-lg">Edit Role</h3>
          <div class="py-4 space-y-4">
            <div class="form-control">
              <label class="label" for="role-name-edit">
                <span class="label-text">Name</span>
              </label>
              <input 
                id="role-name-edit"
                type="text" 
                placeholder="Role name" 
                class="input input-bordered w-full" 
                bind:value={editingRole.name}
              />
            </div>
            <div class="form-control">
              <label class="label" for="role-description-edit">
                <span class="label-text">Description</span>
              </label>
              <textarea 
                id="role-description-edit"
                placeholder="Role description" 
                class="textarea textarea-bordered w-full" 
                bind:value={editingRole.description}
                rows="3"
              ></textarea>
            </div>
            
            <!-- Permissions Section -->
            <div class="form-control">
              <div class="label">
                <span class="label-text">Permissions</span>
              </div>
              <div class="border border-base-300 rounded-lg p-4">
                <div class="grid grid-cols-[1fr_repeat(4,minmax(0,100px))] gap-4 items-center">
                  <div class="font-medium">Resource</div>
                  <div class="text-center font-medium">Read</div>
                  <div class="text-center font-medium">Create</div>
                  <div class="text-center font-medium">Update</div>
                  <div class="text-center font-medium">Delete</div>
                  
                  {#each Object.entries(availablePermissions) as [resource, actions]}
                    <div class="capitalize">{resource}</div>
                    <div class="text-center">
                      {#if actions.includes('read')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInEditingRole(`${resource}.read`)}
                          onclick={() => togglePermissionInEditingRole(`${resource}.read`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('create')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInEditingRole(`${resource}.create`)}
                          onclick={() => togglePermissionInEditingRole(`${resource}.create`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('update')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInEditingRole(`${resource}.update`)}
                          onclick={() => togglePermissionInEditingRole(`${resource}.update`)}
                        />
                      {/if}
                    </div>
                    <div class="text-center">
                      {#if actions.includes('delete')}
                        <input 
                          type="checkbox" 
                          class="checkbox checkbox-sm" 
                          checked={hasPermissionInEditingRole(`${resource}.delete`)}
                          onclick={() => togglePermissionInEditingRole(`${resource}.delete`)}
                        />
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
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

  <!-- Delete Role Modal -->
  {#if showDeleteModal}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form onsubmit={handleDeleteRole}>
          <h3 class="font-bold text-lg">Delete Role</h3>
          <div class="py-4">
            <div class="flex items-center gap-4 p-4 bg-warning/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-warning" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="font-medium">Are you sure?</p>
                <p class="text-sm">You're about to delete the role <span class="font-semibold">"{selectedRole?.name}"</span>. This action cannot be undone.</p>
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