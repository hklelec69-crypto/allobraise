// Configuration Playwright — tests E2E du site statique.
// Utilise le Chromium PRÉ-INSTALLÉ de l'environnement (pas de téléchargement)
// et sert le site via `python3 -m http.server`.
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');

// Retrouve le binaire Chromium pré-installé, robuste au numéro de build.
function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = fs
      .readdirSync(base)
      .find((d) => d.startsWith('chromium-') && !d.includes('headless'));
    if (dir) {
      const p = `${base}/${dir}/chrome-linux/chrome`;
      if (fs.existsSync(p)) return p;
    }
  } catch {
    /* laisse Playwright gérer son propre navigateur */
  }
  return undefined;
}

const PORT = 4173;
const executablePath = findChromium();

// `python3` n'existe pas sous Windows (alias Microsoft Store piégé) : on
// bascule sur `python` pour permettre de lancer les E2E en local.
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          ...(executablePath ? { executablePath } : {}),
          args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
  webServer: {
    command: `${pythonCmd} -m http.server ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
