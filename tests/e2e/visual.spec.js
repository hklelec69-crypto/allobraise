// Régression visuelle (toHaveScreenshot, natif Playwright — pas de SaaS).
// Les requêtes CROSS-ORIGIN sont bloquées pour un rendu 100% déterministe :
// mêmes pixels en local et en CI, quel que soit l'état des CDN (icônes) ou
// d'Unsplash (le hero garde son dégradé de secours). Les polices sont locales,
// la typographie est donc bien couverte.
const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 1280, height: 900 } });

async function pageDeterministe(page, hash) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost')) return route.continue();
    return route.abort();
  });
  await page.goto('/' + hash);
  await page.waitForTimeout(900); // routeur + animations d'entrée
  // fige les animations pour des pixels stables
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await page.waitForTimeout(200);
}

test('visuel : page d’accueil (hero + grille)', async ({ page }) => {
  await pageDeterministe(page, '');
  await expect(page).toHaveScreenshot('accueil.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
  });
});

test('visuel : fiche pitmaster', async ({ page }) => {
  await pageDeterministe(page, '#profil/n%3Ale-gros-fumeur');
  await expect(page).toHaveScreenshot('profil.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
  });
});

test('visuel : landing devenir-expert', async ({ page }) => {
  await pageDeterministe(page, '#devenir-expert');
  await expect(page).toHaveScreenshot('devenir-expert.png', {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
  });
});
