package com.cortex.assistant.agent.tools.impl;

import com.cortex.assistant.agent.core.WorkspaceManager;
import com.cortex.assistant.agent.tools.Tool;
import com.cortex.assistant.agent.tools.ToolResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * WorkspaceScanTool
 * 
 * Allows the agent to scan the project structure.
 */
@Component
public class WorkspaceScanTool implements Tool {

    private final WorkspaceManager workspaceManager;

    public WorkspaceScanTool(WorkspaceManager workspaceManager) {
        this.workspaceManager = workspaceManager;
    }

    @Override
    public String getToolName() {
        return "scan_workspace";
    }

    @Override
    public String getDescription() {
        return "Scans the project directory structure to understand the layout. Returns a tree view of files.";
    }

    @Override
    public Map<String, String> getExpectedInputSchema() {
        return Map.of("maxDepth", "integer, optional (default 2)");
    }

    @Override
    public ToolResponse execute(Map<String, Object> input) {
        try {
            // Get sessionId from input if present, or use default
            String sessionId = (String) input.getOrDefault("sessionId", "default");

            // Handle maxDepth which might be String or Integer
            int maxDepth = 2;
            Object depthObj = input.get("maxDepth");
            if (depthObj instanceof Number) {
                maxDepth = ((Number) depthObj).intValue();
            } else if (depthObj instanceof String) {
                maxDepth = Integer.parseInt((String) depthObj);
            }

            List<String> tree = workspaceManager.getFileTree(sessionId, maxDepth);
            Map<String, String> projectContext = workspaceManager.getProjectContext(sessionId);

            Map<String, Object> result = new java.util.HashMap<>();
            result.put("tree", tree);
            result.put("context", projectContext);

            return ToolResponse.success(getToolName(), result);

        } catch (Exception e) {
            return ToolResponse.failed(getToolName(), "Failed to scan workspace: " + e.getMessage());
        }
    }
}
