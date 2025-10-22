<script lang="ts">
  import { onMount } from 'svelte';
  import * as auditDatasource from '$lib/datasource/audit.datasource';
  import PermissionGuard from '$lib/components/PermissionGuard.svelte';

  let auditTrails = $state<auditDatasource.AuditTrail[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showDetailModal = $state(false);
  let selectedAudit = $state<auditDatasource.AuditTrail | null>(null);
  
  // Pagination
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalItems = $state(0);
  let itemsPerPage = $state(10);
  
  // Filters
  let actionFilter = $state('');
  let entityTypeFilter = $state('');
  let startDateFilter = $state('');
  let endDateFilter = $state('');
  
  let isInitialLoad = $state(true);

  onMount(async () => {
    await loadAuditTrails();
    isInitialLoad = false;
  });

  async function loadAuditTrails() {
    try {
      loading = true;
      error = null;
      
      // Convert dates to proper ISO format with local time
      let startDateIso: string | undefined;
      let endDateIso: string | undefined;
      
      if (startDateFilter) {
        // Create date at 00:00:00 local time
        const startDate = new Date(startDateFilter);
        startDate.setHours(0, 0, 0, 0);
        startDateIso = startDate.toISOString();
      }
      
      if (endDateFilter) {
        // Create date at 23:59:59 local time
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999);
        endDateIso = endDate.toISOString();
      }
      
      const query: auditDatasource.AuditPaginationQuery = {
        page: currentPage,
        limit: itemsPerPage,
        action: actionFilter || undefined,
        entity_type: entityTypeFilter || undefined,
        start_date: startDateIso,
        end_date: endDateIso,
      };
      
      const response = await auditDatasource.getAuditTrails(query);
      auditTrails = response.data;
      totalPages = response.pages;
      totalItems = response.total;
    } catch (err) {
      error = 'Failed to load audit trails';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadAuditTrails();
    }
  }

  async function handleApplyFilters() {
    currentPage = 1;
    await loadAuditTrails();
  }

  function handleClearFilters() {
    actionFilter = '';
    entityTypeFilter = '';
    startDateFilter = '';
    endDateFilter = '';
    currentPage = 1;
    loadAuditTrails();
  }

  function openDetailModal(audit: auditDatasource.AuditTrail) {
    selectedAudit = audit;
    showDetailModal = true;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function formatJson(value: any) {
    if (value === null || value === undefined) {
      return 'null';
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function getActionColor(action: string) {
    if (action.includes('create')) return 'badge-success';
    if (action.includes('update')) return 'badge-warning';
    if (action.includes('delete')) return 'badge-error';
    return 'badge-info';
  }
</script>

<svelte:head>
  <title>Audit Logs - {import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</title>
</svelte:head>

<PermissionGuard permissions={['audit.read']} showDenied>
  <div class="p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">Audit Logs</h1>
        <p class="text-base-content/70">View system activity and changes</p>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">Filters</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="form-control">
            <label class="label" for="action-filter">
              <span class="label-text">Action</span>
            </label>
            <input 
              id="action-filter"
              type="text" 
              placeholder="Action (e.g. user.create)" 
              class="input input-bordered w-full" 
              bind:value={actionFilter}
            />
          </div>
          
          <div class="form-control">
            <label class="label" for="entity-type-filter">
              <span class="label-text">Entity Type</span>
            </label>
            <input 
              id="entity-type-filter"
              type="text" 
              placeholder="Entity Type (e.g. user)" 
              class="input input-bordered w-full" 
              bind:value={entityTypeFilter}
            />
          </div>
          
          <div class="form-control">
            <label class="label" for="start-date-filter">
              <span class="label-text">Start Date</span>
            </label>
            <input 
              id="start-date-filter"
              type="date" 
              class="input input-bordered w-full" 
              bind:value={startDateFilter}
            />
          </div>
          
          <div class="form-control">
            <label class="label" for="end-date-filter">
              <span class="label-text">End Date</span>
            </label>
            <input 
              id="end-date-filter"
              type="date" 
              class="input input-bordered w-full" 
              bind:value={endDateFilter}
            />
          </div>
        </div>
        
        <div class="card-actions justify-end mt-4">
          <button class="btn btn-outline" onclick={handleClearFilters}>
            Clear Filters
          </button>
          <button class="btn btn-primary" onclick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
    
    {#if loading && isInitialLoad}
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
              <th class="normal-case">Action</th>
              <th class="normal-case">User</th>
              <th class="normal-case">Changes</th>
              <th class="normal-case">Date</th>
              <th class="normal-case text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each auditTrails as audit}
              <tr class="hover">
                <td>
                  <div class="flex items-center gap-2">
                    <span class={`badge ${getActionColor(audit.action)} badge-sm`}>
                      {audit.action}
                    </span>
                  </div>
                </td>
                <td>
                  {#if audit.user_id}
                    <span class="tooltip" data-tip={audit.user_id}>
                      User {audit.user_id.substring(0, 8)}...
                    </span>
                  {:else}
                    <span class="text-base-content/50">System</span>
                  {/if}
                </td>
                <td>
                  {#if audit.changes && audit.changes.length > 0}
                    <div class="flex items-center gap-1">
                      <span class="badge badge-neutral badge-xs mr-1">
                        {audit.changes.length}
                      </span>
                      changes
                    </div>
                  {:else}
                    <span class="text-base-content/50">No changes</span>
                  {/if}
                </td>
                <td>
                  <span class="tooltip" data-tip={formatDate(audit.created_at)}>
                    {new Date(audit.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td class="text-right">
                  <button 
                    class="btn btn-sm btn-ghost" 
                    onclick={() => openDetailModal(audit)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="5" class="text-center py-8">
                  <div class="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-base-content/70">No audit trails found</p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex justify-between items-center mt-6">
          <div class="text-base-content/70">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </div>
          <div class="join">
            <button 
              class="join-item btn btn-sm" 
              onclick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            {#if totalPages <= 5}
              {#each Array(totalPages).fill(0).map((_, i) => i + 1) as page}
                <button 
                  class={`join-item btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
                  onclick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              {/each}
            {:else}
              {#if currentPage <= 3}
                {#each [1, 2, 3, 4, 5] as page}
                  <button 
                    class={`join-item btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
                    onclick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                {/each}
                <span class="join-item btn btn-sm btn-disabled">...</span>
                <button 
                  class="join-item btn btn-sm"
                  onclick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              {:else if currentPage >= totalPages - 2}
                <button 
                  class="join-item btn btn-sm"
                  onclick={() => handlePageChange(1)}
                >
                  1
                </button>
                <span class="join-item btn btn-sm btn-disabled">...</span>
                {#each Array(5).fill(0).map((_, i) => totalPages - 4 + i) as page}
                  <button 
                    class={`join-item btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
                    onclick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                {/each}
              {:else}
                <button 
                  class="join-item btn btn-sm"
                  onclick={() => handlePageChange(1)}
                >
                  1
                </button>
                <span class="join-item btn btn-sm btn-disabled">...</span>
                {#each Array(3).fill(0).map((_, i) => currentPage - 1 + i) as page}
                  <button 
                    class={`join-item btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
                    onclick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                {/each}
                <span class="join-item btn btn-sm btn-disabled">...</span>
                <button 
                  class="join-item btn btn-sm"
                  onclick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              {/if}
            {/if}
            <button 
              class="join-item btn btn-sm" 
              onclick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Detail Modal -->
  {#if showDetailModal && selectedAudit}
    <div class="modal modal-open modal-bottom sm:modal-middle">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">Audit Details</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">ID</span>
            </label>
            <div class="p-2 bg-base-200 rounded">{selectedAudit.id}</div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Action</span>
            </label>
            <div class="p-2 bg-base-200 rounded">
              <span class={`badge ${getActionColor(selectedAudit.action)}`}>
                {selectedAudit.action}
              </span>
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">User</span>
            </label>
            <div class="p-2 bg-base-200 rounded">
              {#if selectedAudit.user_id}
                {selectedAudit.user_id}
              {:else}
                <span class="text-base-content/50">System</span>
              {/if}
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Date</span>
            </label>
            <div class="p-2 bg-base-200 rounded">{formatDate(selectedAudit.created_at)}</div>
          </div>
          
          <div class="form-control md:col-span-2">
            <label class="label">
              <span class="label-text font-semibold">IP Address</span>
            </label>
            <div class="p-2 bg-base-200 rounded">
              {#if selectedAudit.ip_address}
                {selectedAudit.ip_address}
              {:else}
                <span class="text-base-content/50">Not available</span>
              {/if}
            </div>
          </div>
          
          <div class="form-control md:col-span-2">
            <label class="label">
              <span class="label-text font-semibold">User Agent</span>
            </label>
            <div class="p-2 bg-base-200 rounded">
              {#if selectedAudit.user_agent}
                {selectedAudit.user_agent}
              {:else}
                <span class="text-base-content/50">Not available</span>
              {/if}
            </div>
          </div>
        </div>
        
        <div class="form-control mb-6">
          <label class="label">
            <span class="label-text font-semibold">Changes</span>
          </label>
          {#if selectedAudit.changes && selectedAudit.changes.length > 0}
            <div class="space-y-4">
              {#each selectedAudit.changes as change, i}
                <div class="border border-base-300 rounded-lg overflow-hidden">
                  <div class="bg-base-200 px-4 py-2 font-semibold">
                    Change #{i + 1} - Table: {change.table_name}
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div>
                      <h4 class="font-semibold mb-2 text-warning">Old Value</h4>
                      <pre class="text-xs bg-base-300 p-3 rounded max-h-40 overflow-auto">{formatJson(change.old_value)}</pre>
                    </div>
                    <div>
                      <h4 class="font-semibold mb-2 text-success">New Value</h4>
                      <pre class="text-xs bg-base-300 p-3 rounded max-h-40 overflow-auto">{formatJson(change.new_value)}</pre>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="p-4 bg-base-200 rounded text-base-content/70 text-center">
              No changes recorded for this action
            </div>
          {/if}
        </div>
        
        <div class="modal-action">
          <button class="btn" onclick={() => showDetailModal = false}>Close</button>
        </div>
      </div>
    </div>
  {/if}
</PermissionGuard>