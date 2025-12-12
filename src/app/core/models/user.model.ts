export interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  plan?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  fullname: string;
  role?: string; // 'OWNER', 'ADMIN', 'STAFF', 'SUPER_ADMIN'
  tenantId?: string;
  tenant?: Tenant; // Relación opcional
}