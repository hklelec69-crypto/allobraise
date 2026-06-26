# KNOWN_BUGS.md — Bugs connus & dette technique

Suivi vivant des problèmes identifiés par audit. Mettre à jour le statut à
chaque correction. Sévérités : 🔴 critique · 🟠 importante · 🟡 mineure.

---

## ✅ Corrigés

| ID  | Sév. | Problème                                                                                                                  | Correctif                                                                        |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| B-1 | 🔴   | `annonces` : insert sur colonne `email` inexistante (schéma = `user_email`) → toute publication échouait, table à 0 ligne | Insert corrigé en `user_email` + `user_prenom` (commit « Corrige 3 écritures… ») |
| B-2 | 🟠   | `submitAvis` : `catch(e){}` avalait l'erreur DB et affichait un succès → perte d'avis silencieuse                         | Rendu gaté sur absence d'erreur, sinon toast + bouton réactivé                   |
| B-3 | 🟠   | Contact profil : email en fire-and-forget, succès via `setTimeout` quel que soit le résultat                              | Passé en `await`, succès lié au résultat réel, toast d'échec                     |
| B-4 | 🔴   | Réservation d'un profil démo (sans email réel) routée en silence vers la boîte admin                                      | Réservation bloquée + message clair                                              |
| B-5 | 🟠   | Domaine : tout le code pointait vers `allobraise.fr` (non possédé, NXDOMAIN)                                              | Basculé vers `allôbraise.fr` / `xn--allbraise-i7a.fr`                            |

---

## 🔓 Ouverts (à traiter)

### B-OPEN-1 — 🟠 Visibilité des annonces (feature à moitié construite)

La RLS SELECT d'`annonces` (`annonces_select_own`) limite la lecture au
propriétaire ; aucun pitmaster ne peut parcourir les demandes. Le code ne fait
aucun `select` sur `annonces`. **Décision requise :** rendre les annonces
publiquement parcourables (nouvelle politique RLS `SELECT USING (true)` +
implémenter le listing côté code) — migration DB, accord utilisateur nécessaire.

### B-OPEN-2 — 🟡 Fallbacks `escHTML` en fonction identité

Lignes ~1890, 1950, 2260, 2279 : `const _e = window.escHTML || (s=>s)`. Inactif
au runtime (`escHTML` toujours défini via DOMContentLoaded) donc **pas de XSS
active**, mais faiblesse défensive. Remplacer le fallback par un véritable
échappement.

### B-OPEN-3 — 🟡 Abonnements temps réel non résiliés à la déconnexion

`v5-messagerie.js` : `.unsubscribe()` absent dans le flux `signOut` → listeners
fantômes possibles après reconnexion. Ajouter le nettoyage sur changement d'état
auth.

### B-OPEN-4 — 🟡 Pas de debounce sur l'autocomplétion ville

`index.html:~3870` : `cityDrop.update()` à chaque frappe. Ajouter un debounce
~250 ms.

### B-OPEN-5 — 🟡 ID potentiellement dupliqué `v4-fav-chip`

`index.html:599` (statique) et `~2885` (généré V4). Impact faible
(`toggleFav(this)` utilise l'élément cliqué). À dédupliquer par propreté.

### B-OPEN-6 — 🟡 Tabler Icons en `@latest`

CDN non épinglé → risque de rupture si une version amont casse. Épingler une
version (à faire quand on peut vérifier le rendu).

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
