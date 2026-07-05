-- Monitoring des erreurs JS prod (Sentry-lite sans SaaS). Insert-only via RLS,
-- illisible par l'API publique (aucune policy SELECT).
create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  source text,
  ligne integer,
  url text,
  ua text,
  created_at timestamptz default now()
);
alter table public.client_errors enable row level security;
create policy "client_errors_insert" on public.client_errors
  for insert to anon, authenticated
  with check (
    char_length(message) <= 500
    and (source is null or char_length(source) <= 300)
    and (url is null or char_length(url) <= 300)
    and (ua is null or char_length(ua) <= 300)
  );
