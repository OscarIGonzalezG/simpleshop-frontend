import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlatformService } from '../../../core/services/platform';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  private platformService = inject(PlatformService);
  private router = inject(Router);

  users = signal<User[]>([]);
  
  // 🔽 ESTADO DEL PANEL LATERAL
  selectedUser = signal<User | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.platformService.getUsers().subscribe(data => this.users.set(data));
  }

  // --- ACCIONES DEL PANEL ---

  openUserPanel(user: User) {
    this.selectedUser.set(user);
  }

  closeUserPanel() {
    this.selectedUser.set(null);
  }

  // 👻 IMPERSONATION (MODO FANTASMA)
  impersonateUser(user: User) {
    if (confirm(`¿Estás seguro de iniciar sesión como "${user.email}"?\n\nEsto cerrará tu sesión actual de Super Admin.`)) {
      // Aquí iría la lógica real: this.authService.impersonate(user.id)...
      alert(`🕵️‍♂️ MODO FANTASMA ACTIVADO:\nAhora estás viendo la plataforma como: ${user.fullname}`);
    }
  }

  // 🚫 KILL SWITCH (BLOQUEO DE USUARIO) - CONECTADO AL BACKEND 🔌
  toggleUserStatus(user: User) {
    const newState = !user.isActive;
    const action = newState ? 'desbloquear' : 'BLOQUEAR';
    
    if (confirm(`¿Confirmas que deseas ${action} el acceso a ${user.fullname}?`)) {
      
      // 1. Optimismo en UI (Actualizamos localmente para que se vea rápido)
      this.updateLocalUser(user.id, newState);

      // 2. Llamada al Backend REAL
      this.platformService.toggleUserBlock(user.id, newState).subscribe({
        next: () => {
             console.log(`[AUDIT] Usuario ${user.email} actualizado correctamente en BD.`);
        },
        error: (err) => {
            console.error('Error al actualizar estado:', err);
            alert('❌ Hubo un error al comunicarse con el servidor. Se revertirán los cambios.');
            // Revertir cambio si falla
            this.updateLocalUser(user.id, !newState); // Volvemos al estado anterior
        }
      });
    }
  }

  // Helper para actualizar la señal localmente
  private updateLocalUser(userId: string, isActive: boolean) {
      this.users.update(list => list.map(u => u.id === userId ? { ...u, isActive } : u));
      if (this.selectedUser()?.id === userId) {
        this.selectedUser.update(u => u ? { ...u, isActive } : null);
      }
  }

  resetPassword(user: User) {
    const newPass = Math.random().toString(36).slice(-8);
    prompt(`Se ha generado una contraseña temporal para ${user.email}.\n\nCópiala y envíasela al usuario:`, newPass);
  }

  navigateToTenant(tenantId: string) {
    this.router.navigate(['/platform/tenants'], { queryParams: { search: tenantId } });
  }
}