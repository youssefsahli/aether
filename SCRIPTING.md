# Aether v3 Scripting Guide

Aether v3 now supports JavaScript scripting through the global `Aether` API. Use scripts to automate workflows, configure defaults, and extend editor functionality.

## Quick Start

### Creating a Script

1. Create a `.js` file in Aether (e.g., `my-script.js`)
2. Write JavaScript using the `Aether` API (see reference below)
3. Run via Command Palette: Search **"Run Active Script"**

### Auto-Run on Startup

Save a script as `.aether.js` in OPFS (your local file system):
1. Create/edit a file named `.aether.js`
2. Save it to OPFS (Command Palette → "Open Local File" or drag-drop to OPFS sidebar)
3. The script runs automatically when Aether loads

### Config Defaults from OPFS

Save editor configuration to OPFS:
1. Edit settings: Command Palette → "Edit Settings"
2. Save config: Command Palette → "Save Config to OPFS"
3. Config becomes `.aether.json` in OPFS and is loaded on future sessions

---

## Script API Reference

All API methods are available via `Aether` object. Some operations are **async** (marked with ⏱️).

### File/Buffer Management

#### `Aether.newFile(name, content = '')`
Create a new file buffer in memory.
```javascript
Aether.newFile('game.js', 'class Game { }');
```

#### `Aether.openFile(name, content)`
Open or switch to a file buffer.
```javascript
const result = Aether.openFile('script.js', 'console.log("test");');
// returns: { name: 'script.js', id: 'b...' }
```

#### `Aether.getActiveBuffer()`
Get the currently active buffer object.
```javascript
const buf = Aether.getActiveBuffer();
Aether.log('Active file: ' + buf.name);
```

#### `Aether.getBuffer(id)`
Get a specific buffer by ID.
```javascript
const buf = Aether.getBuffer('b123456...');
```

#### `Aether.getAllBuffers()`
Get array of all open buffers.
```javascript
const all = Aether.getAllBuffers();
all.forEach(b => Aether.log(b.name));
```

#### `Aether.setActiveBuffer(id)`
Switch to a specific buffer.
```javascript
Aether.setActiveBuffer('b123456...');
```

#### `Aether.closeBuffer(id)`
Close a buffer by ID (defaults to active).
```javascript
Aether.closeBuffer(); // closes active
Aether.closeBuffer('b123456...'); // closes specific
```

---

### Editor Content & Position

#### `Aether.getEditorContent()`
Get full text of active editor.
```javascript
const code = Aether.getEditorContent();
Aether.log('Lines: ' + code.split('\n').length);
```

#### `Aether.setEditorContent(content)`
Replace entire editor content.
```javascript
Aether.setEditorContent('// New content\nconst x = 1;');
```

#### `Aether.getEditorLanguage()`
Get file extension/language mode. Supports 70+ languages including `'js'`, `'ts'`, `'py'`, `'html'`, `'css'`, `'md'`, `'go'`, `'rs'`, and more.
```javascript
const lang = Aether.getEditorLanguage();
// 'js', 'py', 'html', 'css', 'md', etc.
```

#### `Aether.getCursorPosition()`
Get cursor location `{row, column}` (0-indexed).
```javascript
const pos = Aether.getCursorPosition();
Aether.log(`Cursor at line ${pos.row + 1}, col ${pos.column + 1}`);
```

#### `Aether.setCursorPosition(row, column)`
Move cursor to specific position.
```javascript
Aether.setCursorPosition(5, 10); // line 6, column 11
```

#### `Aether.getSelectedText()`
Get currently selected text.
```javascript
const selected = Aether.getSelectedText();
if (selected) Aether.log('Selected: ' + selected);
```

#### `Aether.insertText(text)`
Insert text at cursor position.
```javascript
Aether.insertText('// TODO: Fix this\n');
```

---

### Configuration

#### `Aether.getConfig()`
Get current editor config.
```javascript
const cfg = Aether.getConfig();
Aether.log('Theme: ' + cfg.theme);
Aether.log('Font size: ' + cfg.fontSize);
```

#### `Aether.setConfig(key, value)`
Modify a config setting.
```javascript
Aether.setConfig('fontSize', 14);
Aether.setConfig('theme', 'frappe');
```

#### `Aether.updateTheme(name)`
Change editor theme.
```javascript
Aether.updateTheme('latte'); // 'mocha', 'macchiato', 'frappe', 'latte'
```

#### `Aether.updateZoom(delta)`
Adjust font size by delta.
```javascript
Aether.updateZoom(1);  // zoom in
Aether.updateZoom(-2); // zoom out
```

---

### UI & Notifications

#### `Aether.toast(message, duration = 2000)`
Show temporary notification.
```javascript
Aether.toast('Operation completed!');
Aether.toast('Warning message', 3000);
```

#### `Aether.log(message)`
Log to console.
```javascript
Aether.log('Info: script started');
```

#### `Aether.warn(message)`
Log warning.
```javascript
Aether.warn('Missing dependency');
```

#### `Aether.error(message)`
Log error.
```javascript
Aether.error('Failed to process');
```

---

### OPFS (Origin Private File System) - ⏱️ Async

These are **async** operations. Use `await` in async function or `.then()`.

#### ⏱️ `await Aether.listOPFSFiles()`
Get list of files in OPFS.
```javascript
const files = await Aether.listOPFSFiles();
files.forEach(f => Aether.log('File: ' + f));
```

#### ⏱️ `await Aether.readOPFSFile(filename)`
Read file content from OPFS.
```javascript
const content = await Aether.readOPFSFile('data.json');
if (content) {
  const data = JSON.parse(content);
  Aether.log('Data loaded: ' + data);
}
```

#### ⏱️ `await Aether.saveOPFSFile(filename, content)`
Save file to OPFS.
```javascript
const data = { name: 'test', value: 42 };
await Aether.saveOPFSFile('output.json', JSON.stringify(data, null, 2));
```

#### ⏱️ `await Aether.deleteOPFSFile(filename)`
Delete file from OPFS.
```javascript
await Aether.deleteOPFSFile('old-file.js');
```

---

### Projects - ⏱️ Async

Projects organize multiple files in OPFS with metadata in `.aether-project.json`.

#### ⏱️ `await Aether.newProject(name)`
Create and open a new project.
```javascript
await Aether.newProject('my-webapp');
Aether.toast('Project created');
```

#### ⏱️ `await Aether.openProject(name)`
Open an existing project.
```javascript
await Aether.openProject('my-webapp');
const files = Aether.getProjectFiles();
Aether.log('Loaded project with ' + files.length + ' files');
```

#### `Aether.closeProject()`
Close the current project and all tabs.
```javascript
Aether.closeProject();
```

#### ⏱️ `await Aether.saveProject()`
Save project metadata.
```javascript
await Aether.saveProject();
```

#### ⏱️ `await Aether.deleteProject(name)`
Delete a project (files remain in OPFS).
```javascript
await Aether.deleteProject('old-project');
```

#### `Aether.getProjectFiles()`
Get list of files in current project.
```javascript
const files = Aether.getProjectFiles();
files.forEach(f => Aether.log('- ' + f));
```

#### `Aether.addFileToProject(filename)`
Add an existing OPFS file to the current project.
```javascript
Aether.addFileToProject('utils.js');
await Aether.saveProject();
```

---

## Examples

### Example 1: Auto-Format on Save
```javascript
// auto-format.js
const code = Aether.getEditorContent();
const formatted = code.replace(/\s+/g, ' ').trim();
Aether.setEditorContent(formatted);
Aether.toast('Formatted!');
```

### Example 2: Generate Boilerplate
```javascript
// generate-boilerplate.js
const template = `
function main() {
  console.log('Hello, World!');
}

main();
`.trim();

Aether.newFile('app.js', template);
Aether.toast('Boilerplate created');
```

### Example 3: Load Config from OPFS on Startup
```javascript
// .aether.js (auto-runs on load)
try {
  const config = await Aether.readOPFSFile('my-config.json');
  if (config) {
    const cfg = JSON.parse(config);
    Aether.setConfig('theme', cfg.theme);
    Aether.setConfig('fontSize', cfg.fontSize);
    Aether.toast('Custom config loaded');
  }
} catch (e) {
  Aether.error('Config load failed: ' + e.message);
}
```

### Example 4: Batch Process Files
```javascript
// process-all.js
(async () => {
  const files = await Aether.listOPFSFiles();
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = await Aether.readOPFSFile(file);
      const lines = content.split('\n').length;
      Aether.log(`${file}: ${lines} lines`);
    }
  }
})();
```

### Example 5: Interactive Script
```javascript
// interactive-rename.js
const files = await Aether.listOPFSFiles();
Aether.log('Available files:');
files.forEach((f, i) => Aether.log(`${i + 1}. ${f}`));

// Create index of files for reference
const code = files.map((f, i) => `// ${i + 1}. ${f}`).join('\n');
Aether.openFile('_file_index.js', code);
```

---

## Best Practices

1. **Use async/await properly**
   ```javascript
   // ✅ Correct
   (async () => {
     const content = await Aether.readOPFSFile('data.json');
     Aether.log(content);
   })();
   
   // ❌ Wrong - missing async wrapper
   const content = await Aether.readOPFSFile('data.json');
   ```

2. **Handle errors**
   ```javascript
   try {
     const data = await Aether.readOPFSFile('config.json');
     if (!data) {
       Aether.warn('Config not found');
       return;
     }
   } catch (e) {
     Aether.error('Error: ' + e.message);
   }
   ```

3. **Keep scripts focused**
   - One task per script
   - Compose larger workflows from small scripts
   - Use OPFS to persist state between runs

4. **Test interactively**
   - Write scripts incrementally
   - Use `Aether.log()` and `Aether.toast()` for debugging
   - Test edge cases

---

## Configuration Files

### `.aether.json` (Config Defaults)
Saved by "Save Config to OPFS" command. Persists:
- Theme
- Font size
- Word wrap setting
- Preview mode

### `.aether.js` (Init Script)
Runs automatically on startup. Use for:
- Loading custom config
- Pre-opening files
- Setting up workspace
- Validating environment

---

## Limitations & Notes

- Scripts run in the same context as the editor
- No access to real file system (use OPFS instead)
- OPFS is per-domain and per-browser
- Scripts timeout gracefully after long execution
- Use `Aether` for all editor operations
- Avoid modifying DOM directly

---

## Troubleshooting

**Script not running?**
- Check browser console for errors (F12)
- Ensure file extension is `.js`
- Use Command Palette: "Show Script API" to verify syntax

**OPFS operations fail?**
- Verify OPFS is enabled (see sidebar)
- Check file names are correct
- Try reloading the page

**Async operations hanging?**
- Ensure you're using `await` or `.then()`
- Check network/storage access
- Look at browser console for permission errors

---

For more help, open Command Palette and select **"Show Script API"** for the reference guide!
