/**
 * UI Module
 * User interface updates and rendering
 */

const UI = {
    renderTabs() {
        const con = document.getElementById('tabs-scroll'); con.innerHTML = '';
        Store.state.buffers.forEach(b => {
            const el = document.createElement('div');
            el.className = `tab ${b.id === Store.state.activeId ? 'active' : ''} ${b.dirty ? 'dirty' : ''}`;
            const closeBtn = document.createElement('div');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = Icons.close;
            closeBtn.onclick = (e) => { e.stopPropagation(); Store.closeBuffer(b.id); };
            const nameSpan = document.createElement('span');
            nameSpan.textContent = b.name;
            const dotSpan = document.createElement('span');
            dotSpan.className = 'unsaved-dot';
            el.appendChild(nameSpan);
            el.appendChild(dotSpan);
            el.appendChild(closeBtn);
            el.onclick = () => Store.setActive(b.id);
            con.appendChild(el);
            if (b.id === Store.state.activeId) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
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
