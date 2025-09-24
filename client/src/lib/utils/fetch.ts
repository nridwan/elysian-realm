import { getTokens, refreshToken, logout } from '$lib/state/auth.state.svelte';
import { clientConfig } from '$lib/config/client.config';


let isRefreshing = false;
let failedQueue: Array<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
}> = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  
  failedQueue = [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function superFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  // Construct full URL with base URL
  const fullUrl = url.startsWith('http') ? url : `${clientConfig.API_BASE_URL}${url}`;
  
  // Get current tokens
  const tokens = getTokens();
  
  // Clone options to avoid modifying the original
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
    },
  };
  
  // Add auth header if we have an access token
  if (tokens.accessToken) {
    (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  
  // Make the request
  let response = await fetch(fullUrl, fetchOptions);
  
  // If we get a 401 and have a refresh token, try to refresh
  if (response.status === 401 && tokens.refreshToken) {
    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }
    
    isRefreshing = true;
    
    try {
      // Try to refresh the token
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // Get the new tokens
        const newTokens = getTokens();
        
        // Update the auth header with the new token
        if (newTokens.accessToken) {
          (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newTokens.accessToken}`;
        }
        
        // Retry the original request
        response = await fetch(fullUrl, fetchOptions);
        
        // Process queued requests
        processQueue(null, newTokens.accessToken || null);
      } else {
        // Refresh failed, logout the user
        await logout();
        processQueue(new Error('Token refresh failed'));
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      // Refresh failed, logout the user
      await logout();
      processQueue(error);
      throw error;
    } finally {
      isRefreshing = false;
    }
  }
  
  // Handle response
  const jsonResponse = await response.json().catch(() => ({}));
  
  if (response.ok) {
    // According to the API spec, successful responses have a "meta" field and a "data" field
    // Return just the data portion
    return jsonResponse.data;
  } else {
    // Handle error responses
    const errorData = jsonResponse;
    const errorMessage = errorData?.meta?.message || errorData?.message || `HTTP Error: ${response.status}`;
    throw new Error(errorMessage);
  }
}
