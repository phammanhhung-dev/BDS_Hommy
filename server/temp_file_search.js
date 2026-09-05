const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const ext = new Set(['.js', '.jsx']);
const out1 = [];
const out2 = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      walk(p);
      continue;
    }
    if (!ext.has(path.extname(name.name).toLowerCase())) continue;
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/ProvinceCode/.test(line)) {
        out1.push(`${p}:${i + 1}:${line.trim()}`);
      }
      if (/new_provinces|new_communes|new_districts/.test(line)) {
        out2.push(`${p}:${i + 1}:${line.trim()}`);
      }
    }
  }
}
walk(root);
console.log('===PROVINCECODE===');
out1.forEach((l) => console.log(l));
console.log('===TABLE_NAMES===');
out2.forEach((l) => console.log(l));
