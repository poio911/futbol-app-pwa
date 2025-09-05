// Renderer específico para partidos colaborativos con estilos limpios
function renderCollaborativeMatch(match, currentUser) {
    const isOrganizer = match.organizer?.uid === currentUser?.uid;
    const isRegistered = match.registeredPlayers?.some(player => player.uid === currentUser?.uid);
    
    // Ensure registeredPlayers is an array
    if (!match.registeredPlayers) {
        match.registeredPlayers = [];
    }
    
    // Format date and time
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
    
    // Status display
    const statusText = match.status === 'open' ? 'Abierto' : 
                      match.status === 'full' ? 'Completo' : 'Cerrado';
    const statusColor = match.status === 'open' ? '#28a745' : 
                       match.status === 'full' ? '#007bff' : '#6c757d';
    
    // Generate buttons
    let buttons = '';
    
    // Show Join or Leave button based on registration status
    if (!isRegistered && collaborativeSystem.canUserJoinMatch(match)) {
        buttons += `<button onclick="collaborativeSystem.joinMatch('${match.id}')" class="collab-btn-join">🏃 Anotarse</button>`;
    } else if (isRegistered && collaborativeSystem.canUserLeaveMatch(match)) {
        buttons += `<button onclick="collaborativeSystem.leaveMatch('${match.id}')" class="collab-btn-leave">🚪 Salir</button>`;
    }
    
    // Show View Teams button if registered and teams are generated
    if (isRegistered && collaborativeSystem.canUserViewTeams(match)) {
        buttons += `<button onclick="collaborativeSystem.showTeamsModal('${match.id}')" class="collab-btn-teams">⚽ Ver Equipos</button>`;
    }
    
    // Invite button always visible for organizer
    if (collaborativeSystem.canUserInviteGuests(match)) {
        buttons += `<button onclick="collaborativeSystem.showInviteGuestsModal('${match.id}')" class="collab-btn-invite">🎭 Invitar</button>`;
    }
    
    if (isOrganizer && collaborativeSystem.canUserDeleteMatch(match)) {
        buttons += `<button onclick="collaborativeSystem.deleteMatch('${match.id}')" class="collab-btn-delete">🗑️ Borrar</button>`;
    }
    
    return `
        <div class="collab-match-card ${isRegistered ? 'registered' : ''} ${isOrganizer ? 'organizer' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 class="collab-match-title">
                        ${match.title} 
                        ${isOrganizer ? '<span style="color: #007bff; font-size: 0.75em; font-weight: 500;">(Organizador)</span>' : ''}
                    </h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="collab-status-badge" style="background: ${statusColor};">
                            ${statusText}
                        </span>
                        ${isRegistered ? '<span class="collab-registered-badge">✓ Anotado</span>' : ''}
                    </div>
                </div>
                <div style="text-align: right; color: #555; font-size: 0.9em; font-weight: 500;">
                    <div>${match.format || '5v5'}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <div class="collab-match-label">📅 Fecha y hora</div>
                    <div class="collab-match-info">${dateStr} a las ${timeStr}</div>
                </div>
                <div>
                    <div class="collab-match-label">📍 Ubicación</div>
                    <div class="collab-match-info">${match.location}</div>
                </div>
                <div>
                    <div class="collab-match-label">👥 Jugadores</div>
                    <div class="collab-match-info">${match.registeredPlayers.length}/${match.maxPlayers || 10}</div>
                </div>
                <div>
                    <div class="collab-match-label">👤 Organiza</div>
                    <div class="collab-match-info">${match.organizer?.displayName || 'Desconocido'}</div>
                </div>
            </div>
            
            ${match.description ? `
                <div class="collab-match-description">
                    ${match.description}
                </div>
            ` : ''}
            
            ${buttons ? `
                <div style="border-top: 1px solid #eee; padding-top: 15px;">
                    ${buttons}
                </div>
            ` : ''}
        </div>
    `;
}

// Override the renderMatchCard method
if (window.collaborativeSystem) {
    window.collaborativeSystem.renderMatchCard = function(match, type) {
        return renderCollaborativeMatch(match, this.state.currentUser);
    };
}