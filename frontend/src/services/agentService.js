import { getSessionId, getTaskSessionId } from '../utils/sessionManager';
import api from '../utils/api';

/**
 * Service to handle agent decision streaming.
 */
export const streamAgentDecision = async ({ input, onChunk, onComplete, onError, signal }) => {
    try {
        const sessionId = getTaskSessionId();
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/agent/decide/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                input,
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
        let streamBuffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            streamBuffer += decoder.decode(value, { stream: true });

            // Process all complete SSE messages in the buffer
            // SSE messages are separated by double newlines
            let boundary = streamBuffer.indexOf('\n\n');
            while (boundary !== -1) {
                const message = streamBuffer.slice(0, boundary);
                streamBuffer = streamBuffer.slice(boundary + 2);

                // Process each line in the message (standard SSE can have multiple data lines)
                const lines = message.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        // Crucial: only remove the "data:" and the first space if it exists
                        // data:  <- two spaces mean one space follows the message
                        const dataValue = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
                        fullResponse += dataValue;
                    }
                }

                // After appending new data, try to extract and parse the JSON
                const jsonCandidate = extractJson(fullResponse);
                if (jsonCandidate) {
                    try {
                        const parsed = JSON.parse(jsonCandidate);
                        onChunk(parsed);
                    } catch (e) {
                        // Part of the JSON might still be incomplete/invalid
                    }
                }

                boundary = streamBuffer.indexOf('\n\n');
            }
        }
        onComplete?.();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Stream aborted');
        } else {
            console.error('Agent decision streaming error:', error);
            onError?.(error);
        }
    }
};

/**
 * Robustly extracts the FIRST balanced JSON object from a string.
 */
const extractJson = (str) => {
    const firstBrace = str.indexOf('{');
    if (firstBrace === -1) return null;

    let braceCount = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < str.length; i++) {
        const char = str[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;

            if (braceCount === 0) {
                return str.substring(firstBrace, i + 1);
            }
        }
    }

    return null;
};

/**
 * Executes a tool after user confirmation.
 */
export const confirmExecuteTool = async (toolName, input) => {
    const sessionId = getTaskSessionId();
    let parsedInput = input;
    if (typeof input === 'string') {
        try {
            parsedInput = JSON.parse(input);
        } catch (e) {
            parsedInput = input;
        }
    }

    const response = await api.post('/api/v1/agent/tools/execute', {
        toolName,
        input: parsedInput,
        sessionId
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Execution failed: ${response.status}`);
    }
    return response.json();
};

/**
 * Feeds tool results back to the agent for interpretation.
 */
export const interpretToolResult = async (originalRequest, toolResponse) => {
    const sessionId = getTaskSessionId();
    const response = await api.post('/api/v1/agent/interpret', {
        sessionId,
        originalRequest,
        toolResponse
    });


    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Interpretation failed: ${response.status}`);
    }
    return response.json();
};
