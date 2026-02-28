package com.mycompany.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiSuggestionRequest {
    private String context;
    private String input;
    private AiSuggestionType type;
    private String fieldName;
    private String jobTitle;
    private String industry;
    private String tone; // professional, creative, concise, detailed
    private Integer maxLength;
    private String language = "fr"; // fr, en, etc.

    public enum AiSuggestionType {
        JOB_DESCRIPTION,
        JOB_TITLE,
        REQUIREMENTS,
        RESPONSIBILITIES,
        BENEFITS,
        SKILLS,
        INTERVIEW_QUESTIONS,
        SALARY_RANGE,
        EMAIL_TEMPLATE,
        PERFORMANCE_REVIEW,
        TEXT_ANALYSIS,
        TEXT_SUMMARY,
        TEXT_TRANSLATION,
        TEXT_IMPROVEMENT
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public AiSuggestionType getType() {
        return type;
    }

    public void setType(AiSuggestionType type) {
        this.type = type;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getTone() {
        return tone;
    }

    public void setTone(String tone) {
        this.tone = tone;
    }

    public Integer getMaxLength() {
        return maxLength;
    }

    public void setMaxLength(Integer maxLength) {
        this.maxLength = maxLength;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}