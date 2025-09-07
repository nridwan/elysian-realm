import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/admin';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions?: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Get all roles
export async function getRoles(): Promise<{ roles: Role[] }> {
  return superFetch(`${API_BASE_URL}/roles`);
}

// Get role by ID
export async function getRoleById(id: string): Promise<{ role: Role }> {
  return superFetch(`${API_BASE_URL}/roles/${id}`);
}

// Create a new role
export async function createRole(role: CreateRoleRequest): Promise<{ role: Role }> {
  return superFetch(`${API_BASE_URL}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(role),
  });
}

// Update a role
export async function updateRole(id: string, role: UpdateRoleRequest): Promise<{ role: Role }> {
  return superFetch(`${API_BASE_URL}/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(role),
  });
}

// Delete a role
export async function deleteRole(id: string): Promise<void> {
  return superFetch(`${API_BASE_URL}/roles/${id}`, {
    method: 'DELETE',
  });
}