/**
 * File System Module
 * Handles workspace and OPFS file operations
 */

const FileSys = {
    rootDir: null,
    _opfsHandles: {}, // Cache handles for event delegation
    async initOPFS() {
        try {
            if (!navigator.storage?.getDirectory) throw 1;
            Store.state.opfsRoot = await navigator.storage.getDirectory();
            this.renderOPFS();
            // Use event delegation for OPFS tree
            document.getElementById('opfs-tree').addEventListener('click', (e) => this._handleOPFSTreeClick(e));
        } catch (e) { document.getElementById('opfs-header').innerText = "OPFS Not Available"; }
    },
    async _handleOPFSTreeClick(e) {
        // Handle toggle button (including clicks on SVG icon inside)
        const toggleBtn = e.target.closest('.tree-item-toggle');
        if (toggleBtn) {
            e.stopPropagation();
            const item = toggleBtn.closest('.tree-item');
            const isCollapsed = item.classList.toggle('collapsed');
            const dirLevel = parseInt(item.getAttribute('data-tree-level') || 0);
            let next = item.nextElementSibling;
            while (next && parseInt(next.getAttribute('data-tree-level') || 0) > dirLevel) {
                if (isCollapsed) {
                    next.classList.add('hidden-by-parent');
                } else {
                    // Only show direct children; nested items stay hidden if their parent is collapsed
                    const nextLevel = parseInt(next.getAttribute('data-tree-level') || 0);
                    if (nextLevel === dirLevel + 1) {
                        next.classList.remove('hidden-by-parent');
                    } else if (!next.classList.contains('collapsed')) {
                        // Check if any ancestor between this and the toggled item is collapsed
                        next.classList.remove('hidden-by-parent');
                    }
                }
                next = next.nextElementSibling;
            }
            return;
        }
        
        // Handle delete button (including clicks on SVG icon inside)
        const deleteBtn = e.target.closest('.action-delete');
        if (deleteBtn) {
            e.stopPropagation();
            const item = deleteBtn.closest('.tree-item');
            const name = item.getAttribute('data-tree-name');
            const type = item.getAttribute('data-tree-type');
            if (type === 'directory') {
                await this.deleteOPFSDir(name);
            } else {
                await this.deleteOPFSFile(name);
            }
            return;
        }
        
        // Handle add file button on directories
        const addBtn = e.target.closest('.action-add');
        if (addBtn) {
            e.stopPropagation();
            const item = addBtn.closest('.tree-item');
            const dirPath = item.getAttribute('data-tree-name');
            await this.createOPFSFile(dirPath);
            return;
        }
        
        // Handle main file toggle button
        const mainBtn = e.target.closest('.action-main');
        if (mainBtn) {
            e.stopPropagation();
            const item = mainBtn.closest('.tree-item');
            const fullPath = item.getAttribute('data-tree-name');
            await this.toggleMainFile(fullPath);
            return;
        }
        
        // Handle rename button (including clicks on SVG icon inside)
        const actionBtn = e.target.closest('.action-btn');
        if (actionBtn && !actionBtn.classList.contains('action-delete') && !actionBtn.classList.contains('action-add') && !actionBtn.classList.contains('action-main')) {
            e.stopPropagation();
            const item = actionBtn.closest('.tree-item');
            const name = item.getAttribute('data-tree-name');
            await this.renameOPFSFile(name, this._opfsHandles[name]);
            return;
        }
        
        // Handle clicking on file content (including icon or text inside)
        const contentEl = e.target.closest('.tree-item-content');
        const treeItem = e.target.closest('.tree-item');
        if (contentEl && treeItem && treeItem.classList.contains('is-file')) {
            e.stopPropagation();
            e.preventDefault();
            const fullPath = treeItem.getAttribute('data-tree-name');
            const handle = this._opfsHandles[fullPath];
            if (handle) {
                // Use just the filename for the tab display, but store fullPath for project tracking
                const fileName = fullPath.split('/').pop();
                App.openBuffer(fileName, await (await handle.getFile()).text(), handle, 'opfs', fullPath);
            }
        }
    },
    async renderOPFS() {
        const tree = document.getElementById('opfs-tree');
        tree.innerHTML = '';
        this._opfsHandles = {}; // Clear cache
        
        if (!Store.state.opfsRoot) return;
        
        // If no project, show message
        if (!Project.current) {
            const msg = document.createElement('div');
            msg.className = 'tree-empty-msg';
            msg.style.cssText = 'padding: 12px; color: var(--text-dim); font-size: 11px; font-style: italic;';
            msg.textContent = 'No project open';
            tree.appendChild(msg);
            return;
        }
        
        // Get project root directory
        const projectRoot = Project.current.root 
            ? await this._getProjectDir(Project.current.root)
            : Store.state.opfsRoot;
        
        if (!projectRoot) return;
        
        const projectFiles = Project.current.files || [];
        
        // If project has no files, show hint
        if (projectFiles.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'tree-empty-msg';
            msg.style.cssText = 'padding: 12px; color: var(--text-dim); font-size: 11px; font-style: italic;';
            msg.textContent = 'No files in project. Create a new file to get started.';
            tree.appendChild(msg);
            return;
        }
        
        // Build a tree structure from project files
        const fileTree = this._buildFileTree(projectFiles);
        
        // Render the tree
        await this._renderProjectTree(projectRoot, fileTree, tree, 0, '');
    },
    
    /**
     * Build a nested tree structure from flat file paths
     */
    _buildFileTree(filePaths) {
        const root = {};
        
        for (const filePath of filePaths) {
            const parts = filePath.split('/').filter(p => p);
            let current = root;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isFile = i === parts.length - 1;
                
                if (!current[part]) {
                    current[part] = isFile ? null : {}; // null = file, {} = directory
                }
                
                if (!isFile) {
                    current = current[part];
                }
            }
        }
        
        return root;
    },
    
    /**
     * Render the project file tree (only project files and their parent directories)
     */
    async _renderProjectTree(dirHandle, treeNode, parentEl, level, parentPath) {
        // Get sorted entries: directories first, then files
        const entries = Object.entries(treeNode).sort((a, b) => {
            const aIsDir = a[1] !== null;
            const bIsDir = b[1] !== null;
            if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
            return a[0].localeCompare(b[0]);
        });
        
        for (const [name, children] of entries) {
            const fullPath = parentPath ? `${parentPath}/${name}` : name;
            const isDirectory = children !== null;
            
            if (isDirectory) {
                // Get directory handle
                let childDirHandle;
                try {
                    childDirHandle = await dirHandle.getDirectoryHandle(name, { create: false });
                } catch (e) {
                    console.warn(`Directory not found: ${fullPath}`);
                    continue;
                }
                
                // Render directory
                const el = document.createElement('div');
                el.className = 'tree-item is-directory';
                el.setAttribute('data-tree-name', fullPath);
                el.setAttribute('data-tree-type', 'directory');
                el.setAttribute('data-tree-level', level);
                el.style.paddingLeft = `${12 + level * 16}px`;
                
                const toggle = document.createElement('span');
                toggle.className = 'tree-item-toggle';
                toggle.innerHTML = Icons.chevronRight;
                
                const content = document.createElement('span');
                content.className = 'tree-item-content';
                const icon = document.createElement('span');
                icon.innerHTML = Icons.folder;
                icon.style.display = 'inline-flex';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                content.appendChild(icon);
                content.appendChild(nameSpan);
                
                el.appendChild(toggle);
                el.appendChild(content);
                
                // Add actions for directories
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                
                const addBtn = document.createElement('span');
                addBtn.className = 'action-btn action-add';
                addBtn.title = 'New file in folder';
                addBtn.innerHTML = Icons.plus;
                actions.appendChild(addBtn);
                
                const delBtn = document.createElement('span');
                delBtn.className = 'action-btn action-delete';
                delBtn.title = 'Delete folder';
                delBtn.innerHTML = Icons.trash;
                actions.appendChild(delBtn);
                el.appendChild(actions);
                
                parentEl.appendChild(el);
                
                // Recursively render children
                await this._renderProjectTree(childDirHandle, children, parentEl, level + 1, fullPath);
            } else {
                // Get file handle
                let fileHandle;
                try {
                    fileHandle = await dirHandle.getFileHandle(name, { create: false });
                } catch (e) {
                    console.warn(`File not found: ${fullPath}`);
                    continue;
                }
                
                // Cache handle
                this._opfsHandles[fullPath] = fileHandle;
                
                // Render file
                const el = document.createElement('div');
                el.className = 'tree-item is-file';
                el.setAttribute('data-tree-name', fullPath);
                el.setAttribute('data-tree-type', 'file');
                el.setAttribute('data-tree-level', level);
                el.style.paddingLeft = `${12 + level * 16}px`;
                
                const content = document.createElement('span');
                content.className = 'tree-item-content';
                const icon = document.createElement('span');
                icon.innerHTML = Icons.file;
                icon.style.display = 'inline-flex';
                const fileText = document.createElement('span');
                fileText.textContent = name;
                content.appendChild(icon);
                content.appendChild(fileText);
                el.appendChild(content);
                
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                
                const renBtn = document.createElement('span');
                renBtn.className = 'action-btn'; 
                renBtn.title = "Rename";
                renBtn.innerHTML = Icons.edit;
                
                const mainBtn = document.createElement('span');
                mainBtn.className = 'action-btn action-main';
                mainBtn.title = "Set as main preview file";
                const isMain = Project.current?.config?.mainFile === fullPath;
                mainBtn.innerHTML = isMain ? Icons.pinFilled : Icons.pin;
                if (isMain) {
                    mainBtn.classList.add('is-main');
                    el.classList.add('is-main-file');
                }
                
                const delBtn = document.createElement('span');
                delBtn.className = 'action-btn action-delete'; 
                delBtn.title = "Delete";
                delBtn.innerHTML = Icons.trash;
                
                actions.append(mainBtn, renBtn, delBtn);
                el.append(actions);
                parentEl.appendChild(el);
            }
        }
    },
    
    async _getProjectDir(path) {
        if (!path) return Store.state.opfsRoot;
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
    async createOPFSFile(parentPath = '') {
        // Use NewFilePrompt for template support
        NewFilePrompt.open(async (name, content) => {
            if (!name) return;
            try {
                // Ensure project exists (creates Untitled if none)
                await Project.ensureProject();
                
                // Get project root directory
                const projectRoot = Project.current?.root 
                    ? await this._getProjectDir(Project.current.root)
                    : Store.state.opfsRoot;
                
                if (!projectRoot) {
                    UI.toast('Could not access project directory');
                    return;
                }
                
                // Build full path (may include subdirectories from filename like "scripts/run.js")
                const inputParts = name.split('/').filter(p => p);
                const fileName = inputParts.pop();
                const dirParts = parentPath ? parentPath.split('/').filter(p => p).concat(inputParts) : inputParts;
                
                // Navigate/create directories as needed
                let currentDir = projectRoot;
                for (const dir of dirParts) {
                    currentDir = await currentDir.getDirectoryHandle(dir, { create: true });
                }
                
                const handle = await currentDir.getFileHandle(fileName, { create: true });
                
                // Write initial content if provided (from template)
                if (content) {
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                }
                
                // Full path for project tracking
                const fullPath = dirParts.length > 0 ? `${dirParts.join('/')}/${fileName}` : fileName;
                
                App.openBuffer(fileName, content || "", handle, 'opfs', fullPath);
                
                // Add file to project files list
                if (Project.current && !Project.current.files.includes(fullPath)) {
                    Project.current.files.push(fullPath);
                    await Project._saveWithoutFileListUpdate();
                }
                
                this.renderOPFS();
            } catch (e) { 
                console.error('Error creating file:', e);
                UI.toast('Error creating file'); 
            }
        });
    },
    async createOPFSDir() {
        if (!Store.state.opfsRoot) {
            UI.toast('Local Storage not available.');
            return;
        }
        
        // Ensure project exists
        await Project.ensureProject();
        
        // Get project root directory
        const projectRoot = Project.current?.root 
            ? await this._getProjectDir(Project.current.root)
            : Store.state.opfsRoot;
        
        if (!projectRoot) {
            UI.toast('Could not access project directory');
            return;
        }
        
        Prompt.open("New Directory Name:", "new-folder", async (name) => {
            if (!name || name.trim() === '') return;
            try {
                await projectRoot.getDirectoryHandle(name.trim(), { create: true });
                UI.toast(`Directory created: ${name}. Add a file to see it in the tree.`);
                // Prompt to create first file in the new directory
                this.createOPFSFile(name.trim());
            } catch (e) { 
                console.error('Error creating directory:', e);
                UI.toast('Error: ' + (e.message || 'Could not create directory')); 
            }
        });
    },
    async createWorkspaceDir() {
        if (!this.rootDir) {
            UI.toast('No workspace open. Open a folder first.');
            return;
        }
        Prompt.open("New Directory Name:", "new-folder", async (name) => {
            if (!name || name.trim() === '') return;
            try {
                await this.rootDir.getDirectoryHandle(name.trim(), { create: true });
                await this.renderWorkspace(this.rootDir);
                UI.toast(`Directory created: ${name}`);
            } catch (e) { 
                console.error('Error creating directory:', e);
                UI.toast('Error: ' + (e.message || 'Could not create directory')); 
            }
        });
    },
    async renameOPFSFile(fullPath, handle) {
        const parts = fullPath.split('/').filter(p => p);
        const oldName = parts.pop();
        const dirParts = parts;
        
        Prompt.open(`Rename "${oldName}" to:`, oldName, async (newName) => {
            if (!newName || newName === oldName) return;
            try {
                // Get project root directory
                let parentHandle = Project.current?.root 
                    ? await this._getProjectDir(Project.current.root)
                    : Store.state.opfsRoot;
                
                // Navigate to parent directory within project
                for (const part of dirParts) {
                    parentHandle = await parentHandle.getDirectoryHandle(part);
                }
                
                const file = await handle.getFile();
                const content = await file.text();
                const newHandle = await parentHandle.getFileHandle(newName, { create: true });
                const writable = await newHandle.createWritable();
                await writable.write(content);
                await writable.close();
                await parentHandle.removeEntry(oldName);

                // Update buffer if open - match by handle reference for accuracy
                const buf = Store.state.buffers.find(b => b.handle === handle || (b.name === oldName && b.kind === 'opfs'));
                if (buf) { 
                    buf.name = newName; 
                    buf.handle = newHandle; 
                    UI.renderTabs(true); // Force full render to update tab name
                    if (Store.activeBuffer && Store.activeBuffer.id === buf.id) {
                        document.getElementById('bc-filename').innerText = newName;
                    }
                }

                // Update project files list directly (don't rely on save() which only includes open buffers)
                if (Project.current && Project.current.files) {
                    const idx = Project.current.files.indexOf(fullPath);
                    if (idx >= 0) {
                        const newPath = dirParts.length > 0 ? `${dirParts.join('/')}/${newName}` : newName;
                        Project.current.files[idx] = newPath;
                    }
                    // Save project without overwriting files list
                    await Project._saveWithoutFileListUpdate();
                }

                this.renderOPFS(); UI.toast('Renamed');
            } catch (e) { UI.toast('Rename Failed'); console.error('Rename error:', e); }
        });
    },
    async deleteOPFSFile(path) {
        const parts = path.split('/').filter(p => p);
        const name = parts.pop();
        const displayName = path;
        
        Confirm.open("Delete File", `Permanently delete "${displayName}"?`, async () => {
            try {
                // Get project root directory
                let parentHandle = Project.current?.root 
                    ? await this._getProjectDir(Project.current.root)
                    : Store.state.opfsRoot;
                
                // Navigate to parent directory within project
                for (const part of parts) {
                    parentHandle = await parentHandle.getDirectoryHandle(part);
                }
                
                await parentHandle.removeEntry(name);
                const buf = Store.state.buffers.find(b => b.name === name && b.kind === 'opfs');
                if (buf) Store.closeBuffer(buf.id);
                
                // Remove from project files list directly
                if (Project.current && Project.current.files) {
                    const idx = Project.current.files.indexOf(path);
                    if (idx >= 0) {
                        Project.current.files.splice(idx, 1);
                        await Project._saveWithoutFileListUpdate();
                    }
                }
                
                this.renderOPFS(); UI.toast('Deleted');
            } catch (e) { UI.toast('Delete failed'); }
        });
    },
    async deleteWorkspaceDir(dirPath) {
        Confirm.open("Delete Folder", `Permanently delete "${dirPath}" and all contents?`, async () => {
            try {
                const parts = dirPath.split('/');
                let currentHandle = this.rootDir;
                for (let i = 0; i < parts.length - 1; i++) {
                    currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
                }
                await currentHandle.removeEntry(parts[parts.length - 1], { recursive: true });
                await this.renderWorkspace(this.rootDir);
                UI.toast('Folder deleted');
            } catch (e) { 
                console.error('Delete failed:', e);
                UI.toast('Delete failed: ' + e.message); 
            }
        });
    },
    async deleteWorkspaceFile(filePath) {
        const parts = filePath.split('/');
        const fileName = parts.pop();
        
        Confirm.open("Delete File", `Permanently delete "${filePath}"?`, async () => {
            try {
                let currentHandle = this.rootDir;
                for (const part of parts) {
                    currentHandle = await currentHandle.getDirectoryHandle(part);
                }
                await currentHandle.removeEntry(fileName);
                
                // Close buffer if open
                const buf = Store.state.buffers.find(b => b.name === fileName && b.kind === 'disk');
                if (buf) Store.closeBuffer(buf.id);
                
                await this.renderWorkspace(this.rootDir);
                UI.toast('File deleted');
            } catch (e) { 
                console.error('Delete failed:', e);
                UI.toast('Delete failed: ' + e.message); 
            }
        });
    },
    async deleteOPFSDir(path) {
        const parts = path.split('/').filter(p => p);
        const name = parts.pop();
        const displayName = path;
        
        Confirm.open("Delete Folder", `Permanently delete "${displayName}" and all contents?`, async () => {
            try {
                // Get project root directory
                let parentHandle = Project.current?.root 
                    ? await this._getProjectDir(Project.current.root)
                    : Store.state.opfsRoot;
                
                // Navigate to parent directory within project
                for (const part of parts) {
                    parentHandle = await parentHandle.getDirectoryHandle(part);
                }
                
                await parentHandle.removeEntry(name, { recursive: true });
                
                // Remove all tracked files that were inside this directory from project
                if (Project.current && Project.current.files) {
                    const dirPrefix = path + '/';
                    Project.current.files = Project.current.files.filter(f => 
                        f !== path && !f.startsWith(dirPrefix)
                    );
                    await Project._saveWithoutFileListUpdate();
                }
                
                // Close any open buffers from this directory
                const buffersToClose = Store.state.buffers.filter(b => 
                    b.kind === 'opfs' && (b.name === name || this._opfsHandles[path + '/' + b.name])
                );
                for (const buf of buffersToClose) {
                    Store.closeBuffer(buf.id);
                }
                
                this.renderOPFS();
                UI.toast('Folder deleted');
            } catch (e) { 
                console.error('Delete failed:', e);
                UI.toast('Delete failed: ' + e.message); 
            }
        });
    },
    
    /**
     * Toggle a file as the main preview file for the project
     */
    async toggleMainFile(filePath) {
        if (!Project.current) {
            UI.toast('No project loaded');
            return;
        }
        
        // Initialize config if needed
        if (!Project.current.config) {
            Project.current.config = { ...Project.defaultConfig };
        }
        
        const previousMain = Project.current.config.mainFile;
        
        // Toggle: if current main file, unset it; otherwise set it
        if (Project.current.config.mainFile === filePath) {
            Project.current.config.mainFile = '';
            UI.toast('Main file cleared');
        } else {
            Project.current.config.mainFile = filePath;
            UI.toast(`Main file: ${filePath.split('/').pop()}`);
        }
        
        // Save project config
        await Project.save();
        
        // Update main file indicators without full re-render
        this._updateMainFileIndicators(previousMain, Project.current.config.mainFile);
        
        // Refresh preview if active
        if (Store.state.previewMode) {
            App.refreshPreview();
        }
    },
    
    /**
     * Update main file indicators in the tree without full re-render
     */
    _updateMainFileIndicators(oldMainPath, newMainPath) {
        const tree = document.getElementById('opfs-tree');
        
        // Remove old main file indicator
        if (oldMainPath) {
            const oldItem = tree.querySelector(`.tree-item[data-tree-name="${oldMainPath}"]`);
            if (oldItem) {
                oldItem.classList.remove('is-main-file');
                const mainBtn = oldItem.querySelector('.action-main');
                if (mainBtn) {
                    mainBtn.classList.remove('is-main');
                    mainBtn.innerHTML = Icons.pin;
                }
            }
        }
        
        // Add new main file indicator
        if (newMainPath) {
            const newItem = tree.querySelector(`.tree-item[data-tree-name="${newMainPath}"]`);
            if (newItem) {
                newItem.classList.add('is-main-file');
                const mainBtn = newItem.querySelector('.action-main');
                if (mainBtn) {
                    mainBtn.classList.add('is-main');
                    mainBtn.innerHTML = Icons.pinFilled;
                }
            }
        }
    },
    
    async saveBuffer(buf) {
        if (buf.name === 'config.json' && buf.kind === 'config') { Config.state = JSON.parse(buf.content); Config.save(); Store.markSaved(buf.id); return; }
        // Handle project config saves
        if (buf.kind === 'project-config') {
            const success = await Project.saveConfigFromBuffer(buf.content);
            if (success) Store.markSaved(buf.id);
            return;
        }
        try {
            let handle = buf.handle;
            if (!handle && buf.kind === 'memory') {
                handle = await window.showSaveFilePicker({ suggestedName: buf.name });
                buf.handle = handle; buf.kind = 'disk'; buf.name = handle.name;
            }
            const writable = await handle.createWritable();
            await writable.write(buf.content);
            await writable.close();
            Store.markSaved(buf.id);
            UI.toast(`Saved: ${buf.name}`);
        } catch (e) { UI.toast('Save Cancelled'); }
    },
    async openFolder() {
        try {
            const handle = await window.showDirectoryPicker();
            await DB.set('handles', 'rootDir', handle);
            // Navigate to filesys/ subdirectory if it exists
            await this.navigateToFilesysFolder(handle);
        } catch (e) { }
    },
    async openFile() {
        try {
            // Use the File System Access API to pick a single file
            const [handle] = await window.showOpenFilePicker();
            if (!handle) return;
            const file = await handle.getFile();
            const content = await file.text();
            App.openBuffer(handle.name, content, handle, 'disk');
        } catch (e) { UI.toast('Open cancelled'); }
    },
    async restoreRoot(handle) {
        this.rootDir = handle;
        if ((await handle.queryPermission({ mode: 'read' })) === 'granted') {
            // Try to navigate into filesys/ subdirectory
            await this.navigateToFilesysFolder(handle);
        } else {
            document.getElementById('file-tree').innerHTML = `<div class="reconnect-btn" onclick="FileSys.reconnectRoot()">Reconnect to /${handle.name}</div>`;
        }
    },
    async navigateToFilesysFolder(workspaceHandle) {
        try {
            // Try to get the filesys/ subdirectory
            const filesysHandle = await workspaceHandle.getDirectoryHandle('filesys', { create: false });
            this.rootDir = filesysHandle;
            this.originalRootDir = workspaceHandle; // Store original for reference
            await this.renderWorkspace(filesysHandle);
        } catch (e) {
            // filesys/ doesn't exist, silently render workspace root instead
            this.renderWorkspace(workspaceHandle);
        }
    },
    async reconnectRoot() {
        if (this.rootDir && (await this.rootDir.requestPermission({ mode: 'read' })) === 'granted') {
            // If this is the original workspace root, navigate to filesys/
            const workspaceHandle = this.originalRootDir || this.rootDir;
            await this.navigateToFilesysFolder(workspaceHandle);
        }
    },
    async renderWorkspace(dirHandle, parentEl = document.getElementById('file-tree'), level = 0, parentPath = '') {
        if (level === 0) parentEl.innerHTML = '';
        for await (const [name, handle] of dirHandle.entries()) {
            const currentPath = parentPath ? `${parentPath}/${name}` : name;
            const el = document.createElement('div');
            el.className = 'tree-item';
            el.setAttribute('data-tree-name', name);
            el.setAttribute('data-tree-path', currentPath);
            el.setAttribute('data-tree-level', level);
            el.style.paddingLeft = `${(level * 10) + 12}px`;
            
            if (handle.kind === 'directory') {
                el.classList.add('is-directory');
                el.setAttribute('data-tree-type', 'directory');
                
                // Add toggle for directory
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
            } else {
                el.classList.add('is-file');
                el.setAttribute('data-tree-type', 'file');
            }
            
            const content = document.createElement('span');
            content.className = 'tree-item-content';
            const icon = document.createElement('span');
            icon.innerHTML = handle.kind === 'directory' ? Icons.folder : Icons.file;
            icon.style.display = 'inline-flex';
            const text = document.createElement('span');
            text.textContent = name;
            content.appendChild(icon);
            content.appendChild(text);
            el.appendChild(content);
            
            // Add action buttons
            const actions = document.createElement('div');
            actions.className = 'tree-actions';
            const delBtn = document.createElement('span');
            delBtn.className = 'action-btn action-delete';
            delBtn.title = 'Delete';
            delBtn.innerHTML = Icons.trash;
            
            if (handle.kind === 'file') {
                content.onclick = async (e) => {
                    e.stopPropagation();
                    App.openBuffer(name, await (await handle.getFile()).text(), handle, 'disk');
                };
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteWorkspaceFile(currentPath); };
            } else if (handle.kind === 'directory') {
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteWorkspaceDir(currentPath); };
            }
            
            actions.appendChild(delBtn);
            el.appendChild(actions);
            
            parentEl.appendChild(el);
            if (handle.kind === 'directory') await this.renderWorkspace(handle, parentEl, level + 1, currentPath);
        }
    }
};
