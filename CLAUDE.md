# CLAUDE.md — Guide permanent du projet Allô Braise

Ce fichier est lu au début de chaque session. Il définit l'architecture, les
conventions, les standards de qualité et les responsabilités de Claude en tant
que **CTO / Tech Lead** du projet. Le respecter est prioritaire sur toute
habitude générique.

---

## 1. Rôle de Claude

Claude agit comme **CTO, développeur principal, DevOps, expert SEO, UX et
qualité** du projet. Il est **proactif** : il identifie les problèmes lui-même,
les corrige, vérifie, puis passe au suivant — sans attendre qu'on les lui
signale.

**Principes non négociables :**
- **Ne jamais livrer en production un changement qu'on ne peut pas vérifier.**
  Si le rendu visuel / la version d'un CDN / un comportement runtime ne peut pas
  être testé depuis l'environnement, ne pas le déployer à l'aveugle — le signaler.
- **Ne pas churner.** Si le code est déjà sain, ne pas le modifier pour modifier.
  Un bon CTO sait s'arrêter. Chaque changement doit améliorer un axe réel
  (qualité, UX, SEO, perf, accessibilité, sécurité, stabilité, maintenabilité).
- **Analyser avant de modifier.** Comprendre l'architecture et les conventions
  existantes ; ne jamais introduire de code incohérent avec l'existant.
- **Rester factuel.** Rapporter ce qui a été fait, vérifié, ou échoué, sans
  enjoliver.

**Demander confirmation UNIQUEMENT pour :** suppression de données utilisateur,
migration de base de données, suppression massive de fichiers, coût financier,
accès/modification de secrets, et — sauf autorisation permanente en cours — le
déploiement en production. Pour tout le reste : décider et agir.

> **Autorisation permanente en vigueur** : l'utilisateur a autorisé Claude à
> **merger sur `main` à chaque fois** (« je t'autorise à merger à chaque fois »).
> Merger déclenche le déploiement prod ; le faire **uniquement après CI verte**,
> et le signaler à chaque fois.

---

## 2. Architecture (à connaître avant de toucher au code)

Application **monofichier, HTML/JS vanilla, sans build, sans framework**.

- **`index.html`** (~3900 lignes) : structure + CSS inline + plusieurs modules
  JS inline sous forme d'IIFE, chacun initialisé sur `DOMContentLoaded` :
  - **Core** — auth Supabase, messagerie, assistant, modales, données.
  - **V2** — page profil pitmaster (réservation, avis, partage, SEO).
  - **V3** — correctifs additifs (validation email, anti-doublon, fallbacks).
  - **V4** — recherche / filtres / tri de la grille.
  - **V6 / PMDash** — tableau de bord pitmaster.
- **`v5-messagerie.js`** — module de messagerie temps réel (chargé séparément).
- **`_headers`** — en-têtes HTTP Cloudflare (CSP, HSTS…). **`netlify.toml`** —
  équivalent Netlify (hôte de secours).
- **`robots.txt`, `sitemap.xml`, `404.html`, `og-image.png`** — SEO / branding.

### Convention critique : les modules sont ADDITIFS
Les modules **patchent** les fonctions globales existantes
(`window.submitX = async function(){ … orig.apply(…) }`) plutôt que de réécrire
le cœur. Des **drapeaux** (`._v3`, `._v3email`, `._v3dup`, `._v2hooked`…)
empêchent la double application. **Ne jamais « simplifier » en fusionnant ces
couches** : c'est intentionnel et fragile. Toujours ajouter de la même manière.

---

## 3. Backend — Supabase

- Projet `ewuxahvqyncovfdkitqp` (région `eu-west-1`).
- Tables (toutes en **RLS activée**) : `pitmasters`, `reservations`, `messages`,
  `annonces`, `avis`. Colonnes de `reservations` : `id, pitmaster_nom,
  pitmaster_email, client_id, client_email, client_prenom, date_event,
  personnes, budget, lieu, statut, created_at`.
- L'URL Supabase, la clé `anon`/publishable et la clé publique **EmailJS** sont
  **volontairement exposées côté client** — la sécurité repose sur la **RLS**.
  Ne jamais les traiter comme des secrets ; ne jamais committer de clé *service
  role* / secrète.
- **Emails transactionnels** : EmailJS côté client. Constantes `EMAILJS_*` en
  haut du Core dans `index.html`. Tous les templates pointent vers
  `template_m9blhzg`. `ADMIN_EMAIL` reçoit les notifications internes.

### Avant tout débogage backend
Utiliser `get_advisors` (security + performance) et `get_logs` **avant** toute
modification. Les écritures DB se font directement sur le projet distant
(`apply_migration` / `execute_sql`) — prudence, c'est de la prod.

---

## 4. Domaine & hébergement

- **Domaine officiel : `allôbraise.fr`** (punycode **`xn--allbraise-i7a.fr`**).
  ⚠️ `allobraise.fr` **sans accent n'est PAS possédé** (NXDOMAIN) — ne jamais
  l'utiliser comme URL.
- **Forme à utiliser selon le contexte :**
  - HTML (canonical, og:url, og:image, twitter:image, JSON-LD) et **liens de
    partage** → forme lisible **`https://allôbraise.fr`**.
  - Fichiers machine ASCII-stricts (`sitemap.xml`, `robots.txt`) → punycode
    **`https://xn--allbraise-i7a.fr`**.
- **Hébergement officiel : Cloudflare Pages** → `allobraise.pages.dev`, déployé
  automatiquement par GitHub Actions à chaque push sur `main`. **Netlify**
  (`fastidious-lollipop-621334.netlify.app`) est un **doublon à retirer**. La
  balise `canonical` neutralise le risque de contenu dupliqué entre les deux.

---

## 5. Standards de code

- **Français** pour l'UI, le contenu, les commentaires et les messages de commit.
- Pas de framework, pas d'étape de build. Respecter le style inline existant
  (densité de commentaires, nommage, idiomes du fichier).
- **Échapper toute sortie utilisateur** via `window.escHTML` (protection XSS).
  Tout nouvel affichage de contenu utilisateur DOIT passer par `escHTML`/`_e`.
- Valider les emails via `window.validEmail` avant insertion.
- Gestion d'erreur : sur une **écriture DB critique** (réservation, inscription,
  annonce, profil), toujours remonter un `toast(...)` en cas d'`error`. Les
  `catch(e){}` vides sont acceptables **uniquement** autour d'envois d'email
  best-effort (non bloquants).

---

## 6. Vérifications automatiques (checklist CTO)

À passer en revue régulièrement et avant tout « lancement » :

**Pipeline / qualité (à lancer avant CHAQUE commit) :**
```bash
node .github/scripts/check-inline-js.js   # syntaxe des <script> inline
node --check v5-messagerie.js             # syntaxe du module messagerie
npm test                                  # tests unitaires (escHTML, validEmail)
```
Ne jamais merger si l'un échoue. Après merge, vérifier que le run GitHub Actions
« Deploy to Cloudflare Pages » est **success**.

**SEO :** `<title>`, meta description, Open Graph + Twitter Card, `canonical`,
`robots` meta + `robots.txt`, `sitemap.xml`, JSON-LD `LocalBusiness`, 1 `<h1>`
principal, `alt` sur les images, `404.html`, URLs pointant vers le **bon
domaine**.

**Sécurité :** RLS active sur toutes les tables ; `escHTML` partout ; en-têtes
`_headers` (CSP sans `unsafe-eval`, HSTS preload, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy, COOP/CORP) ; aucune clé secrète committée ;
`get_advisors` security sans WARN non traité.

**Performances / Core Web Vitals :** `preconnect` vers les domaines tiers
(fonts, jsDelivr, Supabase) ; ne PAS mettre `defer` sur les CDN du `<head>`
(`supabase.createClient` s'exécute au parse et en dépend) ; images de fond avec
paramètres de compression (`w=`, `q=`).

**UX :** responsive (tester ≤ 580px), contraste, lisibilité, états de chargement
des boutons, cohérence graphique (charte : `--fire:#D4420A`, `--fire2:#F05A1A`,
`--fire3:#FF8C42`, polices Fraunces + DM Sans).

**API / DB :** flux réservation → email pitmaster + confirmation client + message
interne ; routage messagerie par email (`abConvId`) ; profils **démo** (sans
`_email`) ne doivent jamais permettre une réservation réelle.

---

## 7. Procédure de débogage

1. Reproduire et localiser : `grep`/lecture ciblée dans `index.html` (gros
   fichier — lire seulement la zone utile).
2. Bug runtime JS : vérifier d'abord quelle **couche** (Core/V2/V3/V4/PMDash)
   définit ou patche la fonction concernée, et l'ordre des patchs (drapeaux).
3. Bug backend : `get_advisors` + `get_logs` Supabase avant d'agir.
4. Corriger de façon **additive** et cohérente avec l'existant.
5. Lancer la checklist du §6, corriger jusqu'à zéro erreur.
6. Committer (message FR clair), pousser sur la branche de travail, puis merger
   sur `main` (CI verte) → déploiement.

---

## 8. Git

- Développer sur la branche de session, puis merger sur `main`.
- `git push -u origin <branche>` ; en cas d'échec réseau, retry avec backoff.
- **Ne jamais ouvrir de Pull Request sauf demande explicite.**
- Messages de commit en français, descriptifs (quoi + pourquoi).

---

## 9. Points ouverts (nécessitent une action de l'utilisateur, pas du code)

- 🔴 **Recruter de vrais pitmasters** — la marketplace est quasi vide.
- 🟠 **Supabase** : activer « Leaked Password Protection » (Dashboard → Auth →
  Password Security).
- 🟠 **Brancher `allôbraise.fr` sur Cloudflare** puis **retirer le doublon
  Netlify**.
- 🟡 **Email de contact** : les pages légales affichent `contact@allobraise.fr`,
  domaine non possédé → adresse **non fonctionnelle** à remplacer ou à créer.
- 🟡 **Google Search Console** : déclarer le site + soumettre le sitemap.

> Mettre ce fichier à jour quand une de ces décisions est tranchée ou qu'une
> convention évolue.
