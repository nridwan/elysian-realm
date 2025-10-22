import { superFetch } from '../utils/fetch';

const API_BASE_URL = '/api/audit';

export interface AuditTrail {
  id: string;
  user_id: string | null;
  action: string;
  changes: Array<{
    table_name: string;
    old_value: any;
    new_value: any;
  }> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  is_rolled_back: boolean;
}

export interface AuditPaginationQuery {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AuditTrailsResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: AuditTrail[];
}

export interface AuditTrailResponse {
  audit_trail: AuditTrail;
}

// Get audit trails with optional filtering
export async function getAuditTrails(query?: AuditPaginationQuery): Promise<AuditTrailsResponse> {
  const params = new URLSearchParams();
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return superFetch(`${API_BASE_URL}/trails${queryString}`);
}

// Get audit trail by ID
export async function getAuditTrailById(id: string): Promise<AuditTrailResponse> {
  return superFetch(`${API_BASE_URL}/trails/${id}`);
}

// Get audit trails by user ID
export async function getAuditTrailsByUserId(userId: string, query?: { page?: number; limit?: number }): Promise<AuditTrailsResponse> {
  const params = new URLSearchParams();
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return superFetch(`${API_BASE_URL}/trails/user/${userId}${queryString}`);
}