// Accessibilité WCAG automatisée (moteur axe-core, injecté depuis node_modules
// — aucun accès réseau requis). La CI échoue si une violation sérieuse ou
// critique apparaît sur les vues principales.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const VUES = [
  { nom: 'accueil', hash: '' },
  { nom: 'faq', hash: '#faq' },
  { nom: 'devenir-expert', hash: '#devenir-expert' },
  { nom: 'cgu', hash: '#cgu' },
];

for (const vue of VUES) {
  test(`a11y : aucune violation sérieuse/critique sur ${vue.nom}`, async ({ page }) => {
    await page.goto('/' + vue.hash);
    await page.waitForTimeout(600); // laisse le routeur restaurer la vue

    const resultats = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const graves = resultats.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(graves.map((v) => `${v.id} (${v.impact}) : ${v.nodes.length} occurrence(s)`)).toEqual(
      [],
    );
  });
}
