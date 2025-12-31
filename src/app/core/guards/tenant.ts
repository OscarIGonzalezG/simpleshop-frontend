import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth'; // 👈 Asegúrate que la ruta al servicio sea correcta

export const tenantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtenemos el usuario actual (Signal)
  const user = authService.currentUser();

  // 1. ¿No hay usuario logueado? -> Al Login
  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  // 2. ¿Está logueado pero NO tiene tienda? (Y no es Super Admin)
  // -> Al Setup para que cree su primera tienda/bodega
  if (!user.tenantId && user.role !== 'SUPER_ADMIN') {
    return router.createUrlTree(['/setup']); 
  }

  // 3. Tiene tienda -> Pase usted
  return true;
};