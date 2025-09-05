/**
 * Match Manager - Enhanced match management system
 * Handles match creation, deletion, manual teams, and evaluation
 */

// Create UI helper if not exists
if (typeof UI === 'undefined') {
    window.UI = {
        showNotification: (message, type = 'info') => {
            console.log(`[UI ${type.toUpperCase()}] ${message}`);
            if (type === 'error') {
                alert(`Error: ${message}`);
            } else if (type === 'success') {
                alert(message);
            }
        },
        showLoading: () => console.log('[UI] Loading...'),
        hideLoading: () => console.log('[UI] Loading complete')
    };
}

const MatchManager = {
    // State
    editMode: false,
    selectedMatches: new Set(),
    manualTeams: {
        teamA: [],
        teamB: []
    },
    currentTab: 'auto-teams',
    
    /**
     * Initialize match management system
     */
    init() {
        this.setupEventListeners();
        this.setDefaultMatchDate();
        this.loadAvailablePlayers();
    },
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.creation-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Match history controls
        const toggleEditBtn = document.getElementById('toggle-edit-matches');
        if (toggleEditBtn) {
            toggleEditBtn.addEventListener('click', () => this.toggleEditMode());
        }
        
        const deleteSelectedBtn = document.getElementById('delete-selected-matches');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedMatches());
        }
        
        // Match filters
        const statusFilter = document.getElementById('match-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterMatches());
        }
        
        const dateFilter = document.getElementById('match-date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterMatches());
        }
        
        // Manual team builder
        const saveManualTeamsBtn = document.getElementById('save-manual-teams-btn');
        if (saveManualTeamsBtn) {
            saveManualTeamsBtn.addEventListener('click', () => this.saveManualTeams());
        }
        
        // Setup drag and drop
        this.setupDragAndDrop();
    },
    
    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.creation-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Load data for manual teams tab
        if (tabName === 'manual-teams') {
            this.loadAvailablePlayers();
        }
    },
    
    /**
     * Set default match date to now
     */
    setDefaultMatchDate() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16);
        
        const matchDateInput = document.getElementById('match-date');
        if (matchDateInput) {
            matchDateInput.value = dateStr;
        }
        
        const manualMatchDateInput = document.getElementById('manual-match-date');
        if (manualMatchDateInput) {
            manualMatchDateInput.value = dateStr;
        }
    },
    
    /**
     * Load available players for manual team selection
     */
    async loadAvailablePlayers() {
        await Storage.loadPlayersFromFirebase();
        const players = Storage.getPlayers();
        const container = document.getElementById('available-players');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (players.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No hay jugadores disponibles</p>';
            return;
        }
        
        players.forEach(player => {
            const playerEl = this.createDraggablePlayer(player);
            container.appendChild(playerEl);
        });
    },
    
    /**
     * Create draggable player element
     */
    createDraggablePlayer(player) {
        const div = document.createElement('div');
        div.className = 'draggable-player';
        div.draggable = true;
        div.dataset.playerId = player.id;
        
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}">` : 
            '<i class="bx bx-user"></i>';
        
        div.innerHTML = `
            <div class="player-photo">${photoHtml}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${player.position}</div>
            </div>
            <div class="player-ovr">${player.ovr}</div>
        `;
        
        // Store player data
        div.playerData = player;
        
        return div;
    },
    
    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        // Available players
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('draggable-player')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('playerId', e.target.dataset.playerId);
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('draggable-player')) {
                e.target.classList.remove('dragging');
            }
        });
        
        // Team areas
        ['team-a-players', 'team-b-players', 'available-players'].forEach(id => {
            const area = document.getElementById(id);
            if (!area) return;
            
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                area.parentElement.classList.add('drag-over');
            });
            
            area.addEventListener('dragleave', (e) => {
                if (e.target === area) {
                    area.parentElement.classList.remove('drag-over');
                }
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.parentElement.classList.remove('drag-over');
                
                const playerId = e.dataTransfer.getData('playerId');
                const playerEl = document.querySelector(`.draggable-player[data-player-id="${playerId}"]`);
                
                if (playerEl && area) {
                    area.appendChild(playerEl);
                    this.updateManualTeams();
                }
            });
        });
    },
    
    /**
     * Update manual teams state
     */
    updateManualTeams() {
        const teamAPlayers = document.getElementById('team-a-players');
        const teamBPlayers = document.getElementById('team-b-players');
        
        this.manualTeams.teamA = [];
        this.manualTeams.teamB = [];
        
        // Get Team A players
        if (teamAPlayers) {
            teamAPlayers.querySelectorAll('.draggable-player').forEach(el => {
                if (el.playerData) {
                    this.manualTeams.teamA.push(el.playerData);
                }
            });
        }
        
        // Get Team B players
        if (teamBPlayers) {
            teamBPlayers.querySelectorAll('.draggable-player').forEach(el => {
                if (el.playerData) {
                    this.manualTeams.teamB.push(el.playerData);
                }
            });
        }
        
        // Update OVR displays
        this.updateTeamOVR('team-a', this.manualTeams.teamA);
        this.updateTeamOVR('team-b', this.manualTeams.teamB);
        
        // Enable save button if both teams have players
        const saveBtn = document.getElementById('save-manual-teams-btn');
        if (saveBtn) {
            saveBtn.disabled = this.manualTeams.teamA.length === 0 || this.manualTeams.teamB.length === 0;
        }
    },
    
    /**
     * Update team OVR display
     */
    updateTeamOVR(teamId, players) {
        const ovrEl = document.getElementById(`${teamId}-ovr`);
        if (!ovrEl) return;
        
        if (players.length === 0) {
            ovrEl.textContent = '0';
            return;
        }
        
        const totalOVR = players.reduce((sum, p) => sum + (p.ovr || 0), 0);
        const avgOVR = Math.round(totalOVR / players.length);
        ovrEl.textContent = avgOVR;
    },
    
    /**
     * Save manual teams as a match
     */
    async saveManualTeams() {
        if (this.manualTeams.teamA.length === 0 || this.manualTeams.teamB.length === 0) {
            UI.showNotification('Ambos equipos deben tener jugadores', 'error');
            return;
        }
        
        const matchDate = document.getElementById('manual-match-date').value;
        if (!matchDate) {
            UI.showNotification('Por favor selecciona una fecha para el partido', 'error');
            return;
        }
        
        // Calculate team OVRs
        const teamAOvr = Math.round(
            this.manualTeams.teamA.reduce((sum, p) => sum + p.ovr, 0) / this.manualTeams.teamA.length
        );
        const teamBOvr = Math.round(
            this.manualTeams.teamB.reduce((sum, p) => sum + p.ovr, 0) / this.manualTeams.teamB.length
        );
        
        const match = {
            id: Date.now().toString() + Utils.generateId().substring(0, 5),
            date: new Date(matchDate).toISOString(),
            createdAt: new Date().toISOString(),
            teamA: {
                players: this.manualTeams.teamA,
                ovr: teamAOvr
            },
            teamB: {
                players: this.manualTeams.teamB,
                ovr: teamBOvr
            },
            difference: Math.abs(teamAOvr - teamBOvr),
            status: 'pending',
            format: 'manual',
            isManual: true,
            result: null,
            evaluations: []
        };
        
        try {
            UI.showLoading();
            const success = await Storage.saveMatch(match);
            
            if (success) {
                UI.showNotification('¡Partido guardado exitosamente!', 'success');
                
                // Clear manual teams
                this.clearManualTeams();
                
                // Reload match list
                await this.loadMatchHistory();
            } else {
                throw new Error('Failed to save match');
            }
        } catch (error) {
            console.error('Error saving manual match:', error);
            UI.showNotification('Error al guardar el partido', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Clear manual teams
     */
    clearManualTeams() {
        this.manualTeams.teamA = [];
        this.manualTeams.teamB = [];
        
        // Move all players back to available
        const availablePlayers = document.getElementById('available-players');
        const teamAPlayers = document.getElementById('team-a-players');
        const teamBPlayers = document.getElementById('team-b-players');
        
        if (availablePlayers && teamAPlayers && teamBPlayers) {
            // Move all players back
            [...teamAPlayers.children, ...teamBPlayers.children].forEach(player => {
                if (player.classList.contains('draggable-player')) {
                    availablePlayers.appendChild(player);
                }
            });
        }
        
        // Update OVR displays
        this.updateTeamOVR('team-a', []);
        this.updateTeamOVR('team-b', []);
        
        // Disable save button
        const saveBtn = document.getElementById('save-manual-teams-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
        }
    },
    
    /**
     * Load match history
     */
    async loadMatchHistory() {
        await Storage.loadMatchesFromFirebase();
        const matches = Storage.getMatches();
        const container = document.getElementById('match-list');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (matches.length === 0) {
            container.innerHTML = `
                <div class="no-matches-message">
                    <p>No hay partidos programados</p>
                    <p>Crea un nuevo partido usando las opciones arriba</p>
                </div>
            `;
            return;
        }
        
        // Sort matches by date (newest first)
        const sortedMatches = [...matches].sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
        
        sortedMatches.forEach(match => {
            const card = this.createMatchCard(match);
            container.appendChild(card);
        });
    },
    
    /**
     * Create match card element
     */
    createMatchCard(match) {
        const div = document.createElement('div');
        div.className = 'match-card';
        div.dataset.matchId = match.id;
        
        // Determine status
        const status = match.result ? 'completed' : 'pending';
        const statusText = match.result ? 'Completado' : 'Pendiente';
        const statusClass = match.result ? 'completed' : 'pending';
        
        // Format date
        const matchDate = new Date(match.date || match.createdAt);
        const dateStr = matchDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate team OVRs
        let teamAOvr = 0;
        let teamBOvr = 0;
        
        if (match.teamA) {
            teamAOvr = match.teamA.ovr || (match.teamA.players ? 
                Math.round(match.teamA.players.reduce((sum, p) => sum + (p.ovr || 0), 0) / match.teamA.players.length) : 0);
        }
        
        if (match.teamB) {
            teamBOvr = match.teamB.ovr || (match.teamB.players ? 
                Math.round(match.teamB.players.reduce((sum, p) => sum + (p.ovr || 0), 0) / match.teamB.players.length) : 0);
        }
        
        div.innerHTML = `
            <input type="checkbox" class="match-checkbox" data-match-id="${match.id}">
            
            <div class="match-card-header">
                <span class="match-date-display">${dateStr}</span>
                <span class="match-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="match-teams-display">
                <div class="match-team-info">
                    <div class="match-team-name">Equipo A</div>
                    <div class="match-team-ovr">${teamAOvr}</div>
                </div>
                <div class="match-vs">VS</div>
                <div class="match-team-info">
                    <div class="match-team-name">Equipo B</div>
                    <div class="match-team-ovr">${teamBOvr}</div>
                </div>
            </div>
            
            ${match.result ? `
                <div class="match-result-display">
                    <div class="match-score">${match.result.teamA} - ${match.result.teamB}</div>
                </div>
            ` : ''}
            
            <div class="match-actions">
                ${!match.result ? `
                    <button class="match-finish-btn" onclick="MatchManager.finishMatch('${match.id}')">
                        <i class='bx bx-check-circle'></i> Finalizar
                    </button>
                ` : ''}
                <button class="match-delete-btn" onclick="MatchManager.deleteMatch('${match.id}')">
                    <i class='bx bx-trash'></i> Eliminar
                </button>
            </div>
        `;
        
        // Add checkbox listener
        const checkbox = div.querySelector('.match-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedMatches.add(match.id);
            } else {
                this.selectedMatches.delete(match.id);
            }
        });
        
        return div;
    },
    
    /**
     * Toggle edit mode for matches
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        
        // Update UI
        document.querySelectorAll('.match-card').forEach(card => {
            card.classList.toggle('edit-mode', this.editMode);
        });
        
        // Show/hide delete button
        const deleteBtn = document.getElementById('delete-selected-matches');
        if (deleteBtn) {
            deleteBtn.style.display = this.editMode ? 'block' : 'none';
        }
        
        // Clear selections when exiting edit mode
        if (!this.editMode) {
            this.selectedMatches.clear();
            document.querySelectorAll('.match-checkbox').forEach(cb => {
                cb.checked = false;
            });
        }
    },
    
    /**
     * Delete a single match
     */
    async deleteMatch(matchId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) {
            return;
        }
        
        try {
            UI.showLoading();
            
            // Delete from Firebase
            if (Storage.currentGroupId && db) {
                await db.collection('groups')
                    .doc(Storage.currentGroupId)
                    .collection('matches')
                    .doc(matchId)
                    .delete();
            }
            
            // Remove from cache
            Storage.cachedMatches = Storage.cachedMatches.filter(m => m.id !== matchId);
            
            UI.showNotification('Partido eliminado exitosamente', 'success');
            
            // Reload match list
            await this.loadMatchHistory();
            
        } catch (error) {
            console.error('Error deleting match:', error);
            UI.showNotification('Error al eliminar el partido', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Delete selected matches
     */
    async deleteSelectedMatches() {
        if (this.selectedMatches.size === 0) {
            UI.showNotification('No hay partidos seleccionados', 'warning');
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres eliminar ${this.selectedMatches.size} partido(s)?`)) {
            return;
        }
        
        try {
            UI.showLoading();
            
            // Delete each selected match
            for (const matchId of this.selectedMatches) {
                if (Storage.currentGroupId && db) {
                    await db.collection('groups')
                        .doc(Storage.currentGroupId)
                        .collection('matches')
                        .doc(matchId)
                        .delete();
                }
                
                // Remove from cache
                Storage.cachedMatches = Storage.cachedMatches.filter(m => m.id !== matchId);
            }
            
            UI.showNotification(`${this.selectedMatches.size} partido(s) eliminado(s)`, 'success');
            
            // Clear selections
            this.selectedMatches.clear();
            
            // Exit edit mode
            this.toggleEditMode();
            
            // Reload match list
            await this.loadMatchHistory();
            
        } catch (error) {
            console.error('Error deleting matches:', error);
            UI.showNotification('Error al eliminar los partidos', 'error');
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Filter matches based on status and date
     */
    filterMatches() {
        const statusFilter = document.getElementById('match-status-filter').value;
        const dateFilter = document.getElementById('match-date-filter').value;
        
        document.querySelectorAll('.match-card').forEach(card => {
            let show = true;
            
            // Status filter
            if (statusFilter !== 'all') {
                const hasResult = card.querySelector('.match-result-display');
                const isPending = !hasResult;
                
                if (statusFilter === 'pending' && !isPending) show = false;
                if (statusFilter === 'completed' && isPending) show = false;
            }
            
            // Date filter
            if (dateFilter) {
                const cardDate = card.querySelector('.match-date-display').textContent;
                const filterDate = new Date(dateFilter).toLocaleDateString('es-ES');
                if (!cardDate.includes(filterDate)) show = false;
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    },
    
    /**
     * Finish match and trigger automatic evaluations
     */
    async finishMatch(matchId) {
        console.log(`[MatchManager] Starting finishMatch for ID: ${matchId}`);
        
        // Check if Storage is available
        if (!window.Storage) {
            console.error('Storage not available!');
            UI.showNotification('Error: Storage no disponible', 'error');
            return;
        }
        
        // Get the match object (now async)
        console.log('[MatchManager] Calling Storage.getMatchById...');
        let match;
        try {
            match = await Storage.getMatchById(matchId);
        } catch (error) {
            console.error('Error calling Storage.getMatchById:', error);
            UI.showNotification('Error buscando partido', 'error');
            return;
        }
        
        if (!match) {
            console.error(`Match not found: ${matchId}`);
            // Try to get from TestApp as fallback
            if (window.TestApp && window.TestApp.matchHistory) {
                console.log('Trying to find in TestApp.matchHistory...');
                match = window.TestApp.matchHistory.find(m => m.id === matchId);
                if (match) {
                    console.log('Found match in TestApp.matchHistory!', match);
                } else {
                    console.log('Not found in TestApp.matchHistory either');
                    UI.showNotification('Partido no encontrado.', 'error');
                    return;
                }
            } else {
                UI.showNotification('Partido no encontrado.', 'error');
                return;
            }
        }
        
        console.log('Match found for finishing:', match);
        
        if (!confirm('¿Confirmar finalización del partido? Se enviarán evaluaciones automáticas a todos los jugadores.')) {
            return;
        }
        
        try {
            UI.showLoading();
            
            // Update match status
            match.status = 'completed';
            match.completedAt = Date.now();
            
            // Save to Firebase - update BOTH collections
            if (db) {
                // Update in futbol_matches (new structure)
                try {
                    await db.collection('futbol_matches')
                        .doc(matchId)
                        .update({
                            status: 'completed',
                            completedAt: match.completedAt,
                            result: { teamA: 0, teamB: 0 }
                        });
                    console.log('Updated match in futbol_matches');
                } catch (err) {
                    console.warn('Could not update futbol_matches:', err);
                }
                
                // Also try old structure if we have groupId
                if (Storage.currentGroupId) {
                    try {
                        await db.collection('groups')
                            .doc(Storage.currentGroupId)
                            .collection('matches')
                            .doc(matchId)
                            .update({
                                status: 'completed',
                                completedAt: match.completedAt
                            });
                        console.log('Updated match in old structure');
                    } catch (err) {
                        console.warn('Could not update old structure:', err);
                    }
                }
            }
            
            // Initialize automatic evaluations
            if (window.UnifiedEvaluationSystem) {
                await window.UnifiedEvaluationSystem.initializeEvaluations(match, 'manual');
                UI.showNotification('✅ Partido finalizado. Evaluaciones enviadas a todos los jugadores.', 'success');
            } else {
                UI.showNotification('✅ Partido finalizado.', 'success');
            }
            
            // Reload match history
            await this.loadMatchHistory();
            
            // Also update TestApp history if available
            if (window.TestApp && TestApp.displayMatchHistory) {
                await TestApp.displayMatchHistory();
            }
            
        } catch (error) {
            console.error('Error finishing match:', error);
            UI.showNotification('Error al finalizar el partido', 'error');
        } finally {
            UI.hideLoading();
        }
    }
};

// Make MatchManager globally available
window.MatchManager = MatchManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MatchManager.init());
} else {
    MatchManager.init();
}