package com.cortex.assistant.domain.repository;

import com.cortex.assistant.domain.model.ChatMessage;
import com.cortex.assistant.domain.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ChatMessage entities
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionOrderByTimestampAsc(ChatSession session);

    @Query("SELECT m FROM ChatMessage m WHERE m.session.sessionId = :sessionId ORDER BY m.timestamp DESC")
    List<ChatMessage> findRecentMessagesBySessionId(@Param("sessionId") String sessionId);

    @Query(value = "SELECT * FROM chat_messages WHERE session_id = (SELECT id FROM chat_sessions WHERE session_id = :sessionId) ORDER BY timestamp DESC LIMIT :limit", nativeQuery = true)
    List<ChatMessage> findLastNMessages(@Param("sessionId") String sessionId, @Param("limit") int limit);
}
