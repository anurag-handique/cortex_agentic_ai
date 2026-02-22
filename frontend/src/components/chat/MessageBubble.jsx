import React, { useState, useCallback } from 'react';
import { Bot, User, AlertCircle, Copy, Check, Share2, MoreHorizontal } from 'lucide-react';
import MarkdownRenderer from './renderers/MarkdownRenderer';

/**
 * MessageBubble - Document-Flow Version
 * 
 * An industry-standard, document-first layout similar to ChatGPT/Claude.
 * Focuses on content density, typography, and clean separation.
 */
const MessageBubble = React.memo(({ message }) => {
    const isAssistant = message.role === 'assistant';
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (!message.content) return;
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy message:', err);
        }
    }, [message.content]);

    const [shared, setShared] = useState(false);

    const handleShare = useCallback(async () => {
        if (!message.content) return;

        const shareData = {
            title: 'Cortex Solution Delivery',
            text: `Check out this solution from Cortex AI:\n\n${message.content.substring(0, 500)}...`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback to clipboard with a "Shareable" format
                const shareText = `CORTEX OUTPUT:\n\n${message.content}\n\nShared via Cortex AI Assistant`;
                await navigator.clipboard.writeText(shareText);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    }, [message.content]);

    return (
        <div className={`w-full py-8 border-b border-white/5 last:border-0 group/message transition-colors duration-500 ${isAssistant ? 'bg-white/[0.01]' : 'bg-transparent'
            }`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-4 sm:gap-6">
                    {/* Avatar Column */}
                    <div className="flex-shrink-0 pt-0.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform duration-300 ${isAssistant
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white'
                            : 'bg-gray-800 border border-white/10 text-gray-400'
                            }`}>
                            {isAssistant ? (
                                <Bot className="w-5 h-5" />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-grow min-w-0 flex flex-col gap-1">
                        {/* Meta Header */}
                        <div className="flex items-center h-8 gap-3">
                            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isAssistant ? 'text-indigo-400' : 'text-blue-400'
                                }`}>
                                {isAssistant ? 'Cortex Intelligence' : 'You'}
                            </span>

                            {message.timestamp && (
                                <span className="text-[10px] text-gray-600 font-mono">
                                    {new Date(message.timestamp).toLocaleString()}
                                </span>
                            )}
                        </div>

                        {/* Message Body */}
                        <div className={`prose prose-invert max-w-none leading-7 text-[15px] sm:text-[16px] antialiased ${isAssistant ? 'text-gray-200' : 'text-gray-100 font-medium'
                            }`}>
                            <MarkdownRenderer
                                content={message.content}
                                isStreaming={message.isStreaming}
                            />
                        </div>

                        {/* Actions (Bottom) */}
                        {!message.isStreaming && !message.error && (
                            <div className="flex items-center justify-end gap-1 mt-4 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                                    title="Copy response"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                                    title="Share response"
                                >
                                    {shared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                                </button>
                                <button className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Generation Status & Footer */}
                        {message.isStreaming && (
                            <div className="flex items-center gap-4 mt-8 py-3 px-4 border border-white/5 bg-white/[0.02] rounded-xl animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                                    Generating response...
                                </span>
                            </div>
                        )}

                        {message.error && (
                            <div className="flex items-center gap-3 mt-4 p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 animate-in shake-in">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-bold uppercase tracking-tight">Protocol Violation: Connection Terminated</span>
                                <button className="ml-auto text-xs font-black underline underline-offset-4 hover:text-red-400 transition-colors">
                                    RE-INITIALIZE
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.isStreaming === nextProps.message.isStreaming &&
        prevProps.message.error === nextProps.message.error
    );
});

export default MessageBubble;
