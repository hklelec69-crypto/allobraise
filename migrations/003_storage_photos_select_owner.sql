-- Advisor WARN public_bucket_allows_listing : la policy SELECT large permettait
-- de LISTER tout le bucket. Restreinte au propriétaire (suffit au RETURNING).
drop policy if exists "Auth read pitmaster photos" on storage.objects;
create policy "Auth read own pitmaster photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pitmaster-photos'
    and ( owner = (select auth.uid()) or owner_id = (select auth.uid())::text )
  );
