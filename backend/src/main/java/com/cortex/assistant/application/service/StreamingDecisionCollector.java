package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.AgentDecision;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

@Service
public class StreamingDecisionCollector {
    
    private static final Logger logger = LoggerFactory.getLogger(StreamingDecisionCollector.class);
    
    private final ObjectMapper objectMapper;
    private final AgentDecisionValidator decisionValidator;
    
    public StreamingDecisionCollector(AgentDecisionValidator decisionValidator) {
        this.objectMapper = new ObjectMapper();
        this.decisionValidator = decisionValidator;
    }
    
    /**
     * Collects streaming responses and extracts the final JSON decision
     * @param onResponse A consumer that handles each chunk of the streaming response
     * @return A CompletableFuture that completes with the final AgentDecision
     */
    public CompletableFuture<AgentDecision> collectDecision(Consumer<String> onResponse) {
        StringBuilder responseBuffer = new StringBuilder();
        CompletableFuture<AgentDecision> decisionFuture = new CompletableFuture<>();
        
        // Process the streaming response in real-time
        Consumer<String> streamingHandler = createStreamingHandler(chunk -> {
            responseBuffer.append(chunk);
            onResponse.accept(chunk);
            
            // Check if we have a complete JSON object
            String currentBuffer = responseBuffer.toString();
            if (isCompleteJsonObject(currentBuffer)) {
                try {
                    // Extract and validate the JSON decision
                    String jsonDecision = extractJsonFromResponse(currentBuffer);
                    if (decisionValidator.isValidAgentDecision(jsonDecision)) {
                        AgentDecision decision = decisionValidator.parseAgentDecision(jsonDecision);
                        decisionFuture.complete(decision);
                    }
                } catch (Exception e) {
                    logger.error("Error processing complete JSON object: {}", e.getMessage(), e);
                }
            }
        });
        
        // Return the future that will be completed when the JSON is fully received
        return decisionFuture;
    }
    
    /**
     * Creates a streaming response handler that buffers the response and sends chunks to the consumer
     * @param onResponse The consumer to handle each chunk
     * @return A consumer that handles streaming responses
     */
    public Consumer<String> createStreamingHandler(Consumer<String> onResponse) {
        StringBuilder responseBuffer = new StringBuilder();
        
        return responseText -> {
            // Add the response text to our buffer
            responseBuffer.append(responseText);
            
            // Send the chunk to the consumer
            onResponse.accept(responseText);
            
            // Check if we have a complete JSON object
            String currentBuffer = responseBuffer.toString();
            if (isCompleteJsonObject(currentBuffer)) {
                logger.info("Detected complete JSON object in stream");
            }
        };
    }
    
    private String extractJsonFromResponse(String response) {
        // Handle null or empty response
        if (response == null || response.isEmpty()) {
            return "{}";
        }
        
        // Find the first occurrence of '{' and extract everything from there to the last '}'
        int firstBraceIndex = response.indexOf('{');
        if (firstBraceIndex >= 0) {
            // Find the matching closing brace
            int braceCount = 0;
            for (int i = firstBraceIndex; i < response.length(); i++) {
                char c = response.charAt(i);
                if (c == '{') {
                    braceCount++;
                } else if (c == '}') {
                    braceCount--;
                    // If we've closed all open braces, this is the end of our JSON object
                    if (braceCount == 0) {
                        return response.substring(firstBraceIndex, i + 1);
                    }
                }
            }
        }
        // If no valid JSON object found, return empty object
        return "{}";
    }
    
    private boolean isCompleteJsonObject(String jsonString) {
        // Handle null or empty input
        if (jsonString == null || jsonString.isEmpty()) {
            return false;
        }
        
        // Simple check for balanced braces
        int openBraces = 0;
        boolean inString = false;
        char escapeChar = '\\';
        char stringDelimiter = '"';
        
        for (int i = 0; i < jsonString.length(); i++) {
            char c = jsonString.charAt(i);
            
            if (c == escapeChar && inString) {
                // Skip the next character as it's escaped
                i++;
                continue;
            }
            
            if (c == stringDelimiter) {
                inString = !inString;
            } else if (!inString) {
                if (c == '{') {
                    openBraces++;
                } else if (c == '}') {
                    openBraces--;
                    // If we've closed all open braces, we have a complete object
                    if (openBraces == 0 && i == jsonString.length() - 1) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}