package com.mycompany.backend.services.Impl;

import com.mycompany.backend.dto.FormationRequestDTO;
import com.mycompany.backend.dto.FormationResponseDTO;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Formation;
import com.mycompany.backend.repositories.FormationRepository;
import com.mycompany.backend.services.EmployeeService;
import com.mycompany.backend.services.FormationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormationServiceImpl implements FormationService {

    private static final Logger log = LoggerFactory.getLogger(FormationServiceImpl.class);

    private final FormationRepository formationRepository;
    private final EmployeeService employeeService;

    @Override
    public FormationResponseDTO createFormation(FormationRequestDTO request, String createdById) {
        log.info("Creating new formation: {}", request.getTitle());

        Employee createdBy = employeeService.getEmployeeById(createdById)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + createdById));

        Formation formation = new Formation();
        mapRequestToEntity(request, formation);
        formation.setCreatedBy(createdBy);

        Formation saved = formationRepository.save(formation);
        log.info("Formation created successfully: {}", saved.getId());

        return new FormationResponseDTO(saved);
    }

    @Override
    public FormationResponseDTO getFormationById(String id) {
        log.info("Fetching formation by id: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        return new FormationResponseDTO(formation);
    }

    @Override
    public List<FormationResponseDTO> getAllFormations() {
        log.info("Fetching all formations");

        List<Formation> formations = formationRepository.findAll();

        log.info("Found {} formations", formations.size());
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public FormationResponseDTO updateFormation(String id, FormationRequestDTO request) {
        log.info("Updating formation: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        mapRequestToEntity(request, formation);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Formation updated successfully: {}", id);

        return new FormationResponseDTO(updated);
    }

    @Override
    public void deleteFormation(String id) {
        log.info("Deleting formation: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        formationRepository.delete(formation);
        log.info("Formation deleted successfully: {}", id);
    }

    @Override
    public FormationResponseDTO startFormation(String id) {
        log.info("Starting formation: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        if (formation.getStatus() != Formation.FormationStatus.PLANIFIED) {
            throw new RuntimeException("Formation cannot be started. Current status: " + formation.getStatus());
        }

        formation.setStatus(Formation.FormationStatus.IN_PROGRESS);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Formation started successfully: {}", id);

        return new FormationResponseDTO(updated);
    }

    @Override
    public FormationResponseDTO completeFormation(String id) {
        log.info("Completing formation: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        if (formation.getStatus() != Formation.FormationStatus.IN_PROGRESS) {
            throw new RuntimeException("Formation cannot be completed. Current status: " + formation.getStatus());
        }

        formation.setStatus(Formation.FormationStatus.COMPLETED);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Formation completed successfully: {}", id);

        return new FormationResponseDTO(updated);
    }

    @Override
    public FormationResponseDTO cancelFormation(String id) {
        log.info("Cancelling formation: {}", id);

        Formation formation = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + id));

        if (formation.getStatus() == Formation.FormationStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed formation");
        }

        formation.setStatus(Formation.FormationStatus.CANCELLED);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Formation cancelled successfully: {}", id);

        return new FormationResponseDTO(updated);
    }

    @Override
    public FormationResponseDTO addParticipant(String formationId, String employeeId) {
        log.info("Adding participant {} to formation {}", employeeId, formationId);

        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + formationId));

        Employee employee = employeeService.getEmployeeById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        // Check if formation is full
        if (formation.getMaxParticipants() != null &&
                formation.getParticipants().size() >= formation.getMaxParticipants()) {
            throw new RuntimeException("Formation is full. Maximum participants: " + formation.getMaxParticipants());
        }

        // Check if employee is already a participant
        if (formation.getParticipants().contains(employee)) {
            throw new RuntimeException("Employee is already a participant in this formation");
        }

        formation.getParticipants().add(employee);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Participant added successfully to formation {}", formationId);

        return new FormationResponseDTO(updated);
    }

    @Override
    public FormationResponseDTO removeParticipant(String formationId, String employeeId) {
        log.info("Removing participant {} from formation {}", employeeId, formationId);

        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new RuntimeException("Formation not found with id: " + formationId));

        Employee employee = employeeService.getEmployeeById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        if (!formation.getParticipants().contains(employee)) {
            throw new RuntimeException("Employee is not a participant in this formation");
        }

        formation.getParticipants().remove(employee);
        formation.setUpdatedAt(LocalDateTime.now());

        Formation updated = formationRepository.save(formation);
        log.info("Participant removed successfully from formation {}", formationId);

        return new FormationResponseDTO(updated);
    }

    @Override
    public List<FormationResponseDTO> getFormationsByParticipant(String employeeId) {
        log.info("Fetching formations for participant: {}", employeeId);

        // Vérifier que l'employé existe
        employeeService.getEmployeeById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        List<Formation> formations = formationRepository.findByParticipantId(employeeId);

        log.info("Found {} formations for participant {}", formations.size(), employeeId);
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<FormationResponseDTO> getFormationsByStatus(Formation.FormationStatus status) {
        log.info("Fetching formations by status: {}", status);

        List<Formation> formations = formationRepository.findByStatus(status);

        log.info("Found {} formations with status {}", formations.size(), status);
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<FormationResponseDTO> getFormationsByCategory(String category) {
        log.info("Fetching formations by category: {}", category);

        List<Formation> formations = formationRepository.findByCategory(category);

        log.info("Found {} formations in category {}", formations.size(), category);
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<FormationResponseDTO> searchFormations(String keyword) {
        log.info("Searching formations with keyword: {}", keyword);

        List<Formation> formations = formationRepository.findByTitleContainingIgnoreCase(keyword);

        log.info("Found {} formations matching keyword '{}'", formations.size(), keyword);
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<FormationResponseDTO> getUpcomingFormations() {
        log.info("Fetching upcoming formations");

        List<Formation> formations = formationRepository.findUpcomingFormations(LocalDate.now());

        log.info("Found {} upcoming formations", formations.size());
        return formations.stream()
                .map(FormationResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public long getFormationCount() {
        long count = formationRepository.count();
        log.info("Total formations count: {}", count);
        return count;
    }

    // Méthode utilitaire pour mapper DTO vers Entity
    private void mapRequestToEntity(FormationRequestDTO request, Formation formation) {
        formation.setTitle(request.getTitle());
        formation.setDescription(request.getDescription());
        formation.setLocation(request.getLocation());
        formation.setFormateur(request.getFormateur());
        formation.setMaxParticipants(request.getMaxParticipants());
        formation.setStartDate(request.getStartDate());
        formation.setEndDate(request.getEndDate());
        formation.setStartTime(request.getStartTime());
        formation.setEndTime(request.getEndTime());
        formation.setCost(request.getCost());
        formation.setCategory(request.getCategory());
        formation.setSkills(request.getSkills());

        // Initialiser les collections si null
        if (formation.getParticipants() == null) {
            formation.setParticipants(new java.util.HashSet<>());
        }
    }
}