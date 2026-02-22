package com.cortex.assistant.application.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * PromptEnhancer
 * 
 * Enhances user prompts with system instructions to ensure better formatted LLM
 * responses.
 * This service prepends formatting rules to user prompts to guide the LLM
 * in producing properly structured markdown output.
 */
@Service
public class PromptEnhancer {

    private static final Logger logger = LoggerFactory.getLogger(PromptEnhancer.class);

    private static final String SYSTEM_PROMPT = """
            You are Cortex, an intelligent general-purpose AI assistant designed and developed by Anurag Handique.
            Your goal is to be helpful, concise, and direct.

            BEHAVIOR RULES:
            1. Do NOT generate code snippets unless the user EXPLICITLY asks for code or technical implementation details.
            2. For general questions (e.g., "Who are you?", "What can you do?"), answer in plain natural language.
            3. Do not offer code examples "just to show off".

            FORMATTING RULES (Only apply if code is requested):
            1. Use SINGLE BACKTICKS (`name`) for single words, identifiers, variables, or functions when they are part of a sentence.
            2. Use TRIPLE BACKTICKS (```language) ONLY for multi-line code snippets or full functions.
            3. ALWAYS include a language tag (e.g., ```java, ```python) in triple-backtick blocks.
            4. Keep explanations, symbols, and punctuation (commas, periods) OUTSIDE of any backticks.
            5. Separate code blocks from explanations with double newlines.
            6. Use numbered lists (1. 2. 3.) for steps and bullet points (-) for items.

            Provide clear, professional responses with proper formatting.
            """;

    /**
     * Enhance a user prompt with system instructions
     * 
     * @param userPrompt Original user prompt
     * @return Enhanced prompt with formatting instructions
     */
    public String enhance(String userPrompt) {
        if (userPrompt == null || userPrompt.isEmpty()) {
            logger.warn("Attempted to enhance null or empty prompt");
            return userPrompt;
        }

        String enhanced = SYSTEM_PROMPT + "User: " + userPrompt;

        logger.debug("Enhanced prompt from {} to {} characters",
                userPrompt.length(), enhanced.length());

        return enhanced;
    }

    /**
     * Enhance a user prompt with custom system instructions
     * 
     * @param userPrompt         Original user prompt
     * @param customSystemPrompt Custom system prompt to use
     * @return Enhanced prompt
     */
    public String enhanceWithCustom(String userPrompt, String customSystemPrompt) {
        if (userPrompt == null || userPrompt.isEmpty()) {
            return userPrompt;
        }

        if (customSystemPrompt == null || customSystemPrompt.isEmpty()) {
            return enhance(userPrompt);
        }

        return customSystemPrompt + "\n\nUser: " + userPrompt;
    }

    /**
     * Check if a prompt has already been enhanced
     * 
     * @param prompt Prompt to check
     * @return true if prompt contains system instructions
     */
    public boolean isEnhanced(String prompt) {
        return prompt != null && prompt.contains("FORMATTING RULES");
    }
}
