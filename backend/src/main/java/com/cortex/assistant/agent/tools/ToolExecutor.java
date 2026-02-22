package com.cortex.assistant.agent.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Executes tools based on agent decisions.
 * Handles validation and logging.
 */
@Service
public class ToolExecutor {

    private static final Logger logger = LoggerFactory.getLogger(ToolExecutor.class);
    private final ToolRegistry toolRegistry;

    public ToolExecutor(ToolRegistry toolRegistry) {
        this.toolRegistry = toolRegistry;
    }

    /**
     * Executes a tool by name with the given input.
     * 
     * @param toolName The name of the tool to execute.
     * @param input    The input parameters for the tool.
     * @return A ToolResponse with the result.
     */
    public ToolResponse execute(String toolName, Map<String, Object> input) {
        logger.info("Executing tool: {} with input: {}", toolName, input);

        Optional<Tool> toolOptional = toolRegistry.getTool(toolName);
        if (toolOptional.isEmpty()) {
            logger.error("Unknown tool requested: {}", toolName);
            return ToolResponse.failed(toolName, "Tool '" + toolName + "' not found in registry.");
        }

        Tool tool = toolOptional.get();

        try {
            // Simple validation: check if all required keys from schema are present
            // In a real scenario, we might use a more robust JSON Schema validator
            for (String key : tool.getExpectedInputSchema().keySet()) {
                if (!input.containsKey(key)) {
                    String error = "Missing required input parameter: " + key;
                    logger.warn("Validation failed for tool {}: {}", toolName, error);
                    return ToolResponse.failed(toolName, error);
                }
            }

            ToolResponse response = tool.execute(input);
            logger.info("Tool execution completed: {} - Status: {}", toolName, response.getStatus());
            return response;
        } catch (Exception e) {
            String errorMessage = "Unexpected error during tool execution: " + e.getMessage();
            logger.error(errorMessage, e);
            return ToolResponse.failed(toolName, errorMessage);
        }
    }
}
