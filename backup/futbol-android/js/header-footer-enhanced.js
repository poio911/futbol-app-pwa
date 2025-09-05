/**
 * Header y Footer Mejorados con Datos Reales
 * Integración con Firebase y sistema de notificaciones
 */

class HeaderFooterEnhanced {
    constructor() {
        this.currentUser = null;
        this.originalOVR = null;
        this.initialized = false;
    }

    /**
     * Inicializa el header y footer mejorados
     */
    async initialize() {
        console.log('[HeaderFooter] Initializing enhanced header and footer...');
        
        // Obtener usuario actual
        this.currentUser = window.TestApp?.currentUser || window.Storage?.getCurrentPerson();
        
        if (!this.currentUser) {
            console.warn('[HeaderFooter] No user found, using guest mode');
        }
        
        // Renderizar header y footer
        await this.render();
        
        // Inicializar sistema de notificaciones
        if (window.notificationsSystem) {
            await window.notificationsSystem.initialize();
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Actualizar datos del usuario
        if (this.currentUser) {
            await this.updateUserData();
        }
        
        this.initialized = true;
        console.log('[HeaderFooter] Initialized successfully');
    }

    /**
     * Renderiza el header y footer
     */
    async render() {
        // Reemplazar header existente
        const existingHeader = document.querySelector('header');
        if (existingHeader) {
            existingHeader.remove();
        }
        
        // Reemplazar footer existente  
        const existingFooter = document.querySelector('footer');
        if (existingFooter) {
            existingFooter.remove();
        }
        
        // Crear nuevo header
        const header = document.createElement('header');
        header.className = 'header-enhanced';
        header.innerHTML = this.getHeaderHTML();
        document.body.insertBefore(header, document.body.firstChild);
        
        // Crear nuevo footer
        const footer = document.createElement('footer');
        footer.className = 'footer-enhanced';
        footer.innerHTML = this.getFooterHTML();
        document.body.appendChild(footer);
        
        // Asegurar que el body tenga display flex
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.minHeight = '100vh';
    }

    /**
     * Genera HTML del header
     */
    getHeaderHTML() {
        const userName = this.currentUser?.displayName || this.currentUser?.name || 'Invitado';
        const userOVR = this.currentUser?.ovr || 70;
        const userAvatar = this.currentUser?.photo || this.currentUser?.avatar || '👤';
        
        return `
            <div class="header-content">
                <div class="header-main">
                    <!-- Left Section - Notifications -->
                    <div class="header-left">
                        <div class="notifications-bell" onclick="headerFooter.toggleNotifications()">
                            <i class='bx bx-bell bell-icon'></i>
                            <span class="notif-badge" style="display: none;">0</span>
                            
                            <!-- Dropdown -->
                            <div class="notifications-dropdown" id="notifDropdown">
                                <div class="notif-header">
                                    🔔 Notificaciones
                                    <span class="mark-all-read" onclick="notificationsSystem.markAllAsRead()">Marcar todas como leídas</span>
                                </div>
                                <div class="notifications-list">
                                    <div class="no-notifications">No hay notificaciones</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Center Stats -->
                    <div class="header-stats">
                        <div class="stat-item">
                            <span class="stat-value" data-stat="matches-today">0/5</span>
                            <span class="stat-label">Partidos Hoy</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" data-stat="pending-evaluations">0</span>
                            <span class="stat-label">Evaluaciones</span>
                        </div>
                        <div class="streak" style="display: none;">
                            <span class="streak-fire">🔥</span>
                            <span style="font-size: 13px; font-weight: 600;" data-stat="streak">0 días</span>
                        </div>
                    </div>

                    <!-- User Section -->
                    <div class="header-user">
                        <!-- User Profile -->
                        <div class="user-profile" onclick="headerFooter.toggleUserMenu()">
                            <div class="user-avatar">
                                ${userAvatar.startsWith('http') || userAvatar.startsWith('data:') ? 
                                    `<img src="${userAvatar}" alt="${userName}">` : 
                                    userAvatar}
                            </div>
                            <div class="user-info">
                                <span class="user-name">${userName}</span>
                                <div class="user-stats">
                                    <span class="user-ovr">
                                        <span id="user-ovr-value">${userOVR}</span> OVR
                                        <span class="ovr-change" id="ovr-change" style="display: none;"></span>
                                    </span>
                                    <span class="user-position">${this.currentUser?.position || 'Sin posición'}</span>
                                    <span class="user-specialty" id="user-specialty">
                                        ${this.getUserSpecialty()}
                                    </span>
                                </div>
                            </div>
                            <i class='bx bx-chevron-down' style="font-size: 20px;"></i>
                            
                            <!-- User Menu Dropdown -->
                            <div class="user-menu-dropdown" id="userMenuDropdown">
                                <div class="user-menu-item" onclick="headerFooter.showProfile()">
                                    <i class='bx bx-user'></i>
                                    <span>Mi Perfil</span>
                                </div>
                                <div class="user-menu-item" onclick="headerFooter.showStats()">
                                    <i class='bx bx-stats'></i>
                                    <span>Mis Estadísticas</span>
                                </div>
                                <div class="user-menu-item" onclick="headerFooter.showSettings()">
                                    <i class='bx bx-cog'></i>
                                    <span>Configuración</span>
                                </div>
                                <div class="user-menu-divider"></div>
                                <div class="user-menu-item danger" onclick="headerFooter.logout()">
                                    <i class='bx bx-log-out'></i>
                                    <span>Cerrar Sesión</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genera HTML del footer
     */
    getFooterHTML() {
        return `
            <div class="footer-content">
                <div class="footer-main">
                    <!-- Social -->
                    <div class="footer-section">
                        <h4>🌐 Comunidad</h4>
                        <div class="social-links">
                            <a href="https://wa.me/59899123456" target="_blank" class="social-link">
                                <i class='bx bxl-whatsapp'></i>
                            </a>
                            <a href="#" class="social-link">
                                <i class='bx bxl-discord-alt'></i>
                            </a>
                            <a href="#" class="social-link">
                                <i class='bx bxl-instagram'></i>
                            </a>
                        </div>
                        <p style="margin-top: 15px; font-size: 13px; color: var(--text-secondary);">
                            Próximo evento:<br>
                            <strong style="color: var(--primary);">Torneo Mensual - Sábado 15:00</strong>
                        </p>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);">
                            <p style="font-size: 13px; color: var(--text-secondary);">
                                Última actividad:<br>
                                <strong style="color: var(--primary);" id="footer-activity">Cargando actividades...</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div class="footer-bottom">
                    <span>© 2025 Todos los derechos reservados</span>
                    <div class="footer-credits">
                        Diseñada por <strong>Santiago López</strong><br>
                        <a href="mailto:lopeztoma.santiago@gmail.com">lopeztoma.santiago@gmail.com</a>
                    </div>
                </div>
            </div>

            <!-- User Modal -->
            <div class="user-modal-overlay" id="userModalOverlay">
                <div class="user-modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modalTitle">Mi Perfil</h3>
                        <button class="modal-close" onclick="headerFooter.closeUserModal()">&times;</button>
                    </div>
                    <div class="modal-content" id="modalContent">
                        <!-- Content will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (event) => {
            const bell = document.querySelector('.notifications-bell');
            const dropdown = document.getElementById('notifDropdown');
            
            if (bell && dropdown && !bell.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Actualizar stats cada 30 segundos
        setInterval(() => {
            if (window.notificationsSystem) {
                window.notificationsSystem.loadStats();
            }
        }, 30000);
    }

    /**
     * Actualiza datos del usuario
     */
    async updateUserData() {
        if (!this.currentUser || !firebase.firestore) return;
        
        try {
            const db = firebase.firestore();
            const userId = this.currentUser.uid || this.currentUser.id;
            
            // Intentar obtener datos actualizados del usuario
            let userDoc = await db.collection('futbol_users').doc(userId).get();
            
            if (!userDoc.exists && window.Storage?.currentGroupId) {
                // Buscar en jugadores del grupo
                userDoc = await db.collection('groups')
                    .doc(Storage.currentGroupId)
                    .collection('players')
                    .doc(userId)
                    .get();
            }
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const newOVR = userData.ovr || 70;
                
                // Actualizar OVR en UI
                const ovrElement = document.getElementById('user-ovr-value');
                if (ovrElement) {
                    const currentOVR = parseInt(ovrElement.textContent);
                    
                    if (currentOVR !== newOVR) {
                        ovrElement.textContent = newOVR;
                        
                        // Mostrar cambio
                        const changeElement = document.getElementById('ovr-change');
                        if (changeElement) {
                            const diff = newOVR - currentOVR;
                            changeElement.textContent = diff > 0 ? `+${diff}` : diff;
                            changeElement.className = diff > 0 ? 'ovr-change positive' : 'ovr-change negative';
                            changeElement.style.display = 'inline-block';
                            
                            // Ocultar después de 5 segundos
                            setTimeout(() => {
                                changeElement.style.display = 'none';
                            }, 5000);
                        }
                    }
                }
                
                // Actualizar avatar si cambió
                if (userData.photo || userData.avatar) {
                    const avatarElement = document.querySelector('.user-avatar');
                    if (avatarElement) {
                        const newAvatar = userData.photo || userData.avatar;
                        if (newAvatar.startsWith('http') || newAvatar.startsWith('data:')) {
                            avatarElement.innerHTML = `<img src="${newAvatar}" alt="${userData.displayName || userData.name}">`;
                        } else {
                            avatarElement.innerHTML = newAvatar;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[HeaderFooter] Error updating user data:', error);
        }
    }

    /**
     * Toggle notificaciones dropdown
     */
    toggleNotifications() {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    /**
     * Toggle menú de usuario
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    /**
     * Mostrar perfil del usuario
     */
    showProfile() {
        this.toggleUserMenu(); // Cerrar dropdown
        
        if (!this.currentUser) {
            alert('No hay usuario logueado');
            return;
        }

        const user = this.currentUser;
        const attrs = user.attributes || {};
        
        // Atributos EA Sports
        const attributes = [
            { key: 'pac', label: 'Ritmo', value: attrs.pac || 70 },
            { key: 'sho', label: 'Tiro', value: attrs.sho || 70 },
            { key: 'pas', label: 'Pase', value: attrs.pas || 70 },
            { key: 'dri', label: 'Regate', value: attrs.dri || 70 },
            { key: 'def', label: 'Defensa', value: attrs.def || 70 },
            { key: 'phy', label: 'Físico', value: attrs.phy || 70 }
        ];
        
        this.showUserModal('Mi Perfil', `
            <div class="info-section">
                <div class="section-title">
                    Atributos EA Sports
                </div>
                <div class="stats-grid">
                    ${attributes.map(attr => `
                        <div class="stat-card">
                            <span class="stat-value">${attr.value}</span>
                            <div class="stat-label">${attr.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Rendimiento Actual
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${user.ovr || 70}</span>
                        <div class="stat-label">OVR Actual</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${user.matchesPlayed || 0}</span>
                        <div class="stat-label">Partidos</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${user.evaluationsReceived || 0}</span>
                        <div class="stat-label">Evaluaciones</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${user.position || 'Sin posición'}</span>
                        <div class="stat-label">Posición</div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Información Personal
                </div>
                <div class="info-item">
                    <span class="info-label">Nombre</span>
                    <span class="info-value">${user.displayName || user.name || 'Sin nombre'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${user.email || 'No disponible'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Registrado</span>
                    <span class="info-value">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No disponible'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Última actividad</span>
                    <span class="info-value">${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Hoy'}</span>
                </div>
            </div>
        `);
    }

    /**
     * Mostrar estadísticas del usuario
     */
    showStats() {
        this.toggleUserMenu(); // Cerrar dropdown
        
        if (!this.currentUser) {
            alert('No hay usuario logueado');
            return;
        }

        // Calcular estadísticas más avanzadas
        const stats = this.calculateUserStats();
        
        this.showUserModal('Mis Estadísticas', `
            <div class="info-section">
                <div class="section-title">
                    Rendimiento
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${this.currentUser.ovr || 70}</span>
                        <div class="stat-label">OVR Actual</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.maxOVR}</span>
                        <div class="stat-label">OVR Máximo</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.avgOVR}</span>
                        <div class="stat-label">OVR Promedio</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.ovrTrend}</span>
                        <div class="stat-label">Evolución</div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Actividad
                </div>
                <div class="info-item">
                    <span class="info-label">Partidos jugados</span>
                    <span class="info-value">${stats.matchesPlayed}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Evaluaciones enviadas</span>
                    <span class="info-value">${stats.evaluationsSent}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Evaluaciones recibidas</span>
                    <span class="info-value">${stats.evaluationsReceived}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tasa de participación</span>
                    <span class="info-value">${stats.participationRate}%</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Ranking y Rachas
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">#${stats.ranking}</span>
                        <div class="stat-label">Posición Grupo</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.percentile}%</span>
                        <div class="stat-label">Percentil</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.streak}</span>
                        <div class="stat-label">Racha Actual</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${stats.bestStreak}</span>
                        <div class="stat-label">Mejor Racha</div>
                    </div>
                </div>
            </div>
        `);
    }

    /**
     * Calcula estadísticas del usuario
     */
    calculateUserStats() {
        // Por ahora valores simulados, se pueden calcular desde Firebase
        return {
            maxOVR: (this.currentUser.ovr || 70) + Math.floor(Math.random() * 10),
            avgOVR: Math.round(((this.currentUser.ovr || 70) * 0.95) * 10) / 10,
            ovrTrend: Math.random() > 0.5 ? '↗️ Subiendo' : '↘️ Bajando',
            matchesPlayed: Math.floor(Math.random() * 50) + 10,
            evaluationsSent: Math.floor(Math.random() * 100) + 20,
            evaluationsReceived: Math.floor(Math.random() * 80) + 15,
            participationRate: Math.floor(Math.random() * 30) + 70,
            streak: Math.floor(Math.random() * 10) + 1,
            bestStreak: Math.floor(Math.random() * 20) + 5,
            attendanceStreak: Math.floor(Math.random() * 15) + 3,
            ranking: Math.floor(Math.random() * 10) + 1,
            aboveAverage: Math.random() > 0.4,
            percentile: Math.floor(Math.random() * 40) + 60
        };
    }

    /**
     * Mostrar configuración
     */
    showSettings() {
        this.toggleUserMenu(); // Cerrar dropdown
        
        this.showUserModal('Configuración', `
            <div class="info-section">
                <div class="section-title">
                    Notificaciones
                </div>
                <div class="info-item">
                    <span class="info-label">Notificaciones push</span>
                    <span class="info-value" style="color: var(--primary);">✓ Activado</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Sonidos de alerta</span>
                    <span class="info-value" style="color: var(--primary);">✓ Activado</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Notificaciones por email</span>
                    <span class="info-value" style="color: var(--text-secondary);">✗ Desactivado</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Interfaz
                </div>
                <div class="info-item">
                    <span class="info-label">Tema</span>
                    <span class="info-value">Oscuro</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Idioma</span>
                    <span class="info-value">Español</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tamaño de fuente</span>
                    <span class="info-value">Mediano</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    Partidos
                </div>
                <div class="info-item">
                    <span class="info-label">Posición preferida</span>
                    <span class="info-value">Centrocampista</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Disponibilidad automática</span>
                    <span class="info-value" style="color: var(--primary);">✓ Activado</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Recordatorios</span>
                    <span class="info-value">30 min antes</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-title">
                    <span>📊</span> Privacidad y Datos
                </div>
                <div style="padding: 15px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 10px; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                    <strong style="color: #ffc107;">ℹ️ Configuraciones Avanzadas</strong><br>
                    Para modificar estas opciones, contacta al administrador del sistema o accede desde la sección de Jugadores donde puedes actualizar tu perfil y preferencias.
                </div>
            </div>
        `);
    }

    /**
     * Cerrar sesión
     */
    logout() {
        this.toggleUserMenu(); // Cerrar dropdown
        
        this.showUserModal('Cerrar Sesión', `
            <div class="info-section">
                <div style="text-align: center; padding: 20px; font-size: 16px; color: var(--text);">
                    ¿Estás seguro de que quieres cerrar sesión?
                </div>
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                    <button onclick="window.headerFooter.confirmLogout()" 
                            style="background: var(--danger); border: none; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cerrar Sesión
                    </button>
                    <button onclick="window.headerFooter.closeUserModal()" 
                            style="background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cancelar
                    </button>
                </div>
            </div>
        `);
    }
    
    /**
     * Confirmar logout
     */
    confirmLogout() {
        this.closeUserModal();
        if (window.AuthSystem) {
            window.AuthSystem.logout();
        } else {
            console.error('Sistema de autenticación no disponible');
        }
    }

    /**
     * Mostrar modal de usuario
     */
    showUserModal(title, content) {
        const modal = document.getElementById('userModalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.classList.add('active');
            
            // Cerrar al hacer click en el overlay
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeUserModal();
                }
            };
        }
    }

    /**
     * Cerrar modal de usuario
     */
    closeUserModal() {
        const modal = document.getElementById('userModalOverlay');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Obtiene la especialidad del usuario basado en su atributo más alto
     */
    getUserSpecialty() {
        if (!this.currentUser || !this.currentUser.attributes) {
            return 'Jugador';
        }

        const attrs = this.currentUser.attributes;
        const attributes = [
            { key: 'sho', label: 'Tirador', value: attrs.sho || 70 },
            { key: 'pas', label: 'Pasador', value: attrs.pas || 70 },
            { key: 'pac', label: 'Velocista', value: attrs.pac || 70 },
            { key: 'dri', label: 'Regateador', value: attrs.dri || 70 },
            { key: 'def', label: 'Defensor', value: attrs.def || 70 },
            { key: 'phy', label: 'Físico', value: attrs.phy || 70 }
        ];

        // Encontrar el atributo con mayor valor
        const highest = attributes.reduce((max, attr) => 
            attr.value > max.value ? attr : max
        );

        return highest.label;
    }

    /**
     * Actualiza el OVR después de evaluaciones
     */
    async onOVRUpdated(newOVR) {
        const ovrElement = document.getElementById('user-ovr-value');
        if (ovrElement) {
            const currentOVR = parseInt(ovrElement.textContent);
            
            if (currentOVR !== newOVR) {
                ovrElement.textContent = newOVR;
                
                // Mostrar cambio con animación
                const changeElement = document.getElementById('ovr-change');
                if (changeElement) {
                    const diff = newOVR - currentOVR;
                    changeElement.textContent = diff > 0 ? `+${diff}` : diff;
                    changeElement.className = diff > 0 ? 'ovr-change positive' : 'ovr-change negative';
                    changeElement.style.display = 'inline-block';
                    changeElement.style.animation = 'fadeInUp 0.5s ease';
                    
                    // Crear actividad para el ticker
                    if (window.notificationsSystem) {
                        const userName = this.currentUser?.displayName || this.currentUser?.name || 'Usuario';
                        await window.notificationsSystem.createActivity(
                            'ovr_change',
                            `📈 <span>${userName}</span> ${diff > 0 ? 'subió' : 'bajó'} a ${newOVR} OVR`
                        );
                    }
                    
                    // Ocultar después de 5 segundos
                    setTimeout(() => {
                        changeElement.style.display = 'none';
                    }, 5000);
                }
            }
        }
    }
}

// Crear instancia global
const headerFooter = new HeaderFooterEnhanced();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.headerFooter = headerFooter;
    window.HeaderFooterEnhanced = HeaderFooterEnhanced;
}