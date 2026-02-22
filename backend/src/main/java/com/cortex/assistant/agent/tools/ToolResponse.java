package com.cortex.assistant.agent.tools;

/**
 * Structured output for tool execution.
 */
public class ToolResponse {
    private String tool;
    private Status status;
    private Object output;
    private String error;

    public enum Status {
        SUCCESS,
        FAILED
    }

    public ToolResponse() {
    }

    public ToolResponse(String tool, Status status, Object output, String error) {
        this.tool = tool;
        this.status = status;
        this.output = output;
        this.error = error;
    }

    public static ToolResponse success(String tool, Object output) {
        return new ToolResponse(tool, Status.SUCCESS, output, null);
    }

    public static ToolResponse failed(String tool, String error) {
        return new ToolResponse(tool, Status.FAILED, null, error);
    }

    // Getters and Setters
    public String getTool() {
        return tool;
    }

    public void setTool(String tool) {
        this.tool = tool;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Object getOutput() {
        return output;
    }

    public void setOutput(Object output) {
        this.output = output;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
