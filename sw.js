const CACHE_NAME = 'mis-cifrados-shell-v1';
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

  const isShellRequest = APP_SHELL.includes(req.url) ||
    req.url === self.registration.scope ||
    req.url.endsWith('/index.html');

  if(!isShellRequest) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then(res => {
        if(res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
