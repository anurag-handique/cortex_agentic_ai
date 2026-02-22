package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.dto.ApiResponse;
import com.cortex.assistant.application.service.AgentService;
import com.cortex.assistant.domain.model.AgentDecision;
import com.cortex.assistant.domain.model.UserRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/agent")
public class AgentController {

    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);

    private final AgentService agentService;
    private final com.cortex.assistant.agent.tools.ToolRegistry toolRegistry;
    private final com.cortex.assistant.agent.tools.ToolExecutor toolExecutor;
    private final com.cortex.assistant.application.service.ContextService contextService;
    private final ObjectMapper objectMapper;

    public AgentController(AgentService agentService,
            com.cortex.assistant.agent.tools.ToolRegistry toolRegistry,
            com.cortex.assistant.agent.tools.ToolExecutor toolExecutor,
            com.cortex.assistant.application.service.ContextService contextService) {
        this.agentService = agentService;
        this.toolRegistry = toolRegistry;
        this.toolExecutor = toolExecutor;
        this.contextService = contextService;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/decide")
    public ApiResponse<AgentDecision> makeDecision(@RequestBody UserRequest request) {
        logger.info("Received request to make agent decision");
        try {
            AgentDecision decision = agentService.makeDecision(request);
            logger.info("Successfully made agent decision");
            return new ApiResponse<>(true, "Success", decision);
        } catch (Exception e) {
            logger.error("Error making agent decision: {}", e.getMessage(), e);
            return new ApiResponse<>(false, e.getMessage(), "AGENT_DECISION_ERROR", null);
        }
    }

    @PostMapping("/decide/stream")
    public void streamDecision(@RequestBody UserRequest request, HttpServletResponse response) throws IOException {
        logger.info("Received request to stream agent decision");
        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");

        try {
            agentService.streamDecision(request, response);
            logger.info("Successfully streamed agent decision");
        } catch (Exception e) {
            logger.error("Error streaming agent decision: {}", e.getMessage(), e);
            response.getWriter().write("data: {\"error\": \"" + e.getMessage() + "\"}\n\n");
        }
    }

    @GetMapping("/tools")
    public ApiResponse<java.util.List<com.cortex.assistant.agent.tools.Tool>> getAvailableTools() {
        logger.info("Received request to list available tools");
        return new ApiResponse<>(true, "Success", toolRegistry.getAllTools());
    }

    @PostMapping("/tools/execute")
    public ApiResponse<com.cortex.assistant.agent.tools.ToolResponse> executeTool(
            @RequestBody java.util.Map<String, Object> request) {
        String toolName = (String) request.get("toolName");
        Object rawInput = request.get("input");

        logger.info("Received request to execute tool: {}", toolName);
        try {
            java.util.Map<String, Object> inputMap = parseInput(rawInput);
            com.cortex.assistant.agent.tools.ToolResponse response = toolExecutor.execute(toolName, inputMap);

            // SAVE TO CONTEXT: Persist tool execution
            String sessionId = (String) request.get("sessionId");
            if (sessionId != null && !sessionId.isEmpty()) {
                String inputStr = objectMapper.writeValueAsString(inputMap);
                String outputStr = objectMapper.writeValueAsString(response.getOutput());

                contextService.saveToolMessage(sessionId, toolName, inputStr, outputStr);
            }

            return new ApiResponse<>(true, "Success", response);
        } catch (Exception e) {

            logger.error("Error executing tool {}: {}", toolName, e.getMessage(), e);
            return new ApiResponse<>(false, e.getMessage(), "TOOL_EXECUTION_ERROR", null);
        }
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> parseInput(Object rawInput) throws Exception {
        if (rawInput instanceof java.util.Map) {
            return (java.util.Map<String, Object>) rawInput;
        } else if (rawInput instanceof String) {
            String jsonInput = ((String) rawInput).trim();
            if (jsonInput.isEmpty() || jsonInput.equals("null")) {
                return java.util.Collections.emptyMap();
            }

            try {
                return objectMapper.readValue(jsonInput, java.util.Map.class);
            } catch (Exception e) {
                logger.warn("Initial JSON parsing failed, attempting deep cleanup: {}", jsonInput);

                // Deep cleanup for common LLM/ToString format errors
                // 0. Escape single backslashes (common in Windows paths) to prevent quote
                // escaping
                // Note: We use 8 backslashes in the replacement to get 2 literal backslashes in
                // the Java string
                String fixed = jsonInput.replaceAll("(?<!\\\\)\\\\(?!\\\\)", "\\\\\\\\\\\\\\\\");

                // 1. Single quotes -> Double quotes
                fixed = fixed.replace('\'', '"');

                // 2. Python/toString '=' -> ':'
                fixed = fixed.replace('=', ':');

                // 3. Wrap unquoted keys in double quotes
                // This regex finds word characters followed by a colon that aren't already
                // quoted
                fixed = fixed.replaceAll("(?i)([{,])\\s*([a-z_][a-z0-9_]*)\\s*:", "$1\"$2\":");

                // 4. Handle auto-brace
                if (!fixed.startsWith("{") && fixed.contains(":")) {
                    fixed = "{" + fixed + "}";
                }

                try {
                    logger.info("Attempting parse with fixed JSON: {}", fixed);
                    return objectMapper.readValue(fixed, java.util.Map.class);
                } catch (Exception e2) {
                    logger.error("Failed to parse input even after deep cleanup. Final string: {}", fixed);
                    throw e; // Throw original exception to preserve stack trace
                }
            }
        } else if (rawInput == null) {
            return java.util.Collections.emptyMap();
        } else {
            throw new IllegalArgumentException("Invalid input type: " + rawInput.getClass().getName());
        }
    }

    @PostMapping("/interpret")
    public ApiResponse<AgentDecision> interpretToolResult(@RequestBody java.util.Map<String, Object> request) {
        String originalRequest = (String) request.get("originalRequest");
        // Deserialize toolResponse from the request map
        com.cortex.assistant.agent.tools.ToolResponse toolResponse = objectMapper.convertValue(
                request.get("toolResponse"), com.cortex.assistant.agent.tools.ToolResponse.class);

        String sessionId = (String) request.get("sessionId");
        logger.info("Received request to interpret tool result for tool: {}", toolResponse.getTool());
        try {
            AgentDecision decision = agentService.interpretResult(sessionId, originalRequest, toolResponse);

            return new ApiResponse<>(true, "Success", decision);
        } catch (Exception e) {
            logger.error("Error interpreting tool result: {}", e.getMessage(), e);
            return new ApiResponse<>(false, e.getMessage(), "INTERPRET_ERROR", null);
        }
    }
}
