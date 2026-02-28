package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.Candidature;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidatureRepository extends MongoRepository<Candidature, String> {
}
