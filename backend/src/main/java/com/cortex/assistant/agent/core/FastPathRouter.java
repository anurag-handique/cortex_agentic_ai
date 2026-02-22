package com.cortex.assistant.agent.core;

import com.cortex.assistant.domain.model.AgentDecision;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.regex.Pattern;

/**
 * High-performance router to bypass LLM inference for obvious user commands.
 * This "Fast Path" reduces latency from ~3s to <10ms for common tasks.
 */
@Component
public class FastPathRouter {

    // Pre-compiled patterns for performance
    private static final Pattern LIST_FILES_PATTERN = Pattern.compile("(?i)^(list|show|ls|dir)\\s+(all\\s+)?files?.*");
    private static final Pattern SYSTEM_INFO_PATTERN = Pattern
            .compile("(?i)^(get|show|check|what\\s+is)\\s+(my\\s+)?(system|os|machine|platform)\\s+info.*");
    private static final Pattern CLEAR_CONTEXT_PATTERN = Pattern
            .compile("(?i)^(clear|reset)\\s+(chat|context|memory|history).*");

    /**
     * Attempts to resolve a user request using simple heuristics.
     * 
     * @param input The user's natural language input
     * @return An AgentDecision if a fast match is found, otherwise null (fall back
     *         to LLM)
     */
    public AgentDecision route(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String trimmed = input.trim();

        // 1. List Files
        if (LIST_FILES_PATTERN.matcher(trimmed).matches()) {
            return new AgentDecision(
                    "command",
                    "none",
                    "Fast-path matched: explicit request to list files",
                    "execute",
                    "list_files",
                    "high",
                    "{}",
                    Collections.singletonList("Regex Router matched 'list files' pattern"));
        }

        // 2. System Info
        if (SYSTEM_INFO_PATTERN.matcher(trimmed).matches()) {
            return new AgentDecision(
                    "command",
                    "none",
                    "Fast-path matched: explicit request for system info",
                    "execute",
                    "system_info",
                    "high",
                    "{}",
                    Collections.singletonList("Regex Router matched 'system info' pattern"));
        }

        // 3. Clear/Reset (Meta command)
        if (CLEAR_CONTEXT_PATTERN.matcher(trimmed).matches()) {
            return new AgentDecision(
                    "command",
                    "none",
                    "Fast-path matched: reset command",
                    "respond", // Currently we just respond, as we don't have a clear tool yet
                    null,
                    "high",
                    "",
                    Collections.singletonList("Regex Router matched 'reset' pattern"));
        }

        return null; // No match, use the brain
    }
}
