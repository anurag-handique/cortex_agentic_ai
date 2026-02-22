package com.cortex.assistant.domain.model;

/**
 * Represents the state of a tool execution.
 */
public class ExecutionRecord {
    private String toolName;
    private String input;
    private Status status;
    private Object result;
    private String error;

    public enum Status {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED
    }

    public ExecutionRecord() {
    }

    public ExecutionRecord(String toolName, String input) {
        this.toolName = toolName;
        this.input = input;
        this.status = Status.PENDING;
    }

    // Getters and Setters
    public String getToolName() {
        return toolName;
    }

    public void setToolName(String toolName) {
        this.toolName = toolName;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
