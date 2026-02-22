import React from 'react';

/**
 * TableRenderer
 * 
 * Custom table components for rendering markdown tables with proper styling
 */

export const Table = ({ children }) => {
    return (
        <div className="my-6 overflow-x-auto rounded-xl border border-white/10 shadow-lg">
            <table className="min-w-full divide-y divide-white/10 bg-black/20">
                {children}
            </table>
        </div>
    );
};

export const TableHead = ({ children }) => {
    return (
        <thead className="bg-white/5">
            {children}
        </thead>
    );
};

export const TableBody = ({ children }) => {
    return (
        <tbody className="divide-y divide-white/5">
            {children}
        </tbody>
    );
};

export const TableRow = ({ children }) => {
    return (
        <tr className="hover:bg-white/5 transition-colors">
            {children}
        </tr>
    );
};

export const TableHeader = ({ children, align = 'left' }) => {
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
        <th className={`px-5 py-3 ${alignClass} text-xs font-bold text-gray-400 uppercase tracking-widest`}>
            {children}
        </th>
    );
};

export const TableCell = ({ children, align = 'left' }) => {
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
        <td className={`px-5 py-3 text-sm text-gray-300 ${alignClass}`}>
            {children}
        </td>
    );
};
