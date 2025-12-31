import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Tenant, User } from '../models/user.model';
import { SystemLog } from '../models/system-log.model';

export interface PlatformMetrics {
  totalTenants: number;
  totalUsers: number;
  totalRevenue: number;
  recentTenants: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private http = inject(HttpClient);
  
  // Base URL global (/api)
  private apiUrl = environment.apiUrl;

  // ==========================================
  // 📊 DASHBOARD & LOGS (/api/platform)
  // ==========================================
  
  getMetrics() {
    return this.http.get<PlatformMetrics>(`${this.apiUrl}/platform/metrics`);
  }

  getLogs() {
    return this.http.get<SystemLog[]>(`${this.apiUrl}/platform/logs`);
  }

  // ==========================================
  // 🏢 TENANTS (/api/tenants)
  // ==========================================

  getTenants() {
    // Obtenemos la lista desde el controlador principal
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`);
  }

  // 👇 MÉTODO CORREGIDO: Acepta el estado para enviarlo al backend
  toggleTenant(id: string, isActive?: boolean) {
    // Si isActive no se pasa, enviamos undefined (o podrías manejar la lógica inversa aquí)
    const payload = isActive !== undefined ? { isActive } : {};
    return this.http.patch<Tenant>(`${this.apiUrl}/tenants/${id}/status`, payload);
  }

  // 👇 ESTE ES EL CRUCIAL PARA EL ONBOARDING
  createTenant(data: { businessName: string; slug: string }) {
    return this.http.post<Tenant>(`${this.apiUrl}/tenants`, data);
  }

  // ==========================================
  // 👥 USERS (/api/users)
  // ==========================================

  getUsers() {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  toggleUserBlock(userId: string, isActive: boolean) {
    return this.http.patch(`${this.apiUrl}/users/${userId}/status`, { isActive });
  }
}