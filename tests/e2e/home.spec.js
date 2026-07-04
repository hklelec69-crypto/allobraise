const { test, expect } = require('@playwright/test');

test.describe("Page d'accueil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('charge avec le bon titre et le hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Allo Braise/);
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('affiche la grille de pitmasters (données démo)', async ({ page }) => {
    const cards = page.locator('.pcard');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(3);
  });

  test('le champ de recherche ville est présent', async ({ page }) => {
    await expect(page.locator('#ville-input')).toBeVisible();
  });

  test('métadonnées SEO essentielles présentes', async ({ page }) => {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    // 2 blocs de données structurées : LocalBusiness + FAQPage
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });
});
