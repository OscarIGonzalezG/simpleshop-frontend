export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT';
  action: string;
  message: string;
  userEmail?: string;
  tenantId?: string;
  metadata?: any;
  createdAt: string; // Viene como ISO String
}