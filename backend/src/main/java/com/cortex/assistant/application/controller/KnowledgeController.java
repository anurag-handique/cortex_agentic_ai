package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.service.RAGService;
import org.springframework.ai.document.Document;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final RAGService ragService;

    public KnowledgeController(RAGService ragService) {
        this.ragService = ragService;
    }

    @PostMapping("/ingest")
    public ResponseEntity<String> ingest(@RequestBody Map<String, Object> payload) {
        String content = (String) payload.get("content");
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = (Map<String, Object>) payload.getOrDefault("metadata", Map.of());

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        ragService.ingest(content, metadata);
        return ResponseEntity.ok("Ingested successfully");
    }

    @GetMapping("/search")
    public ResponseEntity<List<Document>> search(@RequestParam String query) {
        return ResponseEntity.ok(ragService.search(query));
    }
}
