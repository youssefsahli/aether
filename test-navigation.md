# Multi-File Navigation Demo

This file demonstrates the new on-click markdown navigation feature!

## How it Works

Click on any of the internal file links below to navigate to other files:

- [welcome.md](welcome.md) - View the welcome guide
- [index.html](index.html) - View the main editor file
- [SCRIPTING.md](SCRIPTING.md) - Check scripting documentation
- [manifest.json](manifest.json) - View the PWA manifest

## Features

You can now:
1. **Click markdown links** in the preview pane
2. **Navigate between files** instantly
3. Works with **relative file paths** like `filename.ext` or `path/to/file.md`

## External Links

Regular external links still work too:
- [GitHub](https://github.com) - This opens externally
- [Google](https://google.com) - This also opens externally

## Link Format

Internal file links (links without `http://`, `https://`, or `www.`):
```
[My File](myfile.md)
[Another](docs/readme.md)
```

External URLs (automatically excluded from navigation):
```
[External](https://example.com)
[Demo](www.example.com)
```

---

Try clicking on **[welcome.md](welcome.md)** to test it!
