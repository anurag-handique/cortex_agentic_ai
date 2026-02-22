package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.dto.ApiResponse;
import com.cortex.assistant.application.service.OllamaService;
import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.domain.model.OllamaResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;

@RestController
@RequestMapping("/api/v1/ollama")
public class OllamaController {

    private static final Logger logger = LoggerFactory.getLogger(OllamaController.class);

    private final OllamaService ollamaService;

    public OllamaController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/generate")
    public ApiResponse<OllamaResponse> generateText(@RequestBody OllamaRequest request) {
        logger.info("Received request to generate text with model: {}", request.getModel());
        try {
            OllamaResponse response = ollamaService.generateText(request);
            logger.info("Successfully generated text response");
            return new ApiResponse<>(true, "Success", response);
        } catch (Exception e) {
            logger.error("Error generating text: {}", e.getMessage(), e);
            return new ApiResponse<>(false, e.getMessage(), "OLLAMA_SERVICE_ERROR", null);
        }
    }

    @PostMapping("/stream")
    public void streamText(@RequestBody OllamaRequest request, HttpServletResponse response) throws IOException {
        logger.info("Received request to stream text with model: {}", request.getModel());
        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

        PrintWriter writer = response.getWriter();

        try {
            ollamaService.streamText(request, (responseText, title) -> {
                try {
                    // Create structured JSON response
                    String jsonResponse = createStructuredChunk(responseText, title);
                    writer.write("data: " + jsonResponse + "\n\n");
                    writer.flush();
                } catch (Exception e) {
                    logger.error("Error writing to response stream: {}", e.getMessage(), e);
                }
            });

            // Send completion event
            String completionEvent = "{\"type\": \"done\", \"message\": \"Stream complete\"}";
            writer.write("data: " + completionEvent + "\n\n");
            writer.flush();

            logger.info("Successfully streamed text response");
        } catch (Exception e) {
            logger.error("Error streaming text: {}", e.getMessage(), e);
            String errorResponse = String.format(
                    "{\"type\": \"error\", \"error\": \"%s\"}",
                    escapeJson(e.getMessage()));
            writer.write("data: " + errorResponse + "\n\n");
        } finally {
            writer.close();
        }
    }

    /**
     * Create a structured JSON chunk for streaming.
     * We now send everything as type "content" because structural markers (```)
     * can be split across multiple chunks, making reliable type detection
     * impossible here.
     */
    private String createStructuredChunk(String content, String title) {
        if (content == null)
            return "{\"type\": \"content\", \"content\": \"\"}";

        if (title != null) {
            return String.format("{\"type\": \"content\", \"content\": \"%s\", \"title\": \"%s\"}", escapeJson(content),
                    escapeJson(title));
        }
        return String.format("{\"type\": \"content\", \"content\": \"%s\"}", escapeJson(content));
    }

    /**
     * Escape special characters for JSON
     */
    private String escapeJson(String text) {
        if (text == null)
            return "";

        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}