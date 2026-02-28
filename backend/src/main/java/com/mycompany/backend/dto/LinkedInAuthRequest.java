package com.mycompany.backend.dto;

import lombok.Data;

@Data
public class LinkedInAuthRequest {
    private String organizationId;
    private String organizationName;
    private String redirectUri = "https://www.linkedin.com/developers/tools/oauth/redirect";
}