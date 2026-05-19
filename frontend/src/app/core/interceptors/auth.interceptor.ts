import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Endpoints that handle their own auth (or are public) — never attach a Bearer
 *  token to these. Helps avoid sending stale tokens to /login etc. */
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password'];

/**
 * Attach `Authorization: Bearer <jwt>` to every outgoing request when we have
 * a stored token, EXCEPT for the public auth endpoints above.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Public endpoints: send the request as-is (no Authorization header).
  if (PUBLIC_PATHS.some((p) => req.url.endsWith(p))) {
    return next(req);
  }

  const token = auth.token();
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
