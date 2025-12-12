import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
// 1. Obtener el token del almacenamiento
  const token = localStorage.getItem('token');

  // 2. Si existe, clonamos la petición y le pegamos el Header
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // 3. Si no hay token, la dejamos pasar tal cual (para login/register)
  return next(req);
};