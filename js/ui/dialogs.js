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
            container.innerHTML = `<div class="template-hint">No templates for .${ext} files</div>`;
            return;
        }
        
        templates.forEach(tpl => {
            const el = document.createElement('div');
            el.className = 'template-item' + (this.selectedTemplate === tpl ? ' selected' : '');
            el.innerHTML = `<span class="template-name">${tpl.name}</span><span class="template-ext">.${ext}</span>`;
            el.onclick = () => this.selectTemplate(tpl, el);
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
