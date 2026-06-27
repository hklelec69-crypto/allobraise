# CHANGELOG

Toutes les évolutions notables du projet. Format inspiré de _Keep a Changelog_.
Dates au format AAAA-MM-JJ.

## [Non daté — itération CTO] — 2026-06

### Corrigé

- **Résilience CDN Supabase** : si le SDK (CDN) ne se charge pas, l'app ne meurt
  plus (`supabase is not defined`). Init **gardée** + stub renvoyant `{data,
error}` (gestion d'erreur existante) + bannière « service indisponible » →
  l'UI reste utilisable. Vérifié : `openModal` fonctionne CDN coupé.
- **Accessibilité 100** : `target-size` corrigé (padding vertical sur les liens
  du footer ≥ tap target) → Lighthouse a11y **95 → 100**.
- **Recherche ville** : `cityDrop.update` debouncé (200 ms) + suppression du
  listener `input` redondant (l'appel était fait 2×/frappe).

- **annonces** : insert sur colonne `email` inexistante (schéma = `user_email`)
  → chaque publication échouait. Corrigé en `user_email` + `user_prenom`.
- **avis** : erreur DB avalée par un `catch` vide avec succès affiché malgré
  tout → perte silencieuse. Rendu désormais gaté sur l'absence d'erreur.
- **contact profil** : email en fire-and-forget + succès via `setTimeout`
  inconditionnel → passé en `await`, succès lié au résultat réel.
- **réservation** : un profil démo (sans email réel) routait la demande en
  silence vers la boîte admin → action bloquée avec message clair, + retour
  visible si l'enregistrement Supabase échoue.
- **domaine** : toutes les URL pointaient vers `allobraise.fr` (non possédé,
  NXDOMAIN). Basculées vers `allôbraise.fr` (HTML/partage) et
  `xn--allbraise-i7a.fr` (sitemap/robots).
- **robustesse** : fallbacks `escHTML` (`s=>s`) remplacés par un vrai
  échappement ; abonnements temps réel résiliés à la déconnexion
  (`SIGNED_OUT`) ; id dupliqué `v4-fav-chip` converti en classe.
- **accessibilité** : `aria-label` ajoutés aux boutons icône-seule (fermer
  messagerie, retour, envoyer) et au champ de recherche ville.
- **images en cache** (🔴) : la photo de profil était écrite sur un chemin
  stable (`avatar.<ext>`) avec un cache-bust `?v=` que le CDN Supabase Storage
  ignore (cache par chemin) → anciennes photos persistantes. Corrigé par un
  **chemin unique par upload** (`avatar-<timestamp>.<ext>`).
- **refresh → accueil** (🔴) : aucune persistance d'URL (pas de hash/history) ;
  toute actualisation retombait sur l'accueil. Ajout d'un **module de routage
  par hash** (V7, additif) : `#cgu`, `#confidentialite`, `#mentions`, `#faq`,
  `#profil/<clé>`. La vue est restaurée au chargement (profils réels chargés en
  asynchrone gérés par retry). 4 tests E2E de persistance ajoutés.
- **partage** : `rel="noopener"` ajouté au lien WhatsApp `target="_blank"`.
- **SEO/UX** : titre de page dynamique par vue (`<title>` mis à jour pour les
  pages légales et les profils via le routeur V7) — meilleurs onglets, favoris,
  partages.
- **accessibilité** : `aria-label` sur les `<select>` (filtres budget/tri,
  rôle d'inscription). Score Lighthouse a11y 84 → 91.
- **stabilité** : Tabler Icons épinglé sur `@3.44.0` (au lieu de `@latest`) —
  supprime le risque de rupture amont, version identique à celle servie ce jour.
- **accessibilité (contraste) — résolu** : `--muted` assombri `#8C8070` →
  `#6B6052` ; texte/onglets orange sur fond clair → nouvelle variable
  `--fire-text #B83909` ; lien FAQ sur fond foncé → `--fire3 #FF8C42`. Les
  boutons gardent le vif `--fire`. Audit `color-contrast` au vert, **a11y
  Lighthouse 77 → 95**.

### Ajouté

- **Annonces clients parcourables** (côté demande de la marketplace) :
  - Migration DB 001 — lecture publique des annonces + **vue `annonces_public`
    RGPD** (`SECURITY INVOKER`, sans `user_email`/`user_prenom`) ; colonnes PII
    protégées au niveau privilèges (vérifié). Aucune fuite d'email.
  - Module **V8** (additif) — affiche les vraies annonces dans l'onglet, bouton
    **Répondre** qui ouvre une conversation routée par `user_id` (email jamais
    exposé). Contenu utilisateur échappé, listeners attachés en JS (pas d'inline).

- **SEO** : JSON-LD `LocalBusiness` statique dans le `<head>`, `robots.txt`,
  `sitemap.xml`, `preconnect` vers fonts/jsDelivr/Supabase.
- **Branding** : OG image de marque 1200×630 (`og-image.png`) générée via
  Chromium headless, référencée par `og:image`/`twitter:image`/JSON-LD.
- **UX** : page `404.html` de marque (servie par Cloudflare Pages).
- **Emails** : confirmation client à l'envoi d'une demande de réservation.
- **Documentation** : `README.md`, `CLAUDE.md`, `DATABASE.md`, `KNOWN_BUGS.md`,
  ce `CHANGELOG.md`.
- **CI** : le vérificateur de syntaxe inline ignore les `<script>` non-JS
  (JSON-LD).
- **Outillage qualité** : ESLint, Prettier, Playwright (17 tests E2E), Husky
  (pre-commit), Lighthouse, workflow CI dédié, scripts npm (`lint`, `format`,
  `test:e2e`, `check`, `audit`), `TESTING.md`.

### Sécurité

- Vérifié : en-têtes `_headers` complets (CSP sans `unsafe-eval`, HSTS preload,
  COOP/CORP, Permissions-Policy), RLS active et optimisée sur toutes les tables,
  échappement `escHTML` des sorties utilisateur.

---

## Antérieur (résumé)

- Connexion Gmail via Zapier (envoi d'emails directs).
- Corrections XSS (sorties non échappées : signup, login, messagerie,
  réservation, panel demandes, loader homepage).
- Tests unitaires (`escHTML`, `validEmail`) + gate CI avant déploiement.
- Durcissement CSP (suppression d'`unsafe-eval`).
- Corrections RLS Storage / photo de profil pitmaster.
