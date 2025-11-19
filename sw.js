
const CACHE_NAME = 'pistachiolog-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  './icon.png'
];

// Kurulum (Install) aşaması: Statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Dosyalar önbelleğe alınıyor...');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivasyon aşaması: Eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch (İstek) aşaması: Önce önbelleğe bak, yoksa internetten çek
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Önbellekte varsa döndür
        if (response) {
          return response;
        }

        // Yoksa internetten çek
        return fetch(event.request).then(
          (response) => {
            // Geçersiz cevap geldiyse direkt döndür
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // Cevabı klonla (biri tarayıcıya, biri önbelleğe)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Sadece GET isteklerini önbelleğe al
                if (event.request.method === 'GET') {
                   cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});
