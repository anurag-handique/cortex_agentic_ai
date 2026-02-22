/**
 * Stream Parser Utility
 * 
 * Optimized buffering and parsing layer for LLM streaming responses.
 * Ensures the stream remains responsive while handling incomplete markdown markers.
 */

export class StreamParser {
    constructor() {
        this.buffer = '';
    }

    /**
     * Add a new chunk to the parser
     * @param {string} chunk - New text chunk from the stream
     * @returns {string} - Current buffer (unmodified for responsiveness)
     */
    addChunk(chunk) {
        if (!chunk) return this.buffer;
        this.buffer += chunk;
        return this.buffer;
    }

    /**
     * Get content that is safe to render
     * For responsiveness, we return the full buffer.
     * The MarkdownRenderer's normalization layer will handle unclosed blocks.
     * @returns {string} - Content safe to render
     */
    getSafeContent() {
        return this.buffer;
    }

    /**
     * Finalize parsing - return all content
     * @returns {string}
     */
    finalize() {
        return this.buffer;
    }

    /**
     * Reset the parser state
     */
    reset() {
        this.buffer = '';
    }

    /**
     * Get current buffer length
     * @returns {number}
     */
    getBufferLength() {
        return this.buffer.length;
    }

    /**
     * Check if there's an unclosed code block
     * @returns {boolean}
     */
    hasUnclosedCodeBlock() {
        const matches = this.buffer.match(/```/g);
        return matches && matches.length % 2 !== 0;
    }
}
