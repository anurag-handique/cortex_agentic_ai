package com.cortex.assistant.application.service.impl;

import com.cortex.assistant.agent.core.FastPathRouter;
import com.cortex.assistant.application.service.AgentDecisionValidator;
import com.cortex.assistant.application.service.AgentService;
import com.cortex.assistant.application.service.ContextService;
import com.cortex.assistant.application.service.StreamingDecisionCollector;
import com.cortex.assistant.domain.model.AgentDecision;
import com.cortex.assistant.domain.model.UserRequest;
import com.cortex.assistant.infrastructure.client.OllamaClient;
import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.application.service.TitleGeneratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.PrintWriter;

@Service
public class AgentServiceImpl implements AgentService {

    private static final Logger logger = LoggerFactory.getLogger(AgentServiceImpl.class);

    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper;
    private final AgentDecisionValidator decisionValidator;
    private final StreamingDecisionCollector streamingCollector;
    private final com.cortex.assistant.agent.tools.ToolRegistry toolRegistry;
    private final FastPathRouter fastPathRouter;
    private final ContextService contextService;
    private final TitleGeneratorService titleGeneratorService;
    private final com.cortex.assistant.application.service.RAGService ragService;

    public AgentServiceImpl(OllamaClient ollamaClient, AgentDecisionValidator decisionValidator,
            StreamingDecisionCollector streamingCollector,
            com.cortex.assistant.agent.tools.ToolRegistry toolRegistry,
            FastPathRouter fastPathRouter,
            ContextService contextService,
            TitleGeneratorService titleGeneratorService,
            com.cortex.assistant.application.service.RAGService ragService) {
        this.ollamaClient = ollamaClient;
        this.objectMapper = new ObjectMapper();
        this.decisionValidator = decisionValidator;
        this.streamingCollector = streamingCollector;
        this.toolRegistry = toolRegistry;
        this.fastPathRouter = fastPathRouter;
        this.contextService = contextService;
        this.titleGeneratorService = titleGeneratorService;
        this.ragService = ragService;
    }

    @Override
    public AgentDecision makeDecision(UserRequest request) {
        logger.info("Making decision for user request: {}", request.getInput());

        // 0. Persistence: Save user message if session exists
        if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            contextService.getOrCreateSession(request.getSessionId(),
                    com.cortex.assistant.domain.model.SessionType.TASK);
            contextService.saveUserMessage(request.getSessionId(), request.getInput());
        }

        // 1. FAST PATH: Check if we can decide without the LLM
        AgentDecision fastDecision = fastPathRouter.route(request.getInput());
        if (fastDecision != null) {
            logger.info("Fast Path hit! Skipping LLM inference.");
            return fastDecision;
        }

        // 2. SLOW PATH: Create prompt and ask LLM
        String systemPrompt = createSystemPrompt();

        // 3. INJECT CONTEXT: Add conversation history if session exists
        String contextPrompt = "";
        String ragContext = "";
        if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            contextPrompt = contextService.buildContextPrompt(request.getSessionId());

            // RAG Search
            try {
                var docs = ragService.search(request.getInput());
                if (!docs.isEmpty()) {
                    StringBuilder sb = new StringBuilder("\n\n=== RELEVANT KNOWLEDGE (from memory) ===\n");
                    for (var doc : docs) {
                        sb.append(doc.getContent()).append("\n---\n");
                    }
                    sb.append("=== END KNOWLEDGE ===\n");
                    ragContext = sb.toString();
                }
            } catch (Exception e) {
                logger.warn("RAG search failed: {}", e.getMessage());
            }
        }

        String fullPrompt = systemPrompt + contextPrompt + ragContext + "\n\nUser Input: " + request.getInput();

        OllamaRequest ollamaRequest = new OllamaRequest("mistral", fullPrompt);
        ollamaRequest.setStream(false);

        try {
            String rawResponse = ollamaClient.generateText(ollamaRequest).getResponse();
            String jsonDecision = extractJsonFromResponse(rawResponse);

            AgentDecision decision = decisionValidator.parseAgentDecision(jsonDecision);
            if (decision == null) {
                throw new RuntimeException("Invalid agent decision JSON: " + jsonDecision);
            }

            // Generate title synchronously
            if (request.getSessionId() != null) {
                String title = titleGeneratorService.generateTitle(request.getSessionId(), request.getInput());
                decision.setTitle(title);
            }

            return decision;
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("Timeout occurred while communicating with Ollama API: {}", e.getMessage(), e);
            return new AgentDecision("ambiguous", "none", "Request timed out.", "none", null, "low", "",
                    java.util.Collections.singletonList("Connection timed out"));
        } catch (Exception e) {
            logger.error("Error making decision: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to make agent decision", e);
        }
    }

    @Override
    public void streamDecision(UserRequest request, HttpServletResponse response) throws IOException {
        logger.info("Streaming decision for user request: {}", request.getInput());

        response.setContentType("text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");

        PrintWriter writer = response.getWriter();

        // 0. Persistence: Save user message if session exists
        if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            contextService.getOrCreateSession(request.getSessionId(),
                    com.cortex.assistant.domain.model.SessionType.TASK);
            contextService.saveUserMessage(request.getSessionId(), request.getInput());
        }

        // Check Fast Path for streaming too
        AgentDecision fastDecision = fastPathRouter.route(request.getInput());
        if (fastDecision != null) {
            try {
                // Simulate streaming for UX consistency
                writer.write("data: " + objectMapper.writeValueAsString(fastDecision) + "\n\n");
                writer.flush();
                logger.info("Fast Path hit for streaming.");
                return;
            } catch (Exception e) {
                logger.error("Error writing fast path to stream", e);
            } finally {
                writer.close();
            }
            return;
        }

        String systemPrompt = createSystemPrompt();

        // INJECT CONTEXT: Add conversation history if session exists
        String contextPrompt = "";
        String ragContext = "";
        if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            contextPrompt = contextService.buildContextPrompt(request.getSessionId());

            // RAG Search
            try {
                var docs = ragService.search(request.getInput());
                if (!docs.isEmpty()) {
                    StringBuilder sb = new StringBuilder("\n\n=== RELEVANT KNOWLEDGE (from memory) ===\n");
                    for (var doc : docs) {
                        sb.append(doc.getContent()).append("\n---\n");
                    }
                    sb.append("=== END KNOWLEDGE ===\n");
                    ragContext = sb.toString();
                }
            } catch (Exception e) {
                logger.warn("RAG search failed: {}", e.getMessage());
            }
        }

        String fullPrompt = systemPrompt + contextPrompt + ragContext + "\n\nUser Input: " + request.getInput();

        OllamaRequest ollamaRequest = new OllamaRequest("mistral", fullPrompt);
        ollamaRequest.setStream(true);

        try {
            ollamaClient.streamText(ollamaRequest,
                    streamingCollector.createStreamingHandler(chunk -> {
                        try {
                            writer.write("data: " + chunk + "\n\n");
                            writer.flush();
                        } catch (Exception e) {
                            logger.error("Error writing to response stream: {}", e.getMessage(), e);
                        }
                    }));
            logger.info("Successfully streamed decision response");
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("Timeout streaming from Ollama: {}", e.getMessage());
            writer.write("data: {\"error\": \"Timeout\"}\n\n");
        } catch (Exception e) {
            logger.error("Error streaming decision: {}", e.getMessage(), e);
            writer.write("data: {\"error\": \"" + e.getMessage() + "\"}\n\n");
        } catch (Throwable t) {
            logger.error("Unexpected error streaming decision: {}", t.getMessage(), t);
            writer.write("data: {\"error\": \"Internal Agent Error\"}\n\n");
        } finally {
            writer.close();
        }
    }

    @Override
    public AgentDecision interpretResult(String sessionId, String originalRequest,
            com.cortex.assistant.agent.tools.ToolResponse toolResponse) {

        logger.info("Interpreting tool result for: {}", toolResponse.getTool());

        String systemPrompt = createInterpretationPrompt();

        String toolOutputJson;
        try {
            toolOutputJson = objectMapper.writeValueAsString(toolResponse);
            if (toolOutputJson.length() > 8000) { // Reduced limit for speed
                toolOutputJson = toolOutputJson.substring(0, 8000) + "... [Truncated]";
            }
        } catch (Exception e) {
            toolOutputJson = "Error serializing tool response: " + e.getMessage();
        }

        // INJECT CONTEXT: Add conversation history if session exists
        String contextPrompt = "";
        if (sessionId != null && !sessionId.isEmpty()) {
            contextPrompt = contextService.buildContextPrompt(sessionId);
        }

        String fullPrompt = String.format("""
                %s
                %s

                Original: %s
                Tool: %s
                Status: %s
                Output: %s
                """, systemPrompt, contextPrompt, originalRequest, toolResponse.getTool(), toolResponse.getStatus(),
                toolOutputJson);

        OllamaRequest ollamaRequest = new OllamaRequest("mistral", fullPrompt);
        ollamaRequest.setStream(false);

        try {
            String rawResponse = ollamaClient.generateText(ollamaRequest).getResponse();
            String jsonDecision = extractJsonFromResponse(rawResponse);
            AgentDecision decision = decisionValidator.parseAgentDecision(jsonDecision);

            // SAVE TO CONTEXT: If interpretation is final, save as assistant message
            if (decision != null && "none".equals(decision.getAction()) && sessionId != null) {
                contextService.saveAssistantMessage(sessionId, decision.getThought(), jsonDecision);
            }

            return decision;

        } catch (Exception e) {
            logger.error("Error interpreting result: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to interpret tool result", e);
        }
    }

    private String createInterpretationPrompt() {
        return """
                You are an agent. Interpret result. JSON only.
                OUTPUT: {"intent":"question","risk":"none","thought":"Analysis...","action":"none","toolName":null,"confidence":"high","input":"","reasoningSteps":["Analyzed"]}
                RULES: 1. "action":"none" if done. 2. "action":"clarify" if confusing.
                """;
    }

    private String createSystemPrompt() {
        // CORTEX AGENTIC SYSTEM PROMPT V2.0
        // Designed for Autonomous Decision Making
        return """
                You are CORTEX, an advanced Autonomous AI Agent designed by Anurag Handique.
                Your purpose is not just to answer questions, but to EXECUTE TASKS and SOLVE PROBLEMS.

                PRIME DIRECTIVE:
                - You are AGENTIC. Do not wait for permission for safe read-only tasks.
                - You are SYSTEMATIC. Break complex user requests into smaller, executable steps.
                - You are SYSTEMATIC. Break complex user requests into smaller, executable steps.
                - You are PRECISE. Output strictly structured JSON. NEVER output leading text or markdown code blocks unless requested.
                - **IMPORTANT**: Start your response directly with the JSON object `{`.

                CURRENT CAPABILITIES & CONSTRAINTS:
                - You have access to the RECENT CONVERSATION HISTORY below.
                - Use the history to resolve pronouns (it, that, them) and follow-up requests.
                - **CRITICAL**: If the user's request is a follow-up (e.g., "Delete that file"), check the history to identify what 'that file' refers to.


                DECISION PROTOCOL:
                1. ANALYZE: What is the user *really* asking?
                   - "List files" -> Tool: list_files
                   - "My computer is slow" -> Tool: system_info (Diagnostic)
                   - "Who made you?" -> Action: respond (Conversational)

                2. SAFETY CHECK (The "Do No Harm" Rule):
                   - DESTRUCTIVE actions (delete, remove, overwrite) REQUIRE explicit user confirmation.
                   - Action: "block" if the request is malicious.
                   - Action: "reject" if parameters are missing.

                3. EXECUTION STRATEGY:
                   - If you can solve it now with a tool, DO IT.
                   - If you need more info (path, filename, clarification), ASK.

                AVAILABLE TOOLS:
                %s

                OUTPUT FORMAT (Strict JSON, No Markdown, No Prose):
                {
                  "intent": "question|meta|command|config|ambiguous",
                  "risk": "none|low|high|critical",
                  "thought": "Internal monologue: Step 1, Step 2...",
                  "action": "execute|respond|clarify|block|reject",
                  "toolName": "exact_tool_name_or_null",
                  "confidence": "high|medium|low",
                  "input": "json_string_for_tool_arguments_or_empty_string",
                  "reasoningSteps": ["Analyzed input", "Checked safety", "Selected tool"]
                }

                EXAMPLES:
                User: "Check my ram usage"
                JSON: {"intent":"command","risk":"none","thought":"User wants system diagnostics","action":"execute","toolName":"system_info","confidence":"high","input":"{}","reasoningSteps":["Identified intent","Mapped to system_info"]}

                User: "Delete the project folder"
                JSON: {"intent":"command","risk":"high","thought":"Destructive action on vague target","action":"clarify","toolName":null,"confidence":"medium","input":"Which specific folder path would you like me to delete?","reasoningSteps":["Safety Check: High Risk","Ambiguous Target","Requesting Clarification"]}

                BEGIN CORTEX DECISION LOGIC.
                """
                .formatted(toolRegistry.getToolSummaries());
    }

    private String extractJsonFromResponse(String response) {
        if (response == null || response.isEmpty())
            return "{}";

        // 1. Try to find markdown block first
        int codeBlockStart = response.indexOf("```json");
        if (codeBlockStart != -1) {
            int start = response.indexOf('{', codeBlockStart);
            int end = response.lastIndexOf('}');
            if (start != -1 && end > start) {
                return response.substring(start, end + 1);
            }
        }

        // 2. Fallback to standard brace finding
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        // 3. Fallback: If no braces, return empty object (validator will handle it)
        return "{}";
    }
}
