import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {

    if (state.url === '/login' || state.url === '/') {
      redirectBasedOnRole(authService, router);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};

function redirectBasedOnRole(authService: AuthService, router: Router): void {
  const userId = authService.getUser()?.id;

  if (authService.isHR() || authService.isHRManager()) {
    router.navigate(['/employees']);
  } else if (authService.isEmployee()) {
    router.navigate(['/employees', userId]);
  } else {
    router.navigate(['/dashboard']);
  }
}
