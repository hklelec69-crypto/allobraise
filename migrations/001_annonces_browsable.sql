-- ════════════════════════════════════════════════════════════════════════
-- Migration 001 — Rendre les annonces parcourables par les pitmasters
-- (état RÉELLEMENT appliqué en prod — advisor sécurité propre, RGPD-safe)
-- ════════════════════════════════════════════════════════════════════════
-- Problème : la RLS SELECT d'`annonces` (`annonces_select_own`) limitait la
-- lecture au propriétaire → aucun pitmaster ne pouvait parcourir les demandes.
--
-- ⚠️ RGPD : `annonces` contient `user_email` et `user_prenom` (données
-- personnelles). La clé `anon` étant publique, une lecture publique naïve
-- exposerait tous les emails clients. INTERDIT.
--
-- Solution retenue (propre, sans vue SECURITY DEFINER qui déclenche un advisor
-- ERROR) :
--   • Vue SECURITY INVOKER exposant uniquement les colonnes non personnelles.
--   • Lecture publique au niveau RLS (lignes).
--   • Protection des colonnes PII au niveau PRIVILÈGES : anon/authenticated
--     n'ont le SELECT que sur les colonnes non personnelles → `user_email` et
--     `user_prenom` restent inaccessibles (vérifié via has_column_privilege).
-- Le contact se fait via la messagerie interne (par `user_id`), jamais par email.
-- ════════════════════════════════════════════════════════════════════════

-- 1) Vue publique sans PII, en SECURITY INVOKER (respecte la RLS → advisor OK)
create or replace view public.annonces_public
  with (security_invoker = true) as
  select id, user_id, titre, ville, date_event, personnes, budget, description, created_at
  from public.annonces;

-- 2) Lecture publique des annonces (lignes) au niveau RLS
drop policy if exists annonces_public_browse on public.annonces;
create policy annonces_public_browse on public.annonces
  for select to anon, authenticated using (true);

-- 3) Protection PII au niveau privilèges colonne
revoke select on public.annonces from anon, authenticated;
grant select (id, user_id, titre, ville, date_event, personnes, budget, description, created_at)
  on public.annonces to anon, authenticated;

grant select on public.annonces_public to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- ROLLBACK
--   drop view if exists public.annonces_public;
--   drop policy if exists annonces_public_browse on public.annonces;
--   grant select on public.annonces to anon, authenticated;  -- restaure l'accès colonne complet
-- ════════════════════════════════════════════════════════════════════════
