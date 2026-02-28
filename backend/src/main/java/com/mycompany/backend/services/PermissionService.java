package com.mycompany.backend.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class PermissionService {

    // Seul le RH Manager peut créer des employés
    public boolean canCreateEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HRMANAGER");
    }
    // Seul le RH Manager peut importer des employés
    public boolean canImportEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HRMANAGER");
    }

    // Seul le RH Manager peut exporter des employés
    public boolean canExportEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HRMANAGER");
    }

    // RH et RH Managers peuvent gérer des employés
    public boolean canManageEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HR") || hasRole(auth, "ROLE_HRMANAGER");
    }

   // Seul le RH Manager peut supprimer des employés
    public boolean canDeleteEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HRMANAGER");
    }

   // RH et RH Managers peuvent éditer des employés
    public boolean canEditEmployees(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return hasRole(auth, "ROLE_HR") || hasRole(auth, "ROLE_HRMANAGER");
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals(role));
    }
}