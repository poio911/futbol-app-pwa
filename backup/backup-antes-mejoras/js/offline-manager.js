/**
 * Offline Manager - Gestión de caché y sincronización offline
 * Maneja IndexedDB, Service Worker y sincronización de datos
 */

const OfflineManager = {
    db: null,
    isOnline: navigator.onLine,
    pendingSync: [],
    
    /**
     * Inicializa el sistema offline
     */
    async init() {
        console.log('🔌 Offline Manager initialized');
        
        // Registrar Service Worker
        await this.registerServiceWorker();
        
        // Inicializar IndexedDB
        await this.initIndexedDB();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Verificar estado inicial
        this.checkOnlineStatus();
        
        // Sincronizar datos pendientes si hay conexión
        if (this.isOnline) {
            this.syncPendingData();
        }
    },
    
    /**
     * Registra el Service Worker
     */
    async registerServiceWorker() {
        // Verificar que no estamos en file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('Service Worker disabled: file:// protocol not supported. Use a local server (localhost) for full functionality.');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
                
                // Escuchar actualizaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nuevo Service Worker disponible
                            this.showUpdateNotification();
                        }
                    });
                });
                
                // Escuchar mensajes del Service Worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    },
    
    /**
     * Inicializa IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FutbolStatsManager', 2);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para jugadores
                if (!db.objectStoreNames.contains('players')) {
                    const playersStore = db.createObjectStore('players', { keyPath: 'id' });
                    playersStore.createIndex('groupId', 'groupId', { unique: false });
                    playersStore.createIndex('ovr', 'ovr', { unique: false });
                }
                
                // Store para partidos
                if (!db.objectStoreNames.contains('matches')) {
                    const matchesStore = db.createObjectStore('matches', { keyPath: 'id' });
                    matchesStore.createIndex('groupId', 'groupId', { unique: false });
                    matchesStore.createIndex('date', 'date', { unique: false });
                    matchesStore.createIndex('status', 'status', { unique: false });
                }
                
                // Store para grupos
                if (!db.objectStoreNames.contains('groups')) {
                    const groupsStore = db.createObjectStore('groups', { keyPath: 'id' });
                    groupsStore.createIndex('code', 'code', { unique: true });
                }
                
                // Store para personas
                if (!db.objectStoreNames.contains('persons')) {
                    const personsStore = db.createObjectStore('persons', { keyPath: 'id' });
                    personsStore.createIndex('email', 'email', { unique: true });
                }
                
                // Store para datos pendientes de sincronización
                if (!db.objectStoreNames.contains('pendingSync')) {
                    const pendingSyncStore = db.createObjectStore('pendingSync', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    pendingSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    pendingSyncStore.createIndex('type', 'type', { unique: false });
                }
                
                // Store para estadísticas
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', { keyPath: 'id' });
                    statsStore.createIndex('playerId', 'playerId', { unique: false });
                    statsStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    },
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Detectar cambios de conexión
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onOnline();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onOffline();
        });
        
        // Interceptar operaciones de Firebase cuando offline
        this.interceptFirebaseOperations();
    },
    
    /**
     * Cuando vuelve la conexión
     */
    onOnline() {
        console.log('🟢 Connection restored');
        UI.showNotification('Conexión restaurada', 'success');
        
        // Sincronizar datos pendientes
        this.syncPendingData();
        
        // Actualizar UI
        document.body.classList.remove('offline-mode');
        this.updateOfflineIndicator(true);
    },
    
    /**
     * Cuando se pierde la conexión
     */
    onOffline() {
        console.log('🔴 Connection lost');
        UI.showNotification('Modo offline activado', 'warning');
        
        // Actualizar UI
        document.body.classList.add('offline-mode');
        this.updateOfflineIndicator(false);
    },
    
    /**
     * Verifica estado de conexión
     */
    checkOnlineStatus() {
        // No hacer ping si estamos en file:// protocol
        if (window.location.protocol === 'file:') {
            console.log('Skipping network check: file:// protocol');
            return;
        }
        
        // Verificar con un ping real
        fetch('/ping', { method: 'HEAD' })
            .then(() => {
                if (!this.isOnline) {
                    this.isOnline = true;
                    this.onOnline();
                }
            })
            .catch(() => {
                if (this.isOnline) {
                    this.isOnline = false;
                    this.onOffline();
                }
            });
    },
    
    /**
     * Actualiza indicador de offline en UI
     */
    updateOfflineIndicator(isOnline) {
        let indicator = document.getElementById('offline-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            document.body.appendChild(indicator);
        }
        
        if (isOnline) {
            indicator.classList.remove('show');
            indicator.innerHTML = '';
        } else {
            indicator.classList.add('show');
            indicator.innerHTML = `
                <i class='bx bx-wifi-off'></i>
                <span>Modo Offline</span>
            `;
        }
    },
    
    /**
     * Intercepta operaciones de Firebase
     */
    interceptFirebaseOperations() {
        // Guardar referencias originales
        const originalMethods = {};
        
        if (window.Storage) {
            // Interceptar addPlayer
            originalMethods.addPlayer = Storage.addPlayer;
            Storage.addPlayer = async (playerData) => {
                if (this.isOnline) {
                    return originalMethods.addPlayer.call(Storage, playerData);
                } else {
                    return this.saveOffline('player', 'add', playerData);
                }
            };
            
            // Interceptar updatePlayer
            originalMethods.updatePlayer = Storage.updatePlayer;
            Storage.updatePlayer = async (playerId, updates) => {
                if (this.isOnline) {
                    return originalMethods.updatePlayer.call(Storage, playerId, updates);
                } else {
                    return this.saveOffline('player', 'update', { id: playerId, ...updates });
                }
            };
            
            // Interceptar deletePlayer
            originalMethods.deletePlayer = Storage.deletePlayer;
            Storage.deletePlayer = async (playerId) => {
                if (this.isOnline) {
                    return originalMethods.deletePlayer.call(Storage, playerId);
                } else {
                    return this.saveOffline('player', 'delete', { id: playerId });
                }
            };
            
            // Interceptar addMatch
            originalMethods.addMatch = Storage.addMatch;
            Storage.addMatch = async (matchData) => {
                if (this.isOnline) {
                    return originalMethods.addMatch.call(Storage, matchData);
                } else {
                    return this.saveOffline('match', 'add', matchData);
                }
            };
            
            // Interceptar updateMatch
            originalMethods.updateMatch = Storage.updateMatch;
            Storage.updateMatch = async (matchId, updates) => {
                if (this.isOnline) {
                    return originalMethods.updateMatch.call(Storage, matchId, updates);
                } else {
                    return this.saveOffline('match', 'update', { id: matchId, ...updates });
                }
            };
        }
    },
    
    /**
     * Guarda operación offline
     */
    async saveOffline(type, action, data) {
        if (!this.db) {
            console.error('IndexedDB not initialized');
            return false;
        }
        
        const transaction = this.db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        
        const syncItem = {
            type,
            action,
            data,
            timestamp: Date.now(),
            synced: false
        };
        
        try {
            await store.add(syncItem);
            
            // También guardar en el store local correspondiente
            await this.saveToLocalStore(type, action, data);
            
            UI.showNotification('Guardado localmente. Se sincronizará cuando haya conexión.', 'info');
            
            // Registrar sincronización en background si es posible
            if ('sync' in self.registration) {
                await self.registration.sync.register('sync-data');
            }
            
            return true;
        } catch (error) {
            console.error('Error saving offline:', error);
            return false;
        }
    },
    
    /**
     * Guarda en store local
     */
    async saveToLocalStore(type, action, data) {
        const storeName = type + 's'; // players, matches, etc.
        
        if (!this.db.objectStoreNames.contains(storeName)) {
            return;
        }
        
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        switch (action) {
            case 'add':
            case 'update':
                await store.put(data);
                break;
            case 'delete':
                await store.delete(data.id);
                break;
        }
    },
    
    /**
     * Sincroniza datos pendientes
     */
    async syncPendingData() {
        if (!this.db || !this.isOnline) return;
        
        const transaction = this.db.transaction(['pendingSync'], 'readonly');
        const store = transaction.objectStore('pendingSync');
        const pendingItems = await store.getAll() || [];
        
        console.log(`📤 Syncing ${pendingItems.length} pending items`);
        
        for (const item of pendingItems) {
            if (!item.synced) {
                try {
                    await this.syncItem(item);
                    await this.markAsSynced(item.id);
                } catch (error) {
                    console.error('Sync failed for item:', item, error);
                }
            }
        }
        
        if (pendingItems.length > 0) {
            UI.showNotification(`${pendingItems.length} elementos sincronizados`, 'success');
        }
    },
    
    /**
     * Sincroniza un item
     */
    async syncItem(item) {
        const { type, action, data } = item;
        
        // Llamar al método original de Firebase
        switch (type) {
            case 'player':
                switch (action) {
                    case 'add':
                        await Storage.addPlayer(data);
                        break;
                    case 'update':
                        await Storage.updatePlayer(data.id, data);
                        break;
                    case 'delete':
                        await Storage.deletePlayer(data.id);
                        break;
                }
                break;
            case 'match':
                switch (action) {
                    case 'add':
                        await Storage.addMatch(data);
                        break;
                    case 'update':
                        await Storage.updateMatch(data.id, data);
                        break;
                }
                break;
        }
    },
    
    /**
     * Marca item como sincronizado
     */
    async markAsSynced(itemId) {
        const transaction = this.db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        await store.delete(itemId);
    },
    
    /**
     * Obtiene datos desde IndexedDB
     */
    async getFromIndexedDB(storeName, key) {
        if (!this.db) return null;
        
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        if (key) {
            return await store.get(key);
        } else {
            return await store.getAll();
        }
    },
    
    /**
     * Guarda datos en IndexedDB
     */
    async saveToIndexedDB(storeName, data) {
        if (!this.db) return false;
        
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        try {
            if (Array.isArray(data)) {
                for (const item of data) {
                    await store.put(item);
                }
            } else {
                await store.put(data);
            }
            return true;
        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            return false;
        }
    },
    
    /**
     * Limpia datos antiguos
     */
    async cleanOldData() {
        const stores = ['players', 'matches', 'statistics'];
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index('date');
            
            const range = IDBKeyRange.upperBound(oneMonthAgo);
            const cursor = index.openCursor(range);
            
            cursor.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        }
    },
    
    /**
     * Muestra notificación de actualización
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class='bx bx-refresh'></i>
                <span>Nueva versión disponible</span>
                <button onclick="OfflineManager.updateApp()">Actualizar</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    },
    
    /**
     * Actualiza la aplicación
     */
    async updateApp() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'skip-waiting' });
                // Temporarily disabled auto-reload
                console.log('App update available, but auto-reload disabled');
                // window.location.reload();
            }
        }
    },
    
    /**
     * Maneja mensajes del Service Worker
     */
    handleServiceWorkerMessage(data) {
        switch (data.type) {
            case 'sync-complete':
                UI.showNotification(data.message, 'success');
                // Recargar datos si es necesario
                if (typeof App !== 'undefined' && App.loadCurrentScreen) {
                    App.loadCurrentScreen();
                }
                break;
            case 'update-available':
                this.showUpdateNotification();
                break;
        }
    },
    
    /**
     * Exporta datos para backup
     */
    async exportData() {
        const data = {
            players: await this.getFromIndexedDB('players'),
            matches: await this.getFromIndexedDB('matches'),
            groups: await this.getFromIndexedDB('groups'),
            persons: await this.getFromIndexedDB('persons'),
            statistics: await this.getFromIndexedDB('statistics'),
            exportDate: new Date().toISOString()
        };
        
        return data;
    },
    
    /**
     * Importa datos desde backup
     */
    async importData(data) {
        try {
            if (data.players) await this.saveToIndexedDB('players', data.players);
            if (data.matches) await this.saveToIndexedDB('matches', data.matches);
            if (data.groups) await this.saveToIndexedDB('groups', data.groups);
            if (data.persons) await this.saveToIndexedDB('persons', data.persons);
            if (data.statistics) await this.saveToIndexedDB('statistics', data.statistics);
            
            UI.showNotification('Datos importados correctamente', 'success');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            UI.showNotification('Error al importar datos', 'error');
            return false;
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineManager.init());
} else {
    OfflineManager.init();
}

// Exportar para uso global
window.OfflineManager = OfflineManager;