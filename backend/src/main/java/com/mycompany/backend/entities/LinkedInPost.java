package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Document(collection = "linkedin_posts")
public class LinkedInPost {

    @Id
    private String id;

    @Field("linkedin_post_id")
    private String linkedinPostId;

    @Field("job_offer_id")
    private String jobOfferId;

    @Field("organization_id")
    private String organizationId;

    @Field("content")
    private String content;

    @Field("status")
    private String status; // PUBLISHED, DELETED, ERROR

    @Field("published_at")
    private LocalDateTime publishedAt;

    @Field("stats")
    private Map<String, Integer> statistics; // likes, comments, shares, impressions

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;

    public LinkedInPost() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}