// Audit de performance Lighthouse sur le site statique.
// Démarre un serveur statique local, lance le Chromium pré-installé, exécute
// Lighthouse et écrit le rapport HTML + un résumé des scores en console.
//
//   npm run audit
//
// Variables d'env optionnelles :
//   AUDIT_URL   (défaut http://localhost:4318)
//   CHROME_PATH (auto-détecté depuis /opt/pw-browsers sinon)

import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const PORT = 4318;
const URL = process.env.AUDIT_URL || `http://localhost:${PORT}`;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
    if (dir) {
      const p = `${base}/${dir}/chrome-linux/chrome`;
      if (existsSync(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { stdio: 'ignore' });
const chromePath = findChrome();
let chrome;
try {
  await sleep(1200); // laisse le serveur démarrer
  chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const runnerResult = await lighthouse(URL, {
    logLevel: 'error',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  });

  writeFileSync('lighthouse-report.html', runnerResult.report);
  const c = runnerResult.lhr.categories;
  const pct = (x) => Math.round((x?.score ?? 0) * 100);
  console.log('\n🔦 Lighthouse —', URL);
  console.log(`  Performance     : ${pct(c.performance)}`);
  console.log(`  Accessibilité   : ${pct(c.accessibility)}`);
  console.log(`  Bonnes pratiques: ${pct(c['best-practices'])}`);
  console.log(`  SEO             : ${pct(c.seo)}`);
  console.log('  Rapport complet : lighthouse-report.html\n');
} catch (err) {
  console.error('Échec de l’audit Lighthouse :', err.message);
  process.exitCode = 1;
} finally {
  if (chrome) await chrome.kill();
  server.kill();
}
