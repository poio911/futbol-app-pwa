/**
 * FC24 Team Manager - Unified Notifications System
 * Sistema unificado de notificaciones con tema EA SPORTS
 * 
 * Integra y unifica:
 * - NotificationsSystem (Firebase + toasts)
 * - EAModal (modales temáticos)
 * - ProfileManager fallbacks
 * - SettingsManager configuraciones
 * - Alert/confirm nativos
 */

class UnifiedNotificationSystem {
    constructor() {
        this.settings = {
            sounds: true,
            pushNotifications: true,
            confirmations: true,
            autoRefresh: 30000,
            animations: true,
            toastDuration: 5000,
            maxToasts: 3
        };
        
        this.notifications = [];
        this.unreadCount = 0;
        this.activities = [];
        this.listeners = [];
        this.currentUser = null;
        this.activeToasts = [];
        
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

        // Promise resolvers para modales
        this.modalResolve = null;
        this.modalReject = null;
        
        this.init();
    }

    /**
     * Inicializar sistema unificado
     */
    async init() {
        console.log('🚀 [UnifiedNotifications] Inicializando sistema unificado...');
        
        // Cargar configuraciones desde SettingsManager
        this.loadSettingsFromManager();
        
        // Crear elementos DOM necesarios
        this.createNotificationElements();
        
        // Obtener usuario actual
        this.currentUser = this.getCurrentUser();
        
        // Inicializar Firebase listeners si hay usuario
        if (this.currentUser) {
            await this.initializeFirebase();
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Reemplazar métodos nativos
        this.overrideNativeMethods();
        
        console.log('✅ [UnifiedNotifications] Sistema inicializado correctamente');
    }

    /**
     * Cargar configuraciones del SettingsManager
     */
    loadSettingsFromManager() {
        if (window.settingsManager?.settings?.notifications) {
            const notifSettings = window.settingsManager.settings.notifications;
            this.settings = {
                ...this.settings,
                sounds: notifSettings.sounds !== false,
                pushNotifications: notifSettings.pushNotifications !== false,
                confirmations: notifSettings.confirmations !== false,
                autoRefresh: notifSettings.autoRefresh || 30000
            };
        }
    }

    /**
     * Crear elementos DOM necesarios
     */
    createNotificationElements() {
        // Crear contenedor de toasts si no existe
        if (!document.getElementById('unified-toast-container')) {
            const container = document.createElement('div');
            container.id = 'unified-toast-container';
            container.className = 'unified-toast-container';
            document.body.appendChild(container);
        }

        // Crear modal container si no existe
        if (!document.getElementById('unified-modal-overlay')) {
            const modalHTML = `
                <div id="unified-modal-overlay" class="unified-modal-overlay">
                    <div class="unified-modal">
                        <div class="unified-modal-header">
                            <h2 id="unified-modal-title" class="unified-modal-title"></h2>
                            <button id="unified-modal-close" class="unified-modal-close">✕</button>
                        </div>
                        <div class="unified-modal-body">
                            <i id="unified-modal-icon" class="unified-modal-icon"></i>
                            <div id="unified-modal-message" class="unified-modal-message"></div>
                            <input id="unified-modal-input" class="unified-modal-input" style="display: none;" />
                        </div>
                        <div id="unified-modal-actions" class="unified-modal-actions"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Inyectar estilos CSS
        this.injectStyles();
    }

    /**
     * Inyectar estilos CSS del sistema unificado
     */
    injectStyles() {
        if (document.getElementById('unified-notifications-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'unified-notifications-styles';
        styles.textContent = `
            /* === UNIFIED TOAST SYSTEM === */
            .unified-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 400px;
            }

            .unified-toast {
                background: rgba(15, 15, 15, 0.95);
                backdrop-filter: blur(15px);
                border-radius: 12px;
                padding: 16px 20px;
                min-width: 320px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }

            .unified-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: var(--toast-accent, var(--primary));
            }

            /* Tipos de toast */
            .unified-toast.success {
                --toast-accent: var(--primary);
                border-color: rgba(0, 255, 157, 0.3);
                background: linear-gradient(135deg, 
                    rgba(0, 255, 157, 0.1) 0%, 
                    rgba(15, 15, 15, 0.95) 100%);
            }

            .unified-toast.error {
                --toast-accent: #ff4444;
                border-color: rgba(255, 68, 68, 0.3);
                background: linear-gradient(135deg, 
                    rgba(255, 68, 68, 0.1) 0%, 
                    rgba(15, 15, 15, 0.95) 100%);
            }

            .unified-toast.warning {
                --toast-accent: #ffaa00;
                border-color: rgba(255, 170, 0, 0.3);
                background: linear-gradient(135deg, 
                    rgba(255, 170, 0, 0.1) 0%, 
                    rgba(15, 15, 15, 0.95) 100%);
            }

            .unified-toast.info {
                --toast-accent: #00b4d8;
                border-color: rgba(0, 180, 216, 0.3);
                background: linear-gradient(135deg, 
                    rgba(0, 180, 216, 0.1) 0%, 
                    rgba(15, 15, 15, 0.95) 100%);
            }

            .unified-toast-icon {
                font-size: 24px;
                flex-shrink: 0;
                margin-top: 2px;
                filter: drop-shadow(0 0 8px currentColor);
            }

            .unified-toast-content {
                flex: 1;
                color: #ffffff;
            }

            .unified-toast-title {
                font-weight: 700;
                font-size: 15px;
                margin-bottom: 4px;
                font-family: 'Poppins', sans-serif;
                color: var(--toast-accent, #ffffff);
                text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
            }

            .unified-toast-message {
                font-size: 14px;
                opacity: 0.9;
                line-height: 1.4;
                font-family: 'Poppins', sans-serif;
            }

            .unified-toast-close {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 28px;
                height: 28px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            }

            .unified-toast-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            .unified-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: var(--toast-accent, var(--primary));
                transition: width linear;
                opacity: 0.7;
            }

            /* === UNIFIED MODAL SYSTEM === */
            .unified-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 1000000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .unified-modal-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            .unified-modal {
                background: rgba(20, 20, 20, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.8),
                    0 0 40px rgba(0, 255, 157, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 157, 0.3);
                transform: scale(0.8) translateY(40px);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .unified-modal-overlay.show .unified-modal {
                transform: scale(1) translateY(0);
            }

            .unified-modal-header {
                background: linear-gradient(135deg, 
                    rgba(0, 255, 157, 0.1) 0%, 
                    rgba(40, 40, 40, 0.8) 100%);
                padding: 20px 24px;
                border-bottom: 1px solid rgba(0, 255, 157, 0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .unified-modal-title {
                color: var(--primary);
                font-size: 18px;
                font-weight: 700;
                margin: 0;
                font-family: 'Poppins', sans-serif;
                text-shadow: 0 0 15px rgba(0, 255, 157, 0.5);
            }

            .unified-modal-close {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
            }

            .unified-modal-close:hover {
                background: rgba(255, 68, 68, 0.2);
                border-color: rgba(255, 68, 68, 0.5);
                transform: rotate(90deg) scale(1.1);
            }

            .unified-modal-body {
                padding: 24px;
                text-align: center;
            }

            .unified-modal-icon {
                font-size: 48px;
                margin-bottom: 16px;
                display: inline-block;
                filter: drop-shadow(0 0 20px currentColor);
            }

            .unified-modal-message {
                color: #ffffff;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
                font-family: 'Poppins', sans-serif;
            }

            .unified-modal-input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(40, 40, 40, 0.8);
                border: 1px solid rgba(0, 255, 157, 0.3);
                border-radius: 8px;
                color: #ffffff;
                font-size: 16px;
                font-family: 'Poppins', sans-serif;
                transition: all 0.3s ease;
                margin-bottom: 20px;
            }

            .unified-modal-input:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 2px rgba(0, 255, 157, 0.2);
                background: rgba(40, 40, 40, 0.9);
            }

            .unified-modal-actions {
                padding: 20px 24px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                border-top: 1px solid rgba(0, 255, 157, 0.1);
                background: rgba(40, 40, 40, 0.5);
            }

            .unified-modal-button {
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                font-family: 'Poppins', sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .unified-modal-button.primary {
                background: linear-gradient(90deg, var(--primary), var(--secondary));
                color: #000000;
                box-shadow: 0 4px 16px rgba(0, 255, 157, 0.4);
            }

            .unified-modal-button.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 255, 157, 0.5);
            }

            .unified-modal-button.secondary {
                background: rgba(60, 60, 60, 0.8);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .unified-modal-button.secondary:hover {
                background: rgba(80, 80, 80, 0.9);
                border-color: rgba(255, 255, 255, 0.3);
            }

            /* === ANIMATIONS === */
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

            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            /* === RESPONSIVE === */
            @media (max-width: 480px) {
                .unified-toast-container {
                    right: 10px;
                    left: 10px;
                    top: 10px;
                }

                .unified-toast {
                    min-width: unset;
                    width: 100%;
                }

                .unified-modal {
                    width: 95%;
                    margin: 10px;
                }

                .unified-modal-actions {
                    flex-direction: column;
                }

                .unified-modal-button {
                    width: 100%;
                }
            }

            /* === REDUCED ANIMATIONS === */
            .reduced-animations .unified-toast,
            .reduced-animations .unified-modal {
                animation: none;
                transition: none;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Obtener usuario actual de múltiples fuentes
     */
    getCurrentUser() {
        // Prioridad 1: CleanHeader
        if (window.cleanHeader?.currentUser) {
            return window.cleanHeader.currentUser;
        }
        
        // Prioridad 2: AuthSystem
        if (window.AuthSystem?.currentUser) {
            return window.AuthSystem.currentUser;
        }
        
        // Prioridad 3: TestApp
        if (window.TestApp?.currentUser) {
            return window.TestApp.currentUser;
        }
        
        // Prioridad 4: ProfileManager
        if (window.profileManager?.currentUser) {
            return window.profileManager.currentUser;
        }
        
        // Prioridad 5: localStorage
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.warn('Error loading user from localStorage:', e);
        }
        
        return null;
    }

    /**
     * Inicializar Firebase listeners
     */
    async initializeFirebase() {
        if (!firebase?.firestore || !this.currentUser) return;
        
        try {
            const db = firebase.firestore();
            const userId = this.currentUser.uid || this.currentUser.id;
            
            console.log('🔥 [UnifiedNotifications] Inicializando Firebase listeners...');
            
            // Listener para notificaciones personales
            const notificationsListener = db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .onSnapshot(
                    snapshot => this.handleNotificationsUpdate(snapshot),
                    error => console.error('[UnifiedNotifications] Error en listener notifications:', error)
                );
            
            this.listeners.push(notificationsListener);
            
            // Listener para actividades globales
            const activitiesListener = db.collection('activities')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .onSnapshot(
                    snapshot => this.handleActivitiesUpdate(snapshot),
                    error => console.error('[UnifiedNotifications] Error en listener activities:', error)
                );
            
            this.listeners.push(activitiesListener);
            
            // Cargar estadísticas iniciales
            await this.loadStats();
            
        } catch (error) {
            console.error('[UnifiedNotifications] Error inicializando Firebase:', error);
        }
    }

    /**
     * Manejar actualización de notificaciones
     */
    handleNotificationsUpdate(snapshot) {
        const prevUnreadCount = this.unreadCount;
        this.notifications = [];
        
        snapshot.forEach(doc => {
            this.notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        console.log('📋 [UnifiedNotifications] ' + this.notifications.length + ' notificaciones cargadas, ' + this.unreadCount + ' no leidas');
        
        // Si hay nuevas notificaciones no leídas, mostrar toast
        if (this.unreadCount > prevUnreadCount && this.notifications.length > 0) {
            const newNotification = this.notifications[0];
            if (!newNotification.read) {
                this.showToast(
                    newNotification.message,
                    newNotification.type || 'info',
                    newNotification.title || 'Nueva notificación'
                );
            }
        }
        
        this.updateNotificationBadge();
    }

    /**
     * Manejar actualización de actividades
     */
    handleActivitiesUpdate(snapshot) {
        this.activities = [];
        snapshot.forEach(doc => {
            this.activities.push(doc.data());
        });
        
        console.log('📊 [UnifiedNotifications] ' + this.activities.length + ' actividades cargadas');
        this.updateActivityTicker();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Cerrar modal al hacer clic en overlay
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'unified-modal-overlay') {
                this.closeModal(false);
            }
        });
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('unified-modal-overlay');
                if (overlay?.classList.contains('show')) {
                    this.closeModal(false);
                }
            }
        });
        
        // Event listeners para el modal
        const closeBtn = document.getElementById('unified-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(false));
        }
        
        // Actualizar configuraciones cuando cambien
        document.addEventListener('settingsChanged', (e) => {
            if (e.detail?.notifications) {
                this.loadSettingsFromManager();
            }
        });
    }

    /**
     * Reemplazar métodos nativos
     */
    overrideNativeMethods() {
        // Guardar referencias originales
        this._originalAlert = window.alert;
        this._originalConfirm = window.confirm;
        this._originalPrompt = window.prompt;
        
        // Reemplazar con versiones EA SPORTS
        window.alert = (message, title) => this.alert(message, title);
        window.confirm = (message, title) => this.confirm(message, title);
        window.prompt = (message, defaultValue, title) => this.prompt(message, defaultValue, title);
        
        console.log('🔄 [UnifiedNotifications] Métodos nativos reemplazados');
    }

    // ============= PUBLIC API METHODS =============

    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info', title = null, duration = null) {
        if (!this.settings.pushNotifications) return;
        
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const toastDuration = duration || this.settings.toastDuration;
        
        const toast = this.createToastElement(toastId, message, type, title);
        
        // Limitar número de toasts activos
        if (this.activeToasts.length >= this.settings.maxToasts) {
            this.removeToast(this.activeToasts[0]);
        }
        
        // Agregar al contenedor
        const container = document.getElementById('unified-toast-container');
        if (container) {
            container.appendChild(toast);
            this.activeToasts.push(toastId);
            
            // Reproducir sonido si está habilitado
            if (this.settings.sounds) {
                this.playNotificationSound(type);
            }
            
            // Auto-cerrar
            setTimeout(() => {
                this.removeToast(toastId);
            }, toastDuration);
        }
        
        return toastId;
    }

    /**
     * Crear elemento toast
     */
    createToastElement(toastId, message, type, title) {
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'unified-toast ' + type;
        
        const icon = this.getNotificationIcon(type);
        
        toast.innerHTML = 
            '<div class="unified-toast-icon">' + icon + '</div>' +
            '<div class="unified-toast-content">' +
                (title ? '<div class="unified-toast-title">' + title + '</div>' : '') +
                '<div class="unified-toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="unified-toast-close" onclick="window.unifiedNotifications.removeToast(\'' + toastId + '\')">×</button>' +
            '<div class="unified-toast-progress"></div>';
        
        // Configurar progress bar
        const progressBar = toast.querySelector('.unified-toast-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressBar.style.width = '0%';
                progressBar.style.transition = 'width ' + this.settings.toastDuration + 'ms linear';
            }, 100);
        }
        
        return toast;
    }

    /**
     * Remover toast
     */
    removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                
                // Remover de lista activa
                const index = this.activeToasts.indexOf(toastId);
                if (index > -1) {
                    this.activeToasts.splice(index, 1);
                }
            }, 300);
        }
    }

    /**
     * Alert EA SPORTS
     */
    alert(message, title = '⚡ Notificación') {
        return this.showModal({
            title,
            message,
            type: 'info',
            buttons: [{ text: 'Entendido', primary: true, value: true }]
        });
    }

    /**
     * Confirm EA SPORTS
     */
    confirm(message, title = '⚠️ Confirmación') {
        if (!this.settings.confirmations) {
            return Promise.resolve(true); // Auto-confirmar si está deshabilitado
        }
        
        return this.showModal({
            title,
            message,
            type: 'warning',
            buttons: [
                { text: 'Cancelar', secondary: true, value: false },
                { text: 'Confirmar', primary: true, value: true }
            ]
        });
    }

    /**
     * Prompt EA SPORTS
     */
    prompt(message, defaultValue = '', title = '✏️ Ingresa Datos') {
        return this.showModal({
            title,
            message,
            type: 'info',
            input: true,
            inputValue: defaultValue,
            buttons: [
                { text: 'Cancelar', secondary: true, value: null },
                { text: 'Confirmar', primary: true, value: 'input' }
            ]
        });
    }

    /**
     * Mostrar modal personalizado
     */
    showModal(options = {}) {
        return new Promise((resolve, reject) => {
            this.modalResolve = resolve;
            this.modalReject = reject;
            
            const overlay = document.getElementById('unified-modal-overlay');
            const title = document.getElementById('unified-modal-title');
            const icon = document.getElementById('unified-modal-icon');
            const message = document.getElementById('unified-modal-message');
            const input = document.getElementById('unified-modal-input');
            const actions = document.getElementById('unified-modal-actions');
            
            if (!overlay) return resolve(false);
            
            // Configurar contenido
            title.textContent = options.title || 'Notificación';
            icon.textContent = this.getNotificationIcon(options.type || 'info');
            message.textContent = options.message || '';
            
            // Configurar input
            if (options.input) {
                input.style.display = 'block';
                input.value = options.inputValue || '';
                input.focus();
            } else {
                input.style.display = 'none';
            }
            
            // Configurar botones
            actions.innerHTML = '';
            (options.buttons || []).forEach(button => {
                const btn = document.createElement('button');
                btn.textContent = button.text;
                btn.className = 'unified-modal-button ' + (button.primary ? 'primary' : 'secondary');
                btn.onclick = () => {
                    let result = button.value;
                    if (result === 'input') {
                        result = input.value;
                    }
                    this.closeModal(result);
                };
                actions.appendChild(btn);
            });
            
            // Mostrar modal
            overlay.classList.add('show');
            
            // Reproducir sonido
            if (this.settings.sounds) {
                this.playNotificationSound(options.type || 'info');
            }
        });
    }

    /**
     * Cerrar modal
     */
    closeModal(result) {
        const overlay = document.getElementById('unified-modal-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            
            setTimeout(() => {
                if (this.modalResolve) {
                    this.modalResolve(result);
                    this.modalResolve = null;
                    this.modalReject = null;
                }
            }, 100);
        }
    }

    // ============= FIREBASE METHODS =============

    /**
     * Crear notificación en Firebase
     */
    async createNotification(userId, type, title, message, data = {}) {
        if (!firebase?.firestore) return;
        
        try {
            const db = firebase.firestore();
            const notification = {
                userId: String(userId),
                type: String(type),
                title: String(title),
                message: String(message),
                data: data || {},
                read: false,
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            await db.collection('notifications').add(notification);
            console.log('📨 [UnifiedNotifications] Notificación creada:', title);
            
        } catch (error) {
            console.error('[UnifiedNotifications] Error creando notificación:', error);
        }
    }

    /**
     * Crear actividad global
     */
    async createActivity(type, message, data = {}) {
        if (!firebase?.firestore) return;
        
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
            
            // Limpiar actividades viejas
            this.cleanupOldActivities();
            
        } catch (error) {
            console.error('[UnifiedNotifications] Error creando actividad:', error);
        }
    }

    /**
     * Limpiar actividades viejas
     */
    async cleanupOldActivities() {
        if (!firebase?.firestore) return;
        
        try {
            const db = firebase.firestore();
            const allActivities = await db.collection('activities')
                .orderBy('timestamp', 'desc')
                .get();
            
            if (allActivities.size > 50) {
                const batch = db.batch();
                let count = 0;
                
                allActivities.forEach(doc => {
                    count++;
                    if (count > 50) {
                        batch.delete(doc.ref);
                    }
                });
                
                await batch.commit();
            }
        } catch (error) {
            console.warn('[UnifiedNotifications] Error limpiando actividades:', error);
        }
    }

    /**
     * Cargar estadísticas
     */
    async loadStats() {
        if (!firebase?.firestore) return;
        
        try {
            const db = firebase.firestore();
            const userId = this.currentUser ? (this.currentUser.uid || this.currentUser.id) : null;
            
            // Implementar carga de estadísticas
            // (Esta es la misma lógica del NotificationsSystem original)
            
            console.log('📊 [UnifiedNotifications] Estadísticas cargadas:', this.stats);
            this.updateUI();
            
        } catch (error) {
            console.error('[UnifiedNotifications] Error cargando estadísticas:', error);
        }
    }

    // ============= UTILITY METHODS =============

    /**
     * Obtener icono según tipo
     */
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
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
     * Reproducir sonido de notificación
     */
    playNotificationSound(type = 'info') {
        if (!this.settings.sounds) return;
        
        try {
            // Crear audio context si no existe
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Frecuencias para diferentes tipos
            const frequencies = {
                'success': [800, 1000],
                'error': [400, 200],
                'warning': [600, 800, 600],
                'info': [600, 800]
            };
            
            const freqs = frequencies[type] || frequencies.info;
            
            // Reproducir secuencia de tonos
            freqs.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                }, index * 100);
            });
            
        } catch (error) {
            console.warn('[UnifiedNotifications] Error reproduciendo sonido:', error);
        }
    }

    /**
     * Actualizar badge de notificaciones
     */
    updateNotificationBadge() {
        const badge = document.querySelector('.notif-badge, .notification-badge');
        const bellIcon = document.querySelector('.notif-bell, .notification-bell');
        
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
                badge.style.display = 'block';
                
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
     * Actualizar ticker de actividades
     */
    updateActivityTicker() {
        const footerActivity = document.getElementById('footer-activity');
        if (!footerActivity) return;
        
        let lastActivity = 'Sistema iniciado correctamente';
        
        if (this.activities.length > 0) {
            const activity = this.activities[0];
            lastActivity = activity.message.replace(/<[^>]*>/g, '');
        }
        
        footerActivity.textContent = lastActivity;
    }

    /**
     * Actualizar toda la UI
     */
    updateUI() {
        this.updateNotificationBadge();
        this.updateActivityTicker();
        // Aquí se pueden agregar más actualizaciones de UI
    }

    /**
     * Limpiar listeners
     */
    cleanup() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
        
        // Restaurar métodos nativos
        if (this._originalAlert) window.alert = this._originalAlert;
        if (this._originalConfirm) window.confirm = this._originalConfirm;
        if (this._originalPrompt) window.prompt = this._originalPrompt;
    }

    // ============= COMPATIBILITY METHODS =============

    /**
     * Métodos de compatibilidad con sistemas existentes
     */
    
    // Para ProfileManager
    show(message, type) {
        return this.showToast(message, type);
    }
    
    // Para NotificationsSystem legacy
    showToastNotification(notif) {
        return this.showToast(
            notif.message,
            notif.type || 'info',
            notif.title
        );
    }
    
    // Para EAModal legacy
    showEAModal(options) {
        return this.showModal(options);
    }
}

// Crear instancia global
const unifiedNotifications = new UnifiedNotificationSystem();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.unifiedNotifications = unifiedNotifications;
    window.UnifiedNotifications = unifiedNotifications;
    window.notificationsSystem = unifiedNotifications; // Compatibilidad con sistema viejo
    window.NotificationsSystem = unifiedNotifications; // Compatibilidad
    window.EAModal = unifiedNotifications; // Compatibilidad
}

console.log('🎯 UnifiedNotificationSystem inicializado y disponible globalmente');