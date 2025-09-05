/**
 * CPanel - Sistema de Control de Panel para App.futbol
 * Versión limpia y optimizada desde cero
 */

class ControlPanel {
    constructor() {
        this.db = null;
        this.currentTab = 'dashboard';
        
        // Datos locales
        this.players = [];
        this.matches = [];
        this.evaluations = [];
        this.groups = [];
        
        // Estadísticas
        this.stats = {
            totalPlayers: 0,
            totalMatches: 0,
            totalEvaluations: 0,
            activeEvaluations: 0,
            totalGroups: 0
        };
        
        // Estado de carga
        this.isLoading = {
            players: false,
            matches: false,
            evaluations: false
        };
    }

    /**
     * Inicializar CPanel
     */
    async init() {
        this.log('🎮 Inicializando CPanel...', 'info');
        
        try {
            // Verificar Firebase
            if (!firebase || !firebase.firestore) {
                throw new Error('Firebase no está disponible');
            }
            
            this.db = firebase.firestore();
            this.log('🔥 Firebase conectado correctamente', 'success');
            
            // Cargar datos iniciales
            await this.refreshAll();
            
            // Configurar helpers de consola
            this.setupConsoleHelpers();
            
            this.log('✅ CPanel inicializado correctamente', 'success');
            
        } catch (error) {
            this.log(`❌ Error inicializando CPanel: ${error.message}`, 'error');
        }
    }

    /**
     * Cambiar pestaña activa
     */
    switchTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        this.log(`📑 Cambiado a pestaña: ${tabName}`, 'info');
        
        // Cargar datos específicos si es necesario
        switch (tabName) {
            case 'players':
                if (this.players.length === 0) this.loadPlayers();
                break;
            case 'matches':
                if (this.matches.length === 0) this.loadMatches();
                break;
            case 'evaluations':
                if (this.evaluations.length === 0) this.loadEvaluations();
                break;
        }
    }

    /**
     * Refrescar todos los datos
     */
    async refreshAll() {
        this.log('🔄 Actualizando todos los datos...', 'info');
        
        try {
            // Cargar en paralelo para mejor rendimiento
            const promises = [
                this.loadPlayers(),
                this.loadMatches(), 
                this.loadEvaluations(),
                this.loadGroups()
            ];
            
            await Promise.all(promises);
            
            this.updateDashboard();
            this.log('✅ Todos los datos actualizados', 'success');
            
        } catch (error) {
            this.log(`❌ Error actualizando datos: ${error.message}`, 'error');
        }
    }

    /**
     * Cargar jugadores desde Firebase
     */
    async loadPlayers() {
        if (this.isLoading.players) return;
        this.isLoading.players = true;
        
        this.log('👥 Cargando jugadores...', 'info');
        
        try {
            this.players = [];
            let totalLoaded = 0;
            
            // 1. Cargar desde grupos
            const groupsSnapshot = await this.db.collection('groups').get();
            
            for (const groupDoc of groupsSnapshot.docs) {
                const groupId = groupDoc.id;
                
                try {
                    const playersSnapshot = await this.db.collection(`groups/${groupId}/players`).get();
                    
                    playersSnapshot.forEach(doc => {
                        const playerData = {
                            id: doc.id,
                            ...doc.data(),
                            source: 'group',
                            groupId: groupId
                        };
                        this.players.push(playerData);
                        totalLoaded++;
                    });
                    
                    if (!playersSnapshot.empty) {
                        this.log(`  ✓ Grupo ${groupId}: ${playersSnapshot.size} jugadores`, 'info');
                    }
                    
                } catch (error) {
                    this.log(`  ⚠️ Error accediendo grupo ${groupId}: ${error.message}`, 'warning');
                }
            }
            
            // 2. Cargar jugadores autenticados
            try {
                const usersSnapshot = await this.db.collection('futbol_users').get();
                let authCount = 0;
                
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    
                    if (userData.attributes && userData.ovr) {
                        // Evitar duplicados
                        const existingPlayer = this.players.find(p => p.id === doc.id);
                        
                        if (!existingPlayer) {
                            const playerData = {
                                id: doc.id,
                                name: userData.name || userData.email || 'Sin nombre',
                                attributes: userData.attributes,
                                ovr: userData.ovr,
                                originalOVR: userData.originalOVR,
                                hasBeenEvaluated: userData.hasBeenEvaluated,
                                position: userData.position,
                                source: 'authenticated',
                                email: userData.email,
                                isAuthenticated: true
                            };
                            this.players.push(playerData);
                            authCount++;
                            totalLoaded++;
                        } else {
                            // Marcar como autenticado
                            existingPlayer.isAuthenticated = true;
                            existingPlayer.email = userData.email;
                        }
                    }
                });
                
                if (authCount > 0) {
                    this.log(`  ✓ Jugadores autenticados: ${authCount}`, 'info');
                }
                
            } catch (error) {
                this.log(`  ⚠️ Error cargando jugadores autenticados: ${error.message}`, 'warning');
            }
            
            this.stats.totalPlayers = totalLoaded;
            this.displayPlayers();
            this.log(`✅ Total jugadores cargados: ${totalLoaded}`, 'success');
            
        } catch (error) {
            this.log(`❌ Error cargando jugadores: ${error.message}`, 'error');
        } finally {
            this.isLoading.players = false;
        }
    }

    /**
     * Cargar partidos desde Firebase
     */
    async loadMatches() {
        if (this.isLoading.matches) return;
        this.isLoading.matches = true;
        
        this.log('⚽ Cargando partidos...', 'info');
        
        try {
            this.matches = [];
            let totalLoaded = 0;
            
            // 1. Buscar en estructura anidada (groups/{groupId}/matches)
            const groupsSnapshot = await this.db.collection('groups').get();
            
            for (const groupDoc of groupsSnapshot.docs) {
                const groupId = groupDoc.id;
                
                try {
                    const matchesSnapshot = await this.db.collection(`groups/${groupId}/matches`).get();
                    
                    matchesSnapshot.forEach(doc => {
                        const matchData = {
                            id: doc.id,
                            ...doc.data(),
                            source: 'group',
                            groupId: groupId,
                            collection: `groups/${groupId}/matches`
                        };
                        this.matches.push(matchData);
                        totalLoaded++;
                    });
                    
                    if (!matchesSnapshot.empty) {
                        this.log(`  ✓ Grupo ${groupId}: ${matchesSnapshot.size} partidos`, 'info');
                    }
                    
                } catch (error) {
                    this.log(`  ⚠️ Error accediendo partidos del grupo ${groupId}`, 'warning');
                }
            }
            
            // 2. Si no hay partidos, buscar en colección plana
            if (totalLoaded === 0) {
                try {
                    const flatMatchesSnapshot = await this.db.collection('matches').get();
                    
                    flatMatchesSnapshot.forEach(doc => {
                        const matchData = {
                            id: doc.id,
                            ...doc.data(),
                            source: 'flat',
                            collection: 'matches'
                        };
                        this.matches.push(matchData);
                        totalLoaded++;
                    });
                    
                    if (totalLoaded > 0) {
                        this.log(`  ✓ Colección plana: ${totalLoaded} partidos`, 'info');
                    }
                    
                } catch (error) {
                    this.log(`  ⚠️ Error accediendo colección de partidos plana`, 'warning');
                }
            }
            
            this.stats.totalMatches = totalLoaded;
            this.displayMatches();
            this.log(`✅ Total partidos cargados: ${totalLoaded}`, 'success');
            
        } catch (error) {
            this.log(`❌ Error cargando partidos: ${error.message}`, 'error');
        } finally {
            this.isLoading.matches = false;
        }
    }

    /**
     * Cargar evaluaciones desde Firebase
     */
    async loadEvaluations() {
        if (this.isLoading.evaluations) return;
        this.isLoading.evaluations = true;
        
        this.log('📈 Cargando evaluaciones...', 'info');
        
        try {
            this.evaluations = [];
            
            const evaluationsSnapshot = await this.db.collection('evaluations')
                .orderBy('createdAt', 'desc')
                .get();
            
            evaluationsSnapshot.forEach(doc => {
                const evalData = {
                    id: doc.id,
                    ...doc.data()
                };
                this.evaluations.push(evalData);
            });
            
            // Calcular estadísticas
            this.stats.totalEvaluations = this.evaluations.length;
            this.stats.activeEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
            
            this.displayEvaluations();
            this.log(`✅ Evaluaciones cargadas: ${this.evaluations.length} (${this.stats.activeEvaluations} activas)`, 'success');
            
        } catch (error) {
            this.log(`❌ Error cargando evaluaciones: ${error.message}`, 'error');
        } finally {
            this.isLoading.evaluations = false;
        }
    }

    /**
     * Cargar grupos desde Firebase
     */
    async loadGroups() {
        try {
            const groupsSnapshot = await this.db.collection('groups').get();
            this.groups = [];
            
            groupsSnapshot.forEach(doc => {
                this.groups.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.stats.totalGroups = this.groups.length;
            
        } catch (error) {
            this.log(`❌ Error cargando grupos: ${error.message}`, 'error');
        }
    }

    /**
     * Mostrar jugadores en la UI
     */
    displayPlayers() {
        const container = document.getElementById('players-container');
        
        if (this.players.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 No hay jugadores para mostrar</div>';
            return;
        }
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>👤 Jugador</th><th>🎯 Posición</th><th>⭐ OVR</th><th>📍 Origen</th><th>🔧 Acciones</th></tr></thead><tbody>';
        
        this.players.forEach(player => {
            const sourceBadge = player.source === 'authenticated' ? 
                '<span class="status-badge status-active">🔐 AUTH</span>' : 
                '<span class="status-badge status-pending">👥 GROUP</span>';
            
            const evalBadge = player.hasBeenEvaluated ?
                '<span class="status-badge status-active">📊 EVAL</span>' :
                '<span class="status-badge">⏳ SIN EVAL</span>';
                
            html += `
                <tr>
                    <td>
                        <strong>${player.name || 'Sin nombre'}</strong><br>
                        <small>${player.email || player.id}</small>
                        ${sourceBadge} ${evalBadge}
                    </td>
                    <td>${player.position || 'N/A'}</td>
                    <td>
                        <strong>${player.ovr || 'N/A'}</strong>
                        ${player.originalOVR ? `<br><small>Orig: ${player.originalOVR}</small>` : ''}
                    </td>
                    <td>
                        ${player.source === 'group' ? `📁 ${player.groupId}` : '🔐 Autenticado'}
                    </td>
                    <td>
                        <button class="btn btn-primary" onclick="CPanel.viewPlayer('${player.id}')">👁️</button>
                        <button class="btn btn-warning" onclick="CPanel.resetPlayer('${player.id}')">🔄</button>
                        <button class="btn btn-danger" onclick="CPanel.deletePlayer('${player.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Mostrar partidos en la UI
     */
    displayMatches() {
        const container = document.getElementById('matches-container');
        
        if (this.matches.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 No hay partidos para mostrar</div>';
            return;
        }
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>⚽ Partido</th><th>📅 Fecha</th><th>👥 Jugadores</th><th>📊 Estado</th><th>🔧 Acciones</th></tr></thead><tbody>';
        
        // Ordenar por fecha (más recientes primero)
        const sortedMatches = [...this.matches].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
        
        sortedMatches.forEach(match => {
            const teamAName = match.teamA?.name || 'Equipo A';
            const teamBName = match.teamB?.name || 'Equipo B';
            const matchDate = new Date(match.createdAt || match.date || Date.now());
            const playersCount = (match.teamA?.players?.length || 0) + (match.teamB?.players?.length || 0);
            
            let statusBadge = '';
            switch (match.status) {
                case 'finished':
                    statusBadge = '<span class="status-badge status-active">✅ Finalizado</span>';
                    break;
                case 'in_progress':
                    statusBadge = '<span class="status-badge status-pending">⏳ En Curso</span>';
                    break;
                default:
                    statusBadge = '<span class="status-badge">📝 Programado</span>';
            }
            
            html += `
                <tr>
                    <td>
                        <strong>${teamAName} vs ${teamBName}</strong><br>
                        <small>${match.format || '5v5'} | Balance: ${match.difference || 0} OVR</small>
                    </td>
                    <td>
                        ${matchDate.toLocaleDateString()}<br>
                        <small>${matchDate.toLocaleTimeString()}</small>
                    </td>
                    <td>${playersCount} jugadores</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-primary" onclick="CPanel.viewMatch('${match.id}')">👁️</button>
                        <button class="btn btn-danger" onclick="CPanel.deleteMatch('${match.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Mostrar evaluaciones en la UI
     */
    displayEvaluations() {
        const container = document.getElementById('evaluations-container');
        
        if (this.evaluations.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 No hay evaluaciones para mostrar</div>';
            return;
        }
        
        let html = '<table class="data-table">';
        html += '<thead><tr><th>📈 Evaluación</th><th>📅 Creada</th><th>👥 Progreso</th><th>📊 Estado</th><th>🔧 Acciones</th></tr></thead><tbody>';
        
        this.evaluations.forEach(evaluation => {
            const evalDate = new Date(evaluation.createdAt || Date.now());
            const totalAssignments = Object.keys(evaluation.assignments || {}).length;
            const completedCount = Object.keys(evaluation.completed || {}).length;
            const participationRate = Math.round((evaluation.participationRate || 0) * 100);
            
            let statusBadge = '';
            switch (evaluation.status) {
                case 'pending':
                    statusBadge = '<span class="status-badge status-pending">⏳ Pendiente</span>';
                    break;
                case 'expired':
                    statusBadge = '<span class="status-badge status-expired">⏰ Expirada</span>';
                    break;
                case 'completed':
                    statusBadge = '<span class="status-badge status-active">✅ Completada</span>';
                    break;
                default:
                    statusBadge = `<span class="status-badge">${evaluation.status}</span>`;
            }
            
            html += `
                <tr>
                    <td>
                        <strong>${evaluation.matchName || 'Sin nombre'}</strong><br>
                        <small>Tipo: ${evaluation.matchType || 'manual'}</small>
                    </td>
                    <td>
                        ${evalDate.toLocaleDateString()}<br>
                        <small>${evalDate.toLocaleTimeString()}</small>
                    </td>
                    <td>
                        ${completedCount}/${totalAssignments} (${participationRate}%)<br>
                        <small>OVRs: ${evaluation.ovrUpdateTriggered ? '✅ Actualizados' : '❌ Pendientes'}</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-primary" onclick="CPanel.viewEvaluation('${evaluation.id}')">👁️</button>
                        <button class="btn btn-warning" onclick="CPanel.forceOVRUpdate('${evaluation.id}')">⚡</button>
                        <button class="btn btn-danger" onclick="CPanel.deleteEvaluation('${evaluation.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Actualizar dashboard con estadísticas
     */
    updateDashboard() {
        document.getElementById('total-players').textContent = this.stats.totalPlayers;
        document.getElementById('total-matches').textContent = this.stats.totalMatches;
        document.getElementById('total-evaluations').textContent = this.stats.totalEvaluations;
        document.getElementById('active-evaluations').textContent = this.stats.activeEvaluations;
        document.getElementById('total-groups').textContent = this.stats.totalGroups;
    }

    /**
     * Funciones de búsqueda
     */
    searchPlayers() {
        const searchTerm = document.getElementById('players-search').value.toLowerCase();
        const filteredPlayers = this.players.filter(player => 
            (player.name || '').toLowerCase().includes(searchTerm) ||
            (player.email || '').toLowerCase().includes(searchTerm) ||
            (player.position || '').toLowerCase().includes(searchTerm)
        );
        
        // Temporalmente guardar jugadores originales y mostrar filtrados
        const originalPlayers = this.players;
        this.players = filteredPlayers;
        this.displayPlayers();
        this.players = originalPlayers;
    }

    searchMatches() {
        const searchTerm = document.getElementById('matches-search').value.toLowerCase();
        const filteredMatches = this.matches.filter(match =>
            (match.teamA?.name || '').toLowerCase().includes(searchTerm) ||
            (match.teamB?.name || '').toLowerCase().includes(searchTerm) ||
            (match.format || '').toLowerCase().includes(searchTerm)
        );
        
        const originalMatches = this.matches;
        this.matches = filteredMatches;
        this.displayMatches();
        this.matches = originalMatches;
    }

    searchEvaluations() {
        const searchTerm = document.getElementById('evaluations-search').value.toLowerCase();
        const filteredEvaluations = this.evaluations.filter(evaluation =>
            (evaluation.matchName || '').toLowerCase().includes(searchTerm) ||
            (evaluation.matchType || '').toLowerCase().includes(searchTerm)
        );
        
        const originalEvaluations = this.evaluations;
        this.evaluations = filteredEvaluations;
        this.displayEvaluations();
        this.evaluations = originalEvaluations;
    }

    /**
     * Sistema de logging
     */
    log(message, type = 'info') {
        const console = document.getElementById('console-output');
        if (!console) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span style="opacity: 0.7;">${timestamp}</span> ${message}`;
        
        console.appendChild(logEntry);
        console.scrollTop = console.scrollHeight;
        
        // También log en consola del navegador
        console.log(`[CPanel ${type.toUpperCase()}] ${message}`);
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Configurar helpers de consola
     */
    setupConsoleHelpers() {
        window.cpanel = {
            stats: () => this.stats,
            players: () => this.players,
            matches: () => this.matches,
            evaluations: () => this.evaluations,
            refresh: () => this.refreshAll(),
            resetAll: (value = 50) => this.resetAllPlayersTo50(),
            cleanTest: () => this.cleanAllTestData(),
            log: (msg, type) => this.log(msg, type)
        };
        
        this.log('🛠️ Console helpers cargados: window.cpanel', 'info');
        this.log('  - cpanel.stats() - Ver estadísticas', 'info');
        this.log('  - cpanel.refresh() - Actualizar datos', 'info');
        this.log('  - cpanel.resetAll() - Reset jugadores a 50', 'info');
    }

    /**
     * FUNCIONES DE ACCIÓN INDIVIDUALES
     */

    async viewPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showNotification('Jugador no encontrado', 'error');
            return;
        }
        
        let details = `DETALLES DEL JUGADOR:\n`;
        details += `========================\n`;
        details += `Nombre: ${player.name || 'Sin nombre'}\n`;
        details += `ID: ${player.id}\n`;
        details += `Posición: ${player.position || 'N/A'}\n`;
        details += `OVR: ${player.ovr || 'N/A'}\n`;
        details += `OVR Original: ${player.originalOVR || 'N/A'}\n`;
        details += `Evaluado: ${player.hasBeenEvaluated ? 'Sí' : 'No'}\n`;
        details += `Fuente: ${player.source === 'authenticated' ? 'Autenticado' : 'Grupo'}\n`;
        
        if (player.email) details += `Email: ${player.email}\n`;
        if (player.groupId) details += `Grupo: ${player.groupId}\n`;
        
        if (player.attributes) {
            details += `\nATRIBUTOS:\n`;
            details += `PAC: ${player.attributes.pac || 0} | SHO: ${player.attributes.sho || 0}\n`;
            details += `PAS: ${player.attributes.pas || 0} | DRI: ${player.attributes.dri || 0}\n`;
            details += `DEF: ${player.attributes.def || 0} | PHY: ${player.attributes.phy || 0}\n`;
        }
        
        alert(details);
    }

    async resetPlayer(playerId, customValue = 50) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showNotification('Jugador no encontrado', 'error');
            return;
        }
        
        if (!confirm(`¿Reset ${player.name || 'jugador'} a ${customValue} en todas las estadísticas?`)) {
            return;
        }
        
        try {
            const newAttributes = {
                pac: customValue,
                sho: customValue,
                pas: customValue,
                dri: customValue,
                def: customValue,
                phy: customValue
            };
            
            const newOVR = this.calculatePositionOVR(newAttributes, player.position || 'MED');
            
            const updatedData = {
                ...player,
                attributes: newAttributes,
                ovr: newOVR,
                originalOVR: newOVR,
                hasBeenEvaluated: false,
                updatedAt: Date.now()
            };
            
            // Actualizar en Firebase
            await this.updatePlayerInFirebase(player, updatedData);
            
            // Actualizar localmente
            const index = this.players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                this.players[index] = updatedData;
            }
            
            this.displayPlayers();
            this.showNotification(`${player.name} reseteado a ${customValue}`, 'success');
            this.log(`✅ Jugador ${player.name} reseteado a ${customValue} (OVR: ${newOVR})`, 'success');
            
        } catch (error) {
            this.log(`❌ Error reseteando jugador: ${error.message}`, 'error');
            this.showNotification('Error reseteando jugador', 'error');
        }
    }

    async deletePlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showNotification('Jugador no encontrado', 'error');
            return;
        }
        
        if (!confirm(`¿Eliminar definitivamente a ${player.name || 'este jugador'}?\n\nEsta acción es IRREVERSIBLE.`)) {
            return;
        }
        
        try {
            // Eliminar de Firebase
            if (player.source === 'authenticated') {
                await this.db.collection('futbol_users').doc(playerId).delete();
            }
            if (player.groupId) {
                await this.db.collection(`groups/${player.groupId}/players`).doc(playerId).delete();
            }
            
            // Eliminar localmente
            this.players = this.players.filter(p => p.id !== playerId);
            this.stats.totalPlayers = this.players.length;
            
            this.displayPlayers();
            this.updateDashboard();
            this.showNotification(`${player.name} eliminado`, 'success');
            this.log(`✅ Jugador ${player.name} eliminado`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando jugador: ${error.message}`, 'error');
            this.showNotification('Error eliminando jugador', 'error');
        }
    }

    async deleteMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) {
            this.showNotification('Partido no encontrado', 'error');
            return;
        }
        
        const teamAName = match.teamA?.name || 'Equipo A';
        const teamBName = match.teamB?.name || 'Equipo B';
        
        if (!confirm(`¿Eliminar partido ${teamAName} vs ${teamBName}?\n\nEsta acción es IRREVERSIBLE.`)) {
            return;
        }
        
        try {
            // Eliminar de Firebase
            if (match.groupId) {
                await this.db.collection(`groups/${match.groupId}/matches`).doc(matchId).delete();
            } else {
                await this.db.collection('matches').doc(matchId).delete();
            }
            
            // Eliminar localmente
            this.matches = this.matches.filter(m => m.id !== matchId);
            this.stats.totalMatches = this.matches.length;
            
            this.displayMatches();
            this.updateDashboard();
            this.showNotification('Partido eliminado', 'success');
            this.log(`✅ Partido ${teamAName} vs ${teamBName} eliminado`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando partido: ${error.message}`, 'error');
            this.showNotification('Error eliminando partido', 'error');
        }
    }

    async deleteEvaluation(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) {
            this.showNotification('Evaluación no encontrada', 'error');
            return;
        }
        
        if (!confirm(`¿Eliminar evaluación ${evaluation.matchName || 'sin nombre'}?\n\nEsta acción es IRREVERSIBLE.`)) {
            return;
        }
        
        try {
            await this.db.collection('evaluations').doc(evaluationId).delete();
            
            // Eliminar localmente
            this.evaluations = this.evaluations.filter(e => e.id !== evaluationId);
            this.stats.totalEvaluations = this.evaluations.length;
            this.stats.activeEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
            
            this.displayEvaluations();
            this.updateDashboard();
            this.showNotification('Evaluación eliminada', 'success');
            this.log(`✅ Evaluación ${evaluation.matchName} eliminada`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando evaluación: ${error.message}`, 'error');
            this.showNotification('Error eliminando evaluación', 'error');
        }
    }

    /**
     * FUNCIONES DE RESET MASIVO
     */
    
    async resetAllPlayersTo50() {
        if (!confirm(`¿Reset TODOS los ${this.players.length} jugadores a 50 en todas las estadísticas?\n\nEsto afectará:\n- Todas las estadísticas (PAC, SHO, PAS, DRI, DEF, PHY)\n- OVR calculado según posición\n- hasBeenEvaluated en false`)) {
            return;
        }
        
        await this.resetAllPlayersToValue(50);
    }
    
    async resetAllPlayersCustom() {
        const value = prompt('¿A qué valor resetear todas las estadísticas? (0-100):', '50');
        
        if (!value || isNaN(value) || value < 0 || value > 100) {
            this.showNotification('Valor inválido', 'error');
            return;
        }
        
        const numValue = parseInt(value);
        
        if (!confirm(`¿Reset TODOS los ${this.players.length} jugadores a ${numValue}?`)) {
            return;
        }
        
        await this.resetAllPlayersToValue(numValue);
    }
    
    async resetAllPlayersToValue(value) {
        this.log(`🔄 Iniciando reset masivo a ${value}...`, 'info');
        
        try {
            let successful = 0;
            let failed = 0;
            
            for (let i = 0; i < this.players.length; i++) {
                const player = this.players[i];
                this.log(`[${i + 1}/${this.players.length}] Reseteando ${player.name}...`, 'info');
                
                try {
                    const newAttributes = {
                        pac: value,
                        sho: value,
                        pas: value,
                        dri: value,
                        def: value,
                        phy: value
                    };
                    
                    const newOVR = this.calculatePositionOVR(newAttributes, player.position || 'MED');
                    
                    const updatedData = {
                        ...player,
                        attributes: newAttributes,
                        ovr: newOVR,
                        originalOVR: newOVR,
                        hasBeenEvaluated: false,
                        updatedAt: Date.now()
                    };
                    
                    await this.updatePlayerInFirebase(player, updatedData);
                    
                    // Actualizar localmente
                    this.players[i] = updatedData;
                    
                    successful++;
                    
                } catch (error) {
                    this.log(`  ❌ Error con ${player.name}: ${error.message}`, 'error');
                    failed++;
                }
            }
            
            this.displayPlayers();
            this.showNotification(`Reset completo: ${successful} exitosos, ${failed} errores`, 'success');
            this.log(`✅ Reset masivo completo: ${successful} exitosos, ${failed} errores`, 'success');
            
        } catch (error) {
            this.log(`❌ Error en reset masivo: ${error.message}`, 'error');
            this.showNotification('Error en reset masivo', 'error');
        }
    }
    
    /**
     * FUNCIONES DE LIMPIEZA
     */
    
    async cleanTestPlayers() {
        if (!confirm('¿Eliminar jugadores de prueba?\n\nSe eliminarán:\n- Jugadores invitados\n- Nombres con "test" o "prueba"\n- Jugadores creados en las últimas 24h')) {
            return;
        }
        
        try {
            const now = Date.now();
            const dayAgo = now - (24 * 60 * 60 * 1000);
            
            const testPlayers = this.players.filter(player => {
                return player.isGuest ||
                       (player.name && (
                           player.name.toLowerCase().includes('test') ||
                           player.name.toLowerCase().includes('prueba') ||
                           player.name.toLowerCase().includes('ejemplo')
                       )) ||
                       (player.createdAt && player.createdAt > dayAgo);
            });
            
            if (testPlayers.length === 0) {
                this.showNotification('No se encontraron jugadores de prueba', 'info');
                return;
            }
            
            this.log(`🧼 Eliminando ${testPlayers.length} jugadores de prueba...`, 'info');
            
            for (const player of testPlayers) {
                await this.deletePlayer(player.id);
            }
            
            this.showNotification(`${testPlayers.length} jugadores de prueba eliminados`, 'success');
            
        } catch (error) {
            this.log(`❌ Error limpiando jugadores de prueba: ${error.message}`, 'error');
            this.showNotification('Error en limpieza', 'error');
        }
    }
    
    async cleanTestMatches() {
        if (!confirm('¿Eliminar partidos de prueba?\n\nSe eliminarán:\n- Partidos creados en las últimas 48h\n- Nombres con "test" o "prueba"')) {
            return;
        }
        
        try {
            const now = Date.now();
            const twoDaysAgo = now - (48 * 60 * 60 * 1000);
            
            const testMatches = this.matches.filter(match => {
                const createdAt = match.createdAt || match.date || 0;
                return createdAt > twoDaysAgo ||
                       (match.name && (
                           match.name.toLowerCase().includes('test') ||
                           match.name.toLowerCase().includes('prueba')
                       )) ||
                       (match.teamA?.name && (
                           match.teamA.name.toLowerCase().includes('test') ||
                           match.teamB?.name?.toLowerCase().includes('test')
                       ));
            });
            
            if (testMatches.length === 0) {
                this.showNotification('No se encontraron partidos de prueba', 'info');
                return;
            }
            
            this.log(`🧼 Eliminando ${testMatches.length} partidos de prueba...`, 'info');
            
            for (const match of testMatches) {
                await this.deleteMatch(match.id);
            }
            
            this.showNotification(`${testMatches.length} partidos de prueba eliminados`, 'success');
            
        } catch (error) {
            this.log(`❌ Error limpiando partidos de prueba: ${error.message}`, 'error');
            this.showNotification('Error en limpieza', 'error');
        }
    }
    
    async cleanExpiredEvaluations() {
        if (!confirm('¿Eliminar evaluaciones expiradas?')) {
            return;
        }
        
        try {
            const expiredEvaluations = this.evaluations.filter(evaluation => {
                return evaluation.status === 'expired' || 
                       (evaluation.deadline && Date.now() > evaluation.deadline);
            });
            
            if (expiredEvaluations.length === 0) {
                this.showNotification('No se encontraron evaluaciones expiradas', 'info');
                return;
            }
            
            this.log(`🧼 Eliminando ${expiredEvaluations.length} evaluaciones expiradas...`, 'info');
            
            for (const evaluation of expiredEvaluations) {
                await this.deleteEvaluation(evaluation.id);
            }
            
            this.showNotification(`${expiredEvaluations.length} evaluaciones expiradas eliminadas`, 'success');
            
        } catch (error) {
            this.log(`❌ Error limpiando evaluaciones: ${error.message}`, 'error');
            this.showNotification('Error en limpieza', 'error');
        }
    }
    
    async cleanAllTestData() {
        if (!confirm('🧼 LIMPIEZA COMPLETA DE DATOS DE PRUEBA\n\nEsto eliminará:\n- Jugadores de prueba\n- Partidos de prueba\n- Evaluaciones expiradas\n\n¿Continuar?')) {
            return;
        }
        
        this.log('🧼 Iniciando limpieza completa...', 'info');
        
        try {
            await this.cleanTestPlayers();
            await this.cleanTestMatches();
            await this.cleanExpiredEvaluations();
            
            await this.refreshAll();
            
            this.showNotification('Limpieza completa finalizada', 'success');
            this.log('✅ Limpieza completa finalizada', 'success');
            
        } catch (error) {
            this.log(`❌ Error en limpieza completa: ${error.message}`, 'error');
            this.showNotification('Error en limpieza completa', 'error');
        }
    }
    
    /**
     * FUNCIONES AUXILIARES
     */
    
    calculatePositionOVR(attributes, position) {
        const weights = {
            'POR': { pac: 0.1, sho: 0.1, pas: 0.15, dri: 0.1, def: 0.25, phy: 0.3 },
            'DEF': { pac: 0.15, sho: 0.05, pas: 0.15, dri: 0.1, def: 0.35, phy: 0.2 },
            'MED': { pac: 0.15, sho: 0.15, pas: 0.3, dri: 0.25, def: 0.1, phy: 0.05 },
            'DEL': { pac: 0.2, sho: 0.3, pas: 0.15, dri: 0.2, def: 0.05, phy: 0.1 }
        };
        
        const posWeights = weights[position] || weights['MED'];
        
        return Math.round(
            attributes.pac * posWeights.pac +
            attributes.sho * posWeights.sho +
            attributes.pas * posWeights.pas +
            attributes.dri * posWeights.dri +
            attributes.def * posWeights.def +
            attributes.phy * posWeights.phy
        );
    }
    
    async updatePlayerInFirebase(originalPlayer, updatedData) {
        const promises = [];
        
        // Actualizar en futbol_users si es autenticado
        if (originalPlayer.source === 'authenticated' || originalPlayer.isAuthenticated) {
            promises.push(
                this.db.collection('futbol_users').doc(originalPlayer.id).update({
                    attributes: updatedData.attributes,
                    ovr: updatedData.ovr,
                    originalOVR: updatedData.originalOVR,
                    hasBeenEvaluated: updatedData.hasBeenEvaluated,
                    position: updatedData.position,
                    updatedAt: updatedData.updatedAt
                })
            );
        }
        
        // Actualizar en grupo si pertenece a uno
        if (originalPlayer.groupId) {
            promises.push(
                this.db.collection(`groups/${originalPlayer.groupId}/players`).doc(originalPlayer.id).set(updatedData)
            );
        }
        
        await Promise.all(promises);
    }
    
    async exportData() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                stats: this.stats,
                players: this.players,
                matches: this.matches,
                evaluations: this.evaluations,
                groups: this.groups
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cpanel-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Datos exportados correctamente', 'success');
            this.log('✅ Datos exportados correctamente', 'success');
            
        } catch (error) {
            this.log(`❌ Error exportando datos: ${error.message}`, 'error');
            this.showNotification('Error exportando datos', 'error');
        }
    }
    
    // Placeholder para funciones peligrosas
    async viewMatch(matchId) { this.log(`Ver partido: ${matchId}`, 'info'); }
    async viewEvaluation(evaluationId) { this.log(`Ver evaluación: ${evaluationId}`, 'info'); }
    async forceOVRUpdate(evaluationId) { this.log(`Forzar OVR: ${evaluationId}`, 'info'); }
    async deleteAllPlayers() { this.log('PELIGRO: Eliminar todos jugadores', 'warning'); }
    async deleteAllMatches() { this.log('PELIGRO: Eliminar todos partidos', 'warning'); }
    async deleteAllEvaluations() { this.log('PELIGRO: Eliminar todas evaluaciones', 'warning'); }
    async nukeEverything() { this.log('PELIGRO EXTREMO: Eliminar todo', 'error'); }
}

// Crear instancia global
const CPanel = new ControlPanel();

// Hacer disponible globalmente
window.CPanel = CPanel;