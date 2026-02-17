/**
 * Application Module
 * Main app initialization, preview rendering, and session management
 */

const App = {
    async loadWelcome() {
        // Always fetch latest version from workspace first
        const workspaceWelcome = await this.getDefaultWelcome();
        if (workspaceWelcome) {
            // Update OPFS with the latest version
            try {
                if (Store.state.opfsRoot) {
                    const handle = await Store.state.opfsRoot.getFileHandle('welcome.md', { create: true });
                    const writable = await handle.createWritable();
                    await writable.write(workspaceWelcome);
                    await writable.close();
                }
            } catch (e) {
                console.warn('Could not update welcome.md in OPFS:', e);
            }
            return workspaceWelcome;
        }
        
        // Fallback: load from OPFS if workspace unavailable
        try {
            if (!Store.state.opfsRoot) return null;
            const handle = await Store.state.opfsRoot.getFileHandle('welcome.md', { create: false });
            const file = await handle.getFile();
            return await file.text();
        } catch (e) {
            console.warn('Failed to load welcome from OPFS:', e);
            return "# Welcome to Aether\n\nA powerful, minimal code editor for the web.";
        }
    },
    async getDefaultWelcome() {
        // Fetch welcome.md from workspace with cache-busting
        try {
            const response = await fetch('welcome.md?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.ok) return await response.text();
        } catch (e) {
            console.warn('Could not fetch welcome.md:', e);
        }
        // Fallback content if file can't be fetched
        return "# Welcome to Aether\n\nA powerful, minimal code editor for the web.\n\nOpen welcome.md to see documentation and examples.";
    },
    async init() {
        await DB.init();
        Editor.init();
        await Config.init();
        await FileSys.initOPFS();
        Resizer.init();
        Dragger.init();
        MarkedConfig.init();
        UI.initIconButtons();
        await SystemFS.init();

        const rootHandle = await DB.get('handles', 'rootDir');
        if (rootHandle) FileSys.restoreRoot(rootHandle);

        const tabScroll = document.getElementById('tabs-scroll');
        tabScroll.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabScroll.scrollLeft += e.deltaY;
            }
        }, { passive: false });
        
        // Run initialization script from OPFS if available
        try { await Script.runInitScript(); } catch (e) { /* ignore */ }

        const savedEntries = await DB.getAll('session');
        const meta = (savedEntries || []).find(e => e && e.id === 'meta');
        const savedBuffers = (savedEntries || []).filter(e => e && e.id && e.id !== 'meta');

        if (typeof meta !== 'undefined' && meta) {
            if (typeof meta.consoleCollapsed !== 'undefined') Store.state.consoleCollapsed = !!meta.consoleCollapsed;
            if (typeof meta.outlineCollapsed !== 'undefined') Store.state.outlineCollapsed = meta.outlineCollapsed || {};
        }

        if (savedBuffers.length) {
            savedBuffers.forEach(b => Store.addBuffer(b));
            const active = savedBuffers.find(b => b.active);
            if (active) Store.setActive(active.id); else Store.setActive(savedBuffers[0].id);
        } else {
            // Load welcome.md from OPFS or use default
            const welcomeText = await this.loadWelcome();
            this.openBuffer('welcome.md', welcomeText, null, 'memory');
            Store.state.buffers[0].dirty = false;
            UI.renderTabs();
        }

        document.body.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag-over'); });
        document.body.addEventListener('dragleave', e => { if (e.relatedTarget === null) document.body.classList.remove('drag-over'); });
        document.body.addEventListener('drop', async e => {
            e.preventDefault(); document.body.classList.remove('drag-over');
            for (const item of e.dataTransfer.items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    this.openBuffer(file.name, await file.text(), null, 'memory');
                }
            }
        });

        // Global shortcuts - use single listener with explicit keyboard handling
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                Commands.trigger('openFile');
            }
            // Alt+Left for back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                App.goBack();
            }
            // Alt+Right for forward
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                App.goForward();
            }
        });

        new ResizeObserver(() => Editor.instance.resize()).observe(document.querySelector('main'));

        // Outline filter input debounce
        try {
            const of = document.getElementById('outline-filter');
            if (of) {
                let ot = null;
                of.addEventListener('input', (e) => { 
                    clearTimeout(ot); 
                    ot = setTimeout(() => Symbols.parse(), 220); 
                });
                of.addEventListener('keydown', (e) => { 
                    if (e.key === 'Escape') { 
                        of.value = ''; 
                        Symbols.parse(); 
                    } 
                });
            }
        } catch (e) {}

        // Restore console collapsed state if present
        try {
            const pane = document.getElementById('console-pane');
            const btn = document.getElementById('console-toggle-btn');
            if (pane && Store.state.consoleCollapsed) pane.classList.add('collapsed');
            if (btn) {
                const collapsed = pane && pane.classList.contains('collapsed');
                btn.innerHTML = collapsed ? Icons.chevronDown : Icons.chevronRight;
            }
        } catch (e) {}
    },
    openBuffer(name, content, handle, kind) {
        const existing = Store.state.buffers.find(b => b.name === name);
        if (existing) return Store.setActive(existing.id);
        Store.addBuffer({ id: 'b' + Date.now(), name, content, handle, kind, dirty: false });
    },
    updateStats() {
        if (!Editor.instance) return;
        const pos = Editor.instance.getCursorPosition();
        document.getElementById('stat-pos').innerText = `${pos.row + 1}:${pos.column + 1}`;
        const buf = Store.activeBuffer;
        if (buf) {
            document.getElementById('stat-file').innerText = buf.name;
            document.getElementById('stat-lang').innerText = buf.name.split('.').pop().toUpperCase();
        }
    },
    goBack() {
        if (Store.state.navIndex > 0) {
            Store.state.navIndex--;
            const targetId = Store.state.navHistory[Store.state.navIndex];
            if (targetId) {
                Store.state.activeId = targetId;
                UI.renderTabs();
                const buf = Store.activeBuffer;
                if (buf) {
                    Editor.load(buf.content, buf.name);
                    document.getElementById('bc-filename').innerText = buf.name;
                }
                this.updateNavButtons();
                this.debouncePreview(true);
            }
        }
    },
    goForward() {
        if (Store.state.navIndex < Store.state.navHistory.length - 1) {
            Store.state.navIndex++;
            const targetId = Store.state.navHistory[Store.state.navIndex];
            if (targetId) {
                Store.state.activeId = targetId;
                UI.renderTabs();
                const buf = Store.activeBuffer;
                if (buf) {
                    Editor.load(buf.content, buf.name);
                    document.getElementById('bc-filename').innerText = buf.name;
                }
                this.updateNavButtons();
                this.debouncePreview(true);
            }
        }
    },
    updateNavButtons() {
        const backBtn = document.getElementById('nav-back-btn');
        const forwardBtn = document.getElementById('nav-forward-btn');
        if (backBtn) backBtn.disabled = Store.state.navIndex <= 0;
        if (forwardBtn) forwardBtn.disabled = Store.state.navIndex >= Store.state.navHistory.length - 1;
    },
    debouncePreview(immediate) {
        if (!Store.state.previewMode) return;
        clearTimeout(this.pvTimer);
        const run = () => {
            const buf = Store.activeBuffer; if (!buf) return;
            const f = document.getElementById('preview-frame');
            const ext = buf.name.split('.').pop().toLowerCase();
            const styles = getComputedStyle(document.body);
            const baseCss = `body{background:${styles.getPropertyValue('--bg')};color:${styles.getPropertyValue('--text')};font-family:sans-serif;padding:20px;line-height:1.6;}a{color:${styles.getPropertyValue('--accent')}}pre{background:rgba(0,0,0,0.2);padding:10px;border-radius:4px;overflow:auto}code{font-family:'JetBrains Mono',monospace;font-size:0.9em}blockquote{border-left:3px solid ${styles.getPropertyValue('--accent')};padding-left:1em;color:${styles.getPropertyValue('--text-dim')}}`;
            let html = "";
            if (ext === 'md') html = `<style>${baseCss}</style>` + marked.parse(buf.content);
            else if (ext === 'html') html = buf.content;
            else html = `<style>${baseCss}</style><pre>${buf.content.replace(/</g, '&lt;')}</pre>`;

                // Use a persistent preview shell and postMessage updates to avoid flashing
                const shell = `<!doctype html><html><head><meta charset="utf-8"></head><body></body><script>(function(){const _log=console.log,_err=console.error,_warn=console.warn,_info=console.info;console.log=(...args)=>{try{parent.postMessage({type:'console',method:'log',args},'*')}catch(e){};_log.apply(console,args)};console.error=(...args)=>{try{parent.postMessage({type:'console',method:'error',args},'*')}catch(e){};_err.apply(console,args)};console.warn=(...args)=>{try{parent.postMessage({type:'console',method:'warn',args},'*')}catch(e){};_warn.apply(console,args)};console.info=(...args)=>{try{parent.postMessage({type:'console',method:'info',args},'*')}catch(e){};_info.apply(console,args)};window.addEventListener('error',function(ev){try{parent.postMessage({type:'console',method:'error',args:['Uncaught Error: '+(ev.message||ev.error||ev.filename||ev.lineno)]},'*')}catch(e){}});function attachLinkHandlers(){const links=document.querySelectorAll('a[data-aether-file]');links.forEach(link=>{link.addEventListener('click',function(e){e.preventDefault();const filename=this.href.split('/').pop()||this.href;parent.postMessage({type:'aether-open-file',filename},'*');});});}window.addEventListener('message',function(e){if(!e.data) return; if(e.data.type==='update'){ document.body.innerHTML = e.data.html || ''; const scripts = Array.from(document.body.querySelectorAll('script')); scripts.forEach(s=>{ const ns = document.createElement('script'); if(s.src) ns.src = s.src; else ns.textContent = s.textContent; document.head.appendChild(ns); s.parentNode.removeChild(s); }); attachLinkHandlers(); }});setTimeout(attachLinkHandlers,100);})();<\/script></html>`;

                const htmlContent = `<style>${baseCss}</style>` + (ext === 'md' ? marked.parse(buf.content) : (ext === 'html' ? buf.content : `<pre>${buf.content.replace(/</g, '&lt;')}</pre>`));

                // If the shell isn't loaded yet, set it and post the content after load
                if (!f.dataset.shellReady) {
                    f.onload = () => {
                        try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
                        f.dataset.shellReady = '1';
                        f.onload = null;
                    };
                    f.srcdoc = shell;
                } else {
                    try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
                }
        };
        if (immediate) run(); else this.pvTimer = setTimeout(run, 500);
    },
    debounceSaveSession() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.saveSession(), 1000);
    },
    toggleSidebar(side) {
        document.getElementById(`sidebar-${side}`).classList.toggle('collapsed');
        setTimeout(() => Editor.instance.resize(), 250);
    },
    runActiveJS() {
        const buf = Store.activeBuffer;
        if (!buf) return UI.toast('No active buffer');
        const ext = buf.name.split('.').pop().toLowerCase();
        if (ext !== 'js') return UI.toast('Run is for .js files only');

        // Ensure preview visible
        Store.state.previewMode = true;
        document.body.classList.add('preview-active');

        const styles = getComputedStyle(document.body);
        const baseCss = `body{background:${styles.getPropertyValue('--bg')};color:${styles.getPropertyValue('--text')};font-family:sans-serif;padding:20px;line-height:1.6;}a{color:${styles.getPropertyValue('--accent')}}pre{background:rgba(0,0,0,0.2);padding:10px;border-radius:4px;overflow:auto}code{font-family:'JetBrains Mono',monospace;font-size:0.9em}`;

        // Wrap code in async IIFE to support top-level await
        // Also inject Aether API via postMessage bridge
        const wrappedCode = `(async () => {
                        // Bridge to parent's Aether API
                        const Aether = {
                            log: (msg) => parent.postMessage({type:'aether-call',method:'log',msg},'*'),
                            warn: (msg) => parent.postMessage({type:'aether-call',method:'warn',msg},'*'),
                            error: (msg) => parent.postMessage({type:'aether-call',method:'error',msg},'*'),
                            toast: (msg, duration) => parent.postMessage({type:'aether-call',method:'toast',msg,duration},'*'),
                            openFile: (name, content) => parent.postMessage({type:'aether-call',method:'openFile',name,content},'*'),
                            newFile: (name, content) => parent.postMessage({type:'aether-call',method:'newFile',name,content},'*'),
                            getConfig: () => 'Use Script API instead',
                            setConfig: (k,v) => parent.postMessage({type:'aether-call',method:'setConfig',k,v},'*'),
                            updateTheme: (name) => parent.postMessage({type:'aether-call',method:'updateTheme',name},'*'),
                            updateZoom: (delta) => parent.postMessage({type:'aether-call',method:'updateZoom',delta},'*'),
                        };
${buf.content}
                    })();`;

        const safeCode = wrappedCode.replace(/<\/script>/g, '<\\/script>');

        const htmlContent = `<style>${baseCss}</style><script>${safeCode}<\/script>`;
        const f = document.getElementById('preview-frame');

        // Shell with postMessage handler to relay Aether calls
        const shell = `<!doctype html><html><head><meta charset="utf-8"></head><body></body><script>(function(){const _log=console.log,_err=console.error,_warn=console.warn,_info=console.info;console.log=(...args)=>{try{parent.postMessage({type:'console',method:'log',args},'*')}catch(e){};_log.apply(console,args)};console.error=(...args)=>{try{parent.postMessage({type:'console',method:'error',args},'*')}catch(e){};_err.apply(console,args)};console.warn=(...args)=>{try{parent.postMessage({type:'console',method:'warn',args},'*')}catch(e){};_warn.apply(console,args)};console.info=(...args)=>{try{parent.postMessage({type:'console',method:'info',args},'*')}catch(e){};_info.apply(console,args)};window.addEventListener('error',function(ev){try{parent.postMessage({type:'console',method:'error',args:['Uncaught Error: '+(ev.message||ev.error||ev.filename||ev.lineno)]},'*')}catch(e){}});window.addEventListener('message',function(e){if(!e.data) return; if(e.data.type==='update'){ document.body.innerHTML = e.data.html || ''; const scripts = Array.from(document.body.querySelectorAll('script')); scripts.forEach(s=>{ const ns = document.createElement('script'); if(s.src) ns.src = s.src; else ns.textContent = s.textContent; document.head.appendChild(ns); s.parentNode.removeChild(s); }); }});})();<\/script></html>`;

        if (!f.dataset.shellReady) {
            f.onload = () => {
                try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
                f.dataset.shellReady = '1';
                f.onload = null;
            };
            f.srcdoc = shell;
        } else {
            try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
        }

        setTimeout(() => Editor.instance.resize(), 200);
    },
    async saveSession() {
        await DB.clear('session');
        for (const b of Store.state.buffers) {
            if (b.kind === 'config') continue;
            await DB.set('session', null, {
                id: b.id, name: b.name, content: b.content,
                handle: b.handle, kind: b.kind, dirty: b.dirty,
                active: b.id === Store.state.activeId
            });
        }
        // persist UI meta (console collapsed state, etc.)
        try {
            await DB.set('session', null, { id: 'meta', consoleCollapsed: !!Store.state.consoleCollapsed, outlineCollapsed: Store.state.outlineCollapsed || {} });
        } catch (e) { /* ignore persistence errors */ }
    },
    async saveBuffer(b) {
        if (!b || b.kind === 'config') return;

        // Recalculate 'active' status based on current Store state
        // This prevents overwriting the active flag incorrectly if the user switched tabs quickly
        const isActive = b.id === Store.state.activeId;

        await DB.set('session', null, {
            id: b.id,
            name: b.name,
            content: b.content,
            handle: b.handle,
            kind: b.kind,
            dirty: b.dirty,
            active: isActive
        });
    },

    // Debounce specifically for the single buffer
    debounceSaveBuffer(b) {
        clearTimeout(this.saveBufTimer);
        this.saveBufTimer = setTimeout(() => {
            // Safety check: Ensure buffer wasn't closed while timer was running
            if (Store.state.buffers.find(x => x.id === b.id)) {
                this.saveBuffer(b);
            }
        }, 1000); // 1 second debounce
    },
    closeBuffer(id) {
        Store.closeBuffer(id);
    }
};
