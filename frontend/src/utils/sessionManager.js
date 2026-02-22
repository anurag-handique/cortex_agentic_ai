/**
 * Simple session manager to persist session ID across reloads.
 * This ensures the backend remembers the context.
 */

const STORAGE_KEY = 'cortex_session_id';

const TASK_STORAGE_KEY = 'cortex_task_session_id';

export const getSessionId = () => {
    let sessionId = localStorage.getItem(STORAGE_KEY);
    if (!sessionId) {
        // Generate a simple random ID if none exists
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(STORAGE_KEY, sessionId);
    }
    return sessionId;
};

export const getTaskSessionId = () => {
    let sessionId = localStorage.getItem(TASK_STORAGE_KEY);
    if (!sessionId) {
        sessionId = 'task_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(TASK_STORAGE_KEY, sessionId);
    }
    return sessionId;
};

export const setSessionId = (sessionId) => {
    localStorage.setItem(STORAGE_KEY, sessionId);
    // Dispatch an event so components can react to session changes if needed
    window.dispatchEvent(new Event('session-changed'));
    return sessionId;
};

export const setTaskSessionId = (sessionId) => {
    localStorage.setItem(TASK_STORAGE_KEY, sessionId);
    return sessionId;
};

export const resetSessionId = () => {
    localStorage.removeItem(STORAGE_KEY);
    return getSessionId(); // Generate new one
};

export const resetTaskSessionId = () => {
    localStorage.removeItem(TASK_STORAGE_KEY);
    return getTaskSessionId();
};
