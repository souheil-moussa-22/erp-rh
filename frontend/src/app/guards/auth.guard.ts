import { Injectable, inject } from '@angular/core';
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
  const userRoles = authService.getUserRoles();
  const userId = authService.getUser()?.id;

  console.log(' Redirection automatique selon rôle:', userRoles);

  if (authService.isHR() || authService.isHRManager()) {
    console.log(' Redirection RH vers /employees');
    router.navigate(['/employees']);
  } else if (authService.isEmployee()) {
    console.log(' Redirection Employé vers son profil:', `/employees/${userId}`);
    router.navigate(['/employees', userId]);
  } else {
    console.log(' Redirection par défaut vers /dashboard');
    router.navigate(['/dashboard']);
  }
}
