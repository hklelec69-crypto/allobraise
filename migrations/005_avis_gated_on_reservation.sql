-- CONFIANCE : un avis n'est autorisé que si l'auteur a une réservation avec ce
-- pitmaster (anti-faux-avis). S'ajoute au binding client_id = auth.uid().
drop policy if exists "avis_auth_insert" on public.avis;
create policy "avis_auth_insert" on public.avis
  for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.reservations r
      where r.client_id = (select auth.uid())
        and r.pitmaster_nom = avis.pitmaster_nom
    )
  );
