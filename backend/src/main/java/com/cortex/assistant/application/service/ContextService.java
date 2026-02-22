package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.ChatMessage;
import com.cortex.assistant.domain.model.ChatSession;
import com.cortex.assistant.domain.model.User;
import com.cortex.assistant.domain.repository.ChatMessageRepository;
import com.cortex.assistant.domain.repository.ChatSessionRepository;
import com.cortex.assistant.domain.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * ContextService
 * 
 * Manages conversation context and chat history.
 * This is the "Hippocampus" of Cortex - responsible for memory storage and
 * retrieval.
 */
@Service
public class ContextService {

    private static final Logger logger = LoggerFactory.getLogger(ContextService.class);
    private static final int DEFAULT_CONTEXT_WINDOW = 10;

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final com.cortex.assistant.application.service.TaskPlannerService plannerService;

    public ContextService(ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository,
            UserRepository userRepository,
            com.cortex.assistant.application.service.TaskPlannerService plannerService) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.plannerService = plannerService;
    }

    /**
     * Create a new chat session for the current authenticated user
     */
    @Transactional
    public ChatSession createSession(String sessionId) {
        return createSession(sessionId, com.cortex.assistant.domain.model.SessionType.CHAT);
    }

    @Transactional
    public ChatSession createSession(String sessionId, com.cortex.assistant.domain.model.SessionType type) {
        User user = getCurrentUser();
        String finalSessionId = (sessionId != null && !sessionId.isEmpty()) ? sessionId : UUID.randomUUID().toString();
        ChatSession session = new ChatSession(finalSessionId, user);
        session.setType(type);
        ChatSession saved = sessionRepository.save(session);
        logger.info("Created new chat session: {} type: {} for user: {}", finalSessionId, type, user.getEmail());

        if (type == com.cortex.assistant.domain.model.SessionType.CHAT) {
            // Phase 3: Autonomous Autonomy - Schedule initial workspace scan
            // Only for CHAT sessions usually? Or TASKS too?
            // "Scan workspace" seems useful context for both.
            plannerService.createTask(finalSessionId, "Scan workspace to understand project structure and project type",
                    "scan_workspace", "{\"maxDepth\": 2}", 10);
        }

        return saved;

    }

    /**
     * Get or create a session for the current authenticated user
     */
    @Transactional
    public ChatSession getOrCreateSession(String sessionId) {
        return getOrCreateSession(sessionId, com.cortex.assistant.domain.model.SessionType.CHAT);
    }

    @Transactional
    public ChatSession getOrCreateSession(String sessionId, com.cortex.assistant.domain.model.SessionType type) {
        if (sessionId == null || sessionId.isEmpty()) {
            return createSession(null, type);
        }

        return sessionRepository.findBySessionIdAndIsActiveTrue(sessionId)
                .orElseGet(() -> {
                    logger.info("Session {} not found, creating new session of type {}", sessionId, type);
                    return createSession(sessionId, type);
                });
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    /**
     * Save a user message
     */
    @Transactional
    public ChatMessage saveUserMessage(String sessionId, String content) {
        ChatSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        ChatMessage message = new ChatMessage(session, ChatMessage.MessageRole.USER, content);
        session.addMessage(message);

        ChatMessage saved = messageRepository.save(message);
        logger.debug("Saved user message to session {}", sessionId);
        return saved;
    }

    /**
     * Save an assistant message
     */
    @Transactional
    public ChatMessage saveAssistantMessage(String sessionId, String content, String agentDecisionJson) {
        ChatSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        ChatMessage message = new ChatMessage(session, ChatMessage.MessageRole.ASSISTANT, content);
        message.setAgentDecision(agentDecisionJson);
        session.addMessage(message);

        ChatMessage saved = messageRepository.save(message);
        logger.debug("Saved assistant message to session {}", sessionId);
        return saved;
    }

    /**
     * Save a tool execution message
     */
    @Transactional
    public ChatMessage saveToolMessage(String sessionId, String toolName, String toolInput, String toolOutput) {
        ChatSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        ChatMessage message = new ChatMessage(session, ChatMessage.MessageRole.TOOL,
                "Tool: " + toolName + " executed");
        message.setToolName(toolName);
        message.setToolInput(toolInput);
        message.setToolOutput(toolOutput);
        session.addMessage(message);

        ChatMessage saved = messageRepository.save(message);
        logger.debug("Saved tool execution message to session {}", sessionId);
        return saved;
    }

    /**
     * Get recent conversation history for context injection
     */
    public List<ChatMessage> getRecentContext(String sessionId, int messageCount) {
        List<ChatMessage> messages = messageRepository.findLastNMessages(sessionId, messageCount);
        logger.debug("Retrieved {} messages for session {}", messages.size(), sessionId);
        return messages;
    }

    /**
     * Get recent context with default window size
     */
    public List<ChatMessage> getRecentContext(String sessionId) {
        return getRecentContext(sessionId, DEFAULT_CONTEXT_WINDOW);
    }

    /**
     * Build context string for LLM prompt injection
     */
    public String buildContextPrompt(String sessionId) {
        List<ChatMessage> messages = getRecentContext(sessionId);

        if (messages.isEmpty()) {
            return "";
        }

        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("\n\n=== CONVERSATION HISTORY ===\n");

        // Reverse to show chronological order (oldest first)
        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatMessage msg = messages.get(i);
            String roleLabel = switch (msg.getRole()) {
                case USER -> "User";
                case ASSISTANT -> "Cortex";
                case TOOL -> "Tool";
                case SYSTEM -> "System";
            };

            contextBuilder.append(String.format("%s: %s\n", roleLabel, msg.getContent()));
        }

        contextBuilder.append("=== END HISTORY ===\n\n");

        return contextBuilder.toString();
    }

    /**
     * Get full session history
     */
    public List<ChatMessage> getSessionHistory(String sessionId) {
        ChatSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        return messageRepository.findBySessionOrderByTimestampAsc(session);
    }

    /**
     * Close a session
     */
    @Transactional
    public void closeSession(String sessionId) {
        ChatSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setIsActive(false);
        sessionRepository.save(session);
        logger.info("Closed session: {}", sessionId);
    }
}
