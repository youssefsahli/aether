# Scripting Guide

Master the Aether JavaScript API to automate workflows, extend editor functionality, and build powerful extensions.

---

## Quick Start

### Create Your First Script

1. Create a new `.js` file in Aether (e.g., `my-script.js`)
2. Write JavaScript using the `Aether` API
3. Run it via Command Palette: Search **"Run Active Script"**

```javascript
// Simple script example
Aether.log('Script started!');
Aether.toast('Hello from Aether!');
```

### Run Scripts on Startup

Save a script as `.aether.js` in OPFS (your local file system):

1. Create or edit a file named `.aether.js`
2. Save it to OPFS
3. It runs automatically when Aether loads

```javascript
// .aether.js - Runs on startup
Aether.log('Aether initialized');
Aether.toast('Welcome back!');
```

### Load Configuration from OPFS

```javascript
// Save settings to OPFS
// Command Palette → "Edit Settings" → "Save Config to OPFS"

// .aether.json is automatically loaded on startup
// Persists: theme, fontSize, wordWrap, previewMode
```

---

## Core Concepts

### Buffers

Buffers are in-memory file representations. Every file open in Aether is a buffer.

- **Active Buffer**: The currently visible file in the editor
- **Buffer ID**: Unique identifier for each buffer (auto-generated)
- **Buffer Content**: The text content of the file
- **Buffer Name**: Filename with extension

### Async Operations

Some Aether API methods are **async** and require special handling:

```javascript
// ✅ Correct: Use async/await
(async () => {
  const files = await Aether.listOPFSFiles();
  Aether.log('Files: ' + files.join(', '));
})();

// ✅ Also correct: Use .then()
Aether.listOPFSFiles().then(files => {
  Aether.log('Files: ' + files.join(', '));
});

// ❌ Wrong: Calling async without awaiting
const files = await Aether.listOPFSFiles(); // Error!
```

### Error Handling

Always wrap async operations in try-catch:

```javascript
(async () => {
  try {
    const content = await Aether.readOPFSFile('config.json');
    if (!content) {
      Aether.warn('Config file not found');
      return;
    }
    const config = JSON.parse(content);
    Aether.log('Config loaded: ' + JSON.stringify(config));
  } catch (error) {
    Aether.error('Failed to load config: ' + error.message);
  }
})();
```

---

## Buffer Management

Control which files are open and active.

### Create New Buffer
```javascript
Aether.newFile(name, content = '')
```
Create a new file buffer in memory (not saved to disk).

```javascript
Aether.newFile('game.js', 'class Game { }');
Aether.newFile('template.html');
```

### Open or Switch to Buffer
```javascript
Aether.openFile(name, content)
```
Open a file or switch to it if already open. Returns `{ name, id }`.

```javascript
const buf = Aether.openFile('main.js', 'console.log("test");');
Aether.log('Opened: ' + buf.name + ' (ID: ' + buf.id + ')');
```

### Get Active Buffer
```javascript
Aether.getActiveBuffer()
```
Returns the currently active buffer object: `{ name, id, content }`.

```javascript
const buf = Aether.getActiveBuffer();
Aether.log('Currently editing: ' + buf.name);
```

### Get Specific Buffer
```javascript
Aether.getBuffer(id)
```
Retrieve a buffer by its ID.

```javascript
const buf = Aether.getBuffer('b123456...');
if (buf) Aether.log('Buffer: ' + buf.name);
```

### Get All Buffers
```javascript
Aether.getAllBuffers()
```
Returns array of all open buffers.

```javascript
const all = Aether.getAllBuffers();
Aether.log('Open files: ' + all.map(b => b.name).join(', '));
```

### Switch to Buffer
```javascript
Aether.setActiveBuffer(id)
```
Make a specific buffer active in the editor.

```javascript
const buffers = Aether.getAllBuffers();
if (buffers.length > 0) {
  Aether.setActiveBuffer(buffers[0].id);
}
```

### Close Buffer
```javascript
Aether.closeBuffer(id = null)
```
Close a buffer. If no ID provided, closes the active buffer.

```javascript
Aether.closeBuffer();              // Close active
Aether.closeBuffer('b123456...');  // Close specific
```

---

## Editor Content & Cursor

Manipulate text and cursor position in the active buffer.

### Get Editor Content
```javascript
Aether.getEditorContent()
```
Get the full text of the active editor.

```javascript
const code = Aether.getEditorContent();
const lineCount = code.split('\n').length;
Aether.log('File has ' + lineCount + ' lines');
```

### Set Editor Content
```javascript
Aether.setEditorContent(content)
```
Replace entire editor content.

```javascript
const template = `function main() {
  console.log('Hello, World!');
}

main();`;

Aether.setEditorContent(template);
```

### Get File Language
```javascript
Aether.getEditorLanguage()
```
Get the file extension/language mode (`'js'`, `'py'`, `'html'`, `'css'`, `'md'`, `'pas'`).

```javascript
const lang = Aether.getEditorLanguage();
if (lang === 'js') {
  Aether.log('JavaScript file detected');
}
```

### Get Cursor Position
```javascript
Aether.getCursorPosition()
```
Get cursor location as `{ row, column }` (0-indexed).

```javascript
const pos = Aether.getCursorPosition();
Aether.log('Cursor at line ' + (pos.row + 1) + ', col ' + (pos.column + 1));
```

### Set Cursor Position
```javascript
Aether.setCursorPosition(row, column)
```
Move cursor to specific position (0-indexed).

```javascript
Aether.setCursorPosition(5, 10);  // Line 6, Column 11
```

### Get Selected Text
```javascript
Aether.getSelectedText()
```
Get currently selected text in editor.

```javascript
const selected = Aether.getSelectedText();
if (selected) {
  Aether.log('Selected: ' + selected);
} else {
  Aether.log('Nothing selected');
}
```

### Insert Text at Cursor
```javascript
Aether.insertText(text)
```
Insert text at current cursor position.

```javascript
Aether.insertText('// TODO: Implement this\n');
```

---

## Configuration

Modify editor settings programmatically.

### Get Current Config
```javascript
Aether.getConfig()
```
Returns all editor settings.

```javascript
const cfg = Aether.getConfig();
Aether.log('Theme: ' + cfg.theme);
Aether.log('Font size: ' + cfg.fontSize);
Aether.log('Word wrap: ' + cfg.wordWrap);
```

### Set Config Value
```javascript
Aether.setConfig(key, value)
```
Modify a specific setting.

```javascript
Aether.setConfig('fontSize', 14);
Aether.setConfig('wordWrap', true);
Aether.setConfig('previewMode', 'split');
```

### Change Theme
```javascript
Aether.updateTheme(name)
```
Switch to a Catppuccin theme: `'mocha'`, `'macchiato'`, `'frappe'`, `'latte'`.

```javascript
Aether.updateTheme('latte');  // Light theme
Aether.updateTheme('mocha');  // Dark theme
```

### Adjust Font Size
```javascript
Aether.updateZoom(delta)
```
Increase/decrease font size by delta.

```javascript
Aether.updateZoom(1);   // Zoom in one step
Aether.updateZoom(-2);  // Zoom out two steps
```

---

## User Notifications

Provide feedback to users.

### Show Toast Notification
```javascript
Aether.toast(message, duration = 2000)
```
Display a temporary notification on screen.

```javascript
Aether.toast('Operation completed!');
Aether.toast('Warning: unsaved changes', 3000);
```

### Log to Console
```javascript
Aether.log(message)
```
Log info message (opens browser dev console).

```javascript
Aether.log('Script execution started');
```

### Log Warning
```javascript
Aether.warn(message)
```
Log warning message to console.

```javascript
Aether.warn('Missing configuration file');
```

### Log Error
```javascript
Aether.error(message)
```
Log error message to console.

```javascript
Aether.error('Failed to save file');
```

---

## OPFS Operations (Async)

Work with files in the Origin Private File System (OPFS). These are **async** operations.

### List OPFS Files
```javascript
await Aether.listOPFSFiles()
```
Get array of all files in OPFS.

```javascript
(async () => {
  const files = await Aether.listOPFSFiles();
  files.forEach(f => Aether.log('- ' + f));
})();
```

### Read OPFS File
```javascript
await Aether.readOPFSFile(filename)
```
Read file content from OPFS. Returns `null` if file doesn't exist.

```javascript
(async () => {
  const content = await Aether.readOPFSFile('data.json');
  if (content) {
    const data = JSON.parse(content);
    Aether.log('Data: ' + JSON.stringify(data));
  } else {
    Aether.warn('File not found');
  }
})();
```

### Save to OPFS
```javascript
await Aether.saveOPFSFile(filename, content)
```
Save file to OPFS (persists across sessions).

```javascript
(async () => {
  const data = { timestamp: Date.now(), name: 'test' };
  await Aether.saveOPFSFile('output.json', JSON.stringify(data, null, 2));
  Aether.toast('File saved to OPFS');
})();
```

### Delete from OPFS
```javascript
await Aether.deleteOPFSFile(filename)
```
Remove file from OPFS.

```javascript
(async () => {
  await Aether.deleteOPFSFile('old-data.json');
  Aether.log('File deleted');
})();
```

---

## Special Configuration Files

### `.aether.js` (Startup Script)
Automatically runs when Aether loads. Use for initialization and setup:

```javascript
// .aether.js
(async () => {
  try {
    // Load custom theme
    const prefs = await Aether.readOPFSFile('preferences.json');
    if (prefs) {
      const p = JSON.parse(prefs);
      Aether.updateTheme(p.theme);
      Aether.setConfig('fontSize', p.fontSize);
    }
    Aether.log('Preferences loaded');
  } catch (e) {
    Aether.error('Init failed: ' + e.message);
  }
})();
```

### `.aether.json` (Config Defaults)
Persists:
- `theme`: Current editor theme
- `fontSize`: Font size in pixels
- `wordWrap`: Text wrapping enabled/disabled
- `previewMode`: Preview display mode

Edit via Command Palette: "Edit Settings" → "Save Config to OPFS"

---

## Best Practices

### 1. Always Use Async/Await Properly
```javascript
// ✅ Correct
(async () => {
  const files = await Aether.listOPFSFiles();
  // Process files
})();

// ❌ Wrong - missing async wrapper
const files = await Aether.listOPFSFiles();
```

### 2. Handle Errors Gracefully
```javascript
(async () => {
  try {
    const data = await Aether.readOPFSFile('config.json');
    if (!data) {
      Aether.warn('Config not found, using defaults');
      return;
    }
    // Process data
  } catch (error) {
    Aether.error('Error: ' + error.message);
  }
})();
```

### 3. Keep Scripts Focused
- One task per script
- Use OPFS to store state between runs
- Compose larger workflows from smaller scripts

### 4. Use Notifications for Feedback
```javascript
Aether.log('Processing started...');
// ... do work ...
Aether.toast('Operation complete!');
```

### 5. Check File Existence Before Reading
```javascript
(async () => {
  const files = await Aether.listOPFSFiles();
  if (!files.includes('config.json')) {
    Aether.log('No config file found');
    return;
  }
  const config = await Aether.readOPFSFile('config.json');
  // Process config
})();
```

### 6. Test Incrementally
- Write scripts step by step
- Use `Aether.log()` for debugging
- Test edge cases before completing

---

## Limitations

- Scripts run in the editor's JavaScript context
- No access to the real file system (use OPFS instead)
- OPFS is per-domain and per-browser profile
- Scripts timeout gracefully after excessive execution time
- DOM manipulation is restricted (use Aether API instead)
- No access to external APIs blocked by CORS

---

## Troubleshooting

**Script doesn't run?**
- Check browser console: Press `F12` and look for errors
- Verify file extension is `.js`
- Use Command Palette: "Show Script API" to validate syntax

**OPFS operations fail?**
- Verify OPFS is accessible (check sidebar)
- Ensure file names are correct (case-sensitive)
- Try reloading the page
- Check browser storage hasn't hit quota limit

**Async operations hang?**
- Ensure using `await` or `.then()` with async functions
- Check browser console for network/storage errors
- Verify OPFS permissions are granted

**Performance issues?**
- Avoid processing large files in loops
- Break long operations into smaller chunks
- Use `Aether.log()` to monitor progress

---

---

## Advanced Async Patterns

### Sequential File Processing
Process files one after another to avoid overwhelming the system:

```javascript
(async () => {
  const files = await Aether.listOPFSFiles();
  
  for (const file of files) {
    try {
      const content = await Aether.readOPFSFile(file);
      // Process each file
      const lines = content.split('\n').length;
      Aether.log(file + ': ' + lines + ' lines');
    } catch (error) {
      Aether.warn('Skipped ' + file + ': ' + error.message);
    }
  }
  
  Aether.toast('Processing complete');
})();
```

### Parallel Operations with Promise.all()
For independent operations, run them in parallel:

```javascript
(async () => {
  try {
    const [files, config] = await Promise.all([
      Aether.listOPFSFiles(),
      Aether.readOPFSFile('config.json')
    ]);
    
    Aether.log('Files: ' + files.length);
    Aether.log('Config loaded: ' + (config ? 'yes' : 'no'));
  } catch (error) {
    Aether.error('Parallel operation failed: ' + error.message);
  }
})();
```

### Retry Logic with Exponential Backoff
Handle transient failures gracefully:

```javascript
async function readWithRetry(filename, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const content = await Aether.readOPFSFile(filename);
      if (content) return content;
      throw new Error('File not found');
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
(async () => {
  try {
    const data = await readWithRetry('important-data.json');
    Aether.log('Data retrieved');
  } catch (error) {
    Aether.error('Failed after retries: ' + error.message);
  }
})();
```

### Timeout Pattern
Prevent scripts from hanging indefinitely:

```javascript
async function withTimeout(promise, timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Usage
(async () => {
  try {
    const files = await withTimeout(
      Aether.listOPFSFiles(),
      3000 // 3 second timeout
    );
    Aether.log('Files: ' + files.length);
  } catch (error) {
    Aether.error('Operation timed out');
  }
})();
```

---

## Debugging Scripts

### Effective Logging
Use structured logging for easier debugging:

```javascript
// Create a logging utility
const Log = {
  info: (msg) => Aether.log('INFO: ' + msg),
  warn: (msg) => Aether.warn('WARN: ' + msg),
  error: (msg) => Aether.error('❌ ' + msg),
  success: (msg) => { Aether.log('✅ ' + msg); Aether.toast(msg); }
};

// Usage
(async () => {
  Log.info('Script started');
  
  try {
    const files = await Aether.listOPFSFiles();
    Log.success('Found ' + files.length + ' files');
  } catch (error) {
    Log.error('Failed: ' + error.message);
  }
})();
```

### Debugging Async Operations
Monitor the progress of async operations:

```javascript
(async () => {
  Aether.log('START: Loading files...');
  const startTime = Date.now();
  
  try {
    const files = await Aether.listOPFSFiles();
    const elapsed = Date.now() - startTime;
    
    Aether.log('SUCCESS: Loaded ' + files.length + ' files in ' + elapsed + 'ms');
    
    for (const file of files) {
      Aether.log('  - ' + file);
    }
  } catch (error) {
    Aether.error('FAILED: ' + error.message);
  }
})();
```

### Testing Script Logic
Create a test suite for your scripts:

```javascript
// test-utils.js
const assert = {
  equal: (actual, expected, msg) => {
    if (actual !== expected) {
      throw new Error(msg || 'Assertion failed: ' + actual + ' !== ' + expected);
    }
  },
  ok: (value, msg) => {
    if (!value) throw new Error(msg || 'Assertion failed: ' + value);
  },
  exists: (value, msg) => {
    if (value === null || value === undefined) {
      throw new Error(msg || 'Value does not exist');
    }
  }
};

// Usage
(async () => {
  try {
    const buf = Aether.getActiveBuffer();
    assert.exists(buf, 'Active buffer should exist');
    assert.ok(buf.name, 'Buffer should have a name');
    
    Aether.log('✅ All assertions passed');
  } catch (error) {
    Aether.error('❌ ' + error.message);
  }
})();
```

### Breakpoint-style Debugging
Pause execution to inspect state:

```javascript
async function withBreakpoint(label, data) {
  Aether.log('BREAKPOINT: ' + label);
  Aether.log(JSON.stringify(data, null, 2));
  
  return new Promise(resolve => {
    Aether.toast('Breakpoint: ' + label + ' (check console)');
    setTimeout(resolve, 2000);
  });
}

// Usage
(async () => {
  const buffers = Aether.getAllBuffers();
  await withBreakpoint('Buffers', buffers);
  
  const config = Aether.getConfig();
  await withBreakpoint('Config', config);
})();
```

---

## Performance Optimization

### Batch Operations
Group operations to reduce overhead:

```javascript
(async () => {
  // ❌ Slow - individual saves
  // for (const file of data) {
  //   await Aether.saveOPFSFile(file.name, file.content);
  // }
  
  // ✅ Fast - batch save
  const all = [];
  for (const file of data) {
    all.push(Aether.saveOPFSFile(file.name, file.content));
  }
  
  await Promise.all(all);
  Aether.toast('Saved ' + data.length + ' files');
})();
```

### Process Large Files in Chunks
Avoid processing entire large files at once:

```javascript
function processLargeFile(content, chunkSize = 1000) {
  const lines = content.split('\n');
  const results = [];
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const processed = chunk.map(line => line.trim());
    results.push(...processed);
  }
  
  return results;
}

// Usage
(async () => {
  const content = Aether.getEditorContent();
  const processed = processLargeFile(content, 500);
  Aether.log('Processed ' + processed.length + ' lines');
})();
```

### Cache Data to Avoid Repeated Reads
Store frequently accessed data:

```javascript
let configCache = null;

async function getConfig() {
  if (configCache) return configCache;
  
  const data = await Aether.readOPFSFile('config.json');
  if (!data) throw new Error('Config not found');
  
  configCache = JSON.parse(data);
  return configCache;
}

async function invalidateCache() {
  configCache = null;
}

// Usage
(async () => {
  const config1 = await getConfig(); // Reads from OPFS
  const config2 = await getConfig(); // Returns cached value
  
  Aether.log('Same object: ' + (config1 === config2));
})();
```

### Debounce Expensive Operations
Prevent running the same expensive operation multiple times:

```javascript
function debounce(func, delayMs = 1000) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delayMs);
  };
}

const expensiveOperation = debounce(async () => {
  const files = await Aether.listOPFSFiles();
  Aether.log('Expensive operation: ' + files.length);
}, 2000);

// Would only run the final call if called multiple times rapidly
expensiveOperation();
expensiveOperation();
expensiveOperation(); // Only this one executes after 2 seconds
```

---

## Script Composition & Modularity

### Creating Reusable Utilities Module
```javascript
// file-utils.js - Save this to OPFS
const FileUtils = {
  // Get file extension
  ext: (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  },
  
  // Check if file exists in OPFS
  exists: async (filename) => {
    const files = await Aether.listOPFSFiles();
    return files.includes(filename);
  },
  
  // Read with fallback
  readOrDefault: async (filename, defaultValue = '') => {
    try {
      const content = await Aether.readOPFSFile(filename);
      return content || defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  // Save with backup
  saveWithBackup: async (filename, content) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backup = 'backup_' + timestamp + '_' + filename;
    
    const existing = await Aether.readOPFSFile(filename);
    if (existing) {
      await Aether.saveOPFSFile(backup, existing);
    }
    
    await Aether.saveOPFSFile(filename, content);
    return backup;
  }
};

// Usage in other scripts
(async () => {
  const hasExt = name => FileUtils.ext(name) === 'json';
  Aether.log('Is JSON: ' + hasExt('data.json'));
  
  const def = await FileUtils.readOrDefault('missing.txt', 'default');
  Aether.log('Content: ' + def);
})();
```

### Chainable Operations
```javascript
class TextProcessor {
  constructor(text) {
    this.text = text;
  }
  
  uppercase() {
    this.text = this.text.toUpperCase();
    return this;
  }
  
  reverse() {
    this.text = this.text.split('').reverse().join('');
    return this;
  }
  
  addPrefix(prefix) {
    this.text = prefix + this.text;
    return this;
  }
  
  addSuffix(suffix) {
    this.text = this.text + suffix;
    return this;
  }
  
  result() {
    return this.text;
  }
}

// Usage
const processor = new TextProcessor('hello');
const result = processor
  .uppercase()
  .addPrefix('START: ')
  .addSuffix(' :END')
  .result();

Aether.log(result); // "START: HELLO :END"
```

---

## Pattern: Event-like Script Orchestration
Run scripts that respond to file changes:

```javascript
// watch-changes.js
let lastState = null;

async function checkForChanges() {
  const current = Aether.getActiveBuffer();
  
  if (!lastState) {
    lastState = { name: current.name, content: current.content };
    return;
  }
  
  if (lastState.content !== current.content) {
    Aether.log('File changed: ' + current.name);
    lastState.content = current.content;
    return true;
  }
  
  return false;
}

// Run periodically
setInterval(async () => {
  if (await checkForChanges()) {
    Aether.log('Change detected - you could trigger analysis here');
  }
}, 1000);

Aether.toast('Change watcher started');
```

---

## Memory Management

### Clear Large Objects When Done
```javascript
(async () => {
  let largeData = await Aether.readOPFSFile('large.json');
  
  if (largeData) {
    // Process data
    const processed = JSON.parse(largeData);
    Aether.log('Processed');
  }
  
  // Clear references to large data
  largeData = null;
})();
```

### Managing Many Buffers
```javascript
function getBuffersByType(type) {
  const buffers = Aether.getAllBuffers();
  return buffers.filter(b => b.name.endsWith('.' + type));
}

// Cleanup old buffers
function closeOldBuffers(maxCount = 10) {
  const buffers = Aether.getAllBuffers();
  if (buffers.length > maxCount) {
    const toClose = buffers.slice(0, buffers.length - maxCount);
    toClose.forEach(buf => Aether.closeBuffer(buf.id));
    Aether.log('Closed ' + toClose.length + ' buffers');
  }
}

closeOldBuffers(5); // Keep only 5 buffers
```

---

## Common Patterns & Solutions

### Safe JSON Parsing
```javascript
function parseJSON(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch (error) {
    Aether.warn('Parse error: ' + error.message);
    return fallback;
  }
}

// Usage
(async () => {
  const json = await Aether.readOPFSFile('config.json');
  const config = parseJSON(json, { theme: 'mocha', fontSize: 13 });
  Aether.log('Config: ' + JSON.stringify(config));
})();
```

### String Template Rendering
```javascript
function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Usage
const template = 'Hello {{name}}, you have {{count}} messages';
const result = renderTemplate(template, {
  name: 'Alice',
  count: 5
});

Aether.log(result); // "Hello Alice, you have 5 messages"
```

### Array Deduplication
```javascript
function deduplicate(arr) {
  return [...new Set(arr)];
}

const list = ['a', 'b', 'a', 'c', 'b'];
Aether.log('Unique: ' + deduplicate(list).join(', ')); // "a, b, c"
```

### Group Array by Property
```javascript
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

// Usage
const items = [
  { type: 'js', name: 'app.js' },
  { type: 'css', name: 'style.css' },
  { type: 'js', name: 'main.js' }
];

const grouped = groupBy(items, 'type');
Aether.log('JS files: ' + grouped.js.length);
Aether.log('CSS files: ' + grouped.css.length);
```

---

## Building Your Own Tools

### Script Manager
Keep track of your favorite scripts:

```javascript
// script-manager.js
(async () => {
  const scripts = {
    analyze: 'analyze-code.js',
    format: 'format-text.js',
    backup: 'backup-files.js',
    report: 'generate-report.js'
  };
  
  Aether.log('Available scripts:');
  Object.entries(scripts).forEach(([key, file]) => {
    Aether.log('  ' + key.padEnd(10) + ' → ' + file);
  });
  
  // Save as reference
  await Aether.saveOPFSFile('script-registry.json',
    JSON.stringify(scripts, null, 2)
  );
})();
```

### Quick File Template Generator
```javascript
// generate-templates.js
(async () => {
  const templates = {
    'component.js': `export default function Component() {\n  return null;\n}`,
    'style.css': `/* Component styles */\n.component { }`,
    'test.js': `describe('Component', () => {\n  it('should work', () => {});\n});`
  };
  
  for (const [name, content] of Object.entries(templates)) {
    Aether.newFile(name, content);
  }
  
  Aether.toast('Templates created: ' + Object.keys(templates).length);
})();
```

### Statistics Dashboard
```javascript
// stats-dashboard.js
(async () => {
  const buffers = Aether.getAllBuffers();
  
  let totalChars = 0;
  let totalLines = 0;
  let fileStats = [];
  
  buffers.forEach(buf => {
    const lines = buf.content.split('\n').length;
    const chars = buf.content.length;
    
    totalChars += chars;
    totalLines += lines;
    fileStats.push({
      name: buf.name,
      lines: lines,
      size: chars
    });
  });
  
  const stats = {
    timestamp: new Date().toISOString(),
    totalFiles: buffers.length,
    totalLines: totalLines,
    totalChars: totalChars,
    averageLinesPerFile: Math.round(totalLines / buffers.length),
    files: fileStats
  };
  
  await Aether.saveOPFSFile('stats.json', JSON.stringify(stats, null, 2));
  Aether.log('Dashboard saved');
  Aether.toast('Stats: ' + stats.totalFiles + ' files, ' + stats.totalLines + ' lines');
})();
```

---

## Integration Patterns

### Environment-based Configuration
```javascript
(async () => {
  const env = 'development'; // or 'production'
  
  const configs = {
    development: {
      theme: 'frappe',
      debug: true,
      fontSize: 14
    },
    production: {
      theme: 'mocha',
      debug: false,
      fontSize: 12
    }
  };
  
  const config = configs[env];
  Aether.updateTheme(config.theme);
  Aether.setConfig('fontSize', config.fontSize);
  
  if (config.debug) {
    Aether.log('Debug mode enabled');
  }
})();
```

### Plugin-like Architecture
```javascript
// plugin-system.js
const Plugins = {
  installed: [],
  
  register(name, fn) {
    this.installed.push({ name, fn });
    Aether.log('Registered plugin: ' + name);
  },
  
  execute(name, ...args) {
    const plugin = this.installed.find(p => p.name === name);
    if (!plugin) {
      Aether.warn('Plugin not found: ' + name);
      return;
    }
    return plugin.fn(...args);
  },
  
  list() {
    return this.installed.map(p => p.name);
  }
};

// Register plugins
Plugins.register('uppercase', (text) => text.toUpperCase());
Plugins.register('reverse', (text) => text.split('').reverse().join(''));

// Use plugins
const result = Plugins.execute('uppercase', 'hello');
Aether.log(result); // "HELLO"
```

---

## Next Steps

- Explore [api_reference.md](api_reference.md) for complete API documentation
- See [code_examples.md](code_examples.md) for real-world use cases
- Open Command Palette and search **"Show Script API"** for interactive reference
