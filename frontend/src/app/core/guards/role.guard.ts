import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Use on routes that require specific role(s):
 *   { path: 'admin', canActivate: [authGuard, roleGuard(['ADMIN'])], ... }
 */
export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(...allowed)) return true;
  router.navigate(['/forbidden']);
  return false;
};
