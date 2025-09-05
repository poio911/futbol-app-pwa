/**
 * NewHeaderManager - Sistema completo de header moderno
 * Reemplaza completamente el header existente
 * Fecha: 2025-02-06
 */

class NewHeaderManager {
    constructor() {
        this.isInitialized = false;
        this.updateInterval = null;
        this.currentUser = null;
        this.nextMatch = null;
        this.notifications = [];
        this.notificationCount = 0;
    }

    /**
     * Inicializar el nuevo header
     */
    async init() {
        // DESACTIVADO: CleanHeader está activo
        if (typeof CleanHeader !== 'undefined' || window.cleanHeader) {
            console.log('🚫 NewHeaderManager: Desactivado - CleanHeader está activo');
            return;
        }
        
        if (this.isInitialized) {
            console.log('🔄 NewHeaderManager: Ya inicializado');
            return;
        }

        console.log('🚀 NewHeaderManager: Inicializando...');

        try {
            // Ocultar header anterior
            this.hideOldHeader();
            
            // Crear nuevo header
            this.createNewHeader();
            
            // Inyectar estilos
            this.injectStyles();
            
            // Obtener datos iniciales
            await this.loadInitialData();
            
            // Pequeño delay para asegurar que el DOM se actualice
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Renderizar header
            this.renderHeader();
            
            // Configurar actualización automática
            this.startAutoUpdate();
            
            this.isInitialized = true;
            
            // Asegurar que esté disponible globalmente para los botones del header
            window.headerManager = this;
            
            // Configurar event listeners para los botones después de asignar window.headerManager
            this.setupEventListeners();
            
            console.log('✅ NewHeaderManager: Inicializado correctamente');

        } catch (error) {
            console.error('❌ NewHeaderManager: Error en inicialización:', error);
        }
    }

    /**
     * Ocultar header anterior
     */
    hideOldHeader() {
        const oldHeader = document.getElementById('app-header');
        if (oldHeader) {
            oldHeader.style.display = 'none';
            console.log('🔒 Header anterior ocultado');
        }
    }

    /**
     * Crear estructura del nuevo header
     */
    createNewHeader() {
        // Verificar que el DOM esté listo
        if (!document.body) {
            console.error('❌ DOM no está listo, no se puede crear header');
            return;
        }

        // Agregar clase al body para padding
        document.body.classList.add('new-header-active');

        // Eliminar header anterior si existe
        const existingHeader = document.getElementById('new-app-header');
        if (existingHeader) {
            existingHeader.remove();
            console.log('🗑️ Header anterior eliminado');
        }

        // Crear header principal
        const header = document.createElement('header');
        header.id = 'new-app-header';
        header.className = 'new-header';
        
        header.innerHTML = `
            <div class="header-container">
                <!-- Next Match Info -->
                <div class="next-match" id="next-match">
                    <div class="match-info" id="match-info">
                        <div class="match-icon">
                            <i class='bx bx-football'></i>
                        </div>
                        <div class="match-details">
                            <div class="match-title" id="match-title">Cargando...</div>
                            <div class="match-datetime" id="match-datetime">--</div>
                        </div>
                    </div>
                </div>

                <!-- Match Toggle Button (solo visible en mobile) -->
                <div class="match-toggle" id="match-toggle">
                    <i class='bx bx-calendar'></i>
                </div>

                <!-- Right Section -->
                <div class="header-right">
                    <!-- Notifications -->
                    <div class="notification-bell" id="notification-bell">
                        <i class='bx bx-bell'></i>
                        <div class="notification-badge" id="notification-badge">0</div>

                        <!-- Notification Dropdown -->
                        <div class="notification-dropdown" id="notification-dropdown">
                            <div class="notification-header">
                                <div class="notification-title">Notificaciones</div>
                                <div class="mark-all-read" data-action="markAllAsRead">Marcar todas como leídas</div>
                            </div>
                            <div class="notification-list" id="notification-list">
                                <div class="notification-item">
                                    <div class="notification-icon" style="background: rgba(16, 185, 129, 0.2); color: #00ff9d;">
                                        <i class='bx bx-info-circle'></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-text">Bienvenido al nuevo header</div>
                                        <div class="notification-time">Ahora</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Profile -->
                    <div class="user-profile" id="user-profile">
                        <div class="user-avatar" id="user-avatar">U</div>
                        <div class="user-info" id="user-info">
                            <div class="user-name" id="user-name">
                                <span id="user-name-text">Usuario</span>
                                <span class="user-position" id="user-position">---</span>
                            </div>
                            <div class="user-details">
                                <span class="user-ovr" id="user-ovr">-- OVR</span>
                                <span class="user-specialty" id="user-specialty">--</span>
                            </div>
                        </div>
                        <i class='bx bx-chevron-down dropdown-arrow'></i>

                        <!-- Profile Dropdown -->
                        <div class="profile-dropdown" id="profile-dropdown">
                            <div class="dropdown-item" data-action="viewProfile">
                                <i class='bx bx-user'></i>
                                <span>Mi Perfil</span>
                            </div>
                            <div class="dropdown-item" data-action="viewStats">
                                <i class='bx bx-stats'></i>
                                <span>Mis Estadísticas</span>
                            </div>
                            <div class="dropdown-item" data-action="viewSettings">
                                <i class='bx bx-cog'></i>
                                <span>Configuración</span>
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="dropdown-item logout" data-action="logout">
                                <i class='bx bx-log-out'></i>
                                <span>Cerrar Sesión</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar al principio del body
        if (document.body.firstChild) {
            document.body.insertBefore(header, document.body.firstChild);
        } else {
            document.body.appendChild(header);
        }
        
        console.log('✅ Header insertado en DOM:', header);
        console.log('✅ Elementos disponibles:', {
            'user-avatar': document.getElementById('user-avatar'),
            'user-name-text': document.getElementById('user-name-text'),
            'user-position': document.getElementById('user-position'),
            'match-info': document.getElementById('match-info')
        });

        // Agregar clase al body para padding-top
        document.body.classList.add('new-header-active');

        // Configurar event listeners
        this.setupEventListeners();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Toggle notificaciones
        document.getElementById('notification-bell').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotifications();
        });

        // Toggle perfil
        document.getElementById('user-profile').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleProfile();
        });

        // Toggle match info (mobile)
        document.getElementById('match-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMatchInfo();
        });

        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Prevenir cierre al hacer click dentro de dropdowns
        document.querySelectorAll('.notification-dropdown, .profile-dropdown').forEach(dropdown => {
            dropdown.addEventListener('click', (e) => e.stopPropagation());
        });
    }

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            // Asegurar que los jugadores estén cargados antes de obtener el usuario
            if (typeof Storage !== 'undefined') {
                console.log('🔄 Verificando cache de jugadores...');
                if (!Storage.cachedPlayers || Storage.cachedPlayers.length === 0) {
                    console.log('📥 Cache vacío, cargando jugadores desde Firebase...');
                    await Storage.loadPlayersFromFirebase();
                    console.log(`✅ Jugadores cargados: ${Storage.cachedPlayers?.length || 0}`);
                }
                console.log(`🎯 currentPersonId: ${Storage.currentPersonId}`);
            }
            
            // Obtener usuario actual (ahora con los jugadores ya cargados)
            this.currentUser = this.getCurrentUser();
            console.log('👤 Usuario inicial del header:', this.currentUser);
            
            // Obtener próximo partido
            this.nextMatch = await this.getNextMatch();
            
            // Obtener notificaciones
            this.notifications = await this.getNotifications();
            this.notificationCount = this.notifications.filter(n => !n.read).length;

        } catch (error) {
            console.warn('⚠️ Error cargando datos iniciales:', error);
        }
    }

    /**
     * Obtener datos completos del jugador actual
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
     * Obtener usuario actual
     */
    getCurrentUser() {
        // 1. PRIORIDAD: Usar uid de AuthSystem para obtener datos reales de Firebase
        if (window.AuthSystem?.currentUser?.uid && typeof Storage !== 'undefined' && Storage.cachedPlayers) {
            console.log('🔍 Buscando usuario por UID:', window.AuthSystem.currentUser.uid);
            console.log('🔍 Usuarios en cache:', Storage.cachedPlayers.length);
            console.log('🔍 Sample UIDs:', Storage.cachedPlayers.slice(0, 3).map(p => ({name: p.name, uid: p.uid || p.id})));
            
            // Buscar por uid o por id si no tiene uid
            const userFromFirebase = Storage.cachedPlayers.find(p => 
                p.uid === window.AuthSystem.currentUser.uid || 
                p.id === window.AuthSystem.currentUser.uid
            );
            
            if (userFromFirebase) {
                console.log('✅ Usuario obtenido de Firebase por UID/ID:', userFromFirebase);
                return userFromFirebase;
            } else {
                console.warn('❌ No se encontró usuario por UID en Firebase cache');
            }
        }

        // 2. Intentar obtener datos completos del jugador actual por ID
        if (typeof Storage !== 'undefined' && Storage.currentPersonId) {
            const currentPlayerData = this.getCurrentPlayerData();
            if (currentPlayerData) {
                console.log('✅ Usuario obtenido de datos del jugador actual:', currentPlayerData);
                return currentPlayerData;
            }
        }

        // 3. Fallback a otras fuentes de usuario (SOLO como último recurso)
        const sources = [
            () => window.TestApp?.currentUser,
            () => window.SessionManager?.getCurrentUser?.(),
            () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
            () => JSON.parse(sessionStorage.getItem('currentUser') || 'null'),
            () => window.AuthSystem?.currentUser // ÚLTIMO recurso
        ];

        for (const source of sources) {
            try {
                const user = source();
                console.log('🔍 Checking user source:', user);
                if (user && (user.name || user.displayName || user.email || user.ovr)) {
                    console.log('✅ Usuario encontrado:', user);
                    return user;
                }
            } catch (e) {
                console.log('⚠️ Error en fuente de usuario:', e.message);
            }
        }

        console.log('🔶 No se encontró usuario, usando por defecto');
        
        // Usuario por defecto si no se encuentra ninguno
        return {
            name: 'Usuario Invitado',
            position: 'Sin posición',
            ovr: 50,
            specialty: 'General',
            photo: '👤',
            xp: 0,
            group: 'Sin grupo'
        };
    }

    /**
     * Obtener próximo partido
     */
    async getNextMatch() {
        try {
            if (window.db) {
                const matches = await window.db.collection('futbol_matches')
                    .where('date', '>=', new Date().toISOString().split('T')[0])
                    .orderBy('date', 'asc')
                    .limit(1)
                    .get();

                if (!matches.empty) {
                    const match = matches.docs[0].data();
                    return {
                        title: match.name || 'Partido Sin Nombre',
                        date: match.date,
                        time: match.time || '20:00'
                    };
                }
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo próximo partido:', error);
        }

        return null;
    }

    /**
     * Obtener notificaciones
     */
    async getNotifications() {
        try {
            if (window.db && this.currentUser) {
                const notifications = await window.db.collection('notifications')
                    .where('userId', '==', this.currentUser.uid || this.currentUser.id)
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get();

                return notifications.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo notificaciones:', error);
        }

        // Notificaciones demo si no hay base de datos
        return [
            {
                id: 'demo1',
                type: 'match',
                title: 'Nuevo partido disponible',
                text: 'Se ha creado un nuevo partido: "Clásico del Miércoles"',
                time: 'Hace 5 minutos',
                read: false
            }
        ];
    }

    /**
     * Renderizar header completo
     */
    renderHeader() {
        this.updateUserInfo();
        this.updateMatchInfo();
        this.updateNotifications();
    }

    /**
     * Actualizar usuario (método público para auth-system.js)
     */
    updateUser(userData) {
        console.log('🔄 Actualizando usuario desde auth-system:', userData);
        // NO usar directamente userData de AuthSystem, obtener datos reales
        const realUserData = this.getCurrentUser();
        if (realUserData) {
            console.log('🎯 Usando datos reales de Firebase en lugar de AuthSystem');
            this.currentUser = realUserData;
        } else {
            this.currentUser = userData;
        }
        this.updateUserInfo();
    }
    
    /**
     * Refrescar header con datos actualizados
     */
    async refresh() {
        console.log('🔄 Refrescando header...');
        await this.loadInitialData();
        this.renderHeader();
    }

    /**
     * Actualizar información del usuario
     */
    updateUserInfo() {
        if (!this.currentUser) {
            console.log('⚠️ No hay usuario para mostrar');
            return;
        }
        
        console.log('🔄 Actualizando info del usuario:', this.currentUser);

        const userData = this.prepareUserData();

        // Actualizar avatar
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            if (userData.photo !== '👤' && (userData.photo.startsWith('http') || userData.photo.startsWith('data:'))) {
                avatar.innerHTML = `<img src="${userData.photo}" alt="${userData.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.innerHTML='${userData.name.charAt(0).toUpperCase()}'">`;
            } else {
                avatar.textContent = userData.name.charAt(0).toUpperCase();
            }
        } else {
            console.warn('⚠️ Elemento user-avatar no encontrado');
        }

        // Actualizar información con estilos de Variante 1
        const nameEl = document.getElementById('user-name-text');
        const positionEl = document.getElementById('user-position');
        const ovrEl = document.getElementById('user-ovr');
        const specialtyEl = document.getElementById('user-specialty');

        if (nameEl) nameEl.textContent = userData.name;
        else console.warn('⚠️ Elemento user-name-text no encontrado');
        
        if (positionEl) {
            // Usar helpers unificados para posición
            const positionIcon = UnifiedPlayerHelpers.getPositionIcon(userData.position);
            const positionClass = UnifiedPlayerHelpers.getPositionClass(userData.position);
            positionEl.className = `user-position player-position-badge ${positionClass}`;
            positionEl.innerHTML = `<i class="${positionIcon}"></i> ${UnifiedPlayerHelpers.getPositionShort(userData.position) || 'N/A'}`;
            positionEl.setAttribute('data-position', userData.position || 'MED');
        } else {
            console.warn('⚠️ Elemento user-position no encontrado');
        }
        
        if (ovrEl) {
            // Usar helpers unificados para OVR
            ovrEl.className = 'user-ovr ovr-badge';
            ovrEl.textContent = userData.ovr;
            
            // Agregar indicador de cambio de OVR si existe originalOVR
            if (userData.originalOVR && userData.originalOVR !== userData.ovr) {
                const changeIndicator = UnifiedPlayerHelpers.createOVRChangeIndicator(userData.originalOVR, userData.ovr);
                ovrEl.insertAdjacentHTML('afterend', changeIndicator);
            }
        } else console.warn('⚠️ Elemento user-ovr no encontrado');
        
        // Usar helpers unificados para mejor estadística
        if (specialtyEl && userData.stats) {
            const bestStat = UnifiedPlayerHelpers.getBestStat(userData.stats);
            specialtyEl.className = 'user-specialty best-stat-header';
            specialtyEl.innerHTML = `<i class="${bestStat.icon}"></i> ${bestStat.name} ${bestStat.value}`;
        } else if (specialtyEl) {
            specialtyEl.textContent = userData.specialty;
        }
    }

    /**
     * Preparar datos del usuario
     */
    prepareUserData() {
        if (!this.currentUser) {
            return {
                name: 'Invitado',
                position: 'N/A',
                ovr: 70,
                specialty: 'Sin especialidad',
                photo: '👤',
                positionColor: '#6B7280'
            };
        }

        // Intentar obtener el nombre de diferentes campos
        const name = this.currentUser.name || 
                    this.currentUser.displayName || 
                    this.currentUser.email || 
                    (this.currentUser.firstName && this.currentUser.lastName ? 
                     `${this.currentUser.firstName} ${this.currentUser.lastName}` : null) ||
                    'Usuario';

        console.log('🔍 DEBUG: Datos del usuario actual:', this.currentUser);

        // Obtener atributos y calcular OVR si es necesario
        let ovr = this.currentUser.ovr || this.currentUser.rating || 75;
        const position = this.currentUser.position || this.currentUser.pos || 'MED';
        
        console.log('🔍 DEBUG: OVR inicial:', ovr, 'de campos:', {
            ovr: this.currentUser.ovr,
            rating: this.currentUser.rating,
            attributes: this.currentUser.attributes
        });
        
        // Si hay atributos detallados, calcular OVR unificado
        if (this.currentUser.attributes && typeof Storage !== 'undefined' && Storage.calculateUnifiedOVR) {
            const calculatedOVR = Storage.calculateUnifiedOVR(this.currentUser.attributes, position);
            console.log('🔍 DEBUG: OVR calculado con Storage.calculateUnifiedOVR:', calculatedOVR);
            ovr = calculatedOVR;
        }

        console.log('🔍 DEBUG: OVR final que se mostrará en header:', ovr);

        return {
            name: name,
            position: position,
            ovr: ovr,
            specialty: this.currentUser.specialty || this.currentUser.speciality || '🎮 Jugador',
            photo: this.currentUser.photo || this.currentUser.avatar || this.currentUser.image || '👤',
            positionColor: this.getPositionColor(position)
        };
    }

    /**
     * Obtener color de posición
     */
    getPositionColor(position) {
        const colors = {
            'DEL': '#EF4444', // Rojo
            'MED': '#10B981', // Verde
            'DEF': '#3B82F6', // Azul
            'POR': '#F59E0B'  // Naranja
        };
        return colors[position] || '#6B7280';
    }

    /**
     * Actualizar información del partido
     */
    updateMatchInfo() {
        const matchInfo = document.getElementById('match-info');
        const matchTitle = document.getElementById('match-title');
        const matchDateTime = document.getElementById('match-datetime');

        if (!matchInfo || !matchTitle || !matchDateTime) {
            console.warn('Match info elements not found');
            return;
        }

        if (this.nextMatch) {
            matchTitle.textContent = this.nextMatch.title;
            
            const date = new Date(this.nextMatch.date);
            const dateStr = date.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
            });
            matchDateTime.textContent = `${dateStr} • ${this.nextMatch.time}`;
            
            matchInfo.style.display = 'flex';
        } else {
            matchTitle.textContent = 'No hay partidos programados';
            matchDateTime.textContent = '';
        }
    }

    /**
     * Actualizar notificaciones
     */
    updateNotifications() {
        const badge = document.getElementById('notification-badge');
        const notificationList = document.getElementById('notification-list');

        // Actualizar badge
        if (this.notificationCount > 0) {
            badge.textContent = this.notificationCount > 99 ? '99+' : this.notificationCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        // Actualizar lista
        notificationList.innerHTML = '';
        
        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-item">
                    <div class="notification-content">
                        <div class="notification-text">No tienes notificaciones</div>
                    </div>
                </div>
            `;
            return;
        }

        this.notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${!notification.read ? 'unread' : ''}`;
            
            const iconColor = this.getNotificationIconColor(notification.type);
            const icon = this.getNotificationIcon(notification.type);
            
            item.innerHTML = `
                <div class="notification-icon" style="background: ${iconColor.bg}; color: ${iconColor.color};">
                    <i class='bx ${icon}'></i>
                </div>
                <div class="notification-content">
                    <div class="notification-text">${notification.text}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            `;
            
            notificationList.appendChild(item);
        });
    }

    /**
     * Obtener icono de notificación
     */
    getNotificationIcon(type) {
        const icons = {
            'match': 'bx-football',
            'evaluation': 'bx-star',
            'user': 'bx-group',
            'system': 'bx-info-circle',
            'achievement': 'bx-trophy'
        };
        return icons[type] || 'bx-info-circle';
    }

    /**
     * Obtener color de icono de notificación
     */
    getNotificationIconColor(type) {
        const colors = {
            'match': { bg: 'rgba(0, 255, 157, 0.2)', color: '#00ff9d' },
            'evaluation': { bg: 'rgba(255, 0, 230, 0.2)', color: '#ff00e6' },
            'user': { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' },
            'system': { bg: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' },
            'achievement': { bg: 'rgba(168, 85, 247, 0.2)', color: '#A855F7' }
        };
        return colors[type] || colors.system;
    }

    /**
     * Toggle notificaciones
     */
    toggleNotifications() {
        const dropdown = document.getElementById('notification-dropdown');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        // Cerrar perfil si está abierto
        profileDropdown.classList.remove('active');
        document.getElementById('user-profile').classList.remove('active');
        
        dropdown.classList.toggle('active');
    }

    /**
     * Toggle perfil
     */
    toggleProfile() {
        const profileDropdown = document.getElementById('profile-dropdown');
        const notificationDropdown = document.getElementById('notification-dropdown');
        const userProfile = document.getElementById('user-profile');
        
        // Cerrar notificaciones si están abiertas
        notificationDropdown.classList.remove('active');
        
        profileDropdown.classList.toggle('active');
        userProfile.classList.toggle('active');
    }

    /**
     * Toggle match info (mobile)
     */
    toggleMatchInfo() {
        const matchInfo = document.getElementById('next-match');
        const toggleButton = document.getElementById('match-toggle');
        
        matchInfo.classList.toggle('expanded');
        toggleButton.classList.toggle('active');
    }

    /**
     * Cerrar todos los dropdowns
     */
    closeAllDropdowns() {
        const notificationDropdown = document.getElementById('notification-dropdown');
        const profileDropdown = document.getElementById('profile-dropdown');
        const userProfile = document.getElementById('user-profile');
        
        if (notificationDropdown) notificationDropdown.classList.remove('active');
        if (profileDropdown) profileDropdown.classList.remove('active');
        if (userProfile) userProfile.classList.remove('active');
        
        // Cerrar match info en mobile
        const nextMatch = document.getElementById('next-match');
        const matchToggle = document.getElementById('match-toggle');
        
        if (nextMatch) nextMatch.classList.remove('expanded');
        if (matchToggle) matchToggle.classList.remove('active');
    }

    /**
     * Toggle dropdown del perfil de usuario
     */
    toggleProfileDropdown(event) {
        // Prevenir que el evento se propague y cause conflictos
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        
        const profileDropdown = document.getElementById('profile-dropdown');
        const userProfile = document.getElementById('user-profile');
        const notificationDropdown = document.getElementById('notification-dropdown');
        
        console.log('🔍 DEBUG toggleProfileDropdown:', {
            profileDropdown: profileDropdown,
            userProfile: userProfile,
            profileDropdownExists: !!profileDropdown,
            userProfileExists: !!userProfile
        });
        
        // Cerrar dropdown de notificaciones si está abierto
        if (notificationDropdown) notificationDropdown.classList.remove('active');
        
        // Toggle dropdown del perfil
        if (profileDropdown && userProfile) {
            const isActive = profileDropdown.classList.contains('active');
            if (isActive) {
                profileDropdown.classList.remove('active');
                userProfile.classList.remove('active');
                console.log('🔸 Profile dropdown closed');
            } else {
                profileDropdown.classList.add('active');
                userProfile.classList.add('active');
                console.log('🔹 Profile dropdown opened');
                
                // Debug: verificar que la clase se aplicó
                setTimeout(() => {
                    console.log('🔍 After adding active class:', {
                        profileDropdownHasActive: profileDropdown.classList.contains('active'),
                        profileDropdownDisplay: window.getComputedStyle(profileDropdown).display,
                        profileDropdownClasses: profileDropdown.className
                    });
                }, 100);
            }
        } else {
            console.error('❌ Profile dropdown elements not found:', {
                profileDropdown: !!profileDropdown,
                userProfile: !!userProfile
            });
        }
    }

    /**
     * Toggle dropdown de notificaciones
     */
    toggleNotificationDropdown(event) {
        // Prevenir que el evento se propague y cause conflictos
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        
        const notificationDropdown = document.getElementById('notification-dropdown');
        const profileDropdown = document.getElementById('profile-dropdown');
        const userProfile = document.getElementById('user-profile');
        
        // Cerrar dropdown del perfil si está abierto
        if (profileDropdown) profileDropdown.classList.remove('active');
        if (userProfile) userProfile.classList.remove('active');
        
        // Toggle dropdown de notificaciones
        if (notificationDropdown) {
            const isActive = notificationDropdown.classList.contains('active');
            if (isActive) {
                notificationDropdown.classList.remove('active');
                console.log('🔸 Notifications dropdown closed');
            } else {
                notificationDropdown.classList.add('active');
                console.log('🔹 Notifications dropdown opened');
            }
        }
    }

    /**
     * Iniciar actualización automática
     */
    startAutoUpdate() {
        // Auto-actualización deshabilitada para evitar sobrescribir datos manuales
        // Solo actualizar si hay una sesión real activa
        this.updateInterval = setInterval(() => {
            // Solo auto-actualizar si hay datos reales de sesión
            if (typeof Storage !== 'undefined' && Storage.currentPersonId && Storage.cachedPlayers?.length > 0) {
                console.log('🔄 Auto-actualización del header (sesión activa)...');
                const previousUser = JSON.stringify(this.currentUser);
                this.currentUser = this.getCurrentUser();
                const currentUser = JSON.stringify(this.currentUser);
                
                // Solo actualizar si el usuario cambió
                if (previousUser !== currentUser) {
                    console.log('🎯 Detectado cambio en datos del usuario, actualizando header');
                    this.renderHeader();
                }
            }
            // Sin logs cuando no hay sesión - mantener silencio
        }, 30000);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.notificationCount = 0;
        this.updateNotifications();
        console.log('✅ Todas las notificaciones marcadas como leídas');
    }

    /**
     * Ver perfil
     */
    viewProfile() {
        this.closeAllDropdowns();
        console.log('👤 Navegando a perfil');
        
        // Intentar múltiples formas de navegar al perfil
        if (window.TestApp && typeof window.TestApp.showScreen === 'function') {
            window.TestApp.showScreen('profile');
        } else if (document.querySelector('[data-section="profile"]')) {
            // Si existe un botón de perfil, hacer clic en él
            const profileBtn = document.querySelector('[data-section="profile"]');
            profileBtn.click();
        } else {
            // Fallback: mostrar modal con información del usuario
            this.showUserProfileModal();
        }
    }

    /**
     * Ver estadísticas
     */
    viewStats() {
        this.closeAllDropdowns();
        console.log('📊 Navegando a estadísticas');
        
        // Intentar múltiples formas de navegar a estadísticas
        if (window.TestApp && typeof window.TestApp.showScreen === 'function') {
            window.TestApp.showScreen('stats');
        } else if (document.querySelector('[data-section="stats"]')) {
            const statsBtn = document.querySelector('[data-section="stats"]');
            statsBtn.click();
        } else {
            // Fallback: navegar a la sección de jugadores que tiene estadísticas
            const playersBtn = document.querySelector('[data-section="players"]');
            if (playersBtn) {
                playersBtn.click();
                // Scroll a tu jugador después de un breve delay
                setTimeout(() => {
                    const userCard = document.querySelector(`[data-player-id="${this.currentUser?.uid || this.currentUser?.id}"]`);
                    if (userCard) {
                        userCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        userCard.style.border = '2px solid #00ff9d';
                        setTimeout(() => {
                            userCard.style.border = '';
                        }, 3000);
                    }
                }, 500);
            } else {
                alert('📊 Sección de estadísticas no disponible');
            }
        }
    }

    /**
     * Ver configuración
     */
    viewSettings() {
        this.closeAllDropdowns();
        console.log('⚙️ Abriendo configuración');
        
        // Mostrar un modal simple de configuración
        this.showSettingsModal();
    }

    /**
     * Cerrar sesión
     */
    logout() {
        this.closeAllDropdowns();
        
        // Intentar logout directo sin modal para evitar errores de DOM
        try {
            if (window.AuthSystem && typeof window.AuthSystem.logout === 'function') {
                console.log('🚪 Cerrando sesión desde header...');
                window.AuthSystem.logout(true); // true = stay logged out
            } else {
                console.log('🚪 AuthSystem no disponible, recargando página...');
                // Fallback: limpiar localStorage y recargar
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                window.location.reload();
            }
        } catch (error) {
            console.error('❌ Error en logout desde header:', error);
            // Fallback de emergencia
            localStorage.clear();
            window.location.reload();
        }
    }

    /**
     * Mostrar modal de perfil del usuario
     */
    showUserProfileModal() {
        const user = this.currentUser;
        if (!user) {
            alert('❌ No hay datos del usuario disponibles');
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            z-index: 999999; backdrop-filter: blur(5px);
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px; padding: 30px; max-width: 400px; width: 90%;
            border: 2px solid #00ff9d; color: white; text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        `;
        
        content.innerHTML = `
            <h2 style="color: #00ff9d; margin-bottom: 20px;">👤 Mi Perfil</h2>
            <div style="background: rgba(0,255,157,0.1); border-radius: 15px; padding: 20px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0;">${user.name || user.displayName || 'Usuario'}</h3>
                <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #00ff9d;">${user.ovr || 50}</div>
                        <div style="font-size: 12px; opacity: 0.7;">OVR</div>
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: bold;">${user.position || 'N/A'}</div>
                        <div style="font-size: 12px; opacity: 0.7;">Posición</div>
                    </div>
                </div>
                ${user.attributes ? `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
                        <div><small>PAC</small><br><strong>${user.attributes.pac || 50}</strong></div>
                        <div><small>SHO</small><br><strong>${user.attributes.sho || 50}</strong></div>
                        <div><small>PAS</small><br><strong>${user.attributes.pas || 50}</strong></div>
                        <div><small>DRI</small><br><strong>${user.attributes.dri || 50}</strong></div>
                        <div><small>DEF</small><br><strong>${user.attributes.def || 50}</strong></div>
                        <div><small>PHY</small><br><strong>${user.attributes.phy || 50}</strong></div>
                    </div>
                ` : ''}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: #00ff9d; color: #1a1a2e; border: none; padding: 10px 20px;
                border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px;
            ">Cerrar</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Mostrar modal de configuración
     */
    showSettingsModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            z-index: 999999; backdrop-filter: blur(5px);
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px; padding: 30px; max-width: 400px; width: 90%;
            border: 2px solid #00ff9d; color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        `;
        
        content.innerHTML = `
            <h2 style="color: #00ff9d; margin-bottom: 20px; text-align: center;">⚙️ Configuración</h2>
            <div style="background: rgba(0,255,157,0.1); border-radius: 15px; padding: 20px; margin: 15px 0;">
                <p>🎨 <strong>Tema:</strong> Oscuro</p>
                <p>🔔 <strong>Notificaciones:</strong> Activadas</p>
                <p>⚽ <strong>Grupo:</strong> ${window.TestApp?.currentGroupName || 'Fútbol en el Galpón'}</p>
                <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,255,157,0.3); font-size: 14px; opacity: 0.7;">
                    💡 Más opciones de configuración estarán disponibles próximamente.
                </p>
            </div>
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #00ff9d; color: #1a1a2e; border: none; padding: 10px 20px;
                    border-radius: 10px; font-weight: bold; cursor: pointer;
                ">Cerrar</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Configurar event listeners para los botones del header
     */
    setupEventListeners() {
        try {
            // Event listeners para botones del dropdown de perfil
            const profileDropdownItems = document.querySelectorAll('.profile-dropdown .dropdown-item[data-action]');
            profileDropdownItems.forEach(item => {
                const action = item.getAttribute('data-action');
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(`🔘 Clicked action: ${action}`);
                    if (this[action] && typeof this[action] === 'function') {
                        this[action]();
                        console.log(`✅ Executed ${action} successfully`);
                    } else {
                        console.error(`❌ Method ${action} not found or not a function`);
                    }
                });
            });

            // Event listener para marcar todas las notificaciones como leídas
            const markAllReadButton = document.querySelector('.mark-all-read[data-action="markAllAsRead"]');
            if (markAllReadButton) {
                markAllReadButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('🔘 Clicked markAllAsRead');
                    if (this.markAllAsRead && typeof this.markAllAsRead === 'function') {
                        this.markAllAsRead();
                        console.log('✅ Executed markAllAsRead successfully');
                    } else {
                        console.error('❌ Method markAllAsRead not found or not a function');
                    }
                });
            }

            // Event listeners para abrir/cerrar dropdowns
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                userProfile.addEventListener('click', (e) => {
                    console.log('🔘 Clicked user profile');
                    this.toggleProfileDropdown(e);
                });
            }

            const notificationBell = document.querySelector('.notification-bell');
            if (notificationBell) {
                notificationBell.addEventListener('click', (e) => {
                    console.log('🔘 Clicked notifications bell');
                    this.toggleNotificationDropdown(e);
                });
            }

            // Event listener para cerrar dropdowns al hacer clic fuera - REMOVIDO temporalmente para debugging

            console.log('✅ Event listeners configurados correctamente para header buttons');
        } catch (error) {
            console.error('❌ Error configurando event listeners:', error);
        }
    }

    /**
     * Inyectar estilos CSS
     */
    injectStyles() {
        if (document.getElementById('new-header-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'new-header-styles';
        styles.innerHTML = `
            /* Variables CSS */
            :root {
                --header-height: 70px;
                --header-height-mobile: 60px;
            }
            
            /* Body padding para header fijo */
            body.new-header-active {
                padding-top: var(--header-height) !important;
            }
            
            /* NUEVO HEADER COMPLETO */
            .new-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: var(--card-bg);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(0, 255, 157, 0.1);
                z-index: 1000;
                height: var(--header-height);
                display: flex;
                align-items: center;
                padding: 0 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }
            
            .header-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                max-width: 1400px;
                margin: 0 auto;
            }
            
            /* Next Match Info */
            .next-match {
                display: flex;
                align-items: center;
                gap: 16px;
                flex: 1;
                justify-content: flex-start;
            }
            
            .match-info {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                background: rgba(0, 255, 157, 0.1);
                border: 1px solid rgba(0, 255, 157, 0.3);
                border-radius: 12px;
                transition: all 0.3s ease;
            }
            
            .match-info:hover {
                background: rgba(0, 255, 157, 0.15);
                transform: translateY(-2px);
            }
            
            .match-icon {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: white;
            }
            
            .match-details {
                display: flex;
                flex-direction: column;
            }
            
            .match-title {
                font-size: 14px;
                font-weight: 600;
                color: white;
                margin-bottom: 2px;
            }
            
            .match-datetime {
                font-size: 12px;
                color: var(--primary);
                font-weight: 500;
            }
            
            .no-match {
                color: #9CA3AF;
                font-size: 14px;
                font-style: italic;
            }
            
            /* Match Toggle Button for Mobile */
            .match-toggle {
                display: none;
                width: 32px;
                height: 32px;
                background: rgba(0, 255, 157, 0.1);
                border: 1px solid rgba(0, 255, 157, 0.3);
                border-radius: 8px;
                cursor: pointer;
                align-items: center;
                justify-content: center;
                color: var(--primary);
                font-size: 16px;
                transition: all 0.3s ease;
            }
            
            .match-toggle:hover {
                background: rgba(0, 255, 157, 0.2);
            }
            
            .match-toggle.active {
                background: var(--primary);
                color: var(--dark);
            }
            
            /* Right Section */
            .header-right {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            /* Notifications */
            .notification-bell {
                position: relative;
                width: 44px;
                height: 44px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .notification-bell:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .notification-badge {
                position: absolute;
                top: -2px;
                right: -2px;
                background: #EF4444;
                color: white;
                font-size: 11px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
                border: 2px solid var(--card-bg);
                display: none;
            }
            
            /* User Profile */
            .user-profile {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 6px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-width: 200px;
            }
            
            .user-profile:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .user-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
                color: white;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .user-info {
                flex: 1;
                min-width: 0;
            }
            
            .user-name {
                font-weight: 600;
                font-size: 14px;
                color: white;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .user-details {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 2px;
                flex-wrap: wrap;
            }
            
            .user-position {
                background: var(--primary);
                color: var(--dark);
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(0, 255, 157, 0.3);
            }
            
            .user-ovr {
                background: linear-gradient(135deg, var(--secondary), #ff4081);
                color: white;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(255, 0, 230, 0.3);
            }
            
            .user-specialty {
                background: rgba(156, 163, 175, 0.2);
                color: #E5E7EB;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .dropdown-arrow {
                color: #9CA3AF;
                transition: transform 0.3s ease;
            }
            
            .user-profile.active .dropdown-arrow {
                transform: rotate(180deg);
            }
            
            /* Dropdown Menu - REDISEÑADO */
            .profile-dropdown {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                backdrop-filter: blur(20px);
                border: 2px solid #00ff9d;
                border-radius: 20px;
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.6),
                    0 0 20px rgba(0, 255, 157, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                min-width: 280px;
                display: none;
                overflow: hidden;
                z-index: 999999;
                transform: translateY(-10px);
                opacity: 0;
            }
            
            .profile-dropdown.active {
                display: block;
                animation: dropdownSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            
            @keyframes dropdownSlideIn {
                0% {
                    transform: translateY(-10px) scale(0.95);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            
            /* Header del dropdown */
            .dropdown-header {
                background: rgba(0, 255, 157, 0.1);
                padding: 16px 20px;
                border-bottom: 1px solid rgba(0, 255, 157, 0.2);
                text-align: center;
            }
            
            .dropdown-header h4 {
                margin: 0;
                color: #00ff9d;
                font-size: 16px;
                font-weight: 600;
            }
            
            .dropdown-item {
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 15px;
                color: #e0e6ed;
                position: relative;
                border-left: 3px solid transparent;
            }
            
            .dropdown-item:hover {
                background: linear-gradient(90deg, rgba(0, 255, 157, 0.15) 0%, rgba(0, 255, 157, 0.05) 100%);
                border-left-color: #00ff9d;
                color: #ffffff;
                transform: translateX(5px);
            }
            
            .dropdown-item:hover i {
                color: #00ff9d;
                transform: scale(1.1);
            }
            
            .dropdown-item i {
                font-size: 20px;
                width: 20px;
                color: #9CA3AF;
                transition: all 0.3s ease;
            }
            
            /* Estilos especiales por tipo de item */
            .dropdown-item:first-of-type {
                margin-top: 8px;
            }
            
            .dropdown-item:last-of-type {
                margin-bottom: 8px;
            }
            
            .dropdown-divider {
                height: 1px;
                background: rgba(0, 255, 157, 0.1);
                margin: 8px 0;
            }
            
            /* Botón de logout especial */
            .dropdown-item.logout {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
                color: #ff6b6b;
                border-left-color: #ff6b6b;
                margin-top: 8px;
                border-top: 1px solid rgba(239, 68, 68, 0.2);
            }
            
            .dropdown-item.logout:hover {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%);
                border-left-color: #ff4757;
                color: #ffffff;
            }
            
            .dropdown-item.logout i {
                color: #ff6b6b;
            }
            
            .dropdown-item.logout:hover i {
                color: #ff4757;
            }
            
            /* Notification Dropdown - REDISEÑADO */
            .notification-dropdown {
                position: absolute;
                top: calc(100% + 12px);
                right: -8px;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                backdrop-filter: blur(20px);
                border: 2px solid #00ff9d;
                border-radius: 20px;
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.6),
                    0 0 20px rgba(0, 255, 157, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                width: 380px;
                max-height: 420px;
                display: none;
                overflow: hidden;
                z-index: 999999;
                transform: translateY(-10px);
                opacity: 0;
            }
            
            .notification-dropdown.active {
                display: block;
                animation: dropdownSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            
            .notification-header {
                padding: 16px 20px;
                border-bottom: 1px solid rgba(0, 255, 157, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 16px;
                color: var(--text-light);
            }
            
            .mark-all-read {
                color: var(--primary);
                font-size: 12px;
                cursor: pointer;
                font-weight: 500;
            }
            
            .mark-all-read:hover {
                opacity: 0.8;
            }
            
            .notification-list {
                max-height: 320px;
                overflow-y: auto;
            }
            
            .notification-item {
                padding: 16px 20px;
                border-bottom: 1px solid rgba(0, 255, 157, 0.05);
                display: flex;
                gap: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .notification-item:hover {
                background: rgba(255, 255, 255, 0.02);
            }
            
            .notification-item.unread {
                background: rgba(0, 255, 157, 0.05);
            }
            
            .notification-item:last-child {
                border-bottom: none;
            }
            
            .notification-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-text {
                font-size: 14px;
                line-height: 1.4;
                margin-bottom: 4px;
                color: var(--text-light);
            }
            
            .notification-time {
                font-size: 12px;
                color: #9CA3AF;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                body.new-header-active {
                    padding-top: var(--header-height-mobile) !important;
                }
                
                .new-header {
                    height: var(--header-height-mobile);
                    padding: 0 16px;
                }
                
                .header-container {
                    gap: 8px;
                }
                
                /* Mostrar botón toggle en mobile */
                .match-toggle {
                    display: flex;
                }
                
                /* Ocultar partido por defecto en mobile */
                .next-match {
                    position: absolute;
                    top: 100%;
                    left: 16px;
                    right: 16px;
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 255, 157, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    display: none;
                    z-index: 999998;
                    animation: slideDown 0.3s ease;
                }
                
                .next-match.expanded {
                    display: flex;
                    padding: 12px;
                }
                
                .match-info {
                    padding: 8px 12px;
                    gap: 12px;
                    background: rgba(0, 255, 157, 0.1);
                    width: 100%;
                }
                
                .match-icon {
                    width: 32px;
                    height: 32px;
                    font-size: 16px;
                }
                
                .match-title {
                    font-size: 14px;
                }
                
                .match-datetime {
                    font-size: 12px;
                }
                
                .user-profile {
                    min-width: auto;
                    gap: 8px;
                    padding: 4px;
                }
                
                .user-avatar {
                    width: 36px;
                    height: 36px;
                    font-size: 14px;
                }
                
                .user-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .user-name {
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .user-details {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-wrap: wrap;
                    margin-top: 1px;
                }
                
                .user-position {
                    padding: 1px 6px;
                    font-size: 9px;
                    font-weight: 700;
                }
                
                .user-ovr {
                    padding: 1px 6px;
                    font-size: 9px;
                    font-weight: 700;
                }
                
                .user-specialty {
                    padding: 1px 4px;
                    font-size: 8px;
                    font-weight: 500;
                }
                
                .notification-dropdown {
                    width: 300px;
                    right: -20px;
                }
                
                .header-right {
                    gap: 12px;
                }
                
                .dropdown-arrow {
                    font-size: 16px;
                }
                
                /* Asegurar que toda la info del usuario sea visible */
                .user-profile .user-info {
                    display: block !important;
                }
                
                .user-profile .user-details {
                    display: flex !important;
                }
            }
            
            /* Animations */
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* ========== ESTILOS UNIFICADOS PARA POSICIONES ========== */
            .position-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                border-radius: 8px;
                padding: 4px 8px;
                min-width: 35px;
                text-align: center;
                letter-spacing: 0.5px;
                border: 1px solid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            /* Delanteros */
            .position-badge.del,
            .position-badge[data-position="DEL"],
            .position-del {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                border-color: #ff4757;
                box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
            }
            
            /* Mediocampistas */
            .position-badge.med,
            .position-badge[data-position="MED"],  
            .position-med {
                background: linear-gradient(135deg, #00ff9d 0%, #00d8ff 100%);
                color: #1a1a2e;
                border-color: #00cc7d;
                box-shadow: 0 2px 8px rgba(0, 255, 157, 0.3);
            }
            
            /* Defensores */
            .position-badge.def,
            .position-badge[data-position="DEF"],
            .position-def {
                background: linear-gradient(135deg, #4834d4 0%, #686de0 100%);
                color: white;
                border-color: #3742fa;
                box-shadow: 0 2px 8px rgba(72, 52, 212, 0.3);
            }
            
            /* Arqueros */
            .position-badge.por,
            .position-badge[data-position="POR"],
            .position-por {
                background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
                color: white;
                border-color: #ff9500;
                box-shadow: 0 2px 8px rgba(255, 165, 2, 0.3);
            }
            
            /* Posición en el header */
            .user-position {
                display: inline-block;
                background: linear-gradient(135deg, #00ff9d 0%, #00d8ff 100%);
                color: #1a1a2e;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                border-radius: 6px;
                padding: 2px 6px;
                letter-spacing: 0.5px;
                border: 1px solid #00cc7d;
                box-shadow: 0 1px 3px rgba(0, 255, 157, 0.3);
            }
            
            /* Override para posición específica en header */
            .user-position[data-position="DEL"] {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                border-color: #ff4757;
                box-shadow: 0 1px 3px rgba(255, 107, 107, 0.3);
            }
            
            .user-position[data-position="DEF"] {
                background: linear-gradient(135deg, #4834d4 0%, #686de0 100%);
                color: white;
                border-color: #3742fa;
                box-shadow: 0 1px 3px rgba(72, 52, 212, 0.3);
            }
            
            .user-position[data-position="POR"] {
                background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
                color: white;
                border-color: #ff9500;
                box-shadow: 0 1px 3px rgba(255, 165, 2, 0.3);
            }
        `;
        
        document.head.appendChild(styles);
        console.log('✅ Estilos del nuevo header inyectados');
    }

    /**
     * Destruir el header manager
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remover header
        const header = document.getElementById('new-app-header');
        if (header) {
            header.remove();
        }
        
        // Remover estilos
        const styles = document.getElementById('new-header-styles');
        if (styles) {
            styles.remove();
        }
        
        // Remover clase del body
        document.body.classList.remove('new-header-active');
        
        // Mostrar header anterior
        const oldHeader = document.getElementById('app-header');
        if (oldHeader) {
            oldHeader.style.display = '';
        }
        
        this.isInitialized = false;
        console.log('🗑️ NewHeaderManager destruido');
    }
    
    /**
     * Refrescar header manualmente
     */
    refresh() {
        console.log('🔄 Refrescando header manualmente...');
        this.currentUser = this.getCurrentUser();
        this.renderHeader();
    }
    
    /**
     * Forzar reinicialización completa
     */
    async forceInit() {
        console.log('🚀 Forzando reinicialización completa...');
        if (this.isInitialized) {
            this.destroy();
        }
        await this.init();
    }

    /**
     * Get position icon for header - Variant 1 style
     */
    getPositionIconForHeader(position) {
        const icons = {
            'POR': '<i class="bx bxs-hand"></i>',
            'Portero': '<i class="bx bxs-hand"></i>',
            'DEF': '<i class="bx bx-shield-alt-2"></i>',
            'Defensor': '<i class="bx bx-shield-alt-2"></i>',
            'MED': '<i class="bx bx-target-lock"></i>',
            'Mediocampista': '<i class="bx bx-target-lock"></i>',
            'Centrocampista': '<i class="bx bx-target-lock"></i>',
            'DEL': '<i class="bx bx-football"></i>',
            'Delantero': '<i class="bx bx-football"></i>'
        };
        return icons[position] || '<i class="bx bx-user"></i>';
    }

    /**
     * Get position class for header - Variant 1 style
     */
    getPositionClassForHeader(position) {
        const positionMap = {
            'POR': 'position-por',
            'Portero': 'position-por',
            'DEF': 'position-def',
            'Defensor': 'position-def',
            'MED': 'position-med',
            'Mediocampista': 'position-med',
            'Centrocampista': 'position-med',
            'DEL': 'position-del',
            'Delantero': 'position-del'
        };
        return positionMap[position] || 'position-med';
    }

    /**
     * Get best stat for header display
     */
    getBestStatForHeader(stats) {
        if (!stats) {
            return { name: 'N/A', value: 50, icon: 'bx bx-star' };
        }

        const statMap = {
            pac: { name: 'VEL', icon: 'bx bx-run' },
            sho: { name: 'TIR', icon: 'bx bx-target-lock' },
            pas: { name: 'PAS', icon: 'bx bx-target-lock' },
            dri: { name: 'REG', icon: 'bx bx-joystick' },
            def: { name: 'DEF', icon: 'bx bx-shield' },
            phy: { name: 'FÍS', icon: 'bx bx-body' }
        };

        let bestStatKey = 'pac';
        let bestValue = stats.pac || 50;

        for (const [key, value] of Object.entries(stats)) {
            if (value > bestValue) {
                bestValue = value;
                bestStatKey = key;
            }
        }

        return {
            ...statMap[bestStatKey],
            value: bestValue
        };
    }
}

// Crear instancia global
window.newHeaderManager = new NewHeaderManager();

// Auto-inicializar solo después de login exitoso
function initNewHeader() {
    if (window.isTestEnvironment || window.playwright) return;
    
    // DESACTIVADO: CleanHeader está activo
    if (typeof CleanHeader !== 'undefined' || window.cleanHeader) {
        console.log('🚫 NewHeaderManager auto-init: Desactivado - CleanHeader está activo');
        return;
    }
    
    // Verificar si hay un usuario logueado
    const userLoggedIn = checkUserLoggedIn();
    
    if (userLoggedIn) {
        console.log('🟢 Usuario logueado, inicializando header...');
        window.newHeaderManager.init();
    } else {
        console.log('🟡 Esperando login, reintentando en 2s...');
        setTimeout(initNewHeader, 2000);
    }
}

// Verificar si el usuario está logueado
function checkUserLoggedIn() {
    // PRIMERA PRIORIDAD: verificar si estamos en pantalla de login
    const loginOverlay = document.querySelector('.login-overlay');
    const authScreen = document.getElementById('auth-screen');
    
    // Si la pantalla de login está visible, NO inicializar header
    if (loginOverlay && getComputedStyle(loginOverlay).display !== 'none') {
        console.log('🚫 Login screen visible, header blocked');
        return false;
    }
    
    if (authScreen && getComputedStyle(authScreen).display !== 'none') {
        console.log('🚫 Auth screen visible, header blocked');
        return false;
    }
    
    // Solo si no hay login visible, verificar si hay usuario
    const sources = [
        () => window.AuthSystem?.currentUser,
        () => window.TestApp?.currentUser,
        () => window.SessionManager?.getCurrentUser?.(),
        () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
        () => JSON.parse(sessionStorage.getItem('currentUser') || 'null')
    ];

    for (const source of sources) {
        try {
            const user = source();
            if (user && (user.name || user.displayName || user.email || user.ovr)) {
                console.log('✅ Usuario encontrado y login no visible');
                return true;
            }
        } catch (e) {
            continue;
        }
    }
    
    console.log('❌ No hay usuario logueado');
    return false;
}

// DESACTIVADO: CleanHeader está activo
if (typeof CleanHeader === 'undefined' && !window.cleanHeader) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initNewHeader, 1000);
        });
    } else {
        setTimeout(initNewHeader, 1000);
    }
}

// Escuchar eventos de login/cambio de usuario
document.addEventListener('userChanged', () => {
    console.log('🔄 Usuario cambió, actualizando header...');
    if (window.newHeaderManager.isInitialized) {
        window.newHeaderManager.refresh();
    }
});

document.addEventListener('userLoggedIn', () => {
    console.log('🔄 Usuario logueado, inicializando header...');
    // Mostrar pantalla de carga
    showLoadingScreen();
    
    // Inicializar header después de un delay
    setTimeout(async () => {
        try {
            await window.newHeaderManager.init();
            hideLoadingScreen();
        } catch (error) {
            console.error('Error inicializando header:', error);
            hideLoadingScreen();
        }
    }, 1500);
});

// Pantalla de carga post-login
function showLoadingScreen() {
    // Crear overlay de carga si no existe
    let loadingOverlay = document.getElementById('post-login-loading');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'post-login-loading';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h2>Cargando tu perfil...</h2>
                <p>Configurando tu experiencia personalizada</p>
            </div>
        `;
        
        // Estilos para la pantalla de carga
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--darker), var(--dark));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50000;
            backdrop-filter: blur(10px);
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            #post-login-loading .loading-content {
                text-align: center;
                color: var(--text-light);
            }
            
            #post-login-loading .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(0, 255, 157, 0.3);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            #post-login-loading h2 {
                color: var(--primary);
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            #post-login-loading p {
                color: var(--text-secondary);
                font-size: 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.style.display = 'flex';
    console.log('📱 Mostrando pantalla de carga post-login');
}

function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('post-login-loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        console.log('✅ Ocultando pantalla de carga');
    }
}

// Función para manejar visibilidad durante login
function manageLoginVisibility() {
    const authScreen = document.getElementById('auth-screen');
    const loginOverlay = document.querySelector('.login-overlay');
    const header = document.getElementById('new-app-header');
    
    // Verificar si hay login visible
    const isLoginVisible = (authScreen && getComputedStyle(authScreen).display !== 'none') ||
                          (loginOverlay && getComputedStyle(loginOverlay).display !== 'none');
    
    if (isLoginVisible) {
        // Login visible: solo ocultar el header si existe
        if (header) {
            header.style.display = 'none';
            console.log('🚫 Header oculto durante login');
        }
        
        // Asegurar que el auth-screen tenga prioridad visual
        if (authScreen) {
            authScreen.style.display = 'flex';
            authScreen.style.zIndex = '99999';
        }
        
    } else {
        // Login no visible: el header se mostrará cuando se inicialice después del login
        console.log('✅ Login no visible, permitir inicialización normal');
    }
}

// DESACTIVADO COMPLETAMENTE: CleanHeader está activo
// El NewHeaderManager NO debe ejecutarse
console.log('🚫 NewHeaderManager completamente desactivado - CleanHeader está activo');

// Hacer la clase disponible globalmente
if (typeof window !== 'undefined') {
    window.NewHeaderManager = NewHeaderManager;
    console.log('✅ NewHeaderManager class available globally');
}

console.log('✅ NewHeaderManager cargado y listo');