import React, { useState } from 'react';
import {
    User,
    Shield,
    Bell,
    Sun,
    Moon,
    Smartphone,
    Globe,
    Lock,
    Key,
    Eye,
    Database,
    Cpu,
    ArrowLeft,
    CheckCircle2,
    Save
} from 'lucide-react';

const SettingHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-xl">
            <Icon size={24} />
        </div>
        <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">{title}</h1>
            <p className="text-sm text-gray-400 font-light">{subtitle}</p>
        </div>
    </div>
);

const SettingSection = ({ title, children }) => (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-3">
            {title}
            <div className="h-px flex-1 bg-white/5"></div>
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingToggle = ({ icon: Icon, label, description, active, onToggle }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 group">
        <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gray-900/60 border border-white/5 text-gray-400 group-hover:text-blue-400 transition-colors">
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
            </div>
        </div>
        <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full relative transition-all duration-500 ${active ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${active ? 'left-7 shadow-lg' : 'left-1'}`} />
        </button>
    </div>
);

const SettingInput = ({ icon: Icon, label, description, value, type = "text", placeholder }) => (
    <div className="flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-gray-900/60 border border-white/5 text-gray-400 group-hover:text-blue-400 transition-colors">
                    <Icon size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-200">{label}</span>
                    <span className="text-xs text-gray-500">{description}</span>
                </div>
            </div>
        </div>
        <div className="relative">
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                readOnly={true}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            />
        </div>
    </div>
);

const SettingsPage = ({ user, onClose }) => {
    const [notifications, setNotifications] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [autonomousExec, setAutonomousExec] = useState(true);

    return (
        <div className="h-full flex flex-col bg-gray-950/20 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden relative border border-white/10 rounded-[2rem] shadow-2xl">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />

            {/* Header */}
            <div className="shrink-0 h-20 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-10 z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-xl">
                        <Settings2 size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-0.5">Control Center</span>
                        <span className="text-base font-mono font-bold text-white tracking-widest">SYSTEM_PREFERENCES</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft size={14} />
                    Close Settings
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 max-w-4xl mx-auto w-full">
                <SettingSection title="Identity & Biometrics">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SettingInput
                            icon={User}
                            label="Display Name"
                            description="How Cortex identifies you"
                            value={user?.firstName + " " + (user?.lastName || '')}
                        />
                        <SettingInput
                            icon={Globe}
                            label="Neural Link ID"
                            description="Your unique workspace identifier"
                            value={user?.id || 'CTX-992-001'}
                            readOnly
                        />
                    </div>
                </SettingSection>

                <SettingSection title="Intelligence Engine">
                    <div className="grid grid-cols-1 gap-4">
                        <SettingToggle
                            icon={Cpu}
                            label="Autonomous Prototype Execution"
                            description="Allow the agent to execute safe tools without manual confirmation"
                            active={autonomousExec}
                            onToggle={() => setAutonomousExec(!autonomousExec)}
                        />
                        <SettingToggle
                            icon={Database}
                            label="Long-Term Memory Indexing"
                            description="Synthesize past interactions to improve context awareness"
                            active={true}
                        />
                    </div>
                </SettingSection>

                <SettingSection title="Security & Privacy">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SettingToggle
                            icon={Eye}
                            label="Ghost Mode"
                            description="Do not log interaction history for this session"
                            active={privacyMode}
                            onToggle={() => setPrivacyMode(!privacyMode)}
                        />
                        <SettingToggle
                            icon={Bell}
                            label="Neural Alerts"
                            description="Receive notifications for task completions"
                            active={notifications}
                            onToggle={() => setNotifications(!notifications)}
                        />
                    </div>
                </SettingSection>

                <SettingSection title="System Access">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Shield size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white mb-1">Advanced Controls Locked</h4>
                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                Developer-level kernel modifications are currently restricted in the Beta environment. To request administrative access, please contact the Cortex engineering core.
                            </p>
                            <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                Review Permissions Protocol
                            </button>
                        </div>
                    </div>
                </SettingSection>

                <div className="mt-12 flex justify-end gap-4">
                    <button
                        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        onClick={() => {
                            // Mock save
                            alert('Preferences synced with neural core.');
                        }}
                    >
                        <Save size={14} />
                        Sync Preference
                    </button>
                </div>
            </div>
        </div>
    );
};

// Re-using icon for consistency
const Settings2 = ({ size }) => <Smartphone size={size} />;

export default SettingsPage;
