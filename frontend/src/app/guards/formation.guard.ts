import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const formationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isHRorManager()) {
    return true;
  }

  if (authService.isEmployee()) {
    const currentUserId = authService.getCurrentUserId();
    router.navigate(currentUserId ? ['/employees', currentUserId] : ['/profile']);
  } else {
    router.navigate(['/unauthorized']);
  }

  return false;
};
