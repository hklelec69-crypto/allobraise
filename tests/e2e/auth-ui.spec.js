const { test, expect } = require('@playwright/test');

// Tests de l'UI d'authentification SANS backend : on vérifie l'ouverture des
// modales, le passage de l'une à l'autre et la validation côté client (qui
// s'exécute AVANT tout appel Supabase). On ne crée jamais de vrai compte ici
// (cela polluerait la base de production) — voir authenticated.spec.js.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ouvre la modale de connexion', async ({ page }) => {
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page.locator('#modal-box')).toContainText('Connexion');
  await expect(page.locator('#m-email')).toBeVisible();
  await expect(page.locator('#m-pw')).toBeVisible();
});

test('ouvre la modale d’inscription', async ({ page }) => {
  // openModal via evaluate (robuste, comme annonce/navigation) — le clic réel
  // du bouton nav est déjà couvert par le test « ouvre la modale de connexion »
  // et « bascule connexion → inscription ».
  await page.evaluate(() => window.openModal('inscription'));
  await expect(page.locator('#modal-box')).toContainText(/Rejoindre Allo Braise/);
  await expect(page.locator('#m-prenom')).toBeVisible();
  await expect(page.locator('#m-role')).toBeVisible();
});

test('bascule connexion → inscription', async ({ page }) => {
  await page.getByRole('button', { name: 'Connexion' }).click();
  await page.locator('#modal-box').getByText('Inscription gratuite').click();
  await expect(page.locator('#m-prenom')).toBeVisible();
});

test('inscription : validation des champs obligatoires (sans backend)', async ({ page }) => {
  await page.evaluate(() => window.openModal('inscription'));
  await page.locator('#m-register-submit').click();
  // La validation client doit afficher un message avant tout appel réseau.
  await expect(page.getByText('Prénom et email obligatoires')).toBeVisible();
});

test('connexion : validation avant appel réseau', async ({ page }) => {
  await page.getByRole('button', { name: 'Connexion' }).click();
  await page.locator('#m-login-submit').click();
  await expect(page.getByText('Email et mot de passe obligatoires')).toBeVisible();
});
