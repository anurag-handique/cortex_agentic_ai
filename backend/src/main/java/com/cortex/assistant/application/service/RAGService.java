package com.cortex.assistant.application.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Service
public class RAGService {

    private static final Logger logger = LoggerFactory.getLogger(RAGService.class);
    private final VectorStore vectorStore;

    public RAGService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * Ingests a raw text content into the vector store.
     * Note: In a production environment, you should use a TextSplitter (e.g.,
     * TokenTextSplitter)
     * to chunk large documents before ingestion.
     */
    public void ingest(String content, Map<String, Object> metadata) {
        logger.info("Ingesting document with metadata: {}", metadata);
        // Create a document from the content
        Document document = new Document(content, metadata);
        // Add to vector store (embeddings are generated automatically)
        vectorStore.add(List.of(document));
        logger.info("Ingestion complete.");
    }

    /**
     * Searches for similar documents in the vector store.
     * 
     * @param query The search query.
     * @return List of relevant documents.
     */
    public List<Document> search(String query) {
        logger.info("Searching for: {}", query);
        List<Document> results = vectorStore.similaritySearch(SearchRequest.query(query).withTopK(5));
        logger.info("Found {} results", results.size());
        return results;
    }
}
