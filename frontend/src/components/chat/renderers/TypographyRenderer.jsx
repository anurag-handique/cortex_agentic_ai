import React from 'react';

/**
 * ParagraphRenderer
 * 
 * Custom paragraph renderer for optimal typography and streaming cursor integration
 */
export const Paragraph = ({ children, isLast, isStreaming, className = '', isSubLabel = false }) => {
    return (
        <p className={`leading-7 text-gray-200 mb-5 font-sans antialiased ${className} ${isSubLabel ? 'mt-4 mb-2 text-indigo-300 font-bold text-sm tracking-wide' : ''
            }`}>
            {children}
            {/* Show cursor only on the last paragraph during streaming */}
            {isLast && isStreaming && (
                <span
                    className="inline-block w-1.5 h-4 ml-1.5 align-middle bg-blue-400/80 animate-pulse rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                    aria-hidden="true"
                />
            )}
        </p>
    );
};

export const InlineCode = ({ children }) => {
    return (
        <code className="bg-white/10 text-blue-300 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono border border-white/5 mx-0.5">
            {children}
        </code>
    );
};

export const Blockquote = ({ children }) => {
    return (
        <blockquote className="border-l-4 border-indigo-500/30 pl-6 italic text-gray-400 my-8 bg-indigo-500/5 py-4 rounded-r-xl">
            {children}
        </blockquote>
    );
};

export const HorizontalRule = () => {
    return <hr className="my-10 border-white/5" />;
};

export const Link = ({ href, children, ...props }) => {
    return (
        <a
            href={href}
            className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors font-medium"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {children}
        </a>
    );
};

export const Strong = ({ children }) => {
    return <strong className="font-bold text-white">{children}</strong>;
};

export const Emphasis = ({ children }) => {
    return <em className="italic text-gray-300">{children}</em>;
};
