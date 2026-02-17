# API Reference

Complete reference for all Aether scripting APIs.

---

## Quick Reference

All APIs are accessed via the global `Aether` object.

### Buffer Operations
```javascript
Aether.newFile(name, content?)              // Create buffer
Aether.openFile(name, content)              // Open/switch buffer
Aether.getActiveBuffer()                    // Current buffer
Aether.getBuffer(id)                        // Buffer by ID
Aether.getAllBuffers()                      // All buffers
Aether.setActiveBuffer(id)                  // Switch buffer
Aether.closeBuffer(id?)                     // Close buffer
```

### Editor Content & Cursor
```javascript
Aether.getEditorContent()                   // Get all text
Aether.setEditorContent(content)            // Set all text
Aether.getEditorLanguage()                  // Get file extension
Aether.getCursorPosition()                  // Get {row, column}
Aether.setCursorPosition(row, column)       // Move cursor
Aether.getSelectedText()                    // Get selection
Aether.insertText(text)                     // Insert at cursor
```

### Configuration
```javascript
Aether.getConfig()                          // Get all settings
Aether.setConfig(key, value)                // Change setting
Aether.updateTheme(name)                    // Change theme
Aether.updateZoom(delta)                    // Adjust font size
```

### UI & Logging
```javascript
Aether.toast(message, duration?)            // Show notification
Aether.log(message)                         // Log info
Aether.warn(message)                        // Log warning
Aether.error(message)                       // Log error
```

### OPFS (Async)
```javascript
await Aether.listOPFSFiles()                // List files
await Aether.readOPFSFile(filename)         // Read file
await Aether.saveOPFSFile(filename, data)   // Write file
await Aether.deleteOPFSFile(filename)       // Delete file
```

---

## Detailed Method Reference

All methods referenced below are available via the global `Aether` object. Call them like: `Aether.methodName()`

### Synchronous Methods

Synchronous methods return immediately and don't require `await`:


### `Aether.newFile(name, content = '')`

**Purpose**: Create a new file buffer in memory

**Parameters**:
- `name` (string): Filename including extension
- `content` (string, optional): Initial file content

**Returns**: Buffer object `{ name, id, content }`

**Examples**:
```javascript
// Create empty buffer
Aether.newFile('app.js');

// Create with initial content
Aether.newFile('index.html', '<html></html>');

// Create multiple files
Aether.newFile('style.css', 'body { margin: 0; }');
Aether.newFile('script.js', 'console.log("loaded");');
```

**Notes**:
- Buffer exists in memory only until saved
- Extension determines syntax highlighting

---

### `Aether.openFile(name, content)`

**Purpose**: Open a file or switch to it if already open

**Parameters**:
- `name` (string): Filename
- `content` (string): File content

**Returns**: `{ name, id }`

**Examples**:
```javascript
// Open new file
const buf = Aether.openFile('main.js', 'function main() {}');
Aether.log('Opened: ' + buf.id);

// Switch to existing file by opening again
Aether.openFile('main.js', ''); // Empty string switches without changing content
```

**Behavior**:
- If file already open, switches to it
- If not open, creates and opens it
- Content parameter can be empty string to avoid overwriting

---

### `Aether.getActiveBuffer()`

**Purpose**: Get the currently active buffer

**Parameters**: None

**Returns**: `{ name, id, content }`

**Examples**:
```javascript
const buf = Aether.getActiveBuffer();
Aether.log('File: ' + buf.name);
Aether.log('Size: ' + buf.content.length + ' bytes');
```

---

### `Aether.getBuffer(id)`

**Purpose**: Retrieve a specific buffer by ID

**Parameters**:
- `id` (string): Buffer ID

**Returns**: Buffer object `{ name, id, content }` or `null` if not found

**Examples**:
```javascript
const buffers = Aether.getAllBuffers();
if (buffers.length > 0) {
  const first = Aether.getBuffer(buffers[0].id);
  Aether.log('First buffer: ' + first.name);
}
```

---

### `Aether.getAllBuffers()`

**Purpose**: Get list of all open buffers

**Parameters**: None

**Returns**: Array of buffer objects

**Examples**:
```javascript
const all = Aether.getAllBuffers();
Aether.log('Open files: ' + all.length);
all.forEach((b, i) => {
  Aether.log((i + 1) + '. ' + b.name);
});
```

---

### `Aether.setActiveBuffer(id)`

**Purpose**: Switch to a specific buffer

**Parameters**:
- `id` (string): Buffer ID

**Returns**: None

**Examples**:
```javascript
const buffers = Aether.getAllBuffers();
if (buffers.length > 1) {
  Aether.setActiveBuffer(buffers[1].id); // Switch to second buffer
}
```

---

### `Aether.closeBuffer(id = null)`

**Purpose**: Close a buffer

**Parameters**:
- `id` (string, optional): Buffer ID to close. If omitted, closes active buffer.

**Returns**: None

**Examples**:
```javascript
// Close active buffer
Aether.closeBuffer();

// Close specific buffer
const buffers = Aether.getAllBuffers();
if (buffers.length > 0) {
  Aether.closeBuffer(buffers[0].id);
}
```

---

## Editor Content & Cursor API

### `Aether.getEditorContent()`

**Purpose**: Get full text content of active editor

**Parameters**: None

**Returns**: String (full file content)

**Examples**:
```javascript
const code = Aether.getEditorContent();

// Count lines
const lineCount = code.split('\n').length;
Aether.log('Lines: ' + lineCount);

// Get file size
const bytes = new Blob([code]).size;
Aether.log('Size: ' + bytes + ' bytes');

// Search for pattern
if (code.includes('TODO')) {
  Aether.log('TODO found in file');
}
```

---

### `Aether.setEditorContent(content)`

**Purpose**: Replace entire editor content

**Parameters**:
- `content` (string): New content

**Returns**: None

**Examples**:
```javascript
// Replace with template
const template = `function main() {
  console.log("Hello, World!");
}

main();`;

Aether.setEditorContent(template);

// Clear file
Aether.setEditorContent('');
```

---

### `Aether.getEditorLanguage()`

**Purpose**: Get current file's language/extension

**Parameters**: None

**Returns**: String (`'js'`, `'py'`, `'html'`, `'css'`, `'md'`, `'pas'`, etc.)

**Examples**:
```javascript
const lang = Aether.getEditorLanguage();

if (lang === 'js') {
  Aether.log('JavaScript file');
}

if (lang === 'py') {
  Aether.log('Python file');
}
```

---

### `Aether.getCursorPosition()`

**Purpose**: Get current cursor position

**Parameters**: None

**Returns**: `{ row, column }` (0-indexed)

**Examples**:
```javascript
const pos = Aether.getCursorPosition();
Aether.log('Line: ' + (pos.row + 1) + ', Column: ' + (pos.column + 1));

// Check if at start of file
if (pos.row === 0 && pos.column === 0) {
  Aether.log('Cursor at start');
}
```

---

### `Aether.setCursorPosition(row, column)`

**Purpose**: Move cursor to specific position

**Parameters**:
- `row` (number): 0-indexed line number
- `column` (number): 0-indexed column number

**Returns**: None

**Examples**:
```javascript
// Move to start of file
Aether.setCursorPosition(0, 0);

// Move to line 10
Aether.setCursorPosition(9, 0);

// Move to specific position
Aether.setCursorPosition(5, 15);
```

---

### `Aether.getSelectedText()`

**Purpose**: Get currently selected text

**Parameters**: None

**Returns**: String (empty string if nothing selected)

**Examples**:
```javascript
const selected = Aether.getSelectedText();

if (selected) {
  Aether.log('Selected: ' + selected);
  Aether.log('Length: ' + selected.length);
} else {
  Aether.log('Nothing selected');
}

// Create new file from selection
if (selected) {
  Aether.newFile('selection.txt', selected);
}
```

---

### `Aether.insertText(text)`

**Purpose**: Insert text at cursor position

**Parameters**:
- `text` (string): Text to insert

**Returns**: None

**Examples**:
```javascript
// Insert comment
Aether.insertText('// TODO: Implement\n');

// Insert code snippet
Aether.insertText('console.log("debug");\n');
```

---

## Configuration API

### `Aether.getConfig()`

**Purpose**: Get all editor settings

**Parameters**: None

**Returns**: Configuration object

**Available Settings**:
```javascript
{
  theme: 'mocha',           // Current theme
  fontSize: 13,             // Font size in pixels
  wordWrap: false,          // Text wrapping
  previewMode: 'split',     // 'split', 'float', or false
  // ... other settings
}
```

**Examples**:
```javascript
const cfg = Aether.getConfig();

Aether.log('Theme: ' + cfg.theme);
Aether.log('Font size: ' + cfg.fontSize);

if (cfg.wordWrap) {
  Aether.log('Word wrap enabled');
}
```

---

### `Aether.setConfig(key, value)`

**Purpose**: Modify a specific setting

**Parameters**:
- `key` (string): Setting name
- `value` (any): New value

**Returns**: None

**Examples**:
```javascript
// Change font size
Aether.setConfig('fontSize', 14);

// Enable word wrap
Aether.setConfig('wordWrap', true);

// Change preview mode
Aether.setConfig('previewMode', 'float');

// Disable preview
Aether.setConfig('previewMode', false);
```

---

### `Aether.updateTheme(name)`

**Purpose**: Change editor theme

**Parameters**:
- `name` (string): Theme name

**Valid Themes**:
- `'mocha'` - Dark theme
- `'macchiato'` - Dark theme (cooler)
- `'frappe'` - Dark theme (warmer)
- `'latte'` - Light theme

**Returns**: None

**Examples**:
```javascript
// Switch to light theme
Aether.updateTheme('latte');

// Switch to dark theme
Aether.updateTheme('mocha');
```

---

### `Aether.updateZoom(delta)`

**Purpose**: Adjust font size

**Parameters**:
- `delta` (number): Change in size (positive = zoom in, negative = zoom out)

**Returns**: None

**Examples**:
```javascript
// Zoom in 2 steps
Aether.updateZoom(2);

// Zoom out 1 step
Aether.updateZoom(-1);

// Reset to default (sequence of operations)
const cfg = Aether.getConfig();
Aether.setConfig('fontSize', 13); // Default font size
```

---

## UI & Logging API

### `Aether.toast(message, duration = 2000)`

**Purpose**: Show temporary notification

**Parameters**:
- `message` (string): Notification text
- `duration` (number, optional): Display time in milliseconds

**Returns**: None

**Examples**:
```javascript
// Show notification
Aether.toast('File saved!');

// Show longer notification
Aether.toast('This is important', 5000);

// Show error notification
Aether.toast('Error: Operation failed', 3000);
```

---

### `Aether.log(message)`

**Purpose**: Log info message to console

**Parameters**:
- `message` (string): Log message

**Returns**: None

**Examples**:
```javascript
Aether.log('Script started');
Aether.log('Buffers open: ' + Aether.getAllBuffers().length);
```

**Note**: Open browser dev console (F12) to see logs

---

### `Aether.warn(message)`

**Purpose**: Log warning message to console

**Parameters**:
- `message` (string): Warning message

**Returns**: None

**Examples**:
```javascript
Aether.warn('Config file not found');
Aether.warn('Operation may fail');
```

---

### `Aether.error(message)`

**Purpose**: Log error message to console

**Parameters**:
- `message` (string): Error message

**Returns**: None

**Examples**:
```javascript
Aether.error('Failed to save file');
Aether.error('Invalid input: ' + error);
```

---

## OPFS API (Async Operations)

### `await Aether.listOPFSFiles()`

**Purpose**: Get list of files in OPFS

**Parameters**: None

**Returns**: Promise<Array<string>> - Array of filenames

**Examples**:
```javascript
(async () => {
  const files = await Aether.listOPFSFiles();
  
  Aether.log('Files in OPFS:');
  files.forEach(f => Aether.log('- ' + f));
  
  // Count files
  Aether.log('Total: ' + files.length);
  
  // Find specific file
  if (files.includes('config.json')) {
    Aether.log('Config file found');
  }
})();
```

---

### `await Aether.readOPFSFile(filename)`

**Purpose**: Read file from OPFS

**Parameters**:
- `filename` (string): Name of file to read

**Returns**: Promise<string | null> - File content or null if not found

**Examples**:
```javascript
(async () => {
  const content = await Aether.readOPFSFile('data.json');
  
  if (content) {
    const data = JSON.parse(content);
    Aether.log('Data: ' + JSON.stringify(data));
  } else {
    Aether.log('File not found');
  }
})();

// Read text file
(async () => {
  const text = await Aether.readOPFSFile('notes.txt');
  if (text) {
    const lines = text.split('\n');
    Aether.log('Lines: ' + lines.length);
  }
})();
```

---

### `await Aether.saveOPFSFile(filename, content)`

**Purpose**: Save file to OPFS (persists across sessions)

**Parameters**:
- `filename` (string): Name for saved file
- `content` (string): File content

**Returns**: Promise<void>

**Examples**:
```javascript
(async () => {
  // Save JSON data
  const data = { timestamp: Date.now(), status: 'ok' };
  await Aether.saveOPFSFile('log.json', JSON.stringify(data, null, 2));
  Aether.toast('Saved to OPFS');
})();

// Save text file
(async () => {
  const content = Aether.getEditorContent();
  await Aether.saveOPFSFile('backup.txt', content);
  Aether.toast('Backup created');
})();
```

---

### `await Aether.deleteOPFSFile(filename)`

**Purpose**: Delete file from OPFS

**Parameters**:
- `filename` (string): Name of file to delete

**Returns**: Promise<void>

**Examples**:
```javascript
(async () => {
  await Aether.deleteOPFSFile('old-data.json');
  Aether.log('File deleted');
})();

// Delete all log files
(async () => {
  const files = await Aether.listOPFSFiles();
  for (const file of files) {
    if (file.startsWith('log-')) {
      await Aether.deleteOPFSFile(file);
      Aether.log('Deleted: ' + file);
    }
  }
})();
```

---

## Return Value Reference

### Buffer Object
```javascript
{
  name: 'script.js',      // Filename
  id: 'b123456...',       // Unique ID
  content: '...'          // File text
}
```

### Cursor Position Object
```javascript
{
  row: 5,         // 0-indexed line number
  column: 10      // 0-indexed column number
}
```

### Configuration Object
```javascript
{
  theme: 'mocha',
  fontSize: 13,
  wordWrap: false,
  previewMode: 'split',
  // ... other properties
}
```

---

## Error Handling Guide

All OPFS operations should use try-catch:

```javascript
(async () => {
  try {
    const content = await Aether.readOPFSFile('config.json');
    if (!content) {
      Aether.warn('File not found');
      return;
    }
    const config = JSON.parse(content);
    // Use config
  } catch (error) {
    Aether.error('Error: ' + error.message);
  }
})();
```

---

---

## Advanced Usage Patterns

### Method Chaining
Some patterns naturally chain:

```javascript
// Often used sequentially
Aether.setActiveBuffer(buffers[0].id);
Aether.setCursorPosition(0, 0);
Aether.insertText('// Header\n');
```

### Safe Access Patterns
Protect against missing data:

```javascript
// Safe buffer access
const buf = Aether.getBuffer(id);
if (buf) {
  Aether.log('Found: ' + buf.name);
} else {
  Aether.log('Buffer not found');
}

// Safe config access
const cfg = Aether.getConfig();
const fontSize = cfg.fontSize || 13; // with fallback
```

### Batch Operations
Group related operations:

```javascript
(async () => {
  // Batch read multiple files
  const files = ['config.json', 'data.json', 'settings.json'];
  const promises = files.map(f => Aether.readOPFSFile(f));
  const [config, data, settings] = await Promise.all(promises);
  
  // Now all are loaded
  Aether.log('All files loaded');
})();
```

### Error Recovery
Handle failures gracefully:

```javascript
async function safeRead(filename, fallback = null) {
  try {
    const content = await Aether.readOPFSFile(filename);
    return content || fallback;
  } catch (error) {
    Aether.warn('Failed to read ' + filename + ': ' + error.message);
    return fallback;
  }
}

// Usage
(async () => {
  const data = await safeRead('data.json', '{}');
})();
```

---

## Method Variations & Notes

### Buffer Operations - Detailed Notes

**ID Format**: Buffer IDs are generated internally by Aether. They're consistent within a session but may change on reload.

**Content Persistence**: Changes made via `Aether.setEditorContent()` only affect the in-memory buffer. Use OPFS to persist.

**Active Buffer Behavior**: Only one buffer can be active at a time. Switching buffers changes the editor view.

### Cursor Position - Important Details

**0-indexed System**: Both row and column are 0-indexed. Line 1, Column 1 is represented as `{row: 0, column: 0}`.

**End of File**: Setting cursor past end of content may fail. Always check bounds or use editor's built-in validation.

**Multi-line Selections**: Cursor represents the end position of any selection. Use `getSelectedText()` to get the full selection.

### Config Keys - Valid Settings

Available configuration keys:
- `theme` - Editor theme name (string)
- `fontSize` - Font size in pixels (number)
- `wordWrap` - Enable/disable word wrap (boolean)
- `previewMode` - 'split' | 'float' | false

**Custom Keys**: You can store custom config values, but only standard keys affect editor behavior.

### OPFS Limitations

**File Size Limits**: Typically quota is 10-50GB per origin, depends on browser.

**Async Requirement**: All OPFS operations must be awaited or chained with `.then()`.

**Filename Restrictions**: Use alphanumeric, hyphens, underscores. Avoid special characters.

**Case Sensitivity**: Filenames are case-sensitive on most systems.

---

## Method Reference Table

| Category | Method | Type | Async | Returns |
|----------|--------|------|-------|---------|
| **Buffers** | newFile(name, content) | Create | No | Buffer |
| | openFile(name, content) | Open | No | {name, id} |
| | getActiveBuffer() | Read | No | Buffer |
| | getBuffer(id) | Read | No | Buffer |
| | getAllBuffers() | Read | No | Buffer[] |
| | setActiveBuffer(id) | Write | No | void |
| | closeBuffer(id) | Delete | No | void |
| **Content** | getEditorContent() | Read | No | string |
| | setEditorContent(text) | Write | No | void |
| | getEditorLanguage() | Read | No | string |
| | getCursorPosition() | Read | No | {row, col} |
| | setCursorPosition(r, c) | Write | No | void |
| | getSelectedText() | Read | No | string |
| | insertText(text) | Write | No | void |
| **Config** | getConfig() | Read | No | Object |
| | setConfig(key, value) | Write | No | void |
| | updateTheme(name) | Write | No | void |
| | updateZoom(delta) | Write | No | void |
| **UI** | toast(msg, duration) | Notify | No | void |
| | log(msg) | Log | No | void |
| | warn(msg) | Log | No | void |
| | error(msg) | Log | No | void |
| **OPFS** | listOPFSFiles() | Read | **Yes** | string[] |
| | readOPFSFile(name) | Read | **Yes** | string |
| | saveOPFSFile(name, data) | Write | **Yes** | void |
| | deleteOPFSFile(name) | Delete | **Yes** | void |

---

## Performance Considerations

### Fast Operations
These complete instantly:
- Buffer creation
- Content operations
- Configuration changes
- Cursor movement

### Slow Operations
These may take time:
- OPFS file operations (network/disk latency)
- Large file parsing
- Processing many buffers

### Optimization Tips
1. **Cache results** - Don't re-read the same file repeatedly
2. **Batch operations** - Group OPFS calls with Promise.all()
3. **Limit iterations** - Avoid processing many files in tight loops
4. **Check sizes** - Be aware of file sizes before operations

---

## Common Gotchas & Solutions

### Problem: "Aether is not defined"
**Cause**: Script running in wrong context or before initialization
**Solution**: Only use Aether API inside scripts run via "Run Active Script" command

### Problem: Async operations hanging
**Cause**: Missing `await` or not in async function
**Solution**: Wrap async code: `(async () => { await Aether.listOPFSFiles(); })()`

### Problem: Changes not visible
**Cause**: Not switching active buffer after changes
**Solution**: Use `Aether.setActiveBuffer(id)` after making changes to show them

### Problem: OPFS operations fail silently
**Cause**: File doesn't exist or quota exceeded
**Solution**: Use try-catch and check `await Aether.listOPFSFiles()` first

### Problem: Theme change doesn't apply
**Cause**: Invalid theme name
**Solution**: Use exact names: 'mocha', 'macchiato', 'frappe', 'latte'

---

## API Stability & Versioning

**Current Version**: Aether v3

**Stable APIs**: All documented methods are stable and suitable for production scripts.

**Experimental**: None currently. All features are stable.

**Deprecated**: None currently. All features are current.

**Future Changes**: API additions will be backward compatible. Existing methods won't change behavior.

---

## See Also

- [scripting_guide.md](scripting_guide.md) - Complete scripting guide with patterns
- [code_examples.md](code_examples.md) - Real-world examples
- [manual.md](manual.md) - General editor documentation
