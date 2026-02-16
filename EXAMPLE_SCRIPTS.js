/**
 * Example 1: Auto-startup Configuration
 * 
 * Save this as ".aether.js" in your OPFS to auto-run on startup.
 * Loads custom configuration and opens your default files.
 */

(async () => {
  try {
    // Load custom theme and font size from OPFS config
    const customConfig = await Aether.readOPFSFile('my-config.json');
    
    if (customConfig) {
      const cfg = JSON.parse(customConfig);
      Aether.setConfig('theme', cfg.theme || 'mocha');
      Aether.setConfig('fontSize', cfg.fontSize || 13);
      Aether.log('✓ Custom config loaded');
    }
    
    // Open default project files
    const readme = await Aether.readOPFSFile('README.md');
    if (readme) {
      Aether.openFile('README.md', readme);
    }
    
    Aether.toast('Workspace ready!');
  } catch (e) {
    Aether.warn('Init script: ' + e.message);
  }
})();

/**
 * Example 2: Generate HTML Boilerplate
 * 
 * Quickly scaffold a new HTML file with modern structure.
 */

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <h1>Welcome</h1>
  <p>Content goes here</p>
  <script>
    console.log('Page loaded');
  </script>
</body>
</html>`;

// Aether.newFile('index.html', htmlTemplate);
// Aether.toast('HTML boilerplate created');

/**
 * Example 3: Code Statistics
 * 
 * Analyze the currently open file and show stats.
 */

const analyzeCode = () => {
  const code = Aether.getEditorContent();
  const lines = code.split('\n').length;
  const words = code.split(/\s+/).length;
  const chars = code.length;
  
  const stats = `
File: ${Aether.getActiveBuffer().name}
Lines: ${lines}
Words: ${words}
Characters: ${chars}
Language: ${Aether.getEditorLanguage()}
  `.trim();
  
  Aether.log(stats);
  Aether.toast(`${lines} lines, ${words} words`);
};

// analyzeCode();

/**
 * Example 4: Duplicate & Modify Content
 * 
 * Duplicate current file with a modified name and content.
 */

const duplicateWithPrefix = (prefix = 'copy-') => {
  const buf = Aether.getActiveBuffer();
  if (!buf) return Aether.toast('No active buffer');
  
  const newName = prefix + buf.name;
  const newContent = buf.content + '\n// Duplicated from ' + buf.name;
  
  Aether.openFile(newName, newContent);
  Aether.toast(`Created: ${newName}`);
};

// duplicateWithPrefix('v2-');

/**
 * Example 5: Format & Save All OPFS Files
 * 
 * Process all JavaScript files in OPFS and save formatted versions.
 */

const formatAllJS = async () => {
  try {
    const files = await Aether.listOPFSFiles();
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      Aether.toast('No .js files found');
      return;
    }
    
    for (const file of jsFiles) {
      const content = await Aether.readOPFSFile(file);
      // Simple formatting: remove extra whitespace
      const formatted = content
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n');
      
      await Aether.saveOPFSFile(file, formatted);
      Aether.log('✓ ' + file);
    }
    
    Aether.toast(`Formatted ${jsFiles.length} files`);
  } catch (e) {
    Aether.error('Format failed: ' + e.message);
  }
};

// formatAllJS();

/**
 * Example 6: Interactive File Picker
 * 
 * List all files in OPFS and display their sizes.
 */

const listOPFSWithStats = async () => {
  try {
    const files = await Aether.listOPFSFiles();
    
    if (files.length === 0) {
      Aether.toast('OPFS is empty');
      return;
    }
    
    let report = '# OPFS Files\n\n';
    let totalSize = 0;
    
    for (const file of files) {
      const content = await Aether.readOPFSFile(file);
      const size = content ? content.length : 0;
      totalSize += size;
      const sizeKB = (size / 1024).toFixed(2);
      report += `- **${file}** (${sizeKB} KB)\n`;
    }
    
    report += `\nTotal: ${(totalSize / 1024).toFixed(2)} KB`;
    
    Aether.openFile('_opfs-report.md', report);
    Aether.toast('Listed ' + files.length + ' files');
  } catch (e) {
    Aether.error('List failed: ' + e.message);
  }
};

// listOPFSWithStats();

/**
 * Example 7: Code Template Generator
 * 
 * Generate a new JavaScript class boilerplate.
 */

const generateClass = () => {
  const className = 'MyClass'; // Could be prompt
  
  const template = `class ${className} {
  constructor() {
    // Initialize
  }
  
  method() {
    return 'Hello from ' + this.constructor.name;
  }
  
  static create() {
    return new ${className}();
  }
}

module.exports = ${className};
`;
  
  Aether.newFile(`${className}.js`, template);
  Aether.setCursorPosition(0, 6); // Position at class name
  Aether.toast('Class template created');
};

// generateClass();

/**
 * Example 8: Syntax Reference Lookup
 * 
 * Store common code snippets and insert them on demand.
 */

const snippets = {
  'arrow-func': '() => { }',
  'promise': 'new Promise((resolve, reject) => { })',
  'async': 'async () => { }',
  'try-catch': 'try { } catch (e) { }',
};

const insertSnippet = (key) => {
  const snippet = snippets[key];
  if (snippet) {
    Aether.insertText(snippet);
    Aether.toast('Inserted: ' + key);
  } else {
    Aether.warn('Snippet not found: ' + key);
  }
};

// insertSnippet('arrow-func');

/**
 * Example 9: Save Session State
 * 
 * Backup current open files to OPFS.
 */

const backupSession = async () => {
  try {
    const buffers = Aether.getAllBuffers();
    const session = {
      timestamp: new Date().toISOString(),
      files: buffers.map(b => ({
        name: b.name,
        content: b.content.substring(0, 100000), // Limit per file
      })),
    };
    
    await Aether.saveOPFSFile('.session-backup.json', JSON.stringify(session, null, 2));
    Aether.toast(`Backed up ${buffers.length} files`);
  } catch (e) {
    Aether.error('Backup failed: ' + e.message);
  }
};

// backupSession();

/**
 * Example 10: Dark Mode Toggle Script
 * 
 * Quick theme switcher between light and dark themes.
 */

const toggleDarkMode = () => {
  const currentTheme = Aether.getConfig().theme;
  const darkThemes = ['mocha', 'macchiato', 'frappe'];
  const nextTheme = darkThemes.includes(currentTheme) ? 'latte' : 'mocha';
  
  Aether.updateTheme(nextTheme);
  Aether.toast('Theme: ' + nextTheme);
};

// toggleDarkMode();
