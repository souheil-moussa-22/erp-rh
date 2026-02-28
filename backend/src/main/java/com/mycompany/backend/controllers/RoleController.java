package com.mycompany.backend.controllers;

import com.mycompany.backend.dto.RoleDTO;
import com.mycompany.backend.dto.RoleResponseDTO;
import com.mycompany.backend.entities.Role;
import com.mycompany.backend.services.RoleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    // CREATE - Créer un nouveau rôle
    @PostMapping
    public ResponseEntity<?> createRole(@Valid @RequestBody RoleDTO roleDTO) {
        try {
            Role createdRole = roleService.createRole(roleDTO.getRoleName());
            RoleResponseDTO response = RoleResponseDTO.fromRole(createdRole);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // READ - Récupérer tous les rôles
    @GetMapping
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        try {
            List<Role> roles = roleService.getAllRoles();
            List<RoleResponseDTO> response = roles.stream()
                    .map(RoleResponseDTO::fromRole)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // READ - Récupérer un rôle par ID
    @GetMapping("/{id}")
    public ResponseEntity<RoleResponseDTO> getRoleById(@PathVariable String id) {
        return roleService.getRoleById(id)
                .map(RoleResponseDTO::fromRole)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ - Récupérer un rôle par nom
    @GetMapping("/name/{roleName}")
    public ResponseEntity<RoleResponseDTO> getRoleByName(@PathVariable String roleName) {
        return roleService.getRoleByName(roleName)
                .map(RoleResponseDTO::fromRole)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ - Vérifier si un rôle existe
    @GetMapping("/exists/{roleName}")
    public ResponseEntity<Boolean> roleExists(@PathVariable String roleName) {
        boolean exists = roleService.existsByName(roleName);
        return ResponseEntity.ok(exists);
    }

    // UPDATE - Mettre à jour un rôle
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable String id, @Valid @RequestBody RoleDTO roleDTO) {
        try {
            Role updatedRole = roleService.updateRole(id, roleDTO.getRoleName());
            RoleResponseDTO response = RoleResponseDTO.fromRole(updatedRole);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE - Supprimer un rôle par ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRole(@PathVariable String id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok("Rôle supprimé avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE - Supprimer tous les rôles
    @DeleteMapping
    public ResponseEntity<String> deleteAllRoles() {
        roleService.deleteAllRoles();
        return ResponseEntity.ok("Tous les rôles ont été supprimés avec succès");
    }
}