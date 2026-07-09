-- ════════════════════════════════════════════════════════════════════════
-- Migration 002 — Correctifs performance RLS (advisors WARN → zéro)
-- (appliquée en prod le 2026-07-08 via apply_migration
--  « rls_perf_initplan_et_policies_dupliquees »)
-- ════════════════════════════════════════════════════════════════════════
-- 1) auth_rls_initplan : le linter Supabase ne reconnaît pas la forme
--    (select auth.jwt() ->> 'email') ; réécrite en
--    ((select auth.jwt()) ->> 'email') — sémantiquement identique (initplan
--    évalué une fois par requête), mais reconnue par le linter.
--    auth.uid() était déjà correctement encapsulé en (select auth.uid()).
-- 2) multiple_permissive_policies : `annonces_select_own` était redondante
--    avec `annonces_public_browse` (using true, cf. migration 001) — le front
--    ne lit la table que via la vue `annonces_public`. Supprimée.
-- ════════════════════════════════════════════════════════════════════════

-- messages
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages
  for select using (
    (select auth.uid())::text = from_user
    or (select auth.uid())::text = to_user
    or ((select auth.jwt()) ->> 'email') = to_user
  );

drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages
  for update using (
    (select auth.uid())::text = to_user
    or ((select auth.jwt()) ->> 'email') = to_user
  );

-- reservations
drop policy if exists reservations_auth_update on public.reservations;
create policy reservations_auth_update on public.reservations
  for update using (
    (select auth.uid())::text = client_id::text
    or ((select auth.jwt()) ->> 'email') = pitmaster_email
  ) with check (
    (select auth.uid())::text = client_id::text
    or ((select auth.jwt()) ->> 'email') = pitmaster_email
  );

drop policy if exists reservations_select_own on public.reservations;
create policy reservations_select_own on public.reservations
  for select using (
    (select auth.uid())::text = client_id::text
    or ((select auth.jwt()) ->> 'email') = pitmaster_email
    or ((select auth.jwt()) ->> 'email') = client_email
  );

-- annonces : policy SELECT redondante
drop policy if exists annonces_select_own on public.annonces;

-- ════════════════════════════════════════════════════════════════════════
-- ROLLBACK (restaure l'état antérieur — mêmes droits effectifs)
--   Recréer les 4 policies avec (select auth.jwt() ->> 'email') et :
--   create policy annonces_select_own on public.annonces for select
--     using ((select auth.uid())::text = user_id
--            or (select auth.jwt() ->> 'email') = user_email);
-- ════════════════════════════════════════════════════════════════════════
