# Allô Braise 🔥

Plateforme de mise en relation entre **experts BBQ (« pitmasters »)** et **clients**
souhaitant un barbecue à domicile, partout en France. Sans traiteur, sans frais
cachés : le paiement se fait directement entre le client et le pitmaster.

> Production : **https://allôbraise.fr** (domaine `xn--allbraise-i7a.fr`)

---

## Architecture

Application **monofichier en HTML/JS vanilla**, sans étape de build ni framework.

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application : structure, styles inline, et modules JS inline. |
| `v5-messagerie.js` | Module de messagerie temps réel (chargé séparément). |
| `robots.txt` / `sitemap.xml` | Référencement. |
| `_headers` | En-têtes HTTP Cloudflare Pages (dont la CSP). |
| `netlify.toml` | En-têtes pour un déploiement Netlify (hérité — voir ci-dessous). |
| `.github/workflows/deploy-cloudflare-pages.yml` | CI + déploiement. |
| `.github/scripts/check-inline-js.js` | Vérifie la syntaxe de chaque `<script>` inline. |
| `test/utils.test.js` | Tests unitaires (`escHTML`, `validEmail`). |

### Modules JS inline

Le JavaScript est organisé en plusieurs IIFE (« modules ») additifs, chacun
initialisé sur `DOMContentLoaded` via son propre `init()` :

- **Core** — auth Supabase, messagerie, assistant, modales.
- **V2** — page profil pitmaster : réservation, avis, partage, injection SEO.
- **V3** — correctifs additifs : validation email, anti-doublon, fallbacks.
- **V4** — recherche / filtres / tri de la grille de pitmasters.
- **V6 / PMDash** — tableau de bord pitmaster (stats, demandes, profil).

Le principe est **additif** : les modules patchent les fonctions globales
existantes (`window.submitX = …`) sans réécrire le cœur, avec des drapeaux
(`._v3`, `._v3email`, …) pour éviter la double application.

---

## Backend — Supabase

Projet Supabase (région `eu-west-1`). Toutes les tables ont la **RLS activée**.

| Table | Contenu |
|---|---|
| `pitmasters` | Profils d'experts BBQ réels. |
| `reservations` | Demandes de réservation client → pitmaster. |
| `messages` | Messagerie interne (routée par email). |
| `annonces` | Annonces publiées par les clients. |
| `avis` | Avis laissés sur les pitmasters. |

Les identifiants client (URL Supabase + clé `anon` publishable) et la clé
publique EmailJS sont volontairement présents côté client — ils sont **conçus
pour être publics** ; la sécurité repose sur les politiques RLS.

### Emails transactionnels — EmailJS

Les emails (notifications d'inscription, de réservation, confirmation client,
nouveaux messages) sont envoyés **côté client via EmailJS**, sans backend. Voir
les constantes `EMAILJS_*` en haut du premier module dans `index.html`.

---

## Développement

Aucune dépendance à installer pour faire tourner le site : il suffit d'ouvrir
`index.html` (ou de le servir en statique).

```bash
# Servir en local
python3 -m http.server 8000   # puis http://localhost:8000

# Vérifications (identiques à la CI)
node .github/scripts/check-inline-js.js   # syntaxe des <script> inline
node --check v5-messagerie.js             # syntaxe du module messagerie
npm test                                  # tests unitaires
```

---

## Déploiement

Push sur `main` → **GitHub Actions** lance la CI (syntaxe + tests) puis
déploie sur **Cloudflare Pages** (projet `allobraise`). Aucun déploiement
manuel n'est nécessaire.

Secrets requis dans le dépôt GitHub :

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

> **Domaine & hébergement** : le domaine officiel est **`allôbraise.fr`**
> (punycode `xn--allbraise-i7a.fr`), actuellement servi par **Netlify** (le repo
> y est auto-déployé via `netlify.toml`). Le pipeline GitHub Actions déploie en
> parallèle sur Cloudflare Pages (`allobraise.pages.dev`), qui sert de secours.
> La balise `canonical` pointe vers le domaine officiel pour éviter tout contenu
> dupliqué entre les deux hôtes. Le domaine `allobraise.fr` (sans accent) n'est
> pas possédé : toutes les URL machine utilisent la forme punycode ; les
> métadonnées HTML et liens de partage utilisent la forme lisible `allôbraise.fr`.

---

## Conformité

Pages légales intégrées (accessibles depuis le pied de page) :

- **CGU**
- **Politique de confidentialité** — conforme RGPD (UE 2016/679)
- **Mentions légales**

Allô Braise ne perçoit, ne détient ni ne transfère aucun fonds : le paiement
est réglé directement entre le client et le pitmaster.

---

## Sécurité

- Sorties utilisateur échappées via `escHTML` (protection XSS).
- `Content-Security-Policy` sans `unsafe-eval` (définie dans `_headers`).
  `unsafe-inline` reste nécessaire tant que le JS/CSS est inline.
- RLS active sur toutes les tables.
- Signalement de contenu illicite : `contact@allobraise.fr`.
