import { useState, useRef, useCallback } from 'react';
import { streamChatResponse } from '../services/chatService';
import { StreamParser } from '../utils/streamParser';

export const useChatStream = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef(null);
    const pendingBufferRef = useRef('');
    const animationFrameRef = useRef(null);
    const streamParserRef = useRef(null);

    // Optimized state updater that batches high-frequency chunks
    const flushBuffer = useCallback((targetId) => {
        if (!pendingBufferRef.current) return;

        const chunk = pendingBufferRef.current;
        pendingBufferRef.current = '';

        setMessages(prev => {
            return prev.map(msg => {
                if (msg.id === targetId) {
                    return {
                        ...msg,
                        content: msg.content + chunk
                    };
                }
                return msg;
            });
        });

        animationFrameRef.current = null;
    }, []);

    const sendMessage = useCallback(async (content) => {
        if (!content.trim()) return;

        const userMessage = {
            id: Date.now().toString() + '-user',
            role: 'user',
            content
        };

        const assistantMessageId = Date.now().toString() + '-assistant';
        const initialAssistantMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            isStreaming: true
        };

        setMessages(prev => [...prev, userMessage, initialAssistantMessage]);
        setIsLoading(true);
        pendingBufferRef.current = '';

        // Initialize stream parser for this message
        streamParserRef.current = new StreamParser();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            await streamChatResponse({
                prompt: content,
                signal: abortControllerRef.current.signal,
                onChunk: (chunk) => {
                    // Use stream parser to intelligently handle chunks
                    const safeContent = streamParserRef.current.addChunk(chunk);

                    // Only update if content has changed
                    if (safeContent !== pendingBufferRef.current) {
                        pendingBufferRef.current = safeContent;

                        if (!animationFrameRef.current) {
                            animationFrameRef.current = requestAnimationFrame(() => {
                                // Update with the complete safe content
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: pendingBufferRef.current }
                                        : msg
                                ));
                                animationFrameRef.current = null;
                            });
                        }
                    }
                },
                onComplete: () => {
                    // Finalize: ensure all content including incomplete blocks is shown
                    const finalContent = streamParserRef.current?.finalize() || pendingBufferRef.current;

                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: finalContent, isStreaming: false }
                            : msg
                    ));
                },
                onError: (error) => {
                    console.error("Streaming callback error:", error);
                    const finalContent = streamParserRef.current?.finalize() || pendingBufferRef.current;

                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? {
                                ...msg,
                                isStreaming: false,
                                error: true,
                                content: finalContent + (finalContent ? "\n\n" : "") + "*[System Error]*"
                            }
                            : msg
                    ));
                }
            });

        } catch (error) {
            // This catches fetch-level errors or explicit throws in streamChatResponse
            if (error.name === 'AbortError') {
                const finalContent = streamParserRef.current?.finalize() || pendingBufferRef.current;

                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isStreaming: false,
                            content: finalContent + "\n\n*[Stream stopped by user]*"
                        }
                        : msg
                ));
            } else {
                console.error("SendMessage catch block error:", error);
                const finalContent = streamParserRef.current?.finalize() || pendingBufferRef.current;

                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isStreaming: false,
                            error: true,
                            content: finalContent + (finalContent ? "\n\n" : "") + "*[System Connection Error]*"
                        }
                        : msg
                ));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            pendingBufferRef.current = '';

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    }, []);

    const stopStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);


    return { messages, isLoading, sendMessage, stopStream, clearMessages, setMessages };
};

