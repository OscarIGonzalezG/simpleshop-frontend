import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformService, PlatformMetrics } from '../../../core/services/platform';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private platformService = inject(PlatformService);
  
  // Datos mock iniciales por si el backend falla o no tiene datos aún
  metrics = signal<PlatformMetrics>({
    totalTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentTenants: []
  });
  
  isLoading = signal(true);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.platformService.getMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando métricas de plataforma', err);
        // Dejamos los datos en 0 pero quitamos el loading
        this.isLoading.set(false);
      }
    });
  }
}
