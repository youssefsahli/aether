// LSP-like worker using Acorn for proper JS parsing and symbol extraction
// Load Acorn in the worker
try { importScripts('https://unpkg.com/acorn@8.8.2/dist/acorn.js'); } catch (e) { /* fallback: acorn may be unavailable */ }

self.keywords = [
  'function','const','let','var','class','return','if','else','for','while','switch','case','break','continue','try','catch','finally','import','from','export','new','this','super','throw','await','async','typeof','instanceof'
];

function extractSymbolsWithAcorn(content){
  const ids = new Set();
  try{
    const ast = acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    // simple recursive walker
    (function walk(node){
      if (!node || typeof node.type !== 'string') return;
      switch(node.type){
        case 'FunctionDeclaration': if (node.id && node.id.name) ids.add(node.id.name); break;
        case 'ClassDeclaration': if (node.id && node.id.name) ids.add(node.id.name); break;
        case 'VariableDeclaration':
          for (const d of node.declarations){
            if (d.id && d.id.type === 'Identifier') ids.add(d.id.name);
            // skip patterns for simplicity
          }
          break;
        case 'ImportDeclaration':
          for (const s of node.specifiers) if (s.local && s.local.name) ids.add(s.local.name);
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
    // parsing failed; fallback to regex extraction
    const re = /(?:function|class)\s+([A-Za-z0-9_$]+)/g; let m; while((m = re.exec(content)) !== null) ids.add(m[1]);
    const re2 = /(?:const|let|var)\s+([A-Za-z0-9_$]+)/g; while((m = re2.exec(content)) !== null) ids.add(m[1]);
  }
  return Array.from(ids);
}

function diagnosticsWithAcorn(content){
  try{
    acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
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
    const candidates = Array.from(new Set([...self.keywords, ...symbols]));
    const items = candidates.filter(w => prefix.length === 0 ? false : w.startsWith(prefix)).map(w => ({ caption: w, value: w, meta: 'LSP' }));
    self.postMessage({ type: 'complete', id: data.id, items });
  }
  
  if (data.type === 'hover'){
    const word = data.word;
    let signature = null;
    let doc = null;
    let kind = null;
    try{
      const content = data.content || '';
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
