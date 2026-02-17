# Aether Technical Manual

Complete reference guide for Aether, a browser-based code editor for scripting and experimentation.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Editor Interface](#editor-interface)
3. [Supported Languages](#supported-languages)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Command Palette](#command-palette)
6. [Aether API](#aether-api)
7. [File Management](#file-management)
8. [Storage & Persistence](#storage--persistence)
9. [Themes & Customization](#themes--customization)
10. [Configuration](#configuration)
11. [Advanced Usage](#advanced-usage)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- 50MB available storage (for OPFS)

### First Launch

1. Open Aether in your browser
2. The welcome page appears on first load
3. Create your first file using `Ctrl+N` or Command Palette
4. Start writing code in any supported language
5. Toggle preview with the pane divider to see output

### Creating & Opening Files

**Create a New File:**
- Press `Ctrl+N` and enter a filename
- File extension determines syntax highlighting and execution mode
- Supported extensions: `.js`, `.py`, `.html`, `.css`, `.md`, `.pas`

**Open a File:**
- Press `Ctrl+O` to browse stored files
- Files persist in browser storage between sessions
- Use OPFS for larger files

---

## Editor Interface

### Layout Components

**Editor Pane (Left)**
- Main code editing area
- Line numbers and syntax highlighting
- Minimap on the right side
- Status bar showing cursor position and file info

**Preview Pane (Right)**
- Output from executed code
- Console logs and errors
- HTML/Markdown rendering
- JavaScript execution results

**Divider**
- Click and drag to resize panes
- Double-click to reset to default size
- Hidden when preview is floating

**Command Bar**
- Access theme switcher
- Toggle preview mode
- Manage files
- Configure settings

### Status Bar

Shows:
- Current file name
- Cursor line/column position
- File size
- Language mode
- Auto-save indicator

### Minimap

Right-side overview of your code
- Click to jump to location
- Drag to scroll through file
- Disabled on small screens

---

## Supported Languages

### JavaScript
- Modern ES6+ syntax supported
- Browser APIs available
- Aether API access
- Execution in preview pane

**File extension:** `.js`

### Python
- Basic Python 3 syntax
- Limited to browser-compatible features
- Import limitations (no file system access)
- Output to console

**File extension:** `.py`

### HTML
- Full HTML5 support
- Inline CSS and JavaScript
- Preview renders immediately
- DOM access in scripts

**File extension:** `.html`

### CSS
- CSS3 features supported
- Can be imported in HTML files
- Live preview updates
- Preprocessor support (limited)

**File extension:** `.css`

### Markdown
- GitHub Flavored Markdown
- Code blocks with syntax highlighting
- Tables, lists, links
- Direct preview rendering

**File extension:** `.md`

### Pascal
- Classic Pascal syntax
- Educational language support
- Console output
- Limited standard library

**File extension:** `.pas`

---

## Keyboard Shortcuts

### File Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New File |
| `Ctrl+O` | Open File |
| `Ctrl+S` | Save Buffer |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+W` | Close File |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Open Command Palette |
| `Ctrl+G` | Go to Line |
| `Ctrl+Tab` | Next File |
| `Ctrl+Shift+Tab` | Previous File |
| `Ctrl+Home` | Go to Start |
| `Ctrl+End` | Go to End |

### Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+X` | Cut Line |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+/` | Toggle Comment |
| `Tab` | Indent |
| `Shift+Tab` | Dedent |
| `Ctrl+D` | Delete Line |

### Search & Replace
| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `Ctrl+Shift+F` | Find in All Files |
| `F3` | Find Next |
| `Shift+F3` | Find Previous |

### View Options
| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+E` | Toggle Explorer |
| `Ctrl+J` | Toggle Console |
| `Ctrl+Shift+P` | Toggle Preview Float |
| `Ctrl+=` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |

---

## Command Palette

Access via `Ctrl+P` to run commands without keyboard shortcuts.

### Common Commands

**Workspace**
- `New File` - Create new file
- `Open File` - Browse and open files
- `Save` - Save current file
- `Close Tabs` - Close all open files

**View**
- `Toggle Preview` - Show/hide preview pane
- `Float Preview` - Toggle floating preview mode
- `Toggle Sidebar` - Show/hide file explorer
- `Toggle Console` - Show/hide console output

**Theme**
- `Theme: Mocha` - Switch to Mocha theme
- `Theme: Macchiato` - Switch to Macchiato theme
- `Theme: Frappe` - Switch to Frappe theme
- `Theme: Latte` - Switch to Latte theme

**Settings**
- `Preferences` - Open settings dialog
- `Font Size` - Adjust editor font
- `Line Height` - Adjust line spacing
- `Word Wrap` - Toggle line wrapping

**Help**
- `API Reference` - View Aether API documentation
- `Keyboard Shortcuts` - Display all shortcuts
- `Welcome` - Show welcome page

---

## Aether API

The Aether API provides methods to interact with the editor, execute code, and manage files.

### Console Methods

**`Aether.log(message)`**
Output text to the console. Supports multiple arguments.
```javascript
Aether.log("Hello, World!");
Aether.log("Value:", 42);
Aether.log({x: 1, y: 2});
```

**`Aether.error(message)`**
Log an error message (displayed in red).
```javascript
Aether.error("Something went wrong!");
```

**`Aether.warn(message)`**
Log a warning message (displayed in yellow).
```javascript
Aether.warn("This might be an issue");
```

**`Aether.clear()`**
Clear the console output.
```javascript
Aether.clear();
```

### File Methods

**`Aether.openFile(filename, content)`**
Create and open a new file in the editor.
```javascript
Aether.openFile("hello.js", "console.log('Hello');");
```

**`Aether.readFile(filename)`**
Read contents of a file. Returns Promise.
```javascript
const content = await Aether.readFile("myfile.js");
Aether.log(content);
```

**`Aether.saveFile(filename, content)`**
Save content to a file. Returns Promise.
```javascript
await Aether.saveFile("output.txt", "Generated content");
```

**`Aether.deleteFile(filename)`**
Delete a file. Returns Promise.
```javascript
await Aether.deleteFile("oldfile.js");
```

### OPFS Methods

Origin Private File System (OPFS) stores files in browser's persistent storage.

**`Aether.saveOPFSFile(filename, content)`**
Save file to OPFS. Returns Promise.
```javascript
await Aether.saveOPFSFile("data.json", JSON.stringify({x: 42}));
```

**`Aether.readOPFSFile(filename)`**
Read file from OPFS. Returns Promise.
```javascript
const data = await Aether.readOPFSFile("data.json");
const obj = JSON.parse(data);
```

**`Aether.listOPFSFiles()`**
Get list of all files in OPFS. Returns Promise.
```javascript
const files = await Aether.listOPFSFiles();
Aether.log("Stored files:", files.join(", "));
```

**`Aether.deleteOPFSFile(filename)`**
Delete file from OPFS. Returns Promise.
```javascript
await Aether.deleteOPFSFile("olddata.json");
```

**`Aether.clearOPFS()`**
Delete all files in OPFS. Returns Promise.
```javascript
await Aether.clearOPFS();
```

### UI Methods

**`Aether.toast(message, duration)`**
Show a notification toast. Duration in milliseconds (default: 2000).
```javascript
Aether.toast("Script completed!");
Aether.toast("Warning!", 3000);
```

**`Aether.progress(percent)`**
Show progress indicator. Pass 0 to hide.
```javascript
Aether.progress(50); // Show 50% progress
Aether.progress(0);  // Hide progress
```

**`Aether.prompt(message)`**
Show input dialog. Returns Promise with user input.
```javascript
const name = await Aether.prompt("Enter your name:");
Aether.log("Hello, " + name);
```

**`Aether.confirm(message)`**
Show confirmation dialog. Returns Promise<boolean>.
```javascript
const confirmed = await Aether.confirm("Are you sure?");
if (confirmed) {
  Aether.log("Confirmed");
}
```

### Environment Methods

**`Aether.getVersion()`**
Get Aether version.
```javascript
const version = Aether.getVersion();
Aether.log("Aether v" + version);
```

**`Aether.getTheme()`**
Get current theme name.
```javascript
const theme = Aether.getTheme();
Aether.log("Current theme: " + theme);
```

**`Aether.setTheme(name)`**
Change theme. Valid values: "mocha", "macchiato", "frappe", "latte".
```javascript
Aether.setTheme("frappe");
```

---

## File Management

### File Browser

Access via `Ctrl+E` or Command Palette → "Toggle Explorer"

**Create File**
- Click "+" icon in explorer
- Enter filename with extension
- File opens in editor

**Delete File**
- Right-click file → Delete
- Confirm deletion
- File removed from storage

**Rename File**
- Right-click file → Rename
- Enter new name
- Saved with new filename

**Organize Files**
- Files grouped by type (JS, HTML, etc.)
- Alphabetical sorting
- Search box to filter files

### File Extensions & Types

| Extension | Type | Execution |
|-----------|------|-----------|
| `.js` | JavaScript | Browser |
| `.py` | Python | Interpreter |
| `.html` | HTML | Browser render |
| `.css` | Stylesheet | Imported by HTML |
| `.md` | Markdown | Rendered preview |
| `.pas` | Pascal | Interpreter |
| `.txt` | Text | Plain text |
| `.json` | JSON | Raw display |

---

## Storage & Persistence

### Browser Storage

Changes auto-save to browser storage (localStorage/IndexedDB)

**Automatic:**
- Saves after every keystroke (debounced)
- Persists between sessions
- Storage limit: ~5-50MB depending on browser

**Manual:**
- `Ctrl+S` forces immediate save
- Useful for verification

### OPFS (Origin Private File System)

Persistent storage for larger files

**Advantages:**
- Per-origin quota: 10% of available disk space
- Survives cache clearing
- Designed for app storage

**Usage:**
```javascript
// Save to OPFS
await Aether.saveOPFSFile("mydata.json", data);

// List all OPFS files
const files = await Aether.listOPFSFiles();
```

### Clearing Data

**Delete Individual Files:**
- Right-click in explorer → Delete

**Clear All Files:**
```javascript
await Aether.clearOPFS();
```

**Browser Storage:**
- Access browser DevTools → Application → Clear storage
- Clears all Aether data

---

## Themes & Customization

### Available Themes

All themes use Catppuccin color scheme.

**Mocha** (Default)
- Dark background (#1e1e2e)
- Warm, comfortable colors
- Recommended for long sessions

**Macchiato**
- Dark gray background (#24273a)
- Softer contrast
- Alternative dark option

**Frappe**
- Cool dark background (#303446)
- Blue-tinted palette
- Professional appearance

**Latte**
- Light background (#fffaf3)
- High contrast
- Daytime/print friendly

### Switching Themes

**Via Command Palette:**
- Press `Ctrl+P`
- Type "Theme:"
- Select desired theme

**Via Settings:**
- Command Palette → Preferences
- Find "Theme" option
- Click to change

### Font Customization

**Font Size:**
- `Ctrl+=` to increase
- `Ctrl+-` to decrease
- `Ctrl+0` to reset
- Or set in Preferences (8-32px)

**Font Family:**
- Default: System monospace
- Configurable in settings
- Supports web-safe fonts

### Editor Settings

Access via Command Palette → "Preferences"

- Font size (8-32px)
- Line height (multiplier)
- Word wrap (on/off)
- Tab size (2-8 spaces)
- Insert spaces (vs tabs)
- Auto-indent (on/off)
- Show minimap (on/off)
- Show line numbers (on/off)

---

## Configuration

### Settings File

Settings stored in browser localStorage under key `aether-settings`

**Default settings:**
```json
{
  "theme": "mocha",
  "fontSize": 14,
  "lineHeight": 1.5,
  "wordWrap": true,
  "tabSize": 2,
  "insertSpaces": true,
  "autoIndent": true,
  "showMinimap": true,
  "showLineNumbers": true
}
```

### Accessing Settings Programmatically

**Get Setting:**
```javascript
const fontSize = localStorage.getItem("aether-fontSize");
```

**Set Setting:**
```javascript
localStorage.setItem("aether-fontSize", "16");
// Requires page reload or manual update
```

### Environment Variables

Pass query parameters to control startup:

```
http://aether.local/?theme=frappe&fontSize=16
```

Available parameters:
- `theme` - Initial theme (mocha, macchiato, frappe, latte)
- `fontSize` - Initial font size (8-32)
- `file` - File to open on load
- `code` - Code to execute on load

---

## Advanced Usage

### Scripting Techniques

**Fetch External Data:**
```javascript
const response = await fetch("https://api.example.com/data");
const data = await response.json();
Aether.log(JSON.stringify(data, null, 2));
```

**Generate Code Dynamically:**
```javascript
let code = "// Generated\n";
for (let i = 0; i < 10; i++) {
  code += `console.log(${i});\n`;
}
Aether.openFile("generated.js", code);
```

**Process & Transform Data:**
```javascript
const raw = await Aether.readOPFSFile("input.json");
const data = JSON.parse(raw);
const transformed = data.map(item => ({...item, processed: true}));
await Aether.saveOPFSFile("output.json", JSON.stringify(transformed));
```

**Build Multi-File Projects:**
```javascript
// Create project structure
await Aether.saveFile("index.html", "<!DOCTYPE html>...");
await Aether.saveFile("style.css", "body { ... }");
await Aether.saveFile("script.js", "console.log('Ready');");
```

### Debugging

**Using Console:**
- Logs appear in preview pane
- `Ctrl+J` toggles console
- Colors indicate log/warn/error

**Error Messages:**
- Syntax errors show full stack trace
- Runtime errors include line numbers
- Click to navigate to error location

**Breakpoints (Limited):**
- Use `debugger;` statement in JavaScript
- Opens browser DevTools debugger
- Browser-dependent functionality

### Performance Tips

**Large Files:**
- Split into multiple files
- Use OPFS for data storage
- Avoid inline large datasets

**Slow Scripts:**
- Monitor with performance API
- Use console timers: `console.time()` / `console.timeEnd()`
- Profile with browser DevTools

**Memory Management:**
- Clear unnecessary variables
- Use `Aether.clear()` for console
- Monitor OPFS usage

---

## Troubleshooting

### Common Issues

**Q: My code doesn't run**
A: Check browser console (F12) for errors. Verify file extension matches language. Some APIs require HTTPS.

**Q: Files disappearing**
A: Browser storage may be cleared. Use OPFS for important data. Export files regularly.

**Q: Cannot save to OPFS**
A: OPFS may be disabled. Check browser settings. Try using localStorage instead.

**Q: Preview not updating**
A: Toggle preview pane off/on with `Ctrl+Shift+P`. Hard refresh browser. Check for JavaScript errors.

**Q: Keyboard shortcuts not working**
A: May conflict with browser shortcuts. Custom shortcuts via about:config (browser-dependent).

**Q: Storage quota exceeded**
A: Clear old files. Export important data. Check quota in DevTools → Application.

### Performance Issues

**Slow editing:**
- Reduce minimap complexity
- Disable word wrap temporarily
- Reduce line highlighting

**Slow execution:**
- Profile code with DevTools
- Use `console.time()` to measure sections
- Optimize loops and algorithms

**High memory usage:**
- Clear console with `Aether.clear()`
- Close unused files with `Ctrl+W`
- Refresh page to reset memory

### Browser Compatibility

**Chrome/Edge:**
- Full support
- Best performance
- All features available

**Firefox:**
- Full support
- Slightly slower
- Minor UI differences

**Safari:**
- Full support
- Limited OPFS in private browsing
- Zoom may behave differently

**Mobile Browsers:**
- Limited zoom control
- Touch keyboard integration varies
- Preview may be full-screen only

### Getting Help

- Check the [Welcome Page](welcome.md)
- See [Scripting Guide](SCRIPTING.md)
- Review [Quick Reference](SCRIPT_QUICK_REF.md)
- Visit [Example Scripts](EXAMPLE_SCRIPTS.js)

---

## Keyboard Reference Card

**File Operations:** `Ctrl+N` New | `Ctrl+O` Open | `Ctrl+S` Save | `Ctrl+W` Close

**Navigation:** `Ctrl+P` Palette | `Ctrl+G` Go to Line | `Ctrl+Tab` Next File

**Editing:** `Ctrl+Z` Undo | `Ctrl+/` Comment | `Ctrl+D` Delete Line | `Tab` Indent

**Search:** `Ctrl+F` Find | `Ctrl+H` Replace

**View:** `Ctrl+B` Sidebar | `Ctrl+J` Console | `Ctrl+Shift+P` Float Preview

**Zoom:** `Ctrl+=` In | `Ctrl+-` Out | `Ctrl+0` Reset

---

## Changelog & Versions

Current version can be checked via `Aether.getVersion()` in console.

For detailed version history and updates, visit the [main repository](https://github.com/youssefsahli/aether).

---

**Last Updated:** February 2026

For feedback, issues, or feature requests, please visit the GitHub repository.
