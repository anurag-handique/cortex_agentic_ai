package com.cortex.assistant.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class AgentDecision {
    private String intent;
    private String risk;
    private String thought;
    private String action;
    private String toolName;
    private String confidence;
    private String input;
    private List<String> reasoningSteps;
    private String title;

    public AgentDecision() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public AgentDecision(String intent, String risk, String thought, String action, String toolName, String confidence,
            String input,
            java.util.List<String> reasoningSteps) {
        this.intent = intent;
        this.risk = risk;
        this.thought = thought;
        this.action = action;
        this.toolName = toolName;
        this.confidence = confidence;
        this.input = input;
        this.reasoningSteps = reasoningSteps;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getRisk() {
        return risk;
    }

    public void setRisk(String risk) {
        this.risk = risk;
    }

    public String getThought() {
        return thought;
    }

    public void setThought(String thought) {
        this.thought = thought;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getToolName() {
        return toolName;
    }

    public void setToolName(String toolName) {
        this.toolName = toolName;
    }

    public String getConfidence() {
        return confidence;
    }

    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public java.util.List<String> getReasoningSteps() {
        return reasoningSteps;
    }

    public void setReasoningSteps(java.util.List<String> reasoningSteps) {
        this.reasoningSteps = reasoningSteps;
    }
}