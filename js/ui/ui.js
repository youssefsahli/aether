/**
 * UI Module
 * User interface updates and rendering
 */

const UI = {
    // Tab badge configs: map kind to label & CSS class
    _tabBadges: {
        opfs: { label: 'local', cls: 'tab-badge-opfs' },
        disk: { label: 'fs', cls: 'tab-badge-disk' },
        memory: { label: 'mem', cls: 'tab-badge-memory' },
        config: { label: 'cfg', cls: 'tab-badge-config' },
        system: { label: 'sys', cls: 'tab-badge-system' }
    },
    
    renderTabs(forceFullRender = false) {
        const con = document.getElementById('tabs-scroll');
        // Track existing tabs to avoid full re-render
        const existingTabs = Array.from(con.querySelectorAll('.tab'));
        const existingIds = new Set(existingTabs.map(t => t.dataset.bufferId));
        const newIds = new Set(Store.state.buffers.map(b => b.id));
        
        // Only do full re-render if tab count changed or active tab changed
        const needsFullRender = forceFullRender || existingIds.size !== newIds.size || 
            (con.querySelector('.tab.active')?.dataset.bufferId !== Store.state.activeId);
        
        if (needsFullRender) {
            con.innerHTML = '';
            Store.state.buffers.forEach(b => {
                const el = document.createElement('div');
                el.className = `tab ${b.id === Store.state.activeId ? 'active' : ''} ${b.dirty ? 'dirty' : ''}`;
                el.dataset.bufferId = b.id;
                
                // Add kind-based class for styling
                if (b.kind) el.classList.add(`tab-kind-${b.kind}`);
                if (b.readonly) el.classList.add('tab-readonly');
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'tab-name';
                nameSpan.textContent = b.name;
                
                // Add badge for tab type
                const badge = this._tabBadges[b.kind];
                if (badge) {
                    const badgeSpan = document.createElement('span');
                    badgeSpan.className = `tab-badge ${badge.cls}`;
                    badgeSpan.textContent = badge.label;
                    badgeSpan.title = b.readonly ? `${b.kind} (read-only)` : b.kind;
                    nameSpan.appendChild(badgeSpan);
                }
                
                // Readonly indicator
                if (b.readonly) {
                    const lockSpan = document.createElement('span');
                    lockSpan.className = 'tab-lock';
                    lockSpan.innerHTML = '🔒';
                    lockSpan.title = 'Read-only';
                    nameSpan.appendChild(lockSpan);
                }
                
                const dotSpan = document.createElement('span');
                dotSpan.className = 'unsaved-dot';
                dotSpan.title = 'Unsaved changes';
                
                const closeBtn = document.createElement('div');
                closeBtn.className = 'tab-close';
                closeBtn.innerHTML = Icons.close;
                closeBtn.title = 'Close';
                closeBtn.onclick = (e) => { e.stopPropagation(); Store.closeBuffer(b.id); };
                
                el.appendChild(nameSpan);
                el.appendChild(dotSpan);
                el.appendChild(closeBtn);
                el.onclick = () => Store.setActive(b.id);
                con.appendChild(el);
                if (b.id === Store.state.activeId) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        } else {
            // Partial update: only refresh dirty/active state on existing tabs
            Store.state.buffers.forEach(b => {
                const tab = con.querySelector(`[data-buffer-id="${b.id}"]`);
                if (tab) {
                    tab.classList.toggle('active', b.id === Store.state.activeId);
                    tab.classList.toggle('dirty', b.dirty);
                    if (b.id === Store.state.activeId) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    },
    toast(msg) { const t = document.getElementById('toast'); document.getElementById('toast-msg').innerText = msg; t.classList.add('visible'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.remove('visible'), 2500); },
    clearConsole() { const logBox = document.getElementById('console-logs'); if (logBox) { logBox.innerHTML = ''; this.toast('Console cleared'); } },
    updateConsoleHeader() {
        const runBtn = document.getElementById('console-run-btn');
        if (!runBtn) return;
        const buf = Store.activeBuffer;
        const ext = buf && buf.name ? buf.name.split('.').pop().toLowerCase() : '';
        runBtn.hidden = ext !== 'js';
    },
    toggleConsole() {
        const pane = document.getElementById('console-pane');
        const btn = document.getElementById('console-toggle-btn');
        if (!pane || !btn) return;
        pane.classList.toggle('collapsed');
        const collapsed = pane.classList.contains('collapsed');
        Store.state.consoleCollapsed = collapsed;
        if (collapsed) {
            btn.innerHTML = Icons.chevronDown;
        } else {
            btn.innerHTML = Icons.chevronRight;
        }
    },
    initIconButtons() {
        // Replace text icons in header buttons with SVG icons from Icons.js
        const buttons = [
            { selector: 'button[onclick="TreeSearch.collapseAll(\'file-tree\')"]', icon: 'chevronDown' },
            { selector: 'button[onclick="FileSys.createWorkspaceDir()"]', icon: 'folder' },
            { selector: 'button[onclick="FileSys.openFolder()"]', icon: 'menu' },
            { selector: 'button[onclick="TreeSearch.collapseAll(\'opfs-tree\')"]', icon: 'chevronDown' },
            { selector: 'button[onclick="FileSys.createOPFSDir()"]', icon: 'folder' },
            { selector: 'button[onclick="FileSys.createOPFSFile()"]', icon: 'plus' }
        ];
        
        buttons.forEach(({ selector, icon }) => {
            const btn = document.querySelector(selector);
            if (btn && Icons && Icons[icon]) {
                btn.innerHTML = Icons[icon];
            }
        });
    }
};
