/**
 * Push Notifications System
 * Sistema completo de notificaciones push para Fútbol Stats
 */

const PushNotifications = {
    registration: null,
    subscription: null,
    isSupported: false,
    isEnabled: false,
    
    // VAPID Keys (en producción estos deberían estar en servidor)
    vapidKeys: {
        publicKey: 'BMfaO-mPYkOBXGqw0B9YnY8PZKvaBHH7h5K4n_LtWKR2qTTIAO7h2dT_FfHcQGUvGdXWjThQBnHkL_P1Tj2xJgI'
    },
    
    // Tipos de notificación
    notificationTypes: {
        MATCH_START: 'match_start',
        MATCH_END: 'match_end',
        GOAL: 'goal',
        MVP: 'mvp',
        NEW_PLAYER: 'new_player',
        TOURNAMENT: 'tournament',
        REMINDER: 'reminder',
        ACHIEVEMENT: 'achievement'
    },

    /**
     * Inicializa el sistema de notificaciones
     */
    async init() {
        console.log('🔔 Push Notifications initialized');
        
        // Verificar soporte del navegador
        this.checkBrowserSupport();
        
        if (!this.isSupported) {
            console.warn('Push notifications not supported');
            return;
        }

        // Obtener Service Worker registration
        await this.getServiceWorkerRegistration();
        
        // Verificar estado actual de la suscripción
        await this.checkExistingSubscription();
        
        // Configurar UI
        this.setupUI();
        
        // Configurar listeners de eventos de la app
        this.setupAppEventListeners();
        
        // Configurar notificaciones programadas
        this.setupScheduledNotifications();
    },

    /**
     * Verifica soporte del navegador
     */
    checkBrowserSupport() {
        // Verificar que no estamos en file:// protocol
        const isFileProtocol = window.location.protocol === 'file:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHttps = window.location.protocol === 'https:';
        
        this.isSupported = 'serviceWorker' in navigator && 
                          'PushManager' in window && 
                          'Notification' in window &&
                          !isFileProtocol &&
                          (isLocalhost || isHttps);
        
        if (isFileProtocol) {
            console.warn('Push notifications disabled: file:// protocol not supported. Use a local server (localhost) for full functionality.');
        }
    },

    /**
     * Obtiene el Service Worker registration
     */
    async getServiceWorkerRegistration() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.getRegistration();
                
                if (!this.registration) {
                    // Registrar Service Worker si no existe
                    this.registration = await navigator.serviceWorker.register('/service-worker.js');
                }
                
                console.log('Service Worker registration found:', this.registration);
            } catch (error) {
                console.error('Error getting Service Worker registration:', error);
            }
        }
    },

    /**
     * Verifica suscripción existente
     */
    async checkExistingSubscription() {
        if (!this.registration) return;

        try {
            this.subscription = await this.registration.pushManager.getSubscription();
            this.isEnabled = !!this.subscription;
            
            if (this.subscription) {
                console.log('Existing push subscription found');
                // Sincronizar con servidor (si existe)
                this.syncSubscriptionWithServer();
            }
        } catch (error) {
            console.error('Error checking existing subscription:', error);
        }
    },

    /**
     * Configura la interfaz de usuario
     */
    setupUI() {
        this.createNotificationSettings();
        this.updateUIState();
    },

    /**
     * Crea la interfaz de configuración de notificaciones
     */
    createNotificationSettings() {
        // Verificar si ya existe
        if (document.getElementById('notification-settings')) return;
        
        const settingsHTML = `
            <div id="notification-settings" class="notification-settings-panel">
                <div class="notification-header">
                    <h3><i class='bx bx-bell'></i> Notificaciones Push</h3>
                    <button class="btn-icon" onclick="PushNotifications.toggleSettings()" title="Cerrar">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                
                <div class="notification-content">
                    <div class="notification-status">
                        <div class="status-indicator" id="notification-status-indicator"></div>
                        <span id="notification-status-text">Desactivadas</span>
                    </div>
                    
                    <div class="notification-main-control">
                        <button id="enable-notifications-btn" class="btn-primary" onclick="PushNotifications.requestPermission()">
                            <i class='bx bx-bell'></i> Activar Notificaciones
                        </button>
                        <button id="disable-notifications-btn" class="btn-secondary" onclick="PushNotifications.disableNotifications()" style="display: none;">
                            <i class='bx bx-bell-off'></i> Desactivar Notificaciones
                        </button>
                    </div>
                    
                    <div id="notification-types" class="notification-types" style="display: none;">
                        <h4>Tipos de Notificación</h4>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-matches" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-football'></i>
                                    <div>
                                        <strong>Partidos</strong>
                                        <small>Inicio y fin de partidos</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-goals" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-target-lock'></i>
                                    <div>
                                        <strong>Goles</strong>
                                        <small>Cuando se marcan goles</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-mvp" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-crown'></i>
                                    <div>
                                        <strong>MVP</strong>
                                        <small>Jugador más valioso</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-players" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-user-plus'></i>
                                    <div>
                                        <strong>Nuevos Jugadores</strong>
                                        <small>Cuando se registran jugadores</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-tournaments" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-trophy'></i>
                                    <div>
                                        <strong>Torneos</strong>
                                        <small>Actualizaciones de torneos</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                        
                        <div class="notification-type">
                            <label>
                                <input type="checkbox" id="notify-achievements" checked>
                                <span class="notification-type-label">
                                    <i class='bx bx-medal'></i>
                                    <div>
                                        <strong>Logros</strong>
                                        <small>Nuevos logros desbloqueados</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="notification-test" class="notification-test" style="display: none;">
                        <h4>Probar Notificaciones</h4>
                        <button class="btn-outline" onclick="PushNotifications.sendTestNotification()">
                            <i class='bx bx-test-tube'></i> Enviar Notificación de Prueba
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', settingsHTML);
        
        // Event listeners para checkboxes
        const checkboxes = document.querySelectorAll('#notification-types input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.saveNotificationPreferences();
            });
        });
    },

    /**
     * Actualiza el estado de la UI
     */
    updateUIState() {
        const statusIndicator = document.getElementById('notification-status-indicator');
        const statusText = document.getElementById('notification-status-text');
        const enableBtn = document.getElementById('enable-notifications-btn');
        const disableBtn = document.getElementById('disable-notifications-btn');
        const typesSection = document.getElementById('notification-types');
        const testSection = document.getElementById('notification-test');
        
        if (!statusIndicator) return;
        
        if (this.isEnabled) {
            statusIndicator.className = 'status-indicator active';
            statusText.textContent = 'Activadas';
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'block';
            typesSection.style.display = 'block';
            testSection.style.display = 'block';
        } else {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Desactivadas';
            enableBtn.style.display = 'block';
            disableBtn.style.display = 'none';
            typesSection.style.display = 'none';
            testSection.style.display = 'none';
        }
        
        // Actualizar indicador en navigation
        this.updateNavigationIndicator();
    },

    /**
     * Actualiza indicador de notificaciones en la navegación
     */
    updateNavigationIndicator() {
        let indicator = document.getElementById('notification-indicator');
        
        if (!indicator) {
            // Crear indicador si no existe
            indicator = document.createElement('div');
            indicator.id = 'notification-indicator';
            indicator.className = 'notification-indicator';
            indicator.onclick = () => this.toggleSettings();
            
            indicator.innerHTML = `
                <i class='bx bx-bell'></i>
                <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
            `;
            
            // Agregar a la interfaz (ejemplo: header)
            const header = document.querySelector('.group-context-header') || document.body;
            header.appendChild(indicator);
        }
        
        // Actualizar estado visual
        if (this.isEnabled) {
            indicator.classList.add('enabled');
        } else {
            indicator.classList.remove('enabled');
        }
    },

    /**
     * Solicita permisos de notificación
     */
    async requestPermission() {
        if (!this.isSupported) {
            UI.showNotification('Tu navegador no soporta notificaciones push', 'error');
            return;
        }

        try {
            // Solicitar permisos de notificación
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                await this.subscribeToPush();
                UI.showNotification('¡Notificaciones activadas correctamente!', 'success');
            } else if (permission === 'denied') {
                UI.showNotification('Permisos de notificación denegados', 'error');
            } else {
                UI.showNotification('Permisos de notificación cancelados', 'warning');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            UI.showNotification('Error al activar notificaciones', 'error');
        }
    },

    /**
     * Suscribe a notificaciones push
     */
    async subscribeToPush() {
        if (!this.registration) {
            console.error('No Service Worker registration found');
            return;
        }

        try {
            // Crear suscripción
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidKeys.publicKey)
            });

            console.log('Push subscription created:', this.subscription);
            
            this.isEnabled = true;
            this.updateUIState();
            
            // Guardar suscripción localmente
            this.saveSubscriptionLocally();
            
            // Sincronizar con servidor (si existe)
            this.syncSubscriptionWithServer();
            
            // Cargar preferencias guardadas
            this.loadNotificationPreferences();
            
        } catch (error) {
            console.error('Error subscribing to push:', error);
            throw error;
        }
    },

    /**
     * Desactiva las notificaciones
     */
    async disableNotifications() {
        if (!this.subscription) return;

        try {
            await this.subscription.unsubscribe();
            this.subscription = null;
            this.isEnabled = false;
            
            // Limpiar datos locales
            localStorage.removeItem('push-subscription');
            localStorage.removeItem('notification-preferences');
            
            this.updateUIState();
            UI.showNotification('Notificaciones desactivadas', 'info');
            
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            UI.showNotification('Error al desactivar notificaciones', 'error');
        }
    },

    /**
     * Configura listeners de eventos de la aplicación
     */
    setupAppEventListeners() {
        // Escuchar eventos globales de la app para enviar notificaciones
        document.addEventListener('match-started', (event) => {
            this.handleMatchStarted(event.detail);
        });
        
        document.addEventListener('match-ended', (event) => {
            this.handleMatchEnded(event.detail);
        });
        
        document.addEventListener('goal-scored', (event) => {
            this.handleGoalScored(event.detail);
        });
        
        document.addEventListener('mvp-selected', (event) => {
            this.handleMvpSelected(event.detail);
        });
        
        document.addEventListener('player-created', (event) => {
            this.handlePlayerCreated(event.detail);
        });
        
        document.addEventListener('tournament-updated', (event) => {
            this.handleTournamentUpdated(event.detail);
        });
        
        document.addEventListener('achievement-unlocked', (event) => {
            this.handleAchievementUnlocked(event.detail);
        });
    },

    /**
     * Maneja inicio de partido
     */
    handleMatchStarted(matchData) {
        if (!this.shouldSendNotification('notify-matches')) return;
        
        this.sendNotification({
            type: this.notificationTypes.MATCH_START,
            title: '⚽ ¡Partido iniciado!',
            body: `${matchData.teamA} vs ${matchData.teamB}`,
            data: {
                matchId: matchData.id,
                action: 'view-match'
            }
        });
    },

    /**
     * Maneja fin de partido
     */
    handleMatchEnded(matchData) {
        if (!this.shouldSendNotification('notify-matches')) return;
        
        const score = `${matchData.scoreA}-${matchData.scoreB}`;
        this.sendNotification({
            type: this.notificationTypes.MATCH_END,
            title: '🏁 ¡Partido finalizado!',
            body: `${matchData.teamA} ${score} ${matchData.teamB}`,
            data: {
                matchId: matchData.id,
                action: 'view-results'
            }
        });
    },

    /**
     * Maneja gol marcado
     */
    handleGoalScored(goalData) {
        if (!this.shouldSendNotification('notify-goals')) return;
        
        this.sendNotification({
            type: this.notificationTypes.GOAL,
            title: '⚽ ¡GOOOL!',
            body: `${goalData.playerName} ha marcado un gol`,
            data: {
                playerId: goalData.playerId,
                matchId: goalData.matchId,
                action: 'view-player'
            }
        });
    },

    /**
     * Maneja MVP seleccionado
     */
    handleMvpSelected(mvpData) {
        if (!this.shouldSendNotification('notify-mvp')) return;
        
        this.sendNotification({
            type: this.notificationTypes.MVP,
            title: '👑 ¡Nuevo MVP!',
            body: `${mvpData.playerName} es el jugador más valioso`,
            data: {
                playerId: mvpData.playerId,
                action: 'view-player'
            }
        });
    },

    /**
     * Maneja jugador creado
     */
    handlePlayerCreated(playerData) {
        if (!this.shouldSendNotification('notify-players')) return;
        
        this.sendNotification({
            type: this.notificationTypes.NEW_PLAYER,
            title: '👤 ¡Nuevo jugador!',
            body: `${playerData.name} se ha unido al equipo`,
            data: {
                playerId: playerData.id,
                action: 'view-player'
            }
        });
    },

    /**
     * Maneja actualización de torneo
     */
    handleTournamentUpdated(tournamentData) {
        if (!this.shouldSendNotification('notify-tournaments')) return;
        
        this.sendNotification({
            type: this.notificationTypes.TOURNAMENT,
            title: '🏆 Actualización de torneo',
            body: `${tournamentData.name}: ${tournamentData.message}`,
            data: {
                tournamentId: tournamentData.id,
                action: 'view-tournament'
            }
        });
    },

    /**
     * Maneja logro desbloqueado
     */
    handleAchievementUnlocked(achievementData) {
        if (!this.shouldSendNotification('notify-achievements')) return;
        
        this.sendNotification({
            type: this.notificationTypes.ACHIEVEMENT,
            title: '🏅 ¡Nuevo logro!',
            body: `${achievementData.title}: ${achievementData.description}`,
            data: {
                achievementId: achievementData.id,
                playerId: achievementData.playerId,
                action: 'view-achievements'
            }
        });
    },

    /**
     * Verifica si se debe enviar una notificación
     */
    shouldSendNotification(preferenceKey) {
        if (!this.isEnabled) return false;
        
        const preferences = this.getNotificationPreferences();
        return preferences[preferenceKey] !== false;
    },

    /**
     * Envía una notificación
     */
    async sendNotification(options) {
        if (!this.isEnabled || Notification.permission !== 'granted') {
            return;
        }

        try {
            // Enviar notificación local (fallback)
            if ('Notification' in window) {
                const notification = new Notification(options.title, {
                    body: options.body,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    tag: options.type,
                    data: options.data,
                    requireInteraction: false,
                    silent: false
                });

                // Cerrar automáticamente después de 5 segundos
                setTimeout(() => {
                    notification.close();
                }, 5000);

                // Manejar click en notificación
                notification.onclick = (event) => {
                    event.preventDefault();
                    window.focus();
                    this.handleNotificationClick(options.data);
                    notification.close();
                };
            }

            // También registrar para estadísticas
            this.logNotification(options);

        } catch (error) {
            console.error('Error sending notification:', error);
        }
    },

    /**
     * Maneja click en notificación
     */
    handleNotificationClick(data) {
        if (!data || !data.action) return;

        switch (data.action) {
            case 'view-match':
                if (data.matchId) {
                    App.navigateToScreen('matches-screen');
                    // Aquí podrías mostrar detalles específicos del partido
                }
                break;
            case 'view-player':
                if (data.playerId) {
                    // Mostrar perfil del jugador
                    App.navigateToScreen('players-screen');
                }
                break;
            case 'view-tournament':
                if (data.tournamentId) {
                    App.navigateToScreen('tournament-screen');
                }
                break;
            case 'view-results':
                App.navigateToScreen('stats-screen');
                break;
            case 'view-achievements':
                // Navegar a sección de logros
                break;
        }
    },

    /**
     * Configura notificaciones programadas
     */
    setupScheduledNotifications() {
        // Verificar recordatorios diarios
        setInterval(() => {
            this.checkDailyReminders();
        }, 60000 * 60); // Cada hora
        
        // Verificar recordatorios de partidos próximos
        setInterval(() => {
            this.checkUpcomingMatches();
        }, 60000 * 15); // Cada 15 minutos
    },

    /**
     * Verifica recordatorios diarios
     */
    checkDailyReminders() {
        const now = new Date();
        const hour = now.getHours();
        
        // Recordatorio diario a las 18:00
        if (hour === 18 && now.getMinutes() === 0) {
            this.sendNotification({
                type: this.notificationTypes.REMINDER,
                title: '⚽ ¡Hora de jugar!',
                body: 'No olvides registrar los partidos de hoy',
                data: { action: 'view-match' }
            });
        }
    },

    /**
     * Verifica partidos próximos
     */
    async checkUpcomingMatches() {
        // Esta función se integraría con el sistema de partidos
        // para notificar sobre partidos programados
    },

    /**
     * Envía notificación de prueba
     */
    sendTestNotification() {
        this.sendNotification({
            type: 'test',
            title: '✅ Notificación de prueba',
            body: '¡Las notificaciones están funcionando correctamente!',
            data: { action: 'test' }
        });
    },

    /**
     * Toggle panel de configuración
     */
    toggleSettings() {
        const panel = document.getElementById('notification-settings');
        if (panel) {
            panel.classList.toggle('show');
        }
    },

    /**
     * Guarda preferencias de notificación
     */
    saveNotificationPreferences() {
        const preferences = {
            'notify-matches': document.getElementById('notify-matches')?.checked ?? true,
            'notify-goals': document.getElementById('notify-goals')?.checked ?? true,
            'notify-mvp': document.getElementById('notify-mvp')?.checked ?? true,
            'notify-players': document.getElementById('notify-players')?.checked ?? true,
            'notify-tournaments': document.getElementById('notify-tournaments')?.checked ?? true,
            'notify-achievements': document.getElementById('notify-achievements')?.checked ?? true
        };
        
        localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    },

    /**
     * Carga preferencias de notificación
     */
    loadNotificationPreferences() {
        const saved = localStorage.getItem('notification-preferences');
        if (!saved) return;
        
        try {
            const preferences = JSON.parse(saved);
            Object.entries(preferences).forEach(([key, value]) => {
                const checkbox = document.getElementById(key);
                if (checkbox) checkbox.checked = value;
            });
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        }
    },

    /**
     * Obtiene preferencias de notificación
     */
    getNotificationPreferences() {
        const saved = localStorage.getItem('notification-preferences');
        if (!saved) {
            return {
                'notify-matches': true,
                'notify-goals': true,
                'notify-mvp': true,
                'notify-players': true,
                'notify-tournaments': true,
                'notify-achievements': true
            };
        }
        
        try {
            return JSON.parse(saved);
        } catch (error) {
            console.error('Error parsing notification preferences:', error);
            return {};
        }
    },

    /**
     * Guarda suscripción localmente
     */
    saveSubscriptionLocally() {
        if (this.subscription) {
            localStorage.setItem('push-subscription', JSON.stringify(this.subscription.toJSON()));
        }
    },

    /**
     * Sincroniza suscripción con servidor
     */
    async syncSubscriptionWithServer() {
        // En una implementación real, aquí enviarías la suscripción al servidor
        console.log('Subscription would be sent to server:', this.subscription?.toJSON());
    },

    /**
     * Registra notificación para estadísticas
     */
    logNotification(options) {
        const log = {
            type: options.type,
            title: options.title,
            timestamp: new Date().toISOString(),
            data: options.data
        };
        
        // Guardar en historial local
        const history = JSON.parse(localStorage.getItem('notification-history') || '[]');
        history.unshift(log);
        
        // Mantener solo las últimas 50 notificaciones
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('notification-history', JSON.stringify(history));
    },

    /**
     * Convierte VAPID key de base64 a Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    /**
     * Obtiene estadísticas de notificaciones
     */
    getNotificationStats() {
        const history = JSON.parse(localStorage.getItem('notification-history') || '[]');
        const stats = {
            total: history.length,
            byType: {},
            recent: history.slice(0, 10)
        };
        
        history.forEach(notification => {
            stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        });
        
        return stats;
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PushNotifications.init());
} else {
    PushNotifications.init();
}

// Exportar para uso global
window.PushNotifications = PushNotifications;