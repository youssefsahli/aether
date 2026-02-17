/**
 * System File System Module
 * Lazy loading of system files (docs, config, etc.)
 */

const SystemFS = {
    fileCache: new Map(),
    loadedFiles: new Set(),
    async init() {
        await this.syncFromDocs();
        await this.renderSystemTree();
    },
    async syncFromDocs() {
        // Check if we have internet connectivity
        try {
            const response = await fetch('filesys/docs/welcome.md', { method: 'HEAD', cache: 'no-store' });
            if (!response.ok) return; // No internet or filesys/docs not available
        } catch (e) {
            return; // No internet connection
        }
        
        // List of docs to sync from filesys/docs
        const docsToSync = ['welcome.md', 'manual.md', 'SCRIPTING.md', 'SCRIPT_QUICK_REF.md', 'MARKDOWN_NAVIGATION.md'];
        
        for (const filename of docsToSync) {
            try {
                const response = await fetch(`filesys/docs/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    this.fileCache.set(filename, content);
                    this.loadedFiles.add(filename);
                }
            } catch (e) {
                console.warn(`Could not sync ${filename}:`, e);
            }
        }
    },
    async renderSystemTree() {
        const div = document.getElementById('system-tree');
        if (!div) return;
        div.innerHTML = '';
        
        // Organize files into folders
        const docFiles = ['welcome.md', 'manual.md', 'SCRIPTING.md', 'SCRIPT_QUICK_REF.md', 'MARKDOWN_NAVIGATION.md', 'test-navigation.md'];
        const configFiles = ['.aether.js', 'config.json', 'manifest.json'];
        const otherFiles = ['EXAMPLE_SCRIPTS.js', 'LICENSE', 'CNAME', 'index.html'];
        
        // Create docs folder
        const docsFolder = this.createSystemFolder('docs', div, 0);
        for (const filename of docFiles) {
            this.createSystemFile(filename, docsFolder, 1);
        }
        
        // Create config folder
        const configFolder = this.createSystemFolder('config', div, 0);
        for (const filename of configFiles) {
            this.createSystemFile(filename, configFolder, 1);
        }
        
        // Add other files directly at root
        for (const filename of otherFiles) {
            this.createSystemFile(filename, div, 0);
        }
    },
    createSystemFolder(name, parentEl, level) {
        const el = document.createElement('div');
        el.className = 'tree-item is-directory';
        el.setAttribute('data-tree-name', name);
        el.setAttribute('data-tree-level', level);
        el.setAttribute('data-tree-type', 'directory');
        el.style.paddingLeft = `${(level * 10) + 12}px`;
        
        // Toggle
        const toggle = document.createElement('span');
        toggle.className = 'tree-item-toggle';
        toggle.innerHTML = Icons.chevronDown;
        toggle.onclick = (e) => {
            e.stopPropagation();
            const isCollapsed = el.classList.toggle('collapsed');
            // Toggle visibility of children (only direct children when expanding)
            const dirLevel = level;
            const childLevel = level + 1;
            let next = el.nextElementSibling;
            while (next && parseInt(next.getAttribute('data-tree-level') || 0) > dirLevel) {
                if (isCollapsed) {
                    next.classList.add('hidden-by-parent');
                } else if (parseInt(next.getAttribute('data-tree-level') || 0) === childLevel) {
                    // Only show direct children when expanding
                    next.classList.remove('hidden-by-parent');
                }
                next = next.nextElementSibling;
            }
        };
        el.appendChild(toggle);
        
        // Content
        const content = document.createElement('span');
        content.className = 'tree-item-content';
        const icon = document.createElement('span');
        icon.innerHTML = Icons.folder;
        icon.style.display = 'inline-flex';
        const text = document.createElement('span');
        text.textContent = name;
        content.appendChild(icon);
        content.appendChild(text);
        el.appendChild(content);
        
        parentEl.appendChild(el);
        return parentEl;
    },
    createSystemFile(name, parentEl, level) {
        const el = document.createElement('div');
        el.className = 'tree-item is-file';
        el.setAttribute('data-tree-name', name);
        el.setAttribute('data-tree-level', level);
        el.setAttribute('data-tree-type', 'file');
        el.style.paddingLeft = `${(level * 10) + 32}px`;
        
        // Content
        const content = document.createElement('span');
        content.className = 'tree-item-content';
        content.style.cursor = 'pointer';
        const icon = document.createElement('span');
        icon.innerHTML = Icons.file;
        icon.style.display = 'inline-flex';
        const text = document.createElement('span');
        text.textContent = name;
        content.appendChild(icon);
        content.appendChild(text);
        el.appendChild(content);
        
        content.onclick = async () => this.loadFile(name);
        parentEl.appendChild(el);
    },
    async loadFile(filename) {
        if (this.loadedFiles.has(filename)) {
            const existing = Store.state.buffers.find(b => b.name === filename && b.kind === 'system');
            if (existing) return Store.setActive(existing.id);
        }
        
        try {
            UI.toast(`Loading ${filename}...`);
            
            // Check if file was pre-cached from filesys/docs
            let content = this.fileCache.get(filename);
            if (!content) {
                const response = await fetch(filename);
                if (!response.ok) {
                    // File doesn't exist - create new empty file instead of error
                    content = '';
                    UI.toast(`Created new file: ${filename}`);
                } else {
                    content = await response.text();
                }
            }
            
            this.fileCache.set(filename, content);
            this.loadedFiles.add(filename);
            
            // Add to buffers as system file (editable)
            const existing = Store.state.buffers.find(b => b.name === filename);
            if (existing) {
                Store.setActive(existing.id);
            } else {
                Store.addBuffer({ id: 'sys' + Date.now(), name: filename, content, handle: null, kind: 'system', dirty: false, readonly: false });
            }
        } catch (e) {
            UI.toast(`Error loading ${filename}: ${e.message}`);
            console.error('Load failed:', e);
        }
    },
    async lazyLoadFile(filename) {
        // Try to load file if referenced from markdown links
        return this.loadFile(filename);
    }
};
