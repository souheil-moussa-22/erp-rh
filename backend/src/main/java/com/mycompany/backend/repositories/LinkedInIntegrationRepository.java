package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.LinkedInIntegration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinkedInIntegrationRepository extends MongoRepository<LinkedInIntegration, String> {

    // Trouver par ID d'organisation
    Optional<LinkedInIntegration> findByOrganizationId(String organizationId);

    // Trouver par statut
    List<LinkedInIntegration> findByStatus(LinkedInIntegration.IntegrationStatus status);

    // Vérifier si une organisation a déjà une intégration
    boolean existsByOrganizationId(String organizationId);

    // Trouver les intégrations actives
    List<LinkedInIntegration> findByStatusOrderByLastSyncDesc(LinkedInIntegration.IntegrationStatus status);

    // Trouver par token d'accès
    Optional<LinkedInIntegration> findByAccessToken(String accessToken);

    Optional<LinkedInIntegration> findByRefreshToken(String refreshToken);

    // Méthodes supplémentaires utiles
    List<LinkedInIntegration> findByIsActiveTrue();

    Optional<LinkedInIntegration> findByOrganizationIdAndStatus(String organizationId, LinkedInIntegration.IntegrationStatus status);

    long countByStatus(LinkedInIntegration.IntegrationStatus status);
}