package com.cortex.assistant.agent.tools;

import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Registry of all available tools.
 * Acts as the single source of truth for tool availability.
 */
@Component
public class ToolRegistry {

    private final Map<String, Tool> toolMap = new HashMap<>();

    public ToolRegistry(List<Tool> tools) {
        for (Tool tool : tools) {
            toolMap.put(tool.getToolName(), tool);
        }
    }

    /**
     * Registers a tool manually if needed.
     */
    public void registerTool(Tool tool) {
        toolMap.put(tool.getToolName(), tool);
    }

    /**
     * Gets a tool by its name.
     */
    public Optional<Tool> getTool(String toolName) {
        return Optional.ofNullable(toolMap.get(toolName));
    }

    /**
     * Returns all registered tools.
     */
    public List<Tool> getAllTools() {
        return List.copyOf(toolMap.values());
    }

    /**
     * Rechecks if an action is supported.
     */
    public boolean isActionSupported(String actionName) {
        return toolMap.containsKey(actionName);
    }

    /**
     * Returns a summary of all tools for the agent's context.
     */
    public String getToolSummaries() {
        return toolMap.values().stream()
                .map(tool -> String.format("- %s: %s (Expected Input: %s)",
                        tool.getToolName(), tool.getDescription(), tool.getExpectedInputSchema()))
                .collect(Collectors.joining("\n"));
    }
}
