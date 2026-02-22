import React, { useState } from 'react';
import { Search, Sparkles, ChevronDown, MessageSquareText, Cpu, ArrowUp, Square } from 'lucide-react';

const AgentInput = ({ onAnalyze, isLoading, onStop, activeAgentType = 'chat', user, onAuthClick }) => {
    const [input, setInput] = useState('');

    const handleAnalyze = () => {
        if (!user) {
            onAuthClick();
            return;
        }
        if (input.trim()) {
            onAnalyze(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAnalyze();
        }
    };

    return (
        <div className="glass-card rounded-2xl p-1.5 shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] relative group z-10">
            {/* Top light reflection */}
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div
                className={`glass-card rounded-xl border-none bg-black/40 backdrop-blur-xl relative flex items-center p-1 transition-all duration-500 ${!user ? 'cursor-pointer hover:bg-black/60' : ''}`}
                onClick={() => !user && onAuthClick()}
            >
                <div className={`pl-4 pr-3 flex items-center gap-2 select-none transition-colors duration-500 ${!user ? 'text-gray-600' : 'text-blue-400'}`}>
                    {activeAgentType === 'decision' ? (
                        <Cpu className={`w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] ${user ? 'animate-pulse' : ''}`} />
                    ) : (
                        <MessageSquareText className="w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}
                </div>


                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    readOnly={!user}
                    placeholder={
                        !user
                            ? "Sign in to use Cortex..."
                            : activeAgentType === 'decision'
                                ? "Describe a task for the autonomous agent..."
                                : "Ask Cortex anything..."
                    }
                    className={`flex-1 bg-transparent border-none text-gray-100 focus:outline-none focus:ring-0 py-3 px-2 font-light text-base tracking-wide transition-all ${!user ? 'placeholder-blue-400/50 cursor-pointer' : 'placeholder-gray-500'}`}
                />

                <div className="flex items-center gap-2 pr-2">
                    {isLoading ? (
                        <button
                            onClick={onStop}
                            className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all border border-red-500/30"
                        >
                            <Square className="w-5 h-5 fill-current" />
                        </button>
                    ) : !user ? (
                        <button
                            onClick={onAuthClick}
                            className="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all duration-300"
                        >
                            Sign In
                        </button>
                    ) : activeAgentType === 'chat' ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={!input.trim()}
                            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleAnalyze}
                            disabled={!input.trim()}
                            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                       text-white bg-gradient-to-b from-blue-500 to-blue-700 
                       shadow-[0_0_20px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]
                       hover:shadow-[0_0_30px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]
                       hover:translate-y-[-1px] active:translate-y-[1px]
                       border border-blue-400/30
                       disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed
                       flex items-center gap-2"
                        >
                            <span>Analyze</span>
                            <Sparkles className="w-3.5 h-3.5 opacity-70" />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute inset-x-10 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-sm transition-opacity duration-500 ${activeAgentType === 'decision' ? 'opacity-100' : 'opacity-40'}`}></div>
        </div>
    );
};

export default AgentInput;

