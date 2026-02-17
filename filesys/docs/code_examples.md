# Code Examples & Use Cases

Real-world examples and patterns for using the Aether Scripting API.

---

## Basic Examples

### Hello World Script
```javascript
// Create a simple notification
Aether.toast('Hello from Aether!');
Aether.log('Script executed successfully');
```

### List All Open Files
```javascript
const buffers = Aether.getAllBuffers();
Aether.log('Currently open files:');
buffers.forEach((buf, index) => {
  Aether.log((index + 1) + '. ' + buf.name);
});
```

### Create a New File with Template
```javascript
const jsTemplate = `// JavaScript Template
function main() {
  console.log('Hello, World!');
}

main();`;

Aether.newFile('app.js', jsTemplate);
Aether.toast('Template created!');
```

---

## File & Buffer Operations

### Switch Between Files
```javascript
(async () => {
  const buffers = Aether.getAllBuffers();
  
  if (buffers.length > 1) {
    // Get the second file
    const targetId = buffers[1].id;
    Aether.setActiveBuffer(targetId);
    Aether.toast('Switched to: ' + buffers[1].name);
  } else {
    Aether.warn('Need at least 2 files open');
  }
})();
```

### Close All Buffers Except Current
```javascript
const buffers = Aether.getAllBuffers();
const activeId = Aether.getActiveBuffer().id;

buffers.forEach(buf => {
  if (buf.id !== activeId) {
    Aether.closeBuffer(buf.id);
    Aether.log('Closed: ' + buf.name);
  }
});
```

### Duplicate Current File
```javascript
const current = Aether.getActiveBuffer();
const newName = current.name.replace(/\.\w+$/, '_copy$&');

Aether.newFile(newName, current.content);
Aether.toast('File duplicated: ' + newName);
```

---

## Text Manipulation

### Count Lines and Characters
```javascript
const content = Aether.getEditorContent();
const lines = content.split('\n').length;
const chars = content.length;
const words = content.split(/\s+/).length;

Aether.log('Lines: ' + lines);
Aether.log('Characters: ' + chars);
Aether.log('Words: ' + words);

Aether.toast(lines + ' lines | ' + chars + ' chars');
```

### Convert Selection to Uppercase
```javascript
const selected = Aether.getSelectedText();
if (selected) {
  // Get cursor position before selection
  const pos = Aether.getCursorPosition();
  
  // Would need to find and replace the selection
  // This is a simplified example
  Aether.log('Selected text: ' + selected);
  Aether.log('Uppercase: ' + selected.toUpperCase());
}
```

### Insert Code Comments
```javascript
// Add comment at cursor
Aether.insertText('// TODO: Complete this function\n');

// Block comment
const comment = `/*
 * Multi-line comment
 * can be easily inserted
 */\n`;
Aether.insertText(comment);
```

### Add Line Numbers to Selected Content
```javascript
const selected = Aether.getSelectedText();
if (selected) {
  const lines = selected.split('\n');
  const numbered = lines.map((line, i) => 
    (i + 1) + '. ' + line
  ).join('\n');
  
  Aether.log('Numbered:\n' + numbered);
}
```

---

## Configuration & Customization

### Auto-Configure on Startup

Create a `.aether.js` file to set up your preferences:

```javascript
// .aether.js - Runs automatically on startup
(async () => {
  try {
    // Load saved preferences
    const prefs = await Aether.readOPFSFile('my-prefs.json');
    
    if (prefs) {
      const settings = JSON.parse(prefs);
      
      // Apply settings
      Aether.updateTheme(settings.theme);
      Aether.setConfig('fontSize', settings.fontSize);
      Aether.setConfig('wordWrap', settings.wordWrap);
      
      Aether.log('Preferences loaded: ' + settings.theme);
    }
  } catch (error) {
    Aether.error('Startup config failed: ' + error.message);
  }
})();
```

### Create a Settings Script

```javascript
// save-preferences.js
(async () => {
  const cfg = Aether.getConfig();
  
  const prefs = {
    theme: cfg.theme,
    fontSize: cfg.fontSize,
    wordWrap: cfg.wordWrap,
    savedAt: new Date().toISOString()
  };
  
  await Aether.saveOPFSFile('my-prefs.json', 
    JSON.stringify(prefs, null, 2)
  );
  
  Aether.toast('Preferences saved!');
})();
```

### Cycle Through Themes

```javascript
const themes = ['mocha', 'macchiato', 'frappe', 'latte'];
const current = Aether.getConfig().theme;

const currentIndex = themes.indexOf(current);
const nextIndex = (currentIndex + 1) % themes.length;
const nextTheme = themes[nextIndex];

Aether.updateTheme(nextTheme);
Aether.toast('Theme: ' + nextTheme);
```

---

## Data Persistence with OPFS

### Save File Content to OPFS

```javascript
(async () => {
  try {
    const buf = Aether.getActiveBuffer();
    const content = Aether.getEditorContent();
    
    const filename = 'backup_' + buf.name;
    await Aether.saveOPFSFile(filename, content);
    
    Aether.toast('Backup saved: ' + filename);
  } catch (error) {
    Aether.error('Backup failed: ' + error.message);
  }
})();
```

### Create a Session Log

```javascript
(async () => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      activeFile: Aether.getActiveBuffer().name,
      totalBuffers: Aether.getAllBuffers().length,
      theme: Aether.getConfig().theme
    };
    
    let log = [];
    const existing = await Aether.readOPFSFile('session.log.json');
    if (existing) {
      log = JSON.parse(existing);
    }
    
    log.push(logEntry);
    
    // Keep only last 100 entries
    if (log.length > 100) {
      log = log.slice(-100);
    }
    
    await Aether.saveOPFSFile('session.log.json', 
      JSON.stringify(log, null, 2)
    );
    
    Aether.log('Session logged');
  } catch (error) {
    Aether.error('Logging failed: ' + error.message);
  }
})();
```

### Manage a Persistent Todo List

```javascript
// read-todos.js - Load todos from storage
(async () => {
  const todos = await Aether.readOPFSFile('todos.json');
  if (todos) {
    const items = JSON.parse(todos);
    Aether.log('Todos (' + items.length + '):');
    items.forEach((todo, i) => {
      const status = todo.done ? '✓' : '○';
      Aether.log(status + ' ' + (i + 1) + '. ' + todo.text);
    });
  } else {
    Aether.log('No todos found');
  }
})();
```

```javascript
// add-todo.js - Add a new todo
(async () => {
  const todos = await Aether.readOPFSFile('todos.json') || '[]';
  const items = JSON.parse(todos);
  
  items.push({
    text: 'New task here',
    done: false,
    createdAt: new Date().toISOString()
  });
  
  await Aether.saveOPFSFile('todos.json', 
    JSON.stringify(items, null, 2)
  );
  
  Aether.toast('Todo added! (' + items.length + ' total)');
})();
```

---

## Analysis & Reporting Scripts

### Analyze Code Statistics

```javascript
const content = Aether.getEditorContent();
const lang = Aether.getEditorLanguage();

const lines = content.split('\n');
const nonBlankLines = lines.filter(l => l.trim()).length;
const commentLines = lines.filter(l => l.trim().startsWith('//')).length;

const stats = {
  language: lang,
  totalLines: lines.length,
  nonBlankLines: nonBlankLines,
  commentLines: commentLines,
  codeLines: nonBlankLines - commentLines,
  averageLineLength: Math.round(content.length / lines.length)
};

Aether.log('Code Statistics:');
Object.entries(stats).forEach(([key, value]) => {
  Aether.log(key + ': ' + value);
});
```

### Find TODO Comments

```javascript
const content = Aether.getEditorContent();
const lines = content.split('\n');

const todos = [];
lines.forEach((line, index) => {
  if (line.includes('TODO') || line.includes('FIXME')) {
    todos.push({
      line: index + 1,
      text: line.trim()
    });
  }
});

if (todos.length > 0) {
  Aether.log('Found ' + todos.length + ' TODOs:');
  todos.forEach(todo => {
    Aether.log('Line ' + todo.line + ': ' + todo.text);
  });
} else {
  Aether.log('No TODOs found');
}
```

### Generate File Report

```javascript
(async () => {
  const buffers = Aether.getAllBuffers();
  const report = {
    generated: new Date().toISOString(),
    totalFiles: buffers.length,
    files: buffers.map(b => ({
      name: b.name,
      size: b.content.length,
      lines: b.content.split('\n').length
    }))
  };
  
  await Aether.saveOPFSFile('file-report.json', 
    JSON.stringify(report, null, 2)
  );
  
  Aether.toast('Report saved');
})();
```

---

## Batch Processing

### Process All JavaScript Files

```javascript
(async () => {
  const buffers = Aether.getAllBuffers();
  const jsFiles = buffers.filter(b => b.name.endsWith('.js'));
  
  Aether.log('Found ' + jsFiles.length + ' JavaScript files');
  
  jsFiles.forEach(buf => {
    const content = buf.content;
    const funcCount = (content.match(/function /g) || []).length;
    Aether.log(buf.name + ': ' + funcCount + ' functions');
  });
})();
```

### Export All Buffers to OPFS

```javascript
(async () => {
  const buffers = Aether.getAllBuffers();
  const timestamp = new Date().toISOString().split('T')[0];
  
  for (const buf of buffers) {
    const filename = 'export_' + timestamp + '_' + buf.name;
    await Aether.saveOPFSFile(filename, buf.content);
    Aether.log('Exported: ' + filename);
  }
  
  Aether.toast('Exported ' + buffers.length + ' files');
})();
```

---

## Advanced Patterns

### Markdown File Navigation

When viewing markdown files in preview mode, you can create links between files:

```markdown
[Click to open](other-file.md)
[View Manual](manual.md)
[See Script Guide](scripting_guide.md)
```

The editor automatically detects relative file paths and allows opening them.

### Create a Workspace Template

```javascript
// workspace-template.js - Initialize a new project workspace
(async () => {
  // Create directory structure via file naming
  const files = {
    'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>My Project</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
    
    'style.css': `body {
  font-family: sans-serif;
  margin: 20px;
}`,
    
    'script.js': `console.log('Loaded');`,
    
    'readme.md': `# My Project\n\nProject description here.`
  };
  
  // Create all files
  Object.entries(files).forEach(([name, content]) => {
    Aether.newFile(name, content);
  });
  
  Aether.toast('Workspace created with ' + Object.keys(files).length + ' files');
})();
```

### Interactive File Selector

```javascript
// file-selector.js
const buffers = Aether.getAllBuffers();

if (buffers.length === 0) {
  Aether.warn('No files open');
} else {
  Aether.log('Files available:');
  buffers.forEach((buf, i) => {
    const symbol = buf.id === Aether.getActiveBuffer().id ? '▶' : ' ';
    Aether.log(symbol + ' ' + (i + 1) + '. ' + buf.name);
  });
  
  // Create reference file with file list
  const list = buffers
    .map((b, i) => (i + 1) + '. ' + b.name)
    .join('\n');
  
  Aether.newFile('_file_list.txt', list);
  Aether.log('Created: _file_list.txt');
}
```

---

## Tips & Tricks

### Avoid Nested Async Calls
```javascript
// ❌ Bad - unnecessary nesting
(async () => {
  (async () => {
    const files = await Aether.listOPFSFiles();
  })();
})();

// ✅ Good - single async context
(async () => {
  const files = await Aether.listOPFSFiles();
})();
```

### Chain Multiple Operations
```javascript
// ✅ Good - sequential operations
(async () => {
  const files = await Aether.listOPFSFiles();
  for (const file of files) {
    const content = await Aether.readOPFSFile(file);
    // Process content
  }
})();
```

### Graceful Degradation
```javascript
// Always check for file existence
(async () => {
  const files = await Aether.listOPFSFiles();
  
  if (!files.includes('config.json')) {
    Aether.log('Using default config');
    return;
  }
  
  const config = await Aether.readOPFSFile('config.json');
  // Use config
})();
```

### Performance Optimization
```javascript
// For large files, work with segments
const content = Aether.getEditorContent();
const lines = content.split('\n');

// Process in chunks to avoid blocking
const chunkSize = 100;
for (let i = 0; i < lines.length; i += chunkSize) {
  const chunk = lines.slice(i, i + chunkSize);
  // Process chunk
}
```

---

## Workflow Automation

### Auto-Save to OPFS on File Change
```javascript
// auto-saver.js - Run periodically
let lastContent = Aether.getEditorContent();
let autoSaveEnabled = true;

async function autoSave() {
  const current = Aether.getEditorContent();
  
  if (current !== lastContent && autoSaveEnabled) {
    const buf = Aether.getActiveBuffer();
    const timestamp = new Date().toLocaleTimeString();
    
    await Aether.saveOPFSFile(
      'autosave_' + buf.name,
      current
    );
    
    lastContent = current;
    Aether.log('Auto-saved: ' + timestamp);
  }
}

// Start auto-save every 30 seconds
const intervalId = setInterval(autoSave, 30000);
Aether.toast('Auto-save enabled');
```

### Multi-File Find and Replace
```javascript
// find-replace-all.js
(async () => {
  const searchTerm = 'TODO';
  const replaceTerm = 'FIXME';
  
  const buffers = Aether.getAllBuffers();
  let totalReplaced = 0;
  
  for (const buf of buffers) {
    if (buf.name.endsWith('.js') || buf.name.endsWith('.md')) {
      const original = buf.content;
      const updated = original.replaceAll(searchTerm, replaceTerm);
      
      if (original !== updated) {
        const count = (updated.match(/FIXME/g) || []).length;
        totalReplaced += count;
        Aether.log(buf.name + ': ' + count + ' replacements');
      }
    }
  }
  
  Aether.toast('Total: ' + totalReplaced + ' replacements');
})();
```

### Code Quality Check
```javascript
// code-quality-check.js
(async () => {
  const content = Aether.getEditorContent();
  const issues = [];
  
  // Check for console.log
  if (content.includes('console.log')) {
    issues.push('Contains console.log statements');
  }
  
  // Check for debugger
  if (content.includes('debugger')) {
    issues.push('Contains debugger statement');
  }
  
  // Check for TODO
  const todos = (content.match(/\/\/\s*TODO/g) || []).length;
  if (todos > 0) {
    issues.push(todos + ' TODO comments found');
  }
  
  // Check for trailing spaces
  const trailingSpaces = (content.match(/\s+\n/g) || []).length;
  if (trailingSpaces > 0) {
    issues.push(trailingSpaces + ' lines with trailing spaces');
  }
  
  if (issues.length === 0) {
    Aether.toast('✓ No quality issues found');
  } else {
    Aether.log('Quality issues:');
    issues.forEach(issue => Aether.log('  • ' + issue));
  }
})();
```

---

## Data Management & Analytics

### Import JSON Data into File
```javascript
// import-json-as-file.js
(async () => {
  const rawData = await Aether.readOPFSFile('data.json');
  if (!rawData) {
    Aether.warn('data.json not found');
    return;
  }
  
  const data = JSON.parse(rawData);
  
  // Create a formatted view
  const formatted = Object.entries(data)
    .map(([key, value]) => key + ': ' + JSON.stringify(value))
    .join('\n');
  
  Aether.newFile('data-view.txt', formatted);
  Aether.toast('Data imported');
})();
```

### Generate CSV from Data
```javascript
// generate-csv.js
function arrayToCSV(records) {
  if (records.length === 0) return '';
  
  // Get headers from first record
  const headers = Object.keys(records[0]);
  const headerRow = headers.join(',');
  
  // Convert records to CSV rows
  const rows = records.map(record => {
    return headers.map(header => {
      const value = record[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return '"' + value + '"';
      }
      return value;
    }).join(',');
  });
  
  return headerRow + '\n' + rows.join('\n');
}

// Usage
(async () => {
  const records = [
    { name: 'Alice', age: 30, city: 'New York' },
    { name: 'Bob', age: 25, city: 'Los Angeles' },
    { name: 'Charlie', age: 35, city: 'Chicago' }
  ];
  
  const csv = arrayToCSV(records);
  Aether.newFile('export.csv', csv);
  Aether.toast('CSV generated');
})();
```

### Data Migration Script
```javascript
// migrate-data.js - Transform data structure
(async () => {
  const oldData = await Aether.readOPFSFile('old-format.json');
  if (!oldData) {
    Aether.warn('No old data found');
    return;
  }
  
  const old = JSON.parse(oldData);
  
  // Transform to new format
  const newData = {
    version: 2,
    migrated: new Date().toISOString(),
    users: old.users.map(user => ({
      id: user._id || Math.random().toString(36),
      name: user.fullName || user.name,
      email: user.mail || user.email,
      active: user.status === 'active'
    }))
  };
  
  await Aether.saveOPFSFile('new-format.json',
    JSON.stringify(newData, null, 2)
  );
  
  Aether.toast('Migration complete: ' + newData.users.length + ' users');
})();
```

---

## Code Generation

### Generate Boilerplate Components
```javascript
// generate-react-component.js
(async () => {
  const componentName = 'MyComponent';
  
  const component = `import React from 'react';
import './${componentName}.css';

export default function ${componentName}({ children, ...props }) {
  return (
    <div className="${componentName}" {...props}>
      {children}
    </div>
  );
}

${componentName}.defaultProps = {
  children: null
};
`;
  
  const styles = `.${componentName} {\n  /* Component styles */\n}`;
  
  const tests = `import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    const component = <${componentName} />;
    // Test code here
  });
});
`;
  
  Aether.newFile(componentName + '.js', component);
  Aether.newFile(componentName + '.css', styles);
  Aether.newFile(componentName + '.test.js', tests);
  
  Aether.toast('Component generated: ' + componentName);
})();
```

### Generate Documentation from Code
```javascript
// generate-function-docs.js
function extractFunctions(code) {
  const pattern = /function (\w+)\((.*?)\)/g;
  const functions = [];
  let match;
  
  while ((match = pattern.exec(code)) !== null) {
    functions.push({
      name: match[1],
      params: match[2].split(',').map(p => p.trim()).filter(p => p)
    });
  }
  
  return functions;
}

(async () => {
  const code = Aether.getEditorContent();
  const functions = extractFunctions(code);
  
  const docs = functions
    .map(fn => `- **${fn.name}**(\`${fn.params.join('`, `')}\`)`)
    .join('\n');
  
  const markdown = `# Functions\n\n${docs}`;
  
  Aether.newFile('FUNCTIONS.md', markdown);
  Aether.toast('Documentation generated');
})();
```

---

## Testing & Validation

### Simple Unit Test Framework
```javascript
// test-framework.js
const Test = {
  passed: 0,
  failed: 0,
  
  describe(name, fn) {
    Aether.log('\n📋 ' + name);
    fn();
  },
  
  it(desc, fn) {
    try {
      fn();
      this.passed++;
      Aether.log('  ✓ ' + desc);
    } catch (error) {
      this.failed++;
      Aether.log('  ✗ ' + desc);
      Aether.log('    ' + error.message);
    }
  },
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  },
  
  summary() {
    const total = this.passed + this.failed;
    const status = this.failed === 0 ? '✓ PASS' : '✗ FAIL';
    Aether.log('\n' + status + ': ' + this.passed + '/' + total + ' tests');
  }
};

// Usage
(async () => {
  Test.describe('String Utils', () => {
    Test.it('uppercase conversion', () => {
      Test.assert('hello'.toUpperCase() === 'HELLO');
    });
    
    Test.it('reverse string', () => {
      const rev = 'abc'.split('').reverse().join('');
      Test.assert(rev === 'cba');
    });
  });
  
  Test.summary();
})();
```

### Validation Schema
```javascript
// validator.js
const Validator = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value) => /^https?:\/\//.test(value),
  number: (value) => !isNaN(parseFloat(value)),
  minLength: (value, min) => value.length >= min,
  maxLength: (value, max) => value.length <= max,
  required: (value) => value !== null && value !== '' && value !== undefined
};

// Usage
(async () => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
    age: 30
  };
  
  const errors = [];
  
  if (!Validator.required(user.name)) errors.push('Name is required');
  if (!Validator.email(user.email)) errors.push('Invalid email');
  if (!Validator.number(user.age)) errors.push('Age must be a number');
  
  if (errors.length === 0) {
    Aether.log('✓ Validation passed');
  } else {
    Aether.log('✗ Validation errors:');
    errors.forEach(e => Aether.log('  • ' + e));
  }
})();
```

---

## Real-world Workflows

### Markdown Link Validator
```javascript
// validate-markdown-links.js
(async () => {
  const content = Aether.getEditorContent();
  const lang = Aether.getEditorLanguage();
  
  if (lang !== 'md') {
    Aether.warn('Not a markdown file');
    return;
  }
  
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const files = await Aether.listOPFSFiles();
  let match;
  const issues = [];
  
  while ((match = linkPattern.exec(content)) !== null) {
    const [, text, href] = match;
    
    // Check if it's an internal link
    if (!href.startsWith('http') && !href.startsWith('www')) {
      // It's an internal link - check if file exists
      if (!files.includes(href)) {
        issues.push('Missing: ' + href);
      }
    }
  }
  
  if (issues.length === 0) {
    Aether.toast('✓ All links valid');
  } else {
    Aether.log('Link issues:');
    issues.forEach(issue => Aether.log('  ✗ ' + issue));
  }
})();
```

### Project Structure Generator
```javascript
// generate-project.js
(async () => {
  const projectName = 'my-project';
  
  const structure = {
    'README.md': `# ${projectName}\n\nProject description.`,
    'src/index.js': 'export default {};',
    'src/utils.js': 'export function helper() {}',
    'test/index.test.js': 'describe("tests", () => {});',
    'docs/guide.md': '# Getting Started\n\n...',
    '.gitignore': 'node_modules\n.env',
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      main: 'src/index.js'
    }, null, 2)
  };
  
  // Create directory structure via file names
  for (const [path, content] of Object.entries(structure)) {
    // For simplicity, just create at root
    const filename = path.replace('/', '_');
    Aether.newFile(filename, content);
  }
  
  Aether.toast('Project structure created');
})();
```

### Configuration Manager
```javascript
// config-manager.js
(async () => {
  const ConfigManager = {
    defaults: {
      theme: 'mocha',
      fontSize: 13,
      autoSave: true,
      autoSaveInterval: 30000
    },
    
    async load() {
      const stored = await Aether.readOPFSFile('config.json');
      if (!stored) return this.defaults;
      try {
        return JSON.parse(stored);
      } catch {
        return this.defaults;
      }
    },
    
    async save(config) {
      await Aether.saveOPFSFile('config.json',
        JSON.stringify(config, null, 2)
      );
    },
    
    async reset() {
      await Aether.saveOPFSFile('config.json',
        JSON.stringify(this.defaults, null, 2)
      );
    }
  };
  
  const config = await ConfigManager.load();
  Aether.log('Loaded config: ' + JSON.stringify(config));
})();
```

---

## Performance & Monitoring

### Script Execution Profiler
```javascript
// profiler.js
class Profiler {
  constructor() {
    this.marks = {};
  }
  
  start(label) {
    this.marks[label] = Date.now();
  }
  
  end(label) {
    const duration = Date.now() - (this.marks[label] || Date.now());
    Aether.log(label + ': ' + duration + 'ms');
    return duration;
  }
  
  report() {
    Object.entries(this.marks).forEach(([label]) => {
      this.end(label);
    });
  }
}

// Usage
(async () => {
  const profiler = new Profiler();
  
  profiler.start('file-list');
  const files = await Aether.listOPFSFiles();
  profiler.end('file-list');
  
  profiler.start('read-files');
  for (const f of files) {
    await Aether.readOPFSFile(f);
  }
  profiler.end('read-files');
})();
```

### Memory Usage Estimator
```javascript
// memory-monitor.js
function estimateSize(obj) {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}

(async () => {
  const buffers = Aether.getAllBuffers();
  let totalSize = 0;
  
  buffers.forEach(buf => {
    const size = estimateSize(buf);
    totalSize += size;
    Aether.log(buf.name + ': ' + (size / 1024).toFixed(2) + ' KB');
  });
  
  Aether.log('Total: ' + (totalSize / 1024).toFixed(2) + ' KB');
})();
```

---

## Debugging & Development

### Interactive Debugger
```javascript
// interactive-debug.js
const Debugger = {
  breakpoints: {},
  
  addBreakpoint(label, condition) {
    this.breakpoints[label] = condition;
  },
  
  check(label, data) {
    if (this.breakpoints[label] && this.breakpoints[label](data)) {
      Aether.log('🔴 BREAKPOINT: ' + label);
      Aether.log(JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  }
};

// Usage
(async () => {
  Debugger.addBreakpoint('large-file', 
    (data) => data.size > 100000
  );
  
  const files = await Aether.listOPFSFiles();
  
  for (const file of files) {
    const content = await Aether.readOPFSFile(file);
    const size = content.length;
    
    Debugger.check('large-file', { file, size });
  }
})();
```

### State Inspector
```javascript
// state-inspector.js
(async () => {
  let stateHistory = [];
  
  function captureState() {
    const state = {
      timestamp: new Date().toISOString(),
      activeBuffer: Aether.getActiveBuffer().name,
      bufferCount: Aether.getAllBuffers().length,
      config: Aether.getConfig()
    };
    
    stateHistory.push(state);
    return state;
  }
  
  // Capture initial state
  captureState();
  
  // Simulate some changes
  await new Promise(r => setTimeout(r, 1000));
  
  // Capture final state
  captureState();
  
  // Compare
  Aether.log('State changes:');
  Aether.log(JSON.stringify(stateHistory, null, 2));
})();
```

---

## Chaining & Composition

### Build Script Chains
```javascript
// script-chain.js
class ScriptChain {
  constructor() {
    this.operations = [];
  }
  
  add(name, fn) {
    this.operations.push({ name, fn });
    return this;
  }
  
  async execute() {
    for (const { name, fn } of this.operations) {
      Aether.log('Executing: ' + name);
      try {
        await fn();
        Aether.log('  ✓ Completed');
      } catch (error) {
        Aether.error('  ✗ Failed: ' + error.message);
        return; // Stop on first error
      }
    }
    Aether.toast('Chain completed');
  }
}

// Usage
(async () => {
  const chain = new ScriptChain();
  
  chain
    .add('Load config', async () => {
      const config = await Aether.readOPFSFile('config.json');
      if (!config) throw new Error('No config');
    })
    .add('Validate buffers', () => {
      if (Aether.getAllBuffers().length === 0) {
        throw new Error('No files open');
      }
    })
    .add('Generate report', async () => {
      await Aether.saveOPFSFile('report.json', '{}');
    });
  
  await chain.execute();
})();
```

---

## Tips & Tricks

### Focus-Specific Script
```javascript
// focus-on-type.js
(async () => {
  const fileType = 'js'; // Edit to focus on specific type
  
  const buffers = Aether.getAllBuffers();
  const matching = buffers.filter(b => b.name.endsWith('.' + fileType));
  
  if (matching.length > 0) {
    Aether.setActiveBuffer(matching[0].id);
    Aether.toast('Focused on: ' + matching[0].name);
  } else {
    Aether.warn('No .' + fileType + ' files found');
  }
})();
```

### One-liner Utilities
```javascript
// Various quick utilities

// Count all characters across all files
const totalChars = Aether.getAllBuffers()
  .reduce((sum, b) => sum + b.content.length, 0);
Aether.log('Total chars: ' + totalChars);

// Get list of all file types
const types = new Set(
  Aether.getAllBuffers().map(b => b.name.split('.').pop())
);
Aether.log('File types: ' + [...types].join(', '));

// Find largest file
const largest = Aether.getAllBuffers()
  .reduce((max, b) => b.content.length > max.content.length ? b : max);
Aether.log('Largest: ' + largest.name);
```

---

## Troubleshooting Common Issues

### Script Doesn't Execute
- Check file extension is `.js`
- Open browser console (F12) for errors
- Use `Aether.log()` to debug

### Async Operations Timeout
- Verify `await` is used in async function
- Check for infinite loops
- Monitor file sizes - OPFS has size limits

### API Methods Don't Work
- Ensure you're using `Aether.` prefix
- Check method names are spelled correctly
- Use Command Palette: "Show Script API" for reference

### Files Not Saving
- OPFS may be full - check storage quota
- Verify file permissions (browser privacy settings)
- Try reloading the page

---

## Next Steps

- Read [scripting_guide.md](scripting_guide.md) for in-depth techniques and advanced patterns
- Explore [api_reference.md](api_reference.md) for complete API documentation
- Check [manual.md](manual.md) for general editor usage
