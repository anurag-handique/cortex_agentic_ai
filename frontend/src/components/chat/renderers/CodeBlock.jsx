import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

/**
 * CodeBlock
 * 
 * High-end code block renderer with Terminal-style logic for short commands
 * and documentation-style rendering for larger source files.
 */
const CodeBlock = ({ language, value, compact = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    // Normalize language identifier
    let normalizedLanguage = language?.toLowerCase().trim() || 'text';
    if (normalizedLanguage === 'jav') normalizedLanguage = 'java';
    if (normalizedLanguage === 'py') normalizedLanguage = 'python';
    if (normalizedLanguage === 'js') normalizedLanguage = 'javascript';
    if (['html', 'htm', 'markup', 'xml'].includes(normalizedLanguage)) normalizedLanguage = 'markup';

    const displayLanguage = normalizedLanguage === 'text' ? 'code' : normalizedLanguage.toUpperCase();

    // === RENDER COMPACT MODE (SHELL/BASH COMMANDS) ===
    if (compact) {
        return (
            <div className="flex items-center gap-4 bg-gray-900/60 border border-white/10 rounded-xl px-4 py-2 my-4 group/compact hover:bg-gray-900/80 transition-colors w-fit min-w-[280px] max-w-full">
                <Terminal className="w-3.5 h-3.5 text-blue-400 opacity-60 flex-shrink-0" />
                <code className="text-[13px] font-mono text-blue-50/90 whitespace-pre overflow-x-auto scroller-hidden flex-grow">
                    {value}
                </code>
                <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all opacity-40 group-hover/compact:opacity-100"
                    title="Copy command"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        );
    }

    // === RENDER FULL DOCUMENTATION MODE (SOURCE CODE) ===
    return (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0b0e14] shadow-2xl group/code my-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c2128] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 px-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <Code2 className="w-3.5 h-3.5 text-blue-400 opacity-80" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-[0.15em] text-gray-400">
                            {displayLanguage}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all transform active:scale-95"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[9px] font-black uppercase tracking-widest min-w-[35px]">
                        {copied ? 'Done' : 'Copy'}
                    </span>
                </button>
            </div>

            {/* Code Body */}
            <div className="relative overflow-x-auto">
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={normalizedLanguage}
                    PreTag="div"
                    showLineNumbers={true}
                    wrapLines={true}
                    customStyle={{
                        backgroundColor: 'transparent',
                        margin: 0,
                        padding: '1.25rem',
                        fontSize: '13.5px',
                        lineHeight: '1.6',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    }}
                    lineNumberStyle={{
                        minWidth: '2.5em',
                        paddingRight: '1.5em',
                        color: '#484f58',
                        textAlign: 'right',
                        opacity: 0.5,
                        userSelect: 'none'
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default CodeBlock;
