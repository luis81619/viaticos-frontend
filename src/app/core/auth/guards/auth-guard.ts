import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { Role } from '../interfaces/role';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const authService = inject(AuthService);
  const session = inject(SessionService);

  const isAuthenticated =
    session.isAuthenticated();

  if (!isAuthenticated) {
    authService.logout();
    return false;
  }

  const requiredRoles =
    route.data?.['roles'] as Role[] | undefined;

  if (!requiredRoles?.length) {
    return true;
  }

  const hasAccess =
    session.hasAnyRole(requiredRoles);

  if (!hasAccess) {
    return router.createUrlTree([
      '/dashboard',
    ]);
  }

  return true;
};
