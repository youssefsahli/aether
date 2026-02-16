// LSP-like worker using Acorn for proper JS parsing and symbol extraction
// Load Acorn in the worker
try { importScripts('https://unpkg.com/acorn@8.8.2/dist/acorn.js'); } catch (e) { /* fallback: acorn may be unavailable */ }

self.keywords = [
  'function','const','let','var','class','return','if','else','for','while','switch','case','break','continue','try','catch','finally','import','from','export','new','this','super','throw','await','async','typeof','instanceof'
];
// Add common Pascal keywords to improve completions when editing Pascal files
self.keywords.push(
  'begin','end','program','unit','uses','interface','implementation','procedure','function','var','type','const','record','object','class','constructor','destructor','asm','inline','with','repeat','until','while','do','for','to','downto','case','of'
);

function extractSymbolsWithAcorn(content){
  const syms = [];
  const txt = content || '';
  const trimmed = txt.trim();
  const looksLikeHTML = /^</.test(trimmed) || /<\s*(!doctype|html|div|h[1-6]|script|section|header|footer|nav|main|article|template)\b/i.test(txt);

  if (looksLikeHTML) {
    // Extract headings (h1..h6)
    const reHeading = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/ig;
    let m;
    while((m = reHeading.exec(txt)) !== null){
      const idx = m.index || 0;
      const line = txt.slice(0, idx).split('\n').length;
      const title = (m[2] || '').replace(/\s+/g, ' ').trim();
      syms.push({ name: title || `<${m[1]}>`, line, kind: 'heading' });
    }

    // Extract elements with id/class and script src imports
    const reTag = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
    while((m = reTag.exec(txt)) !== null){
      const tag = m[1];
      const attrs = m[2] || '';
      const idx = m.index || 0;
      const line = txt.slice(0, idx).split('\n').length;

      const idMatch = /id\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (idMatch) syms.push({ name: `${tag}#${idMatch[1]}`, line, kind: 'id' });

      const classMatch = /class\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (classMatch){
        const classes = classMatch[1].split(/\s+/).filter(Boolean);
        for (const c of classes) syms.push({ name: `${tag}.${c}`, line, kind: 'class' });
      }

      const srcMatch = /src\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (srcMatch) syms.push({ name: `${tag} src=${srcMatch[1]}`, line, kind: 'import' });
    }

    return syms;
  }

  try{
    const ast = acorn.parse(txt, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    // simple recursive walker that collects name, kind and location
    (function walk(node){
      if (!node || typeof node.type !== 'string') return;
      switch(node.type){
        case 'FunctionDeclaration':
          if (node.id && node.id.name) syms.push({ name: node.id.name, line: node.loc && node.loc.start ? node.loc.start.line : 1, kind: 'function' });
          break;
        case 'ClassDeclaration':
          if (node.id && node.id.name) syms.push({ name: node.id.name, line: node.loc && node.loc.start ? node.loc.start.line : 1, kind: 'class' });
          break;
        case 'VariableDeclaration':
          for (const d of node.declarations){
            if (d.id && d.id.type === 'Identifier') {
              let k = 'variable';
              if (d.init && (d.init.type === 'FunctionExpression' || d.init.type === 'ArrowFunctionExpression')) k = 'function';
              syms.push({ name: d.id.name, line: (d.id.loc && d.id.loc.start) ? d.id.loc.start.line : (node.loc && node.loc.start ? node.loc.start.line : 1), kind: k });
            }
          }
          break;
        case 'ImportDeclaration':
          for (const s of node.specifiers) if (s.local && s.local.name) syms.push({ name: s.local.name, line: (s.local.loc && s.local.loc.start) ? s.local.loc.start.line : (node.loc && node.loc.start ? node.loc.start.line : 1), kind: 'import' });
          break;
      }
      for (const k in node){
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        const child = node[k];
        if (Array.isArray(child)) child.forEach(w => walk(w));
        else if (child && typeof child.type === 'string') walk(child);
      }
    })(ast);
  }catch(e){
    // parsing failed; fallback to regex extraction but include approximate line numbers
    const reFn = /(?:function|class)\s+([A-Za-z0-9_$]+)/g; let m;
    while((m = reFn.exec(txt)) !== null){
      const idx = m.index || 0;
      const line = txt.slice(0, idx).split('\n').length;
      syms.push({ name: m[1], line, kind: 'unknown' });
    }
    const reVar = /(?:const|let|var)\s+([A-Za-z0-9_$]+)/g;
    while((m = reVar.exec(txt)) !== null){
      const idx = m.index || 0;
      const line = txt.slice(0, idx).split('\n').length;
      syms.push({ name: m[1], line, kind: 'variable' });
    }

    // Pascal-style extraction: detect and extract procedure/function/type/var names
    if (/\bprocedure\b|\bfunction\b|\bprogram\b|\bunit\b/i.test(txt)){
      const rePasProc = /(?:procedure|function)\s+([A-Za-z0-9_]+)/ig;
      while((m = rePasProc.exec(txt)) !== null){
        const idx = m.index || 0;
        const line = txt.slice(0, idx).split('\n').length;
        syms.push({ name: m[1], line, kind: 'function' });
      }
      const rePasType = /\btype\s+([A-Za-z0-9_]+)/ig;
      while((m = rePasType.exec(txt)) !== null){
        const idx = m.index || 0;
        const line = txt.slice(0, idx).split('\n').length;
        syms.push({ name: m[1], line, kind: 'type' });
      }
      const rePasVar = /\bvar\s+([A-Za-z0-9_]+)/ig;
      while((m = rePasVar.exec(txt)) !== null){
        const idx = m.index || 0;
        const line = txt.slice(0, idx).split('\n').length;
        syms.push({ name: m[1], line, kind: 'variable' });
      }
    }
  }
  return syms;
}

function diagnosticsWithAcorn(content){
  const txt = content || '';
  const looksLikeHTML = /^</.test(txt.trim()) || /<\s*(!doctype|html|div|h[1-6]|script|section|header|footer|nav|main|article|template)\b/i.test(txt);
  if (looksLikeHTML) return [];
  try{
    acorn.parse(txt, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    return [];
  }catch(e){
    const diag = { message: e.message || String(e) };
    if (e.loc) { diag.line = e.loc.line; diag.column = e.loc.column; }
    return [diag];
  }
}

self.addEventListener('message', (ev) => {
  const data = ev.data;
  if (!data || !data.type) return;
  if (data.type === 'analyze'){
    const symbols = extractSymbolsWithAcorn(data.content || '');
    const diags = diagnosticsWithAcorn(data.content || '');
    self.postMessage({ type: 'analyze', symbols, diagnostics: diags });
  }

  if (data.type === 'complete'){
    const content = data.content || '';
    const prefix = data.prefix || '';
    const symbols = extractSymbolsWithAcorn(content);
    const symbolNames = symbols.map(s => s.name);
    const candidates = Array.from(new Set([...self.keywords, ...symbolNames]));
    const items = candidates.filter(w => prefix.length === 0 ? false : w.startsWith(prefix)).map(w => ({ caption: w, value: w, meta: 'LSP' }));
    self.postMessage({ type: 'complete', id: data.id, items });
  }
  
  if (data.type === 'hover'){
    const word = data.word;
    let signature = null;
    let doc = null;
    let kind = null;
    const content = data.content || '';
    const isHTML = /^</.test((content||'').trim()) || /<\s*(!doctype|html|div|h[1-6]|script|section|header|footer|nav|main|article|template)\b/i.test(content);
    const isPascal = /\b(program|unit|procedure|function|begin|end)\b/i.test(content);
    if (isHTML){
      // simple HTML hover: id/class/tag
      const w = (word||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const idRe = new RegExp('\\bid\\s*=\\s*["\']'+w+'["\']','i');
      if (idRe.test(content)){ signature = `id="${word}"`; kind = 'id'; }
      else {
        const classRe = new RegExp('\\bclass\\s*=\\s*["\']([^"\']*\\b'+w+'\\b[^"\']*)["\']','i');
        if (classRe.test(content)){ signature = `class="${word}"`; kind = 'class'; }
        else {
          const tagRe = new RegExp('<('+w+')(\\s|>)','i');
          if (tagRe.test(content)){ signature = `<${word}>`; kind = 'tag'; }
        }
      }
      self.postMessage({ type: 'hover', word, signature, doc, kind });
      return;
    }
    if (isPascal){
      // simple Pascal hover: find procedure/function signature or type
      const name = (word||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const reSig = new RegExp('(?:procedure|function)\\s+'+name+'\\s*(\\([^\\)]*\\))?', 'i');
      const mSig = reSig.exec(content);
      if (mSig){
        signature = `${word}${mSig[1] || '()'}`;
        kind = 'function';
      } else {
        const reType = new RegExp('\\btype\\s+'+name+'\\b','i');
        if (reType.test(content)) { signature = `type ${word}`; kind = 'type'; }
      }
      self.postMessage({ type: 'hover', word, signature, doc, kind });
      return;
    }
    try{
      const ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
      // walk to find function/class/method with that name
      (function walk(node){
        if (!node || signature) return;
        if (node.type === 'FunctionDeclaration' && node.id && node.id.name === word){
          const params = (node.params || []).map(p => (p.name || (p.type || '?')));
          signature = `${word}(${params.join(', ')})`;
          kind = 'function';
          // try to extract JSDoc before node.start
          const before = content.slice(0, node.start);
          const m = /\/\*\*([\s\S]*?)\*\//g.exec(before);
          if (m) doc = m[1].trim();
          return;
        }
        if (node.type === 'ClassDeclaration' && node.id && node.id.name === word){
          signature = `class ${word}`; kind = 'class';
          const before = content.slice(0, node.start);
          const m = /\/\*\*([\s\S]*?)\*\//g.exec(before);
          if (m) doc = m[1].trim();
          return;
        }
        if (node.type === 'VariableDeclaration'){
          for (const d of node.declarations){
            if (d.id && d.id.type === 'Identifier' && d.id.name === word && d.init){
              if (d.init.type === 'FunctionExpression' || d.init.type === 'ArrowFunctionExpression'){
                const params = (d.init.params || []).map(p => (p.name || (p.type || '?')));
                signature = `${word}(${params.join(', ')})`;
                kind = 'function';
                const before = content.slice(0, node.start);
                const m = /\/\*\*([\s\S]*?)\*\//g.exec(before);
                if (m) doc = m[1].trim();
                return;
              }
            }
          }
        }
        if (node.type === 'ClassBody' || node.type === 'Program' || node.type === 'BlockStatement'){
          for (const k in node){
            if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
            const child = node[k];
            if (Array.isArray(child)) child.forEach(w => walk(w));
            else if (child && typeof child.type === 'string') walk(child);
          }
        } else {
          for (const k in node){
            if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
            const child = node[k];
            if (Array.isArray(child)) child.forEach(w => walk(w));
            else if (child && typeof child.type === 'string') walk(child);
          }
        }
      })(ast);
    }catch(e){ /* ignore parsing errors */ }

    self.postMessage({ type: 'hover', word, signature, doc, kind });
  }
});
