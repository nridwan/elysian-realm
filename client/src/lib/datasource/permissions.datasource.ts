import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/admin';

export interface AvailablePermissions {
  [resource: string]: string[];
}

// Get available permissions
export async function getAvailablePermissions(): Promise<{ permissions: AvailablePermissions }> {
  return superFetch(`${API_BASE_URL}/permissions/available`);
}