package com.cortex.assistant.domain.model;

public class OllamaRequest {
    private String model;
    private String prompt;
    private boolean stream;
    private Integer num_predict;
    private Double temperature;
    private Integer top_k;
    private Double top_p;
    private String sessionId;

    public OllamaRequest() {
    }

    public OllamaRequest(String model, String prompt) {
        this.model = model;
        this.prompt = prompt;
        this.stream = false;
    }

    public OllamaRequest(String model, String prompt, String sessionId) {
        this.model = model;
        this.prompt = prompt;
        this.stream = false;
        this.sessionId = sessionId;
    }

    // Getters and setters
    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public boolean isStream() {
        return stream;
    }

    public void setStream(boolean stream) {
        this.stream = stream;
    }

    public Integer getNum_predict() {
        return num_predict;
    }

    public void setNum_predict(Integer num_predict) {
        this.num_predict = num_predict;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getTop_k() {
        return top_k;
    }

    public void setTop_k(Integer top_k) {
        this.top_k = top_k;
    }

    public Double getTop_p() {
        return top_p;
    }

    public void setTop_p(Double top_p) {
        this.top_p = top_p;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}