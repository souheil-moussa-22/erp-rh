package com.mycompany.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RoleDTO {

    @NotBlank(message = "Le nom du rôle est obligatoire")
    @Pattern(regexp = "^ROLE_[A-Z_]+$",
            message = "Le nom du rôle doit commencer par ROLE_ et contenir seulement des lettres majuscules et underscores")
    private String roleName;

    // Constructeur par défaut
    public RoleDTO() {
    }

    // Constructeur avec paramètre
    public RoleDTO(String roleName) {
        this.roleName = roleName;
    }

    // Getter
    public String getRoleName() {
        return roleName;
    }

    // Setter
    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}