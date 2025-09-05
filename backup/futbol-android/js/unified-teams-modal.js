/**
 * Sistema Unificado de Modal de Equipos
 * Usado tanto para partidos manuales como grupales
 */

class UnifiedTeamsModal {
    constructor() {
        this.modalId = 'unified-teams-modal';
    }

    /**
     * Muestra el modal de equipos con diseño unificado
     * @param {Object} teamsData - Datos de los equipos
     * @param {Object} options - Opciones adicionales
     */
    show(teamsData, options = {}) {
        // Cerrar modal existente si hay uno
        this.close();

        const {
            title = '⚽ Equipos Generados',
            format = '5v5',
            showFormation = false,
            showStats = false,
            showBalance = true
        } = options;

        // Normalizar estructura de datos
        const normalizedData = this.normalizeTeamsData(teamsData);
        
        if (!normalizedData) {
            console.error('Error: Datos de equipos inválidos');
            return;
        }

        const modalHtml = this.createModalHTML(normalizedData, {
            title,
            format,
            showFormation,
            showStats,
            showBalance
        });

        // Insertar modal en el DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Agregar event listeners
        this.addEventListeners();
        
        console.log('✅ Modal unificado de equipos mostrado');
    }

    /**
     * Normaliza los datos de equipos de diferentes fuentes
     */
    normalizeTeamsData(data) {
        // Estructura para partidos grupales
        if (data.team1 && data.team2) {
            return {
                teamA: {
                    name: data.team1.name || '🔴 Equipo A',
                    players: data.team1.players || [],
                    ovr: data.team1.avgOVR || data.team1.ovr || 0,
                    stats: data.team1.stats
                },
                teamB: {
                    name: data.team2.name || '🔵 Equipo B', 
                    players: data.team2.players || [],
                    ovr: data.team2.avgOVR || data.team2.ovr || 0,
                    stats: data.team2.stats
                },
                balance: data.balance,
                format: data.format || '5v5'
            };
        }
        
        // Estructura para partidos manuales
        if (data.teamA && data.teamB) {
            return {
                teamA: {
                    name: data.teamA.name || 'Equipo A',
                    players: data.teamA.players || [],
                    ovr: data.teamA.ovr || 0,
                    stats: data.teamA.stats
                },
                teamB: {
                    name: data.teamB.name || 'Equipo B',
                    players: data.teamB.players || [],
                    ovr: data.teamB.ovr || 0,
                    stats: data.teamB.stats
                },
                balance: data.balance,
                difference: data.difference,
                format: data.format || '5v5'
            };
        }

        return null;
    }

    /**
     * Crea el HTML del modal
     */
    createModalHTML(data, options) {
        const { title, format, showFormation, showStats, showBalance } = options;
        
        return `
            <div id="${this.modalId}" class="unified-modal">
                <div class="unified-modal-content">
                    ${this.createModalHeader(title)}
                    
                    <div class="unified-teams-grid">
                        ${this.createTeamCard(data.teamA, 'A', { showFormation, showStats, format })}
                        ${this.createTeamCard(data.teamB, 'B', { showFormation, showStats, format })}
                    </div>
                    
                    ${showBalance ? this.createBalanceSection(data) : ''}
                    
                    ${this.createActionButtons()}
                </div>
            </div>
        `;
    }

    /**
     * Crea el header del modal
     */
    createModalHeader(title) {
        return `
            <div class="unified-modal-header">
                <h2 class="unified-modal-title">${title}</h2>
                <button class="unified-modal-close" onclick="unifiedTeamsModal.close()">✕</button>
            </div>
        `;
    }

    /**
     * Crea una tarjeta de equipo
     */
    createTeamCard(team, teamLetter, options = {}) {
        const { showFormation, showStats, format } = options;
        
        return `
            <div class="unified-team-card">
                <div class="unified-team-header">
                    <h3 class="unified-team-name">${team.name}</h3>
                    <span class="unified-team-ovr">OVR ${team.ovr}</span>
                </div>
                
                ${showFormation ? this.createFormationInfo(team, format) : ''}
                
                <div class="unified-player-list">
                    ${team.players.map((player, index) => this.createPlayerItem(player, index + 1)).join('')}
                </div>
                
                ${showStats && team.stats ? this.createStatsInfo(team.stats) : ''}
            </div>
        `;
    }

    /**
     * Crea un item de jugador
     */
    createPlayerItem(player, number) {
        const isGuest = player.isGuest || player.id?.startsWith('guest_') || !player.uid;
        
        return `
            <div class="unified-player-item">
                <span class="unified-player-number">#${number}</span>
                <span class="unified-player-name">
                    ${player.name} ${isGuest ? '👤' : ''}
                </span>
                <span class="unified-player-position">${player.position || 'N/A'}</span>
                <span class="unified-player-ovr">${player.ovr || 70}</span>
            </div>
        `;
    }

    /**
     * Crea información de formación
     */
    createFormationInfo(team, format) {
        const formation = this.getSuggestedFormation(team.players, format);
        
        return `
            <div class="unified-formation-info">
                <span class="unified-formation-label">📋 Formación:</span>
                <span class="unified-formation-type">${formation}</span>
            </div>
        `;
    }

    /**
     * Crea información de estadísticas
     */
    createStatsInfo(stats) {
        return `
            <div class="unified-team-stats">
                <div class="unified-stats-grid">
                    <div class="unified-stat-item">
                        <span class="stat-label">⚡ Ritmo</span>
                        <span class="stat-value">${stats.avgPace || 'N/A'}</span>
                    </div>
                    <div class="unified-stat-item">
                        <span class="stat-label">⚽ Tiro</span>
                        <span class="stat-value">${stats.avgShooting || 'N/A'}</span>
                    </div>
                    <div class="unified-stat-item">
                        <span class="stat-label">🎯 Pase</span>
                        <span class="stat-value">${stats.avgPassing || 'N/A'}</span>
                    </div>
                    <div class="unified-stat-item">
                        <span class="stat-label">⚡ Regate</span>
                        <span class="stat-value">${stats.avgDribbling || 'N/A'}</span>
                    </div>
                    <div class="unified-stat-item">
                        <span class="stat-label">🛡️ Defensa</span>
                        <span class="stat-value">${stats.avgDefending || 'N/A'}</span>
                    </div>
                    <div class="unified-stat-item">
                        <span class="stat-label">💪 Físico</span>
                        <span class="stat-value">${stats.avgPhysical || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Crea la sección de balance
     */
    createBalanceSection(data) {
        let balanceText = '';
        let ovrDifference = 0;
        
        if (data.balance && typeof data.balance === 'object') {
            // Formato de partidos grupales (avanzado)
            balanceText = data.balance.rating || `Score: ${data.balance.score}`;
            ovrDifference = data.balance.ovrDifference || Math.abs(data.teamA.ovr - data.teamB.ovr);
        } else if (data.difference !== undefined) {
            // Formato de partidos manuales
            ovrDifference = data.difference;
            const balancePercent = Math.max(0, 100 - data.difference * 10);
            if (balancePercent >= 95) balanceText = '⭐⭐⭐⭐⭐ Perfecto';
            else if (balancePercent >= 85) balanceText = '⭐⭐⭐⭐ Excelente';
            else if (balancePercent >= 70) balanceText = '⭐⭐⭐ Bueno';
            else if (balancePercent >= 50) balanceText = '⭐⭐ Regular';
            else balanceText = '⭐ Desbalanceado';
        } else {
            ovrDifference = Math.abs(data.teamA.ovr - data.teamB.ovr);
            if (ovrDifference <= 2) balanceText = '⭐⭐⭐⭐⭐ Perfecto';
            else if (ovrDifference <= 5) balanceText = '⭐⭐⭐⭐ Excelente';
            else if (ovrDifference <= 8) balanceText = '⭐⭐⭐ Bueno';
            else if (ovrDifference <= 12) balanceText = '⭐⭐ Regular';
            else balanceText = '⭐ Desbalanceado';
        }

        return `
            <div class="unified-balance-info">
                <div class="unified-balance-title">⚖️ Balance del Partido</div>
                <div class="unified-balance-details">
                    Diferencia OVR: ${ovrDifference} puntos • ${balanceText}
                </div>
            </div>
        `;
    }

    /**
     * Crea los botones de acción
     */
    createActionButtons() {
        return `
            <div class="unified-modal-actions">
                <button class="btn-unified btn-outline" onclick="unifiedTeamsModal.close()">
                    <i class='bx bx-x'></i> Cerrar
                </button>
            </div>
        `;
    }

    /**
     * Sugiere formación basada en jugadores y formato
     */
    getSuggestedFormation(players, format) {
        const positions = players.reduce((acc, player) => {
            const pos = player.position || 'MED';
            acc[pos] = (acc[pos] || 0) + 1;
            return acc;
        }, {});

        const por = positions.POR || 0;
        const def = positions.DEF || 0;
        const med = positions.MED || 0;
        const del = positions.DEL || 0;

        if (format === '7v7') {
            if (def >= 3 && med >= 2 && del >= 1) return `${por}-${def}-${med}-${del}`;
            return '1-3-2-1';
        } else {
            if (def >= 2 && med >= 2 && del >= 1) return `${por}-${def}-${med}-${del}`;
            return '1-2-2';
        }
    }

    /**
     * Agrega event listeners
     */
    addEventListeners() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            // Cerrar al hacer click fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });

            // Cerrar con ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
        }
    }

    /**
     * Cierra el modal
     */
    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.remove();
            console.log('✅ Modal unificado cerrado');
        }
    }
}

// Crear instancia global
window.unifiedTeamsModal = new UnifiedTeamsModal();

console.log('✅ Sistema unificado de modal de equipos cargado');