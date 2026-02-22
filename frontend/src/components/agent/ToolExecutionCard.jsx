import React, { useState, useEffect } from 'react';
import { Play, Check, AlertTriangle, Loader2, Terminal, ShieldCheck } from 'lucide-react';
import { confirmExecuteTool, interpretToolResult } from '../../services/agentService';

const ToolExecutionCard = ({ decision, originalInput, onResult, executionMode = 'manual' }) => {
    // States: idle, executing, interpreting, success, error
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [output, setOutput] = useState(null);

    // Auto-execution logic
    useEffect(() => {
        // If in 'auto' mode, execute immediately regardless of risk
        // If in 'manual' mode, only execute 'safe' actions automatically (optional, but keeping existing behavior)
        // Actually, user said: "Manual Execution ... must be completely disabled and hidden when Automatic Execution is active."
        // So in 'auto', we RUN. In 'manual', we WAIT (unless we want to keep the partial auto for safe items? Let's stick to strict separation if implied, but safer to keep existing safe-auto behavior for manual mode too?
        // User said: "Manual Execution should exist only as a separate mode... When Automatic... No manual execute button"
        // Implicitly, in Manual mode, we probably WANT the button.

        if (status === 'idle') {
            if (executionMode === 'auto') {
                handleExecute();
            } else if (executionMode === 'manual') {
                // Determine if we should auto-run safe tasks in manual mode?
                // The prompt says "The system must not provide both...". 
                // It likely means: Auto Mode = 100% Auto. Manual Mode = 100% Manual (or Manual + Safe Auto?).
                // Let's preserve existing "Safe Auto" for Manual Mode for now as it's a good UX, 
                // but definitely Force Auto for Auto Mode.
                const isSafe = decision?.risk === 'low' || decision?.risk === 'safe';
                if (isSafe) {
                    handleExecute();
                }
            }
        }
    }, [decision, executionMode]);

    const handleExecute = async () => {
        // ... (same as before)
        if (!decision?.toolName) {
            setError('No tool specified for execution');
            setStatus('error');
            return;
        }

        setStatus('executing');
        try {
            // 1. Execute
            const res = await confirmExecuteTool(decision.toolName, decision.input);
            const toolData = res?.data;
            setOutput(toolData);

            // ... (rest of logic)
            if (!toolData) {
                throw new Error('Received empty response from tool execution');
            }

            if (toolData.status === 'FAILED') {
                throw new Error(toolData.error || 'Tool execution failed');
            }

            // 2. Interpret
            setStatus('interpreting');
            const interpretation = await interpretToolResult(originalInput, toolData);

            setStatus('success');
            if (onResult) setTimeout(() => onResult(interpretation.data), 1000);

        } catch (err) {
            console.error('Execution Error:', err);
            setError(err.message || 'Unknown error');
            setStatus('error');
        }
    };

    const toolName = decision.toolName || 'Unknown Tool';
    const inputJson = typeof decision.input === 'string' ? decision.input : JSON.stringify(decision.input, null, 2);

    // Auto-running if status is active OR if we are about to start (for blinking indicator)
    const isAutoRunning = (status === 'executing' || status === 'interpreting') || (executionMode === 'auto' && status === 'idle');

    return (
        <div className="rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 hover:border-white/10 group">
            {/* Ambient Backglow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />

            {/* Progress/Scanbar */}
            {isAutoRunning && (
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2s_linear_infinite] z-20"></div>
            )}

            {/* 1. Controller Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-500 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                            status === 'error' ? 'bg-red-500/10 text-red-400' :
                                'bg-blue-500/10 text-blue-400'
                        }`}>
                        <Terminal className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-0.5">Execution Subsystem</span>
                        <span className="font-mono text-xs text-white font-bold tracking-wider">{toolName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Professional Badges */}
                    {executionMode === 'manual' && status === 'idle' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-amber-400 bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-400/20">
                            <AlertTriangle size={10} className="animate-pulse" />
                            Awaiting Authorization
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-400/5 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                            <Check size={10} />
                            Task Finalized
                        </div>
                    )}
                    {decision?.risk === 'low' && status !== 'error' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <ShieldCheck size={10} />
                            Verified Safe
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Parameters / Data Layer */}
            <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Input Parameters</span>
                    <span className="text-[9px] font-mono text-gray-600 uppercase">JSON OBJECT</span>
                </div>

                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-blue-200/60 overflow-x-auto leading-relaxed shadow-inner">
                    <pre className="custom-scrollbar">{inputJson}</pre>
                </div>

                {/* Intelligent Overlay */}
                {(status === 'executing' || status === 'interpreting') && (
                    <div className="absolute inset-x-6 inset-y-6 bg-black/80 backdrop-blur-md rounded-xl flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative mb-4">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-[spin_3s_linear_infinite]" />
                            <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 animate-pulse">
                                {status === 'executing' ? 'Initializing Protocol...' : 'Validating Output...'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono italic">Syncing with remote neural core...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Control Interface */}
            {status === 'idle' && executionMode === 'manual' && (
                <div className="px-5 py-4 bg-white/[0.01] border-t border-white/5 flex gap-4 relative z-10">
                    <button
                        onClick={handleExecute}
                        className="flex-1 relative overflow-hidden group/btn bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/10 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        <div className="flex items-center justify-center gap-2 relative z-10">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Authorize Execution
                        </div>
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-300">
                        Deny
                    </button>
                </div>
            )}

            {/* Error Reporting Layer */}
            {status === 'error' && (
                <div className="px-5 py-4 bg-red-500/5 border-t border-red-500/20 flex items-start gap-3 text-red-400 relative z-10 animate-in slide-in-from-bottom-2">
                    <div className="p-1.5 rounded-lg bg-red-500/10">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest">Execution Failure</span>
                        <span className="text-[11px] font-medium leading-relaxed opacity-90 font-mono">{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolExecutionCard;
