export interface Admin {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  };
}