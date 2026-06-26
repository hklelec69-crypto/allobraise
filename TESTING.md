# TESTING.md — Qualité, tests & outils

Outils installés et leur usage. Tout est **dev-only** : le site déployé reste
un statique sans build.

## Installation

```bash
npm install        # installe les devDependencies + active les hooks Husky
```

## Scripts npm

| Script                 | Rôle                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`        | **Gate rapide** : syntaxe des `<script>` inline de `index.html` + `node --check v5-messagerie.js` + tests unitaires. Lancé par le hook pre-commit et la CI. |
| `npm test`             | Tests unitaires Node (`escHTML`, `validEmail`).                                                                                                             |
| `npm run test:e2e`     | Tests end-to-end Playwright (Chromium).                                                                                                                     |
| `npm run lint`         | ESLint sur les JS autonomes (module, tests, scripts).                                                                                                       |
| `npm run lint:fix`     | ESLint avec correction automatique.                                                                                                                         |
| `npm run format`       | Prettier (écrit). **N'affecte pas** `index.html`/`v5-messagerie.js` (cf. `.prettierignore`).                                                                |
| `npm run format:check` | Vérifie le formatage sans modifier.                                                                                                                         |
| `npm run audit`        | Audit Lighthouse → `lighthouse-report.html` + scores en console.                                                                                            |

## ESLint

Config plate `eslint.config.mjs`. Ne lint **pas** `index.html` (le JS inline est
validé par `.github/scripts/check-inline-js.js`). Cible `v5-messagerie.js`, les
tests et les scripts.

## Prettier

Config `.prettierrc.json`. `index.html` et `v5-messagerie.js` sont **exclus**
volontairement (fichiers compacts écrits à la main — un reformatage produirait
un diff massif et risqué).

## Playwright (E2E)

Config `playwright.config.js`. Sert le site via `python3 -m http.server` et
utilise le Chromium **pré-installé** localement (`/opt/pw-browsers`) ou celui
géré par Playwright en CI.

Couverture actuelle (sans backend, pour ne pas polluer la base de production) :

- `home.spec.js` — chargement, hero, grille de pitmasters, métadonnées SEO.
- `auth-ui.spec.js` — modales connexion/inscription, bascule, validation client.
- `profile.spec.js` — ouverture d'une fiche, réservation **bloquée** sur profil démo.
- `annonce.spec.js` — modale annonce + validation.
- `navigation.spec.js` — pages légales (CGU, confidentialité, mentions).
- `404.spec.js` — page 404 de marque.
- `authenticated.spec.js` — flux nécessitant une vraie session
  (connexion/déconnexion, édition profil, photo, création d'annonce) :
  **`describe.skip`**. Les activer requiert un backend Supabase de test et
  `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (voir le fichier).

## Husky (pre-commit)

`.husky/pre-commit` lance `lint-staged` (eslint/prettier sur les fichiers
indexés) puis `npm run check`. Empêche de committer du JS inline invalide ou des
tests cassés.

## CI

`.github/workflows/ci.yml` : lint + format check + `check` + E2E sur push/PR.
Le déploiement (`deploy-cloudflare-pages.yml`) reste séparé et conserve son
propre gate.

## Lighthouse

`npm run audit` génère `lighthouse-report.html` (performance, accessibilité,
bonnes pratiques, SEO). À lancer ponctuellement, pas dans le gate de commit.
