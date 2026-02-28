package com.mycompany.backend.services.Impl;

import com.mycompany.backend.dto.CongeRequestDTO;
import com.mycompany.backend.dto.CongeStatusUpdateDTO;
import com.mycompany.backend.entities.Conge;
import com.mycompany.backend.entities.ERole;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.repositories.CongeRepository;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.services.CongeService;
import com.mycompany.backend.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class CongeServiceImpl implements CongeService {

    @Autowired
    private CongeRepository congeRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private NotificationService notificationService;

    public Conge submitConge(String employeeId, CongeRequestDTO request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Conge conge = new Conge();
        conge.setEmployeeId(employeeId);
        conge.setEmployeeName(employee.getUsername());
        conge.setType(request.getType());
        conge.setStartDate(request.getStartDate());
        conge.setEndDate(request.getEndDate());
        conge.setReason(request.getReason());
        conge.setStatus("PENDING");
        conge.setSubmissionDate(LocalDateTime.now());
        conge.calculateDuration();

        Conge savedConge = congeRepository.save(conge);

        // Send notification to Manager HR
        notificationService.notifyManagerHrAboutNewLeaveRequest(savedConge);

        return savedConge;
    }

    public Conge updateCongeStatus(String congeId, String managerId, CongeStatusUpdateDTO statusUpdate) {
        Conge conge = congeRepository.findById(congeId)
                .orElseThrow(() -> new RuntimeException("Conge not found"));

        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        String currentStatus = conge.getStatus();
        String newStatus = statusUpdate.getStatus();

        // Manager HR processing
        if (manager.getRoles().stream()
                .anyMatch(role -> role.getName() .equals(ERole.ROLE_HRMANAGER)) && "PENDING".equals(currentStatus)) {
            if ("APPROVED_MANAGER".equals(newStatus)) {
                conge.setStatus("APPROVED_MANAGER");
                conge.setManagerResponseDate(LocalDateTime.now());
                conge.setManagerRespondedBy(manager.getUsername());

                Conge savedConge = congeRepository.save(conge);

                // Notify HR about manager approval
                notificationService.notifyHrAboutManagerApproval(savedConge, managerId, manager.getUsername());

                return savedConge;
            } else if ("REJECTED_MANAGER".equals(newStatus)) {
                conge.setStatus("REJECTED_MANAGER");
                conge.setManagerResponseDate(LocalDateTime.now());
                conge.setManagerRespondedBy(manager.getUsername());
                conge.setManagerRejectionReason(statusUpdate.getRejectionReason());

                Conge savedConge = congeRepository.save(conge);

                // Notify employee about manager rejection
                notificationService.notifyEmployeeAboutManagerRejection(savedConge, managerId, manager.getUsername());

                return savedConge;
            }
        }

        // HR processing
        if (manager.getRoles().stream()
                .anyMatch(role -> role.getName() .equals(ERole.ROLE_HR)) && "APPROVED_MANAGER".equals(currentStatus)) {
            if ("APPROVED_RH".equals(newStatus)) {
                conge.setStatus("APPROVED_RH");
                conge.setRhResponseDate(LocalDateTime.now());
                conge.setRhRespondedBy(manager.getUsername());

                Conge savedConge = congeRepository.save(conge);

                // Notify employee about HR approval
                notificationService.notifyEmployeeAboutHrApproval(savedConge, managerId, manager.getUsername());

                return savedConge;
            } else if ("REJECTED_RH".equals(newStatus)) {
                conge.setStatus("REJECTED_RH");
                conge.setRhResponseDate(LocalDateTime.now());
                conge.setRhRespondedBy(manager.getUsername());
                conge.setRhRejectionReason(statusUpdate.getRejectionReason());

                Conge savedConge = congeRepository.save(conge);

                // Notify employee about HR rejection
                notificationService.notifyEmployeeAboutHrRejection(savedConge, managerId, manager.getUsername());

                return savedConge;
            }
        }

        throw new RuntimeException("Invalid status transition");
    }

    public long calculateDuration(LocalDate startDate, LocalDate endDate) {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    public List<Conge> getAllPendingConges() {
        return congeRepository.findByStatus("PENDING");
    }

    public List<Conge> getManagerPendingConges() { return congeRepository.findByStatus("APPROVED_MANAGER"); }

    public List<Conge> getAllConges() {
        return congeRepository.findAll();
    }

    public Optional<Conge> getCongeById(String congeId) {
        return congeRepository.findById(congeId);
    }

    public void deleteConge(String congeId, String employeeId) {
        Conge conge = congeRepository.findById(congeId)
                .orElseThrow(() -> new RuntimeException("Conge not found"));

        if (!conge.getEmployeeId().equals(employeeId)) {
            throw new RuntimeException("Unauthorized to delete this conge");
        }

        congeRepository.deleteById(congeId);
    }

    public List<Conge> getCongesByStatus(String status) {
        return congeRepository.findByStatus(status);
    }

    public List<Conge> getCongesByEmployeeId(String employeeId) {
        return congeRepository.findByEmployeeId(employeeId);
    }
}