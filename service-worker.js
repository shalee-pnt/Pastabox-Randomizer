const CACHE_NAME = 'pastabox-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/data.js',
  '/app.js',
  'img/pasta-insolourdo-192.png',
  'img/pasta-insolourdo-512.png',
  'img/default-classic.png',
  'img/default-xtrembox.png',
  'img/default-cremiobox.png',
  'img/default-asianbox.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retourne la réponse du cache
        if (response) {
          return response;
        }
        
        // Clone la requête
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Vérifie si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone la réponse
          const responseToCache = response.clone();
          
          // Ouvre le cache et ajoute la réponse
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Fallback pour les images
          if (event.request.url.includes('.png') || event.request.url.includes('.jpg')) {
            return caches.match('img/default.png');
          }
        });
      })
  );
});

// Gestion de la mise à jour
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});