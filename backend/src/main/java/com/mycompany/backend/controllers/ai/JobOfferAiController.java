package com.mycompany.backend.controllers.ai;

import com.mycompany.backend.dto.JobOfferDTO;
import com.mycompany.backend.dto.JobOfferRequest;
import com.mycompany.backend.dto.ai.AiSuggestionResponse;
import com.mycompany.backend.services.Impl.JobOfferServiceImpl;
import com.mycompany.backend.services.JobOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-offers/ai")
@RequiredArgsConstructor
public class JobOfferAiController {

    private final JobOfferService jobOfferService;

    @PostMapping("/generate-description")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> generateDescription(
            @RequestParam String jobTitle,
            @RequestParam String department,
            @RequestParam String location) {

        AiSuggestionResponse response = ((JobOfferServiceImpl) jobOfferService)
                .generateJobDescriptionAI(jobTitle, department, location);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/improve/{id}")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> improveJobOffer(@PathVariable String id) {
        JobOfferDTO jobOffer = jobOfferService.getById(id)
                .orElseThrow(() -> new RuntimeException("Job offer not found"));

        JobOfferRequest request = convertToRequest(jobOffer);

        AiSuggestionResponse response = ((JobOfferServiceImpl) jobOfferService)
                .improveJobOfferAI(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/suggest-titles")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<List<String>> suggestTitles(@RequestParam String description) {
        List<String> suggestions = ((JobOfferServiceImpl) jobOfferService)
                .suggestJobTitlesAI(description);
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping("/generate-complete")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> generateComplete(
            @RequestBody JobOfferRequest basicInfo) {

        AiSuggestionResponse response = ((JobOfferServiceImpl) jobOfferService)
                .generateCompleteJobOfferAI(basicInfo);
        return ResponseEntity.ok(response);
    }

    private JobOfferRequest convertToRequest(JobOfferDTO dto) {
        JobOfferRequest request = new JobOfferRequest();
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setDepartment(dto.getDepartment());
        request.setLocation(dto.getLocation());
        request.setContractType(dto.getContractType());
        request.setRequirements(dto.getRequirements());
        request.setResponsibilities(dto.getResponsibilities());
        request.setBenefits(dto.getBenefits());
        request.setTags(dto.getTags());
        request.setExperienceLevel(dto.getExperienceLevel());
        request.setEducationRequired(dto.getEducationRequired());
        return request;
    }
}