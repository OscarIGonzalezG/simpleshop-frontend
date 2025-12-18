export interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  isActive: boolean;

  // 👇 Campos opcionales que agregamos para la vista de administración
  plan?: string;
  owner?: User;           // El dueño de la tienda
  productsCount?: number; // Métrica simulada o real
  ordersCount?: number;   // Métrica simulada o real
}

export interface User {
  id: string;
  email: string;
  fullname: string;
  role?: string; // 'OWNER', 'ADMIN', 'STAFF', 'SUPER_ADMIN'
  isActive: boolean;
  tenantId?: string;
  tenant?: Tenant; // Relación opcional
}