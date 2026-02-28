package com.mycompany.backend.dto;

import lombok.Data;

@Data
public class LinkedInAuthResponse {
    private String authUrl;
    private String state;
    private String message;
    private boolean success;

    public LinkedInAuthResponse() {
        this.success = true;
    }

    public LinkedInAuthResponse(String authUrl, String state, String message) {
        this.authUrl = authUrl;
        this.state = state;
        this.message = message;
        this.success = true;
    }
}