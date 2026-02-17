/**
 * Initialization Module
 * Window load events and message handlers
 */

window.onload = () => {
    App.init();
    // Populate icons from Icons object
    document.querySelectorAll('[data-icon]').forEach(btn => {
        const iconName = btn.getAttribute('data-icon');
        if (Icons[iconName]) {
            btn.innerHTML = Icons[iconName];
        }
    });
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW registration failed:', e));
    }
};

window.addEventListener('message', (event) => {
    if (!event.data) return;
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame || event.source !== previewFrame.contentWindow) return;

    // Handle file opening requests from markdown preview
    if (event.data.type === 'aether-open-file') {
        const filename = event.data.filename;
        if (filename) {
            // Try to find existing buffer first
            const existing = Store.state.buffers.find(b => b.name === filename);
            if (existing) {
                Store.setActive(existing.id);
                App.debouncePreview(true);
            } else {
                // Try to lazy load from system filesystem
                SystemFS.lazyLoadFile(filename).then(() => {
                    const loaded = Store.state.buffers.find(b => b.name === filename);
                    if (loaded) {
                        Store.setActive(loaded.id);
                        App.debouncePreview(true);
                    }
                }).catch(() => {
                    UI.toast('File not found: ' + filename);
                });
            }
        }
        return;
    }

    // Handle Aether API calls from preview frame
    if (event.data.type === 'aether-call') {
        const method = event.data.method;
        try {
            if (method === 'log') console.log(event.data.msg);
            else if (method === 'warn') console.warn(event.data.msg);
            else if (method === 'error') console.error(event.data.msg);
            else if (method === 'toast') UI.toast(event.data.msg, event.data.duration);
            else if (method === 'openFile') Script.context.openFile(event.data.name, event.data.content);
            else if (method === 'newFile') Script.context.newFile(event.data.name, event.data.content);
            else if (method === 'setConfig') Script.context.setConfig(event.data.k, event.data.v);
            else if (method === 'updateTheme') Script.context.updateTheme(event.data.name);
            else if (method === 'updateZoom') Script.context.updateZoom(event.data.delta);
        } catch (e) { console.error('Aether API error:', e); }
        return;
    }

    // Handle console logs (optimized with batching)
    if (event.data.type !== 'console') return;

    const logBox = document.getElementById('console-logs');
    const MAX_LOGS = 200;
    
    // Batch cleanup if needed before adding entry
    if (logBox.children.length >= MAX_LOGS) {
        const toRemove = logBox.children.length - MAX_LOGS + 1;
        for (let i = 0; i < toRemove; i++) {
            logBox.removeChild(logBox.firstChild);
        }
    }
    
    const entry = document.createElement('div');
    const color = event.data.method === 'error' ? 'var(--log-error)' :
        event.data.method === 'warn' ? 'var(--log-warn)' :
        event.data.method === 'info' ? 'var(--log-info)' : 'var(--text)';

    entry.style.color = color;
    entry.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    entry.style.padding = '2px 0';

    const text = (event.data.args || []).map(a => {
        try {
            if (a && a.stack) return a.stack;
            if (typeof a === 'object') return JSON.stringify(a);
            return String(a);
        } catch (e) { return String(a); }
    }).join(' ');

    entry.innerText = `> ${text}`;
    logBox.appendChild(entry);
    // Only scroll if not already at bottom (avoid layout thrashing)
    if (logBox.scrollHeight - logBox.scrollTop <= logBox.clientHeight + 50) {
        requestAnimationFrame(() => { logBox.scrollTop = logBox.scrollHeight; });
    }
});
