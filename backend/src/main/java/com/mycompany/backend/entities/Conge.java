package com.mycompany.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conges")
public class Conge {

    @Id
    private String id;

    private String employeeId;

    private String employeeName;

    private String type; // ANNUAL, SICK, UNPAID, MATERNITY, etc.

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer duration; // Number of days

    private String reason;

    private String status; // PENDING, APPROVED_RH, REJECTED_RH, APPROVED_MANAGER, REJECTED_MANAGER

    private String rejectionReason;

    private LocalDateTime submissionDate;

    // RH Response
    private LocalDateTime rhResponseDate;
    private String rhRespondedBy;
    private String rhRejectionReason;

    // Manager Response
    private LocalDateTime managerResponseDate;
    private String managerRespondedBy;
    private String managerRejectionReason;

    // Legacy fields for backward compatibility
    private LocalDateTime responseDate;
    private String respondedBy;

    // Calculate duration in days
    public Integer calculateDuration() {
        if (startDate != null && endDate != null) {
            this.duration = (int) java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        }
        return this.duration;
    }

    // Helper method to get the final status
    public String getFinalStatus() {
        if ("APPROVED_MANAGER".equals(status)) {
            return "APPROVED";
        } else if ("REJECTED_RH".equals(status) || "REJECTED_MANAGER".equals(status)) {
            return "REJECTED";
        } else if ("APPROVED_RH".equals(status)) {
            return "PENDING_MANAGER";
        }
        return status; // PENDING
    }
}