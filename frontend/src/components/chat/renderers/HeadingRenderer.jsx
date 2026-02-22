import React from 'react';

/**
 * HeadingRenderer
 * 
 * Custom heading components with proper hierarchy and styling
 */

export const Heading1 = ({ children }) => {
    return (
        <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/5 pb-2 tracking-tight">
            {children}
        </h1>
    );
};

export const Heading2 = ({ children }) => {
    return (
        <h2 className="text-xl font-bold text-white mt-6 mb-3 tracking-tight">
            {children}
        </h2>
    );
};

export const Heading3 = ({ children }) => {
    return (
        <h3 className="text-lg font-bold text-white mt-5 mb-2 tracking-tight">
            {children}
        </h3>
    );
};

export const Heading4 = ({ children }) => {
    return (
        <h4 className="text-base font-bold text-gray-200 mt-4 mb-2 tracking-tight">
            {children}
        </h4>
    );
};

export const Heading5 = ({ children }) => {
    return (
        <h5 className="text-sm font-bold text-gray-300 mt-3 mb-1.5 tracking-tight uppercase">
            {children}
        </h5>
    );
};

export const Heading6 = ({ children }) => {
    return (
        <h6 className="text-sm font-semibold text-gray-400 mt-3 mb-1.5 tracking-wide uppercase">
            {children}
        </h6>
    );
};
