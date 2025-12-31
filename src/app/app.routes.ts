import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Landing } from './features/landing/landing';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { PlatformLayout } from './layout/platform-layout/platform-layout';
import { Dashboard as PlatformDashboard } from './features/platform/dashboard/dashboard';
import { TenantList } from './features/platform/tenant-list/tenant-list';
import { UserList } from './features/platform/user-list/user-list';
import { SystemLogs } from './features/platform/system-logs/system-logs';
import { VerifyEmail } from './features/auth/verify-email/verify-email';
import { Setup } from './features/platform/setup/setup';

import { tenantGuard } from './core/guards/tenant';

export const routes: Routes = [
// Rutas Públicas
  { path: '', component: Landing },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'auth/verify', component: VerifyEmail },

// 👇 NUEVA RUTA DE ONBOARDING (Limpia, sin layout) 👇
  { 
    path: 'setup', 
    component: Setup,
    // canActivate: [authGuard] // Recomendado: Descomenta si tienes el guard listo
  },

  // Rutas Privadas (Admin)
  {
    path: 'admin',
    component: AdminLayout, // 1. El cascarón (Sidebar)
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      { 
        path: 'dashboard', 
        component: Dashboard, 
        canActivate: [tenantGuard]
      },
    ]
  },

  // 👇 RUTAS PLATFORM (Para TI, el Super Admin)
  {
    path: 'platform',
    component: PlatformLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PlatformDashboard },
      { path: 'tenants', component: TenantList },
      { path: 'users', component: UserList },
      { path: 'logs', component: SystemLogs },
    ]
  },

  { path: '**', redirectTo: '' }
];
