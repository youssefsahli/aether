// Minimal LSP-like worker: provides simple completions and diagnostics
self.keywords = [
  'function','const','let','var','class','return','if','else','for','while','switch','case','break','continue','try','catch','finally','import','from','export','new','this','super','throw','await','async'];

function extractSymbols(content){
  const ids = new Set();
  const re = /(?:function|class)\s+([A-Za-z0-9_$]+)/g;
  let m; while((m = re.exec(content)) !== null) ids.add(m[1]);
  const re2 = /(?:const|let|var)\s+([A-Za-z0-9_$]+)/g;
  while((m = re2.exec(content)) !== null) ids.add(m[1]);
  return Array.from(ids);
}

function diagnosticsForJS(content){
  try{
    // Try to parse by creating a function - this catches syntax errors
    new Function(content);
    return [];
  }catch(e){
    // e may contain lineNumber in some engines; approximate
    const msg = e && e.message ? e.message : String(e);
    return [{ message: msg }];
  }
}

self.addEventListener('message', (ev) => {
  const data = ev.data;
  if (!data || !data.type) return;
  if (data.type === 'analyze'){
    const symbols = extractSymbols(data.content || '');
    const diags = diagnosticsForJS(data.content || '');
    self.postMessage({ type: 'analyze', symbols, diagnostics: diags });
  }

  if (data.type === 'complete'){
    const content = data.content || '';
    const prefix = data.prefix || '';
    const symbols = extractSymbols(content);
    const candidates = Array.from(new Set([...self.keywords, ...symbols]));
    const items = candidates.filter(w => w.startsWith(prefix) && prefix.length > 0).map(w => ({ caption: w, value: w, meta: 'LSP' }));
    self.postMessage({ type: 'complete', id: data.id, items });
  }
});
