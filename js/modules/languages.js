/**
 * Languages Module
 * Lazy loading of Ace editor language modes and language configuration
 */

const Languages = {
    // CDN base URL for Ace modes
    ACE_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.7',
    
    // Loaded modes cache
    loadedModes: new Set(['text']),
    
    // Loading promises to prevent duplicate loads
    loadingPromises: new Map(),
    
    // File extension to Ace mode mapping
    extToMode: {
        // JavaScript/TypeScript
        js: 'javascript', mjs: 'javascript', cjs: 'javascript',
        ts: 'typescript', tsx: 'tsx', jsx: 'jsx',
        
        // Web
        html: 'html', htm: 'html', xhtml: 'html',
        css: 'css', scss: 'scss', sass: 'sass', less: 'less',
        svg: 'svg', xml: 'xml',
        
        // Data formats
        json: 'json', json5: 'json5',
        yaml: 'yaml', yml: 'yaml',
        toml: 'toml',
        ini: 'ini', cfg: 'ini',
        
        // Markdown/Text
        md: 'markdown', markdown: 'markdown',
        txt: 'text', log: 'text',
        rst: 'rst',
        
        // Programming languages
        py: 'python', pyw: 'python',
        rb: 'ruby', rake: 'ruby',
        php: 'php', phtml: 'php',
        java: 'java',
        c: 'c_cpp', cpp: 'c_cpp', cc: 'c_cpp', cxx: 'c_cpp', h: 'c_cpp', hpp: 'c_cpp',
        cs: 'csharp',
        go: 'golang',
        rs: 'rust',
        swift: 'swift',
        kt: 'kotlin', kts: 'kotlin',
        scala: 'scala',
        r: 'r', R: 'r',
        lua: 'lua',
        perl: 'perl', pl: 'perl', pm: 'perl',
        pas: 'pascal', pp: 'pascal', dpr: 'pascal',
        
        // Shell/Scripts
        sh: 'sh', bash: 'sh', zsh: 'sh',
        ps1: 'powershell', psm1: 'powershell',
        bat: 'batchfile', cmd: 'batchfile',
        
        // Database
        sql: 'sql', mysql: 'mysql', pgsql: 'pgsql',
        
        // Config/DevOps
        dockerfile: 'dockerfile',
        makefile: 'makefile', mk: 'makefile',
        cmake: 'cmake',
        nginx: 'nginx',
        
        // Other
        diff: 'diff', patch: 'diff',
        graphql: 'graphqlschema', gql: 'graphqlschema',
        proto: 'protobuf',
        tex: 'latex', latex: 'latex',
        asm: 'assembly_x86', s: 'assembly_x86',
        vue: 'html',
        svelte: 'html',
    },
    
    // Common modes to preload (most frequently used)
    preloadModes: ['javascript', 'html', 'css', 'markdown', 'json'],
    
    // Display names for modes
    modeDisplayNames: {
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        html: 'HTML',
        css: 'CSS',
        python: 'Python',
        markdown: 'Markdown',
        json: 'JSON',
        c_cpp: 'C/C++',
        csharp: 'C#',
        java: 'Java',
        golang: 'Go',
        rust: 'Rust',
        ruby: 'Ruby',
        php: 'PHP',
        swift: 'Swift',
        kotlin: 'Kotlin',
        scala: 'Scala',
        sh: 'Shell',
        sql: 'SQL',
        yaml: 'YAML',
        xml: 'XML',
        text: 'Plain Text',
    },
    
    /**
     * Get mode name for a file extension
     */
    getModeForExt(ext) {
        return this.extToMode[ext?.toLowerCase()] || 'text';
    },
    
    /**
     * Get display name for a mode
     */
    getDisplayName(mode) {
        return this.modeDisplayNames[mode] || mode.charAt(0).toUpperCase() + mode.slice(1);
    },
    
    /**
     * Check if a mode is loaded
     */
    isLoaded(mode) {
        return this.loadedModes.has(mode);
    },
    
    /**
     * Load a mode script dynamically
     */
    async loadMode(mode) {
        if (mode === 'text' || this.loadedModes.has(mode)) {
            return true;
        }
        
        // Return existing promise if already loading
        if (this.loadingPromises.has(mode)) {
            return this.loadingPromises.get(mode);
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${this.ACE_CDN}/mode-${mode}.min.js`;
            script.async = true;
            
            script.onload = () => {
                this.loadedModes.add(mode);
                this.loadingPromises.delete(mode);
                resolve(true);
            };
            
            script.onerror = () => {
                this.loadingPromises.delete(mode);
                console.warn(`Failed to load mode: ${mode}`);
                resolve(false); // Don't reject, just fall back to text
            };
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(mode, promise);
        return promise;
    },
    
    /**
     * Set editor mode with lazy loading
     */
    async setEditorMode(editor, filename) {
        const ext = filename ? filename.split('.').pop().toLowerCase() : 'txt';
        const mode = this.getModeForExt(ext);
        
        // Try to load the mode
        const loaded = await this.loadMode(mode);
        
        // Set the mode (falls back to loaded modes if load failed)
        const finalMode = loaded ? mode : 'text';
        editor.session.setMode(`ace/mode/${finalMode}`);
        
        return finalMode;
    },
    
    /**
     * Preload common modes in background
     */
    async preload() {
        // Load modes sequentially to avoid overwhelming the browser
        for (const mode of this.preloadModes) {
            await this.loadMode(mode);
        }
    },
    
    /**
     * Initialize - start preloading common modes
     */
    init() {
        // Start preloading immediately for faster first-file syntax highlighting
        this.preload();
    }
};
