/**
 * Dialogs Module
 * Prompt and Confirm dialog handling
 */

const Prompt = {
    open(msg, def, cb) {
        document.getElementById('prompt-mask').style.display = 'flex'; document.getElementById('prompt-msg').innerText = msg;
        const inp = document.getElementById('prompt-input'); inp.value = def; inp.focus(); inp.select();
        const sub = () => { if (inp.value) cb(inp.value); this.close(); };
        document.getElementById('prompt-ok').onclick = sub; inp.onkeydown = (e) => { if (e.key === 'Enter') sub(); if (e.key === 'Escape') this.close(); };
    },
    close() { document.getElementById('prompt-mask').style.display = 'none'; Editor.instance.focus(); }
};

const NewFilePrompt = {
    selectedTemplate: null,
    callback: null,
    
    open(cb) {
        this.callback = cb;
        this.selectedTemplate = null;
        
        document.getElementById('newfile-mask').style.display = 'flex';
        const inp = document.getElementById('newfile-input');
        inp.value = 'untitled.js';
        inp.focus();
        inp.select();
        
        // Set up input listener for dynamic template filtering
        inp.oninput = () => this.updateTemplates();
        inp.onkeydown = (e) => {
            if (e.key === 'Enter') this.submit();
            if (e.key === 'Escape') this.close();
        };
        
        document.getElementById('newfile-ok').onclick = () => this.submit();
        
        // Initial template load
        this.updateTemplates();
    },
    
    updateTemplates() {
        const inp = document.getElementById('newfile-input');
        const filename = inp.value || '';
        const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
        
        const container = document.getElementById('newfile-templates');
        container.innerHTML = '';
        
        if (!ext) {
            container.innerHTML = '<div class="template-hint">Type a filename to see templates</div>';
            return;
        }
        
        const templates = SystemFS.getTemplatesForExtension(ext);
        
        if (templates.length === 0) {
            container.innerHTML = `<div class="template-hint">No templates for .${ext} files. <a href="#" onclick="TemplateManager.open(); NewFilePrompt.close(); return false;" style="color:var(--accent);">Create one</a></div>`;
            return;
        }
        
        templates.forEach(tpl => {
            const el = document.createElement('div');
            el.className = 'template-item' + (this.selectedTemplate === tpl ? ' selected' : '');
            el.innerHTML = `
                <span class="template-name">${tpl.name}</span>
                <span class="template-ext">.${ext}</span>
                <span class="template-actions">
                    <button class="template-edit-btn" title="Edit template">✎</button>
                </span>
            `;
            el.querySelector('.template-name').onclick = (e) => {
                e.stopPropagation();
                this.selectTemplate(tpl, el);
            };
            el.querySelector('.template-ext').onclick = (e) => {
                e.stopPropagation();
                this.selectTemplate(tpl, el);
            };
            el.querySelector('.template-edit-btn').onclick = (e) => {
                e.stopPropagation();
                SystemFS.openTemplate(tpl.filename);
                this.close();
            };
            container.appendChild(el);
        });
    },
    
    selectTemplate(tpl, el) {
        // Toggle selection
        if (this.selectedTemplate === tpl) {
            this.selectedTemplate = null;
            el.classList.remove('selected');
        } else {
            this.selectedTemplate = tpl;
            document.querySelectorAll('#newfile-templates .template-item').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
        }
    },
    
    submit() {
        const inp = document.getElementById('newfile-input');
        const filename = inp.value;
        if (!filename) return;
        
        let content = '';
        if (this.selectedTemplate) {
            content = SystemFS.applyTemplateVariables(this.selectedTemplate.content, filename);
        }
        
        if (this.callback) {
            this.callback(filename, content);
        }
        this.close();
    },
    
    close() {
        document.getElementById('newfile-mask').style.display = 'none';
        this.selectedTemplate = null;
        this.callback = null;
        Editor.instance.focus();
    }
};

const Confirm = {
    open(title, msg, onYes) {
        document.getElementById('confirm-mask').style.display = 'flex'; document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-msg').innerText = msg; document.getElementById('confirm-ok').onclick = () => { onYes(); this.close(); };
        document.querySelector('#confirm-mask .btn').focus();
    },
    close() { document.getElementById('confirm-mask').style.display = 'none'; Editor.instance.focus(); }
};

const TemplateManager = {
    open() {
        // Create dialog dynamically
        let mask = document.getElementById('template-manager-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.id = 'template-manager-mask';
            mask.className = 'overlay-mask';
            mask.innerHTML = `
                <div class="dialog" style="width: 480px; max-height: 80vh;">
                    <div style="padding:14px 20px; font-weight:700; background:var(--header-bg); color:var(--text); border-bottom:1px solid var(--border); font-size:12px; text-transform:uppercase; display:flex; justify-content:space-between; align-items:center;">
                        <span>Template Manager</span>
                        <div style="display:flex; gap:6px;">
                            <button class="btn" style="width:auto; padding:4px 8px; font-size:11px;" onclick="TemplateManager.newTemplate()">+ New</button>
                            <button class="btn" style="width:auto; padding:4px 8px; font-size:11px;" onclick="SystemFS.resetTemplates(); TemplateManager.refresh();">Reset</button>
                        </div>
                    </div>
                    <div id="template-manager-list" style="padding: 12px; max-height: 400px; overflow-y: auto;"></div>
                    <div style="display:flex; padding:12px; gap:8px; background: var(--header-bg); justify-content: flex-end;">
                        <button class="btn" style="width:auto; padding:6px 12px; font-size:12px;" onclick="TemplateManager.close()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);
        }
        
        mask.style.display = 'flex';
        this.refresh();
    },
    
    refresh() {
        const list = document.getElementById('template-manager-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        // Group by extension
        const allTemplates = [];
        for (const [ext, templates] of SystemFS.templates) {
            for (const tpl of templates) {
                allTemplates.push({ ...tpl, ext });
            }
        }
        
        if (allTemplates.length === 0) {
            list.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">No templates found</div>';
            return;
        }
        
        // Sort by extension then name
        allTemplates.sort((a, b) => a.ext.localeCompare(b.ext) || a.name.localeCompare(b.name));
        
        let currentExt = '';
        for (const tpl of allTemplates) {
            if (tpl.ext !== currentExt) {
                currentExt = tpl.ext;
                const header = document.createElement('div');
                header.style.cssText = 'font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:8px 0 4px; border-bottom:1px solid var(--border); margin-top:8px;';
                header.textContent = `.${tpl.ext} templates`;
                list.appendChild(header);
            }
            
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:8px; border-radius:4px; margin:4px 0;';
            row.innerHTML = `
                <span style="flex:1; font-family:var(--font-code); font-size:12px;">${tpl.filename}</span>
                <div style="display:flex; gap:4px;">
                    <button class="btn" style="width:auto; padding:4px 8px; font-size:11px;" data-action="edit" title="Edit">✎</button>
                    <button class="btn" style="width:auto; padding:4px 8px; font-size:11px; color:#ff8888;" data-action="delete" title="Delete">✕</button>
                </div>
            `;
            row.querySelector('[data-action="edit"]').onclick = () => {
                SystemFS.openTemplate(tpl.filename);
                this.close();
            };
            row.querySelector('[data-action="delete"]').onclick = async () => {
                await SystemFS.deleteTemplate(tpl.filename);
                this.refresh();
            };
            list.appendChild(row);
        }
    },
    
    newTemplate() {
        Prompt.open('New template filename:', 'template.js', async (filename) => {
            if (!filename) return;
            const content = `// ${filename} Template\n// Created: ${new Date().toLocaleDateString()}\n\n`;
            await SystemFS.saveAsTemplate(filename, content);
            SystemFS.openTemplate(filename);
            this.close();
        });
    },
    
    close() {
        const mask = document.getElementById('template-manager-mask');
        if (mask) mask.style.display = 'none';
        Editor.instance.focus();
    }
};
