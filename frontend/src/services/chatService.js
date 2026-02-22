import { getSessionId } from '../utils/sessionManager';

/**
 * Service to handle chat streaming interactions with structured backend responses.
 * 
 * The backend now returns structured JSON chunks with type information:
 * - {type: "content", content: "text"} - Regular content
 * - {type: "code_start", language: "java", content: "```java"} - Code block start
 * - {type: "code_end", content: "```"} - Code block end
 * - {type: "done", message: "..."} - Stream completion
 * - {type: "error", error: "..."} - Error occurred
 */
export const streamChatResponse = async ({ prompt, onChunk, onComplete, onError, signal }) => {
    try {
        const sessionId = getSessionId();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/ollama/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                model: 'mistral:latest',
                prompt,
                sessionId
            }),
            signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // Stream ended - call completion callback if provided
                onComplete?.();
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            // Keep the last part as the new buffer (it might be incomplete)
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Skip empty lines
                if (!trimmedLine) continue;

                // Parse SSE data lines
                if (line.startsWith('data:')) {
                    let dataValue = line.slice(5).trim();

                    try {
                        // Parse the structured JSON response
                        const data = JSON.parse(dataValue);

                        // Handle different chunk types
                        switch (data.type) {
                            case 'content':
                            case 'code_start':
                            case 'code_end':
                                // Send content to the callback
                                if (data.content) {
                                    onChunk(data.content);
                                }
                                break;

                            case 'done':
                                // Stream completed successfully
                                console.log('Stream complete:', data.message);
                                onComplete?.();
                                return; // Exit the stream

                            case 'error':
                                // Error occurred
                                const error = new Error(data.error || 'Stream error occurred');
                                console.error('Stream error:', error);
                                onError?.(error);
                                throw error;

                            default:
                                // Unknown type - still try to extract content
                                const content = data.content || data.response || data.message?.content;
                                if (content) {
                                    onChunk(content);
                                }
                        }
                    } catch (parseError) {
                        // If JSON parsing fails, treat as raw content (backward compatibility)
                        console.warn('Failed to parse structured response, treating as raw:', dataValue);

                        // Try old format
                        if (dataValue.startsWith('{') && dataValue.endsWith('}')) {
                            try {
                                const legacyData = JSON.parse(dataValue);
                                const content = legacyData.response || legacyData.content || dataValue;
                                onChunk(content);
                            } catch {
                                onChunk(dataValue);
                            }
                        } else {
                            onChunk(dataValue);
                        }
                    }
                }
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            // Stream aborted by user - this is expected behavior
            throw error;
        }
        console.error('Chat streaming error:', error);
        onError?.(error);
        throw error;
    }
};
