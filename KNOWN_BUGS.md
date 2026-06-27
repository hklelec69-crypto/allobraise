# KNOWN_BUGS.md — Bugs connus & dette technique

Suivi vivant des problèmes identifiés par audit. Mettre à jour le statut à
chaque correction. Sévérités : 🔴 critique · 🟠 importante · 🟡 mineure.

---

## ✅ Corrigés

| ID   | Sév. | Problème                                                                                                                  | Correctif                                                                                            |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| B-1  | 🔴   | `annonces` : insert sur colonne `email` inexistante (schéma = `user_email`) → toute publication échouait, table à 0 ligne | Insert corrigé en `user_email` + `user_prenom` (commit « Corrige 3 écritures… »)                     |
| B-2  | 🟠   | `submitAvis` : `catch(e){}` avalait l'erreur DB et affichait un succès → perte d'avis silencieuse                         | Rendu gaté sur absence d'erreur, sinon toast + bouton réactivé                                       |
| B-3  | 🟠   | Contact profil : email en fire-and-forget, succès via `setTimeout` quel que soit le résultat                              | Passé en `await`, succès lié au résultat réel, toast d'échec                                         |
| B-4  | 🔴   | Réservation d'un profil démo (sans email réel) routée en silence vers la boîte admin                                      | Réservation bloquée + message clair                                                                  |
| B-5  | 🟠   | Domaine : tout le code pointait vers `allobraise.fr` (non possédé, NXDOMAIN)                                              | Basculé vers `allôbraise.fr` / `xn--allbraise-i7a.fr`                                                |
| B-6  | 🟡   | Fallbacks `escHTML` en fonction identité (`s=>s`)                                                                         | Remplacés par un vrai échappement (entités numériques) — ex-B-OPEN-2                                 |
| B-7  | 🟡   | Abonnements temps réel non résiliés à la déconnexion (`v5-messagerie.js`)                                                 | `unsubscribe()` sur l'event `SIGNED_OUT` — ex-B-OPEN-3                                               |
| B-8  | 🟡   | ID dupliqué `v4-fav-chip` (statique + généré V4)                                                                          | Converti en classe `.v4-fav-chip`, sélecteur mis à jour — ex-B-OPEN-5                                |
| B-9  | 🔴   | Photo de profil : anciennes images en cache même après refresh (CDN cache par chemin, ignore `?v=`)                       | Chemin d'upload **unique** par photo (`avatar-<ts>.<ext>`) — URL jamais en cache                     |
| B-10 | 🔴   | Refresh de n'importe quelle page → retour forcé à l'accueil (aucune persistance d'URL)                                    | Module V7 de **routage par hash** (`#cgu`, `#profil/<clé>`…), restauré au load                       |
| B-11 | 🟡   | Lien de partage WhatsApp `target="_blank"` sans `rel="noopener"`                                                          | `rel="noopener"` ajouté                                                                              |
| B-12 | 🟡   | Tabler Icons chargé en `@latest` (risque de rupture amont)                                                                | Épinglé sur `@3.44.0` (= version servie par `@latest` ce jour, zéro changement visuel) — ex-B-OPEN-6 |

---

## 🔓 Ouverts (à traiter)

### B-OPEN-1 — 🟠 Visibilité des annonces (feature à moitié construite)

La RLS SELECT d'`annonces` (`annonces_select_own`) limite la lecture au
propriétaire ; aucun pitmaster ne peut parcourir les demandes. Le code ne fait
aucun `select` sur `annonces`. **Décision requise :** rendre les annonces
publiquement parcourables (nouvelle politique RLS `SELECT USING (true)` +
implémenter le listing côté code) — migration DB, accord utilisateur nécessaire.

### B-OPEN-4 — 🟡 Pas de debounce sur l'autocomplétion ville

`index.html:~3884` : `cityDrop.update()` à chaque frappe, **doublé** par un
`oninput` inline (ligne 460). Différé : le double chemin d'appel rend un
debounce risqué sans test fin de l'UX de recherche. Ajouter un debounce ~250 ms
en consolidant les deux chemins.

### B-OPEN-7 — 🟡 Accessibilité : contraste & taille des cibles tactiles

Lighthouse a11y = 91. Restent deux familles, toutes deux **décisions de marque /
design** (à valider visuellement par l'utilisateur) :

- **`color-contrast`** — 26 nœuds, dus à **deux couleurs de charte** sous le
  seuil WCAG AA (4.5:1 pour texte normal) :
  - `--muted #8C8070` (texte secondaire : `.stag`, `.btn-ghost`, libellés) →
    **3.39–3.86**. Fix possible : assombrir vers ~`#6B6052` (même teinte taupe,
    passe à ~6:1). **Mais** ne suffit pas à faire passer l'audit à lui seul.
  - `--fire #D4420A` (liens/onglets orange : `a[onclick]`, `.tab.active`,
    `.tab-count`) → **3.85–4.38**. C'est la couleur **identitaire** ; la changer
    impacte toute la marque → décision utilisateur requise (ou utiliser une
    nuance orange plus foncée _uniquement_ pour le texte sur fond clair).
- **`target-size`** — cibles tactiles < 44px sur mobile (chips de filtre,
  petits boutons) → ajustements CSS de layout à valider visuellement.

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
