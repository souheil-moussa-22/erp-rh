package com.mycompany.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.util.Set;

public class JobOfferRequest {
    private String title;
    private String description;
    private String department;
    private String location;
    private String contractType;
    private String requirements;
    private String responsibilities;
    private String benefits;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate closingDate;

    private Set<String> tags;
    private String experienceLevel;
    private String educationRequired;

    // Pour LinkedIn
    private Boolean publishToLinkedIn = false;
    private Boolean publishToIndeed = false;

    // Constructors
    public JobOfferRequest() {}

    // Getters and Setters

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getResponsibilities() {
        return responsibilities;
    }

    public void setResponsibilities(String responsibilities) {
        this.responsibilities = responsibilities;
    }

    public String getBenefits() {
        return benefits;
    }

    public void setBenefits(String benefits) {
        this.benefits = benefits;
    }

    public LocalDate getClosingDate() {
        return closingDate;
    }

    public void setClosingDate(LocalDate closingDate) {
        this.closingDate = closingDate;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public String getEducationRequired() {
        return educationRequired;
    }

    public void setEducationRequired(String educationRequired) {
        this.educationRequired = educationRequired;
    }

    public Boolean getPublishToLinkedIn() {
        return publishToLinkedIn;
    }

    public void setPublishToLinkedIn(Boolean publishToLinkedIn) {
        this.publishToLinkedIn = publishToLinkedIn;
    }

    public Boolean getPublishToIndeed() {
        return publishToIndeed;
    }

    public void setPublishToIndeed(Boolean publishToIndeed) {
        this.publishToIndeed = publishToIndeed;
    }
}