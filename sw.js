// Network first, so updates show up as soon as you're online; cached copy is the offline fallback.
const V = 'es-v4';
const SHELL = ['./', 'index.html', 'style.css?v=4', 'manifest.webmanifest', 'js/seed.js?v=4', 'js/course.js?v=4', 'js/core.js?v=4', 'js/sync.js?v=4', 'js/views.js?v=4', 'js/lessons.js?v=4', 'js/practise.js?v=4', 'js/hoy.js?v=4', 'js/add.js?v=4', 'js/app.js?v=4'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(V).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html')))
  );
});
