/**
 * Service Worker - Fútbol Stats
 * Maneja caché, sincronización offline y actualizaciones
 */

const CACHE_NAME = 'futbol-stats-v2.3.0';
const DATA_CACHE_NAME = 'futbol-stats-data-v1';
const IMAGE_CACHE_NAME = 'futbol-stats-images-v1';

// Archivos esenciales para funcionamiento offline
const ESSENTIAL_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/match-management.css',
    '/css/mobile-enhancements.css',
    '/js/app.js',
    '/js/ui.js',
    '/js/utils.js',
    '/js/firebase-simple.js',
    '/js/supabase-storage.js',
    '/js/match-system-v2.js',
    '/js/charts-manager.js',
    '/js/stats-controller.js',
    '/js/tournament-system.js',
    '/js/player-history.js',
    '/js/push-notifications.js',
    '/js/group-chat.js',
    '/js/dashboard-controller.js',
    '/js/mobile-enhancements.js',
    '/js/validators.js',
    '/js/error-handler.js',
    '/js/ui-helpers.js',
    '/css/player-history.css',
    '/css/push-notifications.css',
    '/css/group-chat.css',
    '/manifest.json'
];

// URLs externas que queremos cachear
const EXTERNAL_URLS = [
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching essential files');
                return cache.addAll(ESSENTIAL_FILES.concat(EXTERNAL_URLS));
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[ServiceWorker] Installation failed:', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar caches antiguos
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== DATA_CACHE_NAME && 
                        cacheName !== IMAGE_CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[ServiceWorker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Manejar peticiones a Firebase
    if (url.hostname.includes('firestore.googleapis.com') || 
        url.hostname.includes('firebase')) {
        event.respondWith(handleFirebaseRequest(request));
        return;
    }
    
    // Manejar peticiones a Supabase
    if (url.hostname.includes('supabase')) {
        event.respondWith(handleSupabaseRequest(request));
        return;
    }
    
    // Manejar imágenes
    if (request.destination === 'image') {
        event.respondWith(handleImageRequest(request));
        return;
    }
    
    // Manejar otros recursos
    event.respondWith(handleGeneralRequest(request));
});

// Manejar peticiones a Firebase
async function handleFirebaseRequest(request) {
    try {
        // Intentar red primero
        const response = await fetch(request);
        
        // Si la respuesta es exitosa, guardar en caché
        if (response && response.status === 200) {
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Si falla la red, buscar en caché
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[ServiceWorker] Returning cached Firebase data');
            return cachedResponse;
        }
        
        // Si no hay caché, devolver respuesta de error
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'No hay conexión a internet y no hay datos en caché'
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });
    }
}

// Manejar peticiones a Supabase
async function handleSupabaseRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Buscar imagen en caché
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[ServiceWorker] Returning cached image from Supabase');
            return cachedResponse;
        }
        
        // Devolver imagen placeholder si no hay caché
        return fetch('/images/player-placeholder.png');
    }
}

// Manejar peticiones de imágenes
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    
    // Buscar en caché primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Actualizar caché en background si es posible
        fetch(request).then(response => {
            if (response && response.status === 200) {
                cache.put(request, response);
            }
        });
        
        return cachedResponse;
    }
    
    // Si no está en caché, intentar red
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Devolver imagen placeholder
        return fetch('/images/player-placeholder.png');
    }
}

// Manejar peticiones generales
async function handleGeneralRequest(request) {
    // Estrategia: Cache First, fallback to Network
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Si está en caché, devolverlo y actualizar en background
        fetch(request).then(response => {
            if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response);
                });
            }
        });
        
        return cachedResponse;
    }
    
    // Si no está en caché, intentar red
    try {
        const response = await fetch(request);
        
        // Cachear si es exitoso
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Si es la página principal, devolver offline.html
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        // Para otros recursos, devolver error
        return new Response('Offline', { status: 503 });
    }
}

// Sincronización en background
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync triggered');
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Sincronizar datos pendientes
async function syncData() {
    try {
        // Obtener datos pendientes del IndexedDB
        const pendingData = await getPendingData();
        
        if (pendingData && pendingData.length > 0) {
            console.log('[ServiceWorker] Syncing', pendingData.length, 'pending items');
            
            for (const item of pendingData) {
                try {
                    await syncItem(item);
                    await markItemSynced(item.id);
                } catch (error) {
                    console.error('[ServiceWorker] Failed to sync item:', item.id, error);
                }
            }
        }
        
        // Notificar al cliente que la sincronización está completa
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'sync-complete',
                message: 'Datos sincronizados correctamente'
            });
        });
    } catch (error) {
        console.error('[ServiceWorker] Sync failed:', error);
    }
}

// Obtener datos pendientes de sincronización
async function getPendingData() {
    // Aquí implementarías la lógica para obtener datos de IndexedDB
    // Por ahora retornamos array vacío
    return [];
}

// Sincronizar un item individual
async function syncItem(item) {
    const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
    }
    
    return response.json();
}

// Marcar item como sincronizado
async function markItemSynced(itemId) {
    // Implementar lógica para marcar como sincronizado en IndexedDB
    console.log('[ServiceWorker] Item synced:', itemId);
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    
    let data = {
        title: 'Fútbol Stats',
        body: 'Nueva notificación',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Cerrar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Mensaje desde el cliente
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data.type === 'skip-waiting') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'clear-cache') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// Periodicidad de sincronización (si el navegador lo soporta)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-data') {
        event.waitUntil(updateData());
    }
});

// Actualizar datos periódicamente
async function updateData() {
    try {
        // Actualizar caché de datos críticos
        const cache = await caches.open(DATA_CACHE_NAME);
        
        // Lista de endpoints a actualizar
        const endpoints = [
            '/api/players',
            '/api/matches',
            '/api/groups'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response && response.ok) {
                    await cache.put(endpoint, response);
                }
            } catch (error) {
                console.error('[ServiceWorker] Failed to update:', endpoint);
            }
        }
        
        console.log('[ServiceWorker] Data updated successfully');
    } catch (error) {
        console.error('[ServiceWorker] Update failed:', error);
    }
}

// Push Event Handler
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received:', event);
    
    if (!event.data) {
        console.log('[ServiceWorker] Push event with no data');
        return;
    }
    
    let notificationData;
    try {
        notificationData = event.data.json();
    } catch (error) {
        console.error('[ServiceWorker] Error parsing push data:', error);
        notificationData = {
            title: 'Fútbol Stats',
            body: event.data.text() || 'Nueva notificación disponible',
            icon: '/icons/icon-192.png'
        };
    }
    
    const options = {
        body: notificationData.body,
        icon: notificationData.icon || '/icons/icon-192.png',
        badge: notificationData.badge || '/icons/badge-72.png',
        image: notificationData.image,
        tag: notificationData.tag || 'futbol-stats-notification',
        data: notificationData.data || {},
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false,
        vibrate: notificationData.vibrate || [200, 100, 200],
        actions: notificationData.actions || [
            {
                action: 'open',
                title: 'Abrir App',
                icon: '/icons/icon-72.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icons/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data.url || '/';
    const action = event.action || 'open';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Buscar una ventana existente
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin)) {
                        // Enfocar ventana existente y navegar si es necesario
                        if (urlToOpen !== '/') {
                            client.postMessage({
                                type: 'navigate',
                                url: urlToOpen,
                                action: action,
                                data: event.notification.data
                            });
                        }
                        return client.focus();
                    }
                }
                
                // Abrir nueva ventana si no hay ninguna abierta
                return clients.openWindow(urlToOpen);
            })
            .catch(error => {
                console.error('[ServiceWorker] Error handling notification click:', error);
            })
    );
});

// Background Sync for Notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-notification-sync') {
        console.log('[ServiceWorker] Background sync for notifications');
        event.waitUntil(handleBackgroundNotificationSync());
    }
});

/**
 * Maneja sincronización en segundo plano de notificaciones
 */
async function handleBackgroundNotificationSync() {
    try {
        // Aquí podrías sincronizar notificaciones pendientes con el servidor
        console.log('[ServiceWorker] Syncing notifications in background');
        
        // Ejemplo: enviar estadísticas de notificaciones al servidor
        const notificationStats = await getStoredNotificationStats();
        if (notificationStats && notificationStats.length > 0) {
            // En una implementación real, enviarías esto al servidor
            console.log('[ServiceWorker] Notification stats to sync:', notificationStats);
        }
        
    } catch (error) {
        console.error('[ServiceWorker] Background notification sync failed:', error);
    }
}

/**
 * Obtiene estadísticas de notificaciones almacenadas
 */
async function getStoredNotificationStats() {
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const response = await cache.match('/notification-stats');
        
        if (response) {
            return await response.json();
        }
        
        return null;
    } catch (error) {
        console.error('[ServiceWorker] Error getting stored notification stats:', error);
        return null;
    }
}

// Message Handler para comunicación con la app principal
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'skip-waiting') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'notification-stats') {
        // Guardar estadísticas de notificaciones
        caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put('/notification-stats', new Response(JSON.stringify(event.data.stats)));
        });
    }
});

// Periodic Background Sync (si está soportado)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'notification-cleanup') {
            console.log('[ServiceWorker] Periodic sync for notification cleanup');
            event.waitUntil(cleanupOldNotificationData());
        }
    });
}

/**
 * Limpia datos antiguos de notificaciones
 */
async function cleanupOldNotificationData() {
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        
        // Limpiar estadísticas de notificaciones más antiguas de 30 días
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        // En una implementación real, aquí filtrarías y limpiarías datos antiguos
        console.log('[ServiceWorker] Cleaning up notification data older than:', new Date(thirtyDaysAgo));
        
    } catch (error) {
        console.error('[ServiceWorker] Error cleaning up notification data:', error);
    }
}