# Aether Script API - Quick Reference

## Global Object: `Aether`

### Buffer Operations
```javascript
Aether.newFile(name, content)                    // Create new buffer
Aether.openFile(name, content)                   // Open/switch buffer
Aether.getActiveBuffer()                         // Get current buffer
Aether.getBuffer(id)                             // Get buffer by ID
Aether.getAllBuffers()                           // Get all buffers
Aether.setActiveBuffer(id)                       // Switch to buffer
Aether.closeBuffer(id)                           // Close buffer
```

### Editor Content
```javascript
Aether.getEditorContent()                        // Get text
Aether.setEditorContent(text)                    // Set text
Aether.getEditorLanguage()                       // Get file extension
Aether.getCursorPosition()                       // Get {row, column}
Aether.setCursorPosition(row, col)               // Move cursor
Aether.getSelectedText()                         // Get selection
Aether.insertText(text)                          // Insert at cursor
```

### Configuration
```javascript
Aether.getConfig()                               // Get all settings
Aether.setConfig(key, value)                     // Change setting
Aether.updateTheme(name)                         // Set theme
Aether.updateZoom(delta)                         // Adjust font size
```

### UI & Logging
```javascript
Aether.toast(msg, duration)                      // Show notification
Aether.log(msg)                                  // Log to console
Aether.warn(msg)                                 // Log warning
Aether.error(msg)                                // Log error
```

### OPFS (Async/await required)
```javascript
await Aether.listOPFSFiles()                     // List files
await Aether.readOPFSFile(filename)              // Read file
await Aether.saveOPFSFile(filename, content)     // Save file
await Aether.deleteOPFSFile(filename)            // Delete file
```

## Special Files

- `.aether.js` - Auto-runs on startup
- `.aether.json` - Config defaults loaded on startup

## Themes
`'mocha'` | `'macchiato'` | `'frappe'` | `'latte'`

## Example: Hello World Script
```javascript
// Create new file
Aether.newFile('test.js', 'console.log("Hello!");');

// Show notification
Aether.toast('Created test.js');
```

## Example: Async Operations
```javascript
(async () => {
  // List all files
  const files = await Aether.listOPFSFiles();
  
  // Read first file
  if (files.length > 0) {
    const content = await Aether.readOPFSFile(files[0]);
    Aether.log('First file: ' + content.substring(0, 50));
  }
})();
```

See `SCRIPTING.md` for full documentation!
