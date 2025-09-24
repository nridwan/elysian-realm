<script lang="ts">
  import { onMount } from "svelte";
  import elysia from '$lib/assets/signets/elysia.webp';
  import mobius from '$lib/assets/signets/mobius.webp';
  import kevin from '$lib/assets/signets/kevin.webp';
  import hua from '$lib/assets/signets/hua.webp';
  import kalpas from '$lib/assets/signets/kalpas.webp';

  let isChecked = $state(false);
  let currentThemeName = $state('elysia');
  const availableThemes = ['elysia', 'mobius', 'kevin', 'hua', 'kalpas']; // Add more themes here as they're added
  let isSignetModalOpen = $state(false);
  
  // Preload signet images
  const signetImages: Record<string, string> = {
    'elysia': elysia,
    'mobius': mobius,
    'kevin': kevin,
    'hua': hua,
    'kalpas': kalpas,
  };

  onMount(() => {
    // Check for saved theme name preference
    const savedThemeName = localStorage.getItem('themeName') || 'elysia';
    // Check for saved dark/light preference
    const savedIsDark = localStorage.getItem('isDark') === 'true';
    
    // Determine if system prefers dark mode
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set theme name from localStorage or default
    currentThemeName = savedThemeName;
    
    // Set dark/light state: localStorage preference first, then system preference, then default to light
    const isDark = savedIsDark || (!localStorage.getItem('isDark') && systemPrefersDark);
    isChecked = isDark;
    
    // Apply the theme by combining theme name with dark/light state
    const themeToApply = isDark ? `${savedThemeName}-dark` : `${savedThemeName}-light`;
    document.documentElement.setAttribute('data-theme', themeToApply);
  });

  function handleToggleClick() {
    isChecked = !isChecked;
    
    // Apply the theme by combining theme name with dark/light state
    const themeToApply = isChecked ? `${currentThemeName}-dark` : `${currentThemeName}-light`;
    document.documentElement.setAttribute('data-theme', themeToApply);
    
    // Store theme name and dark/light state separately
    localStorage.setItem('themeName', currentThemeName); // Store just the theme name (e.g., 'elysia')
    localStorage.setItem('isDark', isChecked.toString()); // Store dark/light state as boolean string
  }
  
  // Function to cycle through available themes (left-click for theme, right-click for dark/light)
  function handleThemeCycle(e: Event) {
    e.preventDefault();
    const currentIndex = availableThemes.indexOf(currentThemeName);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    currentThemeName = availableThemes[nextIndex];
    
    // Apply the theme by combining theme name with dark/light state
    const themeToApply = isChecked ? `${currentThemeName}-dark` : `${currentThemeName}-light`;
    document.documentElement.setAttribute('data-theme', themeToApply);
    
    // Store theme name and dark/light state separately
    localStorage.setItem('themeName', currentThemeName);
    localStorage.setItem('isDark', isChecked.toString());
  }
  
  // Function to open the signet modal
  function openSignetModal() {
    isSignetModalOpen = true;
  }
  
  // Function to close the signet modal
  function closeSignetModal(event: Event) {
    console.log(event.target)
    // Only close if the click was on the backdrop, not on the content
    if (event.target === event.currentTarget) {
      isSignetModalOpen = false;
    }
  }
  
  // Function to select a theme from the modal
  function selectTheme(themeName: string) {
    currentThemeName = themeName;
    
    // Apply the theme by combining theme name with dark/light state
    const themeToApply = isChecked ? `${themeName}-dark` : `${themeName}-light`;
    document.documentElement.setAttribute('data-theme', themeToApply);
    
    // Store theme name and dark/light state separately
    localStorage.setItem('themeName', themeName);
    localStorage.setItem('isDark', isChecked.toString());
    
    // Close the modal
    isSignetModalOpen = false;
  }
  
  // Calculate position for each signet in a circular pattern
  function getSignetPosition(index: number, total: number) {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // Start from top
    const radius = 150; // Reduced radius to prevent edge overflow
    return {
      x: 50 + radius * Math.cos(angle) / 4, // Divide by 4 to fit in container
      y: 50 + radius * Math.sin(angle) / 4  // Divide by 4 to fit in container
    };
  }
</script>

<div class="flex gap-1">
  <button onclick={openSignetModal} oncontextmenu={handleThemeCycle} class="relative btn btn-ghost btn-circle p-0" aria-label="Select theme">
    <!-- Display the current theme's signet image -->
    <img 
      src={signetImages[currentThemeName]} 
      alt={`${currentThemeName} theme`}
      class="w-8 h-8 rounded-full object-cover"
    />
  </button>

  <button onclick={handleToggleClick} class="relative btn btn-ghost btn-circle" aria-label="Select theme">
    <!-- sun icon -->
    <svg
      class="fill-current w-6 h-6 transition-all duration-300 ease-in-out absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      class:opacity-0={isChecked}
      class:opacity-100={!isChecked}
      class:scale-50={isChecked}
      class:scale-100={!isChecked}
      class:rotate-45={isChecked}
      class:rotate-0={!isChecked}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
      ></path>
    </svg>
    <!-- moon icon -->
    <svg
      class="fill-current w-6 h-6 transition-all duration-300 ease-in-out absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      class:opacity-0={!isChecked}
      class:opacity-100={isChecked}
      class:scale-50={!isChecked}
      class:scale-100={isChecked}
      class:-rotate-45={!isChecked}
      class:rotate-0={isChecked}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
      ></path>
    </svg>
  </button>
</div>

<!-- Signet Selection Modal -->
{#if isSignetModalOpen}
  <div 
    role="button"
    tabindex="-1"
    onclick={closeSignetModal}
    onkeypress={() => {}}
    class="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
  >
    <div 
      class="relative w-full max-w-2xl aspect-square flex items-center justify-center"
      role="button"
      tabindex="-1"
      onclick={closeSignetModal}
      onkeypress={() => {}}
    >
      {#each availableThemes as theme, index}
        {@const pos = getSignetPosition(index, availableThemes.length)}
        <button
          class="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 focus:outline-none {currentThemeName === theme ? 'animate-pulse' : ''}"
          style={`left: ${pos.x}%; top: ${pos.y}%;`}
          onclick={() => selectTheme(theme)}
          aria-label={`Select ${theme} theme`}
        >
          <img 
            src={signetImages[theme]} 
            alt={`${theme} theme`}
            class="w-16 h-16 rounded-full object-cover border-4 {currentThemeName === theme ? 'border-primary scale-110 shadow-2xl shadow-primary' : 'border-base-300'} transition-all duration-300"
          />
        </button>
      {/each}
    </div>
  </div>
{/if}