package com.mycompany.backend.services;

import com.mycompany.backend.entities.Conge;
import com.mycompany.backend.dto.CongeRequestDTO;
import com.mycompany.backend.dto.CongeStatusUpdateDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CongeService {

    Conge submitConge(String employeeId, CongeRequestDTO request);

    Conge updateCongeStatus(String congeId, String managerId, CongeStatusUpdateDTO statusUpdate);

    List<Conge> getAllPendingConges();

    List<Conge> getManagerPendingConges();

    List<Conge> getAllConges();

    Optional<Conge> getCongeById(String congeId);

    long calculateDuration(LocalDate startDate, LocalDate endDate);

    void deleteConge(String congeId, String employeeId);

    List<Conge> getCongesByStatus(String status);

    List<Conge> getCongesByEmployeeId(String employeeId);
}
