/**
 * Session Manager - Gestión mejorada de sesiones con control por dispositivo
 * Previene sesiones persistentes no deseadas y mejora la seguridad
 */

const SessionManager = {
    // Configuración de sesiones
    config: {
        SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 horas por defecto
        USE_SESSION_STORAGE: true, // Usar sessionStorage en lugar de localStorage
        REQUIRE_DEVICE_MATCH: false, // Desactivado temporalmente para evitar logouts inmediatos
        AUTO_LOGOUT_ON_CLOSE: true, // Cerrar sesión al cerrar el navegador
        MULTI_TAB_SYNC: true, // Sincronizar sesión entre pestañas
    },
    
    // Estado actual
    currentSession: null,
    sessionCheckInterval: null,
    
    /**
     * Inicializar el gestor de sesiones
     */
    init() {
        console.log('🔐 Inicializando SessionManager...');
        
        // Limpiar cualquier sesión antigua al cargar
        this.cleanOldSessions();
        
        // Configurar listeners para eventos del navegador
        this.setupBrowserListeners();
        
        // Iniciar verificación periódica de sesión
        this.startSessionMonitoring();
        
        // Sincronizar entre pestañas si está habilitado
        if (this.config.MULTI_TAB_SYNC) {
            this.setupTabSync();
        }
        
        console.log('✅ SessionManager inicializado');
    },
    
    /**
     * Crear nueva sesión para usuario autenticado
     */
    createSession(userData) {
        console.log('📝 Creando nueva sesión para:', userData.displayName);
        
        // Generar ID único de sesión
        const sessionId = this.generateSessionId();
        
        // Crear objeto de sesión con metadata
        const session = {
            id: sessionId,
            user: userData,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.SESSION_TIMEOUT,
            deviceFingerprint: this.getDeviceFingerprint(),
            browserInfo: this.getBrowserInfo(),
            isActive: true,
            lastActivity: Date.now()
        };
        
        // Guardar en el storage apropiado
        this.saveSession(session);
        
        // Establecer como sesión actual
        this.currentSession = session;
        
        // Registrar en Firebase para tracking multi-dispositivo
        this.registerSessionInFirebase(session);
        
        console.log('✅ Sesión creada:', sessionId);
        return session;
    },
    
    /**
     * Validar sesión existente
     */
    async validateSession(sessionData) {
        if (!sessionData) return false;
        
        console.log('🔍 Validando sesión:', sessionData.id);
        
        // Verificar expiración
        if (Date.now() > sessionData.expiresAt) {
            console.log('⏰ Sesión expirada');
            return false;
        }
        
        // Verificar dispositivo si está habilitado
        if (this.config.REQUIRE_DEVICE_MATCH) {
            const currentFingerprint = this.getDeviceFingerprint();
            if (sessionData.deviceFingerprint !== currentFingerprint) {
                console.log('🔒 Dispositivo no coincide');
                return false;
            }
        }
        
        // Verificar si la sesión fue cerrada remotamente
        const isRemoteClosed = await this.checkRemoteSessionStatus(sessionData.id);
        if (isRemoteClosed) {
            console.log('🚫 Sesión cerrada remotamente');
            return false;
        }
        
        // Actualizar última actividad
        sessionData.lastActivity = Date.now();
        this.saveSession(sessionData);
        
        return true;
    },
    
    /**
     * Obtener sesión actual
     */
    getCurrentSession() {
        if (this.currentSession) {
            return this.currentSession;
        }
        
        // Intentar recuperar del storage
        const stored = this.config.USE_SESSION_STORAGE ? 
            sessionStorage.getItem('app_session') : 
            localStorage.getItem('app_session');
            
        if (stored) {
            try {
                const session = JSON.parse(stored);
                if (this.validateSession(session)) {
                    this.currentSession = session;
                    return session;
                }
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        }
        
        return null;
    },
    
    /**
     * Cerrar sesión actual
     */
    async closeSession() {
        console.log('🚪 Cerrando sesión...');
        
        if (this.currentSession) {
            // Marcar como cerrada en Firebase
            await this.markSessionClosedInFirebase(this.currentSession.id);
            
            // Notificar a otras pestañas
            if (this.config.MULTI_TAB_SYNC) {
                this.broadcastSessionClose();
            }
        }
        
        // Limpiar storage
        sessionStorage.removeItem('app_session');
        localStorage.removeItem('app_session');
        localStorage.setItem('session_closed', 'true');
        
        // Limpiar estado
        this.currentSession = null;
        
        // Detener monitoreo
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
        
        console.log('✅ Sesión cerrada completamente');
    },
    
    /**
     * Guardar sesión en storage
     */
    saveSession(session) {
        const storage = this.config.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        storage.setItem('app_session', JSON.stringify(session));
        
        // También guardar marca de tiempo para sincronización
        localStorage.setItem('session_timestamp', session.lastActivity.toString());
    },
    
    /**
     * Limpiar sesiones antiguas
     */
    cleanOldSessions() {
        // Limpiar localStorage de sesiones viejas
        const keysToRemove = [
            'auth_current_session',
            'testapp_user',
            'testapp_group',
            'activeManualMatch'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Limpiar sessionStorage
        sessionStorage.clear();
    },
    
    /**
     * Generar ID único de sesión
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Obtener fingerprint del dispositivo
     */
    getDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            navigator.platform,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.maxTouchPoints || 0
        ];
        
        // Crear hash simple
        let hash = 0;
        const str = components.join('|');
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return hash.toString(36);
    },
    
    /**
     * Obtener información del navegador
     */
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    },
    
    /**
     * Configurar listeners del navegador
     */
    setupBrowserListeners() {
        // Detectar cierre de pestaña/ventana
        window.addEventListener('beforeunload', (e) => {
            if (this.config.AUTO_LOGOUT_ON_CLOSE && this.currentSession) {
                // Marcar sesión como pendiente de cierre
                this.markSessionPendingClose();
            }
        });
        
        // Detectar cuando la página vuelve a ser visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentSession) {
                this.validateSession(this.currentSession);
            }
        });
        
        // Detectar inactividad
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                console.log('⏰ Sesión cerrada por inactividad');
                this.closeSession();
                if (window.AuthSystem) {
                    window.AuthSystem.logout();
                }
            }, this.config.SESSION_TIMEOUT);
        };
        
        // Eventos de actividad
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    },
    
    /**
     * Iniciar monitoreo de sesión
     */
    startSessionMonitoring() {
        // Verificar sesión cada minuto
        this.sessionCheckInterval = setInterval(async () => {
            if (this.currentSession) {
                const isValid = await this.validateSession(this.currentSession);
                if (!isValid) {
                    console.log('❌ Sesión inválida, cerrando...');
                    await this.closeSession();
                    if (window.AuthSystem) {
                        window.AuthSystem.logout();
                    }
                }
            }
        }, 60000); // Cada minuto
    },
    
    /**
     * Configurar sincronización entre pestañas
     */
    setupTabSync() {
        // Escuchar cambios en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'session_closed' && e.newValue === 'true') {
                console.log('📢 Sesión cerrada en otra pestaña');
                this.currentSession = null;
                if (window.AuthSystem) {
                    window.AuthSystem.handleUserSignedOut();
                }
            }
            
            if (e.key === 'session_timestamp' && this.currentSession) {
                // Sincronizar timestamp de actividad
                const newTimestamp = parseInt(e.newValue);
                if (newTimestamp > this.currentSession.lastActivity) {
                    this.currentSession.lastActivity = newTimestamp;
                }
            }
        });
    },
    
    /**
     * Registrar sesión en Firebase
     */
    async registerSessionInFirebase(session) {
        if (!window.db) return;
        
        try {
            await db.collection('active_sessions').doc(session.id).set({
                userId: session.user.uid,
                deviceFingerprint: session.deviceFingerprint,
                browserInfo: session.browserInfo,
                createdAt: new Date(session.createdAt).toISOString(),
                expiresAt: new Date(session.expiresAt).toISOString(),
                isActive: true
            });
        } catch (error) {
            console.error('Error registering session:', error);
        }
    },
    
    /**
     * Verificar estado remoto de sesión
     */
    async checkRemoteSessionStatus(sessionId) {
        if (!window.db) return false;
        
        try {
            const doc = await db.collection('active_sessions').doc(sessionId).get();
            if (doc.exists) {
                const data = doc.data();
                return !data.isActive;
            }
        } catch (error) {
            console.error('Error checking remote session:', error);
        }
        
        return false;
    },
    
    /**
     * Marcar sesión como cerrada en Firebase
     */
    async markSessionClosedInFirebase(sessionId) {
        if (!window.db) return;
        
        try {
            await db.collection('active_sessions').doc(sessionId).update({
                isActive: false,
                closedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error marking session closed:', error);
        }
    },
    
    /**
     * Marcar sesión como pendiente de cierre
     */
    markSessionPendingClose() {
        if (this.currentSession) {
            this.currentSession.pendingClose = true;
            this.saveSession(this.currentSession);
        }
    },
    
    /**
     * Broadcast cierre de sesión a otras pestañas
     */
    broadcastSessionClose() {
        localStorage.setItem('session_closed', 'true');
        // Remover la marca después de un momento
        setTimeout(() => {
            localStorage.removeItem('session_closed');
        }, 1000);
    },
    
    /**
     * Forzar cierre de todas las sesiones del usuario
     */
    async forceCloseAllUserSessions(userId) {
        if (!window.db) return;
        
        try {
            const snapshot = await db.collection('active_sessions')
                .where('userId', '==', userId)
                .where('isActive', '==', true)
                .get();
                
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.update(doc.ref, {
                    isActive: false,
                    closedAt: new Date().toISOString(),
                    forceClosed: true
                });
            });
            
            await batch.commit();
            console.log('✅ Todas las sesiones del usuario cerradas');
        } catch (error) {
            console.error('Error closing all sessions:', error);
        }
    }
};

// Hacer SessionManager globalmente accesible
window.SessionManager = SessionManager;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SessionManager.init();
    });
} else {
    SessionManager.init();
}