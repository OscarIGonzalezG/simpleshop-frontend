import { Component , inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { Router } from '@angular/router'; 
import { HttpClient } from '@angular/common/http';
import { PlatformService } from '../../../core/services/platform';
import { SystemLog } from '../../../core/models/system-log.model';
import { environment } from '../../../../environments/environment';

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
  private http = inject(HttpClient);

  logs = signal<SystemLog[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  filterLevel = signal<'ALL' | 'ERROR' | 'SECURITY' | 'WARN'>('ALL');
  expandedLogKey = signal<string | null>(null);

  startDate = signal<string | null>(null);
  endDate = signal<string | null>(null);
  copiedId = signal<string | null>(null);
  notification = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Modal de Usuarios (Existente)
  actionModal = signal<{
    isOpen: boolean;
    isLoading: boolean;
    email: string | null;
    userId: string | null;
    isCurrentlyActive: boolean; 
  }>({
    isOpen: false,
    isLoading: false,
    email: null,
    userId: null,
    isCurrentlyActive: false
  });

  // 👇 1. NUEVO MODAL DE IP (PELIGRO)
  ipActionModal = signal<{
    isOpen: boolean;
    ip: string | null;
    isLocalhost: boolean; // Para mostrar la advertencia "Kamikaze"
  }>({
    isOpen: false,
    ip: null,
    isLocalhost: false
  });

  filteredLogs = computed(() => { 
    const term = this.searchTerm().toLowerCase();
    const level = this.filterLevel();
    const start = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
    const end = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;

    return this.logs().filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(term) ||
                            log.action.toLowerCase().includes(term) ||
                            (log.userEmail || '').toLowerCase().includes(term) ||
                            (log.ip || '').includes(term);
                            
      const matchesLevel = level === 'ALL' || log.level === level;

      let matchesDate = true;
      if (start || end) {
        const logDate = new Date(log.createdAt);
        if (start && logDate < start) matchesDate = false;
        if (end && logDate > end) matchesDate = false;
      }

      return matchesSearch && matchesLevel && matchesDate;
    });
  });

  groupedLogs = computed(() => {
    const rawLogs = this.filteredLogs();
    const groups: any[] = [];

    rawLogs.forEach(log => {
      const key = `${log.action}-${log.message}-${log.level}`;
      const existing = groups.find(g => g.key === key);

      const rawData = log.payload || (log as any).metadata;
      const hasData = rawData && Object.keys(rawData).length > 0;
      const data = hasData ? rawData : null;

      const logDate = new Date(log.createdAt);

      if (existing) {
        existing.count++;
        existing.history.push({ ...log, data });

        if (logDate > new Date(existing.lastSeen)) {
          existing.lastSeen = log.createdAt;
        }
      } else {
        groups.push({
          ...log,
          key,
          count: 1,
          lastSeen: log.createdAt,
          history: [{ ...log, data }]
        });
      }
    });

    return groups.map(g => {
      g.history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (g.history.length > 0) {
        const latest = g.history[0];
        g.payload = latest.data;
        g.activeLogId = latest.id;
        g.userEmail = latest.userEmail;
        g.tenantId = latest.tenantId;
        g.country = latest.country;
        g.device = latest.device;
        g.ip = latest.ip;
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

  trendChart = computed(() => {
    const logs = this.filteredLogs(); 
    if (logs.length === 0) return '';
    
    const now = new Date().getTime();
    const oldest = logs.length > 0 ? new Date(logs[logs.length - 1].createdAt).getTime() : now - 3600000;
    const newest = logs.length > 0 ? new Date(logs[0].createdAt).getTime() : now;
    
    const timeRange = Math.max(newest - oldest, 3600000); 
    const buckets = 20;
    const interval = timeRange / buckets;
    const counts = new Array(buckets).fill(0);

    logs.forEach(log => {
      const logTime = new Date(log.createdAt).getTime();
      const age = newest - logTime; 
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

  loadLogs() {
      this.isLoading.set(true);
      this.platformService.getLogs().subscribe({
        next: (data) => {
          const parsedData = data.map(log => {
            const serverDate = new Date(log.createdAt);
            const offsetMinutes = new Date().getTimezoneOffset(); 
            const localDate = new Date(serverDate.getTime() - (offsetMinutes * 60000));

            return {
              ...log,
              createdAt: localDate 
            };
          });

          parsedData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

  selectLogFromHistory(group: any, logItem: any) {
    group.payload = logItem.data;
    group.activeLogId = logItem.id;
    group.userEmail = logItem.userEmail;
    group.tenantId = logItem.tenantId;
    group.country = logItem.country;
    group.device = logItem.device;
    group.ip = logItem.ip;
  }

  // --- LÓGICA MODAL USUARIOS ---
  openActionModal(email: string) {
    this.actionModal.set({
      isOpen: true,
      isLoading: true,
      email: email,
      userId: null,
      isCurrentlyActive: false
    });

    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (users) => {
        const targetUser = users.find(u => u.email === email);
        if (targetUser) {
          this.actionModal.set({
            isOpen: true,
            isLoading: false,
            email: email,
            userId: targetUser.id,
            isCurrentlyActive: targetUser.isActive
          });
        } else {
          this.closeModal();
          this.showToast('Usuario no encontrado en la base de datos', 'error');
        }
      },
      error: (err) => {
        this.closeModal();
        this.showToast('Error al consultar usuario', 'error');
      }
    });
  }

  confirmAction() {
    const state = this.actionModal();
    if (!state.userId) return;

    const newStatus = !state.isCurrentlyActive; 

    this.http.patch(`${environment.apiUrl}/users/${state.userId}/status`, { isActive: newStatus })
      .subscribe({
        next: () => {
          const msg = state.isCurrentlyActive 
            ? `⛔ Usuario ${state.email} ha sido BLOQUEADO.` 
            : `✅ Usuario ${state.email} ha sido DESBLOQUEADO.`;
          
          this.showToast(msg, state.isCurrentlyActive ? 'error' : 'success');
          this.loadLogs(); 
          this.closeModal();
        },
        error: (err) => this.showToast('Error: ' + err.message, 'error')
      });
  }

  closeModal() {
    this.actionModal.set({ ...this.actionModal(), isOpen: false });
  }

  // 👇 --- NUEVA LÓGICA MODAL IPs (KAMIKAZE) --- 👇

  openIpModal(ip: string) {
    // Detectamos si es local
    const isLocal = ip === '::1' || ip === '127.0.0.1';
    
    this.ipActionModal.set({
        isOpen: true,
        ip: ip,
        isLocalhost: isLocal
    });
  }

  confirmIpBlock() {
    const state = this.ipActionModal();
    if (!state.ip) return;

    this.http.post(`${environment.apiUrl}/security/block-ip`, { ip: state.ip, reason: 'Bloqueo manual desde Auditoría' })
      .subscribe({
        next: () => {
          this.showToast(`🚫 IP ${state.ip} ha sido bloqueada. El escudo está activo.`, 'error');
          this.loadLogs();
          this.closeIpModal();
        },
        error: (err) => {
          if (err.status === 403) {
             alert('😵 Te has bloqueado a ti mismo. No puedes realizar más acciones. Ve a la BD para desbloquearte.');
             window.location.reload();
          } else {
             this.showToast('Error al bloquear IP: ' + (err.error?.message || err.message), 'error');
             this.closeIpModal();
          }
        }
      });
  }

  closeIpModal() {
    this.ipActionModal.set({ isOpen: false, ip: null, isLocalhost: false });
  }

  // ---------------------------------------------

  navigateToContext(log: any) {
    if (log.tenantId) {
      this.router.navigate(['/platform/tenants'], { queryParams: { search: log.tenantId } });
    } else if (log.userEmail) {
      this.router.navigate(['/platform/users'], { queryParams: { search: log.userEmail } });
    }
  }

  getDeviceIcon(deviceStr: string): string {
    if (!deviceStr) return '❓'; 
    const lower = deviceStr.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios') || lower.includes('iphone')) return '📱';
    if (lower.includes('bot') || lower.includes('crawler')) return '🤖';
    return '💻'; 
  }

  exportToCsv() {
    const data = this.groupedLogs(); 
    if (data.length === 0) return;
    const headers = ['Ultima Vez', 'Repeticiones', 'Nivel', 'Acción', 'Mensaje', 'Usuario', 'Tenant ID', 'IP', 'País', 'Dispositivo'];
    const csvContent = data.map(log => [
        new Date(log.lastSeen).toLocaleString(),
        log.count,
        log.level,
        log.action,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userEmail || 'Sistema',
        log.tenantId || 'N/A',
        log.ip || 'N/A',
        log.country || 'N/A',
        `"${log.device || 'N/A'}"`
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
    
    this.showToast('Reporte CSV exportado correctamente', 'success');
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 4000);
  }

  async copyLogDetails(log: any) {
    const report = {
      timestamp: log.createdAt,
      level: log.level,
      action: log.action,
      message: log.message,
      user: log.userEmail || 'N/A',
      tenant: log.tenantId || 'N/A',
      ip: log.ip || 'N/A',
      device: log.device || 'N/A',
      payload: log.payload
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      this.copiedId.set(log.activeLogId);
      setTimeout(() => this.copiedId.set(null), 2000);
      this.showToast('JSON copiado al portapapeles', 'info');
    } catch (err) {
      console.error('❌ Error al copiar', err);
      this.showToast('Error al copiar al portapapeles', 'error');
    }
  }

  clearDates() {
    this.startDate.set(null);
    this.endDate.set(null);
  }
}