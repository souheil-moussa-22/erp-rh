package com.mycompany.backend.dto;

import com.mycompany.backend.entities.Role;

public class RoleResponseDTO {
    private String id;
    private String roleName;

    // Constructeurs
    public RoleResponseDTO() {}

    public RoleResponseDTO(String id, String roleName) {
        this.id = id;
        this.roleName = roleName;
    }

    // Méthode de conversion depuis l'entité Role
    public static RoleResponseDTO fromRole(Role role) {
        if (role == null) {
            return null;
        }
        return new RoleResponseDTO(role.getId(), role.getRoleName());
    }

    // Getters et Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    @Override
    public String toString() {
        return "RoleResponseDTO{" +
                "id='" + id + '\'' +
                ", roleName='" + roleName + '\'' +
                '}';
    }
}