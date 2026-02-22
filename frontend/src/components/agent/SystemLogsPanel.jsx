import React, { useEffect, useRef, useState } from 'react';
import { Terminal, XCircle, Search, ArrowDown } from 'lucide-react';

const SystemLogsPanel = () => {
    const [logs, setLogs] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const eventSource = new EventSource('/api/v1/monitor/logs');

        eventSource.addEventListener('log', (e) => {
            const newLog = JSON.parse(e.data);
            setLogs((prev) => {
                const updated = [...prev, newLog];
                if (updated.length > 500) return updated.slice(updated.length - 500);
                return updated;
            });
        });

        eventSource.onerror = () => {
            console.error("Log stream connection failed");
            eventSource.close();
            // Optional: Implement reconnection logic here
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollHeight - scrollTop === clientHeight;
        setAutoScroll(isAtBottom);
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'text-red-500';
            case 'WARN': return 'text-amber-400';
            case 'INFO': return 'text-blue-400';
            case 'DEBUG': return 'text-gray-500';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 font-mono text-xs">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-emerald-500" />
                    <span className="font-bold text-gray-300 uppercase tracking-wider">Live System Logs</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] animate-pulse">LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLogs([])}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        title="Clear Logs"
                    >
                        <XCircle size={14} />
                    </button>
                </div>
            </div>

            {/* Log Output */}
            <div
                className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1"
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping mb-4" />
                        <span>Waiting for incoming telemetry...</span>
                    </div>
                )}
                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 hover:bg-white/[0.02] p-0.5 rounded">
                        <span className="text-gray-500 shrink-0 w-24">{log.timestamp}</span>
                        <span className={`font-bold shrink-0 w-12 ${getLevelColor(log.level)}`}>{log.level}</span>
                        <span className="text-gray-400 shrink-0 w-48 truncate" title={log.logger}>
                            {log.logger.substring(log.logger.lastIndexOf('.') + 1)}
                        </span>
                        <span className="text-gray-300 break-all">{log.message}</span>
                    </div>
                ))}
            </div>

            {!autoScroll && (
                <button
                    onClick={() => setAutoScroll(true)}
                    className="absolute bottom-4 right-4 bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-500 transition-colors z-10"
                >
                    <ArrowDown size={16} />
                </button>
            )}
        </div>
    );
};

export default SystemLogsPanel;
