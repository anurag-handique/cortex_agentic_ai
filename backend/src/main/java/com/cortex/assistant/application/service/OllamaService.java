package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.OllamaRequest;
import com.cortex.assistant.domain.model.OllamaResponse;

import java.io.IOException;
import java.util.function.BiConsumer;

public interface OllamaService {
    OllamaResponse generateText(OllamaRequest request);

    void streamText(OllamaRequest request, BiConsumer<String, String> onResponse) throws IOException;
}