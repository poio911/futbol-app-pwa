// Service Worker para PWA - Fútbol Miércoles
const CACHE_NAME = 'futbol-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/test-app.js',
  '/js/players-view-enhanced.js',
  '/js/firebase-simple.js',
  '/js/auth-system.js',
  '/js/notifications-system.js',
  '/css/unified-design-system.css',
  '/css/players-view-enhanced.css',
  '/css/header-footer-enhanced.css',
  '/css/evaluation-styles.css',
  '/css/partidos-grupales-enhanced.css',
  '/css/collaborative-matches.css',
  '/manifest.json'
];

// Install event - cache recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 PWA: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ PWA: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});