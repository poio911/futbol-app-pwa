/**
 * 📱 FUNCIONALIDADES NATIVAS ANDROID
 * Sistema completo de notificaciones, navegación y características nativas
 */

class AndroidNativeFeatures {
    constructor() {
        this.isAndroidApp = false;
        this.isCapacitorReady = false;
        this.notificationPermission = false;
        
        this.init();
    }

    async init() {
        console.log('🤖 Inicializando funcionalidades nativas Android...');
        
        // Verificar si estamos en Capacitor (APK)
        if (window.Capacitor && window.Capacitor.Plugins) {
            this.isAndroidApp = true;
            this.isCapacitorReady = true;
            console.log('✅ App ejecutándose como APK Android');
            
            await this.initializeNativeFeatures();
        } else {
            console.log('🌐 App ejecutándose en navegador web');
            this.initializeWebFeatures();
        }
    }

    async initializeNativeFeatures() {
        try {
            // Inicializar todos los plugins nativos
            await this.setupStatusBar();
            await this.setupSplashScreen();
            await this.setupNotifications();
            await this.setupBackButton();
            await this.setupHaptics();
            
            console.log('🚀 Todas las funcionalidades nativas inicializadas');
        } catch (error) {
            console.error('❌ Error inicializando funciones nativas:', error);
        }
    }

    // 📱 STATUS BAR NATIVO
    async setupStatusBar() {
        if (!window.Capacitor?.Plugins?.StatusBar) return;
        
        const { StatusBar } = window.Capacitor.Plugins;
        
        try {
            await StatusBar.setBackgroundColor({ color: '#0a0e1a' });
            await StatusBar.setStyle({ style: 'LIGHT' });
            await StatusBar.show();
            
            console.log('✅ Status bar configurado');
        } catch (error) {
            console.error('❌ Error configurando status bar:', error);
        }
    }

    // 🌟 SPLASH SCREEN
    async setupSplashScreen() {
        if (!window.Capacitor?.Plugins?.SplashScreen) return;
        
        const { SplashScreen } = window.Capacitor.Plugins;
        
        try {
            // Ocultar splash después de 2 segundos
            setTimeout(async () => {
                await SplashScreen.hide();
            }, 2000);
            
            console.log('✅ Splash screen configurado');
        } catch (error) {
            console.error('❌ Error configurando splash screen:', error);
        }
    }

    // 🔔 NOTIFICACIONES NATIVAS
    async setupNotifications() {
        if (!window.Capacitor?.Plugins?.PushNotifications) return;
        
        const { PushNotifications, LocalNotifications } = window.Capacitor.Plugins;
        
        try {
            // Registrar para notificaciones push
            await PushNotifications.requestPermissions();
            await PushNotifications.register();
            
            // Configurar listeners
            PushNotifications.addListener('registration', (token) => {
                console.log('✅ Push registration success:', token.value);
                this.notificationPermission = true;
            });
            
            PushNotifications.addListener('registrationError', (error) => {
                console.error('❌ Push registration error:', error);
            });
            
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                this.handleNotificationReceived(notification);
            });
            
            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                this.handleNotificationClicked(notification);
            });
            
            // Configurar notificaciones locales
            await LocalNotifications.requestPermissions();
            
            console.log('✅ Notificaciones nativas configuradas');
        } catch (error) {
            console.error('❌ Error configurando notificaciones:', error);
        }
    }

    // 📱 BOTÓN BACK NATIVO
    async setupBackButton() {
        if (!window.Capacitor?.Plugins?.App) return;
        
        const { App } = window.Capacitor.Plugins;
        
        try {
            App.addListener('backButton', (event) => {
                this.handleBackButton(event);
            });
            
            console.log('✅ Botón back nativo configurado');
        } catch (error) {
            console.error('❌ Error configurando botón back:', error);
        }
    }

    // 📳 VIBRACIÓN HÁPTICA
    async setupHaptics() {
        if (!window.Capacitor?.Plugins?.Haptics) return;
        
        console.log('✅ Haptics disponible');
        window.androidHaptics = window.Capacitor.Plugins.Haptics;
    }

    // 📱 FUNCIONES DE NOTIFICACIÓN NATIVAS

    async sendLocalNotification(title, body, options = {}) {
        if (!window.Capacitor?.Plugins?.LocalNotifications) {
            // Fallback para web
            this.showWebNotification(title, body);
            return;
        }
        
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id: Date.now(),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo
                    sound: 'default',
                    attachments: [],
                    actionTypeId: '',
                    extra: options
                }]
            });
            
            console.log('📱 Notificación local enviada:', title);
        } catch (error) {
            console.error('❌ Error enviando notificación local:', error);
        }
    }

    // 📳 VIBRACIÓN PARA INTERACCIONES
    async vibrate(type = 'light') {
        if (!window.Capacitor?.Plugins?.Haptics) {
            // Fallback para web
            if (navigator.vibrate) {
                const patterns = {
                    light: [50],
                    medium: [100],
                    heavy: [200],
                    success: [50, 100, 50],
                    error: [100, 50, 100, 50, 100]
                };
                navigator.vibrate(patterns[type] || patterns.light);
            }
            return;
        }
        
        const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
        
        try {
            switch (type) {
                case 'light':
                    await Haptics.impact({ style: ImpactStyle.Light });
                    break;
                case 'medium':
                    await Haptics.impact({ style: ImpactStyle.Medium });
                    break;
                case 'heavy':
                    await Haptics.impact({ style: ImpactStyle.Heavy });
                    break;
                case 'success':
                    await Haptics.notification({ type: 'SUCCESS' });
                    break;
                case 'error':
                    await Haptics.notification({ type: 'ERROR' });
                    break;
                default:
                    await Haptics.impact({ style: ImpactStyle.Light });
            }
        } catch (error) {
            console.error('❌ Error en vibración:', error);
        }
    }

    // 🔙 MANEJO DEL BOTÓN BACK
    handleBackButton(event) {
        console.log('🔙 Botón back presionado');
        
        // Verificar si hay modales abiertos
        const activeModal = document.querySelector('.modal.show, .modal-backdrop');
        if (activeModal) {
            // Cerrar modal
            const modalElement = document.querySelector('.modal.show');
            if (modalElement && window.bootstrap) {
                const modal = window.bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            return;
        }
        
        // Verificar navegación interna de la app
        if (window.TestApp && window.TestApp.currentSection !== 'inicio') {
            // Volver a inicio
            if (window.TestApp.showHome) {
                window.TestApp.showHome();
                return;
            }
        }
        
        // Si estamos en inicio, mostrar confirmación para salir
        if (confirm('¿Quieres salir de la aplicación?')) {
            if (window.Capacitor?.Plugins?.App) {
                window.Capacitor.Plugins.App.exitApp();
            }
        }
    }

    // 🔔 MANEJO DE NOTIFICACIONES
    handleNotificationReceived(notification) {
        console.log('📱 Notificación recibida:', notification);
        
        // Vibrar cuando llega notificación
        this.vibrate('light');
        
        // Mostrar en la interfaz si la app está abierta
        if (window.UnifiedNotificationSystem) {
            window.UnifiedNotificationSystem.showNotification(
                notification.title || 'Nueva notificación',
                notification.body || '',
                'info'
            );
        }
    }

    handleNotificationClicked(notification) {
        console.log('👆 Notificación clickeada:', notification);
        
        // Navegar según el tipo de notificación
        const data = notification.notification.data;
        if (data && data.action) {
            switch (data.action) {
                case 'show_matches':
                    if (window.TestApp?.showCollaborativeMatches) {
                        window.TestApp.showCollaborativeMatches();
                    }
                    break;
                case 'show_evaluations':
                    if (window.TestApp?.showEvaluations) {
                        window.TestApp.showEvaluations();
                    }
                    break;
                case 'show_players':
                    if (window.TestApp?.displayPlayers) {
                        window.TestApp.displayPlayers();
                    }
                    break;
            }
        }
    }

    // 🌐 FALLBACK PARA WEB
    initializeWebFeatures() {
        console.log('🌐 Inicializando funcionalidades web...');
        
        // Simular funcionalidades nativas en web
        this.setupWebBackButton();
        this.setupWebNotifications();
    }

    setupWebBackButton() {
        // Interceptar botón back del navegador
        window.addEventListener('popstate', (event) => {
            console.log('🔙 Botón back web presionado');
            // Lógica similar al botón back nativo
        });
    }

    async setupWebNotifications() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            this.notificationPermission = Notification.permission === 'granted';
        }
    }

    showWebNotification(title, body, options = {}) {
        if (this.notificationPermission && 'Notification' in window) {
            new Notification(title, {
                body,
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%2300ff9d"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%230a0e1a" font-size="30" font-weight="bold"%3E⚽%3C/text%3E%3C/svg%3E',
                badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%2300ff9d"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%230a0e1a" font-size="30" font-weight="bold"%3E⚽%3C/text%3E%3C/svg%3E',
                ...options
            });
        }
    }

    // 🎯 FUNCIONES PÚBLICAS PARA USO EN LA APP

    // Enviar notificación de nuevo partido
    async notifyNewMatch(matchTitle, players) {
        await this.sendLocalNotification(
            '⚽ Nuevo Partido Creado',
            `${matchTitle} - ${players} jugadores confirmados`,
            { action: 'show_matches' }
        );
        await this.vibrate('success');
    }

    // Notificación de evaluación completada
    async notifyEvaluationComplete(playerName, newOVR) {
        await this.sendLocalNotification(
            '📊 Evaluación Completada',
            `${playerName} ahora tiene OVR ${newOVR}`,
            { action: 'show_players' }
        );
        await this.vibrate('success');
    }

    // Notificación de próximo partido
    async notifyUpcomingMatch(matchTitle, timeLeft) {
        await this.sendLocalNotification(
            '⏰ Partido Próximo',
            `${matchTitle} comienza en ${timeLeft}`,
            { action: 'show_matches' }
        );
        await this.vibrate('medium');
    }

    // Vibración para botones
    async buttonTap() {
        await this.vibrate('light');
    }

    // Vibración para acciones importantes
    async importantAction() {
        await this.vibrate('medium');
    }

    // Vibración para errores
    async errorFeedback() {
        await this.vibrate('error');
    }

    // Vibración para éxito
    async successFeedback() {
        await this.vibrate('success');
    }
}

// 🚀 INICIALIZAR AUTOMÁTICAMENTE
document.addEventListener('DOMContentLoaded', () => {
    window.androidNative = new AndroidNativeFeatures();
});

// 📱 EXPORT PARA USO EN OTROS MÓDULOS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AndroidNativeFeatures;
}

console.log('📱 Android Native Features cargado');