import React from 'react';

const Badge = ({ children, variant = 'info', className = '', icon: Icon }) => {
    const variants = {
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border border-red-500/20",
        neutral: "bg-gray-800 text-gray-400 border border-gray-700",
        purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {children}
        </span>
    );
};

export default Badge;
