package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "oauth_states")
public class OAuthState {

    @Id
    private String id;

    @Field("state")
    private String state;

    @Field("organization_id")
    private String organizationId;

    @Field("redirect_uri")
    private String redirectUri;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("expires_at")
    private LocalDateTime expiresAt;

    public OAuthState() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusHours(1); // Expire après 1 heure
    }

    public boolean isValid() {
        return LocalDateTime.now().isBefore(this.expiresAt);
    }
}