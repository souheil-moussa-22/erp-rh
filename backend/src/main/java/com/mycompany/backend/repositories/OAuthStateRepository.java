package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.OAuthState;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OAuthStateRepository extends MongoRepository<OAuthState, String> {
    Optional<OAuthState> findByState(String state);
    void deleteByState(String state);
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}