import React from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';

/**
 * ChatInterface
 * 
 * Orchestrates the overall conversation flow.
 * Implements auto-scrolling and handles the empty state.
 */
const ChatInterface = ({ messages, isLoading }) => {
    if (!messages || messages.length === 0) {
        return null;
    }

    return (
        <div className="relative z-0 pb-48 w-full">
            {/* Conversation Flow */}
            <div className="divide-y divide-white/5">
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={msg.id || index}
                        message={msg}
                    />
                ))}

                {/* Thinking / Initial Latency State */}
                {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                    <div className="w-full py-12 animate-in fade-in duration-700">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex gap-6 items-start">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                                </div>
                                <div className="flex flex-col gap-3 pt-1">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-3.5 h-3.5 text-indigo-500/50 animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60">
                                            Initializing Neural Core...
                                        </span>
                                    </div>
                                    {/* Shimmer Bone Effect */}
                                    <div className="flex flex-col gap-2">
                                        <div className="h-2 w-48 bg-white/5 rounded-full animate-pulse" />
                                        <div className="h-2 w-32 bg-white/5 rounded-full animate-pulse [animation-delay:200ms]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
