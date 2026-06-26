const { test, expect } = require('@playwright/test');

// Navigation + pages légales (rendues côté client via showLegal/showPage).

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('accède aux CGU puis revient à l’accueil', async ({ page }) => {
  await page.evaluate(() => window.showLegal('cgu'));
  await expect(page.locator('#page-cgu')).toBeVisible();
  await expect(page.locator('#page-cgu')).toContainText(/Conditions Générales/i);
  await page.evaluate(() => window.showPage('home'));
  await expect(page.locator('#page-home')).toBeVisible();
});

test('accède à la politique de confidentialité (RGPD)', async ({ page }) => {
  await page.evaluate(() => window.showLegal('confidentialite'));
  await expect(page.locator('#page-confidentialite')).toContainText(/RGPD|confidentialité/i);
});

test('accède aux mentions légales', async ({ page }) => {
  await page.evaluate(() => window.showLegal('mentions'));
  await expect(page.locator('#page-mentions')).toContainText(/Mentions Légales/i);
});
