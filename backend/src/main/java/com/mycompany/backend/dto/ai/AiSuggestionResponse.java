package com.mycompany.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiSuggestionResponse {
    private String id;
    private String suggestion;
    private List<String> suggestions; // Multiple suggestions
    private Map<String, Object> metadata;
    private Long tokensUsed;
    private Double processingTime;
    private String model;
    private com.mycompany.backend.dto.ai.AiSuggestionRequest.AiSuggestionType type;
    private Boolean success = true;
    private String errorMessage;

    // For structured responses
    private List<String> bulletPoints;
    private Map<String, String> keyValuePairs;
    private List<Map<String, String>> structuredData;

    public AiSuggestionResponse() {}

    public AiSuggestionResponse(String suggestion) {
        this.suggestion = suggestion;
    }

    public static AiSuggestionResponse error(String errorMessage) {
        AiSuggestionResponse response = new AiSuggestionResponse();
        response.setSuccess(false);
        response.setErrorMessage(errorMessage);
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Long getTokensUsed() {
        return tokensUsed;
    }

    public void setTokensUsed(Long tokensUsed) {
        this.tokensUsed = tokensUsed;
    }

    public Double getProcessingTime() {
        return processingTime;
    }

    public void setProcessingTime(Double processingTime) {
        this.processingTime = processingTime;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public AiSuggestionRequest.AiSuggestionType getType() {
        return type;
    }

    public void setType(AiSuggestionRequest.AiSuggestionType type) {
        this.type = type;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public List<String> getBulletPoints() {
        return bulletPoints;
    }

    public void setBulletPoints(List<String> bulletPoints) {
        this.bulletPoints = bulletPoints;
    }

    public Map<String, String> getKeyValuePairs() {
        return keyValuePairs;
    }

    public void setKeyValuePairs(Map<String, String> keyValuePairs) {
        this.keyValuePairs = keyValuePairs;
    }

    public List<Map<String, String>> getStructuredData() {
        return structuredData;
    }

    public void setStructuredData(List<Map<String, String>> structuredData) {
        this.structuredData = structuredData;
    }
}