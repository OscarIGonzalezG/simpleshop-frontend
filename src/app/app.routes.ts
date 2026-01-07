import { Routes } from '@angular/router';

// 1. AUTH & PUBLIC
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { VerifyEmail } from './features/auth/verify-email/verify-email';
import { Landing } from './features/shop/landing/landing'; // 👈 MUDADO A SHOP

// 2. ONBOARDING
import { Setup } from './features/onboarding/setup/setup'; // 👈 MUDADO A ONBOARDING

// 3. LAYOUTS
import { AdminLayout } from './layouts/admin/admin-layout/admin-layout';     // 👈 RENOMBRADO A LAYOUTS
import { PlatformLayout } from './layouts/platform/platform-layout/platform-layout'; // 👈 RENOMBRADO A LAYOUTS

// 4. ADMIN FEATURES (Dueño de Bodega)
import { Dashboard } from './features/admin/dashboard/dashboard';

// 5. PLATFORM FEATURES (Super Admin)
import { Dashboard as PlatformDashboard } from './features/platform/dashboard/dashboard';
import { TenantList } from './features/platform/tenant-list/tenant-list';
import { UserList } from './features/platform/user-list/user-list';
import { SystemLogs } from './features/platform/system-logs/system-logs';

// GUARDS
import { tenantGuard } from './core/guards/tenant';

export const routes: Routes = [
  // --- RUTAS PÚBLICAS (Landing & Auth) ---
  { path: '', component: Landing },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'auth/verify', component: VerifyEmail },

  // --- ONBOARDING (Creación de Bodega/Tienda) ---
  { 
    path: 'setup', 
    component: Setup,
    // canActivate: [authGuard] // Idealmente descomentar cuando integres AuthGuard
  },

  // --- PANEL ADMINISTRATIVO (Dueño del Negocio) ---
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      { 
        path: 'dashboard', 
        component: Dashboard, 
        canActivate: [tenantGuard] // Protege que tenga tienda creada
      },
      // Aquí agregaremos luego: 'products', 'inventory', 'orders'
    ]
  },

  // --- PLATAFORMA SAAS (Super Admin - TÚ) ---
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

  // --- FALLBACK ---
  { path: '**', redirectTo: '' }
];