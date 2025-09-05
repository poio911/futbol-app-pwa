/**
 * Sistema de Notificaciones en Tiempo Real
 * Maneja notificaciones, activity ticker y estadísticas en vivo
 */

class NotificationsSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.activities = [];
        this.listeners = [];
        this.currentUser = null;
        this.stats = {
            matchesToday: 0,
            maxMatchesToday: 5,
            pendingEvaluations: 0,
            streak: 0,
            onlineUsers: 0,
            totalMatches: 0,
            averageOVR: 0,
            evaluationRate: 0
        };
    }

    /**
     * Inicializa el sistema de notificaciones
     */
    async initialize() {
        console.log('[NotificationsSystem] Initializing...');
        
        // Obtener usuario actual
        this.currentUser = window.TestApp?.currentUser || window.Storage?.getCurrentPerson();
        
        if (!this.currentUser) {
            console.warn('[NotificationsSystem] No user found, will retry when user logs in');
            // No return aquí, permitir inicialización parcial
            // Se puede reinicializar después cuando el usuario se loguee
        }

        // Cargar notificaciones existentes
        await this.loadNotifications();
        
        // Cargar estadísticas
        await this.loadStats();
        
        // Iniciar listeners de Firebase
        this.startRealtimeListeners();
        
        // Actualizar UI
        this.updateUI();
        
        // Iniciar ticker
        this.startActivityTicker();
        
        console.log('[NotificationsSystem] Initialized successfully');
    }

    /**
     * Carga notificaciones desde Firebase
     */
    async loadNotifications() {
        if (!firebase.firestore || !this.currentUser) return;
        
        try {
            const db = firebase.firestore();
            const userId = this.currentUser.uid || this.currentUser.id;
            
            if (!userId) {
                console.warn('[NotificationsSystem] No user ID available for loading notifications');
                return;
            }
            
            // Cancelar listener anterior si existe
            if (this.notificationsUnsubscribe) {
                this.notificationsUnsubscribe();
            }
            
            // Crear listener en tiempo real para notificaciones
            this.notificationsUnsubscribe = db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .onSnapshot(snapshot => {
                    this.notifications = [];
                    snapshot.forEach(doc => {
                        this.notifications.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    const prevUnreadCount = this.unreadCount;
                    this.unreadCount = this.notifications.filter(n => !n.read).length;
                    
                    console.log(`[NotificationsSystem] Updated ${this.notifications.length} notifications (${this.unreadCount} unread)`);
                    
                    // Si hay nuevas notificaciones no leídas, mostrar toast
                    if (this.unreadCount > prevUnreadCount && this.notifications.length > 0) {
                        const newNotification = this.notifications[0];
                        this.showToastNotification(newNotification);
                    }
                    
                    // Actualizar UI
                    this.updateUI();
                }, error => {
                    console.error('[NotificationsSystem] Error in notifications listener:', error);
                });
        } catch (error) {
            console.error('[NotificationsSystem] Error setting up notifications listener:', error);
        }
    }

    /**
     * Carga estadísticas del sistema
     */
    async loadStats() {
        if (!firebase.firestore) return;
        
        try {
            const db = firebase.firestore();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Si no hay usuario, usar estadísticas generales
            const userId = this.currentUser ? (this.currentUser.uid || this.currentUser.id) : null;
            
            // Partidos de hoy
            const matchesTodaySnapshot = await db.collection('futbol_matches')
                .where('createdAt', '>=', today.toISOString())
                .get();
            
            const userMatchesToday = [];
            if (userId) {
                matchesTodaySnapshot.forEach(doc => {
                    const match = doc.data();
                    // Verificar si el usuario participó
                    const inTeamA = match.teamA?.players?.some(p => p.id === userId);
                    const inTeamB = match.teamB?.players?.some(p => p.id === userId);
                    if (inTeamA || inTeamB) {
                        userMatchesToday.push(match);
                    }
                });
            }
            
            this.stats.matchesToday = userMatchesToday.length;
            
            // Evaluaciones pendientes
            const evaluationsSnapshot = await db.collection('evaluations')
                .where('status', '==', 'pending')
                .get();
            
            let pendingCount = 0;
            if (userId) {
                evaluationsSnapshot.forEach(doc => {
                    const evalData = doc.data();
                    if (evalData.assignments && evalData.assignments[userId] && !evalData.assignments[userId].completed) {
                        pendingCount++;
                    }
                });
            }
            
            this.stats.pendingEvaluations = pendingCount;
            
            // Calcular racha (días consecutivos jugando)
            await this.calculateStreak();
            
            // Usuarios online (simulado por ahora, luego se puede hacer con presence)
            const usersSnapshot = await db.collection('futbol_users').get();
            this.stats.onlineUsers = Math.floor(Math.random() * 5) + 3; // Simulado
            
            // Total de partidos
            const allMatchesSnapshot = await db.collection('futbol_matches').get();
            this.stats.totalMatches = allMatchesSnapshot.size;
            
            // OVR promedio
            let totalOVR = 0;
            let playerCount = 0;
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.ovr) {
                    totalOVR += userData.ovr;
                    playerCount++;
                }
            });
            this.stats.averageOVR = playerCount > 0 ? (totalOVR / playerCount).toFixed(1) : 70;
            
            // Tasa de evaluaciones
            let completedEvals = 0;
            let totalEvals = 0;
            evaluationsSnapshot.forEach(doc => {
                const evalData = doc.data();
                if (evalData.assignments) {
                    totalEvals += Object.keys(evalData.assignments).length;
                    completedEvals += Object.values(evalData.assignments).filter(a => a.completed).length;
                }
            });
            this.stats.evaluationRate = totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0;
            
            console.log('[NotificationsSystem] Stats loaded:', this.stats);
        } catch (error) {
            console.error('[NotificationsSystem] Error loading stats:', error);
        }
    }

    /**
     * Calcula la racha de días consecutivos
     */
    async calculateStreak() {
        if (!firebase.firestore || !this.currentUser) return;
        
        try {
            const db = firebase.firestore();
            const userId = this.currentUser ? (this.currentUser.uid || this.currentUser.id) : null;
            
            if (!userId) {
                this.stats.streak = 0;
                return;
            }
            
            // Obtener últimos 30 días de partidos
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const matchesSnapshot = await db.collection('futbol_matches')
                .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                .orderBy('createdAt', 'desc')
                .get();
            
            const playDates = new Set();
            matchesSnapshot.forEach(doc => {
                const match = doc.data();
                const inTeamA = match.teamA?.players?.some(p => p.id === userId);
                const inTeamB = match.teamB?.players?.some(p => p.id === userId);
                
                if (inTeamA || inTeamB) {
                    const date = new Date(match.createdAt);
                    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    playDates.add(dateStr);
                }
            });
            
            // Calcular racha consecutiva
            let streak = 0;
            const today = new Date();
            
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                
                if (playDates.has(dateStr)) {
                    streak++;
                } else if (i > 0) { // No contar si hoy no jugó aún
                    break;
                }
            }
            
            this.stats.streak = streak;
        } catch (error) {
            console.error('[NotificationsSystem] Error calculating streak:', error);
        }
    }

    /**
     * Inicia listeners en tiempo real
     */
    startRealtimeListeners() {
        if (!firebase.firestore) return;
        
        const db = firebase.firestore();
        const userId = this.currentUser.uid || this.currentUser.id;
        
        // Listener para nuevas notificaciones
        const notifListener = db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const notif = { id: change.doc.id, ...change.doc.data() };
                        
                        // Si es nueva (no está en la lista actual)
                        if (!this.notifications.find(n => n.id === notif.id)) {
                            this.notifications.unshift(notif);
                            if (!notif.read) {
                                this.unreadCount++;
                                this.showToastNotification(notif);
                            }
                        }
                    }
                });
                
                this.updateNotificationBadge();
                this.updateNotificationDropdown();
            });
        
        this.listeners.push(notifListener);
        
        // Listener para actividades globales (para el ticker)
        const activityListener = db.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                this.activities = [];
                snapshot.forEach(doc => {
                    this.activities.push(doc.data());
                });
                this.updateActivityTicker();
            });
        
        this.listeners.push(activityListener);
    }

    /**
     * Crea una nueva notificación
     */
    async createNotification(userId, type, title, message, data = {}) {
        if (!firebase.firestore) return;
        
        // Validar campos requeridos
        if (!userId || !type || !title || !message) {
            console.warn('[NotificationsSystem] Missing required fields for notification:', {
                userId: userId || 'undefined',
                type: type || 'undefined', 
                title: title || 'undefined',
                message: message || 'undefined'
            });
            return;
        }
        
        try {
            const db = firebase.firestore();
            const notification = {
                userId: String(userId), // Ensure it's a string
                type: String(type),
                title: String(title),
                message: String(message),
                data: data || {},
                read: false,
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            await db.collection('notifications').add(notification);
            console.log('[NotificationsSystem] Notification created:', title);
            
            // Si es para el usuario actual, actualizar UI inmediatamente
            const currentUserId = this.currentUser ? (this.currentUser.uid || this.currentUser.id) : null;
            if (currentUserId && userId === currentUserId) {
                // Agregar la notificación localmente
                this.notifications.unshift(notification);
                this.unreadCount++;
                
                // Mostrar toast y actualizar UI
                this.showToastNotification(notification);
                this.updateUI();
            }
        } catch (error) {
            console.error('[NotificationsSystem] Error creating notification:', error);
        }
    }

    /**
     * Crea una actividad global (para el ticker)
     */
    async createActivity(type, message, data = {}) {
        if (!firebase.firestore) return;
        
        // Validar campos requeridos
        if (!type || !message) {
            console.warn('[NotificationsSystem] Missing required fields for activity:', {
                type: type || 'undefined',
                message: message || 'undefined'
            });
            return;
        }
        
        try {
            const db = firebase.firestore();
            const activity = {
                type: String(type),
                message: String(message),
                data: data || {},
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            await db.collection('activities').add(activity);
            
            // Limpiar actividades viejas (mantener solo las últimas 50)
            try {
                const allActivities = await db.collection('activities')
                    .orderBy('timestamp', 'desc')
                    .get();
                
                // Si hay más de 50 actividades, eliminar las más viejas
                if (allActivities.size > 50) {
                    const batch = db.batch();
                    let count = 0;
                    
                    allActivities.forEach(doc => {
                        count++;
                        // Eliminar todas después de las primeras 50
                        if (count > 50) {
                            batch.delete(doc.ref);
                        }
                    });
                    
                    await batch.commit();
                }
            } catch (cleanupError) {
                console.warn('[NotificationsSystem] Could not cleanup old activities:', cleanupError);
            }
            
        } catch (error) {
            console.error('[NotificationsSystem] Error creating activity:', error);
        }
    }

    /**
     * Marca una notificación como leída
     */
    async markAsRead(notificationId) {
        if (!firebase.firestore) return;
        
        try {
            const db = firebase.firestore();
            await db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: Date.now()
            });
            
            const notif = this.notifications.find(n => n.id === notificationId);
            if (notif && !notif.read) {
                notif.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('[NotificationsSystem] Error marking as read:', error);
        }
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    async markAllAsRead() {
        if (!firebase.firestore) return;
        
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            
            this.notifications.forEach(notif => {
                if (!notif.read) {
                    const ref = db.collection('notifications').doc(notif.id);
                    batch.update(ref, { read: true, readAt: Date.now() });
                    notif.read = true;
                }
            });
            
            await batch.commit();
            this.unreadCount = 0;
            this.updateNotificationBadge();
            this.updateNotificationDropdown();
        } catch (error) {
            console.error('[NotificationsSystem] Error marking all as read:', error);
        }
    }

    /**
     * Actualiza el badge de notificaciones
     */
    updateNotificationBadge() {
        const badge = document.querySelector('.notif-badge');
        const bellIcon = document.querySelector('.notif-bell');
        
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
                badge.style.display = 'block';
                
                // Agregar animación de campana
                if (bellIcon) {
                    bellIcon.classList.add('ringing');
                    setTimeout(() => {
                        bellIcon.classList.remove('ringing');
                    }, 2000);
                }
            } else {
                badge.style.display = 'none';
                if (bellIcon) {
                    bellIcon.classList.remove('ringing');
                }
            }
        }
    }

    /**
     * Actualiza el dropdown de notificaciones
     */
    updateNotificationDropdown() {
        const dropdown = document.querySelector('.notifications-list');
        if (!dropdown) return;
        
        if (this.notifications.length === 0) {
            dropdown.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
            return;
        }
        
        dropdown.innerHTML = this.notifications.slice(0, 10).map(notif => {
            const icon = this.getNotificationIcon(notif.type);
            const timeAgo = this.getTimeAgo(notif.timestamp);
            
            return `
                <div class="notif-item ${!notif.read ? 'unread' : ''}" onclick="notificationsSystem.markAsRead('${notif.id}')">
                    <div class="notif-icon">${icon}</div>
                    <div class="notif-content">
                        <div class="notif-text">${notif.message}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Obtiene el icono según el tipo de notificación
     */
    getNotificationIcon(type) {
        const icons = {
            'evaluation': '⚡',
            'evaluation_pending': '🎯',
            'match': '🏆',
            'user_joined': '👋',
            'ovr_change': '📈',
            'achievement': '🏅',
            'system': '📢'
        };
        return icons[type] || '🔔';
    }

    /**
     * Calcula tiempo transcurrido
     */
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
        if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Muestra notificación toast
     */
    showToastNotification(notif) {
        // Crear contenedor de toasts si no existe
        let toastContainer = document.getElementById('notification-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'notification-toast-container';
            toastContainer.className = 'notification-toast-container';
            document.body.appendChild(toastContainer);
            
            // Agregar estilos si no existen
            if (!document.getElementById('notification-toast-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-toast-styles';
                style.textContent = `
                    .notification-toast-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 999999;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        pointer-events: none;
                    }
                    
                    .notification-toast {
                        background: rgba(25, 25, 25, 0.95);
                        backdrop-filter: blur(10px);
                        border-radius: 12px;
                        padding: 16px;
                        min-width: 320px;
                        max-width: 400px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        animation: slideInRight 0.3s ease-out;
                        pointer-events: auto;
                        position: relative;
                    }
                    
                    .notification-toast.match-invite {
                        border-left: 4px solid #00ff9d;
                        background: linear-gradient(90deg, rgba(0, 255, 157, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                    }
                    
                    .notification-toast.match-result {
                        border-left: 4px solid #ffd700;
                        background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                    }
                    
                    .notification-toast.info {
                        border-left: 4px solid #00b4d8;
                        background: linear-gradient(90deg, rgba(0, 180, 216, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                    }
                    
                    .notification-toast.error {
                        border-left: 4px solid #ff4444;
                        background: linear-gradient(90deg, rgba(255, 68, 68, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                    }
                    
                    .toast-icon {
                        font-size: 24px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    
                    .toast-content {
                        flex: 1;
                        color: #ffffff;
                    }
                    
                    .toast-title {
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 4px;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .toast-message {
                        font-size: 13px;
                        opacity: 0.9;
                        line-height: 1.4;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .toast-close {
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        width: 24px;
                        height: 24px;
                        border: none;
                        background: rgba(255, 255, 255, 0.1);
                        color: #ffffff;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        transition: all 0.2s;
                    }
                    
                    .toast-close:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: scale(1.1);
                    }
                    
                    @keyframes slideInRight {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes slideOutRight {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Crear nuevo toast
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notif.type || 'info'}`;
        const toastId = 'toast-' + Date.now();
        toast.id = toastId;
        
        const icon = this.getNotificationIcon(notif.type);
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${notif.title || 'Nueva notificación'}</div>
                <div class="toast-message">${notif.message}</div>
            </div>
            <button class="toast-close" onclick="NotificationsSystem.closeToast('${toastId}')">×</button>
        `;
        
        // Agregar al contenedor
        toastContainer.appendChild(toast);
        
        // Auto-cerrar después de 8 segundos
        setTimeout(() => {
            this.closeToast(toastId);
        }, 8000);
    }
    
    /**
     * Cierra un toast específico
     */
    static closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
    
    /**
     * Método de instancia para cerrar toast
     */
    closeToast(toastId) {
        NotificationsSystem.closeToast(toastId);
    }

    /**
     * Inicia el ticker de actividades
     */
    startActivityTicker() {
        this.updateActivityTicker();
        
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.updateActivityTicker();
        }, 30000);
    }

    /**
     * Actualiza la actividad del footer
     */
    updateActivityTicker() {
        const footerActivity = document.getElementById('footer-activity');
        if (!footerActivity) return;
        
        // Mostrar la actividad más reciente
        let lastActivity = 'Sistema iniciado correctamente';
        
        // Usar la actividad más reciente si existe
        if (this.activities.length > 0) {
            const activity = this.activities[0];
            // Limpiar HTML tags para mostrar solo texto
            lastActivity = activity.message.replace(/<[^>]*>/g, '');
        }
        
        footerActivity.textContent = lastActivity;
    }

    /**
     * Actualiza toda la UI
     */
    updateUI() {
        // Actualizar badge
        this.updateNotificationBadge();
        
        // Actualizar dropdown
        this.updateNotificationDropdown();
        
        // Actualizar stats en header
        this.updateHeaderStats();
        
        // Actualizar footer stats
        this.updateFooterStats();
        
        // Actualizar ticker
        this.updateActivityTicker();
    }

    /**
     * Actualiza las estadísticas del header
     */
    updateHeaderStats() {
        // Partidos de hoy
        const matchesTodayEl = document.querySelector('[data-stat="matches-today"]');
        if (matchesTodayEl) {
            matchesTodayEl.textContent = `${this.stats.matchesToday}/${this.stats.maxMatchesToday}`;
        }
        
        // Evaluaciones pendientes
        const pendingEvalsEl = document.querySelector('[data-stat="pending-evaluations"]');
        if (pendingEvalsEl) {
            pendingEvalsEl.textContent = this.stats.pendingEvaluations;
        }
        
        // Racha
        const streakEl = document.querySelector('[data-stat="streak"]');
        if (streakEl) {
            streakEl.textContent = `${this.stats.streak} días`;
            const streakContainer = streakEl.closest('.streak');
            if (streakContainer) {
                streakContainer.style.display = this.stats.streak > 0 ? 'flex' : 'none';
            }
        }
    }

    /**
     * Actualiza las estadísticas del footer
     */
    updateFooterStats() {
        // Usuarios online
        const onlineEl = document.querySelector('[data-footer-stat="online"]');
        if (onlineEl) {
            onlineEl.textContent = this.stats.onlineUsers;
        }
        
        // Partidos activos
        const activeMatchesEl = document.querySelector('[data-footer-stat="active-matches"]');
        if (activeMatchesEl) {
            activeMatchesEl.textContent = this.stats.matchesToday;
        }
        
        // Total partidos
        const totalMatchesEl = document.querySelector('[data-footer-stat="total-matches"]');
        if (totalMatchesEl) {
            totalMatchesEl.textContent = this.stats.totalMatches;
        }
        
        // OVR promedio
        const avgOVREl = document.querySelector('[data-footer-stat="avg-ovr"]');
        if (avgOVREl) {
            avgOVREl.textContent = this.stats.averageOVR;
        }
        
        // Tasa de evaluaciones
        const evalRateEl = document.querySelector('[data-footer-stat="eval-rate"]');
        if (evalRateEl) {
            evalRateEl.textContent = `${this.stats.evaluationRate}%`;
        }
    }

    /**
     * Limpia los listeners
     */
    cleanup() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
    }
}

// Crear instancia global
const notificationsSystem = new NotificationsSystem();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.notificationsSystem = notificationsSystem;
}