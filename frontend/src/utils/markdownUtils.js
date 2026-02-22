/**
 * Markdown Normalization Utility - INTELLIGENT RENDERING
 * 
 * Ensures code blocks are properly displayed and distinguishes between 
 * inline identifiers and actual code blocks.
 */

const fixUnclosedCodeBlocks = (text) => {
    if (!text) return '';
    const fences = (text.match(/```/g) || []).length;
    if (fences % 2 !== 0) {
        return text + '\n```';
    }
    return text;
};

/**
 * Heuristic check for common explanation words to avoid false positive code detection
 */
const hasExplanationWords = (text) => {
    const words = ['defines', 'returns', 'takes', 'calculates', 'explains', 'shows', 'handles', 'implements'];
    const lower = text.toLowerCase();
    return words.some(word => lower.includes(word));
};

/**
 * Normalize markdown content from LLM streams with semantic classification
 */
export const normalizeMarkdown = (text) => {
    if (!text) return '';

    // STEP 1: Basic cleanup
    let normalized = text.replace(/\r\n/g, '\n');

    // STEP 2: Pre-process triple backticks
    // Convert short, single-line fenced blocks to inline code if they look like identifiers
    normalized = normalized.replace(/```([a-zA-Z0-9+#-]*)\s*([\s\S]*?)```/g, (match, lang, code) => {
        const trimmedCode = code.trim();
        const lines = trimmedCode.split('\n');

        // Detection heuristics for inline-able identifiers
        const isFunction = /^[a-zA-Z0-9_$.]+\(.*\)$/.test(trimmedCode);
        const isExtension = /^\.[a-z0-9]+$/i.test(trimmedCode);
        const isVariable = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedCode);
        const isSQL = /^[A-Z\s*]{3,}$/.test(trimmedCode) && (trimmedCode.includes('SELECT') || trimmedCode.includes('*'));

        const shouldBeInline = lines.length === 1 && (trimmedCode.length < 60 || isFunction || isExtension || isVariable || isSQL);

        if (shouldBeInline && !lang) {
            return ` \`${trimmedCode}\` `;
        }

        // Ensure block code has proper spacing/newlines for ReactMarkdown
        return `\n\n\`\`\`${lang}\n${trimmedCode}\n\`\`\`\n\n`;
    });

    // STEP 3: Detect identifiers in prose and wrap in backticks
    // We protect existing code blocks first
    const parts = normalized.split(/(```[\s\S]*?```|`[^`]*`)/g);

    const processedParts = parts.map(part => {
        if (part.startsWith('`')) return part;

        let p = part;

        // 1. Function calls: add_numbers(), Math.max(), .toString()
        p = p.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*\s*\([^)]*\))\b/g, '`$1`');

        // 2. Method-style properties: Math.PI, process.env (but not common names with periods)
        p = p.replace(/\b(Math\.[A-Z0-9_]+|process\.[a-z]+|console\.[a-z]+)\b/g, '`$1`');

        // 3. File extensions: .java, .js, .py, .cpp, .css, .html
        p = p.replace(/(^|[^a-zA-Z0-9_])(\.(java|js|py|cpp|c|h|css|html|ts|jsx|tsx|json|md|sh|yml|yaml))\b/g, '$1`$2`');

        // 4. Variables with underscores (camel_case_var)
        p = p.replace(/\b([a-zA-Z][a-zA-Z0-9]*_[a-zA-Z0-9_]+)\b/g, '`$1`');

        // 5. Common CLI/SQL patterns
        p = p.replace(/\b(SELECT\s+\*|DELETE\s+FROM|INSERT\s+INTO|ls\s+-l|git\s+[a-z]+)\b/ig, '`$1`');

        // 6. RAW HTML DETECTION: Identify tags like <div>, <span>, or common HTML boilerplate in prose
        // This prevents them from being stripped or rendered as DOM if the LLM skips backticks.
        p = p.replace(/(^|\s)(<[a-zA-Z!/][^>]*>)/g, (match, space, tag) => {
            // Avoid double-wrapping if already backticked (unlikely given parts logic but safe)
            if (tag.startsWith('`<') || tag.endsWith('>`')) return match;
            return `${space}\`${tag}\``;
        });

        return p;
    });

    normalized = processedParts.join('');

    // STEP 4: Handle aggressive HTML boilerplate (multi-line) that might not be fenced
    if (!normalized.includes('```') && (
        normalized.includes('<!DOCTYPE') ||
        normalized.includes('<html') ||
        (normalized.includes('<head') && normalized.includes('<body'))
    )) {
        // If it looks like a full HTML doc but has no fences, fence it
        normalized = `\`\`\`html\n${normalized.trim()}\n\`\`\``;
    }

    // STEP 5: Spacing and structural fixes
    // Minimal cleanup only - trust the backend's preservation of structure
    normalized = normalized
        .replace(/\n\s*([,.!?;:])/g, '$1 '); // orphaned punctuation without breaking newlines

    // STEP 5: Vertical rhythm cleanup
    normalized = fixUnclosedCodeBlocks(normalized);

    return normalized
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');
};

/**
 * Explicit Content Classification
 * Returns a list of semantic chunks with their types.
 */
export const classifyContent = (text) => {
    if (!text) return [];

    const blocks = text.split(/(```[\s\S]*?```)/g);
    const result = [];

    blocks.forEach(block => {
        if (!block) return;

        if (block.startsWith('```')) {
            const match = block.match(/^```([a-zA-Z0-9+#-]*)\s*\n?([\s\S]*?)?```$/);
            if (match) {
                result.push({
                    type: 'block_code',
                    language: match[1] || 'text',
                    content: (match[2] || '').trim()
                });
                return;
            }
        }

        // Split prose into paragraphs and lists
        const lines = block.split('\n');
        let currentPara = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                if (currentPara.length > 0) {
                    result.push({ type: 'paragraph', content: currentPara.join('\n') });
                    currentPara = [];
                }
                return;
            }

            if (/^(\d+\.|[-*+])\s+/.test(trimmed)) {
                if (currentPara.length > 0) {
                    result.push({ type: 'paragraph', content: currentPara.join('\n') });
                    currentPara = [];
                }
                result.push({ type: 'list_item', content: line });
            } else {
                currentPara.push(line);
            }
        });

        if (currentPara.length > 0) {
            result.push({ type: 'paragraph', content: currentPara.join('\n') });
        }
    });

    return result;
};

export const hasUnclosedCodeBlock = (text) => {
    if (!text) return false;
    const matches = text.match(/```/g);
    return matches && matches.length % 2 !== 0;
};
