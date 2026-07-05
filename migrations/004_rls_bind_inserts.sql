-- ANTI-FRAUDE : chaque INSERT est lié à l'utilisateur authentifié (avant :
-- simple "connecté", donc forge possible au nom d'autrui). Vérifié : 42501.
drop policy if exists "avis_auth_insert" on public.avis;
create policy "avis_auth_insert" on public.avis
  for insert to authenticated
  with check (client_id = (select auth.uid()));

drop policy if exists "reservations_auth_insert" on public.reservations;
create policy "reservations_auth_insert" on public.reservations
  for insert to authenticated
  with check (client_id = (select auth.uid()));

drop policy if exists "annonces_auth_insert" on public.annonces;
create policy "annonces_auth_insert" on public.annonces
  for insert to authenticated
  with check (user_id = (select auth.uid())::text);

drop policy if exists "pitmasters_auth_insert" on public.pitmasters;
create policy "pitmasters_auth_insert" on public.pitmasters
  for insert to authenticated
  with check (user_id = (select auth.uid()));
