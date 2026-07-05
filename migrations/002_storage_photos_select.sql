-- L'upload via storage-api exécute INSERT ... RETURNING ; le RETURNING applique
-- la policy SELECT. Sans elle, l'upload échouait en 400 (42501).
-- (Version initiale large, resserrée par la 003.)
create policy "Auth read pitmaster photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pitmaster-photos');
