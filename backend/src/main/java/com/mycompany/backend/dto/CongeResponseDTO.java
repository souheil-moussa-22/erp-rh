package com.mycompany.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CongeResponseDTO {
    private String id;
    private String employeeId;
    private String employeeName;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer duration;
    private String reason;
    private String status;
    private String rejectionReason;
    private String submissionDate;
    private String responseDate;
    private String respondedBy;
}