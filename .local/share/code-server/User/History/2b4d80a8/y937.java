package com.app.sgelasmart.api.goal.dto;

import com.app.sgelasmart.common.TemplateType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ApplyTemplateRequest {

    @NotNull(message = "Template type is required")
    private TemplateType templateType;

    @NotEmpty(message = "At least one topic is required")
    private List<String> topics;

    private String studyNotesSnippet;

    public ApplyTemplateRequest() {}

    public ApplyTemplateRequest(TemplateType templateType, List<String> topics, String studyNotesSnippet) {
        this.templateType = templateType;
        this.topics = topics;
        this.studyNotesSnippet = studyNotesSnippet;
    }

    public TemplateType getTemplateType() {
        return templateType;
    }

    public void setTemplateType(TemplateType templateType) {
        this.templateType = templateType;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public String getStudyNotesSnippet() {
        return studyNotesSnippet;
    }

    public void setStudyNotesSnippet(String studyNotesSnippet) {
        this.studyNotesSnippet = studyNotesSnippet;
    }
}
