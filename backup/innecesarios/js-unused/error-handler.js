/**
 * Sistema de Manejo de Errores Global
 * Centraliza el manejo de errores y logging
 */

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.isOnline = navigator.onLine;
        
        // Configurar listeners globales
        this.setupGlobalListeners();
        
        // Configurar detección de conexión
        this.setupNetworkDetection();
    }

    /**
     * Configurar listeners de errores globales
     */
    setupGlobalListeners() {
        // Errores JavaScript no manejados
        window.addEventListener('error', (event) => {
            this.handleJSError(event);
        });

        // Promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event);
        });

        // Errores de recursos (imágenes, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);
    }

    /**
     * Configurar detección de red
     */
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Conexión restaurada');
            UI.showNotification('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📵 Conexión perdida');
            UI.showNotification('Sin conexión a internet. Trabajando en modo offline.', 'warning');
        });
    }

    /**
     * Manejar errores JavaScript
     */
    handleJSError(event) {
        const error = {
            type: 'JavaScript Error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logError(error);

        // Mostrar error solo si es crítico
        if (this.isCriticalError(event.message)) {
            this.showUserError('Ha ocurrido un error. Revisa la consola para más detalles.', 'warning');
            // Temporarily disabled auto-reload to prevent app restart issues
            // setTimeout(() => window.location.reload(), 3000);
            console.warn('Auto-reload disabled. Error was:', event.message);
        }
    }

    /**
     * Manejar promesas rechazadas
     */
    handlePromiseRejection(event) {
        const error = {
            type: 'Unhandled Promise Rejection',
            reason: event.reason?.toString() || 'Unknown reason',
            stack: event.reason?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        this.logError(error);

        // Prevenir el log por defecto del navegador
        event.preventDefault();

        // Mostrar mensaje apropiado basado en el tipo de error
        const userMessage = this.getPromiseRejectionMessage(event.reason);
        if (userMessage) {
            this.showUserError(userMessage, 'error');
        }
    }

    /**
     * Manejar errores de recursos
     */
    handleResourceError(event) {
        const error = {
            type: 'Resource Error',
            element: event.target.tagName,
            source: event.target.src || event.target.href,
            message: `Failed to load ${event.target.tagName}`,
            timestamp: new Date().toISOString()
        };

        this.logError(error);

        // Solo mostrar al usuario si es crítico (ej: scripts principales)
        if (this.isCriticalResource(event.target)) {
            this.showUserError('Error al cargar recursos críticos. Recarga la página.', 'error');
        }
    }

    /**
     * Manejar errores de aplicación específicos
     */
    handleAppError(error, context = 'Unknown') {
        const errorDetails = {
            type: 'Application Error',
            context: context,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        this.logError(errorDetails);

        // Mostrar mensaje apropiado al usuario
        const userMessage = this.getContextualMessage(error, context);
        this.showUserError(userMessage, this.getErrorSeverity(error, context));
    }

    /**
     * Manejar errores de Firebase
     */
    handleFirebaseError(error, operation) {
        const errorDetails = {
            type: 'Firebase Error',
            operation: operation,
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
        };

        this.logError(errorDetails);

        const userMessage = this.getFirebaseErrorMessage(error.code, operation);
        this.showUserError(userMessage, 'error');
    }

    /**
     * Manejar errores de red
     */
    handleNetworkError(error, endpoint) {
        const errorDetails = {
            type: 'Network Error',
            endpoint: endpoint,
            message: error.message,
            online: this.isOnline,
            timestamp: new Date().toISOString()
        };

        this.logError(errorDetails);

        if (!this.isOnline) {
            this.showUserError('Sin conexión a internet. Los cambios se guardarán cuando se restaure la conexión.', 'warning');
        } else {
            this.showUserError('Error de conexión. Verifica tu conexión e intenta nuevamente.', 'error');
        }
    }

    /**
     * Determinar si un error es crítico
     */
    isCriticalError(message) {
        const criticalPatterns = [
            'Cannot read properties of null',
            'Cannot read properties of undefined', 
            'App is not defined',
            'Storage is not defined',
            'Script error'
        ];

        // Less aggressive pattern matching - only truly critical errors
        return criticalPatterns.some(pattern => 
            message && message.toLowerCase().includes(pattern.toLowerCase())
        ) && !message.includes('DataExport'); // Exclude DataExport errors
    }

    /**
     * Determinar si un recurso es crítico
     */
    isCriticalResource(element) {
        if (element.tagName === 'SCRIPT') {
            const criticalScripts = [
                'app.js',
                'firebase-simple.js',
                'ui.js',
                'utils.js',
                'validators.js'
            ];
            
            return criticalScripts.some(script => 
                element.src && element.src.includes(script)
            );
        }
        return false;
    }

    /**
     * Obtener mensaje contextual para errores de aplicación
     */
    getContextualMessage(error, context) {
        const messages = {
            'player_registration': 'Error al registrar jugador. Verifica los datos e intenta nuevamente.',
            'team_generation': 'Error al generar equipos. Intenta con diferentes jugadores.',
            'match_evaluation': 'Error al guardar la evaluación. Intenta nuevamente.',
            'data_loading': 'Error al cargar datos. Verifica tu conexión.',
            'photo_upload': 'Error al subir la foto. Intenta con una imagen más pequeña.',
            'group_management': 'Error en la gestión del grupo. Verifica los permisos.',
            'authentication': 'Error de autenticación. Vuelve a iniciar sesión.'
        };

        return messages[context] || 'Ha ocurrido un error. Intenta nuevamente.';
    }

    /**
     * Obtener mensaje para errores de Firebase
     */
    getFirebaseErrorMessage(code, operation) {
        const messages = {
            'permission-denied': 'No tienes permisos para realizar esta acción.',
            'not-found': 'El recurso solicitado no existe.',
            'already-exists': 'El elemento ya existe.',
            'resource-exhausted': 'Se ha excedido el límite de operaciones. Intenta más tarde.',
            'unauthenticated': 'Debes iniciar sesión para continuar.',
            'unavailable': 'El servicio no está disponible temporalmente.',
            'deadline-exceeded': 'La operación tardó demasiado. Intenta nuevamente.',
            'cancelled': 'La operación fue cancelada.',
            'invalid-argument': 'Los datos proporcionados no son válidos.',
            'failed-precondition': 'La operación no puede completarse en el estado actual.'
        };

        return messages[code] || `Error en ${operation}. Intenta nuevamente.`;
    }

    /**
     * Obtener mensaje para rechazos de promesas
     */
    getPromiseRejectionMessage(reason) {
        if (!reason) return null;

        const reasonStr = reason.toString().toLowerCase();

        if (reasonStr.includes('network')) {
            return 'Error de conexión. Verifica tu internet.';
        }
        if (reasonStr.includes('permission')) {
            return 'Sin permisos para realizar esta acción.';
        }
        if (reasonStr.includes('timeout')) {
            return 'La operación tardó demasiado. Intenta nuevamente.';
        }
        if (reasonStr.includes('not found')) {
            return 'Recurso no encontrado.';
        }

        return 'Ha ocurrido un error inesperado.';
    }

    /**
     * Obtener severidad del error
     */
    getErrorSeverity(error, context) {
        const criticalContexts = ['authentication', 'data_corruption', 'security'];
        const warningContexts = ['photo_upload', 'non_critical_features'];

        if (criticalContexts.includes(context)) return 'error';
        if (warningContexts.includes(context)) return 'warning';
        
        return 'error';
    }

    /**
     * Mostrar error al usuario
     */
    showUserError(message, type = 'error') {
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, type);
        } else {
            // Fallback si UI no está disponible
            console.error(message);
            alert(message);
        }
    }

    /**
     * Registrar error en el log
     */
    logError(error) {
        // Agregar al array local
        this.errors.unshift(error);
        
        // Mantener solo los últimos errores
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Log en consola con formato
        console.group(`🚨 ${error.type}`);
        console.error('Message:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
        if (error.context) console.error('Context:', error.context);
        console.error('Timestamp:', error.timestamp);
        console.groupEnd();

        // Guardar en localStorage para debugging
        try {
            const savedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            savedErrors.unshift(error);
            localStorage.setItem('app_errors', JSON.stringify(savedErrors.slice(0, 20)));
        } catch (e) {
            console.warn('Could not save error to localStorage:', e);
        }

        // TODO: Enviar a servicio de logging en producción
        // this.sendToLoggingService(error);
    }

    /**
     * Obtener errores recientes
     */
    getRecentErrors(limit = 10) {
        return this.errors.slice(0, limit);
    }

    /**
     * Limpiar log de errores
     */
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app_errors');
        console.log('✅ Error log cleared');
    }

    /**
     * Obtener estadísticas de errores
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.filter(e => 
                new Date() - new Date(e.timestamp) < 3600000 // Última hora
            ).length
        };

        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Verificar estado de salud de la aplicación
     */
    checkAppHealth() {
        const health = {
            status: 'healthy',
            issues: [],
            timestamp: new Date().toISOString()
        };

        // Verificar errores críticos recientes
        const recentCritical = this.errors.filter(e => 
            new Date() - new Date(e.timestamp) < 300000 && // Últimos 5 minutos
            this.isCriticalError(e.message)
        );

        if (recentCritical.length > 3) {
            health.status = 'critical';
            health.issues.push('Multiple critical errors detected');
        }

        // Verificar conectividad
        if (!this.isOnline) {
            health.status = health.status === 'critical' ? 'critical' : 'warning';
            health.issues.push('No internet connection');
        }

        // Verificar APIs críticas
        const criticalAPIs = ['Storage', 'UI', 'App', 'Utils'];
        criticalAPIs.forEach(api => {
            if (typeof window[api] === 'undefined') {
                health.status = 'critical';
                health.issues.push(`${api} is not loaded`);
            }
        });

        return health;
    }
}

// Crear instancia global
const GlobalErrorHandler = new ErrorHandler();

// Métodos de conveniencia globales
window.handleError = (error, context) => {
    GlobalErrorHandler.handleAppError(error, context);
};

window.handleFirebaseError = (error, operation) => {
    GlobalErrorHandler.handleFirebaseError(error, operation);
};

window.handleNetworkError = (error, endpoint) => {
    GlobalErrorHandler.handleNetworkError(error, endpoint);
};

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

// Hacer disponible globalmente
window.GlobalErrorHandler = GlobalErrorHandler;

// Log de inicialización
console.log('🛡️ Global Error Handler initialized');