package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByEmployeeId(String employeeId);

    void deleteByEmployeeId(String employeeId);
}
