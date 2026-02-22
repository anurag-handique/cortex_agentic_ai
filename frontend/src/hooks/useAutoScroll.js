import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAutoScroll Hook
 * 
 * Manages auto-scrolling for a container, respecting manual user overrides.
 * 
 * @param {any} dependency - The state/data that changes (e.g., messages, chunks) to trigger scroll.
 * @param {boolean} active - Whether auto-scroll should be active (e.g., during loading).
 */
export const useAutoScroll = (dependency, active) => {
    const scrollRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Threshold in pixels to determine if we're "at the bottom"
    const THRESHOLD = 100;

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        const atBottom = distanceFromBottom < THRESHOLD;
        setIsAtBottom(atBottom);

        // Show a "Scroll to latest" button if busy and not at bottom
        setShowScrollButton(active && !atBottom);
    }, [active]);

    // Handle scroll events to detect manual user movement
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        container.addEventListener('scroll', checkScroll);
        return () => container.removeEventListener('scroll', checkScroll);
    }, [checkScroll]);

    // Perform the actual scroll
    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }, []);

    // Effect to trigger scroll when dependency changes (streaming chunks/new messages)
    useEffect(() => {
        if (isAtBottom && active) {
            // Use 'auto' (instant) for high-frequency updates to prevent "fighting" user scroll
            // and avoiding browser lag from repeated smooth scroll animations.
            scrollToBottom(false);
        }
    }, [dependency, active, isAtBottom, scrollToBottom]);

    return {
        scrollRef,
        scrollToBottom,
        showScrollButton,
        isAtBottom
    };
};
