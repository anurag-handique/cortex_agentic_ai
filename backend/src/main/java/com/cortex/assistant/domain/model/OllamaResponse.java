package com.cortex.assistant.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OllamaResponse {
    private String model;
    private String response;
    private boolean done;
    @JsonProperty("created_at")
    private String createdAt;
    private String title;

    public OllamaResponse() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    // Getters and setters
    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}