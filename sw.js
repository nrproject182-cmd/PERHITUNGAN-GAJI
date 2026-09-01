/* ================================================
   SERVICE WORKER - APLIKASI PENGGAJIAN
   ------------------------------------------------
   PENTING: Setiap upload update baru, naikkan nomor
   APP_VERSION di file ini DAN di index.html, supaya
   cache di HP user otomatis ke-refresh.
   ================================================ */
const APP_VERSION = '2.1.0';
const CACHE_NAME = 'gaji-app-v' + APP_VERSION;
const CORE_ASSETS = [
  './',
  'index.html'
];

// Install: simpan file inti biar aplikasi bisa offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: hapus cache versi lama biar nggak numpuk
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: strategi cache
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // abaikan external/CDN

  // Halaman (navigasi): NETWORK-FIRST biar update terbaru kebaca,
  // fallback ke cache kalau offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }

  // Aset statis: cache-first + update di background
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});