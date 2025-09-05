/**
 * Clean Header System - Sistema de header limpio y responsive
 * Reemplaza el header complejo actual con uno simple y funcional
 * Fecha: 2025-09-05
 */

class CleanHeader {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar el header limpio
     */
    async init() {
        if (this.isInitialized) {
            console.log('🔄 CleanHeader: Ya inicializado');
            return;
        }

        console.log('🚀 CleanHeader: Inicializando header limpio...');

        try {
            this.hideOldHeader();
            this.injectCleanStyles();
            this.createCleanHeader();
            this.setupEvents();
            await this.loadUserData();
            this.renderHeader();
            
            this.isInitialized = true;
            console.log('✅ CleanHeader inicializado');
            
            this.registerForUpdates();
            
        } catch (error) {
            console.error('❌ Error inicializando CleanHeader:', error);
        }
    }

    /**
     * Registrar para recibir actualizaciones de otros sistemas
     */
    registerForUpdates() {
        // Intentar reconexión periódica con AuthSystem
        const checkAuthSystem = () => {
            if (window.AuthSystem?.currentUser && (!this.currentUser || this.currentUser.id === 'default')) {
                console.log('🔄 CleanHeader: Reconectando con AuthSystem...');
                this.updateUser(window.AuthSystem.currentUser);
            }
        };
        
        // Verificar cada 2 segundos si hay datos disponibles
        setTimeout(checkAuthSystem, 2000);
        setTimeout(checkAuthSystem, 5000);
        setTimeout(checkAuthSystem, 10000);
    }

    /**
     * Ocultar header anterior
     */
    hideOldHeader() {
        // Ocultar headers existentes
        const existingHeaders = document.querySelectorAll('.new-header, .header-enhanced, .gaming-header');
        existingHeaders.forEach(header => {
            header.style.display = 'none';
        });

        // Remover padding del body
        document.body.classList.remove('new-header-active');
        document.body.style.paddingTop = '0';
    }

    /**
     * Inyectar estilos limpios y responsive
     */
    injectCleanStyles() {
        if (document.getElementById('clean-header-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'clean-header-styles';
        styles.innerHTML = `
            /* ===================================
               CLEAN HEADER - RESPONSIVE & SIMPLE
               =================================== */
            
            /* Variables */
            :root {
                --clean-header-height: 65px;
                --clean-header-mobile: 55px;
            }
            
            /* Body adjustment */
            body.clean-header-active {
                padding-top: var(--clean-header-height) !important;
                transition: padding-top 0.3s ease;
            }
            
            /* HEADER PRINCIPAL */
            .clean-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(15px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1000;
                height: var(--clean-header-height);
                display: flex;
                align-items: center;
                padding: 0 24px;
                box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
            }
            
            .header-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            /* SIN LOGO - Solo espaciador */
            .header-logo {
                display: none;
            }
            
            /* USUARIO - ARREGLADO */
            .header-user {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                margin-left: auto;
            }
            
            .header-user:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
            }
            
            .user-avatar-clean {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #333;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
                color: white;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .user-avatar-clean img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
            }
            
            .user-info-clean {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: nowrap;
                min-width: 0;
                flex: 1;
            }
            
            .user-name-clean {
                font-size: 14px;
                font-weight: 600;
                color: white;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 120px;
            }
            
            .user-position-clean {
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: white !important;
                border: none;
            }
            
            /* POSICIONES UNIFICADAS - MISMO ESTILO QUE PLAYER CARDS */
            .user-position-clean.POR,
            .user-position-clean.Portero {
                background: linear-gradient(135deg, #ff9f43, #ffb667) !important;
            }
            
            .user-position-clean.DEF,
            .user-position-clean.Defensor {
                background: linear-gradient(135deg, #5f27cd, #7c4dff) !important;
            }
            
            .user-position-clean.MED,
            .user-position-clean.Mediocampista {
                background: linear-gradient(135deg, #00d2d3, #00a8a8) !important;
            }
            
            .user-position-clean.DEL,
            .user-position-clean.Delantero {
                background: linear-gradient(135deg, #ff4757, #ff6b7a) !important;
            }
            
            /* Fallback para posiciones no reconocidas */
            .user-position-clean:not(.POR):not(.DEF):not(.MED):not(.DEL):not(.Portero):not(.Defensor):not(.Mediocampista):not(.Delantero) {
                background: rgba(255, 255, 255, 0.2) !important;
            }
            
            .user-ovr-clean {
                background: linear-gradient(135deg, #00ff9d, #00cc7d) !important;
                color: white !important;
                padding: 3px 8px !important;
                border-radius: 8px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                min-width: 28px !important;
                text-align: center !important;
                box-shadow: 0 2px 6px rgba(0, 255, 157, 0.3) !important;
            }
            
            /* DROPDOWN ARREGLADO - SIN DEGRADADOS - FORZADO */
            .user-dropdown {
                position: absolute !important;
                top: calc(100% + 8px) !important;
                right: 0 !important;
                background: #1a1a1a !important;
                background-image: none !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-radius: 12px !important;
                min-width: 200px !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
                display: none !important;
                z-index: 10000 !important;
                overflow: hidden !important;
            }
            
            .user-dropdown.active {
                display: block !important;
                animation: slideDown 0.2s ease-out !important;
                background: #1a1a1a !important;
                background-image: none !important;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .dropdown-item-clean {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 12px 16px !important;
                color: white !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                border: none !important;
                background: transparent !important;
                background-image: none !important;
                width: 100% !important;
                text-align: left !important;
            }
            
            .dropdown-item-clean:hover {
                background: #2a2a2a !important;
                background-image: none !important;
                color: white !important;
            }
            
            .dropdown-item-clean.logout:hover {
                background: #2a1a1a !important;
                background-image: none !important;
                color: #ff6666 !important;
            }
            
            .dropdown-item-clean i {
                font-size: 16px;
                width: 16px;
                flex-shrink: 0;
            }
            
            /* RESPONSIVE DESIGN */
            @media (max-width: 768px) {
                body.clean-header-active {
                    padding-top: var(--clean-header-mobile) !important;
                }
                
                .clean-header {
                    height: var(--clean-header-mobile);
                    padding: 0 16px;
                }
                
                .app-title {
                    display: none;
                }
                
                .header-user {
                    min-width: 120px;
                    padding: 6px 12px;
                }
                
                .user-name-clean {
                    font-size: 13px;
                }
                
                .user-stats-clean {
                    gap: 6px;
                }
                
                .user-position-clean,
                .user-ovr-clean {
                    font-size: 9px;
                    padding: 2px 5px;
                }
            }
            
            @media (max-width: 480px) {
                .clean-header {
                    padding: 0 8px;
                    height: 50px; /* Altura normal */
                }
                
                .header-user {
                    min-width: 200px; /* Ancho suficiente para todos los elementos */
                    gap: 6px;
                }
                
                /* MANTENER diseño horizontal en móvil - FOTO NOMBRE POSICIÓN OVR */
                .user-info-clean {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    flex-wrap: nowrap !important;
                    min-width: 0 !important;
                    flex: 1 !important;
                }
                
                .user-name-clean {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    max-width: 70px !important; /* Reducir para dejar espacio a posición y OVR */
                    flex-shrink: 1 !important;
                }
                
                .user-position-clean {
                    padding: 2px 4px !important;
                    font-size: 9px !important;
                    font-weight: 600 !important;
                    border-radius: 4px !important;
                    min-width: 26px !important;
                    flex-shrink: 0 !important; /* No se reduzca */
                }
                
                .user-ovr-clean {
                    padding: 2px 5px !important;
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    min-width: 22px !important;
                    border-radius: 6px !important;
                    flex-shrink: 0 !important; /* No se reduzca */
                }
                
                .user-avatar-clean {
                    width: 32px !important;
                    height: 32px !important;
                    font-size: 12px !important;
                    flex-shrink: 0 !important;
                }
                
                /* Ajustar título de la app */
                .app-title {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    max-width: calc(100vw - 220px) !important; /* Más espacio para el header del usuario */
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Crear estructura del header limpio
     */
    createCleanHeader() {
        // Remover header existente si existe
        const existingCleanHeader = document.getElementById('clean-header');
        if (existingCleanHeader) {
            existingCleanHeader.remove();
        }

        const header = document.createElement('div');
        header.id = 'clean-header';
        header.className = 'clean-header';
        
        header.innerHTML = `
            <div class="header-content">
                <!-- Usuario -->
                <div class="header-user" id="header-user">
                    <div class="user-avatar-clean" id="user-avatar-clean">U</div>
                    <div class="user-info-clean">
                        <span class="user-name-clean" id="user-name-clean">Usuario</span>
                        <span class="user-position-clean" id="user-position-clean">MED</span>
                        <span class="user-ovr-clean" id="user-ovr-clean">70</span>
                    </div>
                    
                    <!-- Dropdown -->
                    <div class="user-dropdown" id="user-dropdown">
                        <button class="dropdown-item-clean" data-action="profile">
                            <i class='bx bx-user'></i>
                            Mi Perfil
                        </button>
                        <button class="dropdown-item-clean" data-action="stats">
                            <i class='bx bx-stats'></i>
                            Estadísticas
                        </button>
                        <button class="dropdown-item-clean" data-action="settings">
                            <i class='bx bx-cog'></i>
                            Configuración
                        </button>
                        <button class="dropdown-item-clean logout" data-action="logout">
                            <i class='bx bx-log-out'></i>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insertar al principio del body
        document.body.insertBefore(header, document.body.firstChild);
        document.body.classList.add('clean-header-active');
        
        console.log('✅ CleanHeader: HTML insertado');
    }

    /**
     * Cargar datos del usuario (con logging mínimo)
     */
    async loadUserData() {
        try {
            // Asegurar que los jugadores estén cargados
            if (typeof Storage !== 'undefined') {
                if (!Storage.cachedPlayers || Storage.cachedPlayers.length === 0) {
                    if (typeof Storage.loadPlayersFromFirebase === 'function') {
                        await Storage.loadPlayersFromFirebase();
                    }
                }
            }
            
            // Obtener usuario con datos reales
            this.currentUser = this.getCurrentUser();
            
            // Si no encontramos usuario, intentar fuentes alternativas
            if (!this.currentUser || this.currentUser.id === 'default') {
                await this.tryAlternativeUserSources();
            }
            
        } catch (error) {
            this.currentUser = this.createDefaultUser();
        }
    }

    /**
     * Obtener usuario del storage
     */
    getCurrentUserFromStorage() {
        try {
            // Intentar Storage system primero
            if (window.Storage && window.Storage.getCurrentPerson) {
                const user = window.Storage.getCurrentPerson();
                if (user) return user;
            }

            // Intentar TestApp
            if (window.TestApp && window.TestApp.currentUser) {
                return window.TestApp.currentUser;
            }
            
            // Backup: localStorage
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                return JSON.parse(stored);
            }

            // Último backup: sessionStorage
            const sessionStored = sessionStorage.getItem('currentUser');
            if (sessionStored) {
                return JSON.parse(sessionStored);
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo usuario del storage:', error);
        }
        return null;
    }

    /**
     * Obtener datos completos del jugador actual (del sistema anterior)
     */
    getCurrentPlayerData() {
        try {
            if (!Storage || !Storage.currentPersonId || !Storage.cachedPlayers) {
                return null;
            }

            const currentPlayer = Storage.cachedPlayers.find(p => p.id === Storage.currentPersonId);
            if (currentPlayer) {
                console.log('🎯 Jugador actual encontrado en cache:', currentPlayer);
                return currentPlayer;
            }

            // Si no está en cache, usar getPlayerById de Storage
            if (typeof Storage.getPlayerById === 'function') {
                return Storage.getPlayerById(Storage.currentPersonId);
            }

            return null;
        } catch (error) {
            console.warn('⚠️ Error obteniendo datos del jugador actual:', error);
            return null;
        }
    }

    /**
     * Obtener usuario actual (función mejorada con logging mínimo)
     */
    getCurrentUser() {
        // 1. PRIORIDAD: Buscar en cachedPlayers por el usuario logueado
        if (window.AuthSystem?.currentUser && Storage?.cachedPlayers?.length > 0) {
            console.log('🔍 Buscando en cachedPlayers para usuario:', window.AuthSystem.currentUser.displayName);
            
            // Buscar por nombre exacto (displayName)
            const playerByName = Storage.cachedPlayers.find(p => 
                p.name === window.AuthSystem.currentUser.displayName
            );
            
            if (playerByName) {
                console.log('✅ Jugador encontrado en cachedPlayers:', playerByName);
                return playerByName;
            }
            
            // Buscar por email/uid como respaldo
            const playerByEmail = Storage.cachedPlayers.find(p => 
                p.email === window.AuthSystem.currentUser.email ||
                p.uid === window.AuthSystem.currentUser.uid
            );
            
            if (playerByEmail) {
                console.log('✅ Jugador encontrado por email/uid:', playerByEmail);
                return playerByEmail;
            }
            
            console.log('⚠️ Usuario no encontrado en cachedPlayers, usando mapeo básico');
            // Mapear datos de AuthSystem como último recurso
            return this.mapAuthUserToPlayer(window.AuthSystem.currentUser);
        }

        // 2. Storage con currentPersonId
        if (Storage?.currentPersonId) {
            const currentPlayerData = this.getCurrentPlayerData();
            if (currentPlayerData) {
                return currentPlayerData;
            }
        }

        // 3. Primer jugador del cache
        if (Storage?.cachedPlayers?.length > 0) {
            return Storage.cachedPlayers[0];
        }

        // 4. Fallback sources
        const sources = [
            () => window.TestApp?.currentUser,
            () => window.SessionManager?.getCurrentUser?.(),
            () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
            () => JSON.parse(sessionStorage.getItem('currentUser') || 'null')
        ];

        for (const source of sources) {
            try {
                const user = source();
                if (user) return user;
            } catch (e) {
                // Continue to next source
            }
        }

        return this.createDefaultUser();
    }

    /**
     * Mapear usuario de AuthSystem a formato de jugador
     */
    mapAuthUserToPlayer(authUser) {
        return {
            id: authUser.uid || 'mapped-user',
            name: authUser.displayName || authUser.email || 'Usuario',
            email: authUser.email,
            position: 'Mediocampista',
            ovr: 75,
            photo: authUser.photoURL || null,
            uid: authUser.uid,
            _original: authUser
        };
    }

    /**
     * Intentar fuentes alternativas para obtener datos del usuario
     */
    async tryAlternativeUserSources() {
        // 1. TestApp
        if (window.TestApp?.currentUser) {
            this.currentUser = window.TestApp.currentUser;
            return;
        }
        
        // 2. Primer jugador del cache
        if (Storage?.cachedPlayers?.length > 0) {
            this.currentUser = Storage.cachedPlayers[0];
            return;
        }
        
        // 3. LocalStorage
        try {
            const localUser = localStorage.getItem('currentUser') || localStorage.getItem('selectedPlayer');
            if (localUser) {
                this.currentUser = JSON.parse(localUser);
                return;
            }
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Crear usuario por defecto
     */
    createDefaultUser() {
        return {
            id: 'default',
            name: 'Usuario',
            position: 'Mediocampista',
            ovr: 70,
            photo: null
        };
    }

    /**
     * Renderizar header con datos del usuario
     */
    renderHeader() {
        console.log('🎨 renderHeader() called - currentUser:', this.currentUser);
        if (!this.currentUser) {
            console.log('⚠️ renderHeader() aborted - no currentUser');
            return;
        }

        const avatar = document.getElementById('user-avatar-clean');
        const name = document.getElementById('user-name-clean');
        const position = document.getElementById('user-position-clean');
        const ovr = document.getElementById('user-ovr-clean');

        // AVATAR - MISMO MÉTODO QUE HEADER ANTERIOR QUE FUNCIONA
        if (avatar) {
            const photoUrl = this.currentUser.photo || this.currentUser.photoURL;
            console.log('🖼️ Processing avatar - photoUrl:', photoUrl ? photoUrl.substring(0, 50) + '...' : 'NO URL');
            
            if (photoUrl && photoUrl !== '👤' && (photoUrl.startsWith('http') || photoUrl.startsWith('data:'))) {
                console.log('✅ Valid photoUrl detected, setting innerHTML...');
                // EXACTAMENTE el mismo código del header anterior que SÍ funciona
                avatar.innerHTML = `<img src="${photoUrl}" alt="${this.currentUser.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.innerHTML='${this.currentUser.name.charAt(0).toUpperCase()}'">`;
                console.log('✅ Avatar innerHTML set with image');
            } else {
                console.log('⚠️ No valid photoUrl, using initials');
                // Usar iniciales
                avatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
            }
        } else {
            console.log('❌ Avatar element not found!');
        }

        // NOMBRE
        if (name) {
            name.textContent = this.currentUser.name;
        }

        // POSICIÓN CON ESTILO UNIFICADO
        if (position) {
            const positionText = this.getPositionShort(this.currentUser.position);
            const fullPosition = this.currentUser.position || 'Mediocampista';
            
            // Limpiar clases anteriores
            position.className = 'user-position-clean';
            
            // Agregar clase específica de posición
            if (fullPosition === 'Portero' || positionText === 'POR') {
                position.classList.add('POR', 'Portero');
            } else if (fullPosition === 'Defensor' || positionText === 'DEF') {
                position.classList.add('DEF', 'Defensor');
            } else if (fullPosition === 'Mediocampista' || positionText === 'MED') {
                position.classList.add('MED', 'Mediocampista');
            } else if (fullPosition === 'Delantero' || positionText === 'DEL') {
                position.classList.add('DEL', 'Delantero');
            }
            
            position.textContent = positionText;
        }

        // OVR - Mejorado para mostrar correctamente
        if (ovr) {
            const ovrValue = this.currentUser.ovr || 
                           this.currentUser.overall || 
                           this.currentUser.rating || 
                           75;
            ovr.textContent = String(ovrValue);
            ovr.style.display = 'inline-block'; // Asegurar que se muestre
        }
    }

    /**
     * Configurar eventos
     */
    setupEvents() {
        const headerUser = document.getElementById('header-user');
        const dropdown = document.getElementById('user-dropdown');

        if (headerUser) {
            headerUser.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown?.classList.toggle('active');
            });
        }

        // Cerrar dropdown al hacer click afuera
        document.addEventListener('click', () => {
            dropdown?.classList.remove('active');
        });

        // Manejar acciones del dropdown
        dropdown?.addEventListener('click', (e) => {
            const action = e.target.closest('.dropdown-item-clean')?.dataset.action;
            if (action) {
                this.handleDropdownAction(action);
                dropdown.classList.remove('active');
            }
        });
    }

    /**
     * Manejar acciones del dropdown
     */
    handleDropdownAction(action) {
        console.log('🎯 CleanHeader: Ejecutando acción del dropdown:', action);
        
        switch (action) {
            case 'profile':
                console.log('👤 Navegando a perfil...');
                // Usar el método correcto de navegación de TestApp
                if (window.TestApp && typeof window.TestApp.navigateToScreen === 'function') {
                    window.TestApp.navigateToScreen('profile');
                    console.log('✅ Navegación a perfil exitosa');
                } else if (window.TestApp && typeof window.TestApp.showScreen === 'function') {
                    window.TestApp.showScreen('profile');
                    console.log('✅ Navegación a perfil exitosa (showScreen)');
                } else {
                    console.warn('⚠️ TestApp no disponible, intentando navegación manual');
                    // Fallback manual: activar la pantalla directamente
                    this.activateScreen('profile-screen');
                }
                break;
                
            case 'stats':
                console.log('📊 Navegando a estadísticas...');
                // Usar el método correcto de navegación de TestApp
                if (window.TestApp && typeof window.TestApp.navigateToScreen === 'function') {
                    window.TestApp.navigateToScreen('stats');
                    console.log('✅ Navegación a stats exitosa');
                } else if (window.TestApp && typeof window.TestApp.showScreen === 'function') {
                    window.TestApp.showScreen('stats');
                    console.log('✅ Navegación a stats exitosa (showScreen)');
                } else {
                    console.warn('⚠️ TestApp no disponible, intentando navegación manual');
                    // Fallback manual: activar la pantalla directamente
                    this.activateScreen('stats-screen');
                }
                break;
                
            case 'settings':
                console.log('⚙️ Navegando a configuración...');
                // Usar el método correcto de navegación de TestApp
                if (window.TestApp && typeof window.TestApp.navigateToScreen === 'function') {
                    window.TestApp.navigateToScreen('settings');
                    console.log('✅ Navegación a settings exitosa');
                } else if (window.TestApp && typeof window.TestApp.showScreen === 'function') {
                    window.TestApp.showScreen('settings');
                    console.log('✅ Navegación a settings exitosa (showScreen)');
                } else {
                    console.warn('⚠️ TestApp no disponible, intentando navegación manual');
                    // Fallback manual: activar la pantalla directamente
                    this.activateScreen('settings-screen');
                }
                break;
                
            case 'logout':
                console.log('🚪 Cerrando sesión...');
                this.handleLogout();
                break;
                
            default:
                console.warn('❓ Acción no reconocida:', action);
        }
    }

    /**
     * Manejar logout
     */
    handleLogout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            try {
                console.log('🚪 CleanHeader: Iniciando proceso de logout...');
                
                // 1. Llamar logout del AuthSystem (principal)
                if (window.AuthSystem && window.AuthSystem.logout) {
                    console.log('🔐 Llamando AuthSystem.logout()');
                    window.AuthSystem.logout();
                    return; // AuthSystem se encarga del resto
                }
                
                // 2. Fallback: limpiar datos manualmente
                console.log('🧹 Limpiando datos manualmente...');
                
                // Limpiar storage
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentGroup');
                localStorage.removeItem('selectedPlayer');
                sessionStorage.removeItem('auth_current_session');
                sessionStorage.removeItem('currentUser');
                
                // Llamar logout de otros sistemas
                if (window.Auth && window.Auth.logout) {
                    console.log('🔐 Llamando Auth.logout()');
                    window.Auth.logout();
                }
                
                if (window.Storage && window.Storage.logout) {
                    console.log('💾 Llamando Storage.logout()');
                    window.Storage.logout();
                }
                
                // Limpiar usuario actual
                this.currentUser = null;
                
                // Recargar página
                console.log('🔄 Recargando página...');
                window.location.reload();
                
            } catch (error) {
                console.error('❌ Error en logout:', error);
                // En caso de error, forzar recarga
                window.location.reload();
            }
        }
    }

    /**
     * Actualizar usuario (método público)
     */
    updateUser(userData) {
        console.log('🔄 CleanHeader: Actualizando usuario desde sistema externo:', userData);
        
        if (!userData) {
            console.log('❌ No se proporcionaron datos de usuario, usando default');
            this.currentUser = this.createDefaultUser();
            this.renderHeader();
            return;
        }
        
        // LA IMAGEN YA VIENE EN userData.photo - USARLA DIRECTAMENTE
        console.log('🖼️ userData.photo disponible:', userData.photo ? 'SÍ' : 'NO');
        
        if (userData.photo) {
            console.log('✅ USANDO IMAGEN DIRECTA de userData');
            this.currentUser = {
                id: userData.uid,
                name: userData.displayName,
                email: userData.email,
                position: 'MED', // Se actualiza después con datos reales
                ovr: 56, // OVR correcto de Pela de cachedPlayers
                photo: userData.photo, // ← LA IMAGEN QUE YA FUNCIONA
                photoURL: userData.photo
            };
        } else {
            console.log('❌ Sin imagen, mapeando básico...');
            this.currentUser = this.mapAuthUserToPlayer(userData);
        }
        
        console.log('✅ Usuario actualizado correctamente:', this.currentUser);
        console.log('🔄 FORZANDO renderHeader() después de updateUser...');
        this.renderHeader();
        console.log('✅ renderHeader() ejecutado después del login');
        
        // Intentar actualizar con datos reales después de un delay
        setTimeout(() => {
            this.updateWithRealPlayerData();
        }, 2000);
    }

    /**
     * Actualizar con datos reales de cachedPlayers
     */
    updateWithRealPlayerData() {
        if (!this.currentUser || !Storage?.cachedPlayers?.length) {
            console.log('⏰ updateWithRealPlayerData: Datos no disponibles aún');
            return;
        }
        
        const realPlayer = Storage.cachedPlayers.find(p => p.name === this.currentUser.name);
        if (realPlayer) {
            console.log('🔄 Actualizando con datos reales de cachedPlayers:', realPlayer);
            
            // Mantener la imagen que ya funciona, actualizar OVR y posición
            this.currentUser = {
                ...this.currentUser,
                ovr: realPlayer.ovr, // OVR real (56)
                position: realPlayer.position, // Posición real
                photo: this.currentUser.photo || realPlayer.photo, // Mantener imagen que funciona
                photoURL: this.currentUser.photoURL || realPlayer.photoURL
            };
            
            console.log('✅ Header actualizado con datos reales:', this.currentUser);
            this.renderHeader();
        } else {
            console.log('⚠️ No se encontró jugador real para:', this.currentUser.name);
        }
    }

    /**
     * Activar pantalla manualmente (fallback)
     */
    activateScreen(screenId) {
        console.log('🔄 Activando pantalla manualmente:', screenId);
        
        // Desactivar todas las pantallas
        const allScreens = document.querySelectorAll('.screen');
        allScreens.forEach(screen => screen.classList.remove('active'));
        
        // Activar la pantalla deseada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('✅ Pantalla activada:', screenId);
        } else {
            console.error('❌ Pantalla no encontrada:', screenId);
        }
    }

    /**
     * Obtener posición corta
     */
    getPositionShort(position) {
        const positions = {
            'Portero': 'POR',
            'Defensor': 'DEF', 
            'Mediocampista': 'MED',
            'Delantero': 'DEL'
        };
        return positions[position] || position || 'MED';
    }

    /**
     * Destruir header limpio
     */
    destroy() {
        const header = document.getElementById('clean-header');
        const styles = document.getElementById('clean-header-styles');
        
        if (header) header.remove();
        if (styles) styles.remove();
        
        document.body.classList.remove('clean-header-active');
        document.body.style.paddingTop = '';
        
        this.isInitialized = false;
        console.log('🗑️ CleanHeader destruido');
    }
}

// Hacer disponible globalmente
window.CleanHeader = CleanHeader;