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
  
  // ⚠️ NOTA: Esto ya es ".../api/platform"
  private apiUrl = `${environment.apiUrl}/platform`;

  getMetrics() {
    return this.http.get<PlatformMetrics>(`${this.apiUrl}/metrics`);
  }

  getTenants() {
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`);
  }

  getUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  toggleTenant(id: string) {
    return this.http.patch<Tenant>(`${this.apiUrl}/tenants/${id}/toggle`, {});
  }

  // 👇 AQUÍ ESTABA EL ERROR
  getLogs() {
    // Como apiUrl ya tiene '/platform', solo agregamos '/logs'
    return this.http.get<SystemLog[]>(`${this.apiUrl}/logs`);
  }
}