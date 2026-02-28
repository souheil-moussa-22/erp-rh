package com.mycompany.backend.services.Impl;

import com.mycompany.backend.dto.ai.AiSuggestionRequest;
import com.mycompany.backend.dto.ai.AiSuggestionResponse;
import com.mycompany.backend.services.AiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GeminiAiServiceImpl implements AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate(); // Création directe

    @Override
    public AiSuggestionResponse generateSuggestion(AiSuggestionRequest request) {
        log.info("🤖 Appel Gemini AI pour: {}", request.getType());

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            // REQUÊTE SIMPLE
            String userPrompt = buildSimpleUserPrompt(request);

            // Construction requête
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(Map.of("text", userPrompt)));

            requestBody.put("contents", List.of(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 2000);

            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("🌐 Envoi à Gemini API...");

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            log.info("📡 Statut: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                String aiText = extractResponseText(responseBody);

                AiSuggestionResponse aiResponse = new AiSuggestionResponse(aiText);
                aiResponse.setSuccess(true);
                aiResponse.setType(request.getType());

                return aiResponse;
            } else {
                log.error("❌ Erreur: {}", response.getBody());
                return AiSuggestionResponse.error("Erreur API: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("💥 Exception: {}", e.getMessage());
            return AiSuggestionResponse.error("Exception: " + e.getMessage());
        }
    }
    private String cleanAiResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isEmpty()) {
            return rawResponse;
        }

        // Supprimer les phrases d'introduction inutiles
        String[] unwantedStarts = {
                "Absolument !", "Bonjour", "Bien sûr", "D'accord",
                "Je vous propose", "En tant qu'IA", "Je vais",
                "Voici", "Voici une", "Voici un", "Voici des", "Voici quelques",
                "Voici donc", "Voici maintenant", "Voici une liste", "Voici un exemple"
        };

        String cleaned = rawResponse;

        // Chercher et supprimer les phrases d'introduction
        for (String unwanted : unwantedStarts) {
            if (cleaned.startsWith(unwanted)) {
                cleaned = cleaned.substring(unwanted.length()).trim();
                // Si la phrase continue avec " :" ou " : " on les supprime aussi
                if (cleaned.startsWith(":") || cleaned.startsWith(" :")) {
                    cleaned = cleaned.replaceFirst("^:\\s*", "").trim();
                }
            }

            // Version avec deux points
            String unwantedWithColon = unwanted + " :";
            if (cleaned.startsWith(unwantedWithColon)) {
                cleaned = cleaned.substring(unwantedWithColon.length()).trim();
            }

            // Version avec un point
            String unwantedWithPeriod = unwanted + ".";
            if (cleaned.startsWith(unwantedWithPeriod)) {
                cleaned = cleaned.substring(unwantedWithPeriod.length()).trim();
            }
        }

        // Supprimer les patterns spécifiques à "Voici"
        String[] voiciPatterns = {
                "^Voici.*?:\\s*", // "Voici [quelque chose] : "
                "^Voici\\s+",     // Juste "Voici "
                "^Voici\\.\\s*"   // "Voici. "
        };

        for (String pattern : voiciPatterns) {
            cleaned = cleaned.replaceAll(pattern, "");
        }

        // Supprimer les templates avec ---
        cleaned = cleaned.replaceAll("^-{3,}.*$", "").trim();
        cleaned = cleaned.replaceAll("\\*{3,}.*$", "").trim();

        // Supprimer les sections inutiles
        String[] unwantedSections = {
                "À propos de", "Votre Mission", "Vos Responsabilités",
                "Titre du poste", "Lieu :", "Type de contrat"
        };

        for (String section : unwantedSections) {
            if (cleaned.contains(section + " :")) {
                cleaned = cleaned.replaceAll("(?i)" + Pattern.quote(section + " :") + ".*?\n", "");
            }
        }

        // Nettoyer les espaces multiples et retours à la ligne en début de texte
        cleaned = cleaned.replaceAll("^\\s+", "");

        return cleaned.trim();
    }
    private String buildSimpleUserPrompt(AiSuggestionRequest request) {
        switch (request.getType()) {
            case JOB_DESCRIPTION:
                return "Description poste: " + request.getJobTitle() +
                        ". Responsabilités (5 max), exigences (5 max), avantages (3 max).";

            case REQUIREMENTS:
                return "Exigences pour: " + request.getJobTitle() +
                        ". Liste à puces, 8 points max.";

            case RESPONSIBILITIES:
                return "Responsabilités pour: " + request.getJobTitle() +
                        ". 6 points max, verbes d'action. Contexte: " +
                        (request.getInput() != null ? request.getInput() : "");

            case BENEFITS:
                return "Avantages pour: " + request.getJobTitle() +
                        ". 5 points max: salaire, sociaux, conditions.";

            case JOB_TITLE:
                return "3 titres max pour: " +
                        (request.getInput() != null ? request.getInput() : "");

            case TEXT_IMPROVEMENT:
                return "Rends plus concis: " +
                        (request.getInput() != null ? request.getInput() : "");

            default:
                return request.getInput() != null ? request.getInput() : "";
        }
    }

    private String extractResponseText(Map<String, Object> responseBody) {
        try {
            if (responseBody == null) return "Réponse vide";

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "Pas de réponse";

            Map<String, Object> candidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) candidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

            if (parts == null || parts.isEmpty()) return "Pas de contenu";

            String text = (String) parts.get(0).get("text");
            return text != null ? text : "Texte null";

        } catch (Exception e) {
            return "Erreur d'extraction: " + e.getMessage();
        }
    }

    @Override
    public AiSuggestionResponse improveText(String text, String context) {
        AiSuggestionRequest request = new AiSuggestionRequest();
        request.setType(AiSuggestionRequest.AiSuggestionType.TEXT_IMPROVEMENT);
        request.setInput(text);
        request.setContext(context);
        return generateSuggestion(request);
    }

    @Override
    public AiSuggestionResponse generateJobDescription(String jobTitle, String industry, String requirements) {
        AiSuggestionRequest request = new AiSuggestionRequest();
        request.setType(AiSuggestionRequest.AiSuggestionType.JOB_DESCRIPTION);
        request.setJobTitle(jobTitle);
        request.setIndustry(industry);
        return generateSuggestion(request);
    }

    @Override
    public AiSuggestionResponse generateRequirements(String jobTitle, String responsibilities) {
        AiSuggestionRequest request = new AiSuggestionRequest();
        request.setType(AiSuggestionRequest.AiSuggestionType.REQUIREMENTS);
        request.setJobTitle(jobTitle);
        request.setInput(responsibilities);
        return generateSuggestion(request);
    }

    @Override
    public boolean isAvailable() {
        try {
            String testUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.getForEntity(testUrl, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getModelInfo() {
        return "Gemini 2.5 Flash";
    }

    @Override
    public String getHealthStatus() {
        return isAvailable() ? "HEALTHY" : "UNHEALTHY";
    }

    @Override
    public int estimateTokenCount(String text) {
        return text != null ? text.length() / 4 : 0;
    }

    // Méthodes non critiques
    @Override public AiSuggestionResponse generateMultipleTitles(String jobDescription) { return null; }
    @Override public AiSuggestionResponse generateInterviewQuestions(String jobTitle, String experienceLevel) { return null; }
    @Override public AiSuggestionResponse analyzeText(String text, String analysisType) { return null; }
    @Override public AiSuggestionResponse summarizeText(String text, Integer maxLength) { return null; }
    @Override public AiSuggestionResponse translateText(String text, String sourceLang, String targetLang) { return null; }
}