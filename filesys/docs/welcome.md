# Welcome to Aether

A powerful, minimal code editor for the web.

---

## What is Aether?

Aether is a lightweight, browser-based code editor designed for quick scripting, learning, and experimentation. Write and execute code instantly with live preview, organize work into projects with OPFS storage, and enjoy syntax highlighting for 70+ languages—all without leaving your browser.

---

## Quick Start

### 1. Create a Project

Open the OPFS section in the sidebar and click **New** to create your first project. Projects organize your files and persist across sessions.

### 2. Create a File

Click the **+** button in the OPFS section header to create a new file. The file is automatically added to your current project.

### 3. Write Code

Aether supports 70+ languages with syntax highlighting. Write JavaScript, TypeScript, Python, HTML, CSS, Go, Rust, and more.

### 4. Preview Your Work

Toggle the preview pane to see HTML/Markdown rendered, or execute JavaScript and view console output in real-time.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Projects** | Organize files into projects stored in browser OPFS |
| **70+ Languages** | Syntax highlighting for all major languages |
| **Live Preview** | Split or floating preview with console |
| **Templates** | Quick-start templates for common file types |
| **Themes** | 4 beautiful Catppuccin color schemes |
| **Scripting API** | Automate workflows with JavaScript |
| **Auto-Save** | Work persists automatically |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F1` | Command Palette |
| `Ctrl+O` | Open File |
| `Ctrl+S` | Save File |
| `Alt+N` | New File |
| `Alt+W` | Close Tab |
| `Ctrl+/` | Toggle Comment |
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `Alt+←` | Navigate Back |
| `Alt+→` | Navigate Forward |

---

## Projects

Projects are the core of Aether's file organization:

- **Create**: Click "New" in the OPFS project bar
- **Open**: Click the folder icon to switch projects  
- **Save**: Projects auto-save, or click "Save" to save explicitly
- **Close**: Click "Close" to close current project and tabs

Each project stores its file list in `.aether-project.json`. Files remain in OPFS even when you delete a project.

---

## Themes

Switch themes via the color swatches in the header or Command Palette:

- **Mocha** (dark) - Default comfortable theme
- **Macchiato** (dark gray) - Softer dark
- **Frappe** (cool dark) - Deep cool tones
- **Latte** (light) - Bright daytime theme

---

## Scripting

Automate Aether with JavaScript:

```javascript
// Show a notification
Aether.toast('Hello from Aether!');

// Create a new file
Aether.openFile('app.js', 'console.log("Hello!");');

// Work with OPFS
const files = await Aether.listOPFSFiles();
Aether.log('Files: ' + files.join(', '));
```

Run scripts via Command Palette → **Run Active Script**, or create `.aether.js` for auto-run on startup.

---

## Learn More

- **Command Palette** (`F1`) - Browse all available commands
- [Scripting Guide](scripting_guide.md) - Full API reference for scripting
- [Manual](manual.md) - Complete editor reference

---

*Aether v3 - Ace Flux Edition*
