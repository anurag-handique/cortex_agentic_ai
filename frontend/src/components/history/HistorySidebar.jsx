import React, { useEffect, useState, useMemo } from 'react';
import {
    MessageSquare,
    Plus,
    Trash2,
    X,
    Clock,
    Pencil,
    Check,
    Search,
    Calendar,
    ChevronRight,
    Bot,
    User,
    Database
} from 'lucide-react';
import { setSessionId, resetSessionId, resetTaskSessionId } from '../../utils/sessionManager';
import api from '../../utils/api';

const HistorySidebar = ({ isOpen, onClose, onSessionSelect, onNewChat, onTitleUpdate, type = 'CHAT' }) => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSessions(type);
        }
    }, [isOpen, type]);

    const fetchSessions = async (sessionType) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/api/v1/history/sessions?type=${sessionType}`);
            if (!res.ok) throw new Error('Failed to fetch sessions');
            const data = await res.json();
            if (data.success) {
                setSessions(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSession = (session) => {
        if (editingId) return;
        const sessionWithType = { ...session, type: session.type || type };
        onSessionSelect(sessionWithType);
        onClose();
    };

    const handleNewChat = () => {
        const newId = type === 'CHAT' ? resetSessionId() : resetTaskSessionId();
        onNewChat(newId);
        onClose();
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        // Custom confirm could be better but sticking to native for simplicity unless requested
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            await api.fetch(`/api/v1/history/sessions/${sessionId}`, { method: 'DELETE' });
            setSessions(sessions.filter(s => s.sessionId !== sessionId));
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const startEditing = (e, session) => {
        e.stopPropagation();
        setEditingId(session.sessionId);
        setEditValue(session.title || '');
    };

    const cancelEditing = (e) => {
        if (e) e.stopPropagation();
        setEditingId(null);
        setEditValue('');
    };

    const saveTitle = async (e) => {
        if (e) e.stopPropagation();
        if (!editValue.trim() || !editingId) {
            cancelEditing();
            return;
        }

        try {
            const res = await api.patch(`/api/v1/history/sessions/${editingId}/title`, { title: editValue });
            if (!res.ok) throw new Error('Update failed');
            const data = await res.json();

            if (data.success) {
                setSessions(sessions.map(s =>
                    s.sessionId === editingId ? { ...s, title: editValue } : s
                ));
                if (onTitleUpdate) onTitleUpdate(editingId, editValue);
            }
        } catch (error) {
            console.error('Failed to update title:', error);
        } finally {
            setEditingId(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') saveTitle(e);
        else if (e.key === 'Escape') cancelEditing(e);
    };

    // Grouping logic for more organized history
    const groupedSessions = useMemo(() => {
        const filtered = sessions.filter(s =>
            (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {
            'Today': [],
            'Yesterday': [],
            'Last 7 Days': [],
            'Earlier': []
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        filtered.forEach(s => {
            const date = new Date(s.updatedAt);
            if (date >= startOfToday) groups['Today'].push(s);
            else if (date >= startOfYesterday) groups['Yesterday'].push(s);
            else if (date >= startOfLastWeek) groups['Last 7 Days'].push(s);
            else groups['Earlier'].push(s);
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [sessions, searchQuery]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Backdrop with sophisticated blur */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px] z-[60] transition-opacity duration-500 animate-in fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel - Custom width and glass aesthetics */}
            <div className={`fixed top-0 right-0 h-full w-[310px] bg-gray-900/95 backdrop-blur-2xl border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[70] transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Decorative glowing gradient */}
                <div className="absolute top-0 right-0 w-full h-[200px] bg-gradient-to-bl from-blue-600/10 via-transparent to-transparent pointer-events-none opacity-50" />

                <div className="flex flex-col h-full relative z-10">

                    {/* Header: Compacted */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/10">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                History
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all duration-300"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* History Title Context */}
                    <div className="px-4 py-2">
                        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-[0.2em] text-center ${type === 'CHAT'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            {type === 'CHAT' ? 'Chat History' : 'Agent Task History'}
                        </div>
                    </div>

                    {/* Search Bar: Tightened */}
                    <div className="px-4 pb-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-200 placeholder:text-gray-600 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Action Bar: High-density button */}
                    <div className="px-4 pb-2">
                        <button
                            onClick={handleNewChat}
                            className="w-full py-2.5 px-4 bg-white/5 hover:bg-blue-600 text-gray-300 hover:text-white border border-white/10 hover:border-blue-500 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-300 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Plus className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="relative z-10 tracking-tight">
                                {type === 'CHAT' ? 'New Chat Session' : 'New Agent Task'}
                            </span>
                        </button>
                    </div>

                    {/* Content Section: Denser list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 border-2 border-blue-500/20 rounded-full" />
                                    <div className="absolute inset-0 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">Retrieving...</span>
                            </div>
                        ) : groupedSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 opacity-20">
                                    <Database className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-gray-500 font-medium tracking-tight text-xs">No data</h3>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2">
                                {groupedSessions.map(([group, items]) => (
                                    <div key={group} className="space-y-1">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{group}</span>
                                            <div className="h-px bg-white/5 flex-1" />
                                        </div>

                                        <div className="space-y-0.5">
                                            {items.map((session) => (
                                                <div
                                                    key={session.sessionId}
                                                    onClick={() => handleSelectSession(session)}
                                                    className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 border
                                                        ${editingId === session.sessionId
                                                            ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                                            : 'bg-transparent border-transparent hover:bg-white/5'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-start gap-2.5 relative z-10 transition-transform group-hover:translate-x-1">
                                                        <div className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 shadow-[0_0_8px] ${type === 'CHAT' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                                                            }`} />

                                                        <div className="flex-1 min-w-0">
                                                            {editingId === session.sessionId ? (
                                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        onKeyDown={handleKeyDown}
                                                                        onBlur={saveTitle}
                                                                        className="bg-gray-950/80 text-white text-xs rounded-md px-2 py-1 w-full border border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur-md"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <h3 className="text-xs font-medium text-gray-300 truncate pr-14 leading-tight group-hover:text-white transition-colors" title={session.title}>
                                                                        {session.title || "Untitled"}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] text-gray-600 font-mono tracking-tight uppercase">
                                                                            {formatDate(session.updatedAt)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <ChevronRight className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-0.5" />
                                                    </div>

                                                    {/* Floating Actions on Hover */}
                                                    {editingId !== session.sessionId && (
                                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all z-20">
                                                            <button
                                                                onClick={(e) => startEditing(e, session)}
                                                                className="p-1 bg-gray-900/80 backdrop-blur-md text-gray-500 hover:text-blue-400 border border-white/5 hover:border-blue-500/30 rounded-md transition-all"
                                                                title="Rename"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteSession(e, session.sessionId)}
                                                                className="p-1 bg-gray-900/80 backdrop-blur-md text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-md transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer: Compacted */}
                    <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md">
                        <div className="flex items-center justify-center text-[9px] text-gray-600 font-mono tracking-widest uppercase">
                            <span>SESSION MANAGEMENT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal CSS for scrollbar if needed, though usually in index.css */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </>
    );
};

export default HistorySidebar;
