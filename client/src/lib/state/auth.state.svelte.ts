import { goto } from "$app/navigation";
import * as authJwtDatasource from "$lib/datasource/auth-jwt.datasource";
import type { Admin } from "$lib/types/user.type";
import { PersistentStore } from "$lib/utils/persistent-store";

// Define types for our auth state
interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  hasPasskeys?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: Admin | null;
  tokens: AuthTokens;
}

// Create persistent store for tokens only
const AUTH_TOKENS_KEY = "auth_tokens";
const INITIAL_AUTH_TOKENS: AuthTokens = {
  accessToken: null,
  refreshToken: null,
};

const persistentTokensStore = new PersistentStore<AuthTokens>(AUTH_TOKENS_KEY, INITIAL_AUTH_TOKENS);

// Initialize state - only tokens are persisted
let authState = $state<AuthState>({
  isAuthenticated: false,
  user: null,
  tokens: persistentTokensStore.value, // Load tokens from persistent storage
});

// Helper to decode JWT token (without external dependencies)
function parseJwt(token: string): authJwtDatasource.TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
}

// Unpack user info from token
function unpackUserFromToken(accessToken: string): Admin | null {
  const tokenPayload = parseJwt(accessToken);
  if (!tokenPayload) {
    return null;
  }
  
  return {
    id: tokenPayload.id,
    email: tokenPayload.email,
    name: tokenPayload.name || tokenPayload.email.split("@")[0], // Use name from token or fallback
    role_id: tokenPayload.role.id,
    role: tokenPayload.role,
  };
}

// Get hasPasskeys from token
function getHasPasskeysFromToken(accessToken: string): boolean | undefined {
  const tokenPayload = parseJwt(accessToken);
  if (!tokenPayload) {
    return undefined;
  }
  
  return tokenPayload.hasPasskeys;
}

// Update auth state
async function setAuthState(newState: Partial<AuthState>) {
  authState = { ...authState, ...newState };
  
  // Only persist tokens, not user info
  if (newState.tokens !== undefined) {
    await persistentTokensStore.set(newState.tokens);
  }
}

// Handle updates from persistent storage (e.g., other tabs)
async function handlePersistentStorageUpdate(tokens: AuthTokens) {
  // If tokens have been cleared in another tab, log out
  if (!tokens.accessToken && !tokens.refreshToken) {
    // Only logout if we were previously authenticated
    if (authState.isAuthenticated) {
      await setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: INITIAL_AUTH_TOKENS,
      });
      // Redirect to login if we're not already on an auth page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        goto('/auth/login');
      }
    }
  } 
  // If tokens have been updated in another tab, update our state
  else if (tokens.accessToken) {
    const user = unpackUserFromToken(tokens.accessToken);
    if (user) {
      await setAuthState({
        isAuthenticated: true,
        user,
        tokens,
      });
    } else {
      // Invalid token, logout only if we were previously authenticated
      if (authState.isAuthenticated) {
        await setAuthState({
          isAuthenticated: false,
          user: null,
          tokens: INITIAL_AUTH_TOKENS,
        });
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          goto('/auth/login');
        }
      }
    }
  }
}

// Subscribe to persistent storage updates
let isUpdatingFromStorage = false;
persistentTokensStore.subscribe((tokens) => {
  // Prevent infinite loops by tracking when we're updating from storage
  if (!isUpdatingFromStorage) {
    // Only handle updates if they're different from current state
    if (tokens.accessToken !== authState.tokens.accessToken || 
        tokens.refreshToken !== authState.tokens.refreshToken) {
      handlePersistentStorageUpdate(tokens);
    }
  }
});

// Get current tokens
export function getTokens() {
  return authState.tokens;
}

// Check if user has a specific permission
export function hasPermission(permission: string): boolean {
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }
  return authState.user.role.permissions.includes(permission);
}

// Check if user has a specific role
export function hasRole(role: string): boolean {
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }
  return authState.user.role.name === role;
}

// Login function
export async function login(email: string, password: string) {
  try {
    const response = await authJwtDatasource.login({ email, password });
    
    // Parse the access token to get user info
    const user = unpackUserFromToken(response.access_token);
    if (!user) {
      throw new Error("Invalid token received");
    }
    
    // Get hasPasskeys from token
    const hasPasskeys = getHasPasskeysFromToken(response.access_token);
    
    // Set flag to prevent handling this update as a storage change
    isUpdatingFromStorage = true;
    await setAuthState({
      isAuthenticated: true,
      user,
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        hasPasskeys
      },
    });
    isUpdatingFromStorage = false;
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Login failed" };
  }
}

// Logout function
export async function logout() {
  await authJwtDatasource.logout();
  
  // Set flag to prevent handling this update as a storage change
  isUpdatingFromStorage = true;
  await setAuthState({
    isAuthenticated: false,
    user: null,
    tokens: INITIAL_AUTH_TOKENS,
  });
  isUpdatingFromStorage = false;
  
  goto('/auth/login');
}

// Refresh token function
export async function refreshToken(): Promise<boolean> {
  if (!authState.tokens.refreshToken) {
    // No refresh token, logout immediately
    await logout();
    return false;
  }
  
  try {
    const response = await authJwtDatasource.refreshToken(authState.tokens.refreshToken);
    
    // Parse the new access token to get user info
    const user = unpackUserFromToken(response.access_token);
    if (!user) {
      throw new Error("Invalid token received");
    }
    
    // Get hasPasskeys from token
    const hasPasskeys = getHasPasskeysFromToken(response.access_token);
    
    // Set flag to prevent handling this update as a storage change
    isUpdatingFromStorage = true;
    await setAuthState({
      isAuthenticated: true,
      user,
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        hasPasskeys
      },
    });
    isUpdatingFromStorage = false;
    
    return true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // If refresh fails, logout the user
    await logout();
    return false;
  }
}

// Initialize auth state on app load - unpack user from persisted token
export async function initializeAuth() {
  await persistentTokensStore.load(persistentTokensStore.value)
  
  // Check if we have tokens and they're still valid
  if (authState.tokens.accessToken) {
    const payload = parseJwt(authState.tokens.accessToken);
    if (payload) {
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > currentTime) {
        // Token is still valid, unpack user info
        const user = unpackUserFromToken(authState.tokens.accessToken);
        if (user) {
          await setAuthState({ 
            isAuthenticated: true,
            user,
          });
        } else {
          // Invalid token, logout
          await logout();
        }
      } else if (authState.tokens.refreshToken) {
        // Token expired, try to refresh
        await refreshToken();
      } else {
        // No refresh token, logout
        await logout();
      }
    } else {
      // Invalid token, logout
      await logout();
    }
  }
}

// Direct token-based authentication (for passkeys, OAuth, etc.)
export async function authenticateWithTokens(accessToken: string, refreshToken: string) {
  try {
    // Parse the access token to get user info
    const user = unpackUserFromToken(accessToken);
    if (!user) {
      throw new Error("Invalid token received");
    }
    
    // Get hasPasskeys from token
    const hasPasskeys = getHasPasskeysFromToken(accessToken);
    
    // Set flag to prevent handling this update as a storage change
    isUpdatingFromStorage = true;
    await setAuthState({
      isAuthenticated: true,
      user,
      tokens: {
        accessToken,
        refreshToken,
        hasPasskeys
      },
    });
    isUpdatingFromStorage = false;
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Token authentication failed" };
  }
}

// Auto-redirect to login if not authenticated
export function checkAuthAndRedirect() {
  // Don't redirect if already on auth pages
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
    return;
  }
  
  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    goto('/auth/login');
  }
}

export const authStateStore = {
  get isAuthenticated() {
    return authState.isAuthenticated;
  },
  get user() {
    return authState.user;
  },
  get tokens() {
    return authState.tokens;
  },
};
