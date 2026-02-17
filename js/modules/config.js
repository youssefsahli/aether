/**
 * Configuration Module
 * Manages application settings and preferences
 */

const Config = {
    defaults: { theme: 'mocha', fontSize: 13, sidebarWidth: 220, wordWrap: true, previewType: 'split' },
    state: {},
    async initFromOPFS() {
        // Try to load config defaults from OPFS if available
        try {
            if (!Store.state.opfsRoot) return null;
            const configHandle = await Store.state.opfsRoot.getFileHandle('.aether.json').catch(() => null);
            if (configHandle) {
                const file = await configHandle.getFile();
                const text = await file.text();
                return JSON.parse(text);
            }
        } catch (e) { /* ignore */ }
        return null;
    },
    async init() {
        try {
            // Load from OPFS first, then localStorage, then defaults
            const opfsConfig = await this.initFromOPFS();
            const localConfig = JSON.parse(localStorage.getItem('aether_config') || '{}');
            this.state = { ...this.defaults, ...opfsConfig, ...localConfig };
        }
        catch (e) { this.state = { ...this.defaults }; }
        this.apply();
    },
    save() { localStorage.setItem('aether_config', JSON.stringify(this.state)); this.apply(); },
    async saveToOPFS() {
        // Save current config to OPFS as .aether.json
        try {
            if (!Store.state.opfsRoot) return false;
            const handle = await Store.state.opfsRoot.getFileHandle('.aether.json', { create: true });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(this.state, null, 2));
            await writable.close();
            UI.toast('Config saved to OPFS');
            return true;
        } catch (e) { UI.toast('Failed to save config to OPFS'); return false; }
    },
    setTheme(name) { this.state.theme = name; this.save(); },
    toggleWrap() { this.state.wordWrap = !this.state.wordWrap; this.save(); UI.toast(`Word Wrap: ${this.state.wordWrap ? 'ON' : 'OFF'}`); },
    togglePreviewType() {
        this.state.previewType = this.state.previewType === 'split' ? 'float' : 'split';
        this.save();
        UI.toast(`Preview: ${this.state.previewType.toUpperCase()}`);
    },
    zoom(delta) { this.state.fontSize = Math.max(10, Math.min(24, this.state.fontSize + delta)); this.save(); UI.toast(`Zoom: ${this.state.fontSize}px`); },
    apply() {
        document.body.setAttribute('data-theme', this.state.theme);
        document.documentElement.style.setProperty('--sidebar-w', this.state.sidebarWidth + 'px');
        const split = document.getElementById('editor-split');
        if (this.state.previewType === 'float') split.classList.add('mode-float'); else split.classList.remove('mode-float');

        if (Editor.instance) {
            Editor.instance.setFontSize(this.state.fontSize);
            Editor.instance.setOption("wrap", this.state.wordWrap);
            Editor.instance.setTheme(this.state.theme === 'latte' ? 'ace/theme/chrome' : 'ace/theme/tomorrow_night_eighties');
            Editor.instance.resize();
        }
    }
};
