export interface SystemLog {
  id: string;
  // Agregué 'HTTP' por si acaso, ya que el backend lo usa
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT' | 'HTTP'; 
  action: string;
  message: string;
  userEmail?: string;
  tenantId?: string;
  metadata?: any;
  createdAt: string | Date; // Viene como ISO String
  payload?: any;

  // 👇👇 CAMPOS NUEVOS (Soluciona el error TS2339) 👇👇
  ip?: string;
  country?: string;
  device?: string;
  userAgent?: string;
}