# Multi-File Navigation Implementation

## Overview
Added on-click navigation functionality for markdown links in the Aether editor. Users can now click on markdown links in the preview pane to navigate to other files.

## Implementation Details

### 1. **Marked Custom Renderer Configuration** (lines 2116-2133)
- Created `MarkedConfig` object to configure the `marked` library
- Custom `link` renderer that adds `data-aether-file="true"` attribute to internal links
- **Internal links**: Relative paths without `http://`, `https://`, or `www.` prefix
- **External links**: Unchanged, opens in browser normally
- Called during `App.init()` to set up the configuration

```javascript
const MarkedConfig = {
    init() {
        const renderer = new marked.Renderer();
        renderer.link = (token) => {
            const href = token.href;
            const isInternal = !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('www.');
            const dataAttr = isInternal ? ' data-aether-file="true"' : '';
            return `<a href="${href}"${dataAttr}>${token.text}</a>`;
        };
        marked.use({ renderer });
    }
};
```

### 2. **Iframe Link Handlers** (line 2295)
- Modified the preview iframe shell to include `attachLinkHandlers()` function
- Attaches click event listeners to all links with `data-aether-file` attribute
- When clicked:
  - Prevents default link behavior (`e.preventDefault()`)
  - Extracts filename from href
  - Posts `aether-open-file` message to parent window
- Called on initial load and after content updates

```javascript
function attachLinkHandlers(){
  const links=document.querySelectorAll('a[data-aether-file]');
  links.forEach(link=>{
    link.addEventListener('click',function(e){
      e.preventDefault();
      const filename=this.href.split('/').pop()||this.href;
      parent.postMessage({type:'aether-open-file',filename},'*');
    });
  });
}
```

### 3. **Parent Window Message Handler** (lines 2729-2742)
- Added handler in main window's `message` event listener
- Processes `aether-open-file` event type from iframe
- Logic:
  1. Extracts filename from event data
  2. Searches for existing buffer with that filename
  3. If found: activates that buffer
  4. If not found: shows toast notification

```javascript
if (event.data.type === 'aether-open-file') {
    const filename = event.data.filename;
    if (filename) {
        const existing = Store.state.buffers.find(b => b.name === filename);
        if (existing) {
            Store.setActive(existing.id);
        } else {
            UI.toast('File not found: ' + filename);
        }
    }
    return;
}
```

## How to Use

### Creating Internal Links
In markdown files, create links using relative paths:

```markdown
[Link to Welcome](welcome.md)
[Link to Script API](SCRIPTING.md)
[Nested Path](docs/guide.md)
```

### Link Behavior
- **Internal links** (relative paths): Click to open in editor
- **External links** (http://, https://, www.): Click to open externally
- **Invalid paths**: Shows "File not found" toast

### Example
See [test-navigation.md](test-navigation.md) for a working example with test links.

## Technical Details

### Files Modified
- `/workspaces/aether/index.html`

### Key Changes
1. **MarkedConfig object**: Custom renderer for markdown links
2. **App.init()**: Initialize marked configuration
3. **debouncePreview()**: Updated iframe shell with link handlers
4. **window.addEventListener('message')**: Added aether-open-file handler

### Security Notes
- Links are validated to only open files that exist in current buffers
- No arbitrary file system access
- External links are unaffected and open normally

## Testing
Use [test-navigation.md](test-navigation.md) to test the feature:
1. Open the test file in the editor
2. Toggle preview mode
3. Click on any relative file link
4. Should navigate to that file (or show error if not found)

## Future Enhancements
- Support for line number anchors (#L10)
- Support for loading files from OPFS
- Support for section anchors in markdown headers
- Visual feedback while loading files
- History tracking for back/forward navigation
