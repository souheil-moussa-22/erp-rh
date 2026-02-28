package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
@Document(collection = "linkedin_integrations")
public class LinkedInIntegration {

    @Id
    private String id;

    @Field("organization_id")
    private String organizationId;

    @Field("organization_name")
    private String organizationName;

    @Field("access_token")
    private String accessToken;

    @Field("refresh_token")
    private String refreshToken;

    @Field("expires_at")
    private LocalDateTime expiresAt;

    @Field("scopes")
    private String scopes;

    @Field("status")
    private IntegrationStatus status;

    @Field("last_sync")
    private LocalDateTime lastSync;

    @Field("config")
    private Map<String, Object> config = new HashMap<>();

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;

    @Field("created_by")
    private String createdBy; // ID de l'admin RH qui a créé l'intégration

    @Field("is_active")
    private Boolean isActive = true;

    // Constructeur
    public LinkedInIntegration() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = IntegrationStatus.PENDING;
    }

    // Énumération des statuts
    public enum IntegrationStatus {
        PENDING,          // En attente de configuration
        ACTIVE,           // Actif et fonctionnel
        EXPIRED,          // Token expiré
        ERROR,            // Erreur de connexion
        DISABLED,         // Désactivé manuellement
        SYNCING           // Synchronisation en cours
    }

    // Méthodes utilitaires
    public boolean isTokenExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean canPublish() {
        return status == IntegrationStatus.ACTIVE && !isTokenExpired() && Boolean.TRUE.equals(isActive);
    }

    public void updateLastSync() {
        this.lastSync = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void activate() {
        this.status = IntegrationStatus.ACTIVE;
        this.isActive = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.status = IntegrationStatus.DISABLED;
        this.isActive = false;
        this.updatedAt = LocalDateTime.now();
    }
}