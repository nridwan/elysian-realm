// Client-side environment configuration
export const clientConfig = {
  // API base URL - defaults to same origin in production
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // Whether to use HTTPS in development
  USE_HTTPS: import.meta.env.VITE_USE_HTTPS === 'true' || false,
};