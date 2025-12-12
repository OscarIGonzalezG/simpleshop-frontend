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

export const routes: Routes = [
// Rutas Públicas
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Rutas Privadas (Admin)
  {
    path: 'admin',
    component: AdminLayout, // 1. El cascarón (Sidebar)
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard }, // 2. El contenido
      // { path: 'products', ... }, // Aquí irán los demás
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
