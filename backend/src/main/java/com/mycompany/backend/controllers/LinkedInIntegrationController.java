package com.mycompany.backend.controllers;

import com.mycompany.backend.config.LinkedInConfig;
import com.mycompany.backend.dto.*;

import com.mycompany.backend.services.Impl.JobOfferServiceImpl;
import com.mycompany.backend.services.LinkedInIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/linkedin")
@PreAuthorize("hasRole('HR') or hasRole('HRMANAGER') or hasRole('ADMIN')")
public class LinkedInIntegrationController {

    private static final Logger log = LoggerFactory.getLogger( JobOfferServiceImpl.class);
    @Autowired
    private LinkedInIntegrationService linkedInService;
    @Autowired
    private LinkedInConfig linkedInConfig;

    private final Map<String, String> oauthStates = new HashMap<>();
    //  INITIER L'AUTHENTIFICATION

    public LinkedInAuthResponse initiateAuth(String organizationId) {
        try {
            // Générer un state unique
            String state = UUID.randomUUID().toString();
            oauthStates.put(state, organizationId);

            // ⚡ SCOPES MODERNES (2024) - CORRIGÉ
            String scopes = "openid profile email w_member_social w_organization_social rw_organization_admin";

            // Construire l'URL d'autorisation
            String authUrl = String.format(
                    "https://www.linkedin.com/oauth/v2/authorization?" +
                            "response_type=code&" +
                            "client_id=%s&" +
                            "redirect_uri=%s&" +
                            "scope=%s&" +
                            "state=%s",
                    linkedInConfig.getClientId(),
                    linkedInConfig.getRedirectUri(),
                    scopes,
                    state
            );

            log.info("Generated LinkedIn auth URL for organization: {}", organizationId);

            return new LinkedInAuthResponse(authUrl, state, "Authorization URL generated successfully");

        } catch (Exception e) {
            log.error("Error initiating LinkedIn auth: {}", e.getMessage(), e);
            LinkedInAuthResponse response = new LinkedInAuthResponse();
            response.setSuccess(false);
            response.setMessage("Failed to generate auth URL: " + e.getMessage());
            return response;
        }
    }

    //  CALLBACK OAuth
    @GetMapping("/auth/callback")
    public ResponseEntity<?> handleCallback(
            @RequestParam String code,
            @RequestParam String state) {
        try {
            LinkedInTokenResponse response = linkedInService.handleCallback(code, state);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "authentication_failed",
                    "message", e.getMessage()
            ));
        }
    }

    //  PUBLIER UNE OFFRE
    @PostMapping("/job-offers/{id}/publish")
    public ResponseEntity<LinkedInPostResponse> publishJobOffer(@PathVariable String id) {
        LinkedInPostResponse response = linkedInService.publishJobOffer(id);
        return ResponseEntity.ok(response);
    }

    //  STATISTIQUES
    @GetMapping("/posts/{postId}/stats")
    public ResponseEntity<?> getPostStats(@PathVariable String postId) {
        try {
            Map<String, Object> stats = linkedInService.getPostStatistics(postId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "failed_to_get_stats",
                    "message", e.getMessage()
            ));
        }
    }

    //  ÉTAT DE L'INTÉGRATION
    @GetMapping("/integration/status")
    public ResponseEntity<?> getIntegrationStatus() {
        try {
            LinkedInIntegrationStatus status = linkedInService.getIntegrationStatus("current");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "message", "Not connected to LinkedIn"
            ));
        }
    }

    //  OFFRES PUBLIÉES
    @GetMapping("/published-posts")
    public ResponseEntity<?> getPublishedPosts() {
        try {
            return ResponseEntity.ok(linkedInService.getPublishedPosts("current"));
        } catch (Exception e) {
            return ResponseEntity.ok( List.of());
        }
    }
}