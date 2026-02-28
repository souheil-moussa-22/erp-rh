package com.mycompany.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class JobOfferDTO {
    private String id;
    private String title;
    private String description;
    private String department;
    private String location;
    private String contractType;
    private String requirements;
    private String responsibilities;
    private String benefits;
    private String status; // String au lieu de JobOfferStatus
    private String publishedBy;
    private LocalDate publishedDate;
    private LocalDate closingDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String linkedInPostId;
    private Set<String> externalPlatforms;
    private Integer applicationCount = 0;
    private Integer viewCount = 0;
    private Set<String> tags;
    private String experienceLevel;
    private String educationRequired;
    private Boolean isActive = true; // isActive au lieu de active

    // Constructeurs
    public JobOfferDTO() {}

    // Getters et Setters (générés par Lombok @Data)
}