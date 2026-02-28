package com.mycompany.backend.dto.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiPromptTemplate {
    private String systemPrompt;
    private String userPrompt;
    private String formatInstructions;
    private Double temperature;
    private Integer maxTokens;

    public static AiPromptTemplate jobDescriptionTemplate() {
        return AiPromptTemplate.builder()
                .systemPrompt("You are an expert HR consultant specializing in job description creation. " +
                        "Provide clear, professional, and attractive job descriptions.")
                .formatInstructions("Respond in markdown format with sections: Overview, Responsibilities, Requirements, Benefits.")
                .temperature(0.7)
                .maxTokens(800)
                .build();
    }

    public static AiPromptTemplate requirementsTemplate() {
        return AiPromptTemplate.builder()
                .systemPrompt("You are an HR expert analyzing job requirements. " +
                        "Provide comprehensive but concise requirements lists.")
                .formatInstructions("Provide as a bulleted list, categorized by: Must Have, Nice to Have, Technical Skills, Soft Skills.")
                .temperature(0.5)
                .maxTokens(500)
                .build();
    }

    public static AiPromptTemplate textImprovementTemplate() {
        return AiPromptTemplate.builder()
                .systemPrompt("You are a professional editor improving HR-related texts. " +
                        "Make them more professional, clear, and engaging while preserving meaning.")
                .temperature(0.6)
                .maxTokens(400)
                .build();
    }

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public void setSystemPrompt(String systemPrompt) {
        this.systemPrompt = systemPrompt;
    }

    public String getUserPrompt() {
        return userPrompt;
    }

    public void setUserPrompt(String userPrompt) {
        this.userPrompt = userPrompt;
    }

    public String getFormatInstructions() {
        return formatInstructions;
    }

    public void setFormatInstructions(String formatInstructions) {
        this.formatInstructions = formatInstructions;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }
}