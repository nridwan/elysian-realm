<svelte:head>
  <title>Dashboard - {import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</title>
</svelte:head>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
  <p class="text-lg">Welcome to your dashboard!</p>
  <p class="mt-2">This is a protected route, only accessible after successful authentication.</p>
</div>