import fs from 'fs';
import path from 'path';
const __dirname = path.resolve();
const file = path.join(__dirname, 'src', 'pages', 'ChuDuAn', 'TaoTinDang.jsx');
const s = fs.readFileSync(file, 'utf8');
let inS = false, inD = false, inT = false, inLine = false, inBlock = false, prev = '';
let line = 1; const report = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const next = s[i + 1] || '';
  if (ch === '\n') line++;
  if (inLine) { if (ch === '\n') inLine = false; }
  else if (inBlock) { if (ch === '*' && next === '/') { inBlock = false; i++; prev = ''; continue; } }
  else if (!inS && !inD && !inT) {
    if (ch === '/' && next === '/') { inLine = true; i++; continue; }
    if (ch === '/' && next === '*') { inBlock = true; i++; continue; }
    if (ch === "'") { inS = true; prev = ''; continue; }
    if (ch === '"') { inD = true; prev = ''; continue; }
    if (ch === '`') { inT = true; prev = ''; continue; }
    if (ch === '/') {
      const start = i;
      const ctx = s.slice(Math.max(0, i - 20), Math.min(s.length, i + 20));
      report.push({ pos: i, line, ctx });
    }
  } else {
    if (inS) { if (ch === "'" && prev !== '\\') { inS = false; } }
    else if (inD) { if (ch === '"' && prev !== '\\') { inD = false; } }
    else if (inT) { if (ch === '`' && prev !== '\\') { inT = false; } }
  }
  prev = ch;
}
console.log('found', report.length, 'slashes outside strings/comments; showing first 60');
report.slice(0, 60).forEach(r => console.log('line', r.line, r.ctx.replace(/\n/g, '↵')));
