package com.cortex.assistant.domain.model;

public class UserRequest {
    private String input;
    private String sessionId;

    public UserRequest() {
    }

    public UserRequest(String input) {
        this.input = input;
    }

    public UserRequest(String input, String sessionId) {
        this.input = input;
        this.sessionId = sessionId;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
