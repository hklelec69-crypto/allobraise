const { test, expect } = require('@playwright/test');

// Bug 2 — la vue doit survivre à un rafraîchissement (routage par hash).
// Testé sans backend : seuls les pitmasters démo (codés en dur) sont
// disponibles, ce qui suffit pour valider la persistance.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('page légale : reflétée dans l’URL et restaurée au refresh', async ({ page }) => {
  await page.evaluate(() => window.showLegal('cgu'));
  await expect(page).toHaveURL(/#cgu$/);
  await expect(page).toHaveTitle(/Conditions Générales/);
  await page.reload();
  await expect(page.locator('#page-cgu')).toBeVisible();
  await expect(page.locator('#page-home')).toBeHidden();
  await expect(page).toHaveTitle(/Conditions Générales/);
});

test('confidentialité : restaurée au refresh', async ({ page }) => {
  await page.evaluate(() => window.showLegal('confidentialite'));
  await expect(page).toHaveURL(/#confidentialite$/);
  await page.reload();
  await expect(page.locator('#page-confidentialite')).toBeVisible();
});

test('profil pitmaster : URL + restauration au refresh', async ({ page }) => {
  // On cible un profil DÉMO connu par son texte (toujours présent, sans backend)
  // pour rester déterministe : en prod/CI, un vrai pitmaster pourrait être la
  // 1re carte et dépendrait du timing de chargement Supabase.
  await page.locator('.pcard', { hasText: 'Le Gros Fumeur' }).first().click();
  await expect(page.locator('#page-profil')).toBeVisible();
  await expect(page).toHaveURL(/#profil\//);
  const name = await page.locator('#profil-name').textContent();

  await expect(page).toHaveTitle(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  await page.reload();
  await expect(page.locator('#page-profil')).toBeVisible();
  await expect(page.locator('#profil-name')).toHaveText(name);
  await expect(page).toHaveTitle(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('retour à l’accueil : le hash est nettoyé', async ({ page }) => {
  await page.evaluate(() => window.showLegal('cgu'));
  await expect(page).toHaveURL(/#cgu$/);
  await page.evaluate(() => window.showPage('home'));
  await expect(page).toHaveURL((url) => !url.hash || url.hash === '');
  await expect(page.locator('#page-home')).toBeVisible();
});
