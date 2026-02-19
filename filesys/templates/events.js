// Event Handler Template
// ${name} - Created: ${date}

'use strict';

class ${name} {
    constructor(element) {
        this.element = element;
        this.boundHandlers = new Map();
        this.init();
    }

    init() {
        this.on('click', this.handleClick);
        this.on('keydown', this.handleKeydown);
    }

    on(event, handler) {
        const bound = handler.bind(this);
        this.boundHandlers.set(handler, bound);
        this.element.addEventListener(event, bound);
    }

    off(event, handler) {
        const bound = this.boundHandlers.get(handler);
        if (bound) {
            this.element.removeEventListener(event, bound);
            this.boundHandlers.delete(handler);
        }
    }

    handleClick(e) {
        console.log('Click:', e.target);
    }

    handleKeydown(e) {
        console.log('Key:', e.key);
    }

    destroy() {
        this.boundHandlers.forEach((bound, original) => {
            this.element.removeEventListener('click', bound);
            this.element.removeEventListener('keydown', bound);
        });
        this.boundHandlers.clear();
    }
}

export default ${name};
