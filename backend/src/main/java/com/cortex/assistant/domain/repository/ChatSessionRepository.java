package com.cortex.assistant.domain.repository;

import com.cortex.assistant.domain.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ChatSession entities
 */
@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Optional<ChatSession> findBySessionId(String sessionId);

    Optional<ChatSession> findBySessionIdAndIsActiveTrue(String sessionId);

    java.util.List<ChatSession> findByType(com.cortex.assistant.domain.model.SessionType type);
}
