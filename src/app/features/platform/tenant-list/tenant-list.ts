import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformService } from '../../../core/services/platform';
import { Tenant } from '../../../core/models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';



@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-list.html',
  styleUrl: './tenant-list.css',
})
export class TenantList implements OnInit {
  private platformService = inject(PlatformService);
  private http = inject(HttpClient); 

  // 👇 Ahora usamos Tenant[] oficial
  tenants = signal<Tenant[]>([]);
  isLoading = signal(true);
  
  notification = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  actionModal = signal<{
    isOpen: boolean;
    isLoading: boolean;
    tenantId: string | null;
    businessName: string | null;
    isCurrentlyActive: boolean;
  }>({
    isOpen: false,
    isLoading: false,
    tenantId: null,
    businessName: null,
    isCurrentlyActive: false
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.platformService.getTenants().subscribe({
      next: (data: Tenant[]) => {
        // Enriquecemos la data simulada usando el tipo Tenant
        const enriched: Tenant[] = data.map(t => ({
          ...t,
          // Si el plan no viene, asignamos uno random visual
          plan: t.plan || (Math.random() > 0.7 ? 'PRO' : (Math.random() > 0.9 ? 'ENTERPRISE' : 'FREE')),
          productsCount: Math.floor(Math.random() * 150),
          ordersCount: Math.floor(Math.random() * 500)
        }));

        this.tenants.set(enriched);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        this.showToast('Error al cargar tiendas', 'error');
      }
    });
  }

  // --- LÓGICA MODAL ---
  openToggleModal(tenant: Tenant) {
    this.actionModal.set({
      isOpen: true,
      isLoading: false,
      tenantId: tenant.id,
      businessName: tenant.businessName,
      isCurrentlyActive: tenant.isActive
    });
  }

  confirmToggle() {
    const state = this.actionModal();
    if (!state.tenantId) return;

    this.actionModal.update(s => ({ ...s, isLoading: true }));
    const newStatus = !state.isCurrentlyActive;

    this.http.patch(`${environment.apiUrl}/tenants/${state.tenantId}/status`, { isActive: newStatus })
      .subscribe({
        next: () => {
          const msg = newStatus 
            ? `✅ Tienda "${state.businessName}" reactivada correctamente.` 
            : `⛔ Tienda "${state.businessName}" ha sido SUSPENDIDA.`;
          
          this.showToast(msg, newStatus ? 'success' : 'error');
          
          this.tenants.update(list => list.map(t => 
            t.id === state.tenantId ? { ...t, isActive: newStatus } : t
          ));
          
          this.closeModal();
        },
        error: (err) => {
          this.showToast('Error al cambiar estado: ' + err.message, 'error');
          this.closeModal();
        }
      });
  }

  closeModal() {
    this.actionModal.set({ ...this.actionModal(), isOpen: false, isLoading: false });
  }

  // --- GOD MODE ---
  impersonate(tenant: Tenant) {
    if (!tenant.isActive) {
        this.showToast('⛔ No puedes acceder a una tienda suspendida.', 'error');
        return;
    }
    this.showToast(`🕵️ Iniciando God Mode en ${tenant.businessName}...`, 'info');
  }

  // --- HELPERS VISUALES ---
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 4000);
  }

  getInitials(name?: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getPlanColor(plan?: string): string {
    switch (plan) {
      case 'ENTERPRISE': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'PRO': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      default: return 'text-white/40 border-white/10 bg-white/5';
    }
  }
}