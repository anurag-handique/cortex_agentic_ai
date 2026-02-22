import React, { useMemo, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { normalizeMarkdown, classifyContent } from '../../../utils/markdownUtils';

// Import custom renderers
import CodeBlock from './CodeBlock';
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from './HeadingRenderer';
import { UnorderedList, OrderedList, ListItem } from './ListRenderer';
import { Paragraph, InlineCode, Blockquote, HorizontalRule, Link, Strong, Emphasis } from './TypographyRenderer';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './TableRenderer';

/**
 * MarkdownContext
 * Tracks nesting depth and parent container types for block-aware rendering.
 */
const MarkdownContext = createContext({
    depth: 0,
    isInList: false,
    listType: null
});

/**
 * Contextual Element Wrappers
 */
const ContextParagraph = ({ node, children, isStreaming, processedContent }) => {
    const context = useContext(MarkdownContext);
    const isLast = isStreaming && node?.position?.end?.offset >= (processedContent.length - 15);

    // Detect OS-specific or condition-specific labels
    const textContent = (node.children || []).map(child => child.value || '').join('');
    const isSubLabel = /^(For|If|When|Note|Caution|Tip):/i.test(textContent.trim());

    return (
        <Paragraph
            isLast={isLast}
            isStreaming={isStreaming}
            className={context.isInList ? 'ml-0 my-2 opacity-95' : ''}
            isSubLabel={isSubLabel}
        >
            {children}
        </Paragraph>
    );
};

const ContextCode = ({ node, inline, className, children }) => {
    const context = useContext(MarkdownContext);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline) {
        const codeContent = String(children || '').replace(/\n$/, '');

        // MANDATORY: Identify if this "block" should actually be inline (e.g. function names)
        const isSingleIdentifier = !codeContent.includes('\n') && (
            codeContent.length < 60 ||
            /^[a-zA-Z0-9_$.]+\(.*\)$/.test(codeContent) ||
            /^\.[a-zA-Z0-9]+$/.test(codeContent)
        );

        if (isSingleIdentifier) {
            return <InlineCode>{children}</InlineCode>;
        }

        const isShortCommand = codeContent.length < 120 && codeContent.split('\n').length <= 3;

        return (
            <div className={`${context.isInList ? 'mb-4 mt-2' : 'my-8'} ${isShortCommand ? 'max-w-max' : 'w-full'}`}>
                <CodeBlock
                    language={language || 'bash'}
                    value={codeContent}
                    compact={isShortCommand}
                />
            </div>
        );
    }

    return <InlineCode>{children}</InlineCode>;
};

const ContextList = ({ ordered, children }) => {
    const parentContext = useContext(MarkdownContext);
    const contextValue = useMemo(() => ({
        depth: parentContext.depth + 1,
        isInList: true,
        listType: ordered ? 'ol' : 'ul'
    }), [parentContext.depth, ordered]);

    const ListComponent = ordered ? OrderedList : UnorderedList;

    return (
        <MarkdownContext.Provider value={contextValue}>
            <ListComponent>{children}</ListComponent>
        </MarkdownContext.Provider>
    );
};

/**
 * MarkdownRenderer
 */
const MarkdownRenderer = ({ content, isStreaming }) => {
    // Process content through intelligent normalization
    const normalizedContent = normalizeMarkdown(content || '');

    // Note: We no longer sanitize the raw Markdown string with DOMPurify because 
    // it destroys HTML code blocks and boilerplate. Safety is ensured by:
    // 1. ReactMarkdown (no rehype-raw) which escapes all raw HTML automatically.
    // 2. normalizeMarkdown which wraps prose tags in backticks.
    // 3. CodeBlock which uses a safe syntax highlighter.
    const processedContent = normalizedContent;

    const components = useMemo(() => ({
        p: (props) => <ContextParagraph {...props} isStreaming={isStreaming} processedContent={processedContent} />,
        h1: Heading1,
        h2: Heading2,
        h3: Heading3,
        h4: Heading4,
        h5: Heading5,
        h6: Heading6,
        ul: (props) => <ContextList {...props} ordered={false} />,
        ol: (props) => <ContextList {...props} ordered={true} />,
        li: ListItem,
        pre: ({ children }) => <>{children}</>,
        code: ContextCode,
        table: Table,
        thead: TableHead,
        tbody: TableBody,
        tr: TableRow,
        th: ({ align, children, ...props }) => <TableHeader align={align}>{children}</TableHeader>,
        td: ({ align, children, ...props }) => <TableCell align={align}>{children}</TableCell>,
        blockquote: Blockquote,
        hr: HorizontalRule,
        a: Link,
        strong: Strong,
        em: Emphasis,
    }), [isStreaming, processedContent]);

    // PRE-RENDER CLASSIFICATION STEP
    const classifiedChunks = useMemo(() => classifyContent(processedContent), [processedContent]);

    return (
        <div className="prose prose-invert prose-blue max-w-none min-w-0">
            {classifiedChunks.map((chunk, index) => {
                // If it's a block code chunk, render it directly using CodeBlock (respecting classification)
                if (chunk.type === 'block_code') {
                    const isShortCommand = chunk.content.length < 120 && chunk.content.split('\n').length <= 3;
                    return (
                        <div key={index} className={`my-8 ${isShortCommand ? 'max-w-max' : 'w-full'}`}>
                            <CodeBlock
                                language={chunk.language}
                                value={chunk.content}
                                compact={isShortCommand}
                            />
                        </div>
                    );
                }

                // For everything else, use ReactMarkdown to handle structural markdown
                return (
                    <ReactMarkdown
                        key={index}
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {chunk.content}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
};

export default MarkdownRenderer;
