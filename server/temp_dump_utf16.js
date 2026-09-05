const fs = require('fs');
const path = require('path');
const files = ['temp_raw_evidence_output.txt', 'temp_file_search_output.txt'];
for (const file of files) {
  const input = path.resolve(__dirname, file);
  const output = path.resolve(__dirname, file.replace('.txt', '.utf8.txt'));
  if (!fs.existsSync(input)) {
    console.error('MISSING', input);
    continue;
  }
  const content = fs.readFileSync(input);
  let text;
  const bom = content.slice(0, 2).toString('hex');
  if (bom === 'fffe') {
    text = content.toString('utf16le');
  } else if (bom === 'feff') {
    text = content.slice(2).toString('utf16le');
  } else {
    try {
      text = content.toString('utf8');
    } catch (err) {
      text = content.toString('latin1');
    }
  }
  fs.writeFileSync(output, text, 'utf8');
  console.log('WROTE', output);
}
