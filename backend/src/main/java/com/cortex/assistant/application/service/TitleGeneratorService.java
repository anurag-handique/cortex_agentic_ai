package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.ChatSession;
import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.domain.model.OllamaResponse;
import com.cortex.assistant.domain.repository.ChatSessionRepository;
import com.cortex.assistant.infrastructure.client.OllamaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

/**
 * TitleGeneratorService
 * 
 * Automatically generates concise titles for chat sessions based on the
 * conversation content.
 * Uses a lightweight LLM call to summarize the intent.
 * 
 * NOTE: We use OllamaClient directly instead of OllamaService to avoid circular
 * dependencies
 * and to prevent the title generation prompts from being saved to conversation
 * context.
 */
@Service
public class TitleGeneratorService {

    private static final Logger logger = LoggerFactory.getLogger(TitleGeneratorService.class);

    private final OllamaClient ollamaClient;
    private final ChatSessionRepository sessionRepository;

    public TitleGeneratorService(OllamaClient ollamaClient, ChatSessionRepository sessionRepository) {
        this.ollamaClient = ollamaClient;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Generates a title for the given session and user prompt.
     * This is marked @Async to avoid blocking the main chat response.
     */
    public String generateTitle(String sessionId, String userMessage) {
        logger.info("Generating title for session: {}", sessionId);

        try {
            ChatSession session = sessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

            // Don't regenerate if we already have a custom title
            // For now, let's just generate if it's the default "New Chat" or null/empty
            if (session.getTitle() != null && !session.getTitle().equals("New Chat") && !session.getTitle().isEmpty()) {
                // Determine if we should refine it early in the conversation
                if (session.getMessages().size() > 5) {
                    return session.getTitle();
                }
            }

            String prompt = String.format(
                    "Summarize this user request into a very short, punchy chat title (2-4 words maximum). " +
                            "Respond with ONLY the title. No quotes. No preamble. No period.\n\nRequest: %s",
                    userMessage);

            // Use a fast model for title generation
            OllamaRequest request = new OllamaRequest("mistral:latest", prompt);

            // Call client directly to bypass context-saving and service-level cycles
            OllamaResponse response = ollamaClient.generateText(request);
            String title = response.getResponse().trim();

            // Cleanup quotes and periods if LLM ignores instruction
            title = title.replaceAll("^\"|\"$", "").replaceAll("\\.$", "").trim();

            if (!title.isEmpty()) {
                session.setTitle(title);
                sessionRepository.save(session);
                logger.info("Updated session {} title to: {}", sessionId, title);
                return title;
            }

            return null;
        } catch (Exception e) {
            logger.error("Failed to generate title for session {}", sessionId, e);
            return null;
        }
    }
}
