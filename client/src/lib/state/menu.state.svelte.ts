import { authStateStore, hasPermission } from "$lib/state/auth.state.svelte";

export interface Menu {
  name: string;
  submenus?: Menu[];
  path?: string;
  icon?: string;
  // Add permission field for access control
  permission?: string;
}

// Define all possible menus with permissions following the backend format
const allMenus: Menu[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    name: 'Admin Management',
    submenus: [
      {
        name: 'Admins',
        path: '/admin/users',
        icon: `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        permission: 'admins.read'
      },
      {
        name: 'Roles',
        path: '/admin/roles',
        icon: `<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        permission: 'roles.read'
      },
    ],
  },
];

// Filter menus based on admin permissions
function getFilteredMenus(): Menu[] {
  if (!authStateStore.isAuthenticated) {
    return [];
  }

  // Filter top-level menus
  return allMenus.filter(menu => {
    // If menu has no permission requirement, show it
    if (!menu.permission) return true;
    
    // Check if admin has the required permission
    return hasPermission(menu.permission);
  }).map(menu => {
    // If menu has submenus, filter them too
    if (menu.submenus) {
      const filteredSubmenus = menu.submenus.filter(submenu => {
        // If submenu has no permission requirement, show it
        if (!submenu.permission) return true;
        
        // Check if admin has the required permission
        return hasPermission(submenu.permission);
      });
      
      // Only include the menu if it has visible submenus or a path
      if (filteredSubmenus.length > 0 || menu.path) {
        return {
          ...menu,
          submenus: filteredSubmenus.length > 0 ? filteredSubmenus : undefined
        };
      }
      
      // If no submenus are visible and no path, don't show this menu
      return null;
    }
    
    // Menu without submenus
    return menu;
  }).filter((menu): menu is Menu => menu !== null);
}

export const menuState = {
  get menus() {
    return getFilteredMenus();
  },
};