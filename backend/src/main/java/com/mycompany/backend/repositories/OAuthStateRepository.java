package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.OAuthState;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OAuthStateRepository extends MongoRepository<OAuthState, String> {

    Optional<OAuthState> findByState(String state);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    void deleteByState(String state);
}