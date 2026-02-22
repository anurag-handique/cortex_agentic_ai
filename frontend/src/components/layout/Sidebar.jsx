import React, { useState } from 'react';
import {
    MessageSquareText,
    Cpu,
    Terminal,
    Database,
    Settings2,
    Activity
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group mb-1 relative overflow-hidden
      ${active
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
            }`}
    >
        {active && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent shadow-[inset_10px_0_20px_-10px_rgba(59,130,246,0.5)] transition-all duration-300" />
        )}

        <div className={`relative z-10 p-1.5 rounded-md transition-all duration-300 ${active ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'group-hover:text-blue-400'}`}>
            <Icon className={`w-4 h-4 ${active ? 'text-white' : ''}`} />
        </div>

        <span className={`relative z-10 tracking-wide ${active ? 'text-blue-100 text-glow' : ''}`}>{label}</span>

        {active && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)] mr-3"></div>
        )}
    </button>
);

const Sidebar = ({ activeItem, onTabChange }) => {

    return (
        <div
            className="w-72 h-screen flex flex-col pt-2 pb-6 border-r border-white/5 bg-gray-950/30 backdrop-blur-xl relative z-20">
            {/* Ambient sidebar glow */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-900/20 blur-[140px] pointer-events-none" />

            <div className="flex flex-col items-center justify-center pt-6 pb-4 relative">

                {/* Logo */}
                <div className="relative group">

                    {/* Logo glow (no container) */}
                    <div
                        className="absolute inset-0
      bg-cyan-500/10
      blur-[40px]
      opacity-30
      group-hover:opacity-50
      transition duration-700"
                    />

                    <img
                        src="/logo_main.png"
                        alt="Cortex AI Assistant"
                        className="
        h-20 md:h-24 w-auto object-contain
        relative z-10
        drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]
        transition-transform duration-500
        group-hover:scale-105
      "
                    />
                </div>

                {/* Glowing Divider */}
                <div className="relative w-2/3 mt-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
                    <div className="absolute inset-0 h-px blur-md bg-cyan-400/70" />
                </div>

            </div>


            <div className="flex-1 px-4 space-y-1">
                <SidebarItem icon={MessageSquareText} label="Chat Agent" active={activeItem === 'Chat Agent'}
                    onClick={() => onTabChange('Chat Agent')} />
                <SidebarItem icon={Cpu} label="My Agent" active={activeItem === 'My Agent'}
                    onClick={() => onTabChange('My Agent')} />
                <SidebarItem icon={Database} label="Memory" active={activeItem === 'Memory'}
                    onClick={() => onTabChange('Memory')} />

                <SidebarItem icon={Settings2} label="Settings" active={activeItem === 'Settings'}
                    onClick={() => onTabChange('Settings')} />
            </div>

            <div className="px-6 pb-2">
                <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="px-2 py-0.5 rounded-sm bg-blue-500/20 border border-blue-500/30">
                        <span className="text-[9px] text-blue-400 font-mono tracking-widest font-bold">V.1.0.2 • BETA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
