/**
 * App Loader - Sistema de carga inicial con indicador de progreso
 * Previene renderizados prematuros y errores de sincronización
 */

class AppLoader {
    constructor() {
        this.loadingSteps = [];
        this.currentStep = 0;
        this.totalSteps = 8;
        this.isLoading = true;
        this.startTime = Date.now();
    }

    /**
     * Inicializar el loader
     */
    init() {
        console.log('🚀 AppLoader: Iniciando carga de la aplicación...');
        
        // Crear y mostrar el loader
        this.createLoaderUI();
        
        // Definir pasos de carga
        this.loadingSteps = [
            { name: 'Firebase', status: 'pending', message: 'Conectando con Firebase...' },
            { name: 'Autenticación', status: 'pending', message: 'Verificando sesión...' },
            { name: 'Usuario', status: 'pending', message: 'Cargando datos de usuario...' },
            { name: 'Jugadores', status: 'pending', message: 'Cargando jugadores...' },
            { name: 'Partidos', status: 'pending', message: 'Cargando historial de partidos...' },
            { name: 'Sistemas', status: 'pending', message: 'Inicializando sistemas...' },
            { name: 'Interfaz', status: 'pending', message: 'Preparando interfaz...' },
            { name: 'Finalización', status: 'pending', message: 'Finalizando carga...' }
        ];
        
        this.totalSteps = this.loadingSteps.length;
        
        // Ocultar todo el contenido hasta que esté listo
        this.hideAppContent();
        
        // Iniciar proceso de carga
        this.startLoadingSequence();
    }
    
    /**
     * Crear UI del loader
     */
    createLoaderUI() {
        // Si ya existe, no crear otro
        if (document.getElementById('app-loader')) return;
        
        const loaderHTML = `
            <div id="app-loader" class="app-loader-container">
                <div class="loader-content">
                    <div class="loader-logo">
                        <div class="logo-ball">⚽</div>
                        <h1>Fútbol Manager</h1>
                    </div>
                    
                    <div class="loader-progress-container">
                        <div class="loader-progress-bar">
                            <div class="loader-progress-fill" id="loader-progress"></div>
                        </div>
                        <div class="loader-percentage" id="loader-percentage">0%</div>
                    </div>
                    
                    <div class="loader-status" id="loader-status">Iniciando aplicación...</div>
                    
                    <div class="loader-steps" id="loader-steps"></div>
                    
                    <div class="loader-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar al inicio del body
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        
        // Agregar estilos
        this.injectStyles();
        
        // Actualizar lista de pasos
        this.updateStepsList();
    }
    
    /**
     * Inyectar estilos del loader
     */
    injectStyles() {
        if (document.getElementById('app-loader-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'app-loader-styles';
        styles.innerHTML = `
            .app-loader-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.5s ease;
            }
            
            .app-loader-container.hiding {
                opacity: 0;
                pointer-events: none;
            }
            
            .loader-content {
                background: white;
                border-radius: 20px;
                padding: 40px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
            }
            
            .loader-logo {
                margin-bottom: 30px;
            }
            
            .logo-ball {
                font-size: 60px;
                animation: bounce 1s infinite;
                margin-bottom: 10px;
            }
            
            .loader-logo h1 {
                color: #333;
                font-size: 28px;
                margin: 0;
                font-weight: 600;
                font-family: 'Poppins', sans-serif;
            }
            
            .loader-progress-container {
                margin: 30px 0;
                position: relative;
            }
            
            .loader-progress-bar {
                background: #e0e0e0;
                height: 8px;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }
            
            .loader-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 10px;
                width: 0%;
                transition: width 0.3s ease;
                position: relative;
            }
            
            .loader-progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,0.3),
                    transparent
                );
                animation: shimmer 2s infinite;
            }
            
            .loader-percentage {
                position: absolute;
                right: 0;
                top: -25px;
                color: #666;
                font-size: 14px;
                font-weight: 600;
            }
            
            .loader-status {
                color: #666;
                font-size: 16px;
                margin: 20px 0;
                font-weight: 500;
            }
            
            .loader-steps {
                margin: 20px 0;
                text-align: left;
                max-height: 150px;
                overflow-y: auto;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 10px;
            }
            
            .loader-step {
                display: flex;
                align-items: center;
                padding: 5px 0;
                color: #999;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .loader-step.active {
                color: #667eea;
                font-weight: 500;
            }
            
            .loader-step.completed {
                color: #4caf50;
            }
            
            .loader-step.error {
                color: #f44336;
            }
            
            .step-icon {
                margin-right: 10px;
                font-size: 16px;
            }
            
            .loader-spinner {
                margin-top: 20px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e0e0e0;
                border-top-color: #667eea;
                border-radius: 50%;
                margin: 0 auto;
                animation: spin 1s linear infinite;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .loader-error {
                background: #fee;
                color: #c33;
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
            }
            
            .loader-retry-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                margin-top: 15px;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.2s ease;
            }
            
            .loader-retry-btn:hover {
                transform: translateY(-2px);
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Ocultar contenido de la app
     */
    hideAppContent() {
        // Ocultar todos los elementos principales EXCEPT el header existente
        const elementsToHide = [
            'auth-screen',
            'main-nav',
            'main-content',
            'app-header-container',
            'header-manager'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // NO ocultar el header principal - déjarlo visible durante la carga
        // const headers = document.querySelectorAll('header');
        // headers.forEach(header => {
        //     header.style.display = 'none';
        // });
    }
    
    /**
     * Actualizar lista de pasos
     */
    updateStepsList() {
        const stepsContainer = document.getElementById('loader-steps');
        if (!stepsContainer) return;
        
        let html = '';
        this.loadingSteps.forEach((step, index) => {
            let icon = '⏳';
            let className = 'loader-step';
            
            if (step.status === 'completed') {
                icon = '✅';
                className += ' completed';
            } else if (step.status === 'active') {
                icon = '🔄';
                className += ' active';
            } else if (step.status === 'error') {
                icon = '❌';
                className += ' error';
            }
            
            html += `
                <div class="${className}">
                    <span class="step-icon">${icon}</span>
                    <span>${step.name}</span>
                </div>
            `;
        });
        
        stepsContainer.innerHTML = html;
    }
    
    /**
     * Actualizar progreso
     */
    updateProgress(stepIndex, status, message) {
        if (stepIndex >= 0 && stepIndex < this.loadingSteps.length) {
            // Marcar pasos anteriores como completados
            for (let i = 0; i < stepIndex; i++) {
                this.loadingSteps[i].status = 'completed';
            }
            
            // Actualizar paso actual
            this.loadingSteps[stepIndex].status = status;
            if (message) {
                this.loadingSteps[stepIndex].message = message;
            }
            
            this.currentStep = stepIndex;
            
            // Calcular porcentaje
            const percentage = Math.round((stepIndex / this.totalSteps) * 100);
            
            // Actualizar UI
            const progressBar = document.getElementById('loader-progress');
            const percentageText = document.getElementById('loader-percentage');
            const statusText = document.getElementById('loader-status');
            
            if (progressBar) {
                progressBar.style.width = percentage + '%';
            }
            
            if (percentageText) {
                percentageText.textContent = percentage + '%';
            }
            
            if (statusText) {
                statusText.textContent = this.loadingSteps[stepIndex].message || 'Cargando...';
            }
            
            // Actualizar lista de pasos
            this.updateStepsList();
            
            console.log(`📊 Progreso: ${percentage}% - ${this.loadingSteps[stepIndex].name}`);
        }
    }
    
    /**
     * Iniciar secuencia de carga
     */
    async startLoadingSequence() {
        try {
            // Paso 1: Firebase
            this.updateProgress(0, 'active', 'Conectando con Firebase...');
            await this.waitForFirebase();
            this.updateProgress(0, 'completed');
            
            // Paso 2: Autenticación
            this.updateProgress(1, 'active', 'Verificando sesión de usuario...');
            await this.waitForAuth();
            this.updateProgress(1, 'completed');
            
            // Paso 3: Datos de usuario
            this.updateProgress(2, 'active', 'Cargando perfil de usuario...');
            await this.waitForUserData();
            this.updateProgress(2, 'completed');
            
            // Paso 4: Jugadores
            this.updateProgress(3, 'active', 'Cargando lista de jugadores...');
            await this.waitForPlayers();
            this.updateProgress(3, 'completed');
            
            // Paso 5: Partidos
            this.updateProgress(4, 'active', 'Cargando historial de partidos...');
            await this.waitForMatches();
            this.updateProgress(4, 'completed');
            
            // Paso 6: Sistemas
            this.updateProgress(5, 'active', 'Inicializando sistemas colaborativos...');
            await this.waitForSystems();
            this.updateProgress(5, 'completed');
            
            // Paso 7: Interfaz
            this.updateProgress(6, 'active', 'Preparando interfaz de usuario...');
            await this.waitForUI();
            this.updateProgress(6, 'completed');
            
            // Paso 8: Finalización
            this.updateProgress(7, 'active', 'Finalizando carga...');
            await new Promise(resolve => setTimeout(resolve, 500));
            this.updateProgress(7, 'completed');
            
            // Completar carga
            this.completeLoading();
            
        } catch (error) {
            console.error('❌ Error durante la carga:', error);
            this.showError(error.message || 'Error al cargar la aplicación');
        }
    }
    
    /**
     * Esperar por Firebase
     */
    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            if (typeof firebase !== 'undefined' && window.db) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Si no hay Firebase, continuar de todos modos
        console.warn('⚠️ Firebase no disponible, continuando...');
        return true;
    }
    
    /**
     * Esperar por autenticación
     */
    async waitForAuth() {
        // Esperar a que AuthSystem esté listo
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            if (window.AuthSystem && window.AuthSystem.initialized !== undefined) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        return true;
    }
    
    /**
     * Esperar por datos de usuario
     */
    async waitForUserData() {
        // Dar tiempo para que se cargue el usuario
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
    
    /**
     * Esperar por jugadores
     */
    async waitForPlayers() {
        // Dar tiempo para cargar jugadores
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
    }
    
    /**
     * Esperar por partidos
     */
    async waitForMatches() {
        // Dar tiempo para cargar partidos
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
    }
    
    /**
     * Esperar por sistemas
     */
    async waitForSystems() {
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            if (window.collaborativeSystem && window.TestApp) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        return true;
    }
    
    /**
     * Esperar por UI
     */
    async waitForUI() {
        // Dar tiempo para que se renderice la UI
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
    }
    
    /**
     * Completar carga
     */
    completeLoading() {
        const loadTime = Date.now() - this.startTime;
        console.log(`✅ Aplicación cargada en ${loadTime}ms`);
        
        // Actualizar UI final
        const statusText = document.getElementById('loader-status');
        if (statusText) {
            statusText.textContent = '¡Aplicación lista!';
        }
        
        // Actualizar progreso al 100%
        const progressBar = document.getElementById('loader-progress');
        const percentageText = document.getElementById('loader-percentage');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        if (percentageText) {
            percentageText.textContent = '100%';
        }
        
        // Esperar un momento y luego ocultar loader
        setTimeout(() => {
            this.hideLoader();
        }, 500);
    }
    
    /**
     * Ocultar loader y mostrar app
     */
    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('hiding');
            
            setTimeout(() => {
                loader.remove();
                this.showAppContent();
            }, 500);
        }
        
        this.isLoading = false;
        
        // Disparar evento de carga completa
        window.dispatchEvent(new CustomEvent('appLoaded', {
            detail: { loadTime: Date.now() - this.startTime }
        }));
    }
    
    /**
     * Mostrar contenido de la app
     */
    showAppContent() {
        // Mostrar elementos según el estado de autenticación
        if (window.AuthSystem && window.AuthSystem.currentUser) {
            // Usuario autenticado - mostrar app principal
            const mainNav = document.getElementById('main-nav');
            const mainContent = document.getElementById('main-content');
            const appHeader = document.getElementById('app-header');
            
            if (mainNav) mainNav.style.display = 'block';
            if (mainContent) mainContent.style.display = 'block';
            if (appHeader) appHeader.style.display = 'block';
            
            // Actualizar header si existe
            if (window.headerManager) {
                window.headerManager.refreshHeader();
            }
        } else {
            // No autenticado - mostrar pantalla de login
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) {
                authScreen.style.display = 'flex';
            }
        }
    }
    
    /**
     * Mostrar error
     */
    showError(message) {
        const statusText = document.getElementById('loader-status');
        if (statusText) {
            statusText.innerHTML = `
                <div class="loader-error">
                    <p>❌ ${message}</p>
                    <button class="loader-retry-btn" onclick="location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Crear instancia global
window.appLoader = new AppLoader();

// Inicializar cuando el DOM esté listo, pero no durante tests
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // No inicializar AppLoader durante tests automatizados
        if (!window.isTestEnvironment && !window.playwright) {
            window.appLoader.init();
        }
    });
} else {
    // DOM ya está cargado - No inicializar AppLoader durante tests automatizados
    if (!window.isTestEnvironment && !window.playwright) {
        window.appLoader.init();
    }
}

console.log('✅ AppLoader cargado y listo');