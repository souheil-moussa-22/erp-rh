package com.mycompany.backend.entities;

public enum ERole {
  ROLE_EMPLOYEE,
  ROLE_HR,
  ROLE_HRMANAGER;

  // Méthode pour essayer de convertir une String en ERole
  public static ERole fromString(String roleName) {
    try {
      return ERole.valueOf(roleName.toUpperCase());
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}