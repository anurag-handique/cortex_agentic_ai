import React, { useState, useEffect } from 'react';
import {
    Activity,
    Shield,
    Zap,
    BrainCircuit,
    Clock,
    AlertCircle,
    CheckCircle2,
    Play,
    Terminal,
    Target,
    Cpu,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    Maximize2,
    Minimize2,
    Database,
    ArrowLeft,
    X
} from 'lucide-react';
import ToolExecutionCard from './ToolExecutionCard';
import SystemLogsPanel from './SystemLogsPanel';
import SystemResourcesPanel from './SystemResourcesPanel';
import KnowledgeBasePanel from './KnowledgeBasePanel';

// New Tab Button Component
const ViewTab = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${active
            ? 'bg-white/10 text-white shadow-lg border border-white/5'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
    >
        {Icon && <Icon size={12} />}
        {label}
    </button>
);

/**
 * Compact Metric Component
 */
const MetricStat = ({ label, value, color = "blue", icon: Icon }) => {
    const colors = {
        blue: "text-blue-400 bg-blue-500/5 border-blue-500/20 shadow-blue-500/5",
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5",
        amber: "text-amber-400 bg-amber-500/5 border-amber-500/20 shadow-amber-500/5",
        red: "text-red-400 bg-red-500/5 border-red-500/20 shadow-red-500/5",
        gray: "text-gray-400 bg-gray-500/5 border-gray-500/20 shadow-gray-500/5",
    };

    return (
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] ${colors[color]} min-w-[130px]`}>
            <div className={`p-1.5 rounded-lg bg-current/10`}>
                {Icon && <Icon size={12} className="opacity-90" />}
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[8px] uppercase font-black opacity-50 tracking-[0.15em] mb-0.5">{label}</span>
                <span className="text-[11px] font-mono font-bold tracking-tight">{value}</span>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon, rightElement }) => (
    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-gray-400" />}
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{title}</span>
        </div>
        {rightElement}
    </div>
);

const ModeToggle = ({ mode, setMode }) => (
    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 relative">
        <div
            className={`absolute inset-y-1 rounded-full transition-all duration-300 ease-out shadow-sm ${mode === 'auto'
                ? 'left-1 w-[80px] bg-emerald-600 shadow-emerald-500/20'
                : 'left-[calc(100%-84px)] w-[80px] bg-blue-600 shadow-blue-500/20'
                }`}
        />
        <button
            onClick={() => setMode('auto')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 flex items-center gap-1.5 ${mode === 'auto' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            <Zap size={10} className={mode === 'auto' ? 'fill-current' : ''} />
            Auto
        </button>
        <button
            onClick={() => setMode('manual')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 flex items-center gap-1.5 ${mode === 'manual' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            <Terminal size={10} />
            Manual
        </button>
    </div>
);

const NavButtons = ({ onBack }) => (
    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
        <button
            onClick={onBack}
            title="Close View"
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-2 group/nav"
        >
            <ArrowLeft size={14} className="transition-transform group-hover/nav:-translate-x-0.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] hidden sm:inline opacity-70">Close</span>
        </button>
    </div>
);

const SubViewLayout = ({ title, icon: Icon, children, onBack }) => (
    <div className="h-full flex flex-col bg-gray-950/20 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none" />
        {/* Header */}
        <div className="shrink-0 h-16 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 shadow-xl">
                    <Icon size={16} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-0.5">Subsystem Module</span>
                    <span className="text-sm font-mono font-bold text-white tracking-widest">{title}</span>
                </div>
            </div>

            <NavButtons onBack={onBack} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative">
            {children}
        </div>
    </div>
);

const AgentDashboard = ({ activeView, decision, originalInput, onDecisionUpdate, error, messages }) => {
    // Layout State
    const [expandReasoning, setExpandReasoning] = useState(true);
    const [executionMode, setExecutionMode] = useState('auto'); // 'auto' | 'manual'
    const [viewMode, setViewMode] = useState('execution'); // 'execution' | 'logs' | 'system'

    useEffect(() => {
        if (activeView === 'Logs') {
            setViewMode('logs');
        } else if (activeView === 'Memory') {
            setViewMode('memory');
        } else if (activeView === 'System') {
            setViewMode('system');
        } else if (activeView === 'History') {
            setViewMode('history');
        } else if (!decision && !originalInput && messages && messages.length > 0) {
            // If we have history but no active task, default to the History view
            setViewMode('history');
        } else {
            setViewMode('execution');
        }
    }, [activeView, decision, originalInput, messages]);

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4 max-w-lg shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]">
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">System Critical Error</h3>
                        <p className="text-xs text-red-200/70 font-mono mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // CASE: Specific System Views (Direct Sidebar Access)
    if (viewMode === 'logs') {
        return (
            <div className="h-full bg-gray-900/10 backdrop-blur-3xl overflow-hidden animate-in fade-in duration-300 border border-white/10 rounded-[2rem] shadow-2xl">
                <SubViewLayout
                    title="SYSTEM_LOG_ACCESS"
                    icon={Terminal}
                    onBack={() => setViewMode('execution')}
                >
                    <SystemLogsPanel />
                </SubViewLayout>
            </div>
        );
    }

    if (viewMode === 'system') {
        return (
            <div className="h-full bg-gray-900/10 backdrop-blur-3xl overflow-hidden animate-in fade-in duration-300 border border-white/10 rounded-[2rem] shadow-2xl">
                <SubViewLayout
                    title="TELEMETRY_CORE"
                    icon={Activity}
                    onBack={() => setViewMode('execution')}
                >
                    <SystemResourcesPanel />
                </SubViewLayout>
            </div>
        );
    }

    if (viewMode === 'memory') {
        return (
            <div className="h-full bg-gray-900/10 backdrop-blur-3xl overflow-hidden animate-in fade-in duration-300 border border-white/10 rounded-[2rem] shadow-2xl">
                <SubViewLayout
                    title="SYNAPTIC_MEMORY_STORE"
                    icon={Database}
                    onBack={() => setViewMode('execution')}
                >
                    <KnowledgeBasePanel />
                </SubViewLayout>
            </div>
        );
    }

    // CASE: History mode (Standalone without active decision)
    if (viewMode === 'history' && !decision && !originalInput && messages && messages.length > 0) {
        // Fall through to the main return which handles viewMode === 'history'
    } else if (!decision && !originalInput && (!messages || messages.length === 0)) {
        // CASE: Idle State - Only show if there's no active decision AND no historical messages
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Background Grid & Ambient Glow */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] pointer-events-none" />
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${executionMode === 'auto' ? 'to-emerald-900/10' : 'to-blue-900/10'} pointer-events-none transition-colors duration-1000`} />

                {/* Central Core */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-12">
                        {/* Recursive Rings */}
                        <div className={`absolute inset-0 -m-12 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]`} style={{ borderStyle: 'double', borderWidth: '4px' }}></div>
                        <div className={`absolute inset-0 -m-8 rounded-full border border-dashed ${executionMode === 'auto' ? 'border-emerald-500/20' : 'border-blue-500/20'} animate-[spin_10s_linear_infinite]`}></div>
                        <div className={`absolute inset-0 -m-8 rounded-full border border-dashed ${executionMode === 'auto' ? 'border-emerald-500/20' : 'border-blue-500/20'} animate-[spin_15s_linear_infinite_reverse] opacity-50`}></div>

                        {/* Core Pulse */}
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center relative ${executionMode === 'auto' ? 'bg-emerald-500/5' : 'bg-blue-500/5'} backdrop-blur-xl border ${executionMode === 'auto' ? 'border-emerald-500/40' : 'border-blue-500/40'} shadow-[0_0_100px_-20px_currentColor] ${executionMode === 'auto' ? 'text-emerald-500' : 'text-blue-500'}`}>
                            <div className="absolute inset-2 rounded-full border border-current/20 animate-pulse"></div>
                            <Cpu className="w-12 h-12 relative z-10 drop-shadow-lg" />
                            <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-current" />

                            {/* Scanning Line */}
                            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-current to-transparent animate-[move_2s_ease-in-out_infinite] opacity-30"></div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-gray-500 tracking-[0.2em] mb-3 font-mono">
                        CORE ENGINE STANDBY
                    </h2>

                    <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl transition-colors duration-500 ${executionMode === 'auto' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${executionMode === 'auto' ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`} />
                            <div className={`absolute inset-0 rounded-full ${executionMode === 'auto' ? 'bg-emerald-400' : 'bg-blue-400'} animate-ping opacity-20`} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                            {executionMode === 'auto' ? 'AUTONOMOUS LOOP ACTIVE' : 'MANUAL OVERRIDE ARMED'}
                        </span>
                    </div>
                </div>

                {/* Mode Toggle (Floating) */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
                    <ModeToggle mode={executionMode} setMode={setExecutionMode} />
                </div>
            </div>
        );
    }

    const { risk, confidence, thought, reasoningSteps, action, toolName } = decision || {};
    const isWorking = !decision && originalInput;
    const isResponseAction = action === 'respond' || action === 'clarify' || action === 'none';

    return (
        <div className="flex flex-col h-full bg-gray-900/10 backdrop-blur-3xl overflow-hidden relative border border-white/10 rounded-[2rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]">
            {/* Background Tech Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* 1. COMMAND BAR (Header) */}
            <div className="shrink-0 h-16 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 justify-between z-20">

                {/* Left: Input Context */}
                <div className="flex items-center gap-4 overflow-hidden max-w-xl">
                    <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${isWorking ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {isWorking ? <Activity size={16} className="animate-spin" /> : <Target size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-0.5">Active Directive</span>
                        <div className="text-xs text-gray-100 font-mono font-medium truncate" title={originalInput}>
                            {originalInput || "MAINTAINING PROTOCOL..."}
                        </div>
                    </div>
                </div>

                {/* Right: Controls & Metrics */}
                <div className="flex items-center gap-6">
                    {/* Execution Mode Toggle */}
                    <ModeToggle mode={executionMode} setMode={setExecutionMode} />

                    <div className="h-8 w-px bg-white/10" />

                    <div className="flex items-center gap-3">
                        <MetricStat label="RISK LEVEL" value={risk?.toUpperCase() || "SAFE"} color={risk === 'high' ? 'red' : risk === 'medium' ? 'amber' : 'emerald'} icon={Shield} />
                        <MetricStat label="CONFIDENCE" value={confidence ? `${(confidence * 100).toFixed(0)}%` : "100%"} color="blue" icon={Zap} />
                    </div>
                </div>
            </div>

            {/* 2. DENSE SPLIT VIEW */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 overflow-hidden">

                {/* LEFT: STRATEGY & REASONING */}
                <div className="bg-gray-900/40 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                    {/* ... (Reasoning content same as before) ... */}
                    <SectionHeader
                        title="Reasoning Chain"
                        icon={BrainCircuit}
                        rightElement={
                            <span className="text-[9px] font-mono text-gray-600">Llama-3.2-70B</span>
                        }
                    />

                    <div className="p-4 space-y-5">
                        {isWorking ? (
                            <div className="space-y-3 animate-pulse opacity-50">
                                <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                <div className="h-4 bg-white/5 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <>
                                {/* Primary Thought */}
                                <div className="space-y-2">
                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Analysis</span>
                                    <p className="text-sm text-gray-300 font-light leading-relaxed">
                                        {thought || "Analyzing context..."}
                                    </p>
                                </div>

                                {/* Steps List (Compact) */}
                                {reasoningSteps?.length > 0 && (
                                    <div className="space-y-2 pt-3 border-t border-white/5">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Steps</span>
                                        <div className="space-y-1">
                                            {reasoningSteps.map((step, idx) => (
                                                <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-400 group">
                                                    <span className="font-mono text-gray-600 select-none group-hover:text-gray-300">{idx + 1}.</span>
                                                    <span className="group-hover:text-gray-200 transition-colors font-light">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT: EXECUTION & OUTPUT */}
                {/* RIGHT: MULTI-VIEW WORKSPACE */}
                <div className="bg-gray-900/60 flex flex-col min-h-0 overflow-hidden border-l border-white/5">
                    {/* Workspace Header with Tabs */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Workspace</span>
                            </div>
                            {/* Tabs */}
                            <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5">
                                <ViewTab
                                    active={viewMode === 'execution'}
                                    onClick={() => setViewMode('execution')}
                                    icon={Play}
                                    label="Execution"
                                />
                                <ViewTab
                                    active={viewMode === 'logs'}
                                    onClick={() => setViewMode('logs')}
                                    icon={Terminal}
                                    label="Logs"
                                />
                                <ViewTab
                                    active={viewMode === 'memory'}
                                    onClick={() => setViewMode('memory')}
                                    icon={Database}
                                    label="Memory"
                                />
                                <ViewTab
                                    active={viewMode === 'system'}
                                    onClick={() => setViewMode('system')}
                                    icon={Activity}
                                    label="System"
                                />
                                <ViewTab
                                    active={viewMode === 'history'}
                                    onClick={() => setViewMode('history')}
                                    icon={Clock}
                                    label="History"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {viewMode !== 'execution' && (
                                <NavButtons
                                    onBack={() => setViewMode('execution')}
                                />
                            )}
                            {viewMode === 'execution' && (
                                action && action !== 'none' ? (
                                    <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.1)]">Action Required</span>
                                ) : (
                                    <span className="text-[9px] text-emerald-500 font-bold uppercase bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">Ready</span>
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* VIEW: EXECUTION */}
                        {viewMode === 'execution' && (
                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-300">
                                {/* Tool Execution */}
                                {action && action !== 'none' && !isResponseAction && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <ToolExecutionCard
                                            decision={decision}
                                            originalInput={originalInput}
                                            onResult={onDecisionUpdate}
                                            executionMode={executionMode}
                                        />
                                    </div>
                                )}

                                {/* Response / Final Answer */}
                                {isResponseAction && (
                                    <div className="h-full flex flex-col animate-in scale-95 duration-300">
                                        <div className="flex-1 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 p-5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <MessageSquare size={64} className="text-emerald-400" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">
                                                        Final Result
                                                    </span>
                                                </div>
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                                    <p className="text-gray-100 font-light text-sm whitespace-pre-wrap">
                                                        {decision.response || thought}
                                                    </p>
                                                </div>
                                                <div className="mt-auto pt-6 flex justify-end">
                                                    <span className="text-[9px] font-mono text-emerald-500/40 uppercase">
                                                        Session Completed • {new Date().toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Empty Execution State */}
                                {!action && !isWorking && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-30">
                                        <Terminal size={24} className="mb-2" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest">Workspace Idle</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIEW: LOGS */}
                        {viewMode === 'logs' && (
                            <div className="absolute inset-0 animate-in fade-in duration-300">
                                <SystemLogsPanel />
                            </div>
                        )}

                        {/* VIEW: SYSTEM */}
                        {viewMode === 'system' && (
                            <div className="absolute inset-0 animate-in fade-in duration-300">
                                <SystemResourcesPanel />
                            </div>
                        )}

                        {/* VIEW: MEMORY */}
                        {viewMode === 'memory' && (
                            <div className="absolute inset-0 animate-in fade-in duration-300">
                                <KnowledgeBasePanel />
                            </div>
                        )}

                        {/* VIEW: HISTORY */}
                        {viewMode === 'history' && (
                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 animate-in fade-in duration-300">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    {messages && messages.length > 0 ? (
                                        messages.map((msg) => {
                                            const isTool = msg.role === 'tool';
                                            const isUser = msg.role === 'user';

                                            return (
                                                <div key={msg.id} className={`flex gap-5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
                                                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border backdrop-blur-sm transition-all duration-300 group-hover:scale-110 ${isUser ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
                                                        isTool ? 'bg-amber-600/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                                                            'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                        }`}>
                                                        {isUser ? <MessageSquare size={16} /> : isTool ? <Terminal size={16} /> : <BrainCircuit size={16} />}
                                                    </div>
                                                    <div className={`flex-1 min-w-0 max-w-[88%] space-y-1.5 ${isUser ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                                        <div className="flex items-center gap-3 px-1">
                                                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                                                {isUser ? 'User Authorization' : isTool ? `Protocol execution: ${msg.toolName}` : 'Cortex Intelligence Core'}
                                                            </span>
                                                        </div>
                                                        <div className={`rounded-2xl px-5 py-4 text-[13px] leading-relaxed backdrop-blur-xl border transition-all duration-300 ${isUser ? 'bg-blue-600 border-blue-400/30 text-white rounded-tr-sm shadow-xl shadow-blue-900/10' :
                                                            isTool ? 'bg-black/60 border-white/5 text-amber-100/90 font-mono text-[11px] rounded-tl-sm ring-1 ring-amber-500/10' :
                                                                'bg-white/[0.03] border-white/10 text-gray-200 rounded-tl-sm shadow-2xl relative overflow-hidden'
                                                            }`}>
                                                            {!isUser && !isTool && <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none opacity-50" />}

                                                            <div className="prose prose-invert prose-sm max-w-none break-words whitespace-pre-wrap relative z-10">
                                                                {isTool ? (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between opacity-40 text-[9px] font-black tracking-[0.2em] pb-2 border-b border-white/5">
                                                                            <span>EXECUTION STDOUT</span>
                                                                        </div>
                                                                        <div className="leading-tight text-amber-200/70">{msg.toolOutput || msg.content}</div>
                                                                    </div>
                                                                ) : msg.content}
                                                            </div>
                                                        </div>
                                                        {msg.timestamp && (
                                                            <div className={`text-[9px] text-gray-600 font-black tracking-widest uppercase mt-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                                                                {new Date(msg.timestamp).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                                            <Clock size={48} className="mb-4 text-gray-400" />
                                            <span className="text-xs font-bold uppercase tracking-widest">No History Recorded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AgentDashboard;
