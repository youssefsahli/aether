# Welcome to Aether

A powerful, minimal code editor for the web

---

## What is Aether?

Aether is a lightweight, browser-based code editor designed for quick scripting, learning, and experimentation. Write and execute code instantly with preview, access local storage via OPFS, and switch between multiple languages—all without leaving your browser. Whether you're a developer testing ideas or a student learning to code, Aether provides a frictionless environment for writing and running code.

---

## Quick Navigation

- `Ctrl+P` - Open Command Palette
- `Ctrl+O` - Open File
- `Ctrl+S` - Save Buffer
- `Ctrl+N` - New File
- `Ctrl+/` - Toggle Comment
- `Ctrl+F` - Find
- `Ctrl+H` - Find & Replace

---

## Core Features

- **Code Execution** - Write and run JavaScript, Python, HTML, CSS, Markdown, or Pascal instantly
- **Live Preview** - See output in real-time with split view or floating preview pane
- **OPFS Storage** - Persist files beyond your session using browser storage
- **Multiple Themes** - Choose from 4 beautiful Catppuccin color schemes
- **Auto-Save** - Your work is automatically saved to browser storage

---

## Getting Started

### Create Your First File

Open the Command Palette (`Ctrl+P`) and search for "New File" to create a new buffer. You can write JavaScript, Python, HTML, CSS, Markdown, or Pascal.

### Run Your Code

Write JavaScript and open the Preview pane to see it execute in real-time. Use the Aether API for extended functionality:

```javascript
// Log to console
Aether.log("Hello, World!");

// Create new file from script
Aether.openFile("generated.js", "console.log('Hello from Aether!');");

// Show notification
Aether.toast("Script completed!");

// Save to OPFS
await Aether.saveOPFSFile("mydata.json", JSON.stringify({x: 42}));
```

### API Reference

Open Command Palette and search for "API Reference" to see all available functions.

---

## Themes

Switch between four beautiful Catppuccin themes using the Command Palette:

- **Mocha** (dark) - Default, comfortable for extended use
- **Macchiato** (dark gray) - Softer dark theme
- **Frappe** (cool dark) - Deep, cool tones
- **Latte** (light) - Bright, light theme for daytime coding

---

## Example Scripts

### Fetch Data

```javascript
const response = await fetch("https://api.github.com/users/github");
const data = await response.json();
Aether.log(JSON.stringify(data, null, 2));
```

### Generate Code

```javascript
let code = "// Generated code\n";
for (let i = 0; i < 5; i++) {
  code += `console.log("Line ${i}");\n`;
}
Aether.openFile("generated.js", code);
```

### Work with OPFS

```javascript
// List all stored files
const files = await Aether.listOPFSFiles();
Aether.log("Files: " + files.join(", "));

// Save a file
await Aether.saveOPFSFile("data.txt", "Important data");

// Read a file
const content = await Aether.readOPFSFile("data.txt");
Aether.log(content);
```

---

## Configuration

Access advanced settings via Command Palette:

- Font size and zoom
- Editor behavior
- Console settings
- UI preferences

---

## Resources & Documentation

- **[Technical Manual](manual.md)** - Comprehensive guide to all features and advanced usage
- **[Scripting Guide](SCRIPTING.md)** - Deep dive into advanced scripting techniques
- **[Quick Reference](SCRIPT_QUICK_REF.md)** - Handy reference for common tasks
- **[Example Scripts](EXAMPLE_SCRIPTS.js)** - Copy and modify ready-to-use code examples

---

## Tips & Tricks

### Workspace Management
- Split View: Click and drag the divider between Editor and Preview to resize
- Float Preview: Use Command Palette to toggle "Float Preview" mode
- Multiple Files: Keep multiple files open and switch between them quickly

### Data & Persistence
- Persistence: All changes are auto-saved to browser storage
- OPFS Storage: Use Aether API to persist files beyond your session
- Export: Save your work locally at any time

### Writing Code
- Markdown Support: Write and preview Markdown files with proper formatting
- Multi-language: Support for JavaScript, Python, HTML, CSS, Markdown, Pascal
- Comments: Use `Ctrl+/` to toggle comments on selected lines

---

## Keyboard Shortcuts

### Navigation & Files
- `Ctrl+P` - Open Command Palette
- `Ctrl+O` - Open File
- `Ctrl+N` - New File

### Editing
- `Ctrl+S` - Save Buffer
- `Ctrl+/` - Toggle Comment
- `Ctrl+F` - Find
- `Ctrl+H` - Find & Replace

---

Happy coding!

Aether - Where ideas become code.
