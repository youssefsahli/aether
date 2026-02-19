/**
 * Application Module
 * Main app initialization, preview rendering, and session management
 */

const App = {
    async loadWelcome() {
        // Always fetch latest version from workspace first
        const workspaceWelcome = await this.getDefaultWelcome();
        if (workspaceWelcome) {
            // Update OPFS with the latest version
            try {
                if (Store.state.opfsRoot) {
                    const handle = await Store.state.opfsRoot.getFileHandle('welcome.md', { create: true });
                    const writable = await handle.createWritable();
                    await writable.write(workspaceWelcome);
                    await writable.close();
                }
            } catch (e) {
                console.warn('Could not update welcome.md in OPFS:', e);
            }
            return workspaceWelcome;
        }
        
        // Fallback: load from OPFS if workspace unavailable
        try {
            if (!Store.state.opfsRoot) return null;
            const handle = await Store.state.opfsRoot.getFileHandle('welcome.md', { create: false });
            const file = await handle.getFile();
            return await file.text();
        } catch (e) {
            console.warn('Failed to load welcome from OPFS:', e);
            return "# Welcome to Aether\n\nA powerful, minimal code editor for the web.";
        }
    },
    async getDefaultWelcome() {
        // Fetch welcome.md from workspace with cache-busting
        try {
            const response = await fetch('welcome.md?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.ok) return await response.text();
        } catch (e) {
            console.warn('Could not fetch welcome.md:', e);
        }
        // Fallback content if file can't be fetched
        return "# Welcome to Aether\n\nA powerful, minimal code editor for the web.\n\nOpen welcome.md to see documentation and examples.";
    },
    async init() {
        await DB.init();
        Editor.init();
        await Config.init();
        await FileSys.initOPFS();
        Resizer.init();
        Dragger.init();
        MarkedConfig.init();
        UI.initIconButtons();
        this.initSidebarSections();
        await SystemFS.init();

        const rootHandle = await DB.get('handles', 'rootDir');
        if (rootHandle) FileSys.restoreRoot(rootHandle);

        const tabScroll = document.getElementById('tabs-scroll');
        tabScroll.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabScroll.scrollLeft += e.deltaY;
            }
        }, { passive: false });
        
        // Run initialization script from OPFS if available
        try { await Script.runInitScript(); } catch (e) { /* ignore */ }

        const savedEntries = await DB.getAll('session');
        const meta = (savedEntries || []).find(e => e && e.id === 'meta');
        const savedBuffers = (savedEntries || []).filter(e => e && e.id && e.id !== 'meta');

        if (typeof meta !== 'undefined' && meta) {
            if (typeof meta.consoleCollapsed !== 'undefined') Store.state.consoleCollapsed = !!meta.consoleCollapsed;
            if (typeof meta.outlineCollapsed !== 'undefined') Store.state.outlineCollapsed = meta.outlineCollapsed || {};
            if (meta.currentProject) {
                Project.current = meta.currentProject;
                Project._updateUI();
                FileSys.renderOPFS();
            }
        }

        if (savedBuffers.length) {
            savedBuffers.forEach(b => Store.addBuffer(b));
            const active = savedBuffers.find(b => b.active);
            if (active) Store.setActive(active.id); else Store.setActive(savedBuffers[0].id);
        } else {
            // Load welcome.md from OPFS or use default
            const welcomeText = await this.loadWelcome();
            this.openBuffer('welcome.md', welcomeText, null, 'memory');
            Store.state.buffers[0].dirty = false;
            UI.renderTabs();
        }

        document.body.addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag-over'); });
        document.body.addEventListener('dragleave', e => { if (e.relatedTarget === null) document.body.classList.remove('drag-over'); });
        document.body.addEventListener('drop', async e => {
            e.preventDefault(); document.body.classList.remove('drag-over');
            for (const item of e.dataTransfer.items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    this.openBuffer(file.name, await file.text(), null, 'memory');
                }
            }
        });

        // Global shortcuts - use single listener with explicit keyboard handling
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                Commands.trigger('openFile');
            }
            // Alt+Left for back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                App.goBack();
            }
            // Alt+Right for forward
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                App.goForward();
            }
        });

        new ResizeObserver(() => Editor.instance.resize()).observe(document.querySelector('main'));

        // Outline filter input debounce
        try {
            const of = document.getElementById('outline-filter');
            if (of) {
                let ot = null;
                of.addEventListener('input', (e) => { 
                    clearTimeout(ot); 
                    ot = setTimeout(() => Symbols.parse(), 220); 
                });
                of.addEventListener('keydown', (e) => { 
                    if (e.key === 'Escape') { 
                        of.value = ''; 
                        Symbols.parse(); 
                    } 
                });
            }
        } catch (e) {}

        // Restore console collapsed state if present
        try {
            const pane = document.getElementById('console-pane');
            const btn = document.getElementById('console-toggle-btn');
            if (pane && Store.state.consoleCollapsed) pane.classList.add('collapsed');
            if (btn) {
                const collapsed = pane && pane.classList.contains('collapsed');
                btn.innerHTML = collapsed ? Icons.chevronDown : Icons.chevronRight;
            }
        } catch (e) {}
    },
    openBuffer(name, content, handle, kind, path = '') {
        const existing = Store.state.buffers.find(b => b.name === name && (b.path || '') === path);
        if (existing) return Store.setActive(existing.id);
        Store.addBuffer({ id: 'b' + Date.now(), name, content, handle, kind, path, dirty: false });
    },
    updateStats() {
        if (!Editor.instance) return;
        const pos = Editor.instance.getCursorPosition();
        document.getElementById('stat-pos').innerText = `${pos.row + 1}:${pos.column + 1}`;
        const buf = Store.activeBuffer;
        if (buf) {
            document.getElementById('stat-file').innerText = buf.name;
            document.getElementById('stat-lang').innerText = buf.name.split('.').pop().toUpperCase();
        }
    },
    goBack() {
        if (Store.state.navIndex > 0) {
            Store.state.navIndex--;
            const targetId = Store.state.navHistory[Store.state.navIndex];
            if (targetId) {
                Store.state.activeId = targetId;
                UI.renderTabs();
                const buf = Store.activeBuffer;
                if (buf) {
                    Editor.load(buf.content, buf.name);
                    document.getElementById('bc-filename').innerText = buf.name;
                }
                this.updateNavButtons();
                this.debouncePreview(true);
            }
        }
    },
    goForward() {
        if (Store.state.navIndex < Store.state.navHistory.length - 1) {
            Store.state.navIndex++;
            const targetId = Store.state.navHistory[Store.state.navIndex];
            if (targetId) {
                Store.state.activeId = targetId;
                UI.renderTabs();
                const buf = Store.activeBuffer;
                if (buf) {
                    Editor.load(buf.content, buf.name);
                    document.getElementById('bc-filename').innerText = buf.name;
                }
                this.updateNavButtons();
                this.debouncePreview(true);
            }
        }
    },
    updateNavButtons() {
        const backBtn = document.getElementById('nav-back-btn');
        const forwardBtn = document.getElementById('nav-forward-btn');
        if (backBtn) backBtn.disabled = Store.state.navIndex <= 0;
        if (forwardBtn) forwardBtn.disabled = Store.state.navIndex >= Store.state.navHistory.length - 1;
    },
    debouncePreview(immediate) {
        if (!Store.state.previewMode) return;
        clearTimeout(this.pvTimer);
        const run = async () => {
            let buf = Store.activeBuffer; if (!buf) return;
            const f = document.getElementById('preview-frame');
            const styles = getComputedStyle(document.body);
            const baseCss = `body{background:${styles.getPropertyValue('--bg')};color:${styles.getPropertyValue('--text')};font-family:'Segoe UI',sans-serif;padding:24px;line-height:1.7;font-size:14px;}h1{font-size:2em;margin:1.2em 0 0.5em;font-weight:600;border-bottom:2px solid ${styles.getPropertyValue('--accent')};padding-bottom:0.3em;}h2{font-size:1.6em;margin:1.1em 0 0.4em;font-weight:600;color:${styles.getPropertyValue('--accent')}}h3{font-size:1.3em;margin:0.9em 0 0.3em;font-weight:600;}h4,h5,h6{font-size:1.1em;margin:0.8em 0 0.2em;font-weight:600;}p{margin:0.8em 0;}a{color:${styles.getPropertyValue('--accent')};text-decoration:none;}a:hover{text-decoration:underline;}pre{background:rgba(0,0,0,0.2);padding:12px;border-radius:4px;overflow:auto;font-size:12px;}code{font-family:'JetBrains Mono',monospace;font-size:0.9em;background:rgba(0,0,0,0.1);padding:2px 4px;border-radius:3px;}pre code{background:none;padding:0;}blockquote{border-left:4px solid ${styles.getPropertyValue('--accent')};padding-left:1em;margin:1em 0;color:${styles.getPropertyValue('--text-dim')};font-style:italic;}li{margin:0.3em 0;}ul,ol{margin:0.8em 0;padding-left:2em;}table{border-collapse:collapse;margin:1em 0;width:100%;}th,td{border:1px solid ${styles.getPropertyValue('--border')};padding:8px 12px;text-align:left;}th{background:rgba(0,0,0,0.1);font-weight:600;}strong{font-weight:600;}`;
            
            // Check if project has a main file set - always preview that instead
            let useMainFile = false;
            if (buf.kind === 'opfs' && Project.current?.config?.mainFile) {
                const mainFile = Project.current.config.mainFile;
                const mainHandle = FileSys._opfsHandles[mainFile];
                if (mainHandle) {
                    try {
                        const file = await mainHandle.getFile();
                        const mainContent = await file.text();
                        buf = { 
                            name: mainFile, 
                            content: mainContent, 
                            kind: 'opfs',
                            handle: mainHandle
                        };
                        useMainFile = true;
                    } catch (e) {
                        console.warn('Could not load main file:', mainFile, e);
                    }
                }
            }
            
            const ext = buf.name.split('.').pop().toLowerCase();
            let content = buf.content;
            
            // For HTML files from OPFS, inline local script and CSS references
            if (ext === 'html' && buf.kind === 'opfs') {
                content = await this._inlineOPFSResources(content);
            }
            
            let html = "";
            if (ext === 'md') {
                html = `<style>${baseCss}</style>` + marked.parse(content);
            } else if (ext === 'html') {
                html = content;
            } else if ((ext === 'js' || ext === 'css') && buf.kind === 'opfs' && Project.current) {
                // For JS/CSS in OPFS projects with an active preview, don't disrupt it
                // User should click Refresh to see changes
                if (f.dataset.shellReady) return;
                // No preview running yet, show the code
                html = `<style>${baseCss}</style><pre>${content.replace(/</g, '&lt;')}</pre>`;
            } else {
                html = `<style>${baseCss}</style><pre>${content.replace(/</g, '&lt;')}</pre>`;
            }

                // Use a persistent preview shell and postMessage updates to avoid flashing
                const shell = `<!doctype html><html><head><meta charset="utf-8"></head><body></body><script>(function(){const _log=console.log,_err=console.error,_warn=console.warn,_info=console.info;console.log=(...args)=>{try{parent.postMessage({type:'console',method:'log',args},'*')}catch(e){};_log.apply(console,args)};console.error=(...args)=>{try{parent.postMessage({type:'console',method:'error',args},'*')}catch(e){};_err.apply(console,args)};console.warn=(...args)=>{try{parent.postMessage({type:'console',method:'warn',args},'*')}catch(e){};_warn.apply(console,args)};console.info=(...args)=>{try{parent.postMessage({type:'console',method:'info',args},'*')}catch(e){};_info.apply(console,args)};window.addEventListener('error',function(ev){try{parent.postMessage({type:'console',method:'error',args:['Uncaught Error: '+(ev.message||ev.error||ev.filename||ev.lineno)]},'*')}catch(e){}});function attachLinkHandlers(){const links=document.querySelectorAll('a[data-aether-file]');links.forEach(link=>{link.addEventListener('click',function(e){e.preventDefault();const filename=this.href.split('/').pop()||this.href;parent.postMessage({type:'aether-open-file',filename},'*');});});}window.addEventListener('message',function(e){if(!e.data) return; if(e.data.type==='update'){ document.body.innerHTML = e.data.html || ''; const scripts = Array.from(document.body.querySelectorAll('script')); scripts.forEach(s=>{ const ns = document.createElement('script'); if(s.src) ns.src = s.src; else ns.textContent = s.textContent; if(s.type) ns.type = s.type; document.head.appendChild(ns); s.parentNode.removeChild(s); }); attachLinkHandlers(); } if(e.data.type==='scroll-to'){const id=e.data.id;const elem=document.getElementById(id);if(elem){elem.scrollIntoView({behavior:'smooth'});}} });setTimeout(attachLinkHandlers,100);})();<\/script></html>`;

                // If the shell isn't loaded yet, set it and post the content after load
                if (!f.dataset.shellReady) {
                    f.onload = () => {
                        try { f.contentWindow.postMessage({ type: 'update', html }, '*'); } catch (e) {}
                        f.dataset.shellReady = '1';
                        f.onload = null;
                    };
                    f.srcdoc = shell;
                } else {
                    try { f.contentWindow.postMessage({ type: 'update', html }, '*'); } catch (e) {}
                }
        };
        if (immediate) run(); else this.pvTimer = setTimeout(run, 500);
    },
    
    /**
     * Hard refresh the preview - resets iframe and reloads content
     */
    refreshPreview() {
        const f = document.getElementById('preview-frame');
        if (f) {
            delete f.dataset.shellReady;
            f.srcdoc = '';
        }
        this.debouncePreview(true);
    },
    
    /**
     * Inline local OPFS file references in HTML for preview
     * Converts <script src="./file.js"> to inline scripts
     * Converts <link href="./file.css"> to inline styles
     * Recursively processes ES module imports
     */
    async _inlineOPFSResources(html) {
        if (!Store.state.opfsRoot || !Project.current) return html;
        
        const projectRoot = Project.current.root 
            ? await FileSys._getProjectDir(Project.current.root)
            : Store.state.opfsRoot;
        
        if (!projectRoot) return html;
        
        // Cache for loaded files to avoid re-reading
        const fileCache = new Map();
        
        // Helper to read file from OPFS with caching
        const readFile = async (path, basePath = '') => {
            // Resolve relative path from basePath
            const resolvedPath = this._resolveModulePath(path, basePath);
            
            if (fileCache.has(resolvedPath)) return fileCache.get(resolvedPath);
            
            try {
                const parts = resolvedPath.split('/').filter(p => p);
                const filename = parts.pop();
                let dir = projectRoot;
                for (const part of parts) {
                    dir = await dir.getDirectoryHandle(part, { create: false });
                }
                const handle = await dir.getFileHandle(filename, { create: false });
                const file = await handle.getFile();
                const content = await file.text();
                fileCache.set(resolvedPath, content);
                return content;
            } catch (e) {
                console.warn(`Could not load OPFS file: ${resolvedPath}`, e);
                fileCache.set(resolvedPath, null);
                return null;
            }
        };
        
        // Bundle a module and its dependencies
        const bundledModules = new Map(); // path -> bundled code
        const moduleOrder = []; // topological order
        
        const bundleModule = async (path, basePath = '') => {
            const resolvedPath = this._resolveModulePath(path, basePath);
            if (bundledModules.has(resolvedPath)) return;
            
            const content = await readFile(path, basePath);
            if (content === null) {
                bundledModules.set(resolvedPath, null);
                return;
            }
            
            // Mark as processing to detect circular deps
            bundledModules.set(resolvedPath, '');
            
            // Find all imports in this module
            const imports = this._parseModuleImports(content);
            
            // Recursively bundle dependencies first
            for (const imp of imports) {
                if (!imp.path.match(/^(https?:|data:|\/\/)/)) {
                    await bundleModule(imp.path, resolvedPath);
                }
            }
            
            // Transform the module code
            const transformed = this._transformModule(content, resolvedPath, imports);
            bundledModules.set(resolvedPath, transformed);
            moduleOrder.push(resolvedPath);
        };
        
        // Parse HTML and find local script/link references
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Process scripts
        const scripts = doc.querySelectorAll('script[src]');
        for (const script of scripts) {
            const src = script.getAttribute('src');
            if (src && !src.match(/^(https?:|data:|\/\/)/)) {
                const cleanPath = src.replace(/^\.\//, '');
                const isModule = script.type === 'module';
                
                if (isModule) {
                    // Bundle the module and all its dependencies
                    await bundleModule(cleanPath);
                    
                    // Create bundled script
                    const inline = doc.createElement('script');
                    
                    // Build the bundle: create module registry and execute in order
                    let bundle = '(function(){\n';
                    bundle += 'const __modules__ = {};\n';
                    bundle += 'const __exports__ = {};\n\n';
                    
                    // Add each module as a function
                    for (const modPath of moduleOrder) {
                        const code = bundledModules.get(modPath);
                        if (code) {
                            const safeName = this._modulePathToId(modPath);
                            bundle += `// Module: ${modPath}\n`;
                            bundle += `__modules__["${modPath}"] = function(__exports) {\n${code}\nreturn __exports;\n};\n`;
                            bundle += `__exports__["${modPath}"] = __modules__["${modPath}"]({});\n\n`;
                        }
                    }
                    
                    bundle += '})();';
                    inline.textContent = bundle;
                    script.parentNode.replaceChild(inline, script);
                } else {
                    // Regular script - just inline
                    const content = await readFile(cleanPath);
                    if (content !== null) {
                        const inline = doc.createElement('script');
                        inline.textContent = content;
                        script.parentNode.replaceChild(inline, script);
                    }
                }
            }
        }
        
        // Process inline module scripts too
        const inlineModules = doc.querySelectorAll('script[type="module"]:not([src])');
        for (const script of inlineModules) {
            const content = script.textContent;
            const imports = this._parseModuleImports(content);
            
            // Bundle any local dependencies
            for (const imp of imports) {
                if (!imp.path.match(/^(https?:|data:|\/\/)/)) {
                    await bundleModule(imp.path);
                }
            }
            
            if (moduleOrder.length > 0) {
                // Transform the inline module and prepend dependencies
                const transformed = this._transformModule(content, '__main__', imports);
                
                let bundle = '(function(){\n';
                bundle += 'const __modules__ = {};\n';
                bundle += 'const __exports__ = {};\n\n';
                
                for (const modPath of moduleOrder) {
                    const code = bundledModules.get(modPath);
                    if (code) {
                        bundle += `// Module: ${modPath}\n`;
                        bundle += `__modules__["${modPath}"] = function(__exports) {\n${code}\nreturn __exports;\n};\n`;
                        bundle += `__exports__["${modPath}"] = __modules__["${modPath}"]({});\n\n`;
                    }
                }
                
                bundle += `// Main module\n${transformed}\n`;
                bundle += '})();';
                
                const newScript = doc.createElement('script');
                newScript.textContent = bundle;
                script.parentNode.replaceChild(newScript, script);
            }
        }
        
        // Process stylesheets
        const links = doc.querySelectorAll('link[rel="stylesheet"][href]');
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href && !href.match(/^(https?:|data:|\/\/)/)) {
                const cleanPath = href.replace(/^\.\//, '');
                const content = await readFile(cleanPath);
                if (content !== null) {
                    const style = doc.createElement('style');
                    style.textContent = content;
                    link.parentNode.replaceChild(style, link);
                }
            }
        }
        
        // Return the modified HTML
        return doc.documentElement.outerHTML;
    },
    
    /**
     * Resolve a module path relative to a base path
     */
    _resolveModulePath(path, basePath) {
        const cleanPath = path.replace(/^\.\//, '');
        if (!basePath || basePath === '__main__') return cleanPath;
        
        // Get directory of base path
        const baseParts = basePath.split('/');
        baseParts.pop(); // Remove filename
        
        const pathParts = cleanPath.split('/');
        const result = [...baseParts];
        
        for (const part of pathParts) {
            if (part === '..') {
                result.pop();
            } else if (part !== '.') {
                result.push(part);
            }
        }
        
        return result.join('/') || cleanPath;
    },
    
    /**
     * Parse ES module imports from source code
     */
    _parseModuleImports(code) {
        const imports = [];
        
        // Match: import X from 'path'
        // Match: import { a, b } from 'path'
        // Match: import * as X from 'path'
        // Match: import 'path'
        const importRegex = /import\s+(?:(\*\s+as\s+\w+|\{[^}]*\}|\w+)(?:\s*,\s*(\{[^}]*\}))?\s+from\s+)?['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            const fullMatch = match[0];
            const imports1 = match[1] || ''; // default or namespace or named
            const imports2 = match[2] || ''; // additional named imports
            const path = match[3];
            
            imports.push({
                fullMatch,
                imports: (imports1 + ' ' + imports2).trim(),
                path,
                isNamespace: imports1.includes('* as'),
                isDefault: imports1 && !imports1.startsWith('{') && !imports1.includes('* as'),
                namedImports: this._parseNamedImports(imports1, imports2)
            });
        }
        
        return imports;
    },
    
    /**
     * Parse named imports from import statement
     */
    _parseNamedImports(imports1, imports2) {
        const named = [];
        const combined = (imports1 || '') + ' ' + (imports2 || '');
        const namedMatch = combined.match(/\{([^}]+)\}/g);
        
        if (namedMatch) {
            for (const m of namedMatch) {
                const inner = m.slice(1, -1);
                const items = inner.split(',').map(s => s.trim()).filter(s => s);
                for (const item of items) {
                    const [name, alias] = item.split(/\s+as\s+/).map(s => s.trim());
                    named.push({ name, alias: alias || name });
                }
            }
        }
        
        return named;
    },
    
    /**
     * Transform module code: convert imports to registry lookups, exports to assignments
     */
    _transformModule(code, modulePath, imports) {
        let transformed = code;
        
        // Replace imports with variable declarations from __exports__
        for (const imp of imports) {
            if (imp.path.match(/^(https?:|data:|\/\/)/)) continue;
            
            const resolvedPath = this._resolveModulePath(imp.path, modulePath);
            let replacement = '';
            
            if (imp.isNamespace) {
                // import * as X from 'path' -> const X = __exports__["path"]
                const alias = imp.imports.match(/\*\s+as\s+(\w+)/)[1];
                replacement = `const ${alias} = __exports__["${resolvedPath}"]`;
            } else if (imp.isDefault && imp.namedImports.length === 0) {
                // import X from 'path' -> const X = __exports__["path"].default
                const name = imp.imports.trim();
                replacement = `const ${name} = __exports__["${resolvedPath}"].default`;
            } else if (imp.namedImports.length > 0) {
                // import { a, b as c } from 'path' -> const { a, b: c } = __exports__["path"]
                const destructure = imp.namedImports
                    .map(n => n.name === n.alias ? n.name : `${n.name}: ${n.alias}`)
                    .join(', ');
                
                if (imp.isDefault) {
                    // import X, { a, b } from 'path'
                    const defaultName = imp.imports.split(',')[0].trim().split(/\s/)[0];
                    replacement = `const ${defaultName} = __exports__["${resolvedPath}"].default;\nconst { ${destructure} } = __exports__["${resolvedPath}"]`;
                } else {
                    replacement = `const { ${destructure} } = __exports__["${resolvedPath}"]`;
                }
            } else if (!imp.imports) {
                // import 'path' -> side effect only, already executed
                replacement = `/* import "${imp.path}" - side effect only */`;
            }
            
            transformed = transformed.replace(imp.fullMatch, replacement);
        }
        
        // Transform exports
        // export default X -> __exports.default = X
        transformed = transformed.replace(/export\s+default\s+/g, '__exports.default = ');
        
        // Track exported vars with their mutability
        const exportedVars = [];
        
        // export const/let/var X = ... -> const/let/var X = ...; track if mutable
        transformed = transformed.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, (match, keyword, name) => {
            return `${keyword} ${name} =`;
        });
        const varExportRegex = /export\s+(const|let|var)\s+(\w+)/g;
        let varMatch;
        while ((varMatch = varExportRegex.exec(code)) !== null) {
            exportedVars.push({ name: varMatch[2], mutable: varMatch[1] !== 'const' });
        }
        
        // export function X() {} -> function X() {}; functions are reassignable
        transformed = transformed.replace(/export\s+function\s+(\w+)/g, (match, name) => {
            exportedVars.push({ name, mutable: false });
            return `function ${name}`;
        });
        
        // export class X {} -> class X {}; classes are not reassignable
        transformed = transformed.replace(/export\s+class\s+(\w+)/g, (match, name) => {
            exportedVars.push({ name, mutable: false });
            return `class ${name}`;
        });
        
        // export { a, b, c } - assume mutable since we don't know
        transformed = transformed.replace(/export\s*\{([^}]+)\}/g, (match, inner) => {
            const items = inner.split(',').map(s => s.trim()).filter(s => s);
            for (const item of items) {
                const [name, alias] = item.split(/\s+as\s+/).map(s => s.trim());
                exportedVars.push({ name, alias: alias || name, mutable: true });
            }
            return '';
        });
        
        // Add export accessors with getters and setters for live bindings
        if (exportedVars.length > 0) {
            transformed += '\n';
            for (const v of exportedVars) {
                const name = typeof v === 'string' ? v : v.name;
                const alias = typeof v === 'string' ? v : (v.alias || v.name);
                const mutable = typeof v === 'object' ? v.mutable : true;
                
                if (mutable) {
                    // Use getter AND setter for mutable exports
                    transformed += `Object.defineProperty(__exports, '${alias}', { get: () => ${name}, set: (v) => { ${name} = v; }, enumerable: true, configurable: true });\n`;
                } else {
                    // Use only getter for immutable exports
                    transformed += `Object.defineProperty(__exports, '${alias}', { get: () => ${name}, enumerable: true, configurable: true });\n`;
                }
            }
        }
        
        return transformed;
    },
    
    /**
     * Convert module path to safe identifier
     */
    _modulePathToId(path) {
        return path.replace(/[^a-zA-Z0-9]/g, '_');
    },
    debounceSaveSession() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.saveSession(), 1000);
    },
    toggleSidebar(side) {
        document.getElementById(`sidebar-${side}`).classList.toggle('collapsed');
        setTimeout(() => Editor.instance.resize(), 250);
    },
    toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('collapsed');
        }
    },
    toggleSectionSearch(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const searchContainer = section.querySelector('.tree-search-container');
        const searchInput = section.querySelector('.tree-search');
        if (searchContainer) {
            searchContainer.classList.toggle('collapsed');
            if (!searchContainer.classList.contains('collapsed') && searchInput) {
                searchInput.focus();
            } else if (searchInput) {
                // Clear search when hiding
                searchInput.value = '';
                const treeId = searchInput.id.replace('-search', '');
                TreeSearch.filterTree(treeId, '');
            }
        }
    },
    initSidebarSections() {
        // Initialize section button icons
        document.querySelectorAll('.sidebar-section').forEach(section => {
            const actions = section.querySelector('.section-actions');
            if (!actions) return;
            const buttons = actions.querySelectorAll('.btn');
            buttons.forEach((btn, i) => {
                const title = btn.getAttribute('title') || '';
                if (title.includes('Search')) btn.innerHTML = Icons.search;
                else if (title.includes('Collapse')) btn.innerHTML = Icons.chevronDown;
                else if (title.includes('Directory')) btn.innerHTML = Icons.folder;
                else if (title.includes('Folder')) btn.innerHTML = Icons.menu;
                else if (title.includes('File')) btn.innerHTML = Icons.plus;
            });
        });
    },
    async runActiveJSInConsole() {
        const buf = Store.activeBuffer;
        if (!buf) return UI.toast('No active buffer');
        const ext = buf.name.split('.').pop().toLowerCase();
        if (ext !== 'js') return UI.toast('Run is for .js files only');

        // Get content directly from editor (most current)
        let code = Editor.instance ? Editor.instance.getValue() : buf.content;
        
        if (!code || !code.trim()) {
            return UI.toast('No code to run');
        }

        try {
            Console.displayInput(`// Running: ${buf.name}`);
            
            // Check if code has ES module imports and is from OPFS
            if (buf.kind === 'opfs' && this._hasModuleImports(code)) {
                Console.displayOutput('Bundling modules...', 'log');
                code = await this._bundleModuleCode(code, buf.name);
            }
            
            // Execute code in console context
            const result = await Console.executeInContext(code);
            
            if (result.success) {
                Console.displayOutput(`✓ ${buf.name} executed`, 'log');
            } else {
                Console.displayOutput(result.error || 'Execution failed', 'error');
            }
        } catch (err) {
            Console.displayOutput(err.message || String(err), 'error');
        }
    },
    
    /**
     * Check if code contains ES module import statements
     */
    _hasModuleImports(code) {
        return /\bimport\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+['"][^'"]+['"]/.test(code) ||
               /\bimport\s+['"][^'"]+['"]/.test(code);
    },
    
    /**
     * Bundle module code with all its dependencies for console execution
     */
    async _bundleModuleCode(code, filename) {
        if (!Store.state.opfsRoot || !Project.current) {
            throw new Error('No OPFS project loaded');
        }
        
        const projectRoot = Project.current.root 
            ? await FileSys._getProjectDir(Project.current.root)
            : Store.state.opfsRoot;
        
        if (!projectRoot) {
            throw new Error('Could not access project root');
        }
        
        // Cache for loaded files
        const fileCache = new Map();
        
        // Helper to read file from OPFS with caching
        const readFile = async (path, basePath = '') => {
            const resolvedPath = this._resolveModulePath(path, basePath);
            
            if (fileCache.has(resolvedPath)) return fileCache.get(resolvedPath);
            
            try {
                const parts = resolvedPath.split('/').filter(p => p);
                const fname = parts.pop();
                let dir = projectRoot;
                for (const part of parts) {
                    dir = await dir.getDirectoryHandle(part, { create: false });
                }
                const handle = await dir.getFileHandle(fname, { create: false });
                const file = await handle.getFile();
                const content = await file.text();
                fileCache.set(resolvedPath, content);
                return content;
            } catch (e) {
                console.warn(`Could not load OPFS file: ${resolvedPath}`, e);
                fileCache.set(resolvedPath, null);
                return null;
            }
        };
        
        // Bundle tracking
        const bundledModules = new Map();
        const moduleOrder = [];
        
        const bundleModule = async (path, basePath = '') => {
            const resolvedPath = this._resolveModulePath(path, basePath);
            if (bundledModules.has(resolvedPath)) return;
            
            const content = await readFile(path, basePath);
            if (content === null) {
                bundledModules.set(resolvedPath, null);
                return;
            }
            
            bundledModules.set(resolvedPath, '');
            
            const imports = this._parseModuleImports(content);
            
            for (const imp of imports) {
                if (!imp.path.match(/^(https?:|data:|\/\/)/)) {
                    await bundleModule(imp.path, resolvedPath);
                }
            }
            
            const transformed = this._transformModule(content, resolvedPath, imports);
            bundledModules.set(resolvedPath, transformed);
            moduleOrder.push(resolvedPath);
        };
        
        // Parse imports in main code
        const imports = this._parseModuleImports(code);
        
        // Bundle all dependencies
        for (const imp of imports) {
            if (!imp.path.match(/^(https?:|data:|\/\/)/)) {
                await bundleModule(imp.path, filename);
            }
        }
        
        // Transform main code
        const transformedMain = this._transformModule(code, filename, imports);
        
        // Build the bundle
        let bundle = '(function(){\n';
        bundle += '"use strict";\n';
        bundle += 'const __modules__ = {};\n';
        bundle += 'const __exports__ = {};\n\n';
        
        // Add each dependency module
        for (const modPath of moduleOrder) {
            const modCode = bundledModules.get(modPath);
            if (modCode) {
                bundle += `// Module: ${modPath}\n`;
                bundle += `__modules__["${modPath}"] = function(__exports) {\n${modCode}\nreturn __exports;\n};\n`;
                bundle += `__exports__["${modPath}"] = __modules__["${modPath}"]({});\n\n`;
            }
        }
        
        // Add main module
        bundle += `// Main: ${filename}\n`;
        bundle += transformedMain + '\n';
        bundle += '})();';
        
        return bundle;
    },
    runActiveJS() {
        const buf = Store.activeBuffer;
        if (!buf) return UI.toast('No active buffer');
        const ext = buf.name.split('.').pop().toLowerCase();
        if (ext !== 'js') return UI.toast('Run is for .js files only');

        // Ensure preview visible
        Store.state.previewMode = true;
        document.body.classList.add('preview-active');

        const styles = getComputedStyle(document.body);
        const baseCss = `body{background:${styles.getPropertyValue('--bg')};color:${styles.getPropertyValue('--text')};font-family:sans-serif;padding:20px;line-height:1.6;}a{color:${styles.getPropertyValue('--accent')}}pre{background:rgba(0,0,0,0.2);padding:10px;border-radius:4px;overflow:auto}code{font-family:'JetBrains Mono',monospace;font-size:0.9em}`;

        // Wrap code in async IIFE to support top-level await
        // Also inject Aether API via postMessage bridge
        const wrappedCode = `(async () => {
                        // Bridge to parent's Aether API
                        const Aether = {
                            log: (msg) => parent.postMessage({type:'aether-call',method:'log',msg},'*'),
                            warn: (msg) => parent.postMessage({type:'aether-call',method:'warn',msg},'*'),
                            error: (msg) => parent.postMessage({type:'aether-call',method:'error',msg},'*'),
                            toast: (msg, duration) => parent.postMessage({type:'aether-call',method:'toast',msg,duration},'*'),
                            openFile: (name, content) => parent.postMessage({type:'aether-call',method:'openFile',name,content},'*'),
                            newFile: (name, content) => parent.postMessage({type:'aether-call',method:'newFile',name,content},'*'),
                            getConfig: () => 'Use Script API instead',
                            setConfig: (k,v) => parent.postMessage({type:'aether-call',method:'setConfig',k,v},'*'),
                            updateTheme: (name) => parent.postMessage({type:'aether-call',method:'updateTheme',name},'*'),
                            updateZoom: (delta) => parent.postMessage({type:'aether-call',method:'updateZoom',delta},'*'),
                        };
${buf.content}
                    })();`;

        const safeCode = wrappedCode.replace(/<\/script>/g, '<\\/script>');

        const htmlContent = `<style>${baseCss}</style><script>${safeCode}<\/script>`;
        const f = document.getElementById('preview-frame');

        // Shell with postMessage handler to relay Aether calls
        const shell = `<!doctype html><html><head><meta charset="utf-8"></head><body></body><script>(function(){const _log=console.log,_err=console.error,_warn=console.warn,_info=console.info;console.log=(...args)=>{try{parent.postMessage({type:'console',method:'log',args},'*')}catch(e){};_log.apply(console,args)};console.error=(...args)=>{try{parent.postMessage({type:'console',method:'error',args},'*')}catch(e){};_err.apply(console,args)};console.warn=(...args)=>{try{parent.postMessage({type:'console',method:'warn',args},'*')}catch(e){};_warn.apply(console,args)};console.info=(...args)=>{try{parent.postMessage({type:'console',method:'info',args},'*')}catch(e){};_info.apply(console,args)};window.addEventListener('error',function(ev){try{parent.postMessage({type:'console',method:'error',args:['Uncaught Error: '+(ev.message||ev.error||ev.filename||ev.lineno)]},'*')}catch(e){}});window.addEventListener('message',function(e){if(!e.data) return; if(e.data.type==='update'){ document.body.innerHTML = e.data.html || ''; const scripts = Array.from(document.body.querySelectorAll('script')); scripts.forEach(s=>{ const ns = document.createElement('script'); if(s.src) ns.src = s.src; else ns.textContent = s.textContent; document.head.appendChild(ns); s.parentNode.removeChild(s); }); }});})();<\/script></html>`;

        if (!f.dataset.shellReady) {
            f.onload = () => {
                try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
                f.dataset.shellReady = '1';
                f.onload = null;
            };
            f.srcdoc = shell;
        } else {
            try { f.contentWindow.postMessage({ type: 'update', html: htmlContent }, '*'); } catch (e) {}
        }

        setTimeout(() => Editor.instance.resize(), 200);
    },
    async saveSession() {
        await DB.clear('session');
        for (const b of Store.state.buffers) {
            if (b.kind === 'config') continue;
            await DB.set('session', null, {
                id: b.id, name: b.name, content: b.content,
                handle: b.handle, kind: b.kind, path: b.path || '', dirty: b.dirty,
                active: b.id === Store.state.activeId
            });
        }
        // persist UI meta (console collapsed state, project, etc.)
        try {
            await DB.set('session', null, { 
                id: 'meta', 
                consoleCollapsed: !!Store.state.consoleCollapsed, 
                outlineCollapsed: Store.state.outlineCollapsed || {},
                currentProject: Project.current
            });
        } catch (e) { /* ignore persistence errors */ }
    },
    async saveBuffer(b) {
        if (!b || b.kind === 'config') return;

        // Recalculate 'active' status based on current Store state
        // This prevents overwriting the active flag incorrectly if the user switched tabs quickly
        const isActive = b.id === Store.state.activeId;

        await DB.set('session', null, {
            id: b.id,
            name: b.name,
            content: b.content,
            handle: b.handle,
            kind: b.kind,
            path: b.path || '',
            dirty: b.dirty,
            active: isActive
        });
    },

    // Debounce specifically for the single buffer
    debounceSaveBuffer(b) {
        clearTimeout(this.saveBufTimer);
        this.saveBufTimer = setTimeout(() => {
            // Safety check: Ensure buffer wasn't closed while timer was running
            if (Store.state.buffers.find(x => x.id === b.id)) {
                this.saveBuffer(b);
            }
        }, 1000); // 1 second debounce
    },
    closeBuffer(id) {
        Store.closeBuffer(id);
    }
};
