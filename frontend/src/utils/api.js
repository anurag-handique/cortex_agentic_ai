/**
 * Centralized API utility for handling fetch requests with JWT authentication.
 */
const api = {
    async fetch(url, options = {}) {
        const token = localStorage.getItem('token');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Handle unauthorized - clear token and potentially redirect or prompt
            localStorage.removeItem('token');
            // We could trigger an event here for the UI to show login
            window.dispatchEvent(new Event('auth-error'));
        }

        return response;
    },

    async post(url, body, options = {}) {
        return this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options,
        });
    },

    async patch(url, body, options = {}) {
        return this.fetch(url, {
            method: 'PATCH',
            body: JSON.stringify(body),
            ...options,
        });
    },

    async get(url, options = {}) {
        return this.fetch(url, {
            method: 'GET',
            ...options,
        });
    }
};

export default api;
