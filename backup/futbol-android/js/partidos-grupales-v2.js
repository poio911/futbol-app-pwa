/**
 * PARTIDOS GRUPALES V2 - Sistema completo con invitaciones y gestión
 */

class PartidosGrupalesV2 {
    constructor() {
        this.selectedPlayersToInvite = new Set();
        this.initialized = false;
    }

    /**
     * Inicializa el sistema
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎮 Inicializando Partidos Grupales V2...');
        
        // Mejorar el renderizado
        this.enhanceMatchRendering();
        
        this.initialized = true;
        console.log('✅ Partidos Grupales V2 inicializado');
    }

    /**
     * Mejora el renderizado de partidos
     */
    enhanceMatchRendering() {
        if (!window.collaborativeSystem) return;
        
        const originalRender = window.collaborativeSystem.renderAllMatches.bind(window.collaborativeSystem);
        
        window.collaborativeSystem.renderAllMatches = function() {
            const container = document.getElementById('all-matches');
            if (!container) return originalRender();
            
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
                window.partidosGrupalesV2.renderEnhancedMatchCard(match, this)
            ).join('');
        };
    }

    /**
     * Renderiza un card de partido mejorado
     */
    renderEnhancedMatchCard(match, system) {
        const currentUser = system.state.currentUser;
        const isOrganizer = system.isCurrentUserOrganizer(match);
        const isRegistered = system.isCurrentUserRegistered(match);
        
        // Calcular totales
        const registeredCount = match.registeredPlayers?.length || 0;
        const guestCount = match.guestPlayers?.length || 0;
        const totalPlayers = registeredCount + guestCount;
        const maxPlayers = match.maxPlayers || 10;
        const progress = (totalPlayers / maxPlayers) * 100;
        
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
        
        // Generar lista de jugadores con íconos
        let playersList = '';
        if (totalPlayers > 0) {
            const allPlayers = [
                ...(match.registeredPlayers || []).map(p => ({...p, type: 'registered'})),
                ...(match.guestPlayers || []).map(p => ({...p, type: 'guest'}))
            ];
            
            playersList = `
                <div class="players-list-preview" style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                    <div style="font-size: 12px; color: var(--pg-text-secondary); margin-bottom: 8px;">
                        Jugadores anotados (${totalPlayers}/${maxPlayers}):
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${allPlayers.slice(0, 5).map(player => 
                            '<span style="' +
                                'padding: 3px 8px;' +
                                'background: ' + (player.type === 'guest' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(0, 255, 157, 0.2)') + ';' +
                                'border: 1px solid ' + (player.type === 'guest' ? 'var(--pg-warning)' : 'var(--pg-primary)') + ';' +
                                'border-radius: 15px;' +
                                'font-size: 12px;' +
                                'color: var(--pg-text);' +
                                'display: flex;' +
                                'align-items: center;' +
                                'gap: 4px;' +
                            '">' +
                                (player.type === 'guest' ? '👤' : '✓') + ' ' +
                                (player.displayName || player.name || 'Jugador') +
                            '</span>'
                        ).join('')}
                        ${totalPlayers > 5 ? 
                            '<span style="' +
                                'padding: 3px 8px;' +
                                'background: rgba(255, 255, 255, 0.1);' +
                                'border-radius: 15px;' +
                                'font-size: 12px;' +
                                'color: var(--pg-text-secondary);' +
                            '">' +
                                '+' + (totalPlayers - 5) + ' más' +
                            '</span>'
                        : ''}
                    </div>
                </div>
            `;
        }
        
        // Generar botones según contexto
        let buttons = '';
        
        // Botón Unirse/Desanotarse (para todos los usuarios)
        if (!isOrganizer) {
            if (!isRegistered && match.status === 'open' && totalPlayers < maxPlayers) {
                buttons += `<button class="btn-match-action btn-join" onclick="partidosGrupalesV2.joinMatch('${match.id}')">
                    <i class='bx bx-user-plus'></i> Unirse
                </button>`;
            } else if (isRegistered && match.status !== 'closed') {
                buttons += `<button class="btn-match-action btn-leave" onclick="partidosGrupalesV2.leaveMatch('${match.id}')">
                    <i class='bx bx-user-minus'></i> Desanotarse
                </button>`;
            }
        }
        
        // Botones para el organizador
        if (isOrganizer) {
            buttons += `<button class="btn-match-action btn-invite" onclick="partidosGrupalesV2.showInviteModal('${match.id}')">
                <i class='bx bx-user-plus'></i> Invitar
            </button>`;
            
            // Solo mostrar botón de gestionar si hay jugadores
            if (totalPlayers > 0) {
                buttons += `<button class="btn-match-action btn-manage" onclick="partidosGrupalesV2.showManagePlayersModal('${match.id}')">
                    <i class='bx bx-user-minus'></i> Gestionar
                </button>`;
            }
            
            // Botón finalizar partido si hay jugadores suficientes
            if (totalPlayers >= 4) {
                buttons += `<button class="btn-match-action btn-finalize" onclick="partidosGrupalesV2.finalizeMatch('${match.id}')" style="background: var(--pg-success); color: white;">
                    <i class='bx bx-check-circle'></i> Finalizar Partido
                </button>`;
            }
            
            buttons += `<button class="btn-match-action btn-delete" onclick="partidosGrupalesV2.deleteMatch('${match.id}')">
                <i class='bx bx-trash'></i> Borrar
            </button>`;
        }
        
        // Botón ver equipos (para todos si hay equipos generados)
        if (match.teams) {
            buttons += `<button class="btn-match-action btn-view-teams" onclick="collaborativeSystem.showTeamsModal('${match.id}')">
                <i class='bx bx-group'></i> Ver Equipos
            </button>`;
        }
        
        return `
            <div class="match-card">
                <div class="match-card-header">
                    <div>
                        <h3 class="match-title">${match.title}</h3>
                        ${isOrganizer ? '<span style="color: var(--pg-info); font-size: 12px;">👑 Eres el organizador</span>' : ''}
                        ${isRegistered && !isOrganizer ? '<span style="color: var(--pg-success); font-size: 12px;">✓ Estás anotado</span>' : ''}
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
                    <div class="match-info-item">
                        <i class='bx bx-user'></i>
                        <span>Organiza: ${match.organizer?.displayName || 'Desconocido'}</span>
                    </div>
                </div>
                
                <div class="match-players">
                    <div class="players-count">
                        <span>👥 Jugadores</span>
                        <span>${totalPlayers}/${maxPlayers}</span>
                    </div>
                    <div class="players-bar">
                        <div class="players-progress" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                ${playersList}
                
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
     * Unirse a un partido
     */
    async joinMatch(matchId) {
        if (!window.collaborativeSystem) return;
        
        await window.collaborativeSystem.joinMatch(matchId);
    }

    /**
     * Desanotarse de un partido
     */
    async leaveMatch(matchId) {
        if (!window.collaborativeSystem) return;
        
        await window.collaborativeSystem.leaveMatch(matchId);
    }

    /**
     * Borrar un partido (solo organizador)
     */
    async deleteMatch(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) {
            alert('❌ No se encontró el partido');
            return;
        }
        
        // Verificar que es el organizador
        const currentUser = window.collaborativeSystem.state.currentUser;
        if (!currentUser || match.organizer.uid !== currentUser.uid) {
            alert('❌ Solo el organizador puede borrar el partido');
            return;
        }
        
        // Confirmación
        if (!confirm(`¿Estás seguro de que quieres borrar el partido "${match.title}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            // Eliminar de Firebase
            if (firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('collaborative_matches').doc(matchId).delete();
                console.log('✅ Partido eliminado de Firebase');
            }
            
            // Eliminar del estado local
            window.collaborativeSystem.state.matches.delete(matchId);
            
            // Actualizar UI
            window.collaborativeSystem.renderUI();
            
            // Notificar a los jugadores anotados
            if (window.notificationsSystem) {
                const allPlayers = [
                    ...(match.registeredPlayers || []),
                    ...(match.guestPlayers || []).filter(g => !g.isGuest) // Solo notificar a usuarios reales
                ];
                
                for (const player of allPlayers) {
                    if (player.uid !== currentUser.uid) { // No notificar al organizador
                        await window.notificationsSystem.createNotification(
                            player.uid,
                            'match_deleted',
                            '🗑️ Partido Cancelado',
                            `El partido "<strong>${match.title}</strong>" ha sido cancelado por el organizador`,
                            { matchId, matchTitle: match.title }
                        );
                    }
                }
            }
            
            alert('✅ Partido eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar partido:', error);
            alert('❌ Error al eliminar el partido');
        }
    }

    /**
     * Mostrar modal de invitación con tabs
     */
    async showInviteModal(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) {
            alert('❌ No se encontró el partido');
            return;
        }
        
        // Verificar que es el organizador
        const currentUser = window.collaborativeSystem.state.currentUser;
        if (!currentUser || match.organizer.uid !== currentUser.uid) {
            alert('❌ Solo el organizador puede invitar jugadores');
            return;
        }
        
        // Obtener jugadores disponibles
        const registeredPlayers = await this.getAvailableRegisteredPlayers(match);
        const guestPlayers = await this.getAvailableGuestPlayers(match);
        
        const modalHTML = `
            <div class="modal-overlay" id="invite-modal-overlay" onclick="if(event.target === this) partidosGrupalesV2.closeInviteModal()">
                <div class="modal-create-match" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class='bx bx-user-plus'></i> Invitar Jugadores
                        </h3>
                        <button class="modal-close" onclick="partidosGrupalesV2.closeInviteModal()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <p style="color: var(--pg-text-secondary); margin-bottom: 20px;">
                            Partido: <strong>${match.title}</strong><br>
                            Espacios disponibles: <strong>${(match.maxPlayers || 10) - ((match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0))}</strong>
                        </p>
                        
                        <!-- Tabs -->
                        <div class="tabs-container" style="margin-bottom: 20px;">
                            <button class="tab-btn active" onclick="partidosGrupalesV2.switchTab('registered')" id="tab-registered">
                                <i class='bx bx-user-check'></i> Jugadores Registrados (${registeredPlayers.length})
                            </button>
                            <button class="tab-btn" onclick="partidosGrupalesV2.switchTab('guests')" id="tab-guests">
                                <i class='bx bx-user'></i> Jugadores Invitados (${guestPlayers.length})
                            </button>
                        </div>
                        
                        <!-- Tab Content: Registered Players -->
                        <div class="tab-content" id="tab-content-registered" style="display: block;">
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${registeredPlayers.length > 0 ? registeredPlayers.map(player => `
                                    <div class="player-item" style="
                                        display: flex;
                                        align-items: center;
                                        padding: 10px;
                                        margin-bottom: 8px;
                                        background: rgba(255,255,255,0.05);
                                        border-radius: 10px;
                                        cursor: pointer;
                                    " onclick="partidosGrupalesV2.togglePlayerSelection('${player.uid || player.id}')">
                                        <input type="checkbox" id="player-${player.uid || player.id}" 
                                               value="${player.uid || player.id}" 
                                               style="margin-right: 12px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--pg-text);">
                                                ${player.displayName || player.name}
                                            </div>
                                            <div style="font-size: 12px; color: var(--pg-text-secondary);">
                                                ${player.position || 'Jugador'} • ${player.ovr || 70} OVR
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p style="text-align: center; color: var(--pg-text-secondary);">No hay jugadores disponibles</p>'}
                            </div>
                        </div>
                        
                        <!-- Tab Content: Guest Players -->
                        <div class="tab-content" id="tab-content-guests" style="display: none;">
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${guestPlayers.length > 0 ? guestPlayers.map(player => `
                                    <div class="player-item" style="
                                        display: flex;
                                        align-items: center;
                                        padding: 10px;
                                        margin-bottom: 8px;
                                        background: rgba(255,193,7,0.1);
                                        border-radius: 10px;
                                        cursor: pointer;
                                    " onclick="partidosGrupalesV2.togglePlayerSelection('${player.id}')">
                                        <input type="checkbox" id="player-${player.id}" 
                                               value="${player.id}" 
                                               style="margin-right: 12px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--pg-text);">
                                                👤 ${player.name}
                                            </div>
                                            <div style="font-size: 12px; color: var(--pg-text-secondary);">
                                                ${player.position || 'Jugador'} • ${player.ovr || 70} OVR
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p style="text-align: center; color: var(--pg-text-secondary);">No hay jugadores invitados disponibles</p>'}
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 10px; margin-top: 25px;">
                            <button class="btn-match-action" style="flex: 1; background: var(--pg-primary); color: var(--pg-dark);" 
                                    onclick="partidosGrupalesV2.inviteSelectedPlayers('${matchId}')">
                                <i class='bx bx-check'></i> Invitar Seleccionados
                            </button>
                            <button class="btn-match-action" style="flex: 1; background: rgba(220, 53, 69, 0.2); color: var(--pg-danger); border: 1px solid var(--pg-danger);" 
                                    onclick="partidosGrupalesV2.closeInviteModal()">
                                <i class='bx bx-x'></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos para los tabs si no existen
        if (!document.getElementById('tabs-styles')) {
            const styles = `
                <style id="tabs-styles">
                    .tabs-container {
                        display: flex;
                        gap: 10px;
                        border-bottom: 2px solid var(--pg-border);
                    }
                    .tab-btn {
                        flex: 1;
                        padding: 12px;
                        background: transparent;
                        border: none;
                        color: var(--pg-text-secondary);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    .tab-btn:hover {
                        background: rgba(255,255,255,0.05);
                    }
                    .tab-btn.active {
                        color: var(--pg-primary);
                        border-bottom: 2px solid var(--pg-primary);
                        margin-bottom: -2px;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.selectedPlayersToInvite.clear();
    }

    /**
     * Obtener jugadores registrados disponibles
     */
    async getAvailableRegisteredPlayers(match) {
        const alreadyInMatch = new Set([
            ...(match.registeredPlayers || []).map(p => p.uid || p.id),
            ...(match.guestPlayers || []).map(p => p.id)
        ]);
        
        // Obtener todos los jugadores de Firebase
        const allPlayers = [];
        if (firebase.firestore) {
            const db = firebase.firestore();
            const snapshot = await db.collection('futbol_users').get();
            snapshot.forEach(doc => {
                const player = { id: doc.id, ...doc.data() };
                if (!alreadyInMatch.has(player.id) && player.id !== match.organizer.uid) {
                    allPlayers.push(player);
                }
            });
        }
        
        return allPlayers;
    }

    /**
     * Obtener jugadores invitados disponibles
     */
    async getAvailableGuestPlayers(match) {
        const alreadyInMatch = new Set([
            ...(match.registeredPlayers || []).map(p => p.uid || p.id),
            ...(match.guestPlayers || []).map(p => p.id)
        ]);
        
        // Obtener todos los jugadores del Storage
        const allPlayers = window.Storage?.getPlayers() || [];
        console.log('Jugadores en Storage:', allPlayers);
        
        // También buscar en Firebase si hay jugadores guardados como invitados
        const guestPlayers = [];
        
        // Filtrar jugadores que:
        // 1. No tienen uid (son invitados creados localmente)
        // 2. O tienen isGuest = true
        // 3. O su id empieza con 'guest_'
        // 4. No están ya en el partido
        // 5. No tienen email (los registrados tienen email)
        const availableGuests = allPlayers.filter(player => {
            const isGuest = !player.uid || 
                           player.isGuest === true || 
                           (player.id && player.id.startsWith('guest_')) ||
                           (!player.email && player.name && player.name !== 'Nuevo Jugador');
            
            const notInMatch = !alreadyInMatch.has(player.id);
            const hasValidName = player.name && player.name !== 'Nuevo Jugador';
            
            return isGuest && notInMatch && hasValidName;
        });
        
        console.log('Jugadores invitados disponibles:', availableGuests);
        return availableGuests;
    }

    /**
     * Cambiar tab activo
     */
    switchTab(tabName) {
        // Cambiar botones
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Cambiar contenido
        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        document.getElementById(`tab-content-${tabName}`).style.display = 'block';
    }

    /**
     * Toggle selección de jugador
     */
    togglePlayerSelection(playerId) {
        const checkbox = document.getElementById(`player-${playerId}`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                this.selectedPlayersToInvite.add(playerId);
            } else {
                this.selectedPlayersToInvite.delete(playerId);
            }
        }
    }

    /**
     * Invitar jugadores seleccionados
     */
    async inviteSelectedPlayers(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) return;
        
        if (this.selectedPlayersToInvite.size === 0) {
            alert('Por favor selecciona al menos un jugador');
            return;
        }
        
        // Verificar espacio disponible
        const currentTotal = (match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0);
        const spacesAvailable = (match.maxPlayers || 10) - currentTotal;
        
        if (this.selectedPlayersToInvite.size > spacesAvailable) {
            alert(`Solo hay ${spacesAvailable} espacios disponibles`);
            return;
        }
        
        try {
            // Obtener datos completos de los jugadores seleccionados
            const playersToAdd = [];
            const db = firebase.firestore ? firebase.firestore() : null;
            
            for (const playerId of this.selectedPlayersToInvite) {
                // Buscar en Firebase (registrados)
                let playerData = null;
                
                if (db) {
                    const doc = await db.collection('futbol_users').doc(playerId).get();
                    if (doc.exists) {
                        playerData = {
                            uid: doc.id,
                            ...doc.data(),
                            registeredAt: new Date().toISOString(),
                            invitedBy: window.collaborativeSystem.state.currentUser.uid
                        };
                    }
                }
                
                // Si no está en Firebase, buscar en Storage (invitados)
                if (!playerData) {
                    const storagePlayers = window.Storage?.getPlayers() || [];
                    const guestPlayer = storagePlayers.find(p => p.id === playerId);
                    if (guestPlayer) {
                        playerData = {
                            ...guestPlayer,
                            invitedBy: window.collaborativeSystem.state.currentUser.uid,
                            invitedAt: new Date().toISOString()
                        };
                    }
                }
                
                if (playerData) {
                    playersToAdd.push(playerData);
                }
            }
            
            // Agregar jugadores al partido
            for (const player of playersToAdd) {
                if (player.isGuest) {
                    // Agregar a invitados
                    if (!match.guestPlayers) match.guestPlayers = [];
                    match.guestPlayers.push(player);
                } else {
                    // Agregar a registrados
                    if (!match.registeredPlayers) match.registeredPlayers = [];
                    match.registeredPlayers.push(player);
                    
                    // Enviar notificación
                    if (window.notificationsSystem) {
                        await window.notificationsSystem.createNotification(
                            player.uid,
                            'match_invite',
                            '⚽ Has sido invitado a un partido',
                            `Has sido agregado al partido "<strong>${match.title}</strong>" por ${match.organizer.displayName}`,
                            { 
                                matchId: match.id,
                                matchTitle: match.title,
                                date: match.date,
                                time: match.time,
                                location: match.location
                            }
                        );
                    }
                }
            }
            
            // Actualizar estado del partido si está lleno
            const newTotal = (match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0);
            if (newTotal >= (match.maxPlayers || 10)) {
                match.status = 'full';
                await window.collaborativeSystem.generateTeamsForMatch(match);
            }
            
            // Guardar en Firebase
            await window.collaborativeSystem.saveMatchToFirebase(match);
            
            // Actualizar UI
            window.collaborativeSystem.renderUI();
            
            // Cerrar modal
            this.closeInviteModal();
            
            alert(`✅ ${playersToAdd.length} jugador${playersToAdd.length > 1 ? 'es' : ''} invitado${playersToAdd.length > 1 ? 's' : ''} correctamente`);
            
        } catch (error) {
            console.error('Error al invitar jugadores:', error);
            alert('❌ Error al invitar jugadores');
        }
    }

    /**
     * Cerrar modal de invitación
     */
    closeInviteModal() {
        const modal = document.getElementById('invite-modal-overlay');
        if (modal) {
            modal.remove();
        }
        this.selectedPlayersToInvite.clear();
    }

    /**
     * Mostrar modal para gestionar jugadores (sacar jugadores)
     */
    async showManagePlayersModal(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) {
            alert('❌ No se encontró el partido');
            return;
        }
        
        // Verificar que es el organizador
        const currentUser = window.collaborativeSystem.state.currentUser;
        if (!currentUser || match.organizer.uid !== currentUser.uid) {
            alert('❌ Solo el organizador puede gestionar jugadores');
            return;
        }
        
        // Obtener todos los jugadores del partido
        const allPlayers = [
            ...(match.registeredPlayers || []).map(p => ({...p, type: 'registered'})),
            ...(match.guestPlayers || []).map(p => ({...p, type: 'guest'}))
        ];
        
        const modalHTML = `
            <div class="modal-overlay" id="manage-modal-overlay" onclick="if(event.target === this) partidosGrupalesV2.closeManageModal()">
                <div class="modal-create-match" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class='bx bx-user-minus'></i> Gestionar Jugadores
                        </h3>
                        <button class="modal-close" onclick="partidosGrupalesV2.closeManageModal()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <p style="color: var(--pg-text-secondary); margin-bottom: 20px;">
                            Partido: <strong>${match.title}</strong><br>
                            Jugadores actuales: <strong>${allPlayers.length}</strong>
                        </p>
                        
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${allPlayers.length > 0 ? allPlayers.map(player => {
                                const playerId = player.uid || player.id;
                                const isOrganizer = playerId === match.organizer.uid;
                                return `
                                    <div class="player-item" style="
                                        display: flex;
                                        align-items: center;
                                        padding: 12px;
                                        margin-bottom: 10px;
                                        background: ${player.type === 'guest' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(0, 255, 157, 0.1)'};
                                        border: 1px solid ${player.type === 'guest' ? 'var(--pg-warning)' : 'var(--pg-primary)'};
                                        border-radius: 10px;
                                    ">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--pg-text);">
                                                ${player.type === 'guest' ? '👤' : '✓'} ${player.displayName || player.name}
                                                ${isOrganizer ? ' <span style="color: var(--pg-info);">(Organizador)</span>' : ''}
                                            </div>
                                            <div style="font-size: 12px; color: var(--pg-text-secondary);">
                                                ${player.position || 'Jugador'} • ${player.ovr || 70} OVR
                                                ${player.invitedBy ? ' • Invitado' : ''}
                                            </div>
                                        </div>
                                        ${!isOrganizer ? `
                                            <button class="btn-remove-player" style="
                                                padding: 8px 16px;
                                                background: rgba(220, 53, 69, 0.2);
                                                border: 1px solid var(--pg-danger);
                                                color: var(--pg-danger);
                                                border-radius: 8px;
                                                cursor: pointer;
                                                transition: all 0.3s;
                                                font-size: 14px;
                                                font-weight: 600;
                                            " onmouseover="this.style.background='var(--pg-danger)'; this.style.color='white';"
                                               onmouseout="this.style.background='rgba(220, 53, 69, 0.2)'; this.style.color='var(--pg-danger)';"
                                               onclick="partidosGrupalesV2.removePlayerFromMatch('${matchId}', '${playerId}', '${player.type}')">
                                                <i class='bx bx-x'></i> Sacar
                                            </button>
                                        ` : '<span style="color: var(--pg-text-secondary); font-size: 12px;">No se puede sacar</span>'}
                                    </div>
                                `;
                            }).join('') : '<p style="text-align: center; color: var(--pg-text-secondary);">No hay jugadores en el partido</p>'}
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn-match-action" style="background: rgba(220, 53, 69, 0.2); color: var(--pg-danger); border: 1px solid var(--pg-danger); width: 150px;"
                                    onclick="partidosGrupalesV2.closeManageModal()">
                                <i class='bx bx-x'></i> Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Sacar un jugador del partido
     */
    async removePlayerFromMatch(matchId, playerId, playerType) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) return;
        
        // Buscar el nombre del jugador
        let playerName = 'Jugador';
        if (playerType === 'guest') {
            const player = match.guestPlayers?.find(p => p.id === playerId);
            playerName = player?.name || 'Invitado';
        } else {
            const player = match.registeredPlayers?.find(p => (p.uid || p.id) === playerId);
            playerName = player?.displayName || player?.name || 'Jugador';
        }
        
        if (!confirm(`¿Estás seguro de que quieres sacar a ${playerName} del partido?`)) {
            return;
        }
        
        try {
            // Remover del array correspondiente
            if (playerType === 'guest') {
                match.guestPlayers = match.guestPlayers.filter(p => p.id !== playerId);
            } else {
                match.registeredPlayers = match.registeredPlayers.filter(p => (p.uid || p.id) !== playerId);
                
                // Notificar al jugador que fue removido
                if (window.notificationsSystem) {
                    await window.notificationsSystem.createNotification(
                        playerId,
                        'match_removed',
                        '⚠️ Has sido removido de un partido',
                        `El organizador te ha sacado del partido "<strong>${match.title}</strong>"`,
                        { matchId, matchTitle: match.title }
                    );
                }
            }
            
            // Actualizar estado del partido
            const totalPlayers = (match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0);
            if (totalPlayers < (match.maxPlayers || 10)) {
                match.status = 'open';
                match.teams = null; // Resetear equipos si los había
            }
            
            // Guardar en Firebase
            await window.collaborativeSystem.saveMatchToFirebase(match);
            
            // Actualizar UI
            window.collaborativeSystem.renderUI();
            
            // Actualizar el modal
            this.closeManageModal();
            this.showManagePlayersModal(matchId);
            
            console.log(`✅ ${playerName} removido del partido`);
            
        } catch (error) {
            console.error('Error al remover jugador:', error);
            alert('❌ Error al sacar al jugador');
        }
    }

    /**
     * Cerrar modal de gestión
     */
    closeManageModal() {
        const modal = document.getElementById('manage-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Finalizar partido y pasar a evaluación
     */
    async finalizeMatch(matchId) {
        const match = window.collaborativeSystem.getMatch(matchId);
        if (!match) {
            alert('❌ No se encontró el partido');
            return;
        }
        
        // Verificar que es el organizador
        const currentUser = window.collaborativeSystem.state.currentUser;
        if (!currentUser || match.organizer.uid !== currentUser.uid) {
            alert('❌ Solo el organizador puede finalizar el partido');
            return;
        }
        
        const totalPlayers = (match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0);
        
        if (totalPlayers < 4) {
            alert('❌ Se necesitan al menos 4 jugadores para finalizar el partido');
            return;
        }
        
        // Confirmación
        if (!confirm(`¿Estás seguro de que quieres finalizar el partido "${match.title}"?\n\nEsto generará los equipos y permitirá hacer evaluaciones.`)) {
            return;
        }
        
        try {
            // Cambiar estado del partido a finalizado
            match.status = 'completed';
            match.completedAt = new Date().toISOString();
            
            // Generar equipos si no existen
            if (!match.teams) {
                await window.collaborativeSystem.generateTeamsForMatch(match);
            }
            
            // Guardar en Firebase
            await window.collaborativeSystem.saveMatchToFirebase(match);
            
            // Actualizar UI
            window.collaborativeSystem.renderUI();
            
            // Mostrar modal con los equipos y opción de evaluar
            this.showFinalizedMatchModal(match);
            
            console.log('✅ Partido finalizado correctamente');
            
        } catch (error) {
            console.error('Error al finalizar partido:', error);
            alert('❌ Error al finalizar el partido');
        }
    }

    /**
     * Mostrar modal de partido finalizado con equipos
     */
    showFinalizedMatchModal(match) {
        const modalHTML = `
            <div class="modal-overlay" id="finalized-modal-overlay" onclick="if(event.target === this) partidosGrupalesV2.closeFinalizedModal()">
                <div class="modal-create-match" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class='bx bx-check-circle' style="color: var(--pg-success);"></i> Partido Finalizado
                        </h3>
                        <button class="modal-close" onclick="partidosGrupalesV2.closeFinalizedModal()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h4 style="color: var(--pg-text); margin-bottom: 10px;">${match.title}</h4>
                            <p style="color: var(--pg-text-secondary);">
                                ${match.date} a las ${match.time} - ${match.location}
                            </p>
                        </div>
                        
                        ${match.teams ? `
                            <div style="margin-bottom: 25px;">
                                <h5 style="color: var(--pg-text); margin-bottom: 15px; text-align: center;">
                                    ⚽ Equipos Generados
                                </h5>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div class="team-card" style="background: rgba(255, 0, 0, 0.1); border: 1px solid #ff4444; border-radius: 10px; padding: 15px;">
                                        <h6 style="color: #ff4444; margin-bottom: 10px; text-align: center;">🔴 ${match.teams.team1.name}</h6>
                                        <div style="font-size: 14px; color: var(--pg-text);">
                                            ${match.teams.team1.players.map(p => `
                                                <div style="margin-bottom: 5px;">
                                                    • ${p.displayName || p.name} (${p.position || 'MED'})
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="team-card" style="background: rgba(0, 0, 255, 0.1); border: 1px solid #4444ff; border-radius: 10px; padding: 15px;">
                                        <h6 style="color: #4444ff; margin-bottom: 10px; text-align: center;">🔵 ${match.teams.team2.name}</h6>
                                        <div style="font-size: 14px; color: var(--pg-text);">
                                            ${match.teams.team2.players.map(p => `
                                                <div style="margin-bottom: 5px;">
                                                    • ${p.displayName || p.name} (${p.position || 'MED'})
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="text-align: center;">
                            <button class="btn-match-action" style="background: var(--pg-primary); color: var(--pg-dark); margin-right: 10px; padding: 12px 24px;"
                                    onclick="partidosGrupalesV2.startEvaluation('${match.id}')">
                                <i class='bx bx-star'></i> Iniciar Evaluación
                            </button>
                            <button class="btn-match-action" style="background: rgba(108, 117, 125, 0.2); color: var(--pg-text-secondary); padding: 12px 24px;"
                                    onclick="partidosGrupalesV2.closeFinalizedModal()">
                                <i class='bx bx-x'></i> Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Iniciar evaluación del partido
     */
    startEvaluation(matchId) {
        this.closeFinalizedModal();
        
        // Cambiar a la pantalla de evaluaciones
        if (window.switchToScreen) {
            window.switchToScreen('evaluations');
        }
        
        // Si hay un sistema de evaluaciones, iniciarlo con este partido
        if (window.evaluationSystem) {
            window.evaluationSystem.startMatchEvaluation(matchId);
        }
        
        console.log('🌟 Iniciando evaluación para partido:', matchId);
    }

    /**
     * Cerrar modal de partido finalizado
     */
    closeFinalizedModal() {
        const modal = document.getElementById('finalized-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
}

// Inicializar el sistema
window.partidosGrupalesV2 = new PartidosGrupalesV2();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.partidosGrupalesV2.initialize();
    });
} else {
    window.partidosGrupalesV2.initialize();
}