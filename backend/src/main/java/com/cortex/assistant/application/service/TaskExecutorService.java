package com.cortex.assistant.application.service;

import com.cortex.assistant.agent.tools.ToolExecutor;
import com.cortex.assistant.agent.tools.ToolResponse;
import com.cortex.assistant.domain.model.AgentTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.HashMap;
import java.util.Map;

/**
 * TaskExecutorService
 * 
 * Executes individual tasks from the queue by invoking the appropriate tools.
 * This is the "motor cortex" - translating plans into actions.
 */
@Service
public class TaskExecutorService {

    private static final Logger logger = LoggerFactory.getLogger(TaskExecutorService.class);

    private final ToolExecutor toolExecutor;
    private final TaskPlannerService plannerService;
    private final ContextService contextService;
    private final ObjectMapper objectMapper;

    public TaskExecutorService(ToolExecutor toolExecutor,
            TaskPlannerService plannerService,
            ContextService contextService) {
        this.toolExecutor = toolExecutor;
        this.plannerService = plannerService;
        this.contextService = contextService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Execute a single task
     */
    public TaskExecutionResult executeTask(AgentTask task) {
        logger.info("Executing task {}: {}", task.getTaskId(), task.getDescription());

        try {
            // Mark task as in progress
            plannerService.startTask(task.getTaskId());

            // Parse tool input from JSON string to Map
            Map<String, Object> toolInputMap = parseToolInput(task.getToolInput());

            // Execute the tool
            ToolResponse toolResponse = toolExecutor.execute(
                    task.getToolName(),
                    toolInputMap);

            // Convert tool output to string
            String outputString = toolResponse.getOutput() != null ? toolResponse.getOutput().toString() : "";

            // Save tool execution to context
            contextService.saveToolMessage(
                    task.getSessionId(),
                    task.getToolName(),
                    task.getToolInput(),
                    outputString);

            // Check if execution was successful
            if ("success".equals(toolResponse.getStatus())) {
                plannerService.completeTask(task.getTaskId(), outputString);
                logger.info("Task {} completed successfully", task.getTaskId());
                return new TaskExecutionResult(true, outputString, null);
            } else {
                String errorMsg = "Tool execution failed: " + toolResponse.getError();
                plannerService.failTask(task.getTaskId(), errorMsg);
                logger.error("Task {} failed: {}", task.getTaskId(), errorMsg);
                return new TaskExecutionResult(false, null, errorMsg);
            }

        } catch (Exception e) {
            String errorMsg = "Exception during task execution: " + e.getMessage();
            logger.error("Task {} threw exception", task.getTaskId(), e);
            plannerService.failTask(task.getTaskId(), errorMsg);
            return new TaskExecutionResult(false, null, errorMsg);
        }
    }

    /**
     * Parse tool input from JSON string to Map
     */
    private Map<String, Object> parseToolInput(String toolInput) {
        if (toolInput == null || toolInput.trim().isEmpty() || toolInput.equals("{}")) {
            return new HashMap<>();
        }

        try {
            return objectMapper.readValue(toolInput, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            logger.warn("Failed to parse tool input as JSON, using empty map: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Execute the next pending task for a session
     */
    public TaskExecutionResult executeNextTask(String sessionId) {
        AgentTask nextTask = plannerService.getNextPendingTask(sessionId);

        if (nextTask == null) {
            logger.debug("No pending tasks for session {}", sessionId);
            return new TaskExecutionResult(false, null, "No pending tasks");
        }

        return executeTask(nextTask);
    }

    /**
     * Execute all pending tasks for a session (batch mode)
     */
    public BatchExecutionResult executeAllPendingTasks(String sessionId) {
        int executed = 0;
        int succeeded = 0;
        int failed = 0;

        while (plannerService.hasPendingTasks(sessionId)) {
            TaskExecutionResult result = executeNextTask(sessionId);
            executed++;

            if (result.isSuccess()) {
                succeeded++;
            } else {
                failed++;
            }

            // Safety limit to prevent infinite loops
            if (executed >= 100) {
                logger.warn("Execution limit reached for session {}", sessionId);
                break;
            }
        }

        logger.info("Batch execution for session {}: {} executed, {} succeeded, {} failed",
                sessionId, executed, succeeded, failed);

        return new BatchExecutionResult(executed, succeeded, failed);
    }

    /**
     * Result of a single task execution
     */
    public static class TaskExecutionResult {
        private final boolean success;
        private final String output;
        private final String error;

        public TaskExecutionResult(boolean success, String output, String error) {
            this.success = success;
            this.output = output;
            this.error = error;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getOutput() {
            return output;
        }

        public String getError() {
            return error;
        }
    }

    /**
     * Result of batch execution
     */
    public static class BatchExecutionResult {
        private final int totalExecuted;
        private final int succeeded;
        private final int failed;

        public BatchExecutionResult(int totalExecuted, int succeeded, int failed) {
            this.totalExecuted = totalExecuted;
            this.succeeded = succeeded;
            this.failed = failed;
        }

        public int getTotalExecuted() {
            return totalExecuted;
        }

        public int getSucceeded() {
            return succeeded;
        }

        public int getFailed() {
            return failed;
        }
    }
}
