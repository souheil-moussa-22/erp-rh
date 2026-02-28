import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const formationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log(' Formation Guard - Checking access...');

  // Vérifier d'abord si l'utilisateur est connecté
  if (!authService.isLoggedIn()) {
    console.log(' User not logged in - redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // Debug: Afficher les rôles de l'utilisateur
  const userRoles = authService.getUserRoles();
  console.log(' User roles:', userRoles);
  console.log(' isHR():', authService.isHR());
  console.log(' isHRManager():', authService.isHRManager());

  //  RH ET RH MANAGER DOIVENT POUVOIR ACCÉDER
  const canAccess = authService.isHRorManager();

  console.log(' Can access formations (isHRorManager):', canAccess);

  if (canAccess) {
    console.log(' Access granted to formations');
    return true;
  }

  console.log(' Access denied to formations - insufficient permissions');

  // Rediriger selon le rôle
  if (authService.isEmployee()) {
    const currentUserId = authService.getCurrentUserId();
    if (currentUserId) {
      router.navigate(['/employees', currentUserId]);
    } else {
      router.navigate(['/profile']);
    }
  } else {
    router.navigate(['/unauthorized']);
  }

  return false;
};
