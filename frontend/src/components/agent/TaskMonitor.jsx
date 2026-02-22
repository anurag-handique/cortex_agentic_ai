import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Circle, Clock, AlertCircle, Terminal, Cpu } from 'lucide-react';
import api from '../../utils/api';

const TaskMonitor = ({ sessionId }) => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = async () => {
        if (!sessionId) return;
        try {
            const [tasksRes, statsRes] = await Promise.all([
                api.get(`/api/v1/tasks/session/${sessionId}`),
                api.get(`/api/v1/tasks/session/${sessionId}/stats`)
            ]);

            const tasksData = await tasksRes.json();
            const statsData = await statsRes.json();

            if (tasksData.success) setTasks(tasksData.data);
            if (statsData.success) setStats(statsData.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 3000); // Polling for autonomous updates
        return () => clearInterval(interval);
    }, [sessionId]);

    if (!sessionId) return null;

    return (
        <div className="flex flex-col h-full bg-gray-950/50 backdrop-blur-md border-l border-white/5 w-80">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    {stats && (
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded ml-auto">
                            {stats.completed}/{stats.total} DONE
                        </span>
                    )}
                </div>


                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-[10px] text-emerald-400/60 uppercase font-bold">Success</p>
                            <p className="text-xl font-display text-emerald-400">{stats.completed}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <p className="text-[10px] text-blue-400/60 uppercase font-bold">Pending</p>
                            <p className="text-xl font-display text-blue-400">{stats.pending + stats.inProgress}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {tasks.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Cpu className="w-12 h-12 text-gray-800 mb-4 animate-pulse" />
                        <p className="text-xs text-gray-600 font-medium">No background actions<br />currently active.</p>
                    </div>
                )}

                {tasks.map((task) => (
                    <div
                        key={task.taskId}
                        className={`p-3 rounded-xl border transition-all duration-300 ${task.status === 'IN_PROGRESS'
                            ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                            : 'bg-white/5 border-white/5'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                {task.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                {task.status === 'PENDING' && <Clock className="w-4 h-4 text-gray-500" />}
                                {task.status === 'IN_PROGRESS' && <Activity className="w-4 h-4 text-blue-400 animate-spin-slow" />}
                                {task.status === 'FAILED' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-gray-300 line-clamp-2 leading-relaxed">
                                    {task.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Terminal className="w-3 h-3 text-gray-600" />
                                    <span className="text-[9px] font-mono text-gray-500 truncate">
                                        {task.toolName || 'system_core'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {task.status === 'IN_PROGRESS' && (
                            <div className="mt-2 h-1 w-full bg-blue-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 animate-[progress_2s_infinite]" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskMonitor;
