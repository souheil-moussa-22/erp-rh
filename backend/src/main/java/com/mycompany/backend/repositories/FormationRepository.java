package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.Formation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FormationRepository extends MongoRepository<Formation, String> {

    List<Formation> findByStatus(Formation.FormationStatus status);

    List<Formation> findByStartDateBetween(LocalDate start, LocalDate end);

    List<Formation> findByCategory(String category);

    @Query("{ 'participants.$id': ?0 }")
    List<Formation> findByParticipantId(String employeeId);

    @Query("{ 'createdBy.$id': ?0 }")
    List<Formation> findByCreatedBy(String employeeId);

    List<Formation> findByTitleContainingIgnoreCase(String title);

    @Query("{ 'startDate': { $gte: ?0 } }")
    List<Formation> findUpcomingFormations(LocalDate date);
}