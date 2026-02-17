/**
 * File System Module
 * Handles workspace and OPFS file operations
 */

const FileSys = {
    rootDir: null,
    async initOPFS() {
        try {
            if (!navigator.storage?.getDirectory) throw 1;
            Store.state.opfsRoot = await navigator.storage.getDirectory();
            this.renderOPFS();
        } catch (e) { document.getElementById('opfs-header').innerText = "LocalStorage Only"; }
    },
    async renderOPFS(dirHandle = null, parentEl = null, level = 0) {
        if (!Store.state.opfsRoot) return;
        if (level === 0) {
            parentEl = document.getElementById('opfs-tree');
            parentEl.innerHTML = '';
            dirHandle = Store.state.opfsRoot;
        }
        
        for await (const [name, handle] of dirHandle.entries()) {
            const el = document.createElement('div');
            el.className = 'tree-item';
            el.setAttribute('data-tree-name', name);
            el.setAttribute('data-tree-level', level);
            el.style.paddingLeft = `${(level * 10) + 12}px`;
            
            if (handle.kind === 'directory') {
                // Directory
                el.classList.add('is-directory');
                el.setAttribute('data-tree-type', 'directory');
                
                // Add toggle
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
                
                // Delete button for directory
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                const delBtn = document.createElement('span');
                delBtn.className = 'action-btn action-delete';
                delBtn.title = 'Delete';
                delBtn.innerHTML = Icons.trash;
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteOPFSDir(name); };
                actions.appendChild(delBtn);
                el.appendChild(actions);
                
                parentEl.appendChild(el);
                await this.renderOPFS(handle, parentEl, level + 1);
            } else if (handle.kind === 'file') {
                // File
                el.classList.add('is-file');
                el.setAttribute('data-tree-type', 'file');
                
                const content = document.createElement('span');
                content.className = 'tree-item-content';
                const icon = document.createElement('span');
                icon.innerHTML = Icons.file;
                icon.style.display = 'inline-flex';
                const fileText = document.createElement('span');
                fileText.textContent = name;
                content.appendChild(icon);
                content.appendChild(fileText);
                content.onclick = async () => App.openBuffer(name, await (await handle.getFile()).text(), handle, 'opfs');
                
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                
                const renBtn = document.createElement('span');
                renBtn.className = 'action-btn'; renBtn.title = "Rename";
                renBtn.innerHTML = Icons.edit;
                renBtn.onclick = (e) => { e.stopPropagation(); this.renameOPFSFile(name, handle); };
                
                const delBtn = document.createElement('span');
                delBtn.className = 'action-btn action-delete'; delBtn.title = "Delete";
                delBtn.innerHTML = Icons.trash;
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteOPFSFile(name); };
                
                actions.append(renBtn, delBtn);
                el.append(content, actions);
                parentEl.appendChild(el);
            }
        }
    },
    async createOPFSFile() {
        Prompt.open("New Local File:", "script.js", async (name) => {
            if (!name) return;
            try {
                const handle = await Store.state.opfsRoot.getFileHandle(name, { create: true });
                App.openBuffer(name, "", handle, 'opfs');
                this.renderOPFS();
            } catch (e) { UI.toast('Error creating file'); }
        });
    },
    async createOPFSDir() {
        if (!Store.state.opfsRoot) {
            UI.toast('Local Storage not available.');
            return;
        }
        Prompt.open("New Directory Name:", "new-folder", async (name) => {
            if (!name || name.trim() === '') return;
            try {
                await Store.state.opfsRoot.getDirectoryHandle(name.trim(), { create: true });
                this.renderOPFS();
                UI.toast(`Directory created: ${name}`);
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
    async renameOPFSFile(oldName, handle) {
        Prompt.open(`Rename "${oldName}" to:`, oldName, async (newName) => {
            if (!newName || newName === oldName) return;
            try {
                const file = await handle.getFile();
                const content = await file.text();
                const newHandle = await Store.state.opfsRoot.getFileHandle(newName, { create: true });
                const writable = await newHandle.createWritable();
                await writable.write(content);
                await writable.close();
                await Store.state.opfsRoot.removeEntry(oldName);

                const buf = Store.state.buffers.find(b => b.name === oldName && b.kind === 'opfs');
                if (buf) { buf.name = newName; buf.handle = newHandle; UI.renderTabs(); document.getElementById('bc-filename').innerText = newName; }

                this.renderOPFS(); UI.toast('Renamed');
            } catch (e) { UI.toast('Rename Failed'); }
        });
    },
    async deleteOPFSFile(name) {
        Confirm.open("Delete File", `Permanently delete "${name}"?`, async () => {
            try {
                await Store.state.opfsRoot.removeEntry(name);
                const buf = Store.state.buffers.find(b => b.name === name && b.kind === 'opfs');
                if (buf) App.closeBuffer(buf.id);
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
    async deleteOPFSDir(name) {
        Confirm.open("Delete Folder", `Permanently delete "${name}" and all contents?`, async () => {
            try {
                await Store.state.opfsRoot.removeEntry(name, { recursive: true });
                this.renderOPFS();
                UI.toast('Folder deleted');
            } catch (e) { 
                console.error('Delete failed:', e);
                UI.toast('Delete failed: ' + e.message); 
            }
        });
    },
    async saveBuffer(buf) {
        if (buf.name === 'config.json' && buf.kind === 'config') { Config.state = JSON.parse(buf.content); Config.save(); Store.markSaved(buf.id); return; }
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
            this.rootDir = handle;
            await DB.set('handles', 'rootDir', handle);
            this.renderWorkspace(handle);
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
            this.renderWorkspace(handle);
        } else {
            document.getElementById('file-tree').innerHTML = `<div class="reconnect-btn" onclick="FileSys.reconnectRoot()">Reconnect to /${handle.name}</div>`;
        }
    },
    async reconnectRoot() {
        if (this.rootDir && (await this.rootDir.requestPermission({ mode: 'read' })) === 'granted') {
            this.renderWorkspace(this.rootDir);
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
            
            if (handle.kind === 'file') {
                el.onclick = async () => App.openBuffer(name, await (await handle.getFile()).text(), handle, 'disk');
            } else if (handle.kind === 'directory') {
                // Add delete button for directories
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                const delBtn = document.createElement('span');
                delBtn.className = 'action-btn action-delete';
                delBtn.title = 'Delete';
                delBtn.innerHTML = Icons.trash;
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteWorkspaceDir(currentPath); };
                actions.appendChild(delBtn);
                el.appendChild(actions);
            }
            
            parentEl.appendChild(el);
            if (handle.kind === 'directory') await this.renderWorkspace(handle, parentEl, level + 1, currentPath);
        }
    }
};
