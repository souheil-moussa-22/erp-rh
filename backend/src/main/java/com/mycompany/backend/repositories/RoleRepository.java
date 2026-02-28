package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.ERole;
import com.mycompany.backend.entities.Role;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoleRepository extends MongoRepository<Role, String> {

  // Chercher par ERole (rôles prédéfinis)
  Optional<Role> findByName(ERole name);

  // Chercher par customName (rôles personnalisés)
  Optional<Role> findByCustomName(String customName);

  // Méthode pour chercher par nom de rôle (soit name soit customName)
  default Optional<Role> findByRoleName(String roleName) {
    // Essayer d'abord avec ERole
    ERole eRole = ERole.fromString(roleName);
    if (eRole != null) {
      Optional<Role> roleByName = findByName(eRole);
      if (roleByName.isPresent()) {
        return roleByName;
      }
    }

    // Si pas trouvé, chercher dans customName
    return findByCustomName(roleName);
  }

  // Vérifier l'existence d'un rôle
  default boolean existsByRoleName(String roleName) {
    return findByRoleName(roleName).isPresent();
  }
}