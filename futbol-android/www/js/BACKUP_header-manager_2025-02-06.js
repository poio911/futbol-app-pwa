/**
 * Header Manager - Sistema mejorado de gestión del header
 * Soluciona problemas de sincronización y datos incorrectos
 */

class HeaderManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.headerElement = null;
        this.updateInterval = null;
    }

    /**
     * Inicializar el header manager
     */
    async init() {
        console.log('🎯 HeaderManager: Inicializando...');
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Suscribirse a cambios de usuario
        this.setupUserListener();
        
        // Actualizar header cada 5 segundos para mantener datos frescos
        this.updateInterval = setInterval(() => {
            this.refreshHeader();
        }, 5000);
        
        this.isInitialized = true;
        console.log('✅ HeaderManager: Inicializado correctamente');
    }
    
    /**
     * Configurar listener para cambios de usuario
     */
    setupUserListener() {
        // Escuchar eventos personalizados de login/logout
        window.addEventListener('userChanged', (event) => {
            console.log('👤 HeaderManager: Usuario cambió', event.detail);
            this.updateUser(event.detail?.user);
        });
        
        // También escuchar storage events para sincronización entre pestañas
        window.addEventListener('storage', (event) => {
            if (event.key === 'current_user_update') {
                this.refreshHeader();
            }
        });
    }
    
    /**
     * Actualizar usuario actual
     */
    updateUser(user) {
        console.log('🔄 HeaderManager: Actualizando usuario', user);
        this.currentUser = user;
        this.renderHeader();
    }
    
    /**
     * Obtener usuario actual de todas las fuentes posibles
     */
    getCurrentUser() {
        // Prioridad de fuentes de datos
        let user = null;
        
        // 1. Primero intentar desde AuthSystem
        if (window.AuthSystem?.currentUser) {
            user = window.AuthSystem.currentUser;
            console.log('👤 Usuario obtenido de AuthSystem:', user.displayName);
        }
        // 2. Luego desde TestApp
        else if (window.TestApp?.currentUser) {
            user = window.TestApp.currentUser;
            console.log('👤 Usuario obtenido de TestApp:', user.displayName || user.name);
        }
        // 3. Luego desde SessionManager
        else if (window.SessionManager) {
            const session = window.SessionManager.getCurrentSession();
            if (session?.user) {
                user = session.user;
                console.log('👤 Usuario obtenido de SessionManager:', user.displayName);
            }
        }
        // 4. Finalmente desde Storage
        else if (window.Storage?.getCurrentPerson) {
            user = window.Storage.getCurrentPerson();
            if (user) {
                console.log('👤 Usuario obtenido de Storage:', user.name);
            }
        }
        
        return user;
    }
    
    /**
     * Refrescar header con datos actuales
     */
    refreshHeader() {
        const newUser = this.getCurrentUser();
        
        // Solo actualizar si el usuario cambió
        if (JSON.stringify(newUser) !== JSON.stringify(this.currentUser)) {
            console.log('🔄 HeaderManager: Detectado cambio de usuario, actualizando header');
            this.updateUser(newUser);
        }
        
        // También actualizar estadísticas dinámicas
        this.updateDynamicStats();
    }
    
    /**
     * Renderizar el header completo
     */
    renderHeader() {
        // Usar el header existente en lugar de crear uno nuevo
        const existingHeader = document.getElementById('app-header');
        if (!existingHeader) {
            console.warn('⚠️ HeaderManager: No se encontró el header existente #app-header');
            return;
        }
        
        // Si no hay usuario, no actualizar header
        if (!this.currentUser) {
            console.log('⚠️ HeaderManager: No hay usuario, no actualizando header');
            return;
        }
        
        // Preparar datos del usuario con validaciones
        const userData = this.prepareUserData();
        
        // Actualizar elementos existentes del header
        this.updateExistingHeader(userData);
        
        // Agregar funcionalidad de dropdown al header existente
        this.enhanceExistingHeader();
        
        console.log('✅ HeaderManager: Header existente actualizado con datos:', userData);
    }
    
    /**
     * Preparar datos del usuario con validaciones y valores por defecto
     */
    prepareUserData() {
        const user = this.currentUser || {};
        
        // Nombre - múltiples fuentes posibles
        const name = user.displayName || 
                    user.name || 
                    user.email?.split('@')[0] || 
                    'Usuario';
        
        // Posición - con validación
        const validPositions = ['DEL', 'MED', 'DEF', 'POR'];
        let position = user.position || user.preferredPosition || '';
        if (!validPositions.includes(position)) {
            position = 'MED'; // Por defecto
        }
        
        // OVR - con validación de rango
        let ovr = parseInt(user.ovr) || parseInt(user.overallRating) || 50;
        ovr = Math.max(1, Math.min(99, ovr)); // Entre 1 y 99
        
        // Foto - manejo mejorado
        let photo = user.photo || user.avatar || user.profileImage || '👤';
        
        // Si la foto es base64 corrupta o muy corta, usar avatar por defecto
        if (photo.startsWith('data:') && photo.length < 100) {
            photo = '👤';
        }
        
        // Atributos - con valores por defecto
        const attributes = user.attributes || {};
        const defaultAttributes = {
            pac: 50, sho: 50, pas: 50,
            dri: 50, def: 50, phy: 50
        };
        
        // Merge con valores por defecto
        const finalAttributes = { ...defaultAttributes };
        for (const key in attributes) {
            const value = parseInt(attributes[key]);
            if (!isNaN(value) && value >= 1 && value <= 99) {
                finalAttributes[key] = value;
            }
        }
        
        // Stats adicionales
        const stats = {
            matchesPlayed: user.matchesPlayed || user.totalMatches || 0,
            matchesWon: user.matchesWon || 0,
            evaluationsPending: user.pendingEvaluations || 0,
            streak: user.streak || 0
        };
        
        // Calcular especialidad basada en atributos
        const specialty = this.calculateSpecialty(finalAttributes, position);
        
        // Calcular color de posición
        const positionColor = this.getPositionColor(position);
        
        return {
            name,
            position,
            ovr,
            photo,
            attributes: finalAttributes,
            stats,
            specialty,
            positionColor,
            email: user.email || '',
            uid: user.uid || user.id || '',
            isAuthenticated: !!user.uid
        };
    }
    
    /**
     * Calcular especialidad del jugador
     */
    calculateSpecialty(attributes, position) {
        const specialties = {
            pac: '⚡ Velocista',
            sho: '🎯 Goleador',
            pas: '🎨 Creativo',
            dri: '🌟 Regateador',
            def: '🛡️ Defensor',
            phy: '💪 Físico'
        };
        
        // Encontrar el atributo más alto
        let maxAttr = 'pac';
        let maxValue = 0;
        
        for (const [key, value] of Object.entries(attributes)) {
            if (value > maxValue) {
                maxValue = value;
                maxAttr = key;
            }
        }
        
        // Ajustar por posición
        if (position === 'DEL' && attributes.sho > attributes[maxAttr] - 5) {
            return '🎯 Goleador';
        }
        if (position === 'DEF' && attributes.def > attributes[maxAttr] - 5) {
            return '🛡️ Defensor';
        }
        if (position === 'POR') {
            return '🧤 Guardameta';
        }
        
        return specialties[maxAttr] || '⚽ Jugador';
    }
    
    /**
     * Obtener color de posición
     */
    getPositionColor(position) {
        const colors = {
            'DEL': '#ff4757', // Rojo
            'MED': '#32ff7e', // Verde
            'DEF': '#3742fa', // Azul
            'POR': '#ffa502'  // Naranja
        };
        return colors[position] || '#718093';
    }
    
    /**
     * Actualizar elementos existentes del header
     */
    updateExistingHeader(userData) {
        // Actualizar avatar de usuario
        const userAvatar = document.getElementById('user-avatar-letter');
        if (userAvatar) {
            if (userData.photo !== '👤' && (userData.photo.startsWith('http') || userData.photo.startsWith('data:'))) {
                userAvatar.innerHTML = `<img src="${userData.photo}" alt="${userData.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.innerHTML='${userData.name.charAt(0).toUpperCase()}'">`;
            } else {
                userAvatar.textContent = userData.name.charAt(0).toUpperCase();
            }
        }
        
        // Actualizar nombre de usuario
        const currentUserElement = document.getElementById('current-user-new');
        if (currentUserElement) {
            currentUserElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span>${userData.name}</span>
                    <span style="background: ${userData.positionColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${userData.position}
                    </span>
                    <span style="font-weight: 600; color: #ffd700;">${userData.ovr} OVR</span>
                </div>
            `;
        }
        
        // También actualizar el elemento legacy por si existe
        const legacyUserElement = document.getElementById('current-user');
        if (legacyUserElement) {
            legacyUserElement.textContent = userData.name;
        }
    }
    
    /**
     * Mejorar header existente con dropdown de perfil
     */
    enhanceExistingHeader() {
        const userProfile = document.querySelector('.user-profile');
        if (!userProfile) return;
        
        // Agregar dropdown si no existe
        let dropdown = userProfile.querySelector('.profile-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'profile-dropdown';
            dropdown.id = 'profile-dropdown';
            dropdown.innerHTML = `
                <div class="profile-dropdown-item" onclick="headerManager.viewProfile()">
                    <i class='bx bx-user'></i> Mi Perfil
                </div>
                <div class="profile-dropdown-item" onclick="headerManager.viewStats()">
                    <i class='bx bx-stats'></i> Estadísticas
                </div>
                <div class="profile-dropdown-divider"></div>
                <div class="profile-dropdown-item profile-logout" onclick="headerManager.logout()">
                    <i class='bx bx-log-out'></i> Cerrar Sesión
                </div>
            `;
            userProfile.appendChild(dropdown);
        }
        
        // Hacer el perfil clickeable
        userProfile.style.cursor = 'pointer';
        userProfile.style.position = 'relative';
        
        // Agregar event listener para toggle
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleProfileDropdown();
        });
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile')) {
                this.closeProfileDropdown();
            }
        });
        
        // Agregar estilos para el dropdown
        this.injectDropdownStyles();
    }
    
    /**
     * Toggle dropdown de perfil
     */
    toggleProfileDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }
    
    /**
     * Cerrar dropdown de perfil
     */
    closeProfileDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
    
    /**
     * Generar HTML del header (método legacy mantenido por compatibilidad)
     */
    generateHeaderHTML(userData) {
        return `
            <div class="header-manager" id="header-manager">
                <div class="hm-container">
                    <!-- Logo/Brand -->
                    <div class="hm-brand">
                        <span class="hm-logo">⚽</span>
                        <span class="hm-title">Fútbol Manager</span>
                    </div>
                    
                    <!-- Stats Center -->
                    <div class="hm-stats">
                        <div class="hm-stat">
                            <span class="hm-stat-value">${userData.stats.matchesPlayed}</span>
                            <span class="hm-stat-label">Partidos</span>
                        </div>
                        <div class="hm-stat">
                            <span class="hm-stat-value">${userData.stats.evaluationsPending}</span>
                            <span class="hm-stat-label">Evaluaciones</span>
                        </div>
                        ${userData.stats.streak > 0 ? `
                        <div class="hm-stat">
                            <span class="hm-stat-value">🔥 ${userData.stats.streak}</span>
                            <span class="hm-stat-label">Racha</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- User Profile -->
                    <div class="hm-user" onclick="headerManager.toggleUserMenu()">
                        <div class="hm-user-avatar">
                            ${userData.photo === '👤' ? 
                                `<div class="hm-avatar-placeholder">${userData.name.charAt(0).toUpperCase()}</div>` :
                                userData.photo.startsWith('http') || userData.photo.startsWith('data:') ?
                                    `<img src="${userData.photo}" alt="${userData.name}" onerror="this.parentElement.innerHTML='<div class=\\'hm-avatar-placeholder\\'>${userData.name.charAt(0).toUpperCase()}</div>'">` :
                                    `<div class="hm-avatar-emoji">${userData.photo}</div>`
                            }
                        </div>
                        <div class="hm-user-info">
                            <div class="hm-user-name">${userData.name}</div>
                            <div class="hm-user-details">
                                <span class="hm-user-position" style="background: ${userData.positionColor}">
                                    ${userData.position}
                                </span>
                                <span class="hm-user-ovr">${userData.ovr} OVR</span>
                                <span class="hm-user-specialty">${userData.specialty}</span>
                            </div>
                        </div>
                        <i class='bx bx-chevron-down hm-dropdown-icon'></i>
                        
                        <!-- Dropdown Menu -->
                        <div class="hm-dropdown" id="hm-user-dropdown">
                            <div class="hm-dropdown-item" onclick="headerManager.viewProfile()">
                                <i class='bx bx-user'></i> Mi Perfil
                            </div>
                            <div class="hm-dropdown-item" onclick="headerManager.viewStats()">
                                <i class='bx bx-stats'></i> Estadísticas
                            </div>
                            <div class="hm-dropdown-divider"></div>
                            <div class="hm-dropdown-item hm-logout" onclick="headerManager.logout()">
                                <i class='bx bx-log-out'></i> Cerrar Sesión
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Inyectar estilos para dropdown del header existente
     */
    injectDropdownStyles() {
        if (document.getElementById('header-dropdown-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'header-dropdown-styles';
        styles.innerHTML = `
            .profile-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: white;
                color: #333;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 200px;
                display: none;
                overflow: hidden;
                z-index: 999999;
                animation: slideDown 0.3s ease;
            }
            
            .profile-dropdown.active {
                display: block;
            }
            
            .profile-dropdown-item {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: background 0.2s ease;
                font-size: 14px;
            }
            
            .profile-dropdown-item:hover {
                background: #f5f5f5;
            }
            
            .profile-dropdown-item i {
                font-size: 16px;
                width: 16px;
                text-align: center;
            }
            
            .profile-dropdown-divider {
                height: 1px;
                background: #e0e0e0;
                margin: 5px 0;
            }
            
            .profile-logout {
                color: #e74c3c;
            }
            
            .profile-logout:hover {
                background: #fee;
            }
            
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
        `;
        document.head.appendChild(styles);
    }
    
    /**
     * Inyectar estilos CSS (método legacy mantenido por compatibilidad)
     */
    injectStyles() {
        if (document.getElementById('header-manager-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'header-manager-styles';
        styles.innerHTML = `
            .header-manager {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 999999;
                font-family: 'Poppins', sans-serif;
            }
            
            /* Agregar padding-top al body para compensar el header fijo */
            body.header-manager-active {
                padding-top: 80px !important;
            }
            
            .hm-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1400px;
                margin: 0 auto;
                gap: 20px;
            }
            
            .hm-brand {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 18px;
            }
            
            .hm-logo {
                font-size: 24px;
            }
            
            .hm-stats {
                display: flex;
                gap: 30px;
                flex: 1;
                justify-content: center;
            }
            
            .hm-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .hm-stat-value {
                font-size: 20px;
                font-weight: 600;
            }
            
            .hm-stat-label {
                font-size: 12px;
                opacity: 0.9;
            }
            
            .hm-user {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255,255,255,0.1);
                padding: 8px 12px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .hm-user:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .hm-user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                overflow: hidden;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .hm-user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .hm-avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                font-weight: 600;
                font-size: 18px;
            }
            
            .hm-avatar-emoji {
                font-size: 24px;
            }
            
            .hm-user-info {
                display: flex;
                flex-direction: column;
            }
            
            .hm-user-name {
                font-weight: 600;
                font-size: 14px;
            }
            
            .hm-user-details {
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: 12px;
            }
            
            .hm-user-position {
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                color: white;
            }
            
            .hm-user-ovr {
                font-weight: 600;
            }
            
            .hm-user-specialty {
                opacity: 0.9;
            }
            
            .hm-dropdown-icon {
                font-size: 20px;
                transition: transform 0.3s ease;
            }
            
            .hm-user.active .hm-dropdown-icon {
                transform: rotate(180deg);
            }
            
            .hm-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: white;
                color: #333;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 200px;
                display: none;
                overflow: hidden;
                animation: slideDown 0.3s ease;
            }
            
            .hm-user.active .hm-dropdown {
                display: block;
            }
            
            .hm-dropdown-item {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .hm-dropdown-item:hover {
                background: #f5f5f5;
            }
            
            .hm-dropdown-item i {
                font-size: 18px;
            }
            
            .hm-dropdown-divider {
                height: 1px;
                background: #e0e0e0;
                margin: 5px 0;
            }
            
            .hm-logout {
                color: #e74c3c;
            }
            
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
            
            @media (max-width: 768px) {
                .hm-container {
                    flex-wrap: wrap;
                }
                
                .hm-stats {
                    order: 3;
                    width: 100%;
                    margin-top: 10px;
                }
                
                .hm-brand {
                    flex: 1;
                }
                
                .hm-user-specialty {
                    display: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Click fuera del dropdown para cerrarlo
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hm-user')) {
                const userElement = document.querySelector('.hm-user');
                if (userElement) {
                    userElement.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Toggle menú de usuario
     */
    toggleUserMenu() {
        const userElement = document.querySelector('.hm-user');
        if (userElement) {
            userElement.classList.toggle('active');
        }
        event.stopPropagation();
    }
    
    /**
     * Ver perfil
     */
    viewProfile() {
        event.stopPropagation();
        this.toggleUserMenu();
        
        if (window.TestApp?.navigateToScreen) {
            window.TestApp.navigateToScreen('profile');
        } else {
            console.log('📋 Mostrando perfil del usuario');
        }
    }
    
    /**
     * Ver estadísticas
     */
    viewStats() {
        event.stopPropagation();
        this.toggleUserMenu();
        
        if (window.TestApp?.navigateToScreen) {
            window.TestApp.navigateToScreen('dashboard');
        } else {
            console.log('📊 Mostrando estadísticas');
        }
    }
    
    /**
     * Cerrar sesión
     */
    logout() {
        event.stopPropagation();
        this.toggleUserMenu();
        
        if (window.LogoutHandler?.handleLogout) {
            window.LogoutHandler.handleLogout();
        } else if (window.AuthSystem?.logout) {
            window.AuthSystem.logout();
        } else {
            console.log('🚪 Cerrando sesión...');
        }
    }
    
    /**
     * Actualizar estadísticas dinámicas
     */
    async updateDynamicStats() {
        // Actualizar contador de evaluaciones pendientes
        const pendingElement = document.querySelector('.hm-stat-value');
        if (pendingElement && window.db) {
            try {
                // Aquí se podría hacer una consulta real a Firebase
                // Por ahora solo actualizamos si hay datos nuevos
            } catch (error) {
                console.error('Error actualizando stats:', error);
            }
        }
    }
    
    /**
     * Destruir el header manager
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Limpiar header container creado (si existe)
        const headerContainer = document.getElementById('app-header-container');
        if (headerContainer) {
            headerContainer.remove();
        }
        
        // Limpiar dropdown del header existente
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
        
        // Remover estilos
        const dropdownStyles = document.getElementById('header-dropdown-styles');
        if (dropdownStyles) {
            dropdownStyles.remove();
        }
        
        this.isInitialized = false;
    }
}

// Crear instancia global
window.headerManager = new HeaderManager();

// Función helper para disparar evento de cambio de usuario
window.notifyUserChange = function(user) {
    window.dispatchEvent(new CustomEvent('userChanged', { 
        detail: { user } 
    }));
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.headerManager.init();
    });
} else {
    window.headerManager.init();
}

console.log('✅ HeaderManager cargado y listo para usar');