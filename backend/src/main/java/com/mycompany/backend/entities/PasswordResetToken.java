package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    private String id;

    private String token;

    private String employeeId;

    private LocalDateTime expiryDate;

    private boolean used;

    public PasswordResetToken(String token, String employeeId) {
        this.token = token;
        this.employeeId = employeeId;
        this.expiryDate = LocalDateTime.now().plusHours(24); // Token expires in 24 hours
        this.used = false;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
