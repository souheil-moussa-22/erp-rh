package com.mycompany.backend.services;

import com.mycompany.backend.dto.ai.AiSuggestionRequest;
import com.mycompany.backend.dto.ai.AiSuggestionResponse;
import java.util.List;

public interface AiService {

    // Génération de suggestions
    AiSuggestionResponse generateSuggestion(AiSuggestionRequest request);

    // Amélioration de texte
    AiSuggestionResponse improveText(String text, String context);

    // Génération de descriptions de poste
    AiSuggestionResponse generateJobDescription(String jobTitle, String industry, String requirements);

    // Génération d'exigences
    AiSuggestionResponse generateRequirements(String jobTitle, String responsibilities);

    // Génération de titres de poste multiples
    AiSuggestionResponse generateMultipleTitles(String jobDescription);

    // Génération de questions d'entretien
    AiSuggestionResponse generateInterviewQuestions(String jobTitle, String experienceLevel);

    // Analyse de texte
    AiSuggestionResponse analyzeText(String text, String analysisType);

    // Résumé de texte
    AiSuggestionResponse summarizeText(String text, Integer maxLength);

    // Traduction de texte
    AiSuggestionResponse translateText(String text, String sourceLang, String targetLang);

    // Vérification de la disponibilité du service
    boolean isAvailable();

    // Information sur le modèle utilisé
    String getModelInfo();

    // Vérification du nombre de tokens (pour le pricing)
    int estimateTokenCount(String text);

    // Vérification de la santé du service
    String getHealthStatus();
}