package com.mycompany.backend.dto;

import com.mycompany.backend.entities.Formation;
import com.mycompany.backend.entities.Employee;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class FormationResponseDTO {
    private String id;
    private String title;
    private String description;
    private String location;
    private String formateur;
    private Integer maxParticipants;
    private LocalDate startDate;
    private LocalDate endDate;
    private String startTime;
    private String endTime;
    private String certificateId;
    private Formation.FormationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private Set<String> participants;
    private Double cost;
    private String category;
    private String skills;
    private Integer currentParticipants;

    public FormationResponseDTO(Formation formation) {
        this.id = formation.getId() != null ? formation.getId() : null;
        this.title = formation.getTitle() != null ? formation.getTitle() : "";
        this.description = formation.getDescription() != null ? formation.getDescription() : "";
        this.location = formation.getLocation() != null ? formation.getLocation() : "";
        this.formateur = formation.getFormateur() != null ? formation.getFormateur() : "";
        this.maxParticipants = formation.getMaxParticipants() != null ? formation.getMaxParticipants() : 0;
        this.startDate = formation.getStartDate();
        this.endDate = formation.getEndDate();
        this.startTime = formation.getStartTime() != null ? formation.getStartTime() : "";
        this.endTime = formation.getEndTime() != null ? formation.getEndTime() : "";
        this.certificateId = formation.getCertificateId() != null ? formation.getCertificateId() : "";
        this.status = formation.getStatus() != null ? formation.getStatus() : Formation.FormationStatus.PLANIFIED;
        this.createdAt = formation.getCreatedAt();
        this.updatedAt = formation.getUpdatedAt();
        this.cost = formation.getCost() != null ? formation.getCost() : 0.0;
        this.category = formation.getCategory() != null ? formation.getCategory() : "";
        this.skills = formation.getSkills() != null ? formation.getSkills() : "";

        // Gestion sécurisée de createdBy
        if (formation.getCreatedBy() != null && formation.getCreatedBy().getId() != null) {
            this.createdBy = formation.getCreatedBy().getId();
        } else {
            this.createdBy = "";
        }

        // Gestion sécurisée des participants
        if (formation.getParticipants() != null && !formation.getParticipants().isEmpty()) {
            this.participants = formation.getParticipants().stream()
                    .filter(employee -> employee != null && employee.getId() != null) // Filtrer les null
                    .map(Employee::getId)
                    .collect(Collectors.toSet());
            this.currentParticipants = this.participants.size();
        } else {
            this.participants = Collections.emptySet();
            this.currentParticipants = 0;
        }
    }

    // Constructeur par défaut pour Lombok
    public FormationResponseDTO() {
        this.participants = new HashSet<>();
        this.currentParticipants = 0;
    }
}