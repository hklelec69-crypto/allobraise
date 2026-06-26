const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// Flux nécessitant une VRAIE session authentifiée :
//   inscription complète · connexion · déconnexion · modification du profil ·
//   changement de photo de profil · création d'annonce (insert).
//
// Ils sont volontairement SKIP : les exécuter créerait de vrais comptes /
// annonces dans la base Supabase de PRODUCTION (il n'y a pas d'environnement de
// staging DB). Pour les activer :
//   1. Provisionner un projet Supabase de test (ou un schéma jetable).
//   2. Fournir des identifiants de test via variables d'env :
//        E2E_TEST_EMAIL, E2E_TEST_PASSWORD
//   3. Pointer l'app vers ce backend de test, puis remplacer `describe.skip`
//      par `describe` et implémenter les étapes ci-dessous.
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('Flux authentifiés (nécessitent un backend de test)', () => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  test('connexion → déconnexion', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Connexion' }).click();
    await page.locator('#m-email').fill(email);
    await page.locator('#m-pw').fill(password);
    await page.locator('#m-login-submit').click();
    await expect(page.getByText(/Bienvenue/i)).toBeVisible();
    // … puis déconnexion via le menu compte, vérifier le retour à l'état déconnecté.
  });

  test('modification du profil pitmaster', async () => {
    // Ouvrir le dashboard pitmaster, éditer nom/spécialité/tarif, sauvegarder,
    // vérifier la persistance après rechargement.
  });

  test('changement de photo de profil', async () => {
    // setInputFiles sur l'input photo, vérifier l'aperçu + la mise à jour de photo_url.
  });

  test("création d'annonce (insert réel)", async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.openModal('annonce'));
    await page.locator('#an-titre').fill('BBQ test E2E');
    await page.locator('#an-email').fill(email);
    await page.getByRole('button', { name: 'Publier gratuitement' }).click();
    await expect(page.getByText(/en ligne/i)).toBeVisible();
  });
});
