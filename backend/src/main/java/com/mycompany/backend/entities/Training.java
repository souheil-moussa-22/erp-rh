package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document(collection = "trainings")
public class Training {
    @Id
    private String id;
    private String title;
    private Date startDate;
    private Date endDate;

    public void setTitle(String title) {
        this.title = title;
    }
}
