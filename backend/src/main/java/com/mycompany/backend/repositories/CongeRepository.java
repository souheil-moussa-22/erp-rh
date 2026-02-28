package com.mycompany.backend.repositories;

import com.mycompany.backend.entities.Conge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import java.util.List;

@Repository
public interface CongeRepository extends MongoRepository<Conge, String> {

    Optional<Conge> findCongeById(String id);

    List<Conge> findByEmployeeId(String employeeId);

    List<Conge> findByStatus(String status);

    List<Conge> findByEmployeeIdAndStatus(String employeeId, String status);

    List<Conge> findByType(String type);

    List<Conge> findByStartDateBetween(LocalDate startDate, LocalDate endDate);

    List<Conge> findByEmployeeIdAndType(String employeeId, String type);
    List<Conge> findByEmployeeIdAndTypeAndStatus(String employeeId, String type, String status);
    List<Conge> findByStatusOrderBySubmissionDateDesc(String status);
}