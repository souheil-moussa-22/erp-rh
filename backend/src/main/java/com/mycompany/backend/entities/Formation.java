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
@Document(collection = "formations")
public class Formation {

    @Id
    private String id;

    private String title;
    private String description;
    private String location;
    private String formateur;
    private Integer maxParticipants;

    @Field("start_date")
    private LocalDate startDate;

    @Field("end_date")
    private LocalDate endDate;

    @Field("start_time")
    private String startTime;

    @Field("end_time")
    private String endTime;

    @Field("certificate_id")
    private String certificateId;
    private FormationStatus status = FormationStatus.PLANIFIED;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;
    @DBRef

    private Employee createdBy;
    @DBRef
    private Set<Employee> participants = new HashSet<>();

    private Double cost;
    private String category;
    private String skills;

    public Formation() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public enum FormationStatus {
        PLANIFIED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
}