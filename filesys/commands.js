// Aether Commands List
// This file contains all command definitions for the Aether editor
// Each command has an id, name, hint, and function

const AETHER_COMMANDS = [
    { id: 'newFile', name: 'New File', hint: 'Alt+N', fn: () => NewFilePrompt.open((name, content) => App.openBuffer(name, content, null, 'memory')) },
    { id: 'saveFile', name: 'Save File', hint: 'Ctrl+S', fn: () => Store.activeBuffer && FileSys.saveBuffer(Store.activeBuffer) },
    { id: 'openFile', name: 'Open File', hint: 'Ctrl+O', fn: () => FileSys.openFile() },
    { id: 'closeTab', name: 'Close Tab', hint: 'Alt+W', fn: () => Store.activeBuffer && Store.closeBuffer(Store.activeBuffer.id) },
    { id: 'togglePreview', name: 'Toggle Preview', hint: 'UI', fn: () => { Store.state.previewMode = !Store.state.previewMode; document.body.classList.toggle('preview-active', Store.state.previewMode); App.debouncePreview(true); setTimeout(() => Editor.instance.resize(), 300); } },
    { id: 'settings', name: 'Edit Settings', hint: 'JSON', fn: () => App.openBuffer('config.json', JSON.stringify(Config.state, null, 4), null, 'config') },
    { id: 'switchPreview', name: 'Switch Preview Type', hint: 'Split/Float', fn: () => Config.togglePreviewType() },
    { id: 'wrap', name: 'Toggle Word Wrap', hint: 'View', fn: () => Config.toggleWrap() },
    {
        id: 'removeCache',
        name: 'Remove Cache',
        hint: 'Maintenance',
        fn: async () => {
            // Clear SystemFS file cache
            if (SystemFS && SystemFS.fileCache) SystemFS.fileCache.clear();
            SystemFS.loadedFiles = new Set();
            
            // Clear localStorage caches
            localStorage.removeItem('aether_config');
            
            // Clear IndexedDB stores
            await DB.clear('handles');
            await DB.clear('session');
            
            UI.toast('Cache cleared successfully');
        }
    },
    { id: 'clear', name: 'Reset App', hint: 'Danger', fn: () => { DB.clear('session'); location.reload(); } },
    {
        id: 'format',
        name: 'Format Document',
        hint: 'Alt+Shift+F',
        fn: () => {
            const val = Editor.instance.getValue();
            const cursor = Editor.instance.getCursorPosition();
            try {
                const formatted = prettier.format(val, {
                    parser: "babel", // dynamic based on file extension
                    plugins: prettierPlugins
                });
                Editor.instance.setValue(formatted, -1);
                Editor.instance.moveCursorToPosition(cursor);
                UI.toast("Formatted!");
            } catch (e) { UI.toast("Format Error"); }
        }
    },
    {
        id: 'runScript',
        name: 'Run Active Script',
        hint: 'Scripting',
        fn: async () => {
            const buf = Store.activeBuffer;
            if (!buf) return UI.toast('No active buffer');
            const ext = buf.name.split('.').pop().toLowerCase();
            if (ext !== 'js') return UI.toast('Script must be a .js file');
            await Script.executeScript(buf.content);
        }
    },
    {
        id: 'executeOPFSScript',
        name: 'Execute OPFS Script',
        hint: 'Scripting',
        fn: () => {
            if (!Store.state.opfsRoot) return UI.toast('OPFS not available');
            Prompt.open("Script filename:", ".aether.js", async (filename) => {
                if (!filename) return;
                const script = await Script.loadScript(filename);
                if (!script) return UI.toast('Script not found');
                await Script.executeScript(script.code);
            });
        }
    },
    {
        id: 'saveConfigToOPFS',
        name: 'Save Config to OPFS',
        hint: 'Settings',
        fn: () => Config.saveToOPFS()
    },
    {
        id: 'showScriptAPI',
        name: 'Show Script API',
        hint: 'Documentation',
        fn: () => {
            const apiDoc = `# Aether Script API Reference

## File/Buffer Operations
- \`Aether.openFile(name, content)\` - Open or create a file buffer
- \`Aether.newFile(name, content)\` - Alias for openFile
- \`Aether.getBuffer(id)\` - Get a buffer by ID
- \`Aether.closeBuffer(id)\` - Close a buffer
- \`Aether.setActiveBuffer(id)\` - Set active buffer
- \`Aether.getActiveBuffer()\` - Get the active buffer
- \`Aether.getAllBuffers()\` - Get all buffers

## Editor Operations
- \`Aether.getEditorContent()\` - Get current editor content
- \`Aether.setEditorContent(content)\` - Set editor content
- \`Aether.getEditorLanguage()\` - Get file extension/language
- \`Aether.getCursorPosition()\` - Get cursor {row, column}
- \`Aether.setCursorPosition(row, column)\` - Set cursor position
- \`Aether.getSelectedText()\` - Get selected text
- \`Aether.insertText(text)\` - Insert text at cursor

## Configuration
- \`Aether.getConfig()\` - Get current config state
- \`Aether.setConfig(key, value)\` - Set config value
- \`Aether.updateTheme(name)\` - Change theme
- \`Aether.updateZoom(delta)\` - Adjust zoom level

## UI Operations
- \`Aether.toast(msg, duration)\` - Show notification
- \`Aether.log(msg)\` - Log to console
- \`Aether.warn(msg)\` - Warn to console
- \`Aether.error(msg)\` - Error to console

## OPFS Operations (Async)
- \`await Aether.saveOPFSFile(filename, content)\` - Save to OPFS
- \`await Aether.readOPFSFile(filename)\` - Read from OPFS
- \`await Aether.listOPFSFiles()\` - List OPFS files
- \`await Aether.deleteOPFSFile(filename)\` - Delete from OPFS

## Example Script
\`\`\`javascript
// Use 'await' for async operations
const files = await Aether.listOPFSFiles();
for (const file of files) {
  Aether.log('Found: ' + file);
}

Aether.openFile('generated.js', 'console.log("Hello!");');
Aether.toast('Script completed!');
\`\`\`

## Init Script
Place a \`.aether.js\` file in your OPFS to auto-run on startup!
`;
            App.openBuffer('_script_api_docs.md', apiDoc, null, 'memory');
            UI.toast('API reference opened');
        }
    },
    {
        id: 'saveAsTemplate',
        name: 'Save as Template',
        hint: 'Templates',
        fn: () => {
            const buf = Store.activeBuffer;
            if (!buf) return UI.toast('No active file');
            const filename = buf.name;
            Prompt.open(`Save as template:`, filename, async (name) => {
                if (!name) return;
                await SystemFS.saveAsTemplate(name, buf.content);
            });
        }
    },
    {
        id: 'manageTemplates',
        name: 'Manage Templates',
        hint: 'Templates',
        fn: () => TemplateManager.open()
    },
    {
        id: 'resetTemplates',
        name: 'Reset Templates to Defaults',
        hint: 'Templates',
        fn: () => SystemFS.resetTemplates()
    }
];
