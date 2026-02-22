import React, { useEffect, useState, useRef } from 'react';
import { Cpu, Server, Activity, Zap, Layers, Network, Boxes, HardDrive } from 'lucide-react';

// --- Advanced UI Components ---

/**
 * A futuristic radial gauge with a dashed ring, glowing progress arc, and numeric readout.
 */
const CyberGauge = ({ label, value, max, unit = "%", color = "cyan" }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Color definitions with glow effects
    const colorMap = {
        cyan: { stroke: "stroke-cyan-500", text: "text-cyan-400", glow: "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" },
        purple: { stroke: "stroke-purple-500", text: "text-purple-400", glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" },
        green: { stroke: "stroke-emerald-500", text: "text-emerald-400", glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" },
        amber: { stroke: "stroke-amber-500", text: "text-amber-400", glow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" },
        red: { stroke: "stroke-red-500", text: "text-red-400", glow: "drop-shadow-[0_0_10px_rgba(239,68,68,1)]" },
    };

    // Dynamic color shifting based on load
    const activeColor = percentage > 90 ? colorMap.red : percentage > 75 ? colorMap.amber : colorMap[color];

    return (
        <div className="relative flex flex-col items-center justify-center p-5 bg-gray-900/50 rounded-2xl border border-white/5 backdrop-blur-sm group hover:border-white/10 transition-colors">
            {/* Background Grid Mesh */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 pointer-events-none rounded-2xl" />

            <div className="relative w-32 h-32 flex items-center justify-center mb-1">
                <svg className="w-full h-full -rotate-90 transform">
                    {/* Background Track (Dashed) */}
                    <circle
                        cx="64" cy="64" r={radius}
                        className="stroke-white/5 fill-none"
                        strokeWidth="8"
                        strokeDasharray="4 4"
                    />

                    {/* Glowing Progress Arc */}
                    <circle
                        cx="64" cy="64" r={radius}
                        className={`${activeColor.stroke} fill-none transition-all duration-700 ease-out ${activeColor.glow}`}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                    />
                </svg>

                {/* Center Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className={`text-3xl font-black font-mono tracking-tighter ${activeColor.text}`}>
                        {Math.round(value)}
                    </span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-[-2px]">{unit}</span>
                </div>

                {/* Inner Spinner Decoration */}
                <div className="absolute inset-0 border-[2px] border-transparent border-t-white/10 rounded-full animate-[spin_3s_linear_infinite]" />
            </div>

            <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</span>
                <div className={`h-0.5 w-8 mt-2 rounded-full ${activeColor.stroke.replace('stroke-', 'bg-')} opacity-50`} />
            </div>
        </div>
    );
};

/**
 * A highly visual "Frequency" chart with gradient fill and scanning effect.
 */
const HolographicChart = ({ data, color = "cyan", label, value }) => {
    const max = 100;
    const points = data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 100 - Math.min((val / max) * 100, 100);
        return `${x},${y}`;
    }).join(' ');

    const fillPoints = `M 0 100 ${points.split(' ').map(p => `L ${p.replace(',', ' ')}`).join(' ')} L 100 100 Z`;

    const colorMap = {
        cyan: { stroke: "stroke-cyan-500", fill: "fill-cyan-500/10", accent: "text-cyan-400" },
        purple: { stroke: "stroke-purple-500", fill: "fill-purple-500/10", accent: "text-purple-400" },
        green: { stroke: "stroke-emerald-500", fill: "fill-emerald-500/10", accent: "text-emerald-400" },
    };

    const theme = colorMap[color];

    return (
        <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm h-48 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded bg-white/5 ${theme.accent}`}>
                        {color === 'cyan' ? <Cpu size={14} /> : <Server size={14} />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{label}</span>
                </div>
                <span className={`font-mono font-bold text-sm ${theme.accent}`}>{value}</span>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 w-full overflow-hidden">
                <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                    <defs>
                        <mask id={`grid-mask-${label}`}>
                            <rect width="100%" height="100%" fill="white" />
                            <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                        </mask>
                    </defs>

                    {/* Gradient Area */}
                    <path d={fillPoints} className={`stroke-none ${theme.fill} opacity-60`} />

                    {/* Glowing Line */}
                    <polyline points={points} className={`fill-none ${theme.stroke} stroke-[1.5] vector-effect-non-scaling-stroke drop-shadow-md`} />
                </svg>

                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-[50%] skew-x-12 animate-[shimmer_3s_infinite]" />
            </div>

            {/* Footer Info (Mock) */}
            <div className="mt-2 flex justify-between items-center opacity-50 text-[9px] font-mono text-gray-500">
                <span className="tracking-wider">FREQ: 3.2GHz</span>
                <span className="tracking-wider">V-CORE: NORMAL</span>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, subtext }) => (
    <div className="bg-gray-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
        <div className="absolute right-0 top-0 p-2 opacity-5 scale-150 transform translate-x-1 -translate-y-1">
            <Icon size={48} />
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-gray-300 relative z-10">
            <Icon size={20} />
        </div>
        <div className="flex flex-col relative z-10">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</span>
            <span className="text-xl font-bold text-white font-mono tracking-tight">{value}</span>
            {subtext && <span className="text-[9px] text-emerald-500/80 font-mono mt-0.5">{subtext}</span>}
        </div>
    </div>
);

const SystemResourcesPanel = () => {
    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState({
        cpu: Array(40).fill(0),
        memory: Array(40).fill(0),
        process: Array(40).fill(0)
    });

    useEffect(() => {
        const eventSource = new EventSource('/api/v1/monitor/metrics');

        eventSource.addEventListener('metrics', (e) => {
            const data = JSON.parse(e.data);
            setMetrics(data);
            setHistory(prev => ({
                cpu: [...prev.cpu.slice(1), data.systemCpuUsage],
                memory: [...prev.memory.slice(1), (data.systemMemoryUsed / data.systemMemoryTotal) * 100],
                process: [...prev.process.slice(1), data.processCpuUsage]
            }));
        });

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    if (!metrics) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-950 font-mono overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,128,255,0.05)_0%,_transparent_70%)]" />
                <div className="flex flex-col items-center gap-4 z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-500/30 animate-[spin_4s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="text-cyan-400 animate-pulse" size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-white tracking-widest uppercase">Initializing Sensors</span>
                        <span className="text-[10px] text-cyan-500/60 font-mono animate-pulse">ESTABLISHING NEURAL UPLINK...</span>
                    </div>
                </div>
            </div>
        );
    }

    const { systemCpuUsage, systemMemoryTotal, systemMemoryUsed, threadCount } = metrics;
    const memoryPercent = (systemMemoryUsed / systemMemoryTotal) * 100;
    const gbTotal = (systemMemoryTotal / (1024 * 1024 * 1024)).toFixed(1);
    const gbUsed = (systemMemoryUsed / (1024 * 1024 * 1024)).toFixed(1);
    const gbFree = ((systemMemoryTotal - systemMemoryUsed) / (1024 * 1024 * 1024)).toFixed(1);

    return (
        <div className="flex flex-col h-full bg-gray-950 p-6 overflow-y-auto custom-scrollbar relative">
            {/* Dynamic Background Noise/Grid */}
            <div className="fixed inset-0 bg-[size:40px_40px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto w-full space-y-6">

                {/* Header Section */}
                <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
                            <Activity className="text-cyan-400" size={20} />
                            SYSTEM MONITOR
                        </h2>
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest pl-8 block mt-1">
                            LIVE TELEMETRY • REFRESH 1000ms
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Layers}
                        label="Threads Active"
                        value={threadCount}
                        subtext="OPTIMAL RANGE"
                    />
                    <StatCard
                        icon={HardDrive}
                        label="Available Memory"
                        value={`${gbFree} GB`}
                        subtext={`OF ${gbTotal} GB TOTAL`}
                    />
                    <StatCard
                        icon={Network}
                        label="Network IO"
                        value="-- KB/s"
                        subtext="UNMONITORED"
                    />
                    <StatCard
                        icon={Zap}
                        label="GPU Status"
                        value="N/A"
                        subtext="NO DEDICATED DEVICE"
                    />
                </div>

                {/* Main Visualizations Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Gauges (1/3 width) */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 h-full">
                            <CyberGauge
                                label="CPU Package"
                                value={systemCpuUsage}
                                max={100}
                                color="cyan"
                            />
                            <CyberGauge
                                label="RAM Commit"
                                value={memoryPercent}
                                max={100}
                                color="purple"
                            />
                        </div>
                    </div>

                    {/* Right Column: Charts (2/3 width) */}
                    <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                        <HolographicChart
                            data={history.cpu}
                            color="cyan"
                            label="CPU Load History"
                            value={`${systemCpuUsage.toFixed(1)}%`}
                        />
                        <HolographicChart
                            data={history.memory}
                            color="purple"
                            label="Memory Allocation Trend"
                            value={`${gbUsed} GB`}
                        />
                    </div>
                </div>

                {/* Footer Status Bar */}
                <div className="grid grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden mt-6 opacity-60">
                    {['KERNEL', 'DAEMON', 'FS-ROOT', 'SECURITY'].map((item, i) => (
                        <div key={item} className="p-2 bg-gray-900/50 flex flex-col items-center justify-center">
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{item}</span>
                            <span className="text-[9px] text-emerald-500 font-mono mt-0.5">OK</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SystemResourcesPanel;
