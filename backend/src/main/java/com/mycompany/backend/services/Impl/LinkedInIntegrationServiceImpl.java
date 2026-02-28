package com.mycompany.backend.services.Impl;

import com.mycompany.backend.config.LinkedInConfig;
import com.mycompany.backend.dto.*;
import com.mycompany.backend.entities.*;
import com.mycompany.backend.repositories.LinkedInIntegrationRepository;
import com.mycompany.backend.repositories.JobOfferRepository;
import com.mycompany.backend.repositories.OAuthStateRepository;
import com.mycompany.backend.services.LinkedInIntegrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class LinkedInIntegrationServiceImpl implements LinkedInIntegrationService {

    @Autowired
    private LinkedInConfig linkedInConfig;

    @Autowired
    private LinkedInIntegrationRepository linkedInIntegrationRepository;

    @Autowired
    private JobOfferRepository jobOfferRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private OAuthStateRepository oauthStateRepository;

    @Override
    public LinkedInAuthResponse initiateAuth(String organizationId) {
        try {
            // Générer un state unique
            String state = UUID.randomUUID().toString();

            // Stocker dans MongoDB au lieu de la mémoire
            OAuthState oauthState = new OAuthState();
            oauthState.setState(state);
            oauthState.setOrganizationId(organizationId);
            oauthState.setRedirectUri(linkedInConfig.getRedirectUri());
            oauthStateRepository.save(oauthState);

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

    @Override
    public LinkedInTokenResponse handleCallback(String code, String state) {
        try {
            // Vérifier le state
            OAuthState oauthState = oauthStateRepository.findByState(state)
                    .orElseThrow(() -> new SecurityException("Invalid or expired state parameter"));

            if (!oauthState.isValid()) {
                oauthStateRepository.delete(oauthState);
                throw new SecurityException("State has expired");
            }

            String organizationId = oauthState.getOrganizationId();
            oauthStateRepository.delete(oauthState);

            // Échanger le code contre un token
            String tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            Map<String, String> params = new HashMap<>();
            params.put("grant_type", "authorization_code");
            params.put("code", code);
            params.put("redirect_uri", linkedInConfig.getRedirectUri());
            params.put("client_id", linkedInConfig.getClientId());
            params.put("client_secret", linkedInConfig.getClientSecret());

            HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> tokenData = response.getBody();

                // Créer ou mettre à jour l'intégration
                LinkedInIntegration integration = linkedInIntegrationRepository
                        .findByOrganizationId(organizationId)
                        .orElse(new LinkedInIntegration());

                integration.setOrganizationId(organizationId);
                integration.setAccessToken((String) tokenData.get("access_token"));
                integration.setRefreshToken((String) tokenData.get("refresh_token"));
                integration.setExpiresAt(LocalDateTime.now().plusSeconds(
                        ((Number) tokenData.get("expires_in")).intValue()
                ));
                integration.setScopes((String) tokenData.get("scope"));
                integration.setStatus(LinkedInIntegration.IntegrationStatus.ACTIVE);
                integration.setLastSync(LocalDateTime.now());
                integration.setIsActive(true);

                // Récupérer le nom de l'organisation via l'API LinkedIn
                try {
                    String orgName = fetchOrganizationName(integration.getAccessToken(), organizationId);
                    integration.setOrganizationName(orgName);
                } catch (Exception e) {
                    log.warn("Could not fetch organization name: {}", e.getMessage());
                    integration.setOrganizationName("Unknown Organization");
                }

                linkedInIntegrationRepository.save(integration);

                // Préparer la réponse
                LinkedInTokenResponse tokenResponse = new LinkedInTokenResponse();
                tokenResponse.setAccessToken(integration.getAccessToken());
                tokenResponse.setRefreshToken(integration.getRefreshToken());
                tokenResponse.setExpiresIn(((Number) tokenData.get("expires_in")).intValue());
                tokenResponse.setScope(integration.getScopes());
                tokenResponse.setExpiresAt(integration.getExpiresAt());
                tokenResponse.setOrganizationUrn("urn:li:organization:" + organizationId);
                tokenResponse.setMessage("LinkedIn integration established successfully");

                log.info("LinkedIn integration established for organization: {}", organizationId);
                return tokenResponse;
            } else {
                throw new RuntimeException("Failed to exchange code for token: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error handling LinkedIn callback: {}", e.getMessage(), e);
            LinkedInTokenResponse response = new LinkedInTokenResponse();
            response.setSuccess(false);
            response.setMessage("Failed to handle callback: " + e.getMessage());
            return response;
        }
    }

    //  méthode de nettoyage automatique
    @Scheduled(fixedDelay = 3600000) // Toutes les heures
    public void cleanupExpiredStates() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        oauthStateRepository.deleteByExpiresAtBefore(oneHourAgo);
        log.info("Cleaned up expired OAuth states");
    }

    @Override
    public LinkedInTokenResponse refreshToken(String refreshToken) {
        try {
            String tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            Map<String, String> params = new HashMap<>();
            params.put("grant_type", "refresh_token");
            params.put("refresh_token", refreshToken);
            params.put("client_id", linkedInConfig.getClientId());
            params.put("client_secret", linkedInConfig.getClientSecret());

            HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> tokenData = response.getBody();

                // Trouver l'intégration par refresh token
                Optional<LinkedInIntegration> integrationOpt = linkedInIntegrationRepository
                        .findByRefreshToken(refreshToken);

                if (integrationOpt.isPresent()) {
                    LinkedInIntegration integration = integrationOpt.get();
                    integration.setAccessToken((String) tokenData.get("access_token"));
                    integration.setRefreshToken((String) tokenData.get("refresh_token"));
                    integration.setExpiresAt(LocalDateTime.now().plusSeconds(
                            ((Number) tokenData.get("expires_in")).intValue()
                    ));
                    integration.setLastSync(LocalDateTime.now());

                    linkedInIntegrationRepository.save(integration);

                    LinkedInTokenResponse tokenResponse = new LinkedInTokenResponse();
                    tokenResponse.setAccessToken(integration.getAccessToken());
                    tokenResponse.setRefreshToken(integration.getRefreshToken());
                    tokenResponse.setExpiresIn(((Number) tokenData.get("expires_in")).intValue());
                    tokenResponse.setScope(integration.getScopes());
                    tokenResponse.setExpiresAt(integration.getExpiresAt());
                    tokenResponse.setMessage("Token refreshed successfully");

                    return tokenResponse;
                }
            }

            throw new RuntimeException("Failed to refresh token");

        } catch (Exception e) {
            log.error("Error refreshing LinkedIn token: {}", e.getMessage(), e);
            LinkedInTokenResponse response = new LinkedInTokenResponse();
            response.setSuccess(false);
            response.setMessage("Failed to refresh token: " + e.getMessage());
            return response;
        }
    }

    @Override
    public LinkedInPostResponse publishJobOffer(String jobOfferId) {
        try {
            JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                    .orElseThrow(() -> new RuntimeException("Job offer not found: " + jobOfferId));

            // Vérifier si l'offre est déjà publiée
            if (jobOffer.getLinkedInPostId() != null) {
                throw new RuntimeException("Job offer already published on LinkedIn");
            }

            // Récupérer une intégration active
            LinkedInIntegration integration = getActiveIntegration();

            // Formater le contenu LinkedIn
            String shareText = formatLinkedInContent(jobOffer);

            // Construire la requête UGC Post
            Map<String, Object> postRequest = buildPostRequest(integration.getOrganizationId(), shareText);

            // Appel API LinkedIn
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Restli-Protocol-Version", "2.0.0");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(postRequest, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.linkedin.com/v2/ugcPosts",
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String postId = (String) responseBody.get("id");

                // Mettre à jour l'offre
                jobOffer.setLinkedInPostId(postId);
                jobOffer.addExternalPlatform("LINKEDIN");
                jobOffer.setUpdatedAt(LocalDateTime.now());
                jobOfferRepository.save(jobOffer);

                // Mettre à jour l'intégration
                integration.setLastSync(LocalDateTime.now());
                linkedInIntegrationRepository.save(integration);

                LinkedInPostResponse postResponse = new LinkedInPostResponse();
                postResponse.setId(postId);
                postResponse.setSuccess(true);
                postResponse.setMessage("Job offer published successfully on LinkedIn");

                log.info("Job offer {} published on LinkedIn with post ID: {}", jobOfferId, postId);
                return postResponse;
            } else {
                throw new RuntimeException("LinkedIn API returned: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to publish job offer to LinkedIn: {}", e.getMessage(), e);
            LinkedInPostResponse response = new LinkedInPostResponse();
            response.setSuccess(false);
            response.setErrorMessage("Failed to publish to LinkedIn: " + e.getMessage());
            return response;
        }
    }

    @Override
    public LinkedInPostResponse updateJobPost(String jobOfferId) {
        // Implémentation similaire à publishJobOffer mais avec PUT
        // LinkedIn ne permet pas de mettre à jour directement, il faut supprimer et recréer
        return null;
    }

    @Override
    public void deleteJobPost(String jobOfferId) {
        try {
            JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                    .orElseThrow(() -> new RuntimeException("Job offer not found"));

            if (jobOffer.getLinkedInPostId() == null) {
                throw new RuntimeException("Job offer not published on LinkedIn");
            }

            LinkedInIntegration integration = getActiveIntegration();

            String url = "https://api.linkedin.com/v2/ugcPosts/" + jobOffer.getLinkedInPostId();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("X-Restli-Protocol-Version", "2.0.0");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);

            // Mettre à jour l'offre
            jobOffer.setLinkedInPostId(null);
            jobOffer.getExternalPlatforms().remove("LINKEDIN");
            jobOfferRepository.save(jobOffer);

            log.info("Deleted LinkedIn post {} for job offer {}", jobOffer.getLinkedInPostId(), jobOfferId);

        } catch (Exception e) {
            log.error("Failed to delete LinkedIn post: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete LinkedIn post: " + e.getMessage());
        }
    }

    @Override
    public LinkedInIntegration saveIntegration(LinkedInIntegration integration) {
        integration.setUpdatedAt(LocalDateTime.now());
        return linkedInIntegrationRepository.save(integration);
    }

    @Override
    public LinkedInIntegration getIntegration(String organizationId) {
        return linkedInIntegrationRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new RuntimeException("Integration not found for organization: " + organizationId));
    }

    @Override
    public List<LinkedInIntegration> getAllIntegrations() {
        return linkedInIntegrationRepository.findAll();
    }

    @Override
    public void disableIntegration(String integrationId) {
        LinkedInIntegration integration = linkedInIntegrationRepository.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Integration not found"));

        integration.deactivate();
        linkedInIntegrationRepository.save(integration);
    }

    @Override
    public void syncJobApplications(String integrationId) {
        // Synchroniser les candidatures depuis LinkedIn
        // À implémenter selon les besoins
        log.info("Syncing job applications for integration: {}", integrationId);
    }

    @Override
    public Map<String, Object> getPostStatistics(String postId) {
        try {
            LinkedInIntegration integration = getActiveIntegration();

            String url = "https://api.linkedin.com/v2/organizationalEntityShareStatistics" +
                    "?q=organizationalEntity" +
                    "&organizationalEntity=urn:li:organization:" + integration.getOrganizationId() +
                    "&ugcPostUrns=urn:li:ugcPost:" + postId;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("X-Restli-Protocol-Version", "2.0.0");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }

            return Collections.emptyMap();

        } catch (Exception e) {
            log.error("Failed to get post statistics: {}", e.getMessage(), e);
            return Collections.emptyMap();
        }
    }

    @Override
    public LinkedInIntegrationStatus getIntegrationStatus(String integrationId) {
        try {
            LinkedInIntegration integration = linkedInIntegrationRepository.findById(integrationId)
                    .orElseThrow(() -> new RuntimeException("Integration not found"));

            LinkedInIntegrationStatus status = new LinkedInIntegrationStatus();
            status.setConnected(integration.canPublish());
            status.setStatus(integration.getStatus().name());
            status.setLastSync(integration.getLastSync());
            status.setExpiresAt(integration.getExpiresAt());
            status.setOrganizationName(integration.getOrganizationName());

            // Ajouter des statistiques basiques
            Map<String, Object> stats = new HashMap<>();
            stats.put("can_publish", integration.canPublish());
            stats.put("token_expired", integration.isTokenExpired());
            stats.put("days_until_expiry",
                    integration.getExpiresAt() != null ?
                            java.time.Duration.between(LocalDateTime.now(), integration.getExpiresAt()).toDays() : 0);

            status.setStatistics(stats);
            status.setMessage("Integration status retrieved successfully");

            return status;

        } catch (Exception e) {
            LinkedInIntegrationStatus status = new LinkedInIntegrationStatus();
            status.setConnected(false);
            status.setStatus("ERROR");
            status.setMessage("Failed to get integration status: " + e.getMessage());
            return status;
        }
    }

    @Override
    public List<LinkedInPost> getPublishedPosts(String organizationId) {
        // À implémenter: récupérer les posts publiés depuis la base de données
        // Pour l'instant, retourner une liste vide
        return Collections.emptyList();
    }

    // Méthodes privées utilitaires

    private LinkedInIntegration getActiveIntegration() {
        List<LinkedInIntegration> activeIntegrations = linkedInIntegrationRepository
                .findByStatus(LinkedInIntegration.IntegrationStatus.ACTIVE);

        log.info("Found {} active LinkedIn integrations", activeIntegrations.size());

        if (activeIntegrations.isEmpty()) {
            throw new RuntimeException("No active LinkedIn integration found");
        }

        // Retourner la première intégration active
        LinkedInIntegration integration = activeIntegrations.get(0);

        // Vérifier si le token est expiré
        if (integration.isTokenExpired()) {
            integration.setStatus(LinkedInIntegration.IntegrationStatus.EXPIRED);
            linkedInIntegrationRepository.save(integration);
            throw new RuntimeException("LinkedIn access token has expired. Please refresh the token.");
        }

        return integration;
    }

    private String fetchOrganizationName(String accessToken, String organizationId) {
        try {
            String url = "https://api.linkedin.com/v2/organizations/" + organizationId;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("X-Restli-Protocol-Version", "2.0.0");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> orgData = response.getBody();
                return (String) orgData.get("name");
            }
        } catch (Exception e) {
            log.warn("Could not fetch organization name from LinkedIn API: {}", e.getMessage());
        }

        return null;
    }

    private String formatLinkedInContent(JobOffer jobOffer) {
        StringBuilder sb = new StringBuilder();

        sb.append(" NOUS RECRUTONS : ").append(jobOffer.getTitle()).append("\n\n");
        sb.append(" Localisation : ").append(jobOffer.getLocation()).append("\n");
        sb.append(" Type de contrat : ").append(jobOffer.getContractType()).append("\n");
        sb.append(" Département : ").append(jobOffer.getDepartment()).append("\n\n");

        if (jobOffer.getDescription() != null) {
            String description = jobOffer.getDescription();
            if (description.length() > 200) {
                sb.append(description.substring(0, 200)).append("...\n\n");
            } else {
                sb.append(description).append("\n\n");
            }
        }

        if (jobOffer.getRequirements() != null && !jobOffer.getRequirements().isEmpty()) {
            sb.append(" EXIGENCES :\n");
            String requirements = jobOffer.getRequirements();
            if (requirements.length() > 150) {
                sb.append(requirements.substring(0, 150)).append("...\n\n");
            } else {
                sb.append(requirements).append("\n\n");
            }
        }

        if (jobOffer.getClosingDate() != null) {
            sb.append(" Date limite de candidature : ")
                    .append(jobOffer.getClosingDate()).append("\n\n");
        }

        sb.append(" Postulez maintenant !\n\n");

        // Hashtags
        sb.append("#recrutement #emploi #offredemploi");

        if (jobOffer.getDepartment() != null) {
            sb.append(" #").append(jobOffer.getDepartment().replace(" ", "").toLowerCase());
        }

        if (jobOffer.getLocation() != null) {
            sb.append(" #").append(jobOffer.getLocation().replace(" ", "").toLowerCase());
        }

        return sb.toString();
    }

    private Map<String, Object> buildPostRequest(String organizationId, String shareText) {
        Map<String, Object> request = new HashMap<>();
        request.put("author", "urn:li:organization:" + organizationId);
        request.put("lifecycleState", "PUBLISHED");

        Map<String, Object> specificContent = new HashMap<>();
        Map<String, Object> shareContent = new HashMap<>();
        Map<String, Object> shareCommentary = new HashMap<>();

        shareCommentary.put("text", shareText);
        shareContent.put("shareCommentary", shareCommentary);
        shareContent.put("shareMediaCategory", "NONE");
        specificContent.put("com.linkedin.ugc.ShareContent", shareContent);

        request.put("specificContent", specificContent);

        Map<String, Object> visibility = new HashMap<>();
        visibility.put("com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC");
        request.put("visibility", visibility);

        return request;
    }
}