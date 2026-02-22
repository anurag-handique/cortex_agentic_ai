package com.cortex.assistant.agent.tools;

import java.util.Map;

/**
 * Interface for all tools that can be executed by the agent.
 * Tools must be self-contained and stateless.
 */
public interface Tool {

    /**
     * @return The unique name of the tool.
     */
    String getToolName();

    /**
     * @return A description of what the tool does and when to use it.
     */
    String getDescription();

    /**
     * @return A map describing the expected input schema (e.g., parameter names and
     *         types).
     */
    Map<String, String> getExpectedInputSchema();

    /**
     * Executes the tool with the provided input.
     * 
     * @param input A map containing the input parameters.
     * @return A ToolResponse containing the result of the execution.
     */
    ToolResponse execute(Map<String, Object> input);
}
