import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Auth endpoints handle their own errors inline (the login form shows the message). */
const AUTH_ENDPOINTS = ['/login', '/signup', '/forgot-password'];

/**
 * Global HTTP error handling.
 *
 *   401 on an authenticated request -> JWT was rejected -> log out + redirect.
 *   401 on /login -> wrong password -> let the form show it (no redirect).
 *   403 -> permission denied for this endpoint -> propagate (no redirect).
 *
 * IMPORTANT: we do NOT proactively check token expiry here. An earlier version
 * did, and it had the effect of killing a fresh /login request when a stale
 * JWT was still in localStorage — the interceptor would `logout()` and abort
 * the request before it ever reached the server. That made login feel flaky
 * ("works on the second try").
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => req.url.endsWith(p));

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint) {
        // The server rejected our token on a normally-authenticated request.
        // That means the JWT is expired or otherwise invalid.
        auth.logout();
        router.navigate(['/login'], { queryParams: { reason: 'expired' } });
      }
      // Everything else (login 401, 403, 404, 500) — let the caller handle it.
      return throwError(() => err);
    })
  );
};
