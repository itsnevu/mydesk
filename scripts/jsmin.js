// Light, dependency-free minifiers for the single-file build. Safe by construction rather than clever:
// JS: drops comments, indentation, trailing spaces, blank lines and runs of spaces; newlines stay (so ASI is untouched), and
// strings, template literals (with nested ${…}) and regex literals pass through byte for byte. CSS: drops comments and indentation.
const KW_BEFORE_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await', 'extends']);
const isWord = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '$' || c > '\x7f';

/** Tokenize-and-reprint. Returns { code, tokens } where tokens is the significant token list (for self-checks). */
export function minifyJS(src) {
  const out = []; let bol = true, i = 0, pend = ''; const n = src.length, toks = [], tpl = []; // bol: output is at a line start
  let last = ''; // previous significant token: a word, a punctuator char, or 'lit' for string/template/regex/number-ish ends
  const emit = (s) => { if (pend && !bol) out.push(pend); pend = ''; out.push(s); bol = false; };
  const nl = () => { pend = ''; if (!bol) out.push('\n'); bol = true; }; // never a trailing space: pend is only written before a token
  const regexOk = () => last === '' || (isWord(last[0]) ? KW_BEFORE_EXPR.has(last) : last !== ')' && last !== ']' && last !== 'lit');
  const template = () => { // at a backtick or a closing } of ${…}; copies until the closing backtick or the next ${
    let s = src[i++];
    while (i < n) {
      const c = src[i];
      if (c === '\\') { s += c + src[i + 1]; i += 2; continue; }
      if (c === '`') { s += c; i++; emit(s); toks.push(s); last = 'lit'; return; }
      if (c === '$' && src[i + 1] === '{') { s += '${'; i += 2; emit(s); toks.push(s); tpl.push(0); last = '{'; return; }
      s += c; i++;
    }
    throw new Error('unterminated template literal');
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029') { nl(); i++; continue; }
    if (c === ' ' || c === '\t' || c === '\v' || c === '\f' || c === '\ufeff' || c === '\u00a0') { if (!bol) pend = ' '; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n' && src[i] !== '\r') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) throw new Error('unterminated comment'); const body = src.slice(i, e + 2); i = e + 2; if (/[\n\r\u2028\u2029]/.test(body)) nl(); else if (!bol) pend = ' '; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; else if (src[j] === '\n') throw new Error('unterminated string at ' + i); j++; }
      const s = src.slice(i, j + 1); emit(s); toks.push(s); i = j + 1; last = 'lit'; continue;
    }
    if (c === '`') { template(); continue; }
    if (c === '/' && regexOk()) {
      let j = i + 1, cls = false, ok = false;
      for (; j < n; j++) { const e = src[j]; if (e === '\n' || e === '\r') break; if (e === '\\') { j++; continue; } if (e === '[') cls = true; else if (e === ']') cls = false; else if (e === '/' && !cls) { ok = true; break; } }
      if (ok) { j++; while (j < n && isWord(src[j])) j++; const s = src.slice(i, j); emit(s); toks.push(s); i = j; last = 'lit'; continue; }
    }
    if (isWord(c)) { let j = i + 1; while (j < n && isWord(src[j])) j++; const w = src.slice(i, j); emit(w); toks.push(w); i = j; last = w; continue; }
    if (c === '{' && tpl.length) tpl[tpl.length - 1]++;
    if (c === '}' && tpl.length) { if (tpl[tpl.length - 1] === 0) { tpl.pop(); pend = ''; template(); continue; } tpl[tpl.length - 1]--; }
    emit(c); toks.push(c); i++; last = c;
  }
  if (tpl.length) throw new Error('unterminated template substitution');
  nl();
  return { code: out.join(''), tokens: toks };
}

/** CSS: comments out (outside strings), lines trimmed, blank lines dropped. */
export function minifyCSS(src) {
  let out = '', i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; continue; }
    out += c; i++;
  }
  return out.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
}
