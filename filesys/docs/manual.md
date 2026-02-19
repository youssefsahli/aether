# Aether Technical Manual

Complete reference for Aether v3 "Ace Flux Edition" — a browser-based code editor with project management, 70+ language support, and persistent OPFS storage.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Projects](#projects)
3. [Editor Interface](#editor-interface)
4. [Supported Languages](#supported-languages)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Command Palette](#command-palette)
7. [Aether API](#aether-api)
8. [File Management](#file-management)
9. [Storage & Persistence](#storage--persistence)
10. [Themes & Customization](#themes--customization)
11. [Advanced Usage](#advanced-usage)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- OPFS support for persistent storage

### First Launch

1. Open Aether in your browser
2. The welcome page appears on first load
3. Create a new project from the OPFS section
4. Add files to your project
5. Toggle preview to see output

### Quick Start

1. Click **New** in the OPFS project bar to create a project
2. Click **+** to create a file (auto-added to project)
3. Write code — syntax highlighting detects your language
4. Toggle preview to see HTML/Markdown rendered or JS executed

---

## Projects

Projects organize your files in OPFS and persist across browser sessions.

### Project Basics

- Each project has a `.aether-project.json` metadata file
- Files are stored in OPFS and linked to projects
- Only one project open at a time
- Closing a project closes all associated tabs

### Creating a Project

1. Click **New** in the OPFS project bar
2. Enter project name (e.g., "my-app")
3. Project opens automatically
4. Create files — they're added to the project

### Opening a Project

1. Click the folder icon in the project bar
2. Select from available projects
3. Current project closes, new one loads
4. Project files appear in OPFS tree

### Saving Projects

Projects auto-save when files change. Click **Save** to force an immediate save.

### Closing Projects

Click **Close** to close the current project. All project tabs close.

### Deleting Projects

1. Open Command Palette (`F1`)
2. Run "Delete Project"
3. Select project to delete
4. Confirm deletion

**Note:** Deleting a project removes its metadata. Files remain in OPFS.

### Project File Format

`.aether-project.json`:
```json
{
  "projectName": "my-app",
  "files": ["index.html", "app.js", "style.css"]
}
```

---

## Editor Interface

### Layout Components

**Header Bar**
- Theme swatches (4 Catppuccin themes)
- Navigation arrows (back/forward)
- Preview toggle button

**Sidebar (Collapsible Sections)**
- **Workspace** — Local workspace files
- **OPFS** — Project files with project bar
- **Templates** — Quick-start file templates
- **System Files** — Documentation and commands

**Editor Pane**
- Main code editing area (Ace Editor 1.32.7)
- Line numbers and syntax highlighting
- Optional minimap
- Multi-tab support

**Preview Pane (Split/Float)**
- JavaScript execution results
- HTML/Markdown rendering
- Console output (log, warn, error, clear)
- Drag divider to resize

### Status Bar

Shows:
- Current file name
- Line : Column position
- Language mode

### Sidebar Sections

Each section is collapsible:
- Click section header to expand/collapse
- State persists across sessions

---

## Supported Languages

Aether supports **70+ programming languages** via Ace Editor's lazy-loaded language modes.

### Languages by Category

**Web Development**
- JavaScript (`.js`, `.mjs`)
- TypeScript (`.ts`, `.tsx`)
- HTML (`.html`, `.htm`)
- CSS (`.css`)
- SCSS/Sass (`.scss`, `.sass`)
- Less (`.less`)
- JSON (`.json`)
- XML (`.xml`)
- SVG (`.svg`)

**Systems Programming**
- C (`.c`, `.h`)
- C++ (`.cpp`, `.hpp`, `.cc`)
- Rust (`.rs`)
- Go (`.go`)
- Zig (`.zig`)

**Scripting Languages**
- Python (`.py`)
- Ruby (`.rb`)
- Perl (`.pl`)
- Lua (`.lua`)
- PHP (`.php`)
- Shell/Bash (`.sh`, `.bash`)
- PowerShell (`.ps1`)

**JVM Languages**
- Java (`.java`)
- Kotlin (`.kt`)
- Scala (`.scala`)
- Groovy (`.groovy`)
- Clojure (`.clj`)

**.NET Languages**
- C# (`.cs`)
- F# (`.fs`)
- VB.NET (`.vb`)

**Functional Languages**
- Haskell (`.hs`)
- OCaml (`.ml`)
- Elixir (`.ex`, `.exs`)
- Erlang (`.erl`)
- Elm (`.elm`)

**Data & Config**
- YAML (`.yaml`, `.yml`)
- TOML (`.toml`)
- INI (`.ini`)
- SQL (`.sql`)
- GraphQL (`.graphql`)

**Documentation**
- Markdown (`.md`)
- LaTeX (`.tex`)
- reStructuredText (`.rst`)

**Other Languages**
- Dart (`.dart`)
- Swift (`.swift`)
- Objective-C (`.m`)
- R (`.r`)
- Julia (`.jl`)
- Pascal (`.pas`)
- Assembly (`.asm`)
- And many more...

### Language Detection

Language mode is determined by file extension. Modes are lazy-loaded from CDN on first use.

---

## Keyboard Shortcuts

### File Operations
| Shortcut | Action |
|----------|--------|
| `Alt+N` | New File |
| `Ctrl+O` | Open File |
| `Ctrl+S` | Save File |
| `Alt+W` | Close Tab |

### Navigation
| Shortcut | Action |
|----------|--------|
| `F1` | Command Palette |
| `Ctrl+G` | Go to Line |
| `Alt+←` | Navigate Back |
| `Alt+→` | Navigate Forward |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |

### Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+/` | Toggle Comment |
| `Tab` | Indent |
| `Shift+Tab` | Dedent |
| `Ctrl+D` | Select Word / Next Occurrence |

### Search & Replace
| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `F3` | Find Next |
| `Shift+F3` | Find Previous |

### View
| Shortcut | Action |
|----------|--------|
| `Ctrl+=` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |

---

## Command Palette

Access via `F1` to run commands quickly.

### All Commands

**File Operations**
- `New File` — Create new file
- `Open File` — Open file picker
- `Save File` — Save current file
- `Close Tabs` — Close all open tabs

**Project Operations**
- `New Project` — Create new OPFS project
- `Open Project` — Switch to another project
- `Close Project` — Close current project and tabs
- `Save Project` — Save project metadata
- `Delete Project` — Remove a project

**View**
- `Toggle Preview` — Show/hide preview pane
- `Float Preview` — Toggle floating preview mode
- `Toggle Sidebar` — Show/hide sidebar
- `Toggle Console` — Show/hide console in preview

**Themes**
- `Theme: Mocha` — Dark warm theme
- `Theme: Macchiato` — Dark gray theme
- `Theme: Frappe` — Cool dark theme
- `Theme: Latte` — Light theme

**Editor**
- `Go To Line` — Jump to line number
- `Show Symbols` — List functions/headings
- `Show Keybindings` — Display shortcuts
- `Run Active Script` — Execute JavaScript file

**Help**
- `Show Script API` — API reference
- `Welcome` — Show welcome page
- `Manual` — Open this manual

---

## Aether API

The global `Aether` object provides methods to interact with the editor, console, files, and OPFS.

### Console Methods

**`Aether.log(...args)`**
Output to console. Supports multiple arguments.
```javascript
Aether.log("Hello");
Aether.log("Value:", 42, {x: 1});
```

**`Aether.error(...args)`**
Log error (red text).
```javascript
Aether.error("Failed:", err.message);
```

**`Aether.warn(...args)`**
Log warning (yellow text).
```javascript
Aether.warn("Deprecated API");
```

**`Aether.clear()`**
Clear console output.

### File Methods

**`Aether.openFile(filename, content)`**
Create/open file in editor.
```javascript
Aether.openFile("app.js", "console.log('Hi');");
```

**`Aether.readFile(filename)`** → `Promise<string>`
Read file contents.
```javascript
const code = await Aether.readFile("app.js");
```

**`Aether.saveFile(filename, content)`** → `Promise`
Save content to file.
```javascript
await Aether.saveFile("data.txt", "Hello");
```

**`Aether.deleteFile(filename)`** → `Promise`
Delete a file.
```javascript
await Aether.deleteFile("old.js");
```

### OPFS Methods

**`Aether.saveOPFSFile(filename, content)`** → `Promise`
Save to OPFS persistent storage.
```javascript
await Aether.saveOPFSFile("data.json", JSON.stringify(data));
```

**`Aether.readOPFSFile(filename)`** → `Promise<string>`
Read from OPFS.
```javascript
const data = JSON.parse(await Aether.readOPFSFile("data.json"));
```

**`Aether.listOPFSFiles()`** → `Promise<string[]>`
List all OPFS files.
```javascript
const files = await Aether.listOPFSFiles();
Aether.log(files.join(", "));
```

**`Aether.deleteOPFSFile(filename)`** → `Promise`
Delete OPFS file.
```javascript
await Aether.deleteOPFSFile("old.json");
```

**`Aether.clearOPFS()`** → `Promise`
Delete all OPFS files.

### Project Methods

**`Aether.newProject(name)`** → `Promise`
Create and open new project.
```javascript
await Aether.newProject("my-app");
```

**`Aether.openProject(name)`** → `Promise`
Open existing project.
```javascript
await Aether.openProject("my-app");
```

**`Aether.closeProject()`**
Close current project and tabs.

**`Aether.saveProject()`** → `Promise`
Save project metadata.

**`Aether.deleteProject(name)`** → `Promise`
Delete project metadata.

**`Aether.getProjectFiles()`** → `string[]`
Get list of files in current project.
```javascript
const files = Aether.getProjectFiles();
```

**`Aether.addFileToProject(filename)`**
Add file to current project.

### UI Methods

**`Aether.toast(message, duration?)`**
Show notification. Duration in ms (default: 2000).
```javascript
Aether.toast("Done!", 3000);
```

**`Aether.prompt(message)`** → `Promise<string>`
Show input dialog.
```javascript
const name = await Aether.prompt("Enter name:");
```

**`Aether.confirm(message)`** → `Promise<boolean>`
Show confirmation dialog.
```javascript
if (await Aether.confirm("Delete?")) { ... }
```

### Theme Methods

**`Aether.getTheme()`** → `string`
Get current theme name.

**`Aether.setTheme(name)`**
Set theme: "mocha", "macchiato", "frappe", "latte".
```javascript
Aether.setTheme("frappe");
```

### Environment

**`Aether.getVersion()`** → `string`
Get Aether version.

---

## File Management

### Creating Files

**From Sidebar:**
1. Click **+** in OPFS section header
2. Enter filename with extension
3. File opens and is added to project

**From Command Palette:**
1. Press `F1`
2. Run "New File"
3. Enter filename

**From Script:**
```javascript
Aether.openFile("newfile.js", "// New file");
```

### Opening Files

- Click file in sidebar tree
- Use `Ctrl+O` → Open File command
- Click tab to switch between open files

### Saving Files

- `Ctrl+S` saves current file
- Files auto-save on changes
- OPFS files persist across sessions

### Deleting Files

- Click trash icon next to file in OPFS tree
- Or use script: `await Aether.deleteOPFSFile("file.js")`

### File Extensions

| Extension | Language | Executable |
|-----------|----------|------------|
| `.js` | JavaScript | Yes (preview) |
| `.html` | HTML | Yes (render) |
| `.md` | Markdown | Yes (render) |
| `.css` | CSS | No |
| `.json` | JSON | No |
| 70+ more | Various | Syntax only |

---

## Storage & Persistence

### Browser Storage (IndexedDB)

- Workspace files saved to IndexedDB
- Auto-saves on every change (debounced)
- Persists until browser data cleared

### OPFS (Origin Private File System)

Persistent storage for project files.

**Advantages:**
- Survives cache clearing
- Large quota (10% of disk space)
- Designed for web app storage

**How Projects Use OPFS:**
- Project metadata in `.aether-project.json`
- All project files stored in OPFS root
- Files listed in project appear in sidebar

### Clearing Data

**Individual files:** Click trash icon or `Aether.deleteOPFSFile()`

**All OPFS:** `await Aether.clearOPFS()`

**All data:** Browser DevTools → Application → Clear storage

---

## Themes & Customization

### Catppuccin Themes

**Mocha** (Default)
- Dark background `#1e1e2e`
- Warm, comfortable colors

**Macchiato**
- Dark gray `#24273a`
- Softer contrast

**Frappe**
- Cool dark `#303446`
- Blue-tinted palette

**Latte**
- Light `#eff1f5`
- High contrast for daytime

### Switching Themes

- Click color swatches in header
- Or Command Palette → "Theme: [name]"
- Or script: `Aether.setTheme("frappe")`

### Editor Settings

Configure via Ace Editor's built-in options:
- Font size (zoom with `Ctrl+=`/`Ctrl+-`)
- Word wrap
- Tab size
- Show/hide minimap

---

## Advanced Usage

### Auto-Run Scripts

Create `.aether.js` in your project. It runs automatically when the project opens.

```javascript
// .aether.js - runs on project open
Aether.toast("Project loaded!");
Aether.log("Ready to code");
```

### Fetch External Data

```javascript
const resp = await fetch("https://api.github.com/users/github");
const data = await resp.json();
Aether.log(JSON.stringify(data, null, 2));
```

### Generate Code

```javascript
let code = "// Generated\n";
for (let i = 0; i < 10; i++) {
  code += `console.log(${i});\n`;
}
Aether.openFile("generated.js", code);
```

### Batch File Operations

```javascript
// Create project structure
const files = {
  "index.html": "<!DOCTYPE html>...",
  "style.css": "body { margin: 0; }",
  "app.js": "console.log('Ready');"
};

for (const [name, content] of Object.entries(files)) {
  await Aether.saveOPFSFile(name, content);
  Aether.addFileToProject(name);
}
await Aether.saveProject();
```

### Debugging

- Console output in preview pane
- Errors show stack traces
- Use `console.time()` / `console.timeEnd()` for profiling
- `debugger;` opens browser DevTools

---

## Troubleshooting

### Code doesn't run
- Check browser console (F12) for errors
- Verify file extension is `.js` for JavaScript
- Preview pane must be visible

### Files disappearing
- Use OPFS for persistence (project files)
- Workspace files clear on browser data clear
- Export important files regularly

### OPFS not working
- Check browser supports OPFS (modern Chrome/Firefox/Safari)
- Try different browser
- Check for storage quota issues

### Preview not updating
- Toggle preview off/on
- Hard refresh (`Ctrl+Shift+R`)
- Check for JS syntax errors

### Keyboard shortcuts not working
- May conflict with browser shortcuts
- Try different browser
- Use Command Palette as alternative

### Storage quota exceeded
- Delete unused files
- Clear old projects
- Check quota in DevTools → Application

---

## Quick Reference

### Shortcuts
`F1` Palette | `Alt+N` New | `Ctrl+O` Open | `Ctrl+S` Save | `Alt+W` Close

### Project Bar
**New** — Create project | **Open** — Switch project | **Save** — Save project | **Close** — Close project

### Console
`Aether.log()` | `Aether.error()` | `Aether.warn()` | `Aether.clear()`

### OPFS
`listOPFSFiles()` | `readOPFSFile()` | `saveOPFSFile()` | `deleteOPFSFile()`

---

*Aether v3 - Ace Flux Edition*
