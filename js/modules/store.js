/**
 * Store Module
 * Global state management for buffers, active file, and navigation
 */

const Store = {
    state: { buffers: [], activeId: null, opfsRoot: null, previewMode: false, consoleCollapsed: false, navHistory: [], navIndex: -1 },
    get activeBuffer() { return this.state.buffers.find(b => b.id === this.state.activeId); },
    addBuffer(b) { this.state.buffers.push(b); this.setActive(b.id); App.saveSession(); },
    closeBuffer(id) {
        const idx = this.state.buffers.findIndex(b => b.id === id);
        if (idx === -1) return;
        this.state.buffers.splice(idx, 1);
        if (this.state.activeId === id) {
            const next = this.state.buffers[idx] || this.state.buffers[idx - 1];
            this.setActive(next ? next.id : null);
        } else UI.renderTabs();
        App.saveSession();
        // Update console header (show run button for .js files)
        try { UI.updateConsoleHeader(); } catch (e) {}
    },
    setActive(id) {
        if (this.state.activeId === id) return; // No change needed
        this.state.activeId = id; UI.renderTabs();
        const buf = this.activeBuffer;
        if (buf) {
            Editor.load(buf.content, buf.name);
            document.getElementById('bc-filename').innerText = buf.name;
        }
        else { Editor.load('', 'txt'); document.getElementById('bc-filename').innerText = '[No Selection]'; }
        // Track navigation history
        if (this.state.navIndex < this.state.navHistory.length - 1) {
            this.state.navHistory = this.state.navHistory.slice(0, this.state.navIndex + 1);
        }
        this.state.navHistory.push(id);
        this.state.navIndex = this.state.navHistory.length - 1;
        App.updateNavButtons();
        App.saveSession();
    },
    updateContent(id, c) {
        const b = this.state.buffers.find(b => b.id === id);
        if (b && !b.readonly && b.content !== c) {
            b.content = c;
            if (!b.dirty) { b.dirty = true; UI.renderTabs(); }
            App.debounceSaveBuffer(b);
        }
    },
    markSaved(id) {
        const b = this.state.buffers.find(b => b.id === id);
        if (b) { b.dirty = false; UI.renderTabs(); App.saveBuffer(b); }
    }
};
