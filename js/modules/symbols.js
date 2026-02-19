/**
 * Symbols Module
 * Code symbol parsing and outline generation
 */

const Symbols = {
    patterns: {
        js: [
            { r: /function\s+([a-zA-Z0-9_$]+)/g, icon: 'f', k: 'func' },
            { r: /class\s+([a-zA-Z0-9_$]+)/g, icon: 'c', k: 'class' },
            { r: /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\(.*?\)\s*=>)/g, icon: 'v', k: 'var' }
        ],
        pas: [
            { r: /(?:procedure|function)\s+([A-Za-z0-9_]+)/ig, icon: 'f', k: 'func' },
            { r: /type\s+([A-Za-z0-9_]+)/ig, icon: 't', k: 'type' },
            { r: /\bvar\s+([A-Za-z0-9_]+)/ig, icon: 'v', k: 'var' }
        ],
        py: [
            { r: /def\s+([a-zA-Z0-9_]+)/g, icon: 'f', k: 'func' },
            { r: /class\s+([a-zA-Z0-9_]+)/g, icon: 'c', k: 'class' }
        ],
        css: [
            { r: /([.#][a-zA-Z0-9_-]+)\s*\{/g, icon: '#', k: 'sel' }
        ],
        md: [
            { r: /^(#{1,6})\s+(.*)$/gm, icon: 'H', k: 'head' }
        ]
    },
    parse() {
        const buf = Store.activeBuffer;
        const tree = document.getElementById('symbol-tree');
        if (!tree) return;
        tree.innerHTML = '';
        if (!buf) return;

        const ext = buf.name.split('.').pop().toLowerCase();
        let lang = null;
        if (['js', 'ts', 'jsx'].includes(ext)) lang = 'js';
        else if (ext === 'py') lang = 'py';
        else if (ext === 'css') lang = 'css';
        else if (ext === 'md') lang = 'md';
        else if (ext === 'html' || ext === 'htm') lang = 'html';
        else if (ext === 'pas' || ext === 'pp') lang = 'pas';
        // If we don't know the lang but LSP provided symbols, continue; otherwise bail
        if (!lang && !(window.Editor && Editor._lspSymbols && Editor._lspSymbols.length)) return;

        const rules = this.patterns[lang] || [];
        const groups = {}; // k -> {title, items:[]}

        // Prefer LSP-provided symbols when available for any language
        if (window.Editor && Editor._lspSymbols && Editor._lspSymbols.length) {
            const seen = new Set();
            Editor._lspSymbols.forEach(s => {
                const kind = (s.kind || 'unknown');
                let key = 'other'; let icon = '·';
                if (/function|method|constructor|func/i.test(kind)) { key = 'func'; icon = 'f'; }
                else if (/class/i.test(kind)) { key = 'class'; icon = 'c'; }
                else if (/var|variable/i.test(kind)) { key = 'var'; icon = 'v'; }
                else if (/import/i.test(kind)) { key = 'import'; icon = 'i'; }
                else if (/heading/i.test(kind)) { key = 'head'; icon = 'H'; }
                else if (/^id$/i.test(kind)) { key = 'id'; icon = '#'; }
                else if (/^class$/i.test(kind)) { key = 'class'; icon = '.'; }
                else if (/tag/i.test(kind)) { key = 'tag'; icon = 't'; }
                if (!groups[key]) groups[key] = { title: key, items: [] };
                const id = `${s.name}@${s.line||1}`;
                if (!seen.has(id)) { groups[key].items.push({ name: s.name, line: s.line || 1, icon }); seen.add(id); }
            });

            // Merge regex fallback for JS to catch var-assigned functions or other patterns LSP might miss
            if (lang === 'js') {
                const lines = buf.content.split('\n');
                lines.forEach((line, i) => {
                    rules.forEach(rule => {
                        let match;
                        rule.r.lastIndex = 0;
                        while ((match = rule.r.exec(line)) !== null) {
                            const name = match[1] || (rule.k === 'md' ? match[2] : '');
                            const icon = rule.icon;
                            const key = rule.k || String(icon);
                            const id = `${name}@${i+1}`;
                            if (!name || seen.has(id)) continue;
                            if (!groups[key]) groups[key] = { title: key, items: [] };
                            groups[key].items.push({ name, line: i + 1, icon });
                            seen.add(id);
                        }
                    });
                });
            }
        } else {
            if (lang === 'html') {
                const txt = buf.content || '';
                // headings
                const reHeading = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/ig;
                let m;
                while((m = reHeading.exec(txt)) !== null){
                    const idx = m.index || 0;
                    const line = txt.slice(0, idx).split('\n').length;
                    const title = (m[2] || '').replace(/\s+/g,' ').trim();
                    const key = 'head'; if (!groups[key]) groups[key] = { title: key, items: [] };
                    groups[key].items.push({ name: title || `<${m[1]}>`, line, icon: 'H' });
                }
                const reTag = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
                while((m = reTag.exec(txt)) !== null){
                    const tag = m[1]; const attrs = m[2] || ''; const idx = m.index || 0; const line = txt.slice(0, idx).split('\n').length;
                    const idMatch = /id\s*=\s*["']([^"']+)["']/i.exec(attrs);
                    if (idMatch){ const key='id'; if (!groups[key]) groups[key] = { title: key, items: [] }; groups[key].items.push({ name: `${tag}#${idMatch[1]}`, line, icon: '#' }); }
                    const classMatch = /class\s*=\s*["']([^"']+)["']/i.exec(attrs);
                    if (classMatch){ const classes = classMatch[1].split(/\s+/).filter(Boolean); for (const c of classes){ const key='class'; if (!groups[key]) groups[key] = { title: key, items: [] }; groups[key].items.push({ name: `${tag}.${c}`, line, icon: '.' }); } }
                    const srcMatch = /src\s*=\s*["']([^"']+)["']/i.exec(attrs);
                    if (srcMatch){ const key='import'; if (!groups[key]) groups[key] = { title: key, items: [] }; groups[key].items.push({ name: `${tag} src=${srcMatch[1]}`, line, icon: 'i' }); }
                }
            } else {
                const lines = buf.content.split('\n');
                lines.forEach((line, i) => {
                    rules.forEach(rule => {
                        let match;
                        rule.r.lastIndex = 0;
                        while ((match = rule.r.exec(line)) !== null) {
                            const name = lang === 'md' ? match[2] : match[1];
                            const icon = lang === 'md' ? (match[1].length) : rule.icon;
                            const key = rule.k || String(icon);
                            if (!groups[key]) groups[key] = { title: key, items: [] };
                            groups[key].items.push({ name, line: i + 1, icon });
                        }
                    });
                });
            }
        }

        // Apply filter
        const filterEl = document.getElementById('outline-filter');
        const filter = filterEl && filterEl.value ? filterEl.value.trim().toLowerCase() : '';

        Object.keys(groups).forEach((k) => {
            const grp = groups[k];
            const gEl = document.createElement('div'); gEl.className = 'symbol-group';

            const header = document.createElement('div'); header.className = 'group-header';
            const titleSpan = document.createElement('span');
            titleSpan.textContent = `${grp.title.toUpperCase()} (${grp.items.length})`;
            const chevronSpan = document.createElement('span');
            chevronSpan.innerHTML = Icons.chevronDown;
            chevronSpan.style.opacity = '0.7';
            header.appendChild(titleSpan);
            header.appendChild(chevronSpan);
            header.onclick = () => {
                gEl.classList.toggle('collapsed');
                const collapsed = gEl.classList.contains('collapsed');
                Store.state.outlineCollapsed = Store.state.outlineCollapsed || {};
                Store.state.outlineCollapsed[k] = collapsed;
                App.debounceSaveSession();
            };
            gEl.appendChild(header);

            const itemsWrap = document.createElement('div'); itemsWrap.className = 'group-items';
            grp.items.forEach(it => {
                if (filter && !it.name.toLowerCase().includes(filter)) return;
                const itEl = document.createElement('div'); itEl.className = 'symbol-item';
                itEl.innerHTML = `<span class="symbol-kind">${it.icon}</span><span class="symbol-name">${it.name}</span><span class="symbol-line">${it.line}</span>`;
                
                // Click handler for outline items
                itEl.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        const ext = buf.name.split('.').pop().toLowerCase();
                        
                        // Always put cursor in editor at the line
                        Editor.instance.gotoLine(it.line);
                        Editor.instance.focus();
                        
                        // Show preview if not already active
                        const wasPreviewActive = Store.state.previewMode;
                        if (!Store.state.previewMode) {
                            Store.state.previewMode = true;
                            document.body.classList.add('preview-active');
                            App.debouncePreview(true);
                            setTimeout(() => Editor.instance.resize(), 300);
                        }
                        
                        // For markdown and HTML, scroll preview to corresponding heading/element
                        if ((ext === 'md' || ext === 'html') && Store.state.previewMode) {
                            setTimeout(() => {
                                const f = document.getElementById('preview-frame');
                                if (f && f.contentWindow) {
                                    // Convert symbol name to ID format (matches marked-config.js)
                                    const scrollId = it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                    f.contentWindow.postMessage({ type: 'scroll-to', id: scrollId }, '*');
                                }
                            }, wasPreviewActive ? 100 : 400);
                        }
                    } catch (e) {
                        console.error('Outline click error:', e);
                    }
                };
                itemsWrap.appendChild(itEl);
            });

            gEl.appendChild(itemsWrap);
            // Apply collapsed state if present
            if (Store.state.outlineCollapsed && Store.state.outlineCollapsed[k]) gEl.classList.add('collapsed');
            tree.appendChild(gEl);
        });
    }
};
