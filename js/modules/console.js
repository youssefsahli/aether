/**
 * Console Module - REPL-like Interface
 * Executes code in the main thread context with access to all app modules
 * Variables and functions persist across evaluations like a Lisp REPL
 */

const Console = {
    MAX_LOGS: 200,
    currentSuggestionIndex: -1,
    suggestions: [],
    
    // REPL environment - stores all user-defined bindings
    env: {
        bindings: new Map(),  // name -> { value, type, source }
        history: [],
    },
    
    /**
     * Initialize the REPL environment
     */
    init() {
        // Create a namespace for user variables to avoid polluting window
        if (!window.__repl__) {
            window.__repl__ = {};
        }
        // Console will be hooked on first code execution
    },
    
    /**
     * Parse code to extract declarations (var, let, const, function, class)
     */
    _parseDeclarations(code) {
        const declarations = [];
        
        // Simple variable declarations: var x, let y = 1, const z = 2
        const simpleVarRegex = /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=|,|;|$)/g;
        let match;
        
        while ((match = simpleVarRegex.exec(code)) !== null) {
            const kind = match[1];
            const name = match[2];
            if (name && !declarations.find(d => d.name === name)) {
                declarations.push({ name, kind });
            }
        }
        
        // Function declarations: function foo() {}
        const funcRegex = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        while ((match = funcRegex.exec(code)) !== null) {
            const name = match[1];
            if (name && !declarations.find(d => d.name === name)) {
                declarations.push({ name, kind: 'function' });
            }
        }
        
        // Class declarations: class Foo {}
        const classRegex = /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:extends\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\{/g;
        while ((match = classRegex.exec(code)) !== null) {
            const name = match[1];
            if (name && !declarations.find(d => d.name === name)) {
                declarations.push({ name, kind: 'class' });
            }
        }
        
        // Async function declarations
        const asyncFuncRegex = /\basync\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        while ((match = asyncFuncRegex.exec(code)) !== null) {
            const name = match[1];
            if (name && !declarations.find(d => d.name === name)) {
                declarations.push({ name, kind: 'async function' });
            }
        }
        
        return declarations;
    },
    
    /**
     * Get type info for a value
     */
    _getTypeInfo(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'function') {
            const str = Function.prototype.toString.call(value);
            if (/^class\s/.test(str)) return 'class';
            if (/^async\s/.test(str)) return 'async function';
            return 'function';
        }
        return typeof value;
    },
    
    /**
     * Serialize a value for display
     */
    _serializeValue(value, depth = 0, maxDepth = 2) {
        if (depth > maxDepth) return '[...]';
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        
        const type = typeof value;
        
        if (type === 'function') {
            const str = value.toString();
            const firstLine = str.split('\n')[0];
            return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
        }
        
        if (type === 'object') {
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                if (value.length <= 5 && depth < maxDepth) {
                    const items = value.map(v => this._serializeValue(v, depth + 1, maxDepth));
                    return `[${items.join(', ')}]`;
                }
                return `Array(${value.length})`;
            }
            
            try {
                const keys = Object.keys(value);
                if (keys.length === 0) return '{}';
                if (keys.length <= 3 && depth < maxDepth) {
                    const pairs = keys.map(k => `${k}: ${this._serializeValue(value[k], depth + 1, maxDepth)}`);
                    return `{${pairs.join(', ')}}`;
                }
                // Check for constructor name
                const ctorName = value.constructor?.name;
                if (ctorName && ctorName !== 'Object') {
                    return `${ctorName} {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`;
                }
                return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`;
            } catch (e) {
                return '[Object]';
            }
        }
        
        if (type === 'string') {
            if (value.length > 50) return `"${value.substring(0, 50)}..."`;
            return JSON.stringify(value);
        }
        
        return String(value);
    },
    
    /**
     * Store a binding in the REPL environment
     */
    _define(name, value, source = 'eval') {
        const type = this._getTypeInfo(value);
        this.env.bindings.set(name, { value, type, source });
        // Also make available globally for future evals
        window.__repl__[name] = value;
        window[name] = value;  // For direct access
    },
    
    /**
     * Hook console methods to display in REPL
     */
    _hookConsole() {
        if (this._consoleHooked) return;
        this._consoleHooked = true;
        
        const self = this;
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalTable = console.table;
        
        // Store originals for restoration
        this._originalConsole = { log: originalLog, error: originalError, warn: originalWarn, info: originalInfo, table: originalTable };
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            self.displayOutput(args.map(a => self._formatArg(a)).join(' '), 'log');
        };
        
        console.error = function(...args) {
            originalError.apply(console, args);
            self.displayOutput(args.map(a => self._formatArg(a)).join(' '), 'error');
        };
        
        console.warn = function(...args) {
            originalWarn.apply(console, args);
            self.displayOutput(args.map(a => self._formatArg(a)).join(' '), 'warn');
        };
        
        console.info = function(...args) {
            originalInfo.apply(console, args);
            self.displayOutput(args.map(a => self._formatArg(a)).join(' '), 'info');
        };
        
        console.table = function(data, ...args) {
            originalTable.apply(console, [data, ...args]);
            try {
                self.displayOutput(JSON.stringify(data, null, 2), 'log');
            } catch (e) {
                self.displayOutput(String(data), 'log');
            }
        };
    },
    
    /**
     * Format an argument for display
     */
    _formatArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
            return JSON.stringify(arg, null, 2);
        } catch (e) {
            return String(arg);
        }
    },
    
    /**
     * Execute file code and capture all definitions
     */
    async executeInContext(code) {
        // Hook console to display output in REPL
        this._hookConsole();
        
        if (!code || !code.trim()) {
            return {
                success: false,
                error: 'No code to execute'
            };
        }
        
        try {
            // Parse declarations before execution
            const declarations = this._parseDeclarations(code);
            
            // Transform const/let to var so they go to global scope
            // This allows them to be captured and used in REPL
            let transformedCode = code
                .replace(/\bconst\s+/g, 'var ')
                .replace(/\blet\s+/g, 'var ');
            
            // Use indirect eval for global scope
            const globalEval = eval;
            let result;
            
            try {
                result = globalEval(transformedCode);
            } catch (e) {
                // If it fails and code has await, try async wrapper
                if (code.includes('await')) {
                    const asyncCode = `(async () => {\n${transformedCode}\n})()`;
                    result = await globalEval(asyncCode);
                } else {
                    throw e;
                }
            }
            
            // Capture declared variables from window
            for (const decl of declarations) {
                try {
                    let value;
                    if (typeof window[decl.name] !== 'undefined') {
                        value = window[decl.name];
                        this._define(decl.name, value, decl.kind);
                    }
                } catch (e) {
                    // Silently ignore capture failures
                }
            }
            
            this.env.history.push({ code, timestamp: Date.now() });
            
            return {
                success: true,
                result: this._serializeValue(result),
                bindings: this.getBindings()
            };
        } catch (err) {
            return {
                success: false,
                error: err.message,
                stack: err.stack
            };
        }
    },
    
    /**
     * Evaluate a single expression/statement (REPL input)
     */
    async evaluateInContext(code) {
        // Hook console to display output in REPL
        this._hookConsole();
        
        // Use indirect eval for global scope
        const globalEval = eval;
        
        try {
            // Parse for any new declarations
            const declarations = this._parseDeclarations(code);
            
            // Check for simple assignment: x = 5
            const assignmentMatch = code.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/s);
            
            // Transform const/let to var for global scope
            let transformedCode = code
                .replace(/\bconst\s+/g, 'var ')
                .replace(/\blet\s+/g, 'var ');
            
            let result;
            
            // Try to evaluate with global eval
            if (code.includes('await')) {
                result = await globalEval(`(async () => { return ${transformedCode}; })()`);
            } else {
                result = globalEval(transformedCode);
            }
            
            // Capture any new declarations
            for (const decl of declarations) {
                try {
                    let value;
                    if (typeof window[decl.name] !== 'undefined') {
                        value = window[decl.name];
                        this._define(decl.name, value, decl.kind);
                    }
                } catch (e) {}
            }
            
            // Capture simple assignments
            if (assignmentMatch && declarations.length === 0) {
                const name = assignmentMatch[1];
                try {
                    const value = typeof window[name] !== 'undefined' ? window[name] : globalEval(name);
                    this._define(name, value, 'assignment');
                } catch (e) {}
            }
            
            return {
                success: true,
                result: this._serializeValue(result),
                resultType: this._getTypeInfo(result),
                bindings: this.getBindings()
            };
        } catch (err) {
            return {
                success: false,
                error: err.message,
                stack: err.stack
            };
        }
    },
    
    /**
     * Get all current bindings
     */
    getBindings() {
        const result = [];
        for (const [name, info] of this.env.bindings) {
            result.push({
                name,
                type: info.type,
                source: info.source
            });
        }
        return result;
    },
    
    /**
     * Clear REPL context
     */
    clearContext() {
        for (const name of this.env.bindings.keys()) {
            delete window.__repl__[name];
            delete window[name];
        }
        this.env.bindings.clear();
        this.env.history = [];
        this.displayOutput('Context cleared', 'info');
    },

    displayInput(code) {
        const logBox = document.getElementById('console-logs');
        if (!logBox) return;

        this.cleanupIfNeeded(logBox);

        const entry = document.createElement('div');
        entry.className = 'console-input-entry';
        entry.style.color = 'var(--accent)';
        entry.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        entry.style.padding = '2px 0';
        entry.style.fontWeight = '600';
        entry.innerText = `» ${code}`;
        logBox.appendChild(entry);

        requestAnimationFrame(() => { logBox.scrollTop = logBox.scrollHeight; });
    },

    displayOutput(text, method = 'log') {
        const logBox = document.getElementById('console-logs');
        if (!logBox) return;

        this.cleanupIfNeeded(logBox);

        const entry = document.createElement('div');
        entry.className = `console-output-entry console-${method}`;
        
        const colorMap = {
            'error': 'var(--log-error)',
            'warn': 'var(--log-warn)',
            'info': 'var(--log-info)',
            'result': 'var(--accent)',
            'log': 'var(--text)'
        };

        entry.style.color = colorMap[method] || 'var(--text)';
        entry.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        entry.style.padding = '2px 0';
        entry.style.whiteSpace = 'pre-wrap';
        entry.style.wordBreak = 'break-word';
        
        if (method === 'result') {
            entry.style.fontStyle = 'italic';
        }

        entry.innerText = `  ${text}`;
        logBox.appendChild(entry);

        if (logBox.scrollHeight - logBox.scrollTop <= logBox.clientHeight + 50) {
            requestAnimationFrame(() => { logBox.scrollTop = logBox.scrollHeight; });
        }
    },

    cleanupIfNeeded(logBox) {
        if (logBox.children.length >= this.MAX_LOGS) {
            const toRemove = logBox.children.length - this.MAX_LOGS + 1;
            for (let i = 0; i < toRemove; i++) {
                logBox.removeChild(logBox.firstChild);
            }
        }
    },

    /**
     * Get suggestions for autocomplete - discovers globals dynamically
     */
    getSuggestions(input) {
        try {
            const suggestions = [];
            const trimmed = input.trim();
            if (!trimmed) return [];
            
            if (trimmed.includes('.')) {
                // Property completion
                const parts = trimmed.split('.');
                let context = null;
                
                // Resolve the base object
                try {
                    context = eval(parts[0]);
                } catch (e) {
                    return [];
                }

                // Navigate nested properties
                for (let i = 1; i < parts.length - 1; i++) {
                    const part = parts[i].trim();
                    if (!part || context == null) return [];
                    try {
                        context = context[part];
                    } catch (e) {
                        return [];
                    }
                }

                if (context == null) return [];

                const prefix = parts[parts.length - 1].trim().toLowerCase();
                const seen = new Set();

                // Get own properties
                if (typeof context === 'object' || typeof context === 'function') {
                    try {
                        // Own keys
                        for (const key of Object.keys(context)) {
                            if (key.toLowerCase().startsWith(prefix) && !seen.has(key)) {
                                const type = this._getTypeInfo(context[key]);
                                suggestions.push({ name: key, type });
                                seen.add(key);
                            }
                        }
                        
                        // Prototype methods
                        let proto = Object.getPrototypeOf(context);
                        while (proto && proto !== Object.prototype) {
                            for (const key of Object.getOwnPropertyNames(proto)) {
                                if (key !== 'constructor' && 
                                    key.toLowerCase().startsWith(prefix) && 
                                    !seen.has(key)) {
                                    const type = this._getTypeInfo(proto[key]);
                                    suggestions.push({ name: key, type, fromProto: true });
                                    seen.add(key);
                                }
                            }
                            proto = Object.getPrototypeOf(proto);
                        }
                    } catch (e) {}
                }
                
                return suggestions.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 30);
            } else {
                // Global completion
                const prefix = trimmed.toLowerCase();
                const seen = new Set();
                
                // REPL bindings (user-defined)
                for (const [name, info] of this.env.bindings) {
                    if (name.toLowerCase().startsWith(prefix) && !seen.has(name)) {
                        suggestions.push({ 
                            name, 
                            type: info.type,
                            source: info.source,
                            priority: 0
                        });
                        seen.add(name);
                    }
                }
                
                // Discover app modules from window (capitalized)
                const appModuleNames = ['App', 'Store', 'Console', 'Editor', 'UI', 
                    'Commands', 'Symbols', 'Script', 'SystemFS', 'FileSys', 
                    'Config', 'DB', 'Icons', 'Utils', 'Dragger', 'Resizer', 'Dialogs'];
                
                for (const name of appModuleNames) {
                    if (typeof window[name] !== 'undefined' && 
                        name.toLowerCase().startsWith(prefix) && 
                        !seen.has(name)) {
                        suggestions.push({ 
                            name, 
                            type: 'module',
                            source: 'app',
                            priority: 1
                        });
                        seen.add(name);
                    }
                }
                
                // Common built-ins
                const builtins = ['console', 'Math', 'JSON', 'Array', 'Object', 
                    'String', 'Number', 'Date', 'RegExp', 'Map', 'Set', 'Promise',
                    'parseInt', 'parseFloat', 'setTimeout', 'setInterval', 
                    'clearTimeout', 'clearInterval', 'fetch', 'document', 'window'];
                
                for (const name of builtins) {
                    if (name.toLowerCase().startsWith(prefix) && !seen.has(name)) {
                        suggestions.push({ 
                            name, 
                            type: 'builtin',
                            priority: 2
                        });
                        seen.add(name);
                    }
                }
                
                return suggestions.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    return a.name.localeCompare(b.name);
                }).slice(0, 30);
            }
        } catch (e) {
            console.error('getSuggestions error:', e);
            return [];
        }
    },

    showSuggestions(input, inputEl, forceShow = false) {
        const dropdown = document.getElementById('console-autocomplete');
        if (!dropdown) return;

        if (!input || input.trim().length === 0) {
            if (!forceShow) {
                this.hideSuggestions();
                return;
            }
        }

        this.suggestions = this.getSuggestions(input || '');
        
        if (this.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        // Style the dropdown container
        dropdown.style.cssText = `
            display: block;
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: var(--sidebar-bg, #1e1e2e);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            border-radius: 6px;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            margin-bottom: 4px;
        `;
        
        dropdown.innerHTML = '';
        
        // Type icons and colors
        const typeConfig = {
            'function':      { icon: 'ƒ',  color: '#dcdcaa' },
            'async function':{ icon: 'ƒ',  color: '#dcdcaa' },
            'class':         { icon: '◆',  color: '#4ec9b0' },
            'object':        { icon: '{}', color: '#9cdcfe' },
            'array':         { icon: '[]', color: '#9cdcfe' },
            'string':        { icon: '"',  color: '#ce9178' },
            'number':        { icon: '#',  color: '#b5cea8' },
            'boolean':       { icon: '?',  color: '#569cd6' },
            'module':        { icon: '◉',  color: '#c586c0' },
            'builtin':       { icon: '●',  color: '#4fc1ff' },
            'undefined':     { icon: '∅',  color: '#808080' },
            'null':          { icon: '∅',  color: '#808080' }
        };
        
        this.suggestions.forEach((sugg, idx) => {
            const item = document.createElement('div');
            item.className = 'console-suggestion-item';
            item.dataset.index = idx;
            
            const config = typeConfig[sugg.type] || { icon: '•', color: 'var(--text)' };
            const isFunc = sugg.type === 'function' || sugg.type === 'async function';
            
            item.innerHTML = `
                <span class="sugg-icon" style="color:${config.color};width:16px;text-align:center;flex-shrink:0;font-size:12px">${config.icon}</span>
                <span class="sugg-name" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sugg.name}${isFunc ? '<span style="opacity:0.5">()</span>' : ''}</span>
                <span class="sugg-type" style="font-size:9px;opacity:0.5;margin-left:8px;text-transform:uppercase">${sugg.type}</span>
            `;
            
            item.style.cssText = `
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                font-family: 'JetBrains Mono', monospace;
                display: flex;
                align-items: center;
                gap: 6px;
                border-radius: 3px;
                margin: 2px 4px;
                transition: background 0.1s;
            `;
            
            item.onmouseenter = () => this._highlightSuggestion(idx);
            item.onclick = () => this.acceptSuggestion(inputEl);
            dropdown.appendChild(item);
        });
        
        // Auto-select first item
        this.currentSuggestionIndex = 0;
        this._highlightSuggestion(0);
    },
    
    _highlightSuggestion(index) {
        const dropdown = document.getElementById('console-autocomplete');
        if (!dropdown) return;
        
        const items = dropdown.querySelectorAll('.console-suggestion-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.style.background = 'var(--accent)';
                item.style.color = 'var(--header-bg, #1e1e2e)';
                item.querySelector('.sugg-icon').style.color = 'inherit';
                item.querySelector('.sugg-type').style.opacity = '0.7';
            } else {
                item.style.background = 'transparent';
                item.style.color = 'var(--text)';
                const config = this.suggestions[i] ? ({
                    'function': '#dcdcaa', 'async function': '#dcdcaa',
                    'class': '#4ec9b0', 'object': '#9cdcfe', 'array': '#9cdcfe',
                    'string': '#ce9178', 'number': '#b5cea8', 'boolean': '#569cd6',
                    'module': '#c586c0', 'builtin': '#4fc1ff'
                })[this.suggestions[i].type] || 'var(--text)' : 'var(--text)';
                item.querySelector('.sugg-icon').style.color = config;
                item.querySelector('.sugg-type').style.opacity = '0.5';
            }
        });
        
        this.currentSuggestionIndex = index;
    },

    hideSuggestions() {
        const dropdown = document.getElementById('console-autocomplete');
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
        }
        this.suggestions = [];
        this.currentSuggestionIndex = -1;
    },

    selectNextSuggestion() {
        const dropdown = document.getElementById('console-autocomplete');
        if (!dropdown || dropdown.style.display === 'none') return;
        if (this.suggestions.length === 0) return;

        const newIndex = (this.currentSuggestionIndex + 1) % this.suggestions.length;
        this._highlightSuggestion(newIndex);
        
        const items = dropdown.querySelectorAll('.console-suggestion-item');
        if (items[newIndex]) {
            items[newIndex].scrollIntoView({ block: 'nearest' });
        }
    },

    selectPrevSuggestion() {
        const dropdown = document.getElementById('console-autocomplete');
        if (!dropdown || dropdown.style.display === 'none') return;
        if (this.suggestions.length === 0) return;

        const newIndex = this.currentSuggestionIndex <= 0 
            ? this.suggestions.length - 1 
            : this.currentSuggestionIndex - 1;
        this._highlightSuggestion(newIndex);
        
        const items = dropdown.querySelectorAll('.console-suggestion-item');
        if (items[newIndex]) {
            items[newIndex].scrollIntoView({ block: 'nearest' });
        }
    },

    acceptSuggestion(inputEl) {
        if (this.currentSuggestionIndex < 0 || this.currentSuggestionIndex >= this.suggestions.length) return;

        const suggestion = this.suggestions[this.currentSuggestionIndex];
        const input = inputEl.value;
        
        if (input.includes('.')) {
            const lastDotIndex = input.lastIndexOf('.');
            inputEl.value = input.substring(0, lastDotIndex + 1) + suggestion.name;
        } else {
            inputEl.value = suggestion.name;
        }
        
        inputEl.focus();
        this.hideSuggestions();
    },
    
    /**
     * Display all current bindings
     */
    showBindings() {
        const bindings = this.getBindings();
        if (bindings.length === 0) {
            this.displayOutput('No bindings defined', 'info');
            return;
        }
        
        const grouped = {};
        for (const b of bindings) {
            const group = b.source || b.type;
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(b.name);
        }
        
        let output = 'REPL Bindings:\n';
        for (const [group, names] of Object.entries(grouped)) {
            output += `  ${group}: ${names.join(', ')}\n`;
        }
        
        this.displayOutput(output.trim(), 'info');
    },
    
    // Legacy: no worker needed anymore
    initWorker() {
        this.init();
    }
};
