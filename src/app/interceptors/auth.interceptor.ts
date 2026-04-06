import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Si no hay token, seguimos sin tocar la request
  if (!token) return next(req);

  // Evita meter Authorization si ya viene (por si algún día lo pones a mano)
  if (req.headers.has('Authorization')) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};