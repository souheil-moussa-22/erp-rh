package com.mycompany.backend.services;

import com.mycompany.backend.dto.*;
import com.mycompany.backend.entities.JobOffer;
import com.mycompany.backend.entities.LinkedInIntegration;
import com.mycompany.backend.entities.LinkedInPost;

import java.util.List;
import java.util.Map;

public interface LinkedInIntegrationService {

    // Authentification OAuth
    LinkedInAuthResponse initiateAuth(String organizationId);
    LinkedInTokenResponse handleCallback(String code, String state);
    LinkedInTokenResponse refreshToken(String refreshToken);

    // Publication d'offres
    LinkedInPostResponse publishJobOffer(String jobOfferId);
    LinkedInPostResponse updateJobPost(String jobOfferId);
    void deleteJobPost(String jobOfferId);

    // Gestion des intégrations
    LinkedInIntegration saveIntegration(LinkedInIntegration integration);
    LinkedInIntegration getIntegration(String organizationId);
    List<LinkedInIntegration> getAllIntegrations();
    void disableIntegration(String integrationId);

    // Synchronisation
    void syncJobApplications(String integrationId);
    Map<String, Object> getPostStatistics(String postId);

    // Monitoring
    LinkedInIntegrationStatus getIntegrationStatus(String integrationId);
    List<LinkedInPost> getPublishedPosts(String organizationId);
}