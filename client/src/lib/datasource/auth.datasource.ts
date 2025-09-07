import { superFetch } from '../utils/fetch';
import type { LoginRequest, AuthResponse } from './auth-jwt.datasource';

const API_BASE_URL = '/api/auth';

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return superFetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function logout() {
  // This is now handled client-side in auth.state.svelte.ts
  return Promise.resolve();
}

export async function checkAuth(): Promise<boolean> {
  // This is now handled client-side in auth.state.svelte.ts
  return Promise.resolve(true);
}