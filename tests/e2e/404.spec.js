const { test, expect } = require('@playwright/test');

// La page 404 de marque (servie par Cloudflare Pages en production).

test('la page 404 de marque s’affiche et renvoie vers l’accueil', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('.code')).toHaveText('404');
  await expect(page.getByText(/cendres/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/');
});
