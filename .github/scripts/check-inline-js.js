const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptTagRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

let match;
let index = 0;
let hasError = false;

while ((match = scriptTagRe.exec(html)) !== null) {
  index++;
  const code = match[1];
  if (!code.trim()) continue;
  try {
    new vm.Script(code, { filename: `index.html#inline-script-${index}` });
  } catch (err) {
    hasError = true;
    console.error(`Syntax error in inline <script> block #${index}:\n${err.message}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`OK: ${index} inline <script> block(s) parsed without syntax errors.`);
