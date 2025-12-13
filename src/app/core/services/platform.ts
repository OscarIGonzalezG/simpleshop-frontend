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
  
  // Base para cosas de plataforma (/api/platform)
  private platformUrl = `${environment.apiUrl}/platform`;
  
  // Base para usuarios (/api/users) - 👈 CORRECCIÓN AQUÍ
  private usersUrl = `${environment.apiUrl}/users`;

  getMetrics() {
    return this.http.get<PlatformMetrics>(`${this.platformUrl}/metrics`);
  }

  getTenants() {
    return this.http.get<Tenant[]>(`${this.platformUrl}/tenants`);
  }

  toggleTenant(id: string) {
    return this.http.patch<Tenant>(`${this.platformUrl}/tenants/${id}/toggle`, {});
  }

  getLogs() {
    return this.http.get<SystemLog[]>(`${this.platformUrl}/logs`);
  }

  // ==========================================
  // 👇 RUTAS CORREGIDAS (Apuntan a UsersController)
  // ==========================================

  getUsers() {
    // Antes: this.platformUrl + '/users' -> /api/platform/users (ERROR 404)
    // Ahora: this.usersUrl -> /api/users (CORRECTO)
    return this.http.get<User[]>(this.usersUrl);
  }

  toggleUserBlock(userId: string, isActive: boolean) {
    // Antes: /api/platform/users/:id/status (ERROR 404)
    // Ahora: /api/users/:id/status (CORRECTO)
    return this.http.patch(`${this.usersUrl}/${userId}/status`, { isActive });
  }
}