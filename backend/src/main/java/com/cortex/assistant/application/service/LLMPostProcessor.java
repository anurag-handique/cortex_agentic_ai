package com.cortex.assistant.application.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LLMPostProcessor
 * 
 * Post-processes LLM responses.
 * CRITICAL: processChunk must NOT modify structural elements like fences (```)
 * as chunks are incomplete fragments. Structural fixes only happen in
 * processCompleteResponse.
 */
@Service
public class LLMPostProcessor {

    private static final Logger logger = LoggerFactory.getLogger(LLMPostProcessor.class);

    private static final Pattern[] PROSE_PATTERNS = {
            Pattern.compile("^(This|The|To|When|You|After|Here|Let|First|Second)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("^\\d+\\.\\s+[A-Z]"),
            Pattern.compile("^-\\s+[A-Z]"),
            Pattern.compile("\\bdefines a\\b"),
            Pattern.compile("\\bTo compile\\b"),
            Pattern.compile("\\bshould see\\b"),
            Pattern.compile("\\bthe following\\b")
    };

    /**
     * Process a chunk of text from the LLM stream.
     * MUST return the chunk almost exactly as-is to avoid breaking streaming
     * structures.
     */
    public String processChunk(String chunk) {
        if (chunk == null)
            return "";
        // No structural modification here! Structural markers (```) might be split
        // across chunks (e.g. Chunk 1: '`', Chunk 2: '`', Chunk 3: '`').
        // Modifying them here would corrupt the stream.
        return chunk;
    }

    /**
     * Process complete response.
     */
    public String processCompleteResponse(String response) {
        if (response == null || response.isEmpty()) {
            return response;
        }

        try {
            String processed = response;
            processed = fixUnclosedCodeBlocks(processed);
            processed = formatCodeBlocks(processed);
            processed = separateProseFromCode(processed);
            processed = ensureProperSpacing(processed);
            return processed;
        } catch (Exception e) {
            logger.error("Error post-processing response: {}", e.getMessage(), e);
            return response;
        }
    }

    private String fixUnclosedCodeBlocks(String text) {
        // Only run on complete responses
        int backtickCount = 0;
        Pattern p = Pattern.compile("```");
        Matcher m = p.matcher(text);
        while (m.find())
            backtickCount++;

        if (backtickCount % 2 != 0) {
            return text + "\n```";
        }
        return text;
    }

    private boolean looksLikeProse(String line) {
        for (Pattern pattern : PROSE_PATTERNS) {
            if (pattern.matcher(line).find()) {
                return true;
            }
        }
        return false;
    }

    private String formatCodeBlocks(String text) {
        // DISABLING aggressive code reformatting.
        // It was breaking Python indentation and whitespace.
        // Modern LLMs format code well enough on their own.
        return text;
    }

    private String separateProseFromCode(String text) {
        // Only ensure spacing *around* the blocks, not inside.
        return text.replaceAll("([^\n])(```[a-zA-Z]{0,15})", "$1\n\n$2")
                .replaceAll("(```)\\n([^\n])", "$1\n\n$2");
    }

    private String ensureProperSpacing(String text) {
        if (text == null)
            return "";
        // Don't mess with spacing inside ``` code blocks
        if (!text.contains("```")) {
            return applyProseSpacing(text);
        }

        StringBuilder result = new StringBuilder();
        // Split but keep delimiters
        String[] parts = text.split("(?=```)|(?<=```)");
        boolean inCode = false;

        for (String part : parts) {
            String trimmedPart = part;

            // Check if this part toggles the state (it's a fence)
            if (trimmedPart.trim().startsWith("```")) {
                inCode = !inCode;
                result.append(part);
            } else if (inCode) {
                // CODE BLOCK CONTENT: Preserve exact formatting!
                // Do absolutely no regex replacement here.
                result.append(part);
            } else {
                // PROSE CONTENT: Apply spacing rules
                result.append(applyProseSpacing(part));
            }
        }
        return result.toString();
    }

    private String applyProseSpacing(String text) {
        if (text == null)
            return "";
        return text
                // Ensure at least one newline before a numbered list item
                .replaceAll("(?m)^(?<!\\n)(\\d+\\.)", "\n$1")
                // Ensure at least one newline before a bullet point
                .replaceAll("(?m)^(?<!\\n)([-*+]\\s)", "\n$1")
                // Collapse 3+ newlines into 2
                .replaceAll("\\n{3,}", "\n\n");
    }

}
