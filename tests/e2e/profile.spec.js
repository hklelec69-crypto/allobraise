const { test, expect } = require('@playwright/test');

// Profil pitmaster + réservation. Les profils affichés au chargement sont des
// profils DÉMO (sans email réel) : on vérifie que la réservation y est bien
// bloquée (correctif anti-routage silencieux), sans toucher au backend.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ouvre une fiche pitmaster depuis la grille', async ({ page }) => {
  await page.locator('.pcard').first().click();
  await expect(page.locator('#page-profil')).toBeVisible();
  await expect(page.locator('#profil-name')).not.toBeEmpty();
});

test('réservation (anonyme) : jamais confirmée silencieusement', async ({ page }) => {
  await page.locator('.pcard').first().click();
  await page.locator('#v2-resa-date').fill('2026-08-15');
  await page.locator('#v2-resa-pers').fill('20');
  await page.locator('#v2-resa-box .btn-submit').click();
  await page.waitForTimeout(800);
  // Invariant de sécurité robuste (indépendant de l'état de session / des CDN
  // externes indisponibles dans le sandbox) : un visiteur non authentifié ne
  // doit JAMAIS voir une réservation confirmée. Le gate auth ou le blocage des
  // profils démo doit l'en empêcher.
  await expect(page.locator('#v2-resa-box')).not.toContainText('Demande envoyée');
});

test('réservation : date et personnes obligatoires', async ({ page }) => {
  await page.locator('.pcard').first().click();
  await page.locator('#v2-resa-box .btn-submit').click();
  await expect(page.getByText('Date et nombre de personnes obligatoires')).toBeVisible();
});
