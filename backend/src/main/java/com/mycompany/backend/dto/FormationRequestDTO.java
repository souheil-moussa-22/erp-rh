package com.mycompany.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class FormationRequestDTO {
    private String title;
    private String description;
    private String location;
    private String formateur;
    private Integer maxParticipants;
    private LocalDate startDate;
    private LocalDate endDate;
    private String startTime;
    private String endTime;
    private Double cost;
    private String category;
    private String skills;
}