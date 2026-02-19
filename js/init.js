/**
 * Initialization Module
 * Window load events and message handlers
 */

window.onload = () => {
    App.init();
    Languages.init();
    // Initialize project UI state
    Project._updateUI();
    // Populate icons from Icons object
    document.querySelectorAll('[data-icon]').forEach(btn => {
        const iconName = btn.getAttribute('data-icon');
        if (Icons[iconName]) {
            btn.innerHTML = Icons[iconName];
        }
    });
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(e => console.log('SW registration failed:', e));
    }

    // Initialize console input
    const consoleInput = document.getElementById('console-input');
    if (consoleInput) {
        // Initialize worker for console execution
        if (Console && typeof Console.initWorker === 'function') {
            Console.initWorker();
        }
        
        const consoleHistory = [];
        let historyIndex = -1;

        // Show suggestions on input (auto-trigger)
        consoleInput.addEventListener('input', (e) => {
            Console.showSuggestions(e.target.value, e.target);
        });

        consoleInput.addEventListener('keydown', (e) => {
            const dropdown = document.getElementById('console-autocomplete');
            const suggestionsOpen = dropdown && dropdown.style.display === 'block';

            // Ctrl+Space: Manually trigger suggestions
            if (e.key === ' ' && e.ctrlKey) {
                e.preventDefault();
                Console.showSuggestions(consoleInput.value, consoleInput, true);
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                Console.hideSuggestions();
                const code = consoleInput.value.trim();
                if (code) {
                    // Add to history
                    consoleHistory.push(code);
                    historyIndex = consoleHistory.length;

                    // Display input
                    Console.displayInput(code);

                    // Execute code in console context
                    (async () => {
                        try {
                            const result = await Console.evaluateInContext(code);
                            
                            if (result.success) {
                                const displayValue = result.result ?? 'undefined';
                                Console.displayOutput('→ ' + displayValue, 'result');
                            } else {
                                Console.displayOutput('Error: ' + (result.error || 'Unknown error'), 'error');
                            }
                        } catch (err) {
                            Console.displayOutput('Error: ' + (err.message || String(err)), 'error');
                        }
                    })();

                    consoleInput.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                if (suggestionsOpen && Console.suggestions.length > 0) {
                    // If no selection, select first; otherwise accept current
                    if (Console.currentSuggestionIndex < 0) {
                        Console.currentSuggestionIndex = 0;
                    }
                    Console.acceptSuggestion(consoleInput);
                }
            } else if (e.key === 'ArrowUp') {
                if (suggestionsOpen) {
                    e.preventDefault();
                    Console.selectPrevSuggestion();
                } else {
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        consoleInput.value = consoleHistory[historyIndex];
                    }
                }
            } else if (e.key === 'ArrowDown') {
                if (suggestionsOpen) {
                    e.preventDefault();
                    Console.selectNextSuggestion();
                } else {
                    e.preventDefault();
                    if (historyIndex < consoleHistory.length - 1) {
                        historyIndex++;
                        consoleInput.value = consoleHistory[historyIndex];
                    } else {
                        historyIndex = consoleHistory.length;
                        consoleInput.value = '';
                    }
                }
            } else if (e.key === 'Escape') {
                Console.hideSuggestions();
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== consoleInput && !e.target.closest('#console-autocomplete')) {
                Console.hideSuggestions();
            }
        });
    }
};

window.addEventListener('message', (event) => {
    if (!event.data) return;
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame || event.source !== previewFrame.contentWindow) return;

    // Handle file opening requests from markdown preview
    if (event.data.type === 'aether-open-file') {
        const filename = event.data.filename;
        if (filename) {
            // Try to find existing buffer first
            const existing = Store.state.buffers.find(b => b.name === filename);
            if (existing) {
                Store.setActive(existing.id);
                App.debouncePreview(true);
            } else {
                // Try to lazy load from system filesystem
                SystemFS.lazyLoadFile(filename).then(() => {
                    const loaded = Store.state.buffers.find(b => b.name === filename);
                    if (loaded) {
                        Store.setActive(loaded.id);
                        App.debouncePreview(true);
                    }
                }).catch(() => {
                    UI.toast('File not found: ' + filename);
                });
            }
        }
        return;
    }

    // Handle Aether API calls from preview frame
    if (event.data.type === 'aether-call') {
        const method = event.data.method;
        try {
            if (method === 'log') console.log(event.data.msg);
            else if (method === 'warn') console.warn(event.data.msg);
            else if (method === 'error') console.error(event.data.msg);
            else if (method === 'toast') UI.toast(event.data.msg, event.data.duration);
            else if (method === 'openFile') Script.context.openFile(event.data.name, event.data.content);
            else if (method === 'newFile') Script.context.newFile(event.data.name, event.data.content);
            else if (method === 'setConfig') Script.context.setConfig(event.data.k, event.data.v);
            else if (method === 'updateTheme') Script.context.updateTheme(event.data.name);
            else if (method === 'updateZoom') Script.context.updateZoom(event.data.delta);
        } catch (e) { console.error('Aether API error:', e); }
        return;
    }

    // Handle console logs
    if (event.data.type !== 'console') return;

    const text = (event.data.args || []).map(a => {
        try {
            if (a && a.stack) return a.stack;
            if (typeof a === 'object') return JSON.stringify(a);
            return String(a);
        } catch (e) { return String(a); }
    }).join(' ');

    if (Console && Console.displayOutput) {
        Console.displayOutput(text, event.data.method);
    }
});
