import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    BrainCircuit,
    ShieldAlert,
    Zap,
    Circle,
    CheckCircle2,
    MessageSquare
} from 'lucide-react';
import ToolExecutionCard from './ToolExecutionCard';

const AgentDecision = ({ decision, originalInput, onDecisionUpdate }) => {
    if (!decision) return null;
    const { intent, risk, thought, action, confidence, reasoningSteps } = decision;
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic styles based on risk/confidence
    const isHighRisk = risk === 'high' || risk === 'critical';
    const isHighConfidence = confidence === 'high';

    return (
        <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* 1. Header: Quick Context & Status */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <BrainCircuit className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Cortex Decision</span>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isHighRisk
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                        }`}>
                        Risk: {risk}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800/50 border border-gray-700 text-gray-400">
                        Conf: {confidence}
                    </span>
                </div>
            </div>

            {/* 2. Main Logic Card */}
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

                <div className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                    {/* A. Thought / Reasoning Section */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Zap className="w-4 h-4 text-white fill-current" />
                                </div>
                            </div>
                            <div className="space-y-3 flex-1">
                                <h4 className="text-sm font-bold text-gray-200">Analysis & Strategy</h4>
                                <p className="text-gray-300 text-[15px] leading-relaxed font-light">
                                    {thought}
                                </p>

                                {/* Collapsible Reasoning Steps */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-400 transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        {isExpanded ? 'Hide Reasoning Chain' : 'View Reasoning Chain'}
                                    </button>

                                    {isExpanded && (
                                        <div className="mt-3 pl-3 border-l-2 border-blue-500/20 space-y-2 animate-in slide-in-from-top-2">
                                            {reasoningSteps?.map((step, idx) => (
                                                <div key={idx} className="flex gap-2 text-xs text-gray-400">
                                                    <span className="text-blue-500/40 font-mono">{String(idx + 1).padStart(2, '0')}</span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B. Action / Tool Execution Section */}
                    {action !== 'none' && (
                        <div className="bg-black/20 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                </div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Suggested Action</span>
                            </div>

                            {action === 'execute' && (
                                <ToolExecutionCard
                                    decision={decision}
                                    originalInput={originalInput}
                                    onResult={onDecisionUpdate}
                                />
                            )}
                        </div>
                    )}

                    {/* C. Response / Clarification (No Tool) */}
                    {(action === 'none' || action === 'respond' || action === 'clarify') && (
                        <div className="bg-emerald-500/5 p-6 border-t border-emerald-500/10">
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-100 mb-1">
                                        {action === 'clarify' ? 'Clarification Needed' : 'Request Processed'}
                                    </h4>
                                    <p className="text-sm text-emerald-200/70">
                                        {action === 'clarify'
                                            ? "I need a bit more information before I can proceed safely."
                                            : "I've analyzed your request and no further system actions are required."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AgentDecision;
