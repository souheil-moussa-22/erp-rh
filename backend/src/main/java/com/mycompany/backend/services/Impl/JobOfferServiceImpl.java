package com.mycompany.backend.services.Impl;

import com.mycompany.backend.config.LinkedInConfig;
import com.mycompany.backend.dto.JobOfferDTO;
import com.mycompany.backend.dto.JobOfferRequest;
import com.mycompany.backend.dto.LinkedInPostResponse;
import com.mycompany.backend.dto.ai.AiSuggestionRequest;
import com.mycompany.backend.dto.ai.AiSuggestionResponse;
import com.mycompany.backend.entities.JobOffer;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.repositories.JobOfferRepository;
import com.mycompany.backend.services.AiService;
import com.mycompany.backend.services.EmployeeService;
import com.mycompany.backend.services.JobOfferService;
import com.mycompany.backend.services.LinkedInIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JobOfferServiceImpl implements JobOfferService {

    private static final Logger log = LoggerFactory.getLogger(JobOfferServiceImpl.class);

    @Autowired
    private JobOfferRepository jobOfferRepository;

    @Autowired
    private AiService aiService;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private LinkedInConfig linkedInConfig;

    @Autowired
    private LinkedInIntegrationService linkedInService;

    @Override
    public JobOfferDTO create(JobOfferRequest request, String publisherId) {
        Employee publisher = employeeService.getEmployeeById(publisherId)
                .orElseThrow(() -> new RuntimeException("Publisher not found"));

        JobOffer jobOffer = new JobOffer();
        mapRequestToEntity(request, jobOffer);

        jobOffer.setPublishedBy(publisher);
        jobOffer.setStatus(JobOffer.JobOfferStatus.DRAFT);
        jobOffer.setIsActive(true);

        JobOffer saved = jobOfferRepository.save(jobOffer);
        return convertToDTO(saved);
    }

    @Override
    public Optional<JobOfferDTO> getById(String id) {
        Optional<JobOffer> jobOffer = jobOfferRepository.findById(id);
        if (jobOffer.isPresent() && jobOffer.get().getIsActive()) {
            incrementViews(id);
            return jobOffer.map(this::convertToDTO);
        }
        return Optional.empty();
    }

    @Override
    public List<JobOfferDTO> getAll() {
        List<JobOffer> jobOffers = jobOfferRepository.findByIsActiveOrderByCreatedAtDesc(true,
                org.springframework.data.domain.Pageable.unpaged());
        return convertToDTOList(jobOffers);
    }

    @Override
    public JobOfferDTO update(String id, JobOfferRequest request) {
        JobOffer jobOffer = jobOfferRepository.findById(id)
                .filter(JobOffer::getIsActive)
                .orElseThrow(() -> new RuntimeException("JobOffer not found"));

        updateEntityFromRequest(request, jobOffer);
        jobOffer.setUpdatedAt(LocalDateTime.now());

        JobOffer updated = jobOfferRepository.save(jobOffer);
        return convertToDTO(updated);
    }

    @Override
    public void delete(String id) {
        JobOffer jobOffer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("JobOffer not found"));

        jobOffer.setIsActive(false);
        jobOffer.setUpdatedAt(LocalDateTime.now());
        jobOfferRepository.save(jobOffer);
    }

    @Override
    public JobOfferDTO publish(String id) {
        return updateStatus(id, JobOffer.JobOfferStatus.PUBLISHED, LocalDate.now());
    }

    @Override
    public JobOfferDTO close(String id) {
        return updateStatus(id, JobOffer.JobOfferStatus.CLOSED, null);
    }

    @Override
    public JobOfferDTO draft(String id) {
        return updateStatus(id, JobOffer.JobOfferStatus.DRAFT, null);
    }

    @Override
    public void archive(String id) {
        updateStatus(id, JobOffer.JobOfferStatus.ARCHIVED, null);
    }

    @Override
    public List<JobOfferDTO> search(String keyword) {
        List<JobOffer> jobOffers = jobOfferRepository.searchByKeyword(keyword);
        return convertToDTOList(jobOffers);
    }

    @Override
    public List<JobOfferDTO> getByStatus(JobOffer.JobOfferStatus status) {
        List<JobOffer> jobOffers = jobOfferRepository.findByStatusAndIsActive(status, true);
        return convertToDTOList(jobOffers);
    }

    @Override
    public List<JobOfferDTO> getByDepartment(String department) {
        List<JobOffer> jobOffers = jobOfferRepository.findByDepartment(department);
        return convertToDTOList(jobOffers);
    }

    @Override
    public List<JobOfferDTO> getByLocation(String location) {
        List<JobOffer> jobOffers = jobOfferRepository.findByLocation(location);
        return convertToDTOList(jobOffers);
    }

    @Override
    public List<JobOfferDTO> getActive() {
        List<JobOffer> jobOffers = jobOfferRepository.findActiveJobOffers();
        return convertToDTOList(jobOffers);
    }

    @Override
    public List<JobOfferDTO> getPublished() {
        return getByStatus(JobOffer.JobOfferStatus.PUBLISHED);
    }

    @Override
    public List<JobOfferDTO> getByPublisher(String publisherId) {
        List<JobOffer> allOffers = jobOfferRepository.findByIsActiveOrderByCreatedAtDesc(true,
                org.springframework.data.domain.Pageable.unpaged());

        return allOffers.stream()
                .filter(offer -> offer.getPublishedBy() != null &&
                        offer.getPublishedBy().getId().equals(publisherId))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public long getCount() {
        return jobOfferRepository.count();
    }

    @Override
    public long getCountByStatus(JobOffer.JobOfferStatus status) {
        return jobOfferRepository.countByStatus(status);
    }

    @Override
    public List<JobOfferDTO> getRecent(int days) {
        LocalDateTime date = LocalDateTime.now().minusDays(days);
        List<JobOffer> jobOffers = jobOfferRepository.findRecentJobOffers(date);
        return convertToDTOList(jobOffers);
    }

    @Override
    public JobOfferDTO postToLinkedIn(String jobOfferId) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("JobOffer not found"));

        String linkedInPostId = "linkedin_" + System.currentTimeMillis();
        jobOffer.setLinkedInPostId(linkedInPostId);
        jobOffer.addExternalPlatform("LINKEDIN");
        jobOffer.setUpdatedAt(LocalDateTime.now());

        JobOffer saved = jobOfferRepository.save(jobOffer);
        return convertToDTO(saved);
    }

    @Override
    public JobOfferDTO removeFromPlatform(String jobOfferId, String platform) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("JobOffer not found"));

        if ("LINKEDIN".equalsIgnoreCase(platform)) {
            jobOffer.setLinkedInPostId(null);
        }

        jobOffer.getExternalPlatforms().remove(platform.toUpperCase());
        jobOffer.setUpdatedAt(LocalDateTime.now());

        JobOffer saved = jobOfferRepository.save(jobOffer);
        return convertToDTO(saved);
    }

    @Override
    public void incrementViews(String id) {
        jobOfferRepository.findById(id).ifPresent(jobOffer -> {
            jobOffer.incrementViewCount();
            jobOfferRepository.save(jobOffer);
        });
    }

    @Override
    public void expireOldOffers() {
        List<JobOffer> expiredOffers = jobOfferRepository.findExpiredJobOffers(LocalDate.now());
        expiredOffers.forEach(jobOffer -> {
            jobOffer.setStatus(JobOffer.JobOfferStatus.EXPIRED);
            jobOffer.setUpdatedAt(LocalDateTime.now());
        });
        jobOfferRepository.saveAll(expiredOffers);
    }

    @Override
    public boolean isExpired(String id) {
        return jobOfferRepository.findById(id)
                .map(JobOffer::isExpired)
                .orElse(false);
    }

    @Override
    public LinkedInPostResponse publishToLinkedIn(String jobOfferId) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("Job offer not found"));

        int retryCount = 0;
        Exception lastException = null;

        //  Utilisez linkedInConfig après l'avoir injecté
        while (retryCount < linkedInConfig.getMaxRetries()) {
            try {
                LinkedInPostResponse response = linkedInService.publishJobOffer(jobOfferId);

                if (response.isSuccess()) {
                    // Mettre à jour l'offre avec l'ID du post LinkedIn
                    jobOffer.setLinkedInPostId(response.getId());
                    jobOffer.addExternalPlatform("LINKEDIN");
                    jobOffer.setUpdatedAt(LocalDateTime.now());
                    jobOfferRepository.save(jobOffer);

                    log.info("Job offer {} published to LinkedIn with post ID: {}",
                            jobOfferId, response.getId());
                    return response;
                } else {
                    throw new RuntimeException("LinkedIn API error: " + response.getErrorMessage());
                }
            } catch (Exception e) {
                retryCount++;
                lastException = e;

                if (retryCount < linkedInConfig.getMaxRetries()) {
                    log.warn("Attempt {} failed for job offer {}. Retrying in {}ms...",
                            retryCount, jobOfferId, 1000 * retryCount);
                    try {
                        Thread.sleep(1000 * retryCount); // Backoff linéaire
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Publishing interrupted", ie);
                    }
                }
            }
        }

        // Si on arrive ici, toutes les tentatives ont échoué
        log.error("Failed to publish job offer {} to LinkedIn after {} attempts",
                jobOfferId, linkedInConfig.getMaxRetries(), lastException);

        LinkedInPostResponse errorResponse = new LinkedInPostResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorMessage("Failed after " + linkedInConfig.getMaxRetries() +
                " retries: " + lastException.getMessage());
        return errorResponse;
    }

    @Override
    public JobOfferDTO publishToIndeed(String jobOfferId) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("Job offer not found"));

        String indeedJobKey = "indeed_" + System.currentTimeMillis();
        jobOffer.addExternalPlatform("INDEED");
        jobOffer.setUpdatedAt(LocalDateTime.now());
        jobOffer = jobOfferRepository.save(jobOffer);

        log.info("Job offer {} published to Indeed with job key: {}", jobOfferId, indeedJobKey);
        return convertToDTO(jobOffer);
    }

    @Override
    public JobOfferDTO unpublishFromLinkedIn(String jobOfferId) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("Job offer not found"));

        if (jobOffer.getLinkedInPostId() != null) {
            try {
                linkedInService.deleteJobPost(jobOffer.getLinkedInPostId());
                log.info("Successfully unpublished job offer {} from LinkedIn", jobOfferId);
            } catch (Exception e) {
                log.warn("Failed to delete LinkedIn post, but removing local reference: {}", e.getMessage());
            }

            jobOffer.setLinkedInPostId(null);
            jobOffer.getExternalPlatforms().remove("LINKEDIN");
            jobOffer.setUpdatedAt(LocalDateTime.now());
            jobOffer = jobOfferRepository.save(jobOffer);

            log.info("Job offer {} unpublished from LinkedIn", jobOfferId);
        }

        return convertToDTO(jobOffer);
    }

    @Override
    public LinkedInPostResponse updateLinkedInPost(String jobOfferId) {
        JobOffer jobOffer = jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new RuntimeException("Job offer not found"));

        if (jobOffer.getLinkedInPostId() == null) {
            throw new RuntimeException("Job offer is not published on LinkedIn");
        }

        LinkedInPostResponse response = linkedInService.updateJobPost(jobOfferId);

        if (response.isSuccess()) {
            jobOffer.setUpdatedAt(LocalDateTime.now());
            jobOfferRepository.save(jobOffer);
            log.info("LinkedIn post updated for job offer {}", jobOfferId);
        } else {
            throw new RuntimeException("Failed to update LinkedIn post: " + response.getErrorMessage());
        }

        return response;
    }

    // ========== MÉTHODES AI ==========

    public AiSuggestionResponse generateJobDescriptionAI(String jobTitle, String department, String location) {
        try {
            AiSuggestionRequest request = new AiSuggestionRequest();
            request.setJobTitle(jobTitle);
            request.setType(AiSuggestionRequest.AiSuggestionType.JOB_DESCRIPTION);
            request.setContext(String.format("Department: %s, Location: %s", department, location));

            return aiService.generateSuggestion(request);
        } catch (Exception e) {
            log.error("Error generating job description with AI: {}", e.getMessage());
            return AiSuggestionResponse.error("Failed to generate job description: " + e.getMessage());
        }
    }

    public AiSuggestionResponse improveJobOfferAI(JobOfferRequest jobOfferRequest) {
        try {
            StringBuilder context = new StringBuilder();
            context.append("Job Title: ").append(jobOfferRequest.getTitle()).append("\n");
            context.append("Department: ").append(jobOfferRequest.getDepartment()).append("\n");
            context.append("Location: ").append(jobOfferRequest.getLocation()).append("\n");

            AiSuggestionResponse improvedDescription = aiService.improveText(
                    jobOfferRequest.getDescription(),
                    context.toString()
            );

            return improvedDescription;
        } catch (Exception e) {
            log.error("Error improving job offer with AI: {}", e.getMessage());
            return AiSuggestionResponse.error("Failed to improve job offer: " + e.getMessage());
        }
    }

    public List<String> suggestJobTitlesAI(String description) {
        try {
            AiSuggestionResponse response = aiService.generateMultipleTitles(description);
            if (response.getSuggestion() != null) {
                String[] titles = response.getSuggestion().split("\n");
                return Arrays.stream(titles)
                        .map(String::trim)
                        .filter(title -> !title.isEmpty())
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Error suggesting job titles with AI: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public AiSuggestionResponse generateCompleteJobOfferAI(JobOfferRequest basicInfo) {
        try {
            AiSuggestionRequest request = new AiSuggestionRequest();
            request.setJobTitle(basicInfo.getTitle());
            request.setType(AiSuggestionRequest.AiSuggestionType.JOB_DESCRIPTION);
            request.setContext(String.format(
                    "Department: %s, Location: %s, Contract: %s, Experience: %s, Education: %s",
                    basicInfo.getDepartment(),
                    basicInfo.getLocation(),
                    basicInfo.getContractType(),
                    basicInfo.getExperienceLevel(),
                    basicInfo.getEducationRequired()
            ));

            return aiService.generateSuggestion(request);
        } catch (Exception e) {
            log.error("Error generating complete job offer with AI: {}", e.getMessage());
            return AiSuggestionResponse.error("Failed to generate job offer: " + e.getMessage());
        }
    }

    // ========== MÉTHODES PRIVÉES ==========

    private JobOfferDTO convertToDTO(JobOffer jobOffer) {
        JobOfferDTO dto = new JobOfferDTO();
        dto.setId(jobOffer.getId());
        dto.setTitle(jobOffer.getTitle());
        dto.setDescription(jobOffer.getDescription());
        dto.setDepartment(jobOffer.getDepartment());
        dto.setLocation(jobOffer.getLocation());
        dto.setContractType(jobOffer.getContractType());
        dto.setRequirements(jobOffer.getRequirements());
        dto.setResponsibilities(jobOffer.getResponsibilities());
        dto.setBenefits(jobOffer.getBenefits());

        // Conversion du statut Enum vers String
        if (jobOffer.getStatus() != null) {
            dto.setStatus(jobOffer.getStatus().name());
        }

        dto.setPublishedBy(jobOffer.getPublishedBy() != null ? jobOffer.getPublishedBy().getId() : null);
        dto.setPublishedDate(jobOffer.getPublishedDate());
        dto.setClosingDate(jobOffer.getClosingDate());
        dto.setCreatedAt(jobOffer.getCreatedAt());
        dto.setUpdatedAt(jobOffer.getUpdatedAt());
        dto.setLinkedInPostId(jobOffer.getLinkedInPostId());
        dto.setExternalPlatforms(jobOffer.getExternalPlatforms());
        dto.setApplicationCount(jobOffer.getApplicationCount());
        dto.setViewCount(jobOffer.getViewCount());
        dto.setTags(jobOffer.getTags());
        dto.setExperienceLevel(jobOffer.getExperienceLevel());
        dto.setEducationRequired(jobOffer.getEducationRequired());

        // Utilisation de setIsActive au lieu de setActive
        dto.setIsActive(jobOffer.getIsActive());

        return dto;
    }

    private List<JobOfferDTO> convertToDTOList(List<JobOffer> jobOffers) {
        return jobOffers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void mapRequestToEntity(JobOfferRequest request, JobOffer jobOffer) {
        jobOffer.setTitle(request.getTitle());
        jobOffer.setDescription(request.getDescription());
        jobOffer.setDepartment(request.getDepartment());
        jobOffer.setLocation(request.getLocation());
        jobOffer.setContractType(request.getContractType());
        jobOffer.setRequirements(request.getRequirements());
        jobOffer.setResponsibilities(request.getResponsibilities());
        jobOffer.setBenefits(request.getBenefits());
        jobOffer.setClosingDate(request.getClosingDate());
        if (request.getTags() != null) {
            jobOffer.setTags(new HashSet<>(request.getTags()));
        }
        jobOffer.setExperienceLevel(request.getExperienceLevel());
        jobOffer.setEducationRequired(request.getEducationRequired());
    }

    private void updateEntityFromRequest(JobOfferRequest request, JobOffer jobOffer) {
        if (request.getTitle() != null) jobOffer.setTitle(request.getTitle());
        if (request.getDescription() != null) jobOffer.setDescription(request.getDescription());
        if (request.getDepartment() != null) jobOffer.setDepartment(request.getDepartment());
        if (request.getLocation() != null) jobOffer.setLocation(request.getLocation());
        if (request.getContractType() != null) jobOffer.setContractType(request.getContractType());
        if (request.getRequirements() != null) jobOffer.setRequirements(request.getRequirements());
        if (request.getResponsibilities() != null) jobOffer.setResponsibilities(request.getResponsibilities());
        if (request.getBenefits() != null) jobOffer.setBenefits(request.getBenefits());
        if (request.getClosingDate() != null) jobOffer.setClosingDate(request.getClosingDate());
        if (request.getTags() != null) jobOffer.setTags(new HashSet<>(request.getTags()));
        if (request.getExperienceLevel() != null) jobOffer.setExperienceLevel(request.getExperienceLevel());
        if (request.getEducationRequired() != null) jobOffer.setEducationRequired(request.getEducationRequired());
    }

    private JobOfferDTO updateStatus(String id, JobOffer.JobOfferStatus status, LocalDate publishDate) {
        JobOffer jobOffer = jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("JobOffer not found"));

        jobOffer.setStatus(status);
        jobOffer.setUpdatedAt(LocalDateTime.now());
        if (publishDate != null) {
            jobOffer.setPublishedDate(publishDate);
        }

        JobOffer saved = jobOfferRepository.save(jobOffer);
        return convertToDTO(saved);
    }
}