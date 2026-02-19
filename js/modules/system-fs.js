/**
 * System File System Module
 * Lazy loading of system files (docs, config, etc.)
 */

const SystemFS = {
    fileCache: new Map(),
    loadedFiles: new Set(),
    filesysStructure: {},
    templates: new Map(), // Template cache: extension -> [{name, content}]
    async init() {
        await this.syncFilesysFolder();
        await this.loadTemplates();
        await this.renderSystemTree();
    },
    async syncFilesysFolder() {
        // Comprehensive list of all files in filesys/ organized by structure
        const filesysFiles = {
            'commands.js': 'filesys/commands.js',
            'icons.js': 'filesys/icons.js',
            'styles.css': 'filesys/styles.css',
            'docs/welcome.md': 'filesys/docs/welcome.md',
            'docs/manual.md': 'filesys/docs/manual.md',
            'docs/scripting_guide.md': 'filesys/docs/scripting_guide.md',
            'docs/api_reference.md': 'filesys/docs/api_reference.md',
            'docs/code_examples.md': 'filesys/docs/code_examples.md'
        };
        
        // Try to sync all files
        for (const [localPath, fetchPath] of Object.entries(filesysFiles)) {
            try {
                const response = await fetch(fetchPath, { cache: 'no-store' });
                if (response.ok) {
                    const content = await response.text();
                    this.fileCache.set(localPath, content);
                    this.loadedFiles.add(localPath);
                }
            } catch (e) {
                console.warn(`Could not sync ${fetchPath}:`, e);
            }
        }
    },
    async renderSystemTree() {
        const div = document.getElementById('system-tree');
        if (!div) return;
        div.innerHTML = '';
        
        // Build tree structure from cached files
        const tree = {};
        
        for (const filePath of this.loadedFiles) {
            const parts = filePath.split('/');
            let current = tree;
            for (let i = 0; i < parts.length - 1; i++) {
                const folder = parts[i];
                if (!current[folder]) current[folder] = {};
                current = current[folder];
            }
            current[parts[parts.length - 1]] = true; // Mark as file
        }
        
        // Render tree recursively
        this.renderTreeNode(tree, div, 0);
    },
    renderTreeNode(node, parentEl, level, pathPrefix = '') {
        const entries = Object.entries(node);
        
        for (const [name, value] of entries) {
            const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
            
            if (value === true) {
                // It's a file
                this.createSystemFile(name, fullPath, parentEl, level);
            } else if (typeof value === 'object') {
                // It's a folder
                this.createSystemFolder(name, parentEl, level);
                this.renderTreeNode(value, parentEl, level + 1, fullPath);
            }
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
    createSystemFile(name, fullPath, parentEl, level) {
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
        
        content.onclick = async () => this.loadFile(fullPath);
        parentEl.appendChild(el);
    },
    async loadFile(filePath) {
        // Extract just the filename for display
        const filename = filePath.split('/').pop();
        
        if (this.loadedFiles.has(filePath)) {
            const existing = Store.state.buffers.find(b => b.name === filename && b.kind === 'system');
            if (existing) return Store.setActive(existing.id);
        }
        
        try {
            UI.toast(`Loading ${filename}...`);
            
            // Check if file was pre-cached
            let content = this.fileCache.get(filePath);
            if (!content) {
                const response = await fetch(`filesys/${filePath}`);
                if (!response.ok) {
                    // File doesn't exist - create new empty file instead of error
                    content = '';
                    UI.toast(`Created new file: ${filename}`);
                } else {
                    content = await response.text();
                }
            }
            
            this.fileCache.set(filePath, content);
            this.loadedFiles.add(filePath);
            
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
    },
    // Template system
    async loadTemplates() {
        const templateFiles = [
            'basic.js', 'class.js', 'module.js',
            'basic.html',
            'basic.css',
            'readme.md', 'notes.md'
        ];
        
        for (const file of templateFiles) {
            try {
                const response = await fetch(`filesys/templates/${file}`, { cache: 'no-store' });
                if (response.ok) {
                    const content = await response.text();
                    const ext = file.split('.').pop().toLowerCase();
                    const name = file.replace(/\.[^.]+$/, ''); // Remove extension
                    
                    if (!this.templates.has(ext)) {
                        this.templates.set(ext, []);
                    }
                    this.templates.get(ext).push({ name, filename: file, content });
                }
            } catch (e) {
                console.warn(`Could not load template ${file}:`, e);
            }
        }
    },
    getTemplatesForExtension(ext) {
        ext = ext.toLowerCase().replace('.', '');
        return this.templates.get(ext) || [];
    },
    applyTemplateVariables(content, filename) {
        const name = filename.replace(/\.[^.]+$/, ''); // Remove extension
        const date = new Date().toLocaleDateString();
        return content
            .replace(/\$\{name\}/g, name)
            .replace(/\$\{date\}/g, date);
    }
};
