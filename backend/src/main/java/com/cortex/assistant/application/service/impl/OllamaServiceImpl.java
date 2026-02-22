package com.cortex.assistant.application.service.impl;

import com.cortex.assistant.application.service.OllamaService;
import com.cortex.assistant.application.service.LLMPostProcessor;
import com.cortex.assistant.application.service.PromptEnhancer;
import com.cortex.assistant.common.exception.BaseException;
import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.domain.model.OllamaResponse;
import com.cortex.assistant.infrastructure.client.OllamaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.function.Consumer;

import com.cortex.assistant.application.service.ContextService;
import com.cortex.assistant.application.service.TitleGeneratorService;

@Service
public class OllamaServiceImpl implements OllamaService {

    private static final Logger logger = LoggerFactory.getLogger(OllamaServiceImpl.class);

    private final OllamaClient ollamaClient;
    private final LLMPostProcessor postProcessor;
    private final PromptEnhancer promptEnhancer;
    private final ContextService contextService;
    private final TitleGeneratorService titleGeneratorService;

    public OllamaServiceImpl(
            OllamaClient ollamaClient,
            LLMPostProcessor postProcessor,
            PromptEnhancer promptEnhancer,
            ContextService contextService,
            TitleGeneratorService titleGeneratorService) {
        this.ollamaClient = ollamaClient;
        this.postProcessor = postProcessor;
        this.promptEnhancer = promptEnhancer;
        this.contextService = contextService;
        this.titleGeneratorService = titleGeneratorService;
    }

    @Override
    public OllamaResponse generateText(OllamaRequest request) {
        logger.info("Generating text with model: {}", request.getModel());

        if (request.getModel() == null || request.getModel().isEmpty()) {
            logger.warn("Generate text called with missing model");
            throw new BaseException("MISSING_MODEL", "Model cannot be null or empty", HttpStatus.BAD_REQUEST.value());
        }

        if (request.getPrompt() == null || request.getPrompt().isEmpty()) {
            logger.warn("Generate text called with missing prompt");
            throw new BaseException("MISSING_PROMPT", "Prompt cannot be null or empty", HttpStatus.BAD_REQUEST.value());
        }

        try {
            // Memory: Handle context if sessionId is present
            String contextPrefix = "";
            String generatedTitle = null;
            if (request.getSessionId() != null) {
                // 1. Save user message
                contextService.getOrCreateSession(request.getSessionId());
                contextService.saveUserMessage(request.getSessionId(), request.getPrompt());

                // Generate title synchronously and save it to the session
                generatedTitle = titleGeneratorService.generateTitle(request.getSessionId(), request.getPrompt());

                // 2. Fetch history
                contextPrefix = contextService.buildContextPrompt(request.getSessionId());
            }

            // Enhance prompt with formatting instructions and context
            String basePrompt = promptEnhancer.enhance(request.getPrompt());
            String finalPrompt = contextPrefix + basePrompt;

            OllamaRequest enhancedRequest = new OllamaRequest(
                    request.getModel(),
                    finalPrompt);
            // We don't pass sessionId to OllamaClient, it doesn't know what to do with it

            logger.debug("Calling Ollama API with enhanced prompt");
            OllamaResponse response = ollamaClient.generateText(enhancedRequest);

            // Post-process response to ensure proper formatting
            String processedResponse = postProcessor.processCompleteResponse(response.getResponse());
            response.setResponse(processedResponse);
            response.setTitle(generatedTitle);

            // Memory: Save AI response
            if (request.getSessionId() != null) {
                contextService.saveAssistantMessage(
                        request.getSessionId(),
                        processedResponse,
                        null // No JSON decision for basic chat
                );
            }

            logger.info("Successfully generated and processed text response");
            return response;
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("Timeout occurred while communicating with Ollama API: {}", e.getMessage(), e);
            throw new BaseException("TIMEOUT_ERROR",
                    "Request to Ollama API timed out. The model may be taking too long to respond.",
                    HttpStatus.REQUEST_TIMEOUT.value());
        } catch (Exception e) {
            logger.error("Error generating text from Ollama API: {}", e.getMessage(), e);
            throw new BaseException("OLLAMA_API_ERROR", "Failed to generate text from Ollama API: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), e);
        }
    }

    @Override
    public void streamText(OllamaRequest request, java.util.function.BiConsumer<String, String> onResponse)
            throws IOException {
        logger.info("Streaming text with model: {}", request.getModel());

        if (request.getModel() == null || request.getModel().isEmpty()) {
            logger.warn("Stream text called with missing model");
            throw new BaseException("MISSING_MODEL", "Model cannot be null or empty", HttpStatus.BAD_REQUEST.value());
        }

        if (request.getPrompt() == null || request.getPrompt().isEmpty()) {
            logger.warn("Stream text called with missing prompt");
            throw new BaseException("MISSING_PROMPT", "Prompt cannot be null or empty", HttpStatus.BAD_REQUEST.value());
        }

        try {
            // Memory: Handle context if sessionId is present
            String contextPrefix = "";
            String generatedTitleLocal = null;
            if (request.getSessionId() != null) {
                // 1. Save user message
                contextService.getOrCreateSession(request.getSessionId());
                contextService.saveUserMessage(request.getSessionId(), request.getPrompt());

                // Generate title
                generatedTitleLocal = titleGeneratorService.generateTitle(request.getSessionId(), request.getPrompt());

                // 2. Fetch history
                contextPrefix = contextService.buildContextPrompt(request.getSessionId());
            }

            // Enhance prompt with formatting instructions
            String basePrompt = promptEnhancer.enhance(request.getPrompt());
            String finalPrompt = contextPrefix + basePrompt;

            OllamaRequest enhancedRequest = new OllamaRequest(
                    request.getModel(),
                    finalPrompt);

            logger.debug("Calling Ollama API for streaming with enhanced prompt");

            StringBuilder fullResponseAccumulator = new StringBuilder();

            // Stream with post-processing on each chunk
            final String finalTitle = generatedTitleLocal;
            ollamaClient.streamText(enhancedRequest, chunk -> {
                String processedChunk = postProcessor.processChunk(chunk);
                fullResponseAccumulator.append(processedChunk);
                onResponse.accept(processedChunk, finalTitle);
            });

            // Memory: Save AI response after stream completes
            if (request.getSessionId() != null) {
                String fullResponse = fullResponseAccumulator.toString();
                if (!fullResponse.isEmpty()) {
                    contextService.saveAssistantMessage(
                            request.getSessionId(),
                            fullResponse,
                            null);
                    logger.debug("Saved streamed response to memory for session {}", request.getSessionId());
                }
            }

            logger.info("Successfully streamed and processed text response");
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("Timeout occurred while streaming from Ollama API: {}", e.getMessage(), e);
            throw new BaseException("STREAM_TIMEOUT_ERROR",
                    "Streaming request to Ollama API timed out. The model may be taking too long to respond.",
                    HttpStatus.REQUEST_TIMEOUT.value());
        } catch (Exception e) {
            logger.error("Error streaming text from Ollama API: {}", e.getMessage(), e);
            throw new BaseException("OLLAMA_STREAM_ERROR", "Failed to stream text from Ollama API: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), e);
        }
    }
}