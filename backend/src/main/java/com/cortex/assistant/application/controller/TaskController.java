package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.dto.ApiResponse;
import com.cortex.assistant.application.service.TaskExecutorService;
import com.cortex.assistant.application.service.TaskPlannerService;
import com.cortex.assistant.domain.model.AgentTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * TaskController
 * 
 * REST API for task management and execution.
 * Provides endpoints for creating, viewing, and executing tasks.
 */
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    private final TaskPlannerService plannerService;
    private final TaskExecutorService executorService;

    public TaskController(TaskPlannerService plannerService, TaskExecutorService executorService) {
        this.plannerService = plannerService;
        this.executorService = executorService;
    }

    /**
     * Create a new task
     */
    @PostMapping("/create")
    public ApiResponse<AgentTask> createTask(@RequestBody CreateTaskRequest request) {
        logger.info("Creating task for session {}: {}", request.sessionId, request.description);

        try {
            AgentTask task = plannerService.createTask(
                    request.sessionId,
                    request.description,
                    request.toolName,
                    request.toolInput,
                    request.priority != null ? request.priority : 5);

            return new ApiResponse<>(true, "Task created successfully", task);
        } catch (Exception e) {
            logger.error("Error creating task", e);
            return new ApiResponse<>(false, e.getMessage(), "TASK_CREATION_ERROR", null);
        }
    }

    /**
     * Get all tasks for a session
     */
    @GetMapping("/session/{sessionId}")
    public ApiResponse<List<AgentTask>> getSessionTasks(@PathVariable String sessionId) {
        logger.info("Fetching tasks for session {}", sessionId);

        try {
            List<AgentTask> tasks = plannerService.getSessionTasks(sessionId);
            return new ApiResponse<>(true, "Tasks retrieved successfully", tasks);
        } catch (Exception e) {
            logger.error("Error fetching tasks", e);
            return new ApiResponse<>(false, e.getMessage(), "TASK_FETCH_ERROR", null);
        }
    }

    /**
     * Get pending tasks for a session
     */
    @GetMapping("/session/{sessionId}/pending")
    public ApiResponse<List<AgentTask>> getPendingTasks(@PathVariable String sessionId) {
        logger.info("Fetching pending tasks for session {}", sessionId);

        try {
            List<AgentTask> tasks = plannerService.getTasksByStatus(sessionId, AgentTask.TaskStatus.PENDING);
            return new ApiResponse<>(true, "Pending tasks retrieved successfully", tasks);
        } catch (Exception e) {
            logger.error("Error fetching pending tasks", e);
            return new ApiResponse<>(false, e.getMessage(), "TASK_FETCH_ERROR", null);
        }
    }

    /**
     * Execute the next pending task
     */
    @PostMapping("/execute/next")
    public ApiResponse<TaskExecutorService.TaskExecutionResult> executeNextTask(
            @RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        logger.info("Executing next task for session {}", sessionId);

        try {
            TaskExecutorService.TaskExecutionResult result = executorService.executeNextTask(sessionId);
            return new ApiResponse<>(true, "Task execution completed", result);
        } catch (Exception e) {
            logger.error("Error executing task", e);
            return new ApiResponse<>(false, e.getMessage(), "TASK_EXECUTION_ERROR", null);
        }
    }

    /**
     * Execute all pending tasks for a session
     */
    @PostMapping("/execute/all")
    public ApiResponse<TaskExecutorService.BatchExecutionResult> executeAllTasks(
            @RequestBody Map<String, String> request) {
        String sessionId = request.get("sessionId");
        logger.info("Executing all pending tasks for session {}", sessionId);

        try {
            TaskExecutorService.BatchExecutionResult result = executorService.executeAllPendingTasks(sessionId);
            return new ApiResponse<>(true, "Batch execution completed", result);
        } catch (Exception e) {
            logger.error("Error executing tasks", e);
            return new ApiResponse<>(false, e.getMessage(), "BATCH_EXECUTION_ERROR", null);
        }
    }

    /**
     * Get task statistics
     */
    @GetMapping("/session/{sessionId}/stats")
    public ApiResponse<TaskPlannerService.TaskStatistics> getTaskStatistics(@PathVariable String sessionId) {
        logger.info("Fetching task statistics for session {}", sessionId);

        try {
            TaskPlannerService.TaskStatistics stats = plannerService.getStatistics(sessionId);
            return new ApiResponse<>(true, "Statistics retrieved successfully", stats);
        } catch (Exception e) {
            logger.error("Error fetching statistics", e);
            return new ApiResponse<>(false, e.getMessage(), "STATS_FETCH_ERROR", null);
        }
    }

    /**
     * Cancel a task
     */
    @PostMapping("/{taskId}/cancel")
    public ApiResponse<AgentTask> cancelTask(@PathVariable String taskId) {
        logger.info("Cancelling task {}", taskId);

        try {
            AgentTask task = plannerService.cancelTask(taskId);
            return new ApiResponse<>(true, "Task cancelled successfully", task);
        } catch (Exception e) {
            logger.error("Error cancelling task", e);
            return new ApiResponse<>(false, e.getMessage(), "TASK_CANCEL_ERROR", null);
        }
    }

    // Request DTOs
    public static class CreateTaskRequest {
        public String sessionId;
        public String description;
        public String toolName;
        public String toolInput;
        public Integer priority;
    }
}
