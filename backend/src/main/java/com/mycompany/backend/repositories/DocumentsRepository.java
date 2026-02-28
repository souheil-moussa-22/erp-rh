package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.Documents;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentsRepository extends MongoRepository<Documents, String> {
}
