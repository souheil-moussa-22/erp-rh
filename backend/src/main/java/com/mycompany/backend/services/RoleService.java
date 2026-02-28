package com.mycompany.backend.services;

import com.mycompany.backend.entities.Role;

import java.util.List;
import java.util.Optional;

public interface RoleService {

    // CREATE
    Role createRole(String roleName);

    // READ
    List<Role> getAllRoles();
    Optional<Role> getRoleById(String id);
    Optional<Role> getRoleByName(String roleName);
    boolean existsByName(String roleName);

    // UPDATE
    Role updateRole(String id, String newName);

    // DELETE
    void deleteRole(String id);
    void deleteAllRoles();
}