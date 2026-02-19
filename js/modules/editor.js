/**
 * Editor Module
 * Ace editor initialization and management with LSP support
 */

const Editor = {
    instance: null,
    _timers: {}, // Centralized timer management
    init() {
        this.instance = ace.edit("code-stage");
        this.instance.setOptions({
            enableBasicAutocompletion: true, enableLiveAutocompletion: true,
            showPrintMargin: false, useSoftTabs: true, tabSize: 4,
            fontSize: Config.state.fontSize, fontFamily: 'JetBrains Mono, monospace', scrollPastEnd: 0.5
        });
        this.instance.on('change', () => {
            if (Store.state.activeId) Store.updateContent(Store.state.activeId, this.instance.getValue());
            App.debouncePreview();
            this.debounceSymbols();
            // send content to worker for analysis with centralized timer
            try { 
                if (this.lspWorker) { 
                    clearTimeout(this._timers.lsp); 
                    this._timers.lsp = setTimeout(() => {
                        this.lspWorker.postMessage({ type: 'analyze', content: this.instance.getValue() });
                    }, 600); 
                } 
            } catch(e){}
        });
        this.instance.on('changeSelection', () => {
            // Debounce stats updates to reduce DOM thrashing
            clearTimeout(this._timers.stats);
            this._timers.stats = setTimeout(() => App.updateStats(), 100);
        });
        // Shortcuts
        this.instance.commands.addCommand({ name: 'save', bindKey: { win: 'Ctrl-S', mac: 'Command-S' }, exec: () => Commands.trigger('saveFile') });
        this.instance.commands.addCommand({ name: 'palette', bindKey: { win: 'F1|Ctrl-P', mac: 'F1|Command-P' }, exec: () => Commands.showPalette() });
        this.instance.commands.addCommand({ name: 'new', bindKey: { win: 'Alt-N', mac: 'Option-N' }, exec: () => Commands.trigger('newFile') });
        // Signature help command integrated with Ace so editor handles the shortcut
        this.instance.commands.addCommand({ name: 'signatureHelp', bindKey: { win: 'Ctrl-I', mac: 'Command-I' }, exec: () => { try { this.showSignatureHelp(); } catch (e){} } });

        // Initialize lightweight LSP worker and completer
        try {
            this.lspWorker = new Worker('lsp-worker.js');
            this.lspWorker.addEventListener('message', (e) => {
                const d = e.data;
                if (!d) return;
                if (d.type === 'analyze') {
                    // store symbols with locations and update outline
                    this._lspSymbols = d.symbols || [];
                    try { Symbols.parse(); } catch (e) {}
                }
                if (d.type === 'hover') {
                    if (!this._hoverTip) return;
                    const sig = d.signature;
                    const doc = d.doc;
                    const kind = d.kind || '';
                    if (!sig && !doc) { this._hoverTip.style.display = 'none'; return; }

                    // Build rich content safely
                    this._hoverTip.innerHTML = '';
                    const code = document.createElement('div');
                    code.style.fontFamily = 'JetBrains Mono, monospace';
                    code.style.fontSize = '12px';
                    code.style.fontWeight = '700';
                    code.style.marginBottom = '6px';
                    code.textContent = sig || `${kind}`;
                    this._hoverTip.appendChild(code);

                    if (doc) {
                        const p = document.createElement('div');
                        p.style.fontSize = '11px';
                        p.style.opacity = '0.9';
                        p.style.whiteSpace = 'pre-wrap';
                        p.textContent = doc.replace(/^\s*\*\s?/mg, '').trim();
                        this._hoverTip.appendChild(p);
                    }

                    const x = (this._lastMouse && this._lastMouse.x) || (window.innerWidth/2);
                    const y = (this._lastMouse && this._lastMouse.y) || (window.innerHeight/2);
                    this._hoverTip.style.left = (x + 12) + 'px';
                    this._hoverTip.style.top = (y + 12) + 'px';
                    this._hoverTip.style.display = 'block';
                }
            });

            const completer = {
                getCompletions: (editor, session, pos, prefix, callback) => {
                    if (!this.lspWorker) return callback(null, []);
                    const content = editor.getValue();
                    const id = 'c' + Date.now() + Math.random();
                    const handler = (ev) => {
                        const m = ev.data;
                        if (!m || m.type !== 'complete' || m.id !== id) return;
                        const items = (m.items || []).map(i => ({ caption: i.caption, value: i.value, meta: i.meta }));
                        callback(null, items);
                        this.lspWorker.removeEventListener('message', handler);
                    };
                    this.lspWorker.addEventListener('message', handler);
                    this.lspWorker.postMessage({ type: 'complete', content, prefix, id });
                }
            };
            this.instance.completers = (this.instance.completers || []).concat([completer]);
            // Create hover tooltip element
            try {
                const tip = document.createElement('div');
                tip.id = 'hover-tip';
                const cs = getComputedStyle(document.body);
                tip.style.position = 'fixed';
                tip.style.display = 'none';
                tip.style.padding = '6px 8px';
                tip.style.background = cs.getPropertyValue('--header-bg') || '#222';
                tip.style.color = cs.getPropertyValue('--text') || '#fff';
                tip.style.border = `1px solid ${cs.getPropertyValue('--border') || '#333'}`;
                tip.style.borderRadius = '6px';
                tip.style.fontSize = '12px';
                tip.style.zIndex = 9999;
                tip.style.pointerEvents = 'none';
                tip.style.fontFamily = 'JetBrains Mono, monospace';
                document.body.appendChild(tip);
                this._hoverTip = tip;
                this._lastMouse = null;

                let hoverTimer = null;
                // Mouse move over editor, debounce and request hover info
                this.instance.container.addEventListener('mousemove', (e) => {
                    clearTimeout(this._timers.hover);
                    this._timers.hover = setTimeout(() => {
                        try {
                            const pos = this.instance.renderer.screenToTextCoordinates(e.clientX, e.clientY);
                            const token = this.instance.session.getTokenAt(pos.row, pos.column);
                            if (!token) { this._hoverTip.style.display = 'none'; return; }
                            const word = token.value;
                            if (!/^[A-Za-z$_][A-Za-z0-9$_]*$/.test(word)) { this._hoverTip.style.display = 'none'; return; }
                            this._lastMouse = { x: e.clientX, y: e.clientY };
                            if (this.lspWorker) this.lspWorker.postMessage({ type: 'hover', word, content: this.instance.getValue() });
                        } catch (err) { this._hoverTip.style.display = 'none'; }
                    }, 180);
                });

                this.instance.container.addEventListener('mouseleave', () => { if (this._hoverTip) this._hoverTip.style.display = 'none'; });
                // Single-key shortcut: Ctrl/Cmd+I => signature help
                try {
                    document.addEventListener('keydown', (e) => {
                        if (!(e.ctrlKey || e.metaKey)) return;
                        if (e.key.toLowerCase() === 'i') {
                            e.preventDefault();
                            try { this.showSignatureHelp(); } catch (err) { console.warn(err); }
                        }
                    });
                } catch (e) {}
            } catch (e) { /* ignore hover initialization errors */ }
        } catch (e) { console.warn('LSP worker not available', e); }
    },
    async load(content, filename) {
        if (this.instance.getValue() !== content) this.instance.setValue(content, -1);
        const ext = filename ? filename.split('.').pop().toLowerCase() : 'txt';
        await Languages.setEditorMode(this.instance, ext);
        this.instance.session.getUndoManager().reset();
        App.updateStats(); App.debouncePreview(true);
        // trigger LSP analyze for immediate symbol extraction with centralized timer
        try { 
            if (this.lspWorker) { 
                clearTimeout(this._timers.lsp); 
                this._timers.lsp = setTimeout(() => {
                    this.lspWorker.postMessage({ type: 'analyze', content });
                }, 150); 
            } 
        } catch(e){}
        Symbols.parse();
    },
    showSignatureHelp() {
        try {
            const pos = this.instance.getCursorPosition();
            // try to get a word range at the cursor (works even on whitespace near word)
            const range = this.instance.session.getWordRange(pos.row, pos.column);
            let word = null;
            if (range) word = this.instance.session.getTextRange(range).trim();
            if (!word) {
                // fallback to token at column-1
                const token = this.instance.session.getTokenAt(pos.row, Math.max(0, pos.column-1));
                if (token && /^[A-Za-z$_][A-Za-z0-9$_]*$/.test(token.value)) word = token.value;
            }
            if (!word) return UI.toast('No symbol at cursor');

            // compute screen coordinates for tooltip placement using renderer
            let coords = null;
            try { coords = this.instance.renderer.textToScreenCoordinates(pos.row, pos.column); } catch (e) { coords = null; }
            if (coords) {
                // pageX/pageY exist in modern ace builds; fallback to client + scroll
                const x = ('pageX' in coords && coords.pageX) ? coords.pageX : (coords.left + window.pageXOffset);
                const y = ('pageY' in coords && coords.pageY) ? coords.pageY : (coords.top + window.pageYOffset);
                this._lastMouse = { x, y };
            }

            if (this.lspWorker) this.lspWorker.postMessage({ type: 'hover', word, content: this.instance.getValue() });
        } catch (e) { console.warn('signature help failed', e); }
    },
    debounceSymbols() {
        clearTimeout(this._timers.symbols);
        this._timers.symbols = setTimeout(() => Symbols.parse(), 1000);
    }
};
