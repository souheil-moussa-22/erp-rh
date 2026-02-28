package com.mycompany.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LinkedInPostResponse {
    private String id;
    private String activity;
    private String lifecycleState;
    private String errorMessage;
    private boolean success;
    private LocalDateTime createdAt;
    private String message;

    public LinkedInPostResponse() {
        this.success = true;
        this.createdAt = LocalDateTime.now();
    }
    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

}