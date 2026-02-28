package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "oauth_states")
public class OAuthState {
    @Id
    private String id;

    private String state;
    private String organizationId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String redirectUri;
    private String scope;

    public OAuthState() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(10); // Expire après 10 min
    }

    public boolean isValid() {
        return LocalDateTime.now().isBefore(expiresAt);
    }
}