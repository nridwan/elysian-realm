import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/auth';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  exp: number;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  };
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return superFetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  return superFetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logout(): Promise<void> {
  // This would be implemented based on backend requirements
  // For now, we'll just return a resolved promise
  return Promise.resolve();
}