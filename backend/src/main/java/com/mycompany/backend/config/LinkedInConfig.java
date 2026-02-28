package com.mycompany.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Data
@Configuration
@ConfigurationProperties(prefix = "linkedin")
public class LinkedInConfig {

    private String clientId;
    private String clientSecret;
    private String redirectUri = "https://www.linkedin.com/developers/tools/oauth/redirect";
    private String apiUrl = "https://api.linkedin.com/v2";
    private int timeout = 30000;
    private int maxRetries = 3;

    @Bean
    public RestTemplate linkedInRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        // Configuration supplémentaire si nécessaire
        return restTemplate;
    }
}