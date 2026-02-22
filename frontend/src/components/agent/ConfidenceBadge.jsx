import React from 'react';

const ConfidenceBadge = ({ score }) => {
    // Score is 0-1 or 0-100
    const percentage = score <= 1 ? score * 100 : score;

    let colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (percentage < 50) colorClass = "text-red-400 bg-red-500/10 border-red-500/20";
    else if (percentage < 80) colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";

    return (
        <div className={`px-2.5 py-1 rounded-full border text-xs font-mono font-medium flex items-center gap-2 ${colorClass}`}>
            <span>CONFIDENCE</span>
            <span className="w-px h-3 bg-current opacity-20" />
            <span>{percentage.toFixed(1)}%</span>
        </div>
    );
};

export default ConfidenceBadge;
