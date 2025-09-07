import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role_id: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role_id?: string;
}

export interface PaginatedUsers {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: User[];
}

// Get all users with pagination
export async function getUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
  return superFetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`);
}

// Get user by ID
export async function getUserById(id: string): Promise<{ user: User }> {
  return superFetch(`${API_BASE_URL}/users/${id}`);
}

// Create a new user
export async function createUser(user: CreateUserRequest): Promise<{ user: User }> {
  return superFetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
}

// Update a user
export async function updateUser(id: string, user: UpdateUserRequest): Promise<{ user: User }> {
  return superFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  return superFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
  });
}