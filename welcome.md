# Welcome to Aether

A powerful, minimal code editor for the web

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

## Pro Tips

- Split View: Click and drag the divider between Editor and Preview to resize
- Float Preview: Use Command Palette to toggle "Float Preview" mode
- Persistence: All changes are auto-saved to browser storage
- OPFS Storage: Use Aether API to persist files beyond session
- Markdown Support: Write and preview Markdown files with proper formatting

---

## Themes

Switch between four Catppuccin themes:

- Mocha (dark) - Default
- Macchiato (dark gray)
- Frappe (cool dark)
- Latte (light)

Use Command Palette to quickly change themes.

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

## Learn More

- Check SCRIPTING.md for advanced scripting
- See SCRIPT_QUICK_REF.md for quick reference
- Visit EXAMPLE_SCRIPTS.js for code samples

---

Happy coding!

Aether - Where ideas become code.
