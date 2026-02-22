package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.dto.ApiResponse;
import com.cortex.assistant.application.service.ContextService;
import com.cortex.assistant.domain.model.ChatMessage;
import com.cortex.assistant.domain.model.ChatSession;
import com.cortex.assistant.domain.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ChatHistoryController
 * 
 * Manages retrieval of past chat sessions and their message history.
 * Enables the "ChatGPT-style" sidebar functionality.
 */
@RestController
@RequestMapping("/api/v1/history")
public class ChatHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(ChatHistoryController.class);

    private final ContextService contextService;
    private final ChatSessionRepository sessionRepository;

    public ChatHistoryController(ContextService contextService, ChatSessionRepository sessionRepository) {
        this.contextService = contextService;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Get all chat sessions (for the sidebar list)
     * Ordered by most recently updated.
     */
    @GetMapping("/sessions")
    public ApiResponse<List<ChatSession>> getAllSessions(
            @RequestParam(required = false, defaultValue = "CHAT") String type) {
        logger.info("Fetching all chat sessions of type: {}", type);
        try {
            com.cortex.assistant.domain.model.SessionType sessionType;
            try {
                sessionType = com.cortex.assistant.domain.model.SessionType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                return new ApiResponse<>(false, "Invalid session type", null);
            }

            List<ChatSession> allSessions = sessionRepository.findAll();

            List<ChatSession> sessions = allSessions.stream()
                    .filter(s -> {
                        if (sessionType == com.cortex.assistant.domain.model.SessionType.CHAT) {
                            return s.getType() == com.cortex.assistant.domain.model.SessionType.CHAT
                                    || s.getType() == null;
                        }
                        return s.getType() == sessionType;
                    })
                    .collect(java.util.stream.Collectors.toList());

            // Sort in memory for now (simplest given current repo)
            sessions.sort((s1, s2) -> s2.getUpdatedAt().compareTo(s1.getUpdatedAt()));

            return new ApiResponse<>(true, "Sessions retrieved", sessions);
        } catch (Exception e) {
            logger.error("Error fetching sessions", e);
            return new ApiResponse<>(false, "Failed to fetch sessions", null);
        }
    }

    /**
     * Get full history for a specific session
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public ApiResponse<List<ChatMessage>> getSessionMessages(@PathVariable String sessionId) {
        logger.info("Fetching messages for session: {}", sessionId);
        try {
            List<ChatMessage> history = contextService.getSessionHistory(sessionId);
            return new ApiResponse<>(true, "History retrieved", history);
        } catch (Exception e) {
            logger.error("Error fetching history for " + sessionId, e);
            return new ApiResponse<>(false, "Failed to fetch history", null);
        }
    }

    /**
     * Get a single session metadata
     */
    @GetMapping("/sessions/{sessionId}")
    public ApiResponse<ChatSession> getSession(@PathVariable String sessionId) {
        logger.info("Fetching session metadata: {}", sessionId);
        try {
            ChatSession session = sessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            return new ApiResponse<>(true, "Session retrieved", session);
        } catch (Exception e) {
            logger.error("Error fetching session " + sessionId, e);
            return new ApiResponse<>(false, "Failed to fetch session", null);
        }
    }

    /**
     * Delete a session
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ApiResponse<Void> deleteSession(@PathVariable String sessionId) {
        logger.info("Deleting session: {}", sessionId);
        try {
            contextService.closeSession(sessionId); // Soft delete (marks inactive)
            return new ApiResponse<>(true, "Session deleted", null);
        } catch (Exception e) {
            logger.error("Error deleting session", e);
            return new ApiResponse<>(false, "Failed to delete session", null);
        }
    }

    /**
     * Update session title
     */
    @PatchMapping("/sessions/{sessionId}/title")
    public ApiResponse<ChatSession> updateSessionTitle(@PathVariable String sessionId,
            @RequestBody java.util.Map<String, String> body) {
        String newTitle = body.get("title");
        logger.info("Updating title for session {} to: {}", sessionId, newTitle);

        if (newTitle == null || newTitle.trim().isEmpty()) {
            return new ApiResponse<>(false, "Title cannot be empty", null);
        }

        try {
            ChatSession session = sessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            session.setTitle(newTitle.trim());
            sessionRepository.save(session);
            // We return the session (messages are ignored via @JsonIgnore so it's light)
            return new ApiResponse<>(true, "Title updated", session);
        } catch (Exception e) {
            logger.error("Error updating session title", e);
            return new ApiResponse<>(false, "Failed to update title: " + e.getMessage(), null);
        }
    }
}
