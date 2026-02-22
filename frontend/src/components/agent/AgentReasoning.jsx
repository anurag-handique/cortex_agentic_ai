import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';

const AgentReasoning = ({ steps = [], expanded: defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 px-4 hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <span>Reasoning Chain</span>
                    <span className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded textxs">{steps.length} steps</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>

            {isExpanded && (
                <div className="border-t border-gray-800 p-4 space-y-4 bg-gray-950/30">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                            <div className="mt-1 flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-purple-500/50" />
                                {index < steps.length - 1 && <div className="w-px h-full bg-gray-800 my-1" />}
                            </div>
                            <div className="flex-1 pb-2">
                                <p className="text-sm text-gray-300 leading-relaxed font-light">{step}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentReasoning;
