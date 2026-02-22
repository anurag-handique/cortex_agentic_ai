package com.cortex.assistant.domain.repository;

import com.cortex.assistant.domain.model.AgentTask;
import com.cortex.assistant.domain.model.AgentTask.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for AgentTask entities
 */
@Repository
public interface AgentTaskRepository extends JpaRepository<AgentTask, Long> {

    Optional<AgentTask> findByTaskId(String taskId);

    List<AgentTask> findBySessionIdOrderByPriorityDescCreatedAtAsc(String sessionId);

    List<AgentTask> findByStatusOrderByPriorityDescCreatedAtAsc(TaskStatus status);

    List<AgentTask> findBySessionIdAndStatusOrderByPriorityDescCreatedAtAsc(String sessionId, TaskStatus status);

    @Query("SELECT t FROM AgentTask t WHERE t.status = 'PENDING' AND t.sessionId = :sessionId ORDER BY t.priority DESC, t.createdAt ASC")
    List<AgentTask> findNextPendingTasks(@Param("sessionId") String sessionId);

    @Query("SELECT t FROM AgentTask t WHERE t.status = 'PENDING' ORDER BY t.priority DESC, t.createdAt ASC")
    List<AgentTask> findAllPendingTasks();

    @Query("SELECT COUNT(t) FROM AgentTask t WHERE t.sessionId = :sessionId AND t.status = :status")
    long countBySessionIdAndStatus(@Param("sessionId") String sessionId, @Param("status") TaskStatus status);

    List<AgentTask> findByParentTaskId(String parentTaskId);
}
