import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

const UserMenu = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const initials = user.firstName ? user.firstName[0].toUpperCase() : 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-3 py-1.5 border-l border-white/10 ml-2 group focus:outline-none transition-all"
            >
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 ring-1 ring-white/20 group-hover:ring-white/40 group-hover:scale-105">
                        {initials}
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-start mr-1">
                    <span className="text-sm font-bold text-gray-100 group-hover:text-blue-400 transition-colors tracking-tight">
                        {user.firstName} {user.lastName}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-all duration-500 group-hover:text-gray-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-64 glass-panel rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 origin-top-right border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {/* User Profile Header */}
                    <div className="relative px-4 py-4 mb-2 overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-inner">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-lg font-black text-white shadow-2xl shadow-blue-500/20 ring-1 ring-white/30">
                                {initials}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-white tracking-tight leading-none">
                                    {user.firstName} {user.lastName}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    Standard Account
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
