package com.mycompany.backend.services;

import com.mycompany.backend.dto.FormationRequestDTO;
import com.mycompany.backend.dto.FormationResponseDTO;
import com.mycompany.backend.entities.Formation;

import java.util.List;

public interface FormationService {
    FormationResponseDTO createFormation(FormationRequestDTO request, String createdById);
    FormationResponseDTO getFormationById(String id);
    List<FormationResponseDTO> getAllFormations();
    FormationResponseDTO updateFormation(String id, FormationRequestDTO request);
    void deleteFormation(String id);
    FormationResponseDTO startFormation(String id);
    FormationResponseDTO completeFormation(String id);
    FormationResponseDTO cancelFormation(String id);
    FormationResponseDTO addParticipant(String formationId, String employeeId);
    FormationResponseDTO removeParticipant(String formationId, String employeeId);
    List<FormationResponseDTO> getFormationsByParticipant(String employeeId);
    List<FormationResponseDTO> getFormationsByStatus(Formation.FormationStatus status);
    List<FormationResponseDTO> getFormationsByCategory(String category);
    List<FormationResponseDTO> searchFormations(String keyword);
    List<FormationResponseDTO> getUpcomingFormations();
    long getFormationCount();
}