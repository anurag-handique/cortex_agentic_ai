package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.AgentTask;
import com.cortex.assistant.domain.model.AgentTask.TaskStatus;
import com.cortex.assistant.domain.repository.AgentTaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * TaskPlannerService
 * 
 * The "Frontal Lobe" of Cortex - responsible for breaking down complex requests
 * into executable tasks and managing the task queue.
 */
@Service
public class TaskPlannerService {

    private static final Logger logger = LoggerFactory.getLogger(TaskPlannerService.class);

    private final AgentTaskRepository taskRepository;

    public TaskPlannerService(AgentTaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    /**
     * Create a new task
     */
    @Transactional
    public AgentTask createTask(String sessionId, String description, String toolName, String toolInput) {
        String taskId = UUID.randomUUID().toString();
        AgentTask task = new AgentTask(taskId, sessionId, description);
        task.setToolName(toolName);
        task.setToolInput(toolInput);

        AgentTask saved = taskRepository.save(task);
        logger.info("Created task {} for session {}: {}", taskId, sessionId, description);
        return saved;
    }

    /**
     * Create a task with priority
     */
    @Transactional
    public AgentTask createTask(String sessionId, String description, String toolName,
            String toolInput, int priority) {
        AgentTask task = createTask(sessionId, description, toolName, toolInput);
        task.setPriority(priority);
        return taskRepository.save(task);
    }

    /**
     * Create a subtask with parent reference
     */
    @Transactional
    public AgentTask createSubTask(String parentTaskId, String sessionId, String description,
            String toolName, String toolInput) {
        AgentTask task = createTask(sessionId, description, toolName, toolInput);
        task.setParentTaskId(parentTaskId);
        return taskRepository.save(task);
    }

    /**
     * Get the next pending task for a session
     */
    public AgentTask getNextPendingTask(String sessionId) {
        List<AgentTask> pendingTasks = taskRepository.findNextPendingTasks(sessionId);
        if (pendingTasks.isEmpty()) {
            return null;
        }
        return pendingTasks.get(0);
    }

    /**
     * Get all pending tasks across all sessions (for autonomous loop)
     */
    public List<AgentTask> getAllPendingTasks() {
        return taskRepository.findAllPendingTasks();
    }

    /**
     * Get all tasks for a session
     */
    public List<AgentTask> getSessionTasks(String sessionId) {
        return taskRepository.findBySessionIdOrderByPriorityDescCreatedAtAsc(sessionId);
    }

    /**
     * Get tasks by status
     */
    public List<AgentTask> getTasksByStatus(String sessionId, TaskStatus status) {
        return taskRepository.findBySessionIdAndStatusOrderByPriorityDescCreatedAtAsc(sessionId, status);
    }

    /**
     * Mark task as in progress
     */
    @Transactional
    public AgentTask startTask(String taskId) {
        AgentTask task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        task.markInProgress();
        AgentTask updated = taskRepository.save(task);
        logger.info("Started task {}: {}", taskId, task.getDescription());
        return updated;
    }

    /**
     * Mark task as completed
     */
    @Transactional
    public AgentTask completeTask(String taskId, String result) {
        AgentTask task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        task.markCompleted(result);
        AgentTask updated = taskRepository.save(task);
        logger.info("Completed task {}: {}", taskId, task.getDescription());
        return updated;
    }

    /**
     * Mark task as failed
     */
    @Transactional
    public AgentTask failTask(String taskId, String errorMessage) {
        AgentTask task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (task.canRetry()) {
            task.incrementRetry();
            logger.warn("Task {} failed, retrying ({}/{}): {}",
                    taskId, task.getRetryCount(), task.getMaxRetries(), errorMessage);
        } else {
            task.markFailed(errorMessage);
            logger.error("Task {} failed permanently: {}", taskId, errorMessage);
        }

        return taskRepository.save(task);
    }

    /**
     * Cancel a task
     */
    @Transactional
    public AgentTask cancelTask(String taskId) {
        AgentTask task = taskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        task.setStatus(TaskStatus.CANCELLED);
        AgentTask updated = taskRepository.save(task);
        logger.info("Cancelled task {}: {}", taskId, task.getDescription());
        return updated;
    }

    /**
     * Get task execution statistics
     */
    public TaskStatistics getStatistics(String sessionId) {
        long pending = taskRepository.countBySessionIdAndStatus(sessionId, TaskStatus.PENDING);
        long inProgress = taskRepository.countBySessionIdAndStatus(sessionId, TaskStatus.IN_PROGRESS);
        long completed = taskRepository.countBySessionIdAndStatus(sessionId, TaskStatus.COMPLETED);
        long failed = taskRepository.countBySessionIdAndStatus(sessionId, TaskStatus.FAILED);

        return new TaskStatistics(pending, inProgress, completed, failed);
    }

    /**
     * Check if there are pending tasks
     */
    public boolean hasPendingTasks(String sessionId) {
        return taskRepository.countBySessionIdAndStatus(sessionId, TaskStatus.PENDING) > 0;
    }

    /**
     * Statistics holder class
     */
    public static class TaskStatistics {
        private final long pending;
        private final long inProgress;
        private final long completed;
        private final long failed;

        public TaskStatistics(long pending, long inProgress, long completed, long failed) {
            this.pending = pending;
            this.inProgress = inProgress;
            this.completed = completed;
            this.failed = failed;
        }

        public long getPending() {
            return pending;
        }

        public long getInProgress() {
            return inProgress;
        }

        public long getCompleted() {
            return completed;
        }

        public long getFailed() {
            return failed;
        }

        public long getTotal() {
            return pending + inProgress + completed + failed;
        }
    }
}
