/**
 * Admin Panel - Complete Firebase Database Management
 * Allows viewing and deleting all data from Firebase
 */

const AdminPanel = {
    // Data storage
    players: [],
    matches: [],
    users: [],
    groups: [],
    allCollections: {},
    databaseStructure: [],
    currentSection: 'overview',

    /**
     * Initialize the admin panel
     */
    async init() {
        console.log('🛠️ Admin Panel Initialized');
        
        // Check dependencies
        if (!firebase || !firebase.firestore) {
            console.error('❌ Firebase not available');
            this.showNotification('Firebase no está disponible', 'error');
            return;
        }

        if (!window.Storage) {
            console.error('❌ Storage not available');
            this.showNotification('Storage no está disponible', 'error');
            return;
        }
        
        // Load initial data
        await this.refreshAll();
        
        // Add console helper functions
        this.setupConsoleHelpers();
    },

    /**
     * Setup console helper functions for manual operations
     */
    setupConsoleHelpers() {
        window.resetAllPlayersTo50 = () => this.resetAllPlayersTo50();
        window.resetAllPlayersToCustom = (value) => this.resetAllPlayersToCustom(value);
        window.adminConsole = {
            getStats: () => ({
                players: this.players.length,
                matches: this.matches.length,
                users: this.users.length,
                groups: this.groups.length,
                evaluations: this.evaluations?.length || 0,
                evaluatedPlayers: this.players.filter(p => p.hasBeenEvaluated).length,
                activeEvaluations: this.evaluations?.filter(e => e.status === 'pending').length || 0,
                groupBreakdown: {
                    authenticated: this.players.filter(p => p.source === 'authenticated').length,
                    group: this.players.filter(p => p.source === 'group').length
                }
            }),
            findPlayersBy: (criteria) => this.players.filter(p => {
                return Object.keys(criteria).every(key => p[key] === criteria[key]);
            }),
            findEvaluationsBy: (criteria) => this.evaluations?.filter(e => {
                return Object.keys(criteria).every(key => e[key] === criteria[key]);
            }) || [],
            resetPlayerTo: (playerId, value = 50) => this.resetPlayerTo(playerId, value),
            setTestGroup: (groupId) => {
                if (Storage) {
                    Storage.setCurrentGroup(groupId);
                    console.log(`✅ Test group set to: ${groupId}`);
                } else {
                    console.error('❌ Storage not available');
                }
            },
            listGroups: () => this.groups.map(g => ({ id: g.id, name: g.name })),
            cleanTestData: () => this.cleanAllTestData(),
            forceEvaluationUpdate: (evalId) => this.forceEvaluationUpdate(evalId),
            refresh: () => this.refreshAll()
        };
        
        console.log('🛠️ Console helpers loaded:');
        console.log('   - resetAllPlayersTo50() - Reset all players to 50');
        console.log('   - resetAllPlayersToCustom(value) - Reset all players to custom value');
        console.log('   - adminConsole.getStats() - Get database statistics');
        console.log('   - adminConsole.findPlayersBy({criteria}) - Find players');
    },

    /**
     * Switch between sections
     */
    switchSection(sectionName) {
        console.log(`Switching to section: ${sectionName}`);
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="AdminPanel.switchSection('${sectionName}')"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load section data if needed
        switch(sectionName) {
            case 'players':
                this.loadPlayers();
                break;
            case 'matches':
                this.loadMatches();
                break;
            case 'evaluations':
                this.loadEvaluations();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'groups':
                this.loadGroups();
                break;
            case 'explorer':
                // Explorer doesn't auto-load, user clicks button
                break;
        }
    },

    /**
     * Refresh all data
     */
    async refreshAll() {
        console.log('🔄 Refreshing all data...');
        
        try {
            // Load all data in parallel
            await Promise.all([
                this.loadPlayers(),
                this.loadMatches(), 
                this.loadUsers(),
                this.loadGroups(),
                this.loadEvaluations()
            ]);
            
            // Update overview stats
            this.updateOverviewStats();
            
            console.log('✅ All data refreshed successfully');
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.showNotification('Error actualizando datos', 'error');
        }
    },

    /**
     * Update overview statistics
     */
    updateOverviewStats() {
        document.getElementById('total-players').textContent = this.players.length;
        document.getElementById('total-matches').textContent = this.matches.length;
        document.getElementById('total-users').textContent = this.users.length;
        document.getElementById('total-groups').textContent = this.groups.length;
        
        // Update evaluation stats if available
        if (this.evaluations) {
            const activeEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
            const totalEvaluations = this.evaluations.length;
            
            const totalEvalElement = document.getElementById('total-evaluations');
            const activeEvalElement = document.getElementById('active-evaluations');
            
            if (totalEvalElement) totalEvalElement.textContent = totalEvaluations;
            if (activeEvalElement) activeEvalElement.textContent = activeEvaluations;
        }
    },

    /**
     * Load all players from Firebase - Admin version (loads from ALL groups)
     */
    async loadPlayers() {
        console.log('👥 Loading players from ALL groups...');
        
        try {
            this.players = [];
            
            if (!db) {
                console.error('❌ Database not available');
                this.showError('players-list', 'Base de datos no disponible');
                return;
            }
            
            // Load from all groups
            console.log('🔍 Scanning all groups for players...');
            const groupsSnapshot = await db.collection('groups').get();
            let groupCount = 0;
            
            for (const groupDoc of groupsSnapshot.docs) {
                const groupId = groupDoc.id;
                console.log(`🔍 Checking group: ${groupId}`);
                
                try {
                    const playersSnapshot = await db.collection(`groups/${groupId}/players`).get();
                    
                    if (!playersSnapshot.empty) {
                        groupCount++;
                        playersSnapshot.forEach(doc => {
                            const playerData = doc.data();
                            this.players.push({
                                id: doc.id,
                                ...playerData,
                                groupId: groupId,
                                source: 'group'
                            });
                        });
                        console.log(`   ✅ Found ${playersSnapshot.size} players in group ${groupId}`);
                    }
                } catch (error) {
                    console.warn(`   ⚠️ Could not access players in group ${groupId}:`, error.message);
                }
            }
            
            // Also load authenticated players from futbol_users
            console.log('🔍 Loading authenticated players from futbol_users...');
            try {
                const usersSnapshot = await db.collection('futbol_users').get();
                let authPlayerCount = 0;
                
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    if (userData.attributes && userData.ovr) {
                        // Check if this player already exists in groups (avoid duplicates)
                        const existingPlayer = this.players.find(p => p.id === doc.id);
                        if (!existingPlayer) {
                            this.players.push({
                                id: doc.id,
                                name: userData.name || userData.email || 'Sin nombre',
                                attributes: userData.attributes,
                                ovr: userData.ovr,
                                originalOVR: userData.originalOVR,
                                hasBeenEvaluated: userData.hasBeenEvaluated,
                                position: userData.position,
                                source: 'authenticated',
                                isAuthenticated: true,
                                email: userData.email
                            });
                            authPlayerCount++;
                        } else {
                            // Update existing player with authenticated data
                            existingPlayer.isAuthenticated = true;
                            existingPlayer.email = userData.email;
                        }
                    }
                });
                
                console.log(`   ✅ Found ${authPlayerCount} unique authenticated players`);
                
            } catch (error) {
                console.warn('⚠️ Could not access futbol_users:', error.message);
            }
            
            console.log(`🎯 TOTAL LOADED: ${this.players.length} players from ${groupCount} groups`);
            
            // Show breakdown by source
            const groupPlayers = this.players.filter(p => p.source === 'group');
            const authPlayers = this.players.filter(p => p.source === 'authenticated');
            console.log(`   📊 Group players: ${groupPlayers.length}`);
            console.log(`   📊 Authenticated players: ${authPlayers.length}`);
            
            this.displayPlayers();
            
        } catch (error) {
            console.error('❌ Error loading players:', error);
            this.showError('players-list', 'Error cargando jugadores: ' + error.message);
        }
    },

    /**
     * Display players in the UI - Enhanced with source and group info
     */
    displayPlayers() {
        const container = document.getElementById('players-list');
        
        if (this.players.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay jugadores registrados</div>';
            return;
        }

        let html = '';
        this.players.forEach(player => {
            const photoHtml = player.photo ? 
                `<img src="${player.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 15px;">` :
                '<div style="width: 40px; height: 40px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px;">👤</div>';
            
            // Source badge
            const sourceBadge = player.source === 'authenticated' ? 
                '<span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 8px;">🔐 AUTH</span>' :
                '<span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 8px;">👥 GROUP</span>';
            
            // Evaluation status
            const evalBadge = player.hasBeenEvaluated ? 
                '<span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">📊 EVALUADO</span>' : 
                '<span style="background: #95a5a6; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">⏳ SIN EVALUAR</span>';
            
            html += `
                <div class="data-item" data-id="${player.id}">
                    <div class="item-info" style="display: flex; align-items: center;">
                        ${photoHtml}
                        <div>
                            <div class="item-title">
                                ${player.name || 'Sin nombre'} ${sourceBadge} ${evalBadge}
                            </div>
                            <div class="item-details">
                                ${player.position || 'Sin posición'} | OVR: ${player.ovr || 'N/A'} ${player.originalOVR ? `(Original: ${player.originalOVR})` : ''}
                                <br>PAC:${player.attributes?.pac || 0} SHO:${player.attributes?.sho || 0} PAS:${player.attributes?.pas || 0} DRI:${player.attributes?.dri || 0} DEF:${player.attributes?.def || 0} PHY:${player.attributes?.phy || 0}
                                <br>${player.groupId ? `🏘️ Grupo: ${player.groupId}` : ''}${player.email ? ` | 📧 ${player.email}` : ''} | 🆔 ${player.id}
                            </div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewPlayerDetails('${player.id}')">👁️ Ver</button>
                        <button class="btn btn-sm btn-warning" onclick="AdminPanel.resetPlayerTo('${player.id}', 50)">🔄 Reset</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deletePlayer('${player.id}')">🗑️ Borrar</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Load all matches from Firebase (including nested structure)
     */
    async loadMatches() {
        console.log('⚽ Loading matches from nested structure...');
        
        try {
            this.matches = [];
            
            if (db) {
                // Load from nested structure first (groups/{groupId}/matches)
                const groupsSnapshot = await db.collection('groups').get();
                
                for (const groupDoc of groupsSnapshot.docs) {
                    const groupId = groupDoc.id;
                    const matchesSnapshot = await db.collection('groups').doc(groupId).collection('matches').get();
                    
                    if (!matchesSnapshot.empty) {
                        matchesSnapshot.forEach(doc => {
                            const matchData = doc.data();
                            this.matches.push({
                                id: doc.id,
                                ...matchData,
                                _collection: `groups/${groupId}/matches`,
                                _groupId: groupId
                            });
                        });
                        
                        console.log(`Found ${matchesSnapshot.size} matches in group '${groupId}'`);
                    }
                }
                
                // If no matches found in nested structure, try flat collections
                if (this.matches.length === 0) {
                    console.log('No matches in nested structure, trying flat collections...');
                    const snapshot = await db.collection('matches').get();
                    snapshot.forEach(doc => {
                        const matchData = doc.data();
                        matchData.id = doc.id;
                        matchData._collection = 'matches';
                        this.matches.push(matchData);
                    });
                }
                
                this.displayMatches();
                console.log(`✅ Loaded ${this.matches.length} matches total`);
            }
        } catch (error) {
            console.error('❌ Error loading matches:', error);
            this.showError('matches-list', 'Error cargando partidos');
        }
    },

    /**
     * Load evaluations from Firebase
     */
    async loadEvaluations() {
        console.log('📊 Loading evaluations...');
        
        try {
            this.evaluations = [];
            
            if (db) {
                const snapshot = await db.collection('evaluations').orderBy('createdAt', 'desc').get();
                snapshot.forEach(doc => {
                    const evalData = doc.data();
                    this.evaluations.push({
                        id: doc.id,
                        ...evalData
                    });
                });
                
                this.displayEvaluations();
                console.log(`✅ Loaded ${this.evaluations.length} evaluations total`);
            }
        } catch (error) {
            console.error('❌ Error loading evaluations:', error);
            this.showError('evaluations-list', 'Error cargando evaluaciones');
        }
    },

    /**
     * Display matches in the UI
     */
    displayMatches() {
        const container = document.getElementById('matches-list');
        
        if (this.matches.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay partidos registrados</div>';
            return;
        }

        let html = '';
        // Sort matches by date (newest first)
        const sortedMatches = [...this.matches].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt);
            const dateB = new Date(b.date || b.createdAt);
            return dateB - dateA;
        });

        sortedMatches.forEach(match => {
            const matchDate = new Date(match.date || match.createdAt);
            const dateStr = matchDate.toLocaleDateString();
            const timeStr = matchDate.toLocaleTimeString();
            
            const statusBadge = this.getStatusBadge(match.status);
            
            html += `
                <div class="data-item" data-id="${match.id}">
                    <div class="item-info">
                        <div class="item-title">
                            ${match.teamA?.name || 'Equipo A'} (${match.teamA?.ovr || 0}) vs ${match.teamB?.name || 'Equipo B'} (${match.teamB?.ovr || 0})
                        </div>
                        <div class="item-details">
                            📅 ${dateStr} ${timeStr} | ⚽ ${match.format || '5v5'} | ⚖️ Balance: ${match.difference || 0} OVR | ${statusBadge}
                            <br>Jugadores: ${match.teamA?.players?.length || 0} vs ${match.teamB?.players?.length || 0} | ID: ${match.id}
                            ${match.teamA?.score !== null && match.teamB?.score !== null ? `<br>📊 Resultado: ${match.teamA.score} - ${match.teamB.score}` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewMatchDetails('${match.id}')">Ver</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteMatch('${match.id}')">Borrar</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Display evaluations in the UI
     */
    displayEvaluations() {
        const container = document.getElementById('evaluations-list');
        
        if (this.evaluations.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay evaluaciones registradas</div>';
            return;
        }

        let html = '';
        this.evaluations.forEach(evaluation => {
            const evalDate = new Date(evaluation.createdAt || Date.now());
            const dateStr = evalDate.toLocaleDateString();
            const timeStr = evalDate.toLocaleTimeString();
            
            const totalAssignments = Object.keys(evaluation.assignments || {}).length;
            const completedCount = Object.keys(evaluation.completed || {}).length;
            const participationRate = Math.round((evaluation.participationRate || 0) * 100);
            
            // Status badge
            let statusBadge = '';
            switch (evaluation.status) {
                case 'pending':
                    statusBadge = '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⏳ Pendiente</span>';
                    break;
                case 'expired':
                    statusBadge = '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⏰ Expirada</span>';
                    break;
                case 'completed':
                    statusBadge = '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">✅ Completada</span>';
                    break;
                default:
                    statusBadge = `<span style="background: #95a5a6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">❓ ${evaluation.status}</span>`;
            }
            
            html += `
                <div class="data-item" data-id="${evaluation.id}">
                    <div class="item-info">
                        <div class="item-title">
                            ${evaluation.matchName || 'Partido sin nombre'} | ${evaluation.matchType || 'manual'}
                        </div>
                        <div class="item-details">
                            📅 ${dateStr} ${timeStr} | 👥 Completadas: ${completedCount}/${totalAssignments} | 📊 Participación: ${participationRate}% | ${statusBadge}
                            <br>🎯 OVRs Actualizados: ${evaluation.ovrUpdateTriggered ? '✅ Sí' : '❌ No'} | ID: ${evaluation.id}
                            ${evaluation.deadline ? `<br>⏰ Vence: ${new Date(evaluation.deadline).toLocaleString()}` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewEvaluationDetails('${evaluation.id}')">Ver</button>
                        <button class="btn btn-sm btn-warning" onclick="AdminPanel.forceEvaluationUpdate('${evaluation.id}')">Forzar OVR</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteEvaluation('${evaluation.id}')">Borrar</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const badges = {
            'scheduled': '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">📅 Programado</span>',
            'in_evaluation': '<span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⏳ Evaluando</span>',
            'evaluated': '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">✅ Evaluado</span>'
        };
        return badges[status] || `<span style="background: #95a5a6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">❓ ${status}</span>`;
    },

    /**
     * Load all users from Firebase
     */
    async loadUsers() {
        console.log('👤 Loading users...');
        
        try {
            if (db) {
                const snapshot = await db.collection('persons').get();
                this.users = [];
                snapshot.forEach(doc => {
                    const userData = doc.data();
                    userData.id = doc.id;
                    this.users.push(userData);
                });
                
                this.displayUsers();
                console.log(`✅ Loaded ${this.users.length} users`);
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.showError('users-list', 'Error cargando usuarios');
        }
    },

    /**
     * Display users in the UI
     */
    displayUsers() {
        const container = document.getElementById('users-list');
        
        if (this.users.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay usuarios registrados</div>';
            return;
        }

        let html = '';
        this.users.forEach(user => {
            html += `
                <div class="data-item" data-id="${user.id}">
                    <div class="item-info">
                        <div class="item-title">${user.name || 'Sin nombre'}</div>
                        <div class="item-details">
                            📧 ${user.email || 'Sin email'} | 🆔 ${user.id}
                            <br>Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Fecha desconocida'}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewUserDetails('${user.id}')">Ver</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteUser('${user.id}')">Borrar</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Load all groups from Firebase
     */
    async loadGroups() {
        console.log('🏘️ Loading groups...');
        
        try {
            if (db) {
                const snapshot = await db.collection('groups').get();
                this.groups = [];
                snapshot.forEach(doc => {
                    const groupData = doc.data();
                    groupData.id = doc.id;
                    this.groups.push(groupData);
                });
                
                this.displayGroups();
                console.log(`✅ Loaded ${this.groups.length} groups`);
            }
        } catch (error) {
            console.error('❌ Error loading groups:', error);
            this.showError('groups-list', 'Error cargando grupos');
        }
    },

    /**
     * Display groups in the UI
     */
    displayGroups() {
        const container = document.getElementById('groups-list');
        
        if (this.groups.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay grupos registrados</div>';
            return;
        }

        let html = '';
        this.groups.forEach(group => {
            html += `
                <div class="data-item" data-id="${group.id}">
                    <div class="item-info">
                        <div class="item-title">${group.name || 'Sin nombre'}</div>
                        <div class="item-details">
                            📝 ${group.description || 'Sin descripción'} | 🆔 ${group.id}
                            <br>Creado: ${group.createdAt ? new Date(group.createdAt).toLocaleString() : 'Fecha desconocida'}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewGroupDetails('${group.id}')">Ver</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteGroup('${group.id}')">Borrar</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Filter items in current section
     */
    filterItems(section) {
        const searchInput = document.getElementById(`${section}-search`);
        const searchTerm = searchInput.value.toLowerCase();
        const items = document.querySelectorAll(`#${section}-list .data-item`);
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Delete single player
     */
    async deletePlayer(playerId) {
        if (!confirm('¿Estás seguro de eliminar este jugador? Esta acción es irreversible.')) {
            return;
        }

        try {
            await db.collection('players').doc(playerId).delete();
            console.log(`✅ Player deleted: ${playerId}`);
            
            // Remove from local array
            this.players = this.players.filter(p => p.id !== playerId);
            
            // Update UI
            this.displayPlayers();
            this.updateOverviewStats();
            
            this.showNotification('Jugador eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting player:', error);
            this.showNotification('Error eliminando jugador', 'error');
        }
    },

    /**
     * Delete single match
     */
    async deleteMatch(matchId) {
        if (!confirm('¿Estás seguro de eliminar este partido? Esta acción es irreversible.')) {
            return;
        }

        try {
            await db.collection('matches').doc(matchId).delete();
            console.log(`✅ Match deleted: ${matchId}`);
            
            // Remove from local array
            this.matches = this.matches.filter(m => m.id !== matchId);
            
            // Update UI
            this.displayMatches();
            this.updateOverviewStats();
            
            this.showNotification('Partido eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting match:', error);
            this.showNotification('Error eliminando partido', 'error');
        }
    },

    /**
     * Delete single user
     */
    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.')) {
            return;
        }

        try {
            await db.collection('persons').doc(userId).delete();
            console.log(`✅ User deleted: ${userId}`);
            
            // Remove from local array
            this.users = this.users.filter(u => u.id !== userId);
            
            // Update UI
            this.displayUsers();
            this.updateOverviewStats();
            
            this.showNotification('Usuario eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            this.showNotification('Error eliminando usuario', 'error');
        }
    },

    /**
     * Delete single group
     */
    async deleteGroup(groupId) {
        if (!confirm('¿Estás seguro de eliminar este grupo? Esta acción es irreversible.')) {
            return;
        }

        try {
            await db.collection('groups').doc(groupId).delete();
            console.log(`✅ Group deleted: ${groupId}`);
            
            // Remove from local array
            this.groups = this.groups.filter(g => g.id !== groupId);
            
            // Update UI
            this.displayGroups();
            this.updateOverviewStats();
            
            this.showNotification('Grupo eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting group:', error);
            this.showNotification('Error eliminando grupo', 'error');
        }
    },

    /**
     * View evaluation details
     */
    async viewEvaluationDetails(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) {
            alert('Evaluación no encontrada');
            return;
        }

        const totalAssignments = Object.keys(evaluation.assignments || {}).length;
        const completedCount = Object.keys(evaluation.completed || {}).length;
        const participationRate = Math.round((evaluation.participationRate || 0) * 100);
        
        let details = `DETALLES DE EVALUACIÓN:\n`;
        details += `===============================\n\n`;
        details += `Partido: ${evaluation.matchName || 'Sin nombre'}\n`;
        details += `Tipo: ${evaluation.matchType || 'manual'}\n`;
        details += `Estado: ${evaluation.status}\n`;
        details += `Creada: ${new Date(evaluation.createdAt || Date.now()).toLocaleString()}\n`;
        
        if (evaluation.deadline) {
            details += `Vence: ${new Date(evaluation.deadline).toLocaleString()}\n`;
        }
        
        details += `\nPARTICIPACIÓN:\n`;
        details += `Asignaciones totales: ${totalAssignments}\n`;
        details += `Completadas: ${completedCount}\n`;
        details += `Tasa de participación: ${participationRate}%\n`;
        details += `OVRs actualizados: ${evaluation.ovrUpdateTriggered ? 'Sí' : 'No'}\n`;
        
        if (evaluation.ovrUpdatedAt) {
            details += `Fecha actualización OVR: ${new Date(evaluation.ovrUpdatedAt).toLocaleString()}\n`;
        }
        
        details += `\nASIGNACIONES:\n`;
        details += `--------------\n`;
        
        if (evaluation.assignments) {
            Object.entries(evaluation.assignments).forEach(([playerId, assignment]) => {
                details += `\n• ${assignment.playerName || playerId}:\n`;
                details += `  Estado: ${assignment.completed ? '✅ Completada' : '⏳ Pendiente'}\n`;
                
                if (assignment.toEvaluate) {
                    details += `  Debe evaluar a: ${assignment.toEvaluate.map(p => p.name).join(', ')}\n`;
                }
                
                if (assignment.completed && assignment.evaluations) {
                    details += `  Evaluaciones realizadas: ${Object.keys(assignment.evaluations).length}\n`;
                    details += `  Completada el: ${assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'Fecha desconocida'}\n`;
                }
            });
        }
        
        alert(details);
    },

    /**
     * Force evaluation OVR update
     */
    async forceEvaluationUpdate(evaluationId) {
        if (!confirm('¿Forzar actualización de OVRs para esta evaluación?\n\nEsto actualizará los OVRs de los jugadores basándose en las evaluaciones completadas hasta el momento.')) {
            return;
        }

        try {
            const evaluation = this.evaluations.find(e => e.id === evaluationId);
            if (!evaluation) {
                throw new Error('Evaluación no encontrada');
            }

            // Use the unified evaluation system if available
            if (window.UnifiedEvaluationSystem) {
                await window.UnifiedEvaluationSystem.updatePlayerOVRs(evaluation);
                this.showNotification('OVRs actualizados forzosamente', 'success');
            } else {
                throw new Error('Sistema de evaluación unificado no disponible');
            }
            
            // Reload evaluations to show changes
            await this.loadEvaluations();
            
        } catch (error) {
            console.error('Error forcing OVR update:', error);
            this.showNotification('Error forzando actualización de OVRs: ' + error.message, 'error');
        }
    },

    /**
     * Delete evaluation
     */
    async deleteEvaluation(evaluationId) {
        if (!confirm('¿Estás seguro de eliminar esta evaluación? Esta acción es irreversible.')) {
            return;
        }

        try {
            await db.collection('evaluations').doc(evaluationId).delete();
            console.log(`✅ Evaluation deleted: ${evaluationId}`);
            
            // Remove from local array
            this.evaluations = this.evaluations.filter(e => e.id !== evaluationId);
            
            // Update UI
            this.displayEvaluations();
            this.updateOverviewStats();
            
            this.showNotification('Evaluación eliminada correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting evaluation:', error);
            this.showNotification('Error eliminando evaluación', 'error');
        }
    },

    /**
     * Clean expired evaluations
     */
    async cleanExpiredEvaluations() {
        if (!confirm('¿Eliminar todas las evaluaciones expiradas?')) {
            return;
        }

        try {
            const expiredEvaluations = this.evaluations.filter(e => 
                e.status === 'expired' || (e.deadline && Date.now() > e.deadline)
            );
            
            for (const evaluation of expiredEvaluations) {
                await db.collection('evaluations').doc(evaluation.id).delete();
            }
            
            console.log(`✅ Cleaned ${expiredEvaluations.length} expired evaluations`);
            
            // Reload evaluations
            await this.loadEvaluations();
            this.updateOverviewStats();
            
            this.showNotification(`${expiredEvaluations.length} evaluaciones expiradas eliminadas`, 'success');
            
        } catch (error) {
            console.error('❌ Error cleaning expired evaluations:', error);
            this.showNotification('Error limpiando evaluaciones expiradas', 'error');
        }
    },

    /**
     * Delete all evaluations (DANGER ZONE)
     */
    async deleteAllEvaluations() {
        if (!confirm('⚠️ ¿ELIMINAR TODAS LAS EVALUACIONES? Esta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar TODAS las evaluaciones de la base de datos?')) {
            return;
        }

        try {
            const batch = db.batch();
            this.evaluations.forEach(evaluation => {
                const ref = db.collection('evaluations').doc(evaluation.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            console.log(`💥 Deleted ALL ${this.evaluations.length} evaluations`);
            
            this.evaluations = [];
            this.displayEvaluations();
            this.updateOverviewStats();
            
            this.showNotification('TODAS las evaluaciones eliminadas', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting all evaluations:', error);
            this.showNotification('Error eliminando evaluaciones', 'error');
        }
    },

    /**
     * Clean pending matches
     */
    async cleanPendingMatches() {
        if (!confirm('¿Eliminar todos los partidos pendientes (no evaluados)?')) {
            return;
        }

        try {
            const pendingMatches = this.matches.filter(m => m.status !== 'evaluated');
            
            for (const match of pendingMatches) {
                await db.collection('matches').doc(match.id).delete();
            }
            
            console.log(`✅ Cleaned ${pendingMatches.length} pending matches`);
            
            // Reload matches
            await this.loadMatches();
            this.updateOverviewStats();
            
            this.showNotification(`${pendingMatches.length} partidos pendientes eliminados`, 'success');
            
        } catch (error) {
            console.error('❌ Error cleaning pending matches:', error);
            this.showNotification('Error limpiando partidos pendientes', 'error');
        }
    },

    /**
     * Delete evaluated matches
     */
    async deleteEvaluatedMatches() {
        if (!confirm('¿Eliminar todos los partidos evaluados? Esta acción es irreversible.')) {
            return;
        }

        try {
            const evaluatedMatches = this.matches.filter(m => m.status === 'evaluated');
            
            for (const match of evaluatedMatches) {
                await db.collection('matches').doc(match.id).delete();
            }
            
            console.log(`✅ Deleted ${evaluatedMatches.length} evaluated matches`);
            
            // Reload matches
            await this.loadMatches();
            this.updateOverviewStats();
            
            this.showNotification(`${evaluatedMatches.length} partidos evaluados eliminados`, 'success');
            
        } catch (error) {
            console.error('❌ Error deleting evaluated matches:', error);
            this.showNotification('Error eliminando partidos evaluados', 'error');
        }
    },

    /**
     * Delete all players (DANGER ZONE)
     */
    async deleteAllPlayers() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS JUGADORES? Esta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar TODOS los jugadores de la base de datos?')) {
            return;
        }

        try {
            const batch = db.batch();
            this.players.forEach(player => {
                const ref = db.collection('players').doc(player.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            console.log(`💥 Deleted ALL ${this.players.length} players`);
            
            this.players = [];
            this.displayPlayers();
            this.updateOverviewStats();
            
            this.showNotification('TODOS los jugadores eliminados', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting all players:', error);
            this.showNotification('Error eliminando jugadores', 'error');
        }
    },

    /**
     * Delete all matches (DANGER ZONE)
     */
    async deleteAllMatches() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS PARTIDOS? Esta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar TODOS los partidos de la base de datos?')) {
            return;
        }

        try {
            const batch = db.batch();
            this.matches.forEach(match => {
                const ref = db.collection('matches').doc(match.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            console.log(`💥 Deleted ALL ${this.matches.length} matches`);
            
            this.matches = [];
            this.displayMatches();
            this.updateOverviewStats();
            
            this.showNotification('TODOS los partidos eliminados', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting all matches:', error);
            this.showNotification('Error eliminando partidos', 'error');
        }
    },

    /**
     * Delete all users (DANGER ZONE)
     */
    async deleteAllUsers() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS USUARIOS? Esta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar TODOS los usuarios de la base de datos?')) {
            return;
        }

        try {
            const batch = db.batch();
            this.users.forEach(user => {
                const ref = db.collection('persons').doc(user.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            console.log(`💥 Deleted ALL ${this.users.length} users`);
            
            this.users = [];
            this.displayUsers();
            this.updateOverviewStats();
            
            this.showNotification('TODOS los usuarios eliminados', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting all users:', error);
            this.showNotification('Error eliminando usuarios', 'error');
        }
    },

    /**
     * Delete all groups (DANGER ZONE)
     */
    async deleteAllGroups() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS GRUPOS? Esta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar TODOS los grupos de la base de datos?')) {
            return;
        }

        try {
            const batch = db.batch();
            this.groups.forEach(group => {
                const ref = db.collection('groups').doc(group.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            console.log(`💥 Deleted ALL ${this.groups.length} groups`);
            
            this.groups = [];
            this.displayGroups();
            this.updateOverviewStats();
            
            this.showNotification('TODOS los grupos eliminados', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting all groups:', error);
            this.showNotification('Error eliminando grupos', 'error');
        }
    },

    /**
     * NUCLEAR OPTION - Delete everything
     */
    async nukeEverything() {
        if (!confirm('💥 ⚠️ PELIGRO EXTREMO ⚠️ 💥\n\n¿ELIMINAR TODO DE LA BASE DE DATOS?\n\nEsto incluye:\n- Todos los jugadores\n- Todos los partidos\n- Todos los usuarios\n- Todos los grupos\n\nEsta acción es COMPLETAMENTE IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨🚨🚨 ÚLTIMA OPORTUNIDAD 🚨🚨🚨\n\n¿Estás ABSOLUTAMENTE seguro?\n\nEscribe "ELIMINAR TODO" en la siguiente ventana para confirmar.')) {
            return;
        }
        
        const confirmation = prompt('Escribe exactamente "ELIMINAR TODO" para confirmar:');
        if (confirmation !== 'ELIMINAR TODO') {
            alert('Confirmación incorrecta. Operación cancelada.');
            return;
        }

        try {
            console.log('💥 NUCLEAR OPTION ACTIVATED - DELETING EVERYTHING');
            
            // Delete all collections
            await Promise.all([
                this.deleteAllPlayers(),
                this.deleteAllMatches(),
                this.deleteAllUsers(),
                this.deleteAllGroups()
            ]);
            
            console.log('💥 EVERYTHING DELETED FROM DATABASE');
            
            this.showNotification('💥 BASE DE DATOS COMPLETAMENTE LIMPIA 💥', 'success');
            
            // Refresh everything
            setTimeout(() => {
                this.refreshAll();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error in nuclear deletion:', error);
            this.showNotification('Error en eliminación completa', 'error');
        }
    },

    /**
     * CLEANUP FUNCTIONS FOR TEST DATA
     */

    /**
     * Clean test players (guests and test names)
     */
    async cleanTestPlayers() {
        if (!confirm('¿Eliminar jugadores de prueba?\n\nEsto incluye:\n- Jugadores invitados\n- Jugadores con nombres de prueba\n- Jugadores creados recientemente')) {
            return;
        }

        try {
            let deletedCount = 0;
            const batch = db.batch();
            const now = Date.now();
            const dayAgo = now - (24 * 60 * 60 * 1000); // 24 horas
            
            for (const player of this.players) {
                let isTestPlayer = false;
                
                // Check for test indicators
                if (player.isGuest ||
                    player.name?.toLowerCase().includes('test') ||
                    player.name?.toLowerCase().includes('prueba') ||
                    player.name?.toLowerCase().includes('ejemplo') ||
                    (player.createdAt && player.createdAt > dayAgo)) {
                    
                    isTestPlayer = true;
                }
                
                if (isTestPlayer) {
                    // Delete from appropriate collection
                    if (player.source === 'authenticated') {
                        batch.delete(db.collection('futbol_users').doc(player.id));
                    }
                    if (player.groupId) {
                        batch.delete(db.collection(`groups/${player.groupId}/players`).doc(player.id));
                    }
                    
                    deletedCount++;
                }
            }
            
            if (deletedCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${deletedCount} test players`);
                
                // Reload data
                await this.loadPlayers();
                this.updateOverviewStats();
                
                this.showNotification(`${deletedCount} jugadores de prueba eliminados`, 'success');
            } else {
                this.showNotification('No se encontraron jugadores de prueba', 'info');
            }
            
        } catch (error) {
            console.error('❌ Error cleaning test players:', error);
            this.showNotification('Error limpiando jugadores de prueba', 'error');
        }
    },

    /**
     * Clean test matches (recent or with test names)
     */
    async cleanTestMatches() {
        if (!confirm('¿Eliminar partidos de prueba?\n\nEsto incluye:\n- Partidos creados en las últimas 48 horas\n- Partidos con nombres de prueba')) {
            return;
        }

        try {
            let deletedCount = 0;
            const batch = db.batch();
            const now = Date.now();
            const twoDaysAgo = now - (48 * 60 * 60 * 1000); // 48 horas
            
            for (const match of this.matches) {
                let isTestMatch = false;
                
                // Check for test indicators
                if ((match.createdAt && match.createdAt > twoDaysAgo) ||
                    match.name?.toLowerCase().includes('test') ||
                    match.name?.toLowerCase().includes('prueba') ||
                    match.teamA?.name?.toLowerCase().includes('test') ||
                    match.teamB?.name?.toLowerCase().includes('test')) {
                    
                    isTestMatch = true;
                }
                
                if (isTestMatch) {
                    // Delete from appropriate collection
                    if (match._groupId) {
                        batch.delete(db.collection(`groups/${match._groupId}/matches`).doc(match.id));
                    } else {
                        batch.delete(db.collection('matches').doc(match.id));
                    }
                    
                    deletedCount++;
                }
            }
            
            if (deletedCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${deletedCount} test matches`);
                
                // Reload data
                await this.loadMatches();
                this.updateOverviewStats();
                
                this.showNotification(`${deletedCount} partidos de prueba eliminados`, 'success');
            } else {
                this.showNotification('No se encontraron partidos de prueba', 'info');
            }
            
        } catch (error) {
            console.error('❌ Error cleaning test matches:', error);
            this.showNotification('Error limpiando partidos de prueba', 'error');
        }
    },

    /**
     * Clean all test data (comprehensive cleanup)
     */
    async cleanAllTestData() {
        if (!confirm('🚨 LIMPIEZA COMPLETA DE DATOS DE PRUEBA \n\nEsto eliminará:\n- Jugadores invitados y de prueba\n- Partidos recientes y de prueba\n- Evaluaciones expiradas\n\n¿Continuar?')) {
            return;
        }

        try {
            this.showNotification('Iniciando limpieza completa de datos de prueba...', 'info');
            
            // Run all cleanup functions in sequence
            await this.cleanTestPlayers();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            await this.cleanTestMatches();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            await this.cleanExpiredEvaluations();
            
            // Final refresh
            await this.refreshAll();
            
            this.showNotification('✅ Limpieza completa de datos de prueba finalizada', 'success');
            console.log('🤖 Complete test data cleanup finished');
            
        } catch (error) {
            console.error('❌ Error during complete test data cleanup:', error);
            this.showNotification('Error en limpieza completa', 'error');
        }
    },

    /**
     * RESET FUNCTIONS - The core formulas requested by user
     */
    
    /**
     * Reset all players to 50 stats - Main requested function
     */
    async resetAllPlayersTo50() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres resetear TODOS los jugadores a 50 en todas las estadísticas?\n\nEsto afectará:\n- Todas las estadísticas (PAC, SHO, PAS, DRI, DEF, PHY)\n- OVR calculado según posición\n- originalOVR establecido\n- hasBeenEvaluated en false')) {
            return;
        }

        console.log('🔄 Starting player stats reset to 50...');
        this.showNotification('Iniciando reset de jugadores a 50...', 'info');
        
        try {
            // Load current players
            await this.loadPlayers();
            
            if (this.players.length === 0) {
                alert('❌ No se encontraron jugadores para resetear');
                return;
            }

            console.log(`👥 Found ${this.players.length} players to reset`);
            
            // Reset each player
            let successful = 0;
            let failed = 0;
            
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                console.log(`🔄 [${i + 1}/${this.players.length}] Resetting ${player.name}...`);
                
                try {
                    const resetPlayerData = {
                        ...player,
                        attributes: {
                            pac: 50,
                            sho: 50,
                            pas: 50,
                            dri: 50,
                            def: 50,
                            phy: 50
                        },
                        ovr: this.calculatePositionBasedOVR({
                            pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50
                        }, player.position || 'MED'),
                        hasBeenEvaluated: false,
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Set originalOVR to the new calculated OVR
                    resetPlayerData.originalOVR = resetPlayerData.ovr;
                    
                    console.log(`   📊 ${player.name}: OVR ${player.ovr || '??'} → ${resetPlayerData.ovr}`);
                    
                    // Save player - Direct Firebase update to both locations if needed
                    await this.updatePlayerInDatabase(player, resetPlayerData);
                    
                    successful++;
                    console.log(`   ✅ ${player.name} updated successfully`);
                    
                } catch (error) {
                    failed++;
                    console.error(`   ❌ Error updating ${player.name}:`, error);
                }
            }
            
            console.log(`🎉 RESET COMPLETE!`);
            console.log(`✅ Successfully reset: ${successful} players`);
            
            if (failed > 0) {
                console.log(`❌ Failed to reset: ${failed} players`);
            }
            
            // Reload players to show changes
            if (Storage && Storage.loadPlayersFromFirebase) {
                await Storage.loadPlayersFromFirebase();
            }
            
            // Refresh display
            await this.loadPlayers();
            this.updateOverviewStats();
            
            // Refresh TestApp if available
            if (typeof TestApp !== 'undefined' && TestApp.displayPlayers) {
                console.log('🎨 Refreshing TestApp display...');
                TestApp.displayPlayers();
            }
            
            const message = `✅ Reset completado!\n${successful} jugadores reseteados a 50${failed > 0 ? `\n${failed} errores` : ''}`;
            alert(message);
            this.showNotification(`Reset completo: ${successful} jugadores reseteados`, 'success');
            
        } catch (error) {
            console.error('❌ Error during player reset:', error);
            alert('❌ Error durante el reset: ' + error.message);
            this.showNotification('Error durante el reset', 'error');
        }
    },

    /**
     * Reset all players to custom value
     */
    async resetAllPlayersToCustom(customValue) {
        const value = customValue || parseInt(prompt('¿A qué valor quieres resetear todas las estadísticas? (0-100):', '50'));
        
        if (isNaN(value) || value < 0 || value > 100) {
            alert('❌ Valor inválido. Debe ser un número entre 0 y 100');
            return;
        }

        if (!confirm(`⚠️ ¿Resetear TODOS los jugadores a ${value} en todas las estadísticas?`)) {
            return;
        }

        console.log(`🔄 Starting player stats reset to ${value}...`);
        this.showNotification(`Iniciando reset de jugadores a ${value}...`, 'info');
        
        try {
            await this.loadPlayers();
            
            if (this.players.length === 0) {
                alert('❌ No se encontraron jugadores para resetear');
                return;
            }

            let successful = 0;
            let failed = 0;
            
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                console.log(`🔄 [${i + 1}/${this.players.length}] Resetting ${player.name} to ${value}...`);
                
                try {
                    const resetPlayerData = {
                        ...player,
                        attributes: {
                            pac: value,
                            sho: value,
                            pas: value,
                            dri: value,
                            def: value,
                            phy: value
                        },
                        ovr: this.calculatePositionBasedOVR({
                            pac: value, sho: value, pas: value, dri: value, def: value, phy: value
                        }, player.position || 'MED'),
                        hasBeenEvaluated: false,
                        updatedAt: new Date().toISOString()
                    };
                    
                    resetPlayerData.originalOVR = resetPlayerData.ovr;
                    
                    await this.updatePlayerInDatabase(player, resetPlayerData);
                    
                    successful++;
                    
                } catch (error) {
                    failed++;
                    console.error(`   ❌ Error updating ${player.name}:`, error);
                }
            }
            
            await this.loadPlayers();
            this.updateOverviewStats();
            
            if (typeof TestApp !== 'undefined' && TestApp.displayPlayers) {
                TestApp.displayPlayers();
            }
            
            const message = `✅ Reset a ${value} completado!\n${successful} jugadores actualizados${failed > 0 ? `\n${failed} errores` : ''}`;
            alert(message);
            this.showNotification(`Reset completo: ${successful} jugadores a ${value}`, 'success');
            
        } catch (error) {
            console.error('❌ Error during custom reset:', error);
            alert('❌ Error durante el reset: ' + error.message);
            this.showNotification('Error durante el reset', 'error');
        }
    },

    /**
     * Reset evaluation data only (keep current stats)
     */
    async resetEvaluationDataOnly() {
        if (!confirm('⚠️ ¿Resetear solo los datos de evaluación?\n\nEsto hará:\n- hasBeenEvaluated = false\n- originalOVR = OVR actual\n\nLas estadísticas actuales se mantienen.')) {
            return;
        }

        try {
            await this.loadPlayers();
            
            if (this.players.length === 0) {
                alert('❌ No se encontraron jugadores');
                return;
            }

            let successful = 0;
            let failed = 0;
            
            for (const player of this.players) {
                try {
                    const updatedData = {
                        ...player,
                        originalOVR: player.ovr,
                        hasBeenEvaluated: false,
                        updatedAt: new Date().toISOString()
                    };
                    
                    await this.updatePlayerInDatabase(player, updatedData);
                    
                    successful++;
                    
                } catch (error) {
                    failed++;
                    console.error(`Error updating ${player.name}:`, error);
                }
            }
            
            await this.loadPlayers();
            
            if (typeof TestApp !== 'undefined' && TestApp.displayPlayers) {
                TestApp.displayPlayers();
            }
            
            alert(`✅ Datos de evaluación reseteados!\n${successful} jugadores actualizados${failed > 0 ? `\n${failed} errores` : ''}`);
            this.showNotification(`Evaluaciones reseteadas: ${successful} jugadores`, 'success');
            
        } catch (error) {
            console.error('❌ Error resetting evaluation data:', error);
            alert('❌ Error: ' + error.message);
            this.showNotification('Error reseteando evaluaciones', 'error');
        }
    },

    /**
     * Reset single player to specific value
     */
    async resetPlayerTo(playerId, value = 50) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`Player ${playerId} not found`);
            return;
        }

        try {
            const resetPlayerData = {
                ...player,
                attributes: {
                    pac: value,
                    sho: value,
                    pas: value,
                    dri: value,
                    def: value,
                    phy: value
                },
                ovr: this.calculatePositionBasedOVR({
                    pac: value, sho: value, pas: value, dri: value, def: value, phy: value
                }, player.position || 'MED'),
                hasBeenEvaluated: false,
                updatedAt: new Date().toISOString()
            };
            
            resetPlayerData.originalOVR = resetPlayerData.ovr;
            
            await this.updatePlayerInDatabase(player, resetPlayerData);
            
            console.log(`✅ Player ${player.name} reset to ${value} successfully`);
            
            // Refresh display if in players section
            if (this.currentSection === 'players') {
                await this.loadPlayers();
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error resetting player ${player.name}:`, error);
            return false;
        }
    },

    /**
     * Calculate position-based OVR (same formula as in reset command)
     */
    calculatePositionBasedOVR(attributes, position) {
        const weights = {
            'POR': { pac: 0.1, sho: 0.1, pas: 0.15, dri: 0.1, def: 0.25, phy: 0.3 },
            'DEF': { pac: 0.15, sho: 0.05, pas: 0.15, dri: 0.1, def: 0.35, phy: 0.2 },
            'MED': { pac: 0.15, sho: 0.15, pas: 0.3, dri: 0.25, def: 0.1, phy: 0.05 },
            'DEL': { pac: 0.2, sho: 0.3, pas: 0.15, dri: 0.2, def: 0.05, phy: 0.1 }
        };
        
        const positionWeights = weights[position] || weights['MED'];
        
        return Math.round(
            attributes.pac * positionWeights.pac +
            attributes.sho * positionWeights.sho +
            attributes.pas * positionWeights.pas +
            attributes.dri * positionWeights.dri +
            attributes.def * positionWeights.def +
            attributes.phy * positionWeights.phy
        );
    },

    /**
     * Update player in database - handles both authenticated and group players
     */
    async updatePlayerInDatabase(originalPlayer, updatedPlayerData) {
        const updatePromises = [];
        
        // Update in futbol_users if this is an authenticated player
        if (originalPlayer.isAuthenticated || originalPlayer.source === 'authenticated') {
            const userUpdate = db.collection('futbol_users').doc(originalPlayer.id).update({
                attributes: updatedPlayerData.attributes,
                ovr: updatedPlayerData.ovr,
                originalOVR: updatedPlayerData.originalOVR,
                hasBeenEvaluated: updatedPlayerData.hasBeenEvaluated,
                position: updatedPlayerData.position,
                updatedAt: updatedPlayerData.updatedAt
            });
            updatePromises.push(userUpdate);
        }
        
        // Update in group collection if this player belongs to a group
        if (originalPlayer.groupId) {
            const groupUpdate = db.collection(`groups/${originalPlayer.groupId}/players`).doc(originalPlayer.id).set(updatedPlayerData);
            updatePromises.push(groupUpdate);
        }
        
        // Execute all updates
        await Promise.all(updatePromises);
    },

    /**
     * Export all data
     */
    async exportAllData() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                players: this.players,
                matches: this.matches,
                users: this.users,
                groups: this.groups
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `futbol-stats-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Datos exportados correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            this.showNotification('Error exportando datos', 'error');
        }
    },

    /**
     * Show error in container
     */
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<div class="empty-state" style="color: #e74c3c;">${message}</div>`;
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    },

    /**
     * View detailed information (placeholder functions)
     */
    viewPlayerDetails(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            alert(`Detalles del Jugador:\n\nNombre: ${player.name}\nPosición: ${player.position}\nOVR: ${player.ovr}\n\nAtributos:\nPAC: ${player.attributes?.pac}\nSHO: ${player.attributes?.sho}\nPAS: ${player.attributes?.pas}\nDRI: ${player.attributes?.dri}\nDEF: ${player.attributes?.def}\nPHY: ${player.attributes?.phy}\n\nID: ${player.id}`);
        }
    },

    viewMatchDetails(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            const result = match.teamA?.score !== null && match.teamB?.score !== null ? 
                `\nResultado: ${match.teamA.score} - ${match.teamB.score}` : '';
            alert(`Detalles del Partido:\n\n${match.teamA?.name || 'Equipo A'} vs ${match.teamB?.name || 'Equipo B'}\nFormato: ${match.format || '5v5'}\nEstado: ${match.status}\nBalance: ${match.difference} OVR${result}\n\nID: ${match.id}`);
        }
    },

    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            alert(`Detalles del Usuario:\n\nNombre: ${user.name || 'Sin nombre'}\nEmail: ${user.email || 'Sin email'}\nCreado: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Fecha desconocida'}\n\nID: ${user.id}`);
        }
    },

    viewGroupDetails(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            alert(`Detalles del Grupo:\n\nNombre: ${group.name || 'Sin nombre'}\nDescripción: ${group.description || 'Sin descripción'}\nCreado: ${group.createdAt ? new Date(group.createdAt).toLocaleString() : 'Fecha desconocida'}\n\nID: ${group.id}`);
        }
    },

    /**
     * DATABASE EXPLORER FUNCTIONS
     */

    /**
     * Scan entire Firebase database
     */
    async scanDatabase() {
        console.log('🔍 Scanning entire Firebase database...');
        this.showNotification('Escaneando base de datos completa...', 'info');
        
        try {
            // Known collections to check
            const knownCollections = ['players', 'matches', 'persons', 'groups', 'users'];
            
            // Also try some common alternative names
            const possibleCollections = [
                ...knownCollections,
                'match', 'partido', 'partidos', 'game', 'games',
                'jugador', 'jugadores', 'player',
                'usuario', 'usuarios', 'user',
                'grupo', 'grupos', 'group',
                'evaluation', 'evaluations', 'evaluacion', 'evaluaciones',
                'team', 'teams', 'equipo', 'equipos',
                'stats', 'statistics', 'estadisticas',
                'history', 'historial'
            ];

            this.allCollections = {};
            this.databaseStructure = [];
            let totalDocuments = 0;
            let totalSize = 0;

            for (const collectionName of possibleCollections) {
                try {
                    console.log(`Checking collection: ${collectionName}`);
                    const snapshot = await db.collection(collectionName).get();
                    
                    if (!snapshot.empty) {
                        const docs = [];
                        let collectionSize = 0;
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const docStr = JSON.stringify(data);
                            collectionSize += docStr.length;
                            docs.push({
                                id: doc.id,
                                data: data,
                                size: docStr.length
                            });
                        });

                        this.allCollections[collectionName] = {
                            name: collectionName,
                            count: docs.length,
                            docs: docs,
                            size: collectionSize,
                            sampleData: docs[0]?.data || null
                        };

                        totalDocuments += docs.length;
                        totalSize += collectionSize;

                        console.log(`✅ Found collection '${collectionName}' with ${docs.length} documents`);
                    }
                } catch (error) {
                    // Collection doesn't exist, ignore
                    console.log(`❌ Collection '${collectionName}' not found or empty`);
                }
            }

            // Update stats
            document.getElementById('total-collections').textContent = Object.keys(this.allCollections).length;
            document.getElementById('total-documents').textContent = totalDocuments;
            document.getElementById('total-size').textContent = Math.round(totalSize / 1024);
            
            // Find unknown collections (not in our known list)
            const unknownCollections = Object.keys(this.allCollections).filter(name => 
                !knownCollections.includes(name)
            );
            document.getElementById('unknown-collections').textContent = unknownCollections.length;

            this.displayDatabaseStructure();
            this.updateMatchesFromDatabase();

            console.log(`🎯 Database scan complete! Found ${Object.keys(this.allCollections).length} collections with ${totalDocuments} documents`);
            this.showNotification(`Escaneo completo: ${Object.keys(this.allCollections).length} colecciones, ${totalDocuments} documentos`, 'success');

        } catch (error) {
            console.error('❌ Error scanning database:', error);
            this.showNotification('Error escaneando base de datos', 'error');
        }
    },

    /**
     * Display database structure in UI
     */
    displayDatabaseStructure() {
        const container = document.getElementById('explorer-list');
        
        if (Object.keys(this.allCollections).length === 0) {
            container.innerHTML = '<div class="empty-state">No se encontraron colecciones</div>';
            return;
        }

        let html = '';
        
        for (const [collectionName, collection] of Object.entries(this.allCollections)) {
            const isKnown = ['players', 'matches', 'persons', 'groups', 'users'].includes(collectionName);
            const statusBadge = isKnown ? 
                '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">✅ Conocida</span>' :
                '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">❓ Desconocida</span>';

            html += `
                <div class="data-item" data-id="${collectionName}">
                    <div class="item-info">
                        <div class="item-title">📁 ${collectionName}</div>
                        <div class="item-details">
                            📊 ${collection.count} documentos | 💾 ${Math.round(collection.size / 1024)} KB | ${statusBadge}
                            <br>🔬 Estructura: ${this.analyzeCollectionStructure(collection.sampleData)}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="AdminPanel.viewCollectionData('${collectionName}')">Ver Datos</button>
                        <button class="btn btn-sm btn-warning" onclick="AdminPanel.showRawData('${collectionName}')">Ver JSON</button>
                        ${!isKnown ? `<button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteCollection('${collectionName}')">Borrar</button>` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    /**
     * Analyze collection structure
     */
    analyzeCollectionStructure(sampleData) {
        if (!sampleData) return 'Sin datos';
        
        const keys = Object.keys(sampleData);
        const summary = keys.slice(0, 5).join(', ');
        const more = keys.length > 5 ? ` (+${keys.length - 5} más)` : '';
        
        return `${summary}${more}`;
    },

    /**
     * Update matches from discovered database (including nested structure)
     */
    async updateMatchesFromDatabase() {
        this.matches = [];
        
        // FIRST: Check nested structure (groups/{groupId}/matches)
        try {
            if (db) {
                const groupsSnapshot = await db.collection('groups').get();
                
                for (const groupDoc of groupsSnapshot.docs) {
                    const groupId = groupDoc.id;
                    const matchesSnapshot = await db.collection('groups').doc(groupId).collection('matches').get();
                    
                    if (!matchesSnapshot.empty) {
                        matchesSnapshot.forEach(doc => {
                            const matchData = doc.data();
                            this.matches.push({
                                id: doc.id,
                                ...matchData,
                                _collection: `groups/${groupId}/matches`,
                                _groupId: groupId
                            });
                        });
                        
                        console.log(`🎯 Found ${matchesSnapshot.size} matches in group '${groupId}'`);
                    }
                }
                
                if (this.matches.length > 0) {
                    console.log(`✅ Found ${this.matches.length} matches in nested structure`);
                    this.showNotification(`Encontrados ${this.matches.length} partidos en estructura anidada`, 'success');
                    
                    // Update matches display if we're in matches section
                    if (this.currentSection === 'matches') {
                        this.displayMatches();
                    }
                    
                    // Update overview stats
                    this.updateOverviewStats();
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking nested structure:', error);
        }
        
        // FALLBACK: Check flat collections
        const matchCollectionNames = ['matches', 'match', 'partidos', 'partido', 'games', 'game'];
        
        for (const collectionName of matchCollectionNames) {
            if (this.allCollections[collectionName]) {
                console.log(`🎯 Found matches in flat collection: ${collectionName}`);
                this.matches = this.allCollections[collectionName].docs.map(doc => ({
                    id: doc.id,
                    ...doc.data
                }));
                
                // Update matches display if we're in matches section
                if (this.currentSection === 'matches') {
                    this.displayMatches();
                }
                
                // Update overview stats
                this.updateOverviewStats();
                
                this.showNotification(`Encontrados ${this.matches.length} partidos en '${collectionName}'`, 'success');
                break;
            }
        }
    },

    /**
     * View collection data in a readable format
     */
    viewCollectionData(collectionName) {
        const collection = this.allCollections[collectionName];
        if (!collection) return;

        let details = `Colección: ${collectionName}\n`;
        details += `Documentos: ${collection.count}\n`;
        details += `Tamaño: ${Math.round(collection.size / 1024)} KB\n\n`;
        
        details += 'Primeros 3 documentos:\n';
        details += '================================\n';
        
        collection.docs.slice(0, 3).forEach((doc, index) => {
            details += `\nDocumento ${index + 1} (ID: ${doc.id}):\n`;
            details += JSON.stringify(doc.data, null, 2);
            details += '\n' + '-'.repeat(30) + '\n';
        });

        if (collection.count > 3) {
            details += `\n... y ${collection.count - 3} documentos más`;
        }

        alert(details);
    },

    /**
     * Show raw JSON data
     */
    showRawData(collectionName) {
        const collection = this.allCollections[collectionName];
        if (!collection) return;

        const rawData = {
            collection: collectionName,
            metadata: {
                totalDocuments: collection.count,
                totalSize: collection.size,
                sizeKB: Math.round(collection.size / 1024)
            },
            documents: collection.docs
        };

        document.getElementById('raw-data-title').textContent = `📄 Datos Brutos: ${collectionName}`;
        document.getElementById('raw-data-content').textContent = JSON.stringify(rawData, null, 2);
        document.getElementById('raw-data-viewer').style.display = 'block';
        
        // Scroll to viewer
        document.getElementById('raw-data-viewer').scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Close raw data viewer
     */
    closeRawDataViewer() {
        document.getElementById('raw-data-viewer').style.display = 'none';
    },

    /**
     * Delete entire collection (DANGEROUS)
     */
    async deleteCollection(collectionName) {
        if (!confirm(`⚠️ ¿ELIMINAR TODA LA COLECCIÓN '${collectionName}'?\n\nEsto eliminará TODOS los ${this.allCollections[collectionName].count} documentos de esta colección.\n\nEsta acción es IRREVERSIBLE.`)) {
            return;
        }

        if (!confirm(`🚨 CONFIRMACIÓN FINAL:\n\n¿Realmente quieres eliminar la colección '${collectionName}' con ${this.allCollections[collectionName].count} documentos?\n\nEscribe "ELIMINAR" en el siguiente diálogo para confirmar.`)) {
            return;
        }

        const confirmation = prompt('Escribe "ELIMINAR" para confirmar:');
        if (confirmation !== 'ELIMINAR') {
            alert('Confirmación incorrecta. Operación cancelada.');
            return;
        }

        try {
            const collection = this.allCollections[collectionName];
            const batch = db.batch();
            
            collection.docs.forEach(doc => {
                const ref = db.collection(collectionName).doc(doc.id);
                batch.delete(ref);
            });
            
            await batch.commit();
            
            console.log(`💥 Deleted entire collection '${collectionName}' with ${collection.count} documents`);
            
            // Remove from local storage
            delete this.allCollections[collectionName];
            
            // Refresh display
            this.displayDatabaseStructure();
            
            this.showNotification(`Colección '${collectionName}' eliminada completamente`, 'success');
            
        } catch (error) {
            console.error(`❌ Error deleting collection '${collectionName}':`, error);
            this.showNotification(`Error eliminando colección '${collectionName}'`, 'error');
        }
    },

    /**
     * Show all collections summary
     */
    showAllCollections() {
        if (Object.keys(this.allCollections).length === 0) {
            alert('Primero escanea la base de datos haciendo clic en "Escanear DB Completa"');
            return;
        }

        let summary = 'TODAS LAS COLECCIONES EN FIREBASE:\n';
        summary += '='.repeat(40) + '\n\n';

        for (const [name, collection] of Object.entries(this.allCollections)) {
            const isKnown = ['players', 'matches', 'persons', 'groups', 'users'].includes(name);
            summary += `📁 ${name} ${isKnown ? '✅' : '❓'}\n`;
            summary += `   └─ ${collection.count} documentos (${Math.round(collection.size / 1024)} KB)\n`;
            summary += `   └─ Campos: ${Object.keys(collection.sampleData || {}).join(', ')}\n\n`;
        }

        summary += `\nTOTAL: ${Object.keys(this.allCollections).length} colecciones`;
        
        alert(summary);
    },

    /**
     * Export all raw data
     */
    exportRawData() {
        if (Object.keys(this.allCollections).length === 0) {
            alert('Primero escanea la base de datos haciendo clic en "Escanear DB Completa"');
            return;
        }

        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                databaseScan: true,
                metadata: {
                    totalCollections: Object.keys(this.allCollections).length,
                    totalDocuments: Object.values(this.allCollections).reduce((sum, col) => sum + col.count, 0),
                    totalSize: Object.values(this.allCollections).reduce((sum, col) => sum + col.size, 0)
                },
                collections: this.allCollections
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `firebase-raw-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);

            this.showNotification('Datos brutos exportados correctamente', 'success');

        } catch (error) {
            console.error('❌ Error exporting raw data:', error);
            this.showNotification('Error exportando datos brutos', 'error');
        }
    },

    /**
     * Detect and analyze data structure
     */
    detectDataStructure() {
        if (Object.keys(this.allCollections).length === 0) {
            alert('Primero escanea la base de datos haciendo clic en "Escanear DB Completa"');
            return;
        }

        let analysis = 'ANÁLISIS DE ESTRUCTURA DE DATOS:\n';
        analysis += '='.repeat(45) + '\n\n';

        // Analyze each collection
        for (const [name, collection] of Object.entries(this.allCollections)) {
            analysis += `📁 COLECCIÓN: ${name}\n`;
            analysis += `─`.repeat(30) + '\n';
            analysis += `Documentos: ${collection.count}\n`;
            analysis += `Tamaño: ${Math.round(collection.size / 1024)} KB\n\n`;

            if (collection.sampleData) {
                analysis += 'ESTRUCTURA DETECTADA:\n';
                this.analyzeObjectStructure(collection.sampleData, analysis, '  ');
            }
            analysis += '\n' + '='.repeat(45) + '\n\n';
        }

        // Show recommendations
        analysis += 'RECOMENDACIONES:\n';
        analysis += '─'.repeat(15) + '\n';

        const knownCollections = ['players', 'matches', 'persons', 'groups', 'users'];
        const unknownCollections = Object.keys(this.allCollections).filter(name => 
            !knownCollections.includes(name)
        );

        if (unknownCollections.length > 0) {
            analysis += `⚠️ Colecciones desconocidas encontradas: ${unknownCollections.join(', ')}\n`;
            analysis += 'Considera revisar si son necesarias o eliminarlas.\n\n';
        }

        // Check for matches in different collections
        const matchCollections = Object.keys(this.allCollections).filter(name => 
            name.includes('match') || name.includes('partido') || name.includes('game')
        );

        if (matchCollections.length > 0) {
            analysis += `🎯 Partidos encontrados en: ${matchCollections.join(', ')}\n`;
            analysis += 'El sistema está configurado para buscar en "matches" por defecto.\n\n';
        }

        alert(analysis);
    },

    /**
     * Analyze object structure recursively
     */
    analyzeObjectStructure(obj, analysis, indent) {
        for (const [key, value] of Object.entries(obj)) {
            const type = Array.isArray(value) ? 'array' : typeof value;
            analysis += `${indent}${key}: ${type}`;
            
            if (type === 'object' && value !== null) {
                analysis += ` (${Object.keys(value).length} propiedades)`;
            } else if (type === 'array') {
                analysis += ` (${value.length} elementos)`;
            } else if (type === 'string') {
                analysis += ` (${value.length} chars)`;
            }
            
            analysis += '\n';
        }
    },

    /**
     * Placeholder functions for additional features
     */
    showBackupOptions() {
        alert('Funcionalidad de backup en desarrollo');
    },

    generateReport() {
        alert('Generador de reportes en desarrollo');
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Make it globally available
window.AdminPanel = AdminPanel;