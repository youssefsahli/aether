/**
 * Database Module
 * Handles IndexedDB operations for persistent storage
 */

const DB = {
    db: null,
    async init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('AetherDB', 2);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
                if (!db.objectStoreNames.contains('session')) db.createObjectStore('session', { keyPath: 'id' });
            };
            req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            req.onerror = reject;
        });
    },
    async set(store, key, val) {
        if (!this.db) return;
        return new Promise((resolve) => {
            const tx = this.db.transaction(store, 'readwrite');
            if (store === 'session') tx.objectStore(store).put(val);
            else tx.objectStore(store).put(val, key);
            tx.oncomplete = resolve;
        });
    },
    async get(store, key) {
        if (!this.db) return null;
        return new Promise((resolve) => {
            const tx = this.db.transaction(store, 'readonly');
            const req = tx.objectStore(store).get(key);
            req.onsuccess = () => resolve(req.result);
        });
    },
    async getAll(store) {
        if (!this.db) return [];
        return new Promise((resolve) => {
            const tx = this.db.transaction(store, 'readonly');
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => resolve(req.result);
        });
    },
    async clear(store) {
        if (!this.db) return;
        return new Promise(r => {
            const tx = this.db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = r;
        });
    }
};
