/**
 * Script Module
 * Global scripting API for user scripts and OPFS file management
 */

const Script = {
    // Global scripting API exposed to user scripts
    context: {
        // File/Buffer operations
        openFile: (name, content) => {
            const handle = undefined;
            const kind = 'memory';
            const existing = Store.state.buffers.find(b => b.name === name);
            if (existing) return Store.setActive(existing.id);
            Store.addBuffer({ id: 'b' + Date.now(), name, content, handle, kind, dirty: false });
            return { name, id: Store.state.buffers[Store.state.buffers.length - 1].id };
        },
        newFile: (name = 'untitled.js', content = '') => Script.context.openFile(name, content),
        getBuffer: (id) => {
            if (!id && !Store.activeBuffer) return null;
            return id ? Store.state.buffers.find(b => b.id === id) : Store.activeBuffer;
        },
        closeBuffer: (id) => Store.closeBuffer(id || Store.state.activeId),
        setActiveBuffer: (id) => Store.setActive(id),
        getActiveBuffer: () => Store.activeBuffer,
        getAllBuffers: () => [...Store.state.buffers],
        
        // Editor operations
        getEditorContent: () => Editor.instance ? Editor.instance.getValue() : '',
        setEditorContent: (content) => { if (Editor.instance) Editor.instance.setValue(content, -1); },
        getEditorLanguage: () => {
            const buf = Store.activeBuffer;
            return buf ? buf.name.split('.').pop().toLowerCase() : 'text';
        },
        getCursorPosition: () => Editor.instance ? Editor.instance.getCursorPosition() : { row: 0, column: 0 },
        setCursorPosition: (row, column) => {
            if (Editor.instance) Editor.instance.getSession().setScrollTop(0);
            if (Editor.instance) Editor.instance.moveCursorToPosition({ row, column });
        },
        getSelectedText: () => Editor.instance ? Editor.instance.getSelectedText() : '',
        insertText: (text) => { if (Editor.instance) Editor.instance.insert(text); },
        
        // Configuration
        getConfig: () => ({ ...Config.state }),
        setConfig: (key, value) => {
            if (key && value !== undefined) {
                Config.state[key] = value;
                Config.save();
                return true;
            }
            return false;
        },
        updateTheme: (name) => Config.setTheme(name),
        updateZoom: (delta) => Config.zoom(delta),
        
        // UI operations
        toast: (msg, duration = 2000) => UI.toast(msg),
        log: (msg) => console.log(msg),
        warn: (msg) => console.warn(msg),
        error: (msg) => console.error(msg),
        
        // OPFS operations
        saveOPFSFile: async (filename, content) => {
            try {
                if (!Store.state.opfsRoot) throw new Error('OPFS not available');
                const handle = await Store.state.opfsRoot.getFileHandle(filename, { create: true });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                Script.context.toast(`Saved: ${filename}`);
                return true;
            } catch (e) {
                Script.context.error(`OPFS save failed: ${e.message}`);
                return false;
            }
        },
        readOPFSFile: async (filename) => {
            try {
                if (!Store.state.opfsRoot) throw new Error('OPFS not available');
                const handle = await Store.state.opfsRoot.getFileHandle(filename);
                const file = await handle.getFile();
                return await file.text();
            } catch (e) {
                Script.context.error(`OPFS read failed: ${e.message}`);
                return null;
            }
        },
        listOPFSFiles: async () => {
            try {
                if (!Store.state.opfsRoot) return [];
                const files = [];
                for await (const [name, handle] of Store.state.opfsRoot.entries()) {
                    if (handle.kind === 'file') files.push(name);
                }
                return files;
            } catch (e) { return []; }
        },
        deleteOPFSFile: async (filename) => {
            try {
                if (!Store.state.opfsRoot) throw new Error('OPFS not available');
                await Store.state.opfsRoot.removeEntry(filename);
                Script.context.toast(`Deleted: ${filename}`);
                return true;
            } catch (e) {
                Script.context.error(`OPFS delete failed: ${e.message}`);
                return false;
            }
        },
        
        // Project operations
        getProject: () => Project.current ? {
            name: Project.current.name,
            root: Project.current.root,
            files: Project.current.files,
            config: Project.current.config
        } : null,
        getProjectConfig: () => Project.getConfig(),
        updateProjectConfig: async (updates) => Project.updateConfig(updates),
        runProjectScript: async (scriptName) => Project.runScript(scriptName)
    },
    
    async loadScript(filename) {
        try {
            if (!Store.state.opfsRoot) return false;
            const handle = await Store.state.opfsRoot.getFileHandle(filename).catch(() => null);
            if (!handle) return false;
            const file = await handle.getFile();
            const code = await file.text();
            return { code, handle };
        } catch (e) { return false; }
    },
    
    async executeScript(code, context = this.context) {
        try {
            // Use AsyncFunction constructor - true async function with top-level await
            const AsyncFunc = (async function(){}).constructor;
            const fn = new AsyncFunc('Aether', code);
            // Execute with context as both 'this' and as Aether parameter
            await fn.apply(context, [context]);
            return true;
        } catch (e) {
            console.error('Script full error:', e);
            const msg = (e && e.message) ? String(e.message).slice(0, 200) : String(e).slice(0, 200);
            try { 
                UI.toast(`Script error: ${msg}`); 
            } catch (err) { 
                console.error('Toast error:', err);
            }
            return false;
        }
    },
    
    async runInitScript() {
        // Try to load and execute .aether.js from OPFS if available
        try {
            const script = await this.loadScript('.aether.js');
            if (script && script.code) {
                await this.executeScript(script.code);
                UI.toast('Init script executed');
            }
        } catch (e) { /* silently ignore if no init script */ }
    }
};
