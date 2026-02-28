package com.mycompany.backend.services;

import com.mycompany.backend.dto.JobOfferDTO;
import com.mycompany.backend.dto.JobOfferRequest;
import com.mycompany.backend.dto.LinkedInPostResponse;
import com.mycompany.backend.entities.JobOffer;

import java.util.List;
import java.util.Optional;

public interface JobOfferService {

    // Basic CRUD
    JobOfferDTO create(JobOfferRequest request, String publisherId);
    Optional<JobOfferDTO> getById(String id);
    List<JobOfferDTO> getAll();
    JobOfferDTO update(String id, JobOfferRequest request);
    void delete(String id);

    // Status Management
    JobOfferDTO publish(String id);
    JobOfferDTO close(String id);
    JobOfferDTO draft(String id);
    void archive(String id);

    // Search & Filter
    List<JobOfferDTO> search(String keyword);
    List<JobOfferDTO> getByStatus(JobOffer.JobOfferStatus status);
    List<JobOfferDTO> getByDepartment(String department);
    List<JobOfferDTO> getByLocation(String location);
    List<JobOfferDTO> getActive();
    List<JobOfferDTO> getPublished();
    List<JobOfferDTO> getByPublisher(String publisherId);

    // Analytics
    long getCount();
    long getCountByStatus(JobOffer.JobOfferStatus status);
    List<JobOfferDTO> getRecent(int days);

    // External Platforms
    JobOfferDTO postToLinkedIn(String jobOfferId);
    JobOfferDTO removeFromPlatform(String jobOfferId, String platform);

    // Utilities
    void incrementViews(String id);
    void expireOldOffers();
    boolean isExpired(String id);

    // Méthodes LinkedIn - CORRIGÉES
    LinkedInPostResponse publishToLinkedIn(String jobOfferId);
    JobOfferDTO publishToIndeed(String jobOfferId);
    JobOfferDTO unpublishFromLinkedIn(String jobOfferId);
    LinkedInPostResponse updateLinkedInPost(String jobOfferId);
}