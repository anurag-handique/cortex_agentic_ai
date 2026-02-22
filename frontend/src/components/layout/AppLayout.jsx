import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = ({ children, onHistoryClick, title, user, onLoginClick, onLogout, onMonitorToggle, isMonitorOpen, activeTab, onTabChange }) => {
    return (
        <div className="flex h-screen w-screen bg-gray-950 overflow-hidden text-gray-200 font-sans">
            <Sidebar activeItem={activeTab} onTabChange={onTabChange} />
            <div className="flex-1 flex flex-col h-full min-w-0">
                <Header
                    onHistoryClick={onHistoryClick}
                    title={title}
                    user={user}
                    onLoginClick={onLoginClick}
                    onLogout={onLogout}
                    onMonitorToggle={onMonitorToggle}
                    isMonitorOpen={isMonitorOpen}
                    activeTab={activeTab}
                />

                <main className="flex-1 overflow-hidden relative flex flex-col">
                    <div className="flex-1 min-h-0 h-full w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
