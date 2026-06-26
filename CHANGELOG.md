# CHANGELOG

Toutes les évolutions notables du projet. Format inspiré de *Keep a Changelog*.
Dates au format AAAA-MM-JJ.

## [Non daté — itération CTO] — 2026-06

### Corrigé
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

### Ajouté
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
