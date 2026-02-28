// src/app/guards/job.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const jobGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isHR() || authService.isHRManager()) {
    return true;
  }

  if (authService.isEmployee()) {
    const currentUserId = authService.getCurrentUserId();
    router.navigate(currentUserId ? ['/employees', currentUserId] : ['/my-profile']);
  } else {
    router.navigate(['/employees']);
  }

  return false;
};