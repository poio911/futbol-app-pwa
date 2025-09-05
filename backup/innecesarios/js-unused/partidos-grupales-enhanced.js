/**
 * PARTIDOS GRUPALES - SISTEMA MEJORADO
 * Incluye invitación de jugadores no registrados y UI mejorada
 */

class PartidosGrupalesEnhanced {
    constructor() {
        this.guestPlayers = new Map(); // Almacena jugadores invitados temporalmente
        this.initialized = false;
    }

    /**
     * Inicializa el sistema mejorado
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎮 Inicializando sistema mejorado de Partidos Grupales...');
        
        // Agregar estilos mejorados
        this.injectStyles();
        
        // Mejorar el renderizado de partidos
        this.enhanceMatchRendering();
        
        // Agregar funcionalidad de invitados
        this.setupGuestSystem();
        
        this.initialized = true;
        console.log('✅ Sistema de Partidos Grupales mejorado inicializado');
    }

    /**
     * Inyecta los estilos mejorados
     */
    injectStyles() {
        if (document.getElementById('partidos-grupales-enhanced-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'partidos-grupales-enhanced-styles';
        link.rel = 'stylesheet';
        link.href = 'css/partidos-grupales-enhanced.css';
        document.head.appendChild(link);
    }

    /**
     * Mejora el renderizado de partidos
     */
    enhanceMatchRendering() {
        // Override del método renderAllMatches original
        if (window.collaborativeSystem) {
            const originalRender = window.collaborativeSystem.renderAllMatches.bind(window.collaborativeSystem);
            
            window.collaborativeSystem.renderAllMatches = function() {
                const container = document.getElementById('all-matches');
                if (!container) return;
                
                // Agregar header mejorado si no existe
                if (!document.querySelector('.collaborative-header')) {
                    const headerHTML = `
                        <div class="collaborative-header">
                            <div class="collaborative-title">
                                <i class='bx bx-football icon'></i>
                                <h2>Partidos Grupales</h2>
                            </div>
                            <button class="btn-create-match" onclick="collaborativeSystem.showCreateMatchModal()">
                                <i class='bx bx-plus-circle'></i>
                                Crear Partido Grupal
                            </button>
                        </div>
                    `;
                    container.parentElement.insertAdjacentHTML('afterbegin', headerHTML);
                }
                
                const allMatches = this.getAllMatches();
                
                if (allMatches.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class='bx bx-calendar-x empty-icon'></i>
                            <h3 class="empty-title">No hay partidos disponibles</h3>
                            <p class="empty-text">¡Sé el primero en crear uno!</p>
                        </div>
                    `;
                    return;
                }
                
                // Ordenar por fecha
                const sortedMatches = allMatches.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA - dateB;
                });
                
                container.innerHTML = sortedMatches.map(match => 
                    window.partidosGrupales.renderEnhancedMatchCard(match, this)
                ).join('');
            };
        }
    }

    /**
     * Renderiza un card de partido mejorado
     */
    renderEnhancedMatchCard(match, system) {
        const currentUser = system.state.currentUser;
        const isOrganizer = system.isCurrentUserOrganizer(match);
        const isRegistered = system.isCurrentUserRegistered(match);
        
        // Calcular progreso de jugadores
        const progress = (match.registeredPlayers.length / (match.maxPlayers || 10)) * 100;
        
        // Formatear fecha
        const matchDate = new Date(`${match.date}T${match.time}`);
        const dateStr = matchDate.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
        const timeStr = matchDate.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Estado del partido
        const statusClass = match.status === 'open' ? 'open' : 
                           match.status === 'full' ? 'full' : 'closed';
        const statusText = match.status === 'open' ? 'Abierto' : 
                          match.status === 'full' ? 'Completo' : 'Cerrado';
        
        // Contar invitados
        const guestCount = match.guestPlayers ? match.guestPlayers.length : 0;
        
        // Generar botones
        let buttons = '';
        
        if (!isRegistered && system.canUserJoinMatch(match)) {
            buttons += `<button class="btn-match-action btn-join" onclick="collaborativeSystem.joinMatch('${match.id}')">
                <i class='bx bx-run'></i> Anotarse
            </button>`;
        } else if (isRegistered && match.status !== 'closed') {
            buttons += `<button class="btn-match-action btn-leave" onclick="collaborativeSystem.leaveMatch('${match.id}')">
                <i class='bx bx-exit'></i> Salir
            </button>`;
        }
        
        if (isOrganizer && match.status === 'open') {
            buttons += `<button class="btn-match-action btn-invite" onclick="partidosGrupales.showInviteModal('${match.id}')">
                <i class='bx bx-user-plus'></i> Invitar
            </button>`;
        }
        
        if (match.status === 'full' || match.teams) {
            buttons += `<button class="btn-match-action btn-view-teams" onclick="collaborativeSystem.showTeamsModal('${match.id}')">
                <i class='bx bx-group'></i> Ver Equipos
            </button>`;
        }
        
        return `
            <div class="match-card">
                <div class="match-card-header">
                    <div>
                        <h3 class="match-title">${match.title}</h3>
                        ${isOrganizer ? '<span style="color: var(--pg-info); font-size: 12px;">👑 Organizador</span>' : ''}
                    </div>
                    <span class="match-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="match-info">
                    <div class="match-info-item">
                        <i class='bx bx-calendar'></i>
                        <span>${dateStr} - ${timeStr}</span>
                    </div>
                    <div class="match-info-item">
                        <i class='bx bx-map'></i>
                        <span>${match.location}</span>
                    </div>
                    <div class="match-info-item">
                        <i class='bx bx-football'></i>
                        <span>Formato: ${match.format || '5v5'}</span>
                    </div>
                    ${guestCount > 0 ? `
                        <div class="match-info-item">
                            <i class='bx bx-user-check'></i>
                            <span>${guestCount} invitado${guestCount > 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="match-players">
                    <div class="players-count">
                        <span>👥 Jugadores</span>
                        <span>${match.registeredPlayers.length}/${match.maxPlayers || 10}</span>
                    </div>
                    <div class="players-bar">
                        <div class="players-progress" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                ${match.description ? `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; margin-bottom: 15px;">
                        <p style="color: var(--pg-text-secondary); margin: 0; font-size: 14px;">
                            ${match.description}
                        </p>
                    </div>
                ` : ''}
                
                ${buttons ? `
                    <div class="match-actions">
                        ${buttons}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Configura el sistema de jugadores invitados
     */
    setupGuestSystem() {
        // Agregar funcionalidad al crear partido
        if (window.collaborativeSystem) {
            const originalCreate = window.collaborativeSystem.handleCreateMatch.bind(window.collaborativeSystem);
            
            window.collaborativeSystem.handleCreateMatch = async function(event) {
                // Llamar al método original
                await originalCreate(event);
                
                // Agregar sección de invitados al modal si no existe
                window.partidosGrupales.enhanceCreateModal();
            };
        }
    }

    /**
     * Mejora el modal de creación con sistema de invitados
     */
    enhanceCreateModal() {
        const modalContent = document.querySelector('#create-match-modal .modal-content');
        if (!modalContent || document.getElementById('invite-section')) return;
        
        // Agregar sección de invitados antes del botón de crear
        const submitButton = modalContent.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        const inviteHTML = `
            <div class="invite-section" id="invite-section">
                <div class="invite-title">
                    <i class='bx bx-user-plus'></i>
                    Invitar Jugadores No Registrados
                </div>
                <p style="color: var(--pg-text-secondary); font-size: 14px; margin-bottom: 15px;">
                    Puedes invitar jugadores que no tienen cuenta. Se les asignará un OVR temporal.
                </p>
                <div class="invite-input-group">
                    <input type="text" id="guest-name" class="form-input" placeholder="Nombre del invitado" style="flex: 1;">
                    <select id="guest-position" class="form-select" style="width: 120px;">
                        <option value="DEL">Delantero</option>
                        <option value="MED">Mediocampista</option>
                        <option value="DEF">Defensor</option>
                        <option value="POR">Portero</option>
                    </select>
                    <input type="number" id="guest-ovr" class="form-input" placeholder="OVR" min="40" max="99" value="70" style="width: 80px;">
                    <button type="button" class="btn-add-guest" onclick="partidosGrupales.addGuestPlayer()">
                        <i class='bx bx-plus'></i> Agregar
                    </button>
                </div>
                <div class="guest-list" id="guest-list">
                    <!-- Los invitados aparecerán aquí -->
                </div>
            </div>
        `;
        
        submitButton.parentElement.insertAdjacentHTML('beforebegin', inviteHTML);
    }

    /**
     * Muestra el modal de invitación para un partido existente
     */
    async showInviteModal(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) {
            alert('❌ No se encontró el partido');
            return;
        }
        
        const modalHTML = `
            <div class="modal-overlay" id="invite-modal-overlay" onclick="if(event.target === this) partidosGrupales.closeInviteModal()">
                <div class="modal-create-match">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class='bx bx-user-plus'></i> Invitar Jugadores
                        </h3>
                        <button class="modal-close" onclick="partidosGrupales.closeInviteModal()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <p style="color: var(--pg-text-secondary); margin-bottom: 20px;">
                            Partido: <strong>${match.title}</strong><br>
                            Espacios disponibles: <strong>${(match.maxPlayers || 10) - match.registeredPlayers.length}</strong>
                        </p>
                        
                        <div class="invite-section">
                            <h4 style="color: var(--pg-primary); margin-bottom: 15px;">
                                Agregar Jugador No Registrado
                            </h4>
                            <div class="invite-input-group">
                                <input type="text" id="modal-guest-name" class="form-input" placeholder="Nombre" style="flex: 1;">
                                <select id="modal-guest-position" class="form-select" style="width: 120px;">
                                    <option value="DEL">DEL</option>
                                    <option value="MED">MED</option>
                                    <option value="DEF">DEF</option>
                                    <option value="POR">POR</option>
                                </select>
                                <input type="number" id="modal-guest-ovr" class="form-input" placeholder="OVR" min="40" max="99" value="70" style="width: 80px;">
                            </div>
                            <button class="btn-add-guest" style="width: 100%; margin-top: 15px;" onclick="partidosGrupales.addGuestToMatch('${matchId}')">
                                <i class='bx bx-plus-circle'></i> Agregar Invitado
                            </button>
                        </div>
                        
                        <div style="margin-top: 25px;">
                            <h4 style="color: var(--pg-primary); margin-bottom: 15px;">
                                Jugadores Invitados (${match.guestPlayers ? match.guestPlayers.length : 0})
                            </h4>
                            <div class="guest-list" id="match-guest-list">
                                ${this.renderGuestList(match.guestPlayers || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Cierra el modal de invitación
     */
    closeInviteModal() {
        const modal = document.getElementById('invite-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Agrega un jugador invitado al crear partido
     */
    addGuestPlayer() {
        const nameInput = document.getElementById('guest-name');
        const positionInput = document.getElementById('guest-position');
        const ovrInput = document.getElementById('guest-ovr');
        
        if (!nameInput || !nameInput.value.trim()) {
            alert('Por favor ingresa el nombre del invitado');
            return;
        }
        
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guest = {
            id: guestId,
            name: nameInput.value.trim() + ' (Invitado)',
            position: positionInput.value,
            ovr: parseInt(ovrInput.value) || 70,
            isGuest: true
        };
        
        this.guestPlayers.set(guestId, guest);
        this.updateGuestListDisplay();
        
        // Limpiar campos
        nameInput.value = '';
        ovrInput.value = '70';
    }

    /**
     * Agrega un invitado a un partido existente
     */
    async addGuestToMatch(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) return;
        
        const nameInput = document.getElementById('modal-guest-name');
        const positionInput = document.getElementById('modal-guest-position');
        const ovrInput = document.getElementById('modal-guest-ovr');
        
        if (!nameInput || !nameInput.value.trim()) {
            alert('Por favor ingresa el nombre del invitado');
            return;
        }
        
        // Verificar espacio disponible
        const totalPlayers = match.registeredPlayers.length + (match.guestPlayers?.length || 0);
        if (totalPlayers >= (match.maxTotal || 14)) {
            alert('❌ No hay más espacio disponible en el partido');
            return;
        }
        
        const guest = {
            id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: nameInput.value.trim() + ' (Invitado)',
            position: positionInput.value,
            ovr: parseInt(ovrInput.value) || 70,
            isGuest: true,
            invitedBy: window.collaborativeSystem.state.currentUser.uid,
            invitedAt: new Date().toISOString()
        };
        
        // Agregar al partido
        if (!match.guestPlayers) {
            match.guestPlayers = [];
        }
        match.guestPlayers.push(guest);
        
        // Guardar en Firebase
        try {
            await window.collaborativeSystem.saveMatchToFirebase(match);
            
            // Actualizar display
            document.getElementById('match-guest-list').innerHTML = this.renderGuestList(match.guestPlayers);
            
            // Limpiar campos
            nameInput.value = '';
            ovrInput.value = '70';
            
            // Refrescar vista principal
            window.collaborativeSystem.renderUI();
            
            console.log('✅ Invitado agregado:', guest.name);
        } catch (error) {
            console.error('Error al agregar invitado:', error);
            alert('❌ Error al agregar el invitado');
        }
    }

    /**
     * Actualiza la lista de invitados en el modal de crear
     */
    updateGuestListDisplay() {
        const listContainer = document.getElementById('guest-list');
        if (!listContainer) return;
        
        const guests = Array.from(this.guestPlayers.values());
        listContainer.innerHTML = this.renderGuestList(guests);
    }

    /**
     * Renderiza la lista de invitados
     */
    renderGuestList(guests) {
        if (!guests || guests.length === 0) {
            return '<p style="color: var(--pg-text-secondary); text-align: center;">No hay invitados aún</p>';
        }
        
        return guests.map(guest => `
            <div class="guest-item">
                <div class="guest-info">
                    <i class='bx bx-user' style="color: var(--pg-primary);"></i>
                    <span>${guest.name}</span>
                    <span class="guest-badge">${guest.position}</span>
                    <span class="guest-badge">${guest.ovr} OVR</span>
                </div>
                <button class="btn-remove-guest" onclick="partidosGrupales.removeGuest('${guest.id}')">
                    <i class='bx bx-x'></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Remueve un invitado
     */
    removeGuest(guestId) {
        this.guestPlayers.delete(guestId);
        this.updateGuestListDisplay();
    }
}

// Inicializar el sistema mejorado
window.partidosGrupales = new PartidosGrupalesEnhanced();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.partidosGrupales.initialize();
    });
} else {
    window.partidosGrupales.initialize();
}