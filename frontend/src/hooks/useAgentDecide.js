import { useState, useRef, useCallback } from 'react';
import { streamAgentDecision } from '../services/agentService';

export const useAgentDecide = () => {
    const [decision, setDecision] = useState(null);
    const [status, setStatus] = useState('idle'); // 'idle' | 'analyzing' | 'decided' | 'error'
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const makeDecision = useCallback(async (input) => {
        setStatus('analyzing');
        setDecision(null);
        setError(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            await streamAgentDecision({
                input,
                signal: abortControllerRef.current.signal,
                onChunk: (parsedDecision) => {
                    setDecision(parsedDecision);
                    setStatus('decided');
                },
                onComplete: () => {
                    setStatus(prev => (prev === 'analyzing' ? 'decided' : prev));
                },
                onError: (err) => {
                    setError(err.message);
                    setStatus('error');
                }
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                setStatus('error');
            } else {
                setStatus('idle');
            }
        }
    }, []);

    const stopDecision = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus('idle');
    }, []);

    return { decision, status, error, makeDecision, stopDecision, setDecision, isLoading: status === 'analyzing' };
};
