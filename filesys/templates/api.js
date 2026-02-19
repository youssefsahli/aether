// API Service Template
// ${name} - Created: ${date}

const ${name} = {
    baseURL: '/api',

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.ok;
    }
};

export default ${name};
