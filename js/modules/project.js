/**
 * Project Module
 * OPFS multi-file project support
 */

const Project = {
    current: null, // { name: string, root: string, files: string[] }
    
    /**
     * Create a new project in the specified OPFS directory
     */
    async create(name, rootPath = '') {
        // Validate name
        if (!name || !name.trim()) {
            UI.toast('Project name required');
            return false;
        }
        
        // Close existing OPFS tabs first
        await this._closeOPFSTabs();
        
        const projectData = {
            name: name.trim(),
            root: rootPath,
            files: [],
            created: Date.now(),
            modified: Date.now()
        };
        
        // Save project file to OPFS
        try {
            const dir = rootPath 
                ? await this._getDir(rootPath) 
                : Store.state.opfsRoot;
            
            if (!dir) {
                UI.toast('Could not access directory');
                return false;
            }
            
            const handle = await dir.getFileHandle('.aether-project.json', { create: true });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(projectData, null, 2));
            await writable.close();
            
            this.current = projectData;
            this._updateUI();
            FileSys.renderOPFS();
            UI.toast(`Project "${name}" created`);
            return true;
        } catch (e) {
            console.error('Failed to create project:', e);
            UI.toast('Failed to create project');
            return false;
        }
    },
    
    /**
     * Open an existing project from OPFS
     */
    async open(projectPath = '') {
        try {
            // Close existing OPFS tabs first
            await this._closeOPFSTabs();
            
            const dir = projectPath 
                ? await this._getDir(projectPath) 
                : Store.state.opfsRoot;
            
            if (!dir) {
                UI.toast('Could not access directory');
                return false;
            }
            
            // Try to read project file
            let projectData;
            try {
                const handle = await dir.getFileHandle('.aether-project.json', { create: false });
                const file = await handle.getFile();
                projectData = JSON.parse(await file.text());
            } catch (e) {
                UI.toast('No project found in this directory');
                return false;
            }
            
            // Set current project
            this.current = { ...projectData, root: projectPath };
            this._updateUI();
            
            // Open all project files
            let openedCount = 0;
            for (const filePath of projectData.files || []) {
                const fullPath = projectPath ? `${projectPath}/${filePath}` : filePath;
                const handle = await this._getFileHandle(fullPath);
                if (handle) {
                    try {
                        const file = await handle.getFile();
                        const content = await file.text();
                        const fileName = filePath.split('/').pop();
                        App.openBuffer(fileName, content, handle, 'opfs');
                        openedCount++;
                    } catch (e) {
                        console.warn(`Could not open project file: ${filePath}`, e);
                    }
                }
            }
            
            UI.toast(`Opened project "${projectData.name}" (${openedCount} files)`);
            FileSys.renderOPFS();
            return true;
        } catch (e) {
            console.error('Failed to open project:', e);
            UI.toast('Failed to open project');
            return false;
        }
    },
    
    /**
     * Close current project (close all OPFS buffers but keep project metadata)
     */
    async close(promptSave = true) {
        if (!this.current) {
            UI.toast('No project open');
            return;
        }
        
        // Check for dirty OPFS buffers
        const opfsBuffers = Store.state.buffers.filter(b => b.kind === 'opfs');
        const dirtyBuffers = opfsBuffers.filter(b => b.dirty);
        
        if (promptSave && dirtyBuffers.length > 0) {
            const save = confirm(`Save ${dirtyBuffers.length} unsaved file(s) before closing project?`);
            if (save) {
                for (const buf of dirtyBuffers) {
                    await FileSys.saveBuffer(buf);
                }
            }
        }
        
        // Save project state (current files list)
        await this.save();
        
        // Close all OPFS buffers
        const bufferIds = opfsBuffers.map(b => b.id);
        for (const id of bufferIds) {
            Store.closeBuffer(id);
        }
        
        const projectName = this.current.name;
        this.current = null;
        this._updateUI();
        FileSys.renderOPFS();
        UI.toast(`Closed project "${projectName}"`);
    },
    
    /**
     * Save current project metadata (updates file list based on open OPFS buffers)
     */
    async save() {
        if (!this.current) return false;
        
        try {
            const dir = this.current.root 
                ? await this._getDir(this.current.root) 
                : Store.state.opfsRoot;
            
            if (!dir) return false;
            
            // Update files list from currently open OPFS buffers
            const opfsBuffers = Store.state.buffers.filter(b => b.kind === 'opfs');
            this.current.files = opfsBuffers.map(b => b.name);
            this.current.modified = Date.now();
            
            const handle = await dir.getFileHandle('.aether-project.json', { create: true });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(this.current, null, 2));
            await writable.close();
            
            return true;
        } catch (e) {
            console.error('Failed to save project:', e);
            return false;
        }
    },
    
    /**
     * List available projects in OPFS (directories containing .aether-project.json)
     */
    async listProjects() {
        const projects = [];
        if (!Store.state.opfsRoot) return projects;
        
        // Check root for project file
        try {
            const handle = await Store.state.opfsRoot.getFileHandle('.aether-project.json', { create: false });
            const file = await handle.getFile();
            const data = JSON.parse(await file.text());
            projects.push({ name: data.name, path: '', data });
        } catch (e) { /* no root project */ }
        
        // Check subdirectories
        for await (const [name, handle] of Store.state.opfsRoot.entries()) {
            if (handle.kind === 'directory' && name !== 'templates') {
                try {
                    const projHandle = await handle.getFileHandle('.aether-project.json', { create: false });
                    const file = await projHandle.getFile();
                    const data = JSON.parse(await file.text());
                    projects.push({ name: data.name, path: name, data });
                } catch (e) { /* not a project dir */ }
            }
        }
        
        return projects;
    },
    
    /**
     * Delete a project (removes .aether-project.json, keeps files)
     */
    async delete(projectPath = '') {
        try {
            const dir = projectPath 
                ? await this._getDir(projectPath) 
                : Store.state.opfsRoot;
            
            if (!dir) {
                UI.toast('Could not access directory');
                return false;
            }
            
            // Remove project file
            await dir.removeEntry('.aether-project.json');
            
            // If this was the current project, close it
            if (this.current && this.current.root === projectPath) {
                await this._closeOPFSTabs();
                this.current = null;
                this._updateUI();
                FileSys.renderOPFS();
            }
            
            UI.toast('Project deleted');
            return true;
        } catch (e) {
            console.error('Failed to delete project:', e);
            UI.toast('Failed to delete project');
            return false;
        }
    },
    
    // === Helpers ===
    
    /**
     * Close all OPFS tabs without prompting
     */
    async _closeOPFSTabs() {
        const opfsBuffers = Store.state.buffers.filter(b => b.kind === 'opfs');
        for (const buf of opfsBuffers) {
            Store.closeBuffer(buf.id);
        }
    },
    
    async _getDir(path) {
        if (!path || !Store.state.opfsRoot) return Store.state.opfsRoot;
        
        const parts = path.split('/').filter(p => p);
        let dir = Store.state.opfsRoot;
        
        for (const part of parts) {
            try {
                dir = await dir.getDirectoryHandle(part, { create: false });
            } catch (e) {
                return null;
            }
        }
        return dir;
    },
    
    async _getFileHandle(path) {
        if (!path || !Store.state.opfsRoot) return null;
        
        const parts = path.split('/').filter(p => p);
        if (parts.length === 0) return null;
        
        const filename = parts.pop();
        let dir = Store.state.opfsRoot;
        
        for (const part of parts) {
            try {
                dir = await dir.getDirectoryHandle(part, { create: false });
            } catch (e) {
                return null;
            }
        }
        
        try {
            return await dir.getFileHandle(filename, { create: false });
        } catch (e) {
            return null;
        }
    },
    
    _updateUI() {
        // Breadcrumb display
        const el = document.getElementById('project-name');
        const sep = document.getElementById('project-sep');
        // OPFS sidebar project name
        const projectNameEl = document.getElementById('opfs-project-name');
        // Project toolbar buttons
        const closeBtn = document.getElementById('btn-close-project');
        const saveBtn = document.getElementById('btn-save-project');
        
        if (this.current) {
            // Show project name in breadcrumbs
            if (el) {
                el.textContent = this.current.name;
                el.title = `Project: ${this.current.name}`;
                el.style.display = 'inline';
            }
            if (sep) sep.style.display = 'inline';
            
            // Show project name in OPFS section
            if (projectNameEl) {
                projectNameEl.textContent = this.current.name;
                projectNameEl.classList.remove('no-project');
            }
            
            // Show close/save buttons
            if (closeBtn) closeBtn.style.display = 'inline-flex';
            if (saveBtn) saveBtn.style.display = 'inline-flex';
        } else {
            // Hide everything
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
            if (sep) sep.style.display = 'none';
            if (projectNameEl) {
                projectNameEl.textContent = 'No Project';
                projectNameEl.classList.add('no-project');
            }
            if (closeBtn) closeBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'none';
        }
    },
    
    /**
     * Ensure a project exists, creating "Untitled" if needed
     */
    async ensureProject() {
        if (this.current) return this.current;
        
        // Try to open existing project first
        const projects = await this.listProjects();
        if (projects.length > 0) {
            await this.open(projects[0].path);
            return this.current;
        }
        
        // Create default "Untitled" project silently
        const projectData = {
            name: 'Untitled',
            root: '',
            files: [],
            created: Date.now(),
            modified: Date.now()
        };
        
        try {
            const handle = await Store.state.opfsRoot.getFileHandle('.aether-project.json', { create: true });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(projectData, null, 2));
            await writable.close();
            
            this.current = projectData;
            this._updateUI();
            FileSys.renderOPFS();
            return this.current;
        } catch (e) {
            console.warn('Could not create default project:', e);
            return null;
        }
    },
    
    /**
     * Show project picker dialog
     */
    async showPicker() {
        const projects = await this.listProjects();
        
        // Build selection list with delete action
        const items = projects.map(p => ({
            label: p.name,
            hint: p.path || '(root)',
            fn: () => this.open(p.path),
            deleteFn: () => {
                if (confirm(`Delete project "${p.name}"? Files will be kept.`)) {
                    this.delete(p.path);
                    Commands.hidePalette();
                }
            }
        }));
        
        // Add "New Project" option
        items.push({
            label: '+ New Project',
            hint: 'Create',
            fn: () => {
                Prompt.open('Project name:', 'my-project', async (name) => {
                    if (name) await this.create(name);
                });
            }
        });
        
        // Use the command palette infrastructure to show picker
        this._showPicker(items);
    },
    
    _showPicker(items) {
        const mask = document.getElementById('palette-mask');
        const list = document.getElementById('cmd-list');
        const input = document.getElementById('cmd-input');
        
        const render = (filter = '') => {
            list.innerHTML = '';
            const terms = filter.toLowerCase();
            items.filter(i => i.label.toLowerCase().includes(terms))
                .forEach((item, idx) => {
                    const el = document.createElement('div');
                    el.className = 'cmd-item';
                    if (idx === 0) el.classList.add('selected');
                    
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = item.label;
                    
                    const rightSide = document.createElement('div');
                    rightSide.style.cssText = 'display:flex; align-items:center; gap:8px;';
                    
                    const hintSpan = document.createElement('span');
                    hintSpan.className = 'cmd-shortcut';
                    hintSpan.textContent = item.hint;
                    rightSide.appendChild(hintSpan);
                    
                    // Add delete button if deleteFn exists
                    if (item.deleteFn) {
                        const delBtn = document.createElement('button');
                        delBtn.className = 'btn';
                        delBtn.style.cssText = 'width:20px; height:20px; padding:0; color:var(--log-error);';
                        delBtn.innerHTML = Icons.trash;
                        delBtn.title = 'Delete project';
                        delBtn.onclick = (e) => { e.stopPropagation(); item.deleteFn(); };
                        rightSide.appendChild(delBtn);
                    }
                    
                    el.appendChild(labelSpan);
                    el.appendChild(rightSide);
                    el.onclick = () => { item.fn(); Commands.hidePalette(); };
                    list.appendChild(el);
                });
        };
        
        mask.style.display = 'flex';
        input.value = '';
        input.placeholder = 'Select project...';
        input.focus();
        render();
        
        input.oninput = (e) => render(e.target.value);
        input.onkeydown = (e) => {
            if (e.key === 'Escape') Commands.hidePalette();
            if (e.key === 'Enter') {
                const first = list.querySelector('.cmd-item');
                if (first) first.click();
            }
        };
        
        // Restore placeholder when closing
        const observer = new MutationObserver(() => {
            if (mask.style.display === 'none') {
                input.placeholder = 'Type a command...';
                observer.disconnect();
            }
        });
        observer.observe(mask, { attributes: true, attributeFilter: ['style'] });
    }
};
