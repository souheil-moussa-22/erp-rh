package com.mycompany.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String recipientId;

    private String senderId;

    private String senderName;

    private String type; // LEAVE_REQUEST, LEAVE_APPROVED, LEAVE_REJECTED, etc.

    private String title;

    private String message;

    private String relatedEntityId; // ID of the conge request

    private boolean read;

    private LocalDateTime createdAt;

    public Notification(String recipientId, String senderId, String senderName,
                        String type, String title, String message, String relatedEntityId) {
        this.recipientId = recipientId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }
}