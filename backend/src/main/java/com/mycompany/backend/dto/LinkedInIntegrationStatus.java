package com.mycompany.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class LinkedInIntegrationStatus {
    private boolean connected;
    private String status;
    private LocalDateTime lastSync;
    private LocalDateTime expiresAt;
    private String organizationName;
    private Map<String, Object> statistics;
    private String message;

    public LinkedInIntegrationStatus() {
        this.connected = false;
        this.status = "DISCONNECTED";
    }
}