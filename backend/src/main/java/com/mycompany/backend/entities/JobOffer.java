package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Document(collection = "jobOffers")
public class JobOffer {
    @Id
    private String id;

    private String title;
    private String description;
    private String department;
    private String location;

    @Field("contract_type")
    private String contractType;
    private String requirements;
    private String responsibilities;
    private String benefits;

    @Field("status")
    private JobOfferStatus status;

    @DBRef
    @Field("published_by")
    private Employee publishedBy;

    @Field("published_date")
    private LocalDate publishedDate;

    @Field("closing_date")
    private LocalDate closingDate;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt; // Corrigé: LocalDateTime au lieu de LocalDate

    @Field("linkedin_post_id")
    private String linkedInPostId;

    @Field("external_platforms")
    private Set<String> externalPlatforms = new HashSet<>();

    @Field("application_count")
    private Integer applicationCount = 0;

    @Field("view_count")
    private Integer viewCount = 0;

    // Tags for search and categorization
    private Set<String> tags = new HashSet<>();

    // Experience level
    @Field("experience_level")
    private String experienceLevel; // JUNIOR, MID, SENIOR

    // Education requirements
    @Field("education_required")
    private String educationRequired;

    @Field("is_active")
    private Boolean isActive = true;

    // Constructeurs
    public JobOffer() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = JobOfferStatus.DRAFT;
    }

    public JobOffer(String title, String description, String department, String location) {
        this();
        this.title = title;
        this.description = description;
        this.department = department;
        this.location = location;
    }

    // Enum for job offer status
    public enum JobOfferStatus {
        DRAFT,
        PUBLISHED,
        CLOSED,
        ARCHIVED,
        EXPIRED
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public String getResponsibilities() { return responsibilities; }
    public void setResponsibilities(String responsibilities) { this.responsibilities = responsibilities; }

    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }

    public JobOfferStatus getStatus() { return status; }
    public void setStatus(JobOfferStatus status) { this.status = status; }

    public Employee getPublishedBy() { return publishedBy; }
    public void setPublishedBy(Employee publishedBy) { this.publishedBy = publishedBy; }

    public LocalDate getPublishedDate() { return publishedDate; }
    public void setPublishedDate(LocalDate publishedDate) { this.publishedDate = publishedDate; }

    public LocalDate getClosingDate() { return closingDate; }
    public void setClosingDate(LocalDate closingDate) { this.closingDate = closingDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getLinkedInPostId() { return linkedInPostId; }
    public void setLinkedInPostId(String linkedInPostId) { this.linkedInPostId = linkedInPostId; }

    public Set<String> getExternalPlatforms() { return externalPlatforms; }
    public void setExternalPlatforms(Set<String> externalPlatforms) { this.externalPlatforms = externalPlatforms; }

    public Integer getApplicationCount() { return applicationCount; }
    public void setApplicationCount(Integer applicationCount) { this.applicationCount = applicationCount; }

    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getEducationRequired() { return educationRequired; }
    public void setEducationRequired(String educationRequired) { this.educationRequired = educationRequired; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    // Helper methods
    public void incrementApplicationCount() {
        this.applicationCount = (this.applicationCount == null) ? 1 : this.applicationCount + 1;
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null) ? 1 : this.viewCount + 1;
        this.updatedAt = LocalDateTime.now();
    }

    public void addExternalPlatform(String platform) {
        if (this.externalPlatforms == null) {
            this.externalPlatforms = new HashSet<>();
        }
        this.externalPlatforms.add(platform);
    }

    public void addTag(String tag) {
        if (this.tags == null) {
            this.tags = new HashSet<>();
        }
        this.tags.add(tag);
    }

    public boolean isPublished() {
        return JobOfferStatus.PUBLISHED.equals(this.status);
    }

    public boolean isExpired() {
        return this.closingDate != null && LocalDate.now().isAfter(this.closingDate);
    }
}