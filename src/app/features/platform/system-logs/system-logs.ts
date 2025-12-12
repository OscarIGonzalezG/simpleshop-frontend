import { Component , inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { PlatformService } from '../../../core/services/platform';
import { SystemLog } from '../../../core/models/system-log.model';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-logs.html',
  styleUrl: './system-logs.css',
})
export class SystemLogs implements OnInit {
  private platformService = inject(PlatformService);

  logs = signal<SystemLog[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  filterLevel = signal<'ALL' | 'ERROR' | 'SECURITY' | 'WARN'>('ALL');

  filteredLogs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const level = this.filterLevel();
    return this.logs().filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(term) || 
                            log.action.toLowerCase().includes(term) ||
                            log.userEmail?.toLowerCase().includes(term);
      const matchesLevel = level === 'ALL' || log.level === level;
      return matchesSearch && matchesLevel;
    });
  });

  stats = computed(() => {
    const list = this.logs();
    return {
      total: list.length,
      errors: list.filter(l => l.level === 'ERROR').length,
      security: list.filter(l => l.level === 'SECURITY').length,
      warnings: list.filter(l => l.level === 'WARN').length
    };
  });

  // 🧠 CEREBRO GRÁFICO: Cálculos para el SVG Donut
  chartData = computed(() => {
    const s = this.stats();
    const total = s.total || 1; // Evitar división por cero
    
    // Circunferencia del círculo (r=16) => 2 * pi * 16 ≈ 100
    const circumference = 100; 

    // Calculamos porcentajes (0 a 100)
    const errPct = (s.errors / total) * circumference;
    const secPct = (s.security / total) * circumference;
    const warnPct = (s.warnings / total) * circumference;

    // Retornamos los valores para 'stroke-dasharray' y 'stroke-dashoffset'
    // El orden de apilamiento importa para que se vean bien
    return {
      error: `${errPct} ${circumference}`,
      security: `${secPct} ${circumference}`,
      warn: `${warnPct} ${circumference}`,
      
      // Offsets (donde empieza cada color)
      offSecurity: -errPct, 
      offWarn: -(errPct + secPct) 
    };
  });

  // Estado del Sistema (Texto)
  systemStatus = computed(() => {
    const s = this.stats();
    if (s.errors > 0) return { text: 'CRÍTICO', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50' };
    if (s.security > 0) return { text: 'RIESGO', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' };
    if (s.warnings > 5) return { text: 'DEGRADADO', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' };
    return { text: 'OPERATIVO', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50' };
  });

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading.set(true);
    this.platformService.getLogs().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  exportToCsv() {
    const data = this.filteredLogs(); 
    if (data.length === 0) return;

    const headers = ['Fecha', 'Nivel', 'Acción', 'Mensaje', 'Usuario', 'Tenant ID'];
    const csvContent = data.map(log => [
        new Date(log.createdAt).toISOString(),
        log.level,
        log.action,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userEmail || 'Sistema',
        log.tenantId || 'N/A'
    ].join(',')).join('\n');

    const fileName = `auditoria_${this.filterLevel()}_${new Date().toISOString().slice(0,10)}.csv`;
    const blob = new Blob([headers.join(',') + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}