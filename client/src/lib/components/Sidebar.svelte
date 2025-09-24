<script lang="ts">
  import { logout } from "$lib/state/auth.state.svelte";
  import { menuState } from "$lib/state/menu.state.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";

  let isLoggingOut = $state(false);

  async function handleLogout() {
    isLoggingOut = true;
    try {
      await logout();
      goto("/auth/login");
    } finally {
      isLoggingOut = false;
    }
  }
</script>

<div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
  <div class="flex items-center justify-between mt-8 px-2">
    <div class="flex items-center">
      <span class="text-base-content text-2xl font-semibold ml-2">{import.meta.env.VITE_APP_NAME || 'Elysian Realm'}</span>
    </div>
    <ThemeToggle />
  </div>

  <nav class="mt-10">
    {#if menuState.menus.length > 0}
      {#each menuState.menus as menu}
        {#if menu.submenus && menu.submenus.length > 0}
          <div class="mt-4">
            <div class="flex items-center py-2 px-6 text-base-content/60 hover:text-base-content/90 transition-colors duration-200">
              <span class="font-bold text-sm tracking-wide uppercase">{menu.name}</span>
            </div>
            {#each menu.submenus as submenu}
              <a
                href={submenu.path}
                class={[
                  'flex items-center mt-1 py-2 px-6 ml-4 rounded-lg transition-all duration-200',
                  page.url.pathname === submenu.path
                    ? 'bg-primary hover:bg-primary-focus text-primary-content font-semibold border-l-4 border-primary shadow-md scale-[1.02]'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                ]}
              >
                {#if submenu.icon}
                  <span class="transition-transform duration-200" class:scale-110={page.url.pathname === submenu.path}>
                    {@html submenu.icon}
                  </span>
                {/if}
                <span class="mx-3">{submenu.name}</span>
              </a>
            {/each}
          </div>
        {:else if menu.path}
          <a
            href={menu.path}
            class={[
              'flex items-center mt-4 py-2 px-6 rounded-lg transition-all duration-200',
              page.url.pathname === menu.path
                ? 'bg-primary hover:bg-primary-focus text-primary-content font-semibold border-l-4 border-primary shadow-md scale-[1.02]'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
            ]}
          >
            {#if menu.icon}
              <span class="transition-transform duration-200" class:scale-110={page.url.pathname === menu.path}>
                {@html menu.icon}
              </span>
            {/if}
            <span class="mx-3">{menu.name}</span>
          </a>
        {/if}
      {/each}
    {:else}
      <div class="text-center py-4 text-base-content/50">
        No menu items available
      </div>
    {/if}

    <button
      onclick={handleLogout}
      disabled={isLoggingOut}
      class={[
        'flex items-center mt-4 py-2 px-6 text-base-content/70 hover:bg-error hover:text-error-content rounded-lg transition-all duration-200 w-full text-left hover:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ]}
    >
      <svg
        class="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17 16L21 12M21 12L17 8M21 12H7M13 16V18C13 19.1046 12.1046 20 11 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H11C12.1046 4 13 4.89543 13 6V8"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="mx-3">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
    </button>
  </nav>
</div>