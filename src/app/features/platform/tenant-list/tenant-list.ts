import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformService } from '../../../core/services/platform';
import { Tenant } from '../../../core/models/user.model';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-list.html',
  styleUrl: './tenant-list.css',
})
export class TenantList implements OnInit {
  private platformService = inject(PlatformService);

  tenants = signal<Tenant[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.platformService.getTenants().subscribe({
      next: (data) => {
        this.tenants.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleStatus(tenant: Tenant) {
    if(!confirm(`¿Cambiar estado de ${tenant.businessName}?`)) return;

    this.platformService.toggleTenant(tenant.id).subscribe(() => {
      // Actualizamos la lista localmente para ver el cambio inmediato
      this.tenants.update(list => list.map(t => 
        t.id === tenant.id ? { ...t, isActive: !t.isActive } : t
      ));
    });
  }

}
