// State Management Template
// ${name} - Created: ${date}

const ${name} = {
    state: {},
    listeners: new Set(),

    getState() {
        return { ...this.state };
    },

    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.notify();
    },

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    },

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    },

    reset() {
        this.state = {};
        this.notify();
    }
};

export default ${name};
