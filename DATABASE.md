# DATABASE.md — Schéma & sécurité des données

Backend **Supabase** (Postgres), projet `ewuxahvqyncovfdkitqp`, région
`eu-west-1`. Toutes les tables sont en **RLS activée**. La sécurité repose
entièrement sur les politiques ci-dessous (la clé `anon` est publique côté
client). Document de référence — tenir à jour à chaque changement de schéma.

> ⚠️ Le code applicatif doit **toujours** utiliser exactement ces noms de
> colonnes. Un nom erroné fait échouer l'écriture en silence (cf. le bug
> historique `annonces.email` → `user_email`, voir KNOWN_BUGS.md).

---

## Tables & colonnes

### `pitmasters` — profils d'experts BBQ

`id, nom, ville, specialite, tarif, description, email, user_id, actif,
created_at, photo_url, last_seen`

### `reservations` — demandes de réservation

`id, pitmaster_nom, pitmaster_email, client_id, client_email, client_prenom,
date_event, personnes, budget, lieu, statut, created_at`

- `statut` : `attente` → `acceptee` / `refusee`.

### `messages` — messagerie interne (routée par email)

`id, conversation_id, from_user, to_user, message, pitmaster_name, lu,
created_at`

- `conversation_id` = `abConvId(emailClient, emailPitmaster)` (clé canonique).
- `from_user` = `auth.uid()` ; `to_user` = email du destinataire.

### `annonces` — demandes publiées par les clients

`id, user_id, user_email, user_prenom, titre, ville, date_event, personnes,
budget, description, created_at`

- ⚠️ Colonne email = **`user_email`** (et non `email`).

### `avis` — avis sur les pitmasters

`id, pitmaster_nom, auteur, note, texte, client_id, created_at`

- `note` : entier 1–5.

---

## Politiques RLS (résumé exact)

| Table          | INSERT (with check) | SELECT                                                       | UPDATE                    |
| -------------- | ------------------- | ------------------------------------------------------------ | ------------------------- |
| `pitmasters`   | `user_id = uid`     | `actif = true` **OU** propriétaire — `email` masqué à `anon` | propriétaire (`user_id`)  |
| `reservations` | `client_id = uid`   | client **OU** pitmaster (par email/uid)                      | client **OU** pitmaster   |
| `messages`     | `from_user = uid`   | expéditeur **OU** destinataire                               | destinataire (marquer lu) |
| `avis`         | `client_id = uid`   | **public** (`true`)                                          | —                         |
| `annonces`     | `user_id = uid`     | **public** (`true`) — colonnes PII protégées                 | —                         |

Les politiques utilisent la forme optimisée `(select auth.uid())` (pas de
ré-évaluation par ligne).

### Durcissement anti-fraude (INSERT liés à l'utilisateur)

Chaque `INSERT` est **lié à l'utilisateur authentifié** : la ligne doit porter
son propre identifiant (`client_id`/`user_id = auth.uid()`). Avant, les policies
ne vérifiaient que `auth.uid() IS NOT NULL`, ce qui permettait à tout compte
connecté de **forger** de faux avis, réservations, annonces ou profils au nom
d'autrui. Vérifié : insert légitime accepté, insert au nom d'un tiers refusé
(`42501`). Reste ouvert (roadmap) : les avis ne sont pas encore **gated** sur une
transaction réelle (`pitmaster_nom` est du texte libre).

### `pitmasters.email` — masqué aux visiteurs anonymes (RGPD / anti-scraping)

La grille publique exposait l'email de chaque pitmaster actif à tout visiteur.
Le privilège `SELECT` sur la colonne `email` est désormais **révoqué pour `anon`**
(revoke table + grant colonne par colonne sauf `email`, comme pour `annonces`).
`authenticated` le conserve (flux de réservation). Côté code, la grille charge
des **colonnes explicites sans `email`** ; l'email réel est récupéré à la demande
via `window.resolvePitEmail()` lors d'une action connectée. Masquage total
(même pour `authenticated`) = nécessiterait un **relais email côté serveur** —
voir roadmap.

### Annonces parcourables — vue publique RGPD (migration 001)

Les annonces sont **publiquement parcourables** (politique `annonces_public_browse`
`USING (true)`), MAIS les colonnes **`user_email` / `user_prenom` sont protégées
au niveau privilèges** : `anon` et `authenticated` n'ont le `SELECT` que sur les
colonnes non personnelles. Un `select user_email from annonces` est donc **refusé**
(vérifié via `has_column_privilege`).

- **Vue `public.annonces_public`** (`SECURITY INVOKER`) : `id, user_id, titre,
ville, date_event, personnes, budget, description, created_at` — c'est la
  source de lecture côté code (module V8). Aucune donnée personnelle.
- Le contact se fait via la **messagerie interne** routée par `user_id` (l'email
  du client n'est jamais exposé).
- Migration : `migrations/001_annonces_browsable.sql` (+ correctif invoker).

---

## Stockage (Storage)

Upload de photo de profil pitmaster → bucket Storage (colonne `photo_url`).
Les `photo_url` sont échappées à l'affichage (`escHTML`).

---

## Règles d'accès aux données (rappel pour le code)

- Ne jamais committer de clé _service role_. La clé `anon`/publishable est
  publique par design.
- Avant toute modif de schéma : `list_tables`, puis `get_advisors` (security +
  performance) après coup.
- Les écritures se font directement sur la prod (pas d'environnement de staging
  DB) — prudence.
