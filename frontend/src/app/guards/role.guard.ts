// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard de rôle générique (version fonction)
export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier d'abord si l'utilisateur est authentifié
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les rôles requis depuis la configuration de la route
  const requiredRoles = route.data['roles'] as Array<string>;

  // Si aucun rôle n'est requis, autoriser l'accès
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Vérifier si l'utilisateur a au moins un des rôles requis
  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  } else {
    router.navigate(['/access-denied']);
    return false;
  }
};

// Guard spécifique pour HR (version fonction)
export const hrRoleGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.canViewEmployeeList()) {
    return true;
  } else {
    router.navigate(['/access-denied']);
    return false;
  }
};
