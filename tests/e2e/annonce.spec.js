const { test, expect } = require('@playwright/test');

// Modale "Poster une annonce" : on teste l'ouverture et la validation client.
// La création réelle (insert Supabase) n'est pas testée ici pour ne pas écrire
// dans la base de production — voir authenticated.spec.js.

test('ouvre la modale annonce et valide les champs obligatoires', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.openModal('annonce'));
  await expect(page.locator('#an-titre')).toBeVisible();
  await expect(page.locator('#an-email')).toBeVisible();

  // Soumission vide → message de validation, aucun appel réseau.
  await page.getByRole('button', { name: 'Publier gratuitement' }).click();
  await expect(page.getByText('Titre et email obligatoires')).toBeVisible();
});

test('module de navigation des annonces (V8) chargé, grille intacte', async ({ page }) => {
  await page.goto('/');
  // Le module V8 expose son API et ne casse pas la grille d'annonces démo.
  await expect.poll(() => page.evaluate(() => typeof window.V8?.loadRealAnnonces)).toBe('function');
  // La grille d'annonces est dans l'onglet « Annonces » (inactif par défaut).
  await page.locator('button.tab', { hasText: 'Annonces' }).click();
  await expect(page.locator('#grid-ann .acard').first()).toBeVisible();
});
