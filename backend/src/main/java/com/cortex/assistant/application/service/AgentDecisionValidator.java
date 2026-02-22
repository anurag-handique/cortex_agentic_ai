package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.AgentDecision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AgentDecisionValidator {

    private static final Logger logger = LoggerFactory.getLogger(AgentDecisionValidator.class);

    private final ObjectMapper objectMapper;

    public AgentDecisionValidator() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Validates if the given JSON string conforms to the AgentDecision schema
     * 
     * @param jsonString The JSON string to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidAgentDecision(String jsonString) {
        try {
            // Handle null or empty input
            if (jsonString == null || jsonString.isEmpty()) {
                logger.warn("Empty or null JSON string provided for validation");
                return false;
            }

            JsonNode jsonNode = objectMapper.readTree(jsonString);

            // Check required fields
            if (!jsonNode.has("intent") || !jsonNode.has("risk") ||
                    !jsonNode.has("thought") || !jsonNode.has("action") ||
                    !jsonNode.has("toolName") ||
                    !jsonNode.has("confidence") || !jsonNode.has("input") ||
                    !jsonNode.has("reasoningSteps")) {
                logger.warn("Missing required fields in agent decision JSON");
                return false;
            }

            // Validate intent field (should be string)
            if (!jsonNode.get("intent").isTextual()
            ) {
                logger.warn("Invalid intent field type");
                return false;
            }

            // Validate risk field (should be string)
            if (!jsonNode.get("risk").isTextual()
            ) {
                logger.warn("Invalid risk field type");
                return false;
            }

            // Validate thought field (should be string)
            if (!jsonNode.get("thought").isTextual()
            ) {
                logger.warn("Invalid thought field type");
                return false;
            }

            // Validate action field (should be string)
            if (!jsonNode.get("action").isTextual()
            ) {
                logger.warn("Invalid action field type");
                return false;
            }

            // Validate toolName field (should be string or null)
            if (!jsonNode.get("toolName").isTextual()
                    && !jsonNode.get("toolName").isNull()) {
                logger.warn("Invalid toolName field type");
                return false;
            }

            // Validate confidence field (should be one of: low, medium, high)
            String confidence = jsonNode.get("confidence").asText();
            if (!("low".equals(confidence) || "medium".equals(confidence) || "high".equals(confidence))) {
                logger.warn("Invalid confidence value: {}", confidence);
                return false;
            }

            // Validate input field (should be string)
            if (!jsonNode.get("input").isTextual()
            ) {
                logger.warn("Invalid input field type");
                return false;
            }

            // Validate reasoningSteps field (should be array)
            if (!jsonNode.get("reasoningSteps").isArray()) {
                logger.warn("Invalid reasoningSteps field type");
                return false;
            }

            // Additional validation: Check for empty thought
            if (jsonNode.get("thought").asText().trim().isEmpty()) {
                logger.warn("Thought field is empty");
                return false;
            }

            return true;
        } catch (Exception e) {
            logger.error("Error validating agent decision JSON: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Parses and validates a JSON string into an AgentDecision object
     * 
     * @param jsonString The JSON string to parse
     * @return The parsed AgentDecision object, or null if invalid
     */
    public AgentDecision parseAgentDecision(String jsonString) {
        try {
            if (jsonString == null || jsonString.isEmpty()) {
                return null;
            }

            // Attempt to fix missing fields before strict validation/parsing
            JsonNode jsonNode = objectMapper.readTree(jsonString);
            boolean modified = false;

            if (jsonNode instanceof ObjectNode) {
               ObjectNode objectNode = (ObjectNode) jsonNode;

                if (!objectNode.has("intent")) {
                    objectNode.put("intent", "question");
                    modified = true;
                }
                if (!objectNode.has("risk")) {
                    objectNode.put("risk", "none");
                    modified = true;
                }
                if (!objectNode.has("thought")) {
                    objectNode.put("thought", "Processed request");
                    modified = true;
                }
                if (!objectNode.has("action")) {
                    objectNode.put("action", "respond");
                    modified = true;
                }
                if (!objectNode.has("toolName")) {
                    objectNode.putNull("toolName");
                    modified = true;
                }
                if (!objectNode.has("confidence")) {
                    objectNode.put("confidence", "high");
                    modified = true;
                }
                if (!objectNode.has("input")) {
                    objectNode.put("input", "");
                    modified = true;
                }
                if (!objectNode.has("reasoningSteps")) {
                    objectNode.putArray("reasoningSteps");
                    modified = true;
                }
            }

            String finalJson = modified ? objectMapper.writeValueAsString(jsonNode) : jsonString;

            if (isValidAgentDecision(finalJson)) {
                return objectMapper.readValue(finalJson, AgentDecision.class);
            } else {
                logger.error("JSON validation failed even after attempt to fix: {}", finalJson);
                return null;
            }
        } catch (Exception e) {
            // Last ditch effort: Try to find ANY brace if we failed
            if (jsonString != null && jsonString.contains("{")) {
                try {
                    int start = jsonString.indexOf('{');
                    int end = jsonString.lastIndexOf('}');
                    if (start >= 0 && end > start) {
                        String sanitised = jsonString.substring(start, end + 1);
                        if (!sanitised.equals(jsonString)) {
                            return parseAgentDecision(sanitised); // Recursive retry with sanitized string
                        }
                    }
                } catch (Exception ex) {
                    // Ignore
                }
            }

            logger.error("Error parsing agent decision JSON: {} | Input: {}", e.getMessage(), jsonString);
            return null;
        }
    }
}