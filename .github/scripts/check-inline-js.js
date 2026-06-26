const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptTagRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;

// Types de <script> qui ne contiennent pas de JavaScript exécutable (ex. JSON-LD).
// On les ignore : les parser comme du JS provoquerait de faux positifs.
const NON_JS_TYPE = /\btype\s*=\s*["']?(application\/ld\+json|application\/json|text\/template|text\/html)["']?/i;

let match;
let index = 0;
let hasError = false;

while ((match = scriptTagRe.exec(html)) !== null) {
  index++;
  const attrs = match[1];
  const code = match[2];
  if (!code.trim()) continue;
  if (NON_JS_TYPE.test(attrs)) continue;
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
