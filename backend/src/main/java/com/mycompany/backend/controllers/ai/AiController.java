package com.mycompany.backend.controllers.ai;

import com.mycompany.backend.dto.ai.AiSuggestionRequest;
import com.mycompany.backend.dto.ai.AiSuggestionResponse;
import com.mycompany.backend.services.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/suggest")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> generateSuggestion(@RequestBody AiSuggestionRequest request) {
        AiSuggestionResponse response = aiService.generateSuggestion(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/improve-text")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> improveText(
            @RequestParam String text,
            @RequestParam(required = false) String context) {
        AiSuggestionResponse response = aiService.improveText(text, context);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/job-description")
    @PreAuthorize("hasAnyRole('HR', 'HRMANAGER', 'ADMIN')")
    public ResponseEntity<AiSuggestionResponse> generateJobDescription(
            @RequestParam String jobTitle,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String requirements) {
        AiSuggestionResponse response = aiService.generateJobDescription(jobTitle, industry, requirements);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean available = aiService.isAvailable();
        String modelInfo = aiService.getModelInfo();

        Map<String, Object> response = new HashMap<>();
        response.put("available", available);
        response.put("modelInfo", modelInfo);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Service is operational");
    }
}