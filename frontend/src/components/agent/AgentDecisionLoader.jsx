import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * AgentDecisionLoader
 * 
 * A professional, integrated loader for the Decide Agent tab.
 * Communicates reasoning and intent analysis in progress.
 */
const AgentDecisionLoader = () => {
    const messages = [
        "Analyzing your request...",
        "Understanding intent and context...",
        "Reasoning and deciding next steps...",
        "Cortex Agent is evaluating..."
    ];

    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 3000); // Rotate messages every 3 seconds for a subtle feel

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 animate-in fade-in duration-700">
            <h3 className="text-gray-500 font-display text-sm font-medium mb-3 ml-1 tracking-wider opacity-60">
                Agent Decision
            </h3>

            <div className="glass-card rounded-2xl overflow-hidden relative border border-blue-500/10 bg-blue-500/[0.02]">
                {/* Subtle scanning line animation */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-scan"></div>

                <div className="p-8 flex flex-col items-center justify-center text-center gap-6">
                    {/* Animated Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gray-950 border border-blue-500/20 flex items-center justify-center relative z-10 shadow-2xl">
                            <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>

                        {/* Orbital dots */}
                        <div className="absolute inset-[-8px] border border-blue-500/10 rounded-full animate-[spin_4s_linear_infinite]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-blue-400/90 font-mono text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
                            Neural Processing
                        </span>
                        <p className="text-gray-400 text-sm font-medium tracking-wide min-h-[1.5rem] transition-all duration-500">
                            {messages[messageIndex]}
                        </p>
                    </div>

                    {/* Waveform-style indicator */}
                    <div className="flex items-end gap-1 h-4">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-blue-500/30 rounded-full animate-waveform"
                                style={{
                                    animationDelay: `${i * 0.15}s`,
                                    height: '100%'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDecisionLoader;
