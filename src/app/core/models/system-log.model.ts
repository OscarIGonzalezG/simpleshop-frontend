export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT';
  action: string;
  message: string;
  userEmail?: string;
  tenantId?: string;
  metadata?: any;
  createdAt: string | Date; // Viene como ISO String
  payload?: any;
}