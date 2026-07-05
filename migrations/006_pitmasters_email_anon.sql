-- RGPD / anti-scraping : masque pitmasters.email au rôle anon.
-- (Un GRANT table prime sur un REVOKE colonne : revoke table + re-grant
-- colonne par colonne sauf email — même schéma que annonces.)
revoke select on public.pitmasters from anon;
grant select (id, nom, ville, specialite, tarif, description, user_id, actif, created_at, photo_url, last_seen)
  on public.pitmasters to anon;
