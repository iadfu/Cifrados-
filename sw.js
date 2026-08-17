const CACHE_NAME = 'mis-cifrados-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const isHtmlShell = req.mode === 'navigate' ||
    req.url === self.registration.scope ||
    req.url.endsWith('/index.html');

  if(isHtmlShell){
    // Network-first: siempre busca la versión más nueva. Si no hay internet, recién ahí usa la copia guardada.
    event.respondWith(
      fetch(req).then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() =>
        caches.open(CACHE_NAME).then(cache => cache.match(req).then(m => m || cache.match('./index.html')))
      )
    );
    return;
  }

  const isFirebaseSdk = APP_SHELL.includes(req.url);
  if(isFirebaseSdk){
    // Estas URL están fijas a una versión exacta y nunca cambian de contenido: cache-first está bien.
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        if(cached) return cached;
        const res = await fetch(req);
        if(res && res.ok) cache.put(req, res.clone());
        return res;
      })
    );
  }
});
