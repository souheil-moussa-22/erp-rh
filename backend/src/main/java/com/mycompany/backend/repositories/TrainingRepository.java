package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.Training;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingRepository extends MongoRepository<Training, String> {
}
