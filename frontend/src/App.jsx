import React, { useState, useRef, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import AgentInput from './components/agent/AgentInput';
import AgentDecision from './components/agent/AgentDecision';
import ChatInterface from './components/chat/ChatInterface';
import HistorySidebar from './components/history/HistorySidebar';
import { useChatStream } from './hooks/useChatStream';
import { useAgentDecide } from './hooks/useAgentDecide';
import { useAutoScroll } from './hooks/useAutoScroll';
import { ArrowDown, Shield, AlertCircle } from 'lucide-react';
import AgentDecisionLoader from './components/agent/AgentDecisionLoader';
import AgentDashboard from './components/agent/AgentDashboard';
import SettingsPage from './components/agent/SettingsPage';
import TaskMonitor from './components/agent/TaskMonitor';
import api from './utils/api';
import {
    getSessionId,
    setSessionId,
    resetSessionId,
    getTaskSessionId,
    setTaskSessionId,
    resetTaskSessionId
} from './utils/sessionManager';

import AuthModal from './components/auth/AuthModal';

function App() {
    // Auth state initialized from localStorage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Initial state matches the empty "Ask Cortex" state
    const [currentAgentType, setCurrentAgentType] = useState('chat');
    const [lastAnalysedPrompt, setLastAnalysedPrompt] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Initialize session ID based on default agent type (chat)
    const [currentSessionId, setCurrentSessionId] = useState(getSessionId());
    const [currentSessionTitle, setCurrentSessionTitle] = useState('');
    const [isMonitorOpen, setIsMonitorOpen] = useState(false); // Default closed

    // Updated destructuring to include setMessages
    const { messages, isLoading: isChatLoading, sendMessage, stopStream, clearMessages, setMessages } = useChatStream();
    const { decision, isLoading: isDecideLoading, makeDecision, stopDecision, setDecision, error: decideError } = useAgentDecide();

    const isLoading = isChatLoading || isDecideLoading;

    // Listen for auth errors (e.g., 401 from API)
    useEffect(() => {
        const handleAuthError = () => {
            setUser(null);
            setIsAuthModalOpen(true);
        };
        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, []);

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setIsAuthModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        handleNewChat(); // Clear current session on logout
    };

    // Auto-refresh title for new chats
    useEffect(() => {
        // If we have messages but no title, start looking for the auto-generated title
        // Only valid for Chat Sessions usually, but maybe Task too?
        // Since History Sidebar is Chat focused, we care about Chat Title.
        if (messages.length > 0 && !currentSessionTitle && currentSessionId) {
            const fetchTitle = async () => {
                try {
                    const res = await api.get(`/api/v1/history/sessions/${currentSessionId}`);
                    if (!res.ok) return false;
                    const data = await res.json();
                    if (data?.success && data.data?.title) {
                        setCurrentSessionTitle(data.data.title);
                        return true;
                    }
                } catch (e) {
                    console.warn("Title refresh failed", e);
                }
                return false;
            };

            // Check at multiple intervals to catch the background process completion
            const timer1 = setTimeout(fetchTitle, 2500); // Early check
            const timer2 = setTimeout(fetchTitle, 6000); // Standard check
            const timer3 = setTimeout(fetchTitle, 12000); // Late fallback

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        }
    }, [messages.length, currentSessionId, currentSessionTitle, isLoading]);

    // Intelligent auto-scroll
    const { scrollRef, scrollToBottom, showScrollButton } = useAutoScroll(
        // Trigger on new messages or decision updates
        [messages, decision],
        isLoading
    );

    const loadSessionMessages = async (sessionId) => {
        if (!sessionId) {
            clearMessages();
            return;
        }

        try {
            const res = await api.get(`/api/v1/history/sessions/${sessionId}/messages`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            if (data.success) {
                const mappedMessages = data.data.map(msg => ({
                    id: msg.id || Date.now() + Math.random(),
                    role: msg.role.toLowerCase(),
                    content: msg.content,
                    timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
                    toolName: msg.toolName,
                    toolInput: msg.toolInput,
                    toolOutput: msg.toolOutput
                }));

                setMessages(mappedMessages);
                setTimeout(() => scrollToBottom(true), 100);
            } else {
                clearMessages();
            }
        } catch (error) {
            console.error("Failed to load session messages:", error);
            clearMessages();
        }
    };

    // Load a selected session
    const handleSessionSelect = async (session) => {
        setIsHistoryOpen(false);
        setDecision(null);
        clearMessages();

        const isTask = session.type === 'TASK';

        if (isTask) {
            setCurrentAgentType('decision');
            setActiveTab('My Agent');
            setTaskSessionId(session.sessionId);
            setCurrentSessionId(session.sessionId);
        } else {
            setCurrentAgentType('chat');
            setActiveTab('Chat Agent');
            setSessionId(session.sessionId);
            setCurrentSessionId(session.sessionId);
        }

        setCurrentSessionTitle(session.title || '');
        await loadSessionMessages(session.sessionId);
    };

    const handleNewChat = (providedId) => {
        clearMessages();
        setDecision(null);
        setLastAnalysedPrompt('');
        setCurrentSessionTitle('');

        if (currentAgentType === 'chat') {
            const newId = providedId || resetSessionId();
            setCurrentSessionId(newId);
        } else {
            const newId = providedId || resetTaskSessionId();
            setCurrentSessionId(newId);
        }
    };

    // State for Sidebar Tabs
    const [activeTab, setActiveTab] = useState('Chat Agent');

    // Handle Tab Selection
    const handleTabChange = (tabName) => {
        // AUTH GUARD: My Agent and specific system tabs require authentication
        if (!user && (tabName === 'My Agent' || tabName === 'Logs' || tabName === 'Memory' || tabName === 'System' || tabName === 'Settings')) {
            setIsAuthModalOpen(true);
            return;
        }

        setActiveTab(tabName);
        clearMessages(); // CRITICAL: Clear immediately to prevent UI bleeding between modes
        setDecision(null);
        setLastAnalysedPrompt('');
        setCurrentSessionTitle('');

        if (tabName === 'Chat Agent') {
            setCurrentAgentType('chat');
            const chatId = getSessionId();
            setCurrentSessionId(chatId);
            loadSessionMessages(chatId);
        } else if (tabName === 'Settings') {
            setCurrentAgentType('settings');
            setCurrentSessionId(null);
        } else {
            setCurrentAgentType('decision');
            const taskId = getTaskSessionId();
            setCurrentSessionId(taskId);
            loadSessionMessages(taskId);
        }
    };

    const handleTitleUpdate = (sessionId, newTitle) => {
        if (sessionId === currentSessionId) {
            setCurrentSessionTitle(newTitle);
        }
    };

    // Handle interaction
    const handleAnalyze = (prompt) => {
        // AUTH GUARD: Prevent interactions if not signed in
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        // Agent type is strictly determined by the current tab state
        const agentType = currentAgentType;

        if (agentType === 'chat') {
            // Chat mode: Clear any stale agent state and only trigger chat stream
            setDecision(null);
            setLastAnalysedPrompt('');
            sendMessage(prompt);
        } else {
            // My Agent: Strictly autonomous reasoning mode
            // No chat history update, only trigger reasoning engine
            setLastAnalysedPrompt(prompt);
            makeDecision(prompt);
        }


        // Force scroll to bottom on new request
        setTimeout(() => scrollToBottom(true), 100);
    };

    const handleStop = () => {
        stopStream();
        stopDecision();
    };

    return (
        <AppLayout
            onHistoryClick={() => setIsHistoryOpen(true)}
            title={currentSessionTitle || activeTab}
            user={user}
            onLoginClick={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onMonitorToggle={() => setIsMonitorOpen(!isMonitorOpen)}
            isMonitorOpen={isMonitorOpen}
            activeTab={activeTab}
            onTabChange={handleTabChange}
        >


            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthSuccess={handleAuthSuccess}
            />
            <HistorySidebar
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
                onTitleUpdate={handleTitleUpdate}
                type={currentAgentType === 'chat' ? 'CHAT' : 'TASK'}
            />
            <div className="h-full flex flex-col">

                {/* 1. Main Content & Monitor */}
                <div className="flex-1 flex overflow-hidden">
                    <div
                        ref={scrollRef}
                        className={`flex-1 ${currentAgentType === 'decision' ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden relative scroll-smooth px-6`}
                    >
                        <div className={`${currentAgentType === 'decision' ? 'max-w-[1800px] h-full flex flex-col py-4' : 'max-w-4xl pt-12 pb-20'} mx-auto transition-all duration-500`}>

                            {/* Welcome Screen (Chat Agent Only) */}
                            {currentAgentType === 'chat' && !decision && messages.length === 0 && (
                                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                                    <div className="mb-8 relative group">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
                                        <img
                                            src="/logo_main.png"
                                            alt="Cortex Logo"
                                            className="w-48 h-48 object-contain relative z-10 opacity-95 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]"
                                        />
                                    </div>
                                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-blue-100 to-blue-400 mb-4 tracking-tight">
                                        CORTEX AI Assistant
                                    </h1>

                                    <h2 className="text-2xl font-medium text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                                        How can I help you today, <span className="text-blue-400">{user ? user.firstName : 'Friend'}</span>?
                                    </h2>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                            <p className="text-blue-400 font-mono text-[10px] tracking-[0.3em] uppercase">
                                                Version V.1.0.2 • BETA
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium tracking-wide">SYSTEMS STABLE • ENGINE READY</span>
                                    </div>
                                </div>
                            )}

                            {/* Conversation Flow (Chat Agent Only) */}
                            {currentAgentType === 'chat' && messages.length > 0 && (
                                <ChatInterface
                                    messages={messages}
                                    isLoading={isLoading}
                                />
                            )}

                            {/* Agent Dashboard View (My Agent) */}
                            {currentAgentType === 'decision' && user && (
                                <AgentDashboard
                                    activeView={activeTab}
                                    decision={decision}
                                    messages={messages} // Pass messages for history view
                                    originalInput={lastAnalysedPrompt}
                                    onDecisionUpdate={(newDecision) => setDecision(newDecision)}
                                    isMonitorOpen={isMonitorOpen}
                                    error={decideError}
                                />
                            )}

                            {/* Settings Page View */}
                            {activeTab === 'Settings' && user && (
                                <SettingsPage
                                    user={user}
                                    onClose={() => handleTabChange('Chat Agent')}
                                />
                            )}

                            {/* AUTH GUARD UI: My Agent (Signed Out) */}
                            {(currentAgentType === 'decision' || currentAgentType === 'settings') && !user && (
                                <div className="h-[70vh] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-700">
                                    <div className="relative mb-10 group">
                                        <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-all duration-1000"></div>
                                        <div className="w-24 h-24 rounded-3xl bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center relative z-10 shadow-2xl group-hover:border-blue-500/50 transition-all duration-500">
                                            <Shield className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center z-20 shadow-xl border-4 border-gray-950">
                                            <AlertCircle size={14} className="text-white" />
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-4 tracking-tight">
                                        Access Restricted
                                    </h2>
                                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10 text-sm font-light">
                                        The autonomous decision engine and advanced agent capabilities require an authorized neural link. Please sign in to establish a secure connection.
                                    </p>

                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95"
                                    >
                                        Initialize Authorization
                                    </button>
                                </div>
                            )}

                        </div>

                        {/* Floating Scroll Button */}
                        {showScrollButton && (
                            <button
                                onClick={() => scrollToBottom(true)}
                                className="fixed bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all animate-in slide-in-from-bottom-4 duration-300 z-50 border border-white/20"
                            >
                                <span>Jump to Latest</span>
                                <ArrowDown className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Right Sidebar: Task Monitor */}
                    {isMonitorOpen && currentSessionId && (
                        <div className="animate-in slide-in-from-right duration-500">
                            <TaskMonitor sessionId={currentSessionId} />
                        </div>
                    )}
                </div>


                {/* 2. Fixed Bottom Input Area */}
                <div className="w-full bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent pt-4 pb-8 px-6">
                    <div className="max-w-4xl mx-auto">
                        <AgentInput
                            onAnalyze={handleAnalyze}
                            isLoading={isLoading}
                            onStop={handleStop}
                            activeAgentType={currentAgentType}
                            user={user}
                            onAuthClick={() => setIsAuthModalOpen(true)}
                        />

                        <div className="text-center mt-3">
                            <span className="text-[10px] text-gray-600">Cortex can make mistakes. Consider checking important information.</span>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}

export default App;
