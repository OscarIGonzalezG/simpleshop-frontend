import { Component , inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { Router } from '@angular/router'; 
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
  private router = inject(Router);

  logs = signal<SystemLog[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  filterLevel = signal<'ALL' | 'ERROR' | 'SECURITY' | 'WARN'>('ALL');
  expandedLogKey = signal<string | null>(null);

  // 1. FILTRADO
  filteredLogs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const level = this.filterLevel();
    return this.logs().filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(term) ||
                            log.action.toLowerCase().includes(term) ||
                            (log.userEmail || '').toLowerCase().includes(term);
      const matchesLevel = level === 'ALL' || log.level === level;
      return matchesSearch && matchesLevel;
    });
  });

  // 2. AGRUPACIÓN INTELIGENTE + HISTORIAL
  groupedLogs = computed(() => {
    const rawLogs = this.filteredLogs();
    const groups: any[] = [];

    rawLogs.forEach(log => {
      const key = `${log.action}-${log.message}-${log.level}`;
      const existing = groups.find(g => g.key === key);

      // Normalizamos la data (metadata o payload)
      const rawData = log.payload || (log as any).metadata;
      const hasData = rawData && Object.keys(rawData).length > 0;
      const data = hasData ? rawData : null;

      // Aseguramos que trabajamos con objetos Date
      const logDate = new Date(log.createdAt);

      if (existing) {
        existing.count++;
        existing.history.push({ ...log, data }); // Guardamos data procesada en el historial

        if (logDate > new Date(existing.lastSeen)) {
          existing.lastSeen = log.createdAt;
        }
      } else {
        groups.push({
          ...log,
          key,
          count: 1,
          lastSeen: log.createdAt,
          history: [{ ...log, data }] // Iniciamos historial
        });
      }
    });

    // Procesamiento final de grupos
    return groups.map(g => {
      // Ordenar historial (Más reciente primero)
      g.history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 🧠 LÓGICA DE SELECCIÓN INICIAL:
      // El payload visible por defecto será el del ítem más reciente
      if (g.history.length > 0) {
        const latest = g.history[0];
        g.payload = latest.data;
        g.activeLogId = latest.id; // Marcamos el ID activo
        // Sincronizamos contexto inicial
        g.userEmail = latest.userEmail;
        g.tenantId = latest.tenantId;
      }

      return g;
    }).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
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

  // 3. GRÁFICO (Trend Chart)
  trendChart = computed(() => {
    const logs = this.logs();
    if (logs.length === 0) return '';
    const now = new Date().getTime();
    
    // Obtenemos el log más antiguo para calcular el rango
    const oldest = logs.length > 0 ? new Date(logs[logs.length - 1].createdAt).getTime() : now - 3600000;
    const timeRange = Math.max(now - oldest, 3600000);
    const buckets = 20;
    const interval = timeRange / buckets;
    const counts = new Array(buckets).fill(0);

    logs.forEach(log => {
      const logTime = new Date(log.createdAt).getTime();
      const age = now - logTime;
      const index = Math.floor(age / interval);
      if (index >= 0 && index < buckets) counts[buckets - 1 - index]++;
    });

    const maxCount = Math.max(...counts, 1);
    const height = 50;
    const width = 100;
    const stepX = width / (buckets - 1);
    return counts.map((count, i) => `${i * stepX},${height - (count / maxCount * height)}`).join(' ');
  });

  ngOnInit() { this.loadLogs(); }

  // 👇 MODIFICACIÓN CLAVE: Convertimos String a Date real al cargar
  loadLogs() {
      this.isLoading.set(true);
      this.platformService.getLogs().subscribe({
        next: (data) => {
          const parsedData = data.map(log => {
            // 1. Creamos la fecha tal cual viene (probablemente 17:00)
            const serverDate = new Date(log.createdAt);
            
            // 2. Calculamos la diferencia horaria de TU navegador (Ej: Chile = 180 min = 3 horas)
            // getTimezoneOffset devuelve minutos positivos si estás al oeste de UTC.
            const offsetMinutes = new Date().getTimezoneOffset(); 
            
            // 3. ☢️ AJUSTE MANUAL: Restamos la diferencia.
            // Si el servidor dice 17:00 y tu offset es 3 horas: 17 - 3 = 14:00.
            const localDate = new Date(serverDate.getTime() - (offsetMinutes * 60000));

            return {
              ...log,
              // Guardamos la fecha corregida
              createdAt: localDate 
            };
          });

          // Ordenamos
          parsedData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          // FIX TYPESCRIPT: Usamos 'as any' para evitar el error rojo
          this.logs.set(parsedData as any);
          
          this.isLoading.set(false);
        },
        error: (err) => { 
          console.error(err); 
          this.isLoading.set(false); 
        }
      });
    }

  toggleDetails(key: string) {
    this.expandedLogKey.set(this.expandedLogKey() === key ? null : key);
  }

  // 👇 NUEVO MÉTODO: Seleccionar un log específico del historial
  selectLogFromHistory(group: any, logItem: any) {
    group.payload = logItem.data;     // Actualizamos la caja de la izquierda
    group.activeLogId = logItem.id;   // Actualizamos el borde azul
    // Actualizamos usuario/tenant contextual para los botones de acción
    group.userEmail = logItem.userEmail;
    group.tenantId = logItem.tenantId;
  }

  navigateToContext(log: any) {
    if (log.tenantId) {
      this.router.navigate(['/platform/tenants'], { queryParams: { search: log.tenantId } });
    } else if (log.userEmail) {
      this.router.navigate(['/platform/users'], { queryParams: { search: log.userEmail } });
    }
  }

  exportToCsv() {
    const data = this.groupedLogs();
    if (data.length === 0) return;
    const headers = ['Ultima Vez', 'Repeticiones', 'Nivel', 'Acción', 'Mensaje', 'Usuario', 'Tenant ID'];
    const csvContent = data.map(log => [
        // 🛠️ FIX CSV: Usamos toLocaleString() para que el Excel tenga tu hora local
        new Date(log.lastSeen).toLocaleString(),
        log.count,
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