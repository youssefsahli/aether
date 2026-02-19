/**
 * System File System Module
 * Lazy loading of system files (docs, config, etc.)
 * Templates are mirrored to OPFS for user customization
 */

const SystemFS = {
    fileCache: new Map(),
    loadedFiles: new Set(),
    filesysStructure: {},
    templates: new Map(), // Template cache: extension -> [{name, content, source}]
    templatesDir: null, // OPFS handle for templates directory
    
    // All bundled template files
    bundledTemplates: [
        'basic.js', 'class.js', 'module.js', 'api.js', 'async.js', 'events.js', 'store.js', 'test.js',
        'basic.html', 'canvas.html', 'form.html',
        'basic.css', 'animations.css', 'flexbox.css', 'grid.css',
        'readme.md', 'notes.md', 'changelog.md', 'api-docs.md'
    ],
    
    async init() {
        await this.syncFilesysFolder();
        await this.initTemplatesFolder();
        await this.loadTemplates();
        await this.renderSystemTree();
    },
    
    async initTemplatesFolder() {
        // Create templates directory in OPFS if it doesn't exist
        if (!Store.state.opfsRoot) return;
        
        try {
            this.templatesDir = await Store.state.opfsRoot.getDirectoryHandle('templates', { create: true });
            
            // Check if templates were already synced
            const syncMarker = await this.checkSyncMarker();
            if (!syncMarker) {
                await this.syncBundledTemplatesToOPFS();
            }
        } catch (e) {
            console.warn('Could not initialize templates folder:', e);
        }
    },
    
    async checkSyncMarker() {
        // Check if we've already synced templates (avoid overwriting user changes)
        try {
            await this.templatesDir.getFileHandle('.synced', { create: false });
            return true;
        } catch (e) {
            return false;
        }
    },
    
    async syncBundledTemplatesToOPFS() {
        // Copy all bundled templates to OPFS
        if (!this.templatesDir) return;
        
        for (const file of this.bundledTemplates) {
            try {
                const response = await fetch(`filesys/templates/${file}`, { cache: 'no-store' });
                if (response.ok) {
                    const content = await response.text();
                    const handle = await this.templatesDir.getFileHandle(file, { create: true });
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                }
            } catch (e) {
                // Silently skip failed templates
            }
        }
        
        // Mark as synced
        try {
            const marker = await this.templatesDir.getFileHandle('.synced', { create: true });
            const writable = await marker.createWritable();
            await writable.write(new Date().toISOString());
            await writable.close();
        } catch (e) {
            // Ignore
        }
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
        
        // Add templates folder link (opens template manager)
        this.createTemplatesLink(div);
    },
    
    createTemplatesLink(parentEl) {
        const el = document.createElement('div');
        el.className = 'tree-item is-directory';
        el.setAttribute('data-tree-name', 'templates');
        el.setAttribute('data-tree-level', 0);
        el.setAttribute('data-tree-type', 'directory');
        el.style.paddingLeft = '12px';
        el.style.cursor = 'pointer';
        
        const content = document.createElement('span');
        content.className = 'tree-item-content';
        
        const icon = document.createElement('span');
        icon.innerHTML = Icons.folder;
        icon.style.display = 'inline-flex';
        
        const text = document.createElement('span');
        text.textContent = 'templates';
        text.style.color = 'var(--accent)';
        
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:9px; padding:1px 4px; background:var(--accent); color:var(--bg); border-radius:3px; margin-left:6px;';
        let count = 0;
        for (const templates of this.templates.values()) count += templates.length;
        badge.textContent = count;
        
        content.appendChild(icon);
        content.appendChild(text);
        content.appendChild(badge);
        el.appendChild(content);
        
        el.onclick = () => TemplateManager.open();
        parentEl.appendChild(el);
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
    // Template system - now loads from OPFS
    async loadTemplates() {
        this.templates.clear();
        
        // Try to load from OPFS first (user-customizable)
        if (this.templatesDir) {
            try {
                for await (const [name, handle] of this.templatesDir.entries()) {
                    if (handle.kind === 'file' && !name.startsWith('.')) {
                        try {
                            const file = await handle.getFile();
                            const content = await file.text();
                            const ext = name.split('.').pop().toLowerCase();
                            const templateName = name.replace(/\.[^.]+$/, '');
                            
                            if (!this.templates.has(ext)) {
                                this.templates.set(ext, []);
                            }
                            this.templates.get(ext).push({ 
                                name: templateName, 
                                filename: name, 
                                content,
                                source: 'opfs',
                                handle
                            });
                        } catch (e) {
                            // Skip corrupted files
                        }
                    }
                }
                return; // Successfully loaded from OPFS
            } catch (e) {
                console.warn('Could not load templates from OPFS:', e);
            }
        }
        
        // Fallback: load from bundled files
        for (const file of this.bundledTemplates) {
            try {
                const response = await fetch(`filesys/templates/${file}`, { cache: 'no-store' });
                if (response.ok) {
                    const content = await response.text();
                    const ext = file.split('.').pop().toLowerCase();
                    const name = file.replace(/\.[^.]+$/, '');
                    
                    if (!this.templates.has(ext)) {
                        this.templates.set(ext, []);
                    }
                    this.templates.get(ext).push({ name, filename: file, content, source: 'bundled' });
                }
            } catch (e) {
                // Silently skip
            }
        }
    },
    
    async saveAsTemplate(filename, content) {
        // Save current file as a template to OPFS
        if (!this.templatesDir) {
            UI.toast('Templates folder not available');
            return false;
        }
        
        try {
            const handle = await this.templatesDir.getFileHandle(filename, { create: true });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Refresh templates
            await this.loadTemplates();
            UI.toast(`Template saved: ${filename}`);
            return true;
        } catch (e) {
            UI.toast('Failed to save template');
            console.error('Save template failed:', e);
            return false;
        }
    },
    
    async deleteTemplate(filename) {
        if (!this.templatesDir) return false;
        
        try {
            await this.templatesDir.removeEntry(filename);
            await this.loadTemplates();
            UI.toast(`Template deleted: ${filename}`);
            return true;
        } catch (e) {
            UI.toast('Failed to delete template');
            return false;
        }
    },
    
    async openTemplate(filename) {
        // Open a template for editing
        if (!this.templatesDir) return;
        
        try {
            const handle = await this.templatesDir.getFileHandle(filename, { create: false });
            const file = await handle.getFile();
            const content = await file.text();
            App.openBuffer(filename, content, handle, 'opfs');
        } catch (e) {
            UI.toast(`Could not open template: ${filename}`);
        }
    },
    
    async resetTemplates() {
        // Reset templates to bundled defaults
        if (!this.templatesDir) return;
        
        Confirm.open('Reset Templates', 'This will overwrite all custom templates with defaults. Continue?', async () => {
            try {
                // Remove sync marker to force re-sync
                try {
                    await this.templatesDir.removeEntry('.synced');
                } catch (e) {
                    // Ignore
                }
                
                await this.syncBundledTemplatesToOPFS();
                await this.loadTemplates();
                UI.toast('Templates reset to defaults');
            } catch (e) {
                UI.toast('Failed to reset templates');
            }
        });
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
