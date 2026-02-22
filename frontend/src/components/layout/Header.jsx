import { Settings, History, User, LogOut, Activity, Cpu } from 'lucide-react';
import UserMenu from './UserMenu';

const Header = ({ onHistoryClick, title, user, onLoginClick, onLogout, onMonitorToggle, isMonitorOpen, activeTab }) => {

    return (
        <header className="h-20 flex items-center justify-between px-8">
            {/* Left: Page Title */}
            <div className="flex-1 min-w-0">
                <h2 className="text-xl font-display font-medium text-gray-200 truncate">
                    {title || ''}
                </h2>
            </div>

            {/* Right: Status & Auth */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 mr-2">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                    </div>
                    <span className="text-xs font-medium text-gray-300 tracking-wide font-mono">AUTONOMY: PULSING</span>
                </div>


                {activeTab === 'My Agent' && (
                    <button
                        onClick={onMonitorToggle}
                        className={`transition-all p-2 rounded-full ${isMonitorOpen ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Task Monitor"
                    >
                        <Activity className="w-5 h-5" />
                    </button>
                )}


                <button
                    onClick={onHistoryClick}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    title="History"
                >
                    <History className="w-5 h-5" />
                </button>


                {user ? (
                    <UserMenu user={user} onLogout={onLogout} />
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-200 transition-all font-display"
                    >
                        <User className="w-4 h-4" />
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
