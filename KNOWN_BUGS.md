# KNOWN_BUGS.md — Bugs connus & dette technique

Suivi vivant des problèmes identifiés par audit. Mettre à jour le statut à
chaque correction. Sévérités : 🔴 critique · 🟠 importante · 🟡 mineure.

---

## ✅ Corrigés

| ID   | Sév. | Problème                                                                                                                  | Correctif                                                                                                                   |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| B-1  | 🔴   | `annonces` : insert sur colonne `email` inexistante (schéma = `user_email`) → toute publication échouait, table à 0 ligne | Insert corrigé en `user_email` + `user_prenom` (commit « Corrige 3 écritures… »)                                            |
| B-2  | 🟠   | `submitAvis` : `catch(e){}` avalait l'erreur DB et affichait un succès → perte d'avis silencieuse                         | Rendu gaté sur absence d'erreur, sinon toast + bouton réactivé                                                              |
| B-3  | 🟠   | Contact profil : email en fire-and-forget, succès via `setTimeout` quel que soit le résultat                              | Passé en `await`, succès lié au résultat réel, toast d'échec                                                                |
| B-4  | 🔴   | Réservation d'un profil démo (sans email réel) routée en silence vers la boîte admin                                      | Réservation bloquée + message clair                                                                                         |
| B-5  | 🟠   | Domaine : tout le code pointait vers `allobraise.fr` (non possédé, NXDOMAIN)                                              | Basculé vers `allôbraise.fr` / `xn--allbraise-i7a.fr`                                                                       |
| B-6  | 🟡   | Fallbacks `escHTML` en fonction identité (`s=>s`)                                                                         | Remplacés par un vrai échappement (entités numériques) — ex-B-OPEN-2                                                        |
| B-7  | 🟡   | Abonnements temps réel non résiliés à la déconnexion (`v5-messagerie.js`)                                                 | `unsubscribe()` sur l'event `SIGNED_OUT` — ex-B-OPEN-3                                                                      |
| B-8  | 🟡   | ID dupliqué `v4-fav-chip` (statique + généré V4)                                                                          | Converti en classe `.v4-fav-chip`, sélecteur mis à jour — ex-B-OPEN-5                                                       |
| B-9  | 🔴   | Photo de profil : anciennes images en cache même après refresh (CDN cache par chemin, ignore `?v=`)                       | Chemin d'upload **unique** par photo (`avatar-<ts>.<ext>`) — URL jamais en cache                                            |
| B-10 | 🔴   | Refresh de n'importe quelle page → retour forcé à l'accueil (aucune persistance d'URL)                                    | Module V7 de **routage par hash** (`#cgu`, `#profil/<clé>`…), restauré au load                                              |
| B-11 | 🟡   | Lien de partage WhatsApp `target="_blank"` sans `rel="noopener"`                                                          | `rel="noopener"` ajouté                                                                                                     |
| B-12 | 🟡   | Tabler Icons chargé en `@latest` (risque de rupture amont)                                                                | Épinglé sur `@3.44.0` (= version servie par `@latest` ce jour, zéro changement visuel) — ex-B-OPEN-6                        |
| B-13 | 🟠   | Annonces non parcourables (RLS lecture = propriétaire) → côté demande inerte                                              | Migration 001 : lecture publique + vue `annonces_public` RGPD (PII protégée) + module V8 (listing + répondre) — ex-B-OPEN-1 |
| B-14 | 🟠   | Aucune dégradation si le CDN Supabase tombe → tout le Core mourait (`supabase is not defined`)                            | Init **gardée** + stub `{data,error}` + bannière « service indisponible » → l'UI survit (vérifié : `openModal` OK CDN KO)   |
| B-15 | 🟡   | Pas de debounce sur l'autocomplétion ville (`update` appelé 2×/frappe)                                                    | `update` debouncé (200 ms) + listener `input` redondant retiré — ex-B-OPEN-4                                                |
| B-16 | 🟡   | `target-size` : liens du footer < 24px (cibles tactiles mobile)                                                           | Padding vertical sur `.footer-col a` (~36px) → audit `target-size` vert, **a11y 95 → 100** — ex-B-OPEN-7                    |

---

## 🔓 Ouverts (à traiter — code)

**Aucun.** Tous les bugs code identifiés par audit sont corrigés.
Accessibilité Lighthouse = **100**, color-contrast et target-size au vert.

Restent uniquement des items inhérents à l'architecture **sans build** (JS/CSS
non minifiés, règles CSS inutilisées) — les corriger imposerait une étape de
build, contraire à la convention monofichier. Non bloquant.

---

## 🌐 Hors-code (action utilisateur / infra)

| ID    | Sév. | Point                                                                 |
| ----- | ---- | --------------------------------------------------------------------- |
| OPS-1 | 🔴   | Marketplace quasi vide (1 pitmaster, 0 avis) — recrutement            |
| OPS-2 | 🟠   | Supabase : activer « Leaked Password Protection » (Dashboard)         |
| OPS-3 | 🟠   | `contact@allobraise.fr` injoignable (domaine sans accent non possédé) |
| OPS-4 | 🟠   | Brancher `allôbraise.fr` sur Cloudflare + retirer le doublon Netlify  |
| OPS-5 | 🟡   | Déclarer le site sur Google Search Console + soumettre le sitemap     |

---

## Faux positifs écartés (vérifiés)

- IDs `m-email`/`m-pw` « dupliqués » → branches `innerHTML` mutuellement
  exclusives de `openModal()`, jamais simultanées.
- Colonnes `pitmasters`/`avis`/`reservations`/`messages` → toutes valides.
- « XSS critique escHTML » → surévalué (cf. B-OPEN-2).
