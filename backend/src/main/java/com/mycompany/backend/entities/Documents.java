package com.mycompany.backend.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document(collection = "documents")
public class Documents {

        @Id
        private String id;
        private String type;
        private String title;
        private String content;
        private Date creationDate;
        private String status;

        public void setType(String type) {
            this.type = type;
        }

        public void setTitle(String title) {
            this.title = title;
        }
    }
