/* Service worker Allo Braise — volontairement MINIMAL et NETWORK-FIRST.
   Règle absolue (leçon du bug B-9 de cache) : ne JAMAIS servir un index.html
   périmé quand le réseau est disponible. Le cache n'est qu'un filet hors-ligne.
   - Navigations : réseau d'abord, copie en cache, fallback cache si hors-ligne.
   - Statique same-origin (fonts/, icons/, og-image) : stale-while-revalidate.
   - Tout le reste (Supabase, EmailJS, CDN) : réseau pur, jamais intercepté.
   Incrémenter VERSION à chaque changement de stratégie pour purger l'ancien cache. */
const VERSION = 'ab-v1';
const STATIC_RE = /^\/(fonts|icons)\/|^\/og-image\.png$|^\/manifest\.webmanifest$/;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // tiers : jamais intercepté

  // Navigation (HTML) : réseau d'abord, cache en secours hors-ligne uniquement
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Statique versionné par nom de fichier : stale-while-revalidate
  if (STATIC_RE.test(url.pathname)) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const cached = await c.match(e.request);
        const network = fetch(e.request)
          .then((res) => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
  // tout le reste : comportement réseau par défaut
});
