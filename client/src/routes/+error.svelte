<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
  <div class="card w-full max-w-md shadow-2xl bg-base-100">
    <div class="card-body text-center">
      <h1 class="text-5xl font-bold mb-4">{page.status}</h1>
      <h2 class="card-title text-2xl mb-4">{page.error?.message || 'An error occurred'}</h2>
      <p class="mb-6">Something went wrong. Please try again later.</p>
      <div class="card-actions justify-center">
        <button onclick={() => window.history.back()} class="btn btn-primary">Go Back</button>
        <a href="/" class="btn btn-secondary">Go Home</a>
      </div>
    </div>
  </div>
</div>