package com.cortex.assistant.infrastructure.client;

import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.domain.model.OllamaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.function.Consumer;

@Component
public class OllamaClient {

    private static final Logger logger = LoggerFactory.getLogger(OllamaClient.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String OLLAMA_BASE_URL;

    public OllamaClient(@Value("${ollama.api.url}") String ollamaBaseUrl) {
        this.OLLAMA_BASE_URL = ollamaBaseUrl;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        // Configure timeouts for better performance
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 seconds
        factory.setReadTimeout(120000); // 2 minutes for read timeout
        this.restTemplate.setRequestFactory(factory);
    }

    public OllamaResponse generateText(OllamaRequest request) {
        logger.info("Calling Ollama generate API with model: {}", request.getModel());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<OllamaResponse> response = restTemplate.postForEntity(OLLAMA_BASE_URL, entity,
                OllamaResponse.class);
        logger.info("Received response from Ollama API with status: {}", response.getStatusCode());
        return response.getBody();
    }

    public void streamText(OllamaRequest request, Consumer<String> onResponse) {
        logger.info("Calling Ollama stream API with model: {}", request.getModel());
        // Set stream to true for streaming responses
        request.setStream(true);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.execute(OLLAMA_BASE_URL, org.springframework.http.HttpMethod.POST, httpRequest -> {
                httpRequest.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                httpRequest.getBody().write(objectMapper.writeValueAsBytes(request));
            }, new ResponseExtractor<Void>() {
                @Override
                public Void extractData(ClientHttpResponse response) throws IOException {
                    logger.info("Received streaming response from Ollama API with status: {}",
                            response.getStatusCode());
                    try (InputStream inputStream = response.getBody()) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (!line.isEmpty()) {
                                try {
                                    JsonNode jsonNode = objectMapper.readTree(line);
                                    if (jsonNode.has("response")) {
                                        String responseText = jsonNode.get("response").asText();
                                        onResponse.accept(responseText);
                                    }
                                    // Check if this is the final response
                                    if (jsonNode.has("done") && jsonNode.get("done").asBoolean()) {
                                        break;
                                    }
                                } catch (Exception e) {
                                    logger.warn("Error parsing JSON line: {}", e.getMessage());
                                    // Ignore parsing errors for individual lines
                                }
                            }
                        }
                    }
                    return null;
                }
            });
            logger.info("Finished streaming response from Ollama API");
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("Timeout occurred while streaming from Ollama API: {}", e.getMessage(), e);
            throw e; // Re-throw to let the service layer handle it
        } catch (Exception e) {
            logger.error("Error during streaming from Ollama API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to stream from Ollama API", e);
        }
    }
}