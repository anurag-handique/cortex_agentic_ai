import React from 'react';

/**
 * ListRenderer
 * 
 * Custom renderer for bullet and numbered lists with industry-standard hierarchy.
 * Ensures that list numbers and markers are prominent.
 */

export const UnorderedList = ({ children, ...props }) => {
    return (
        <ul
            className="list-none my-6 space-y-4 text-gray-200"
            {...props}
        >
            {children}
        </ul>
    );
};

export const OrderedList = ({ children, ...props }) => {
    return (
        <ol
            className="list-none my-8 space-y-8 text-gray-200"
            {...props}
        >
            {children}
        </ol>
    );
};

export const ListItem = ({ children, ordered, index, ...props }) => {
    return (
        <li className="flex gap-4 group/li">
            {/* List Marker */}
            <div className="flex-shrink-0 flex flex-col items-center pt-1.5">
                <div className={`flex items-center justify-center rounded-md font-bold text-[11px] uppercase tracking-tighter ${ordered
                        ? 'w-6 h-6 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-sm transition-colors group-hover/li:bg-indigo-600/30'
                        : 'w-1.5 h-1.5 mt-2.5 bg-gray-600 rounded-full group-hover/li:bg-blue-400 transition-colors'
                    }`}>
                    {ordered ? (index + 1) : null}
                </div>
            </div>

            {/* Content Container - Forces indentation for all children */}
            <div className="flex-grow min-w-0 flex flex-col gap-1 overflow-visible">
                {children}
            </div>
        </li>
    );
};
