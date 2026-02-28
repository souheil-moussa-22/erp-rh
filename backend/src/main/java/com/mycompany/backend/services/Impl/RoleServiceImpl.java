package com.mycompany.backend.services.Impl;

import com.mycompany.backend.entities.ERole;
import com.mycompany.backend.entities.Role;
import com.mycompany.backend.repositories.RoleRepository;
import com.mycompany.backend.services.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public Role createRole(String roleName) {
        // Vérifier le format du rôle
        if (!roleName.startsWith("ROLE_")) {
            throw new RuntimeException("Le nom du rôle doit commencer par ROLE_");
        }

        // Vérifier si le rôle existe déjà
        if (roleRepository.existsByRoleName(roleName)) {
            throw new RuntimeException("Le rôle " + roleName + " existe déjà");
        }

        // Créer le rôle
        Role role = new Role();
        role.setRoleName(roleName);

        return roleRepository.save(role);
    }

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    public Optional<Role> getRoleById(String id) {
        return roleRepository.findById(id);
    }

    @Override
    public Optional<Role> getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName);
    }

    @Override
    public boolean existsByName(String roleName) {
        return roleRepository.existsByRoleName(roleName);
    }

    @Override
    public Role updateRole(String id, String newName) {
        // Vérifier le format du rôle
        if (!newName.startsWith("ROLE_")) {
            throw new RuntimeException("Le nom du rôle doit commencer par ROLE_");
        }

        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé avec l'id: " + id));

        // Vérifier si le nouveau nom n'existe pas déjà
        Optional<Role> roleWithSameName = roleRepository.findByRoleName(newName);
        if (roleWithSameName.isPresent() && !roleWithSameName.get().getId().equals(id)) {
            throw new RuntimeException("Le rôle " + newName + " existe déjà");
        }

        // Mettre à jour le rôle
        existingRole.setRoleName(newName);
        return roleRepository.save(existingRole);
    }

    @Override
    public void deleteRole(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé avec l'id: " + id));
        roleRepository.delete(role);
    }

    @Override
    public void deleteAllRoles() {
        roleRepository.deleteAll();
    }
}