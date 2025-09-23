import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/admin';

export interface Admin {
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

export interface CreateAdminRequest {
  name: string;
  email: string;
  role_id: string;
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  role_id?: string;
}

export interface PaginatedAdmins {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: Admin[];
}

// Get all admins with pagination
export async function getAdmins(page: number = 1, limit: number = 10): Promise<PaginatedAdmins> {
  return superFetch(`${API_BASE_URL}/admins?page=${page}&limit=${limit}`);
}

// Get admin by ID
export async function getAdminById(id: string): Promise<{ admin: Admin }> {
  return superFetch(`${API_BASE_URL}/admins/${id}`);
}

// Create a new admin
export async function createAdmin(admin: CreateAdminRequest): Promise<{ admin: Admin }> {
  return superFetch(`${API_BASE_URL}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin),
  });
}

// Update an admin
export async function updateAdmin(id: string, admin: UpdateAdminRequest): Promise<{ admin: Admin }> {
  return superFetch(`${API_BASE_URL}/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin),
  });
}

// Delete an admin
export async function deleteAdmin(id: string): Promise<void> {
  return superFetch(`${API_BASE_URL}/admins/${id}`, {
    method: 'DELETE',
  });
}