package com.mycompany.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CongeStatusUpdateDTO {
    private String status; // APPROVED or REJECTED
    private String rejectionReason; // Only if rejected
}
