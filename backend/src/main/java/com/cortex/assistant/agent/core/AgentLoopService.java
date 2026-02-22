package com.cortex.assistant.agent.core;

import com.cortex.assistant.application.service.TaskExecutorService;
import com.cortex.assistant.application.service.TaskPlannerService;
import com.cortex.assistant.domain.model.AgentTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AgentLoopService
 * 
 * The "Nervous System" of Cortex.
 * A background thread that autonomously checks for and executes pending tasks.
 */
@Service
public class AgentLoopService {

    private static final Logger logger = LoggerFactory.getLogger(AgentLoopService.class);

    private final TaskPlannerService plannerService;
    private final TaskExecutorService executorService;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public AgentLoopService(TaskPlannerService plannerService, TaskExecutorService executorService) {
        this.plannerService = plannerService;
        this.executorService = executorService;
    }

    /**
     * The main autonomous loop. Runs every 2 seconds.
     */
    @Scheduled(fixedDelay = 2000)
    public void pulse() {
        if (isRunning.get()) {
            return;
        }

        try {
            isRunning.set(true);
            List<AgentTask> pendingTasks = plannerService.getAllPendingTasks();

            if (pendingTasks.isEmpty()) {
                return;
            }

            logger.info("Autonomous Pulse: Found {} pending tasks", pendingTasks.size());

            // For now, we execute them one by one
            // In a more advanced version, we might group by session or handle dependencies
            for (AgentTask task : pendingTasks) {
                // Check if dependencies are met (simple check for now)
                if (areDependenciesMet(task)) {
                    executorService.executeTask(task);
                }
            }

        } catch (Exception e) {
            logger.error("Error in autonomous agent loop pulse", e);
        } finally {
            isRunning.set(false);
        }
    }

    private boolean areDependenciesMet(AgentTask task) {
        // Placeholder for dependency logic
        // If dependencies is null/empty, it's ready
        String deps = task.getDependencies();
        return deps == null || deps.trim().isEmpty() || deps.equals("[]");
    }
}
