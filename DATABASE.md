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

| Table | INSERT | SELECT | UPDATE |
|---|---|---|---|
| `pitmasters` | authentifié | `actif = true` **OU** propriétaire | propriétaire (`user_id`) |
| `reservations` | authentifié | client **OU** pitmaster (par email/uid) | client **OU** pitmaster |
| `messages` | `from_user = uid` | expéditeur **OU** destinataire | destinataire (marquer lu) |
| `avis` | authentifié | **public** (`true`) | — |
| `annonces` | authentifié | **propriétaire uniquement** ⚠️ | — |

Les politiques utilisent la forme optimisée `(select auth.uid())` (pas de
ré-évaluation par ligne).

### ⚠️ Limitation connue — visibilité des annonces
La politique SELECT d'`annonces` (`annonces_select_own`) ne laisse un
utilisateur voir **que ses propres** annonces. Un pitmaster ne peut donc pas
parcourir les demandes des clients. La feature est à moitié construite : le code
n'effectue d'ailleurs aucun `select` sur `annonces` (affichage purement visuel).
Rendre les annonces publiquement parcourables = **décision produit + migration
RLS** (accord utilisateur requis). Voir KNOWN_BUGS.md (B-OPEN-1).

---

## Stockage (Storage)
Upload de photo de profil pitmaster → bucket Storage (colonne `photo_url`).
Les `photo_url` sont échappées à l'affichage (`escHTML`).

---

## Règles d'accès aux données (rappel pour le code)
- Ne jamais committer de clé *service role*. La clé `anon`/publishable est
  publique par design.
- Avant toute modif de schéma : `list_tables`, puis `get_advisors` (security +
  performance) après coup.
- Les écritures se font directement sur la prod (pas d'environnement de staging
  DB) — prudence.
