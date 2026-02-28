package com.mycompany.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LinkedInTokenResponse {
    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
    private String scope;
    private LocalDateTime expiresAt;
    private String organizationUrn;
    private String message;
    private boolean success;

    public LinkedInTokenResponse() {
        this.success = true;
    }
}