/**
 * CPanel - Sistema de Control de Panel para App.futbol
 * Versión corregida y sin errores
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
        }
    }

    /**
     * Cargar partidos desde Firebase (incluyendo manuales y colaborativos)
     */
    async loadMatches() {
        this.log('⚽ Cargando partidos (manuales y colaborativos)...', 'info');
        
        try {
            this.matches = [];
            let totalLoaded = 0;
            
            // DIAGNÓSTICO: Listar todas las colecciones disponibles
            this.log('🔍 Diagnosticando colecciones disponibles...', 'info');
            
            // 1. Buscar en estructura anidada (groups/{groupId}/matches) - Partidos manuales
            this.log('🔍 Paso 1: Revisando estructura anidada groups/{groupId}/matches...', 'info');
            const groupsSnapshot = await this.db.collection('groups').get();
            this.log(`  ✓ Encontrados ${groupsSnapshot.size} grupos`, 'info');
            
            for (const groupDoc of groupsSnapshot.docs) {
                const groupId = groupDoc.id;
                this.log(`  🔎 Revisando grupo: ${groupId}`, 'info');
                
                try {
                    const matchesSnapshot = await this.db.collection(`groups/${groupId}/matches`).get();
                    
                    if (!matchesSnapshot.empty) {
                        this.log(`  ✓ Grupo ${groupId}: ${matchesSnapshot.size} partidos encontrados`, 'info');
                        matchesSnapshot.forEach(doc => {
                            const matchData = {
                                id: doc.id,
                                ...doc.data(),
                                source: 'group',
                                type: 'manual',
                                groupId: groupId,
                                collection: `groups/${groupId}/matches`
                            };
                            this.matches.push(matchData);
                            totalLoaded++;
                            this.log(`    • Partido: ${matchData.teamA?.name || 'A'} vs ${matchData.teamB?.name || 'B'} (ID: ${doc.id})`, 'info');
                        });
                    } else {
                        this.log(`  ∅ Grupo ${groupId}: Sin partidos`, 'info');
                    }
                    
                } catch (error) {
                    this.log(`  ❌ Error accediendo partidos del grupo ${groupId}: ${error.message}`, 'error');
                }
            }
            
            // 2. Buscar partidos en colecciones principales
            this.log('🔍 Paso 2: Revisando colecciones principales...', 'info');
            
            // 2a. Revisar futbol_matches (donde está el partido real)
            try {
                const futbolMatchesSnapshot = await this.db.collection('futbol_matches').get();
                
                if (!futbolMatchesSnapshot.empty) {
                    this.log(`  ✓ Colección futbol_matches: ${futbolMatchesSnapshot.size} partidos encontrados`, 'success');
                    futbolMatchesSnapshot.forEach(doc => {
                        const matchData = {
                            id: doc.id,
                            ...doc.data(),
                            source: 'futbol_matches',
                            type: 'futbol',
                            collection: 'futbol_matches'
                        };
                        this.matches.push(matchData);
                        totalLoaded++;
                        this.log(`    • Partido futbol: ${matchData.teamA?.name || matchData.name || 'Sin nombre'} (ID: ${doc.id})`, 'success');
                    });
                } else {
                    this.log(`  ∅ Colección futbol_matches: Vacía`, 'info');
                }
                
            } catch (error) {
                this.log(`  ❌ Error accediendo colección futbol_matches: ${error.message}`, 'error');
            }
            
            // 2b. Revisar matches (colaborativos)
            try {
                const collaborativeMatchesSnapshot = await this.db.collection('matches').get();
                
                if (!collaborativeMatchesSnapshot.empty) {
                    this.log(`  ✓ Colección matches: ${collaborativeMatchesSnapshot.size} partidos encontrados`, 'info');
                    collaborativeMatchesSnapshot.forEach(doc => {
                        const matchData = {
                            id: doc.id,
                            ...doc.data(),
                            source: 'collaborative',
                            type: 'collaborative',
                            collection: 'matches'
                        };
                        this.matches.push(matchData);
                        totalLoaded++;
                        this.log(`    • Partido colaborativo: ${matchData.teamA?.name || 'A'} vs ${matchData.teamB?.name || 'B'} (ID: ${doc.id})`, 'info');
                    });
                } else {
                    this.log(`  ∅ Colección matches: Vacía`, 'info');
                }
                
            } catch (error) {
                this.log(`  ❌ Error accediendo colección matches: ${error.message}`, 'error');
            }
            
            // 3. Buscar en todas las colecciones posibles con diagnóstico extendido
            this.log('🔍 Paso 3: Revisando otras colecciones posibles...', 'info');
            const otherCollections = [
                'futbol_matches', 'futbolMatches',  // ← AGREGADAS LAS COLECCIONES REALES
                'partido', 'partidos', 'games', 'game', 'match', 'Match'
            ];
            
            for (const collectionName of otherCollections) {
                try {
                    this.log(`  🔎 Revisando colección: ${collectionName}`, 'info');
                    const snapshot = await this.db.collection(collectionName).get();
                    
                    if (!snapshot.empty) {
                        this.log(`  ✓ Colección ${collectionName}: ${snapshot.size} documentos encontrados`, 'info');
                        snapshot.forEach(doc => {
                            // Evitar duplicados
                            const existingMatch = this.matches.find(m => m.id === doc.id);
                            if (!existingMatch) {
                                const matchData = {
                                    id: doc.id,
                                    ...doc.data(),
                                    source: 'other',
                                    type: collectionName,
                                    collection: collectionName
                                };
                                this.matches.push(matchData);
                                totalLoaded++;
                                this.log(`    • Partido en ${collectionName}: ${matchData.teamA?.name || matchData.name || 'Sin nombre'} (ID: ${doc.id})`, 'info');
                            } else {
                                this.log(`    ⚠️ Duplicado ignorado en ${collectionName}: ${doc.id}`, 'warning');
                            }
                        });
                    } else {
                        this.log(`  ∅ Colección ${collectionName}: Vacía`, 'info');
                    }
                    
                } catch (error) {
                    this.log(`  ❌ Colección ${collectionName} no existe o error: ${error.message}`, 'warning');
                }
            }
            
            // 4. DIAGNÓSTICO ADICIONAL: Verificar si hay datos en Storage
            this.log('🔍 Paso 4: Verificando Storage...', 'info');
            if (window.Storage && Storage.matches) {
                this.log(`  📋 Storage.matches contiene: ${Storage.matches.length} partidos`, 'info');
                Storage.matches.forEach((match, index) => {
                    this.log(`    • Storage[${index}]: ${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'} (ID: ${match.id})`, 'info');
                });
            } else {
                this.log(`  ∅ Storage.matches no disponible o vacío`, 'warning');
            }
            
            // 5. Actualizar estadísticas y UI
            this.stats.totalMatches = totalLoaded;
            this.displayMatches();
            
            const manualCount = this.matches.filter(m => m.type === 'manual').length;
            const collaborativeCount = this.matches.filter(m => m.type === 'collaborative').length;
            const futbolCount = this.matches.filter(m => m.type === 'futbol').length;
            const otherCount = this.matches.filter(m => !['manual', 'collaborative', 'futbol'].includes(m.type)).length;
            
            this.log(`📊 RESUMEN DE CARGA:`, 'success');
            this.log(`  • Total partidos cargados: ${totalLoaded}`, 'success');
            this.log(`  • Manuales: ${manualCount}`, 'info');
            this.log(`  • Colaborativos: ${collaborativeCount}`, 'info');
            this.log(`  • Futbol: ${futbolCount}`, 'success');
            if (otherCount > 0) {
                this.log(`  • Otros: ${otherCount}`, 'info');
            }
            
            if (totalLoaded === 0) {
                this.log(`⚠️ No se encontraron partidos en ninguna colección`, 'warning');
                this.log(`🔍 Sugerencia: Revisa que Firebase esté conectado y que tengas los permisos correctos`, 'info');
            }
            
        } catch (error) {
            this.log(`❌ Error crítico cargando partidos: ${error.message}`, 'error');
            this.log(`📝 Stack: ${error.stack}`, 'error');
        }
    }

    /**
     * Cargar evaluaciones desde Firebase
     */
    async loadEvaluations() {
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
            
            // Badge de tipo
            let typeBadge = '';
            switch (match.type) {
                case 'manual':
                    typeBadge = '<span class="status-badge status-active">📝 Manual</span>';
                    break;
                case 'collaborative':
                    typeBadge = '<span class="status-badge status-pending">🤝 Colaborativo</span>';
                    break;
                case 'futbol':
                    typeBadge = '<span class="status-badge" style="background: #9b59b6; color: white;">⚽ Futbol</span>';
                    break;
                default:
                    typeBadge = `<span class="status-badge">❓ ${match.type || 'Desconocido'}</span>`;
            }
            
            // Badge de estado
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
                        <small>${match.format || '5v5'} | Balance: ${match.difference || 0} OVR</small><br>
                        ${typeBadge}
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
        const elements = {
            'total-players': this.stats.totalPlayers,
            'total-matches': this.stats.totalMatches,
            'total-evaluations': this.stats.totalEvaluations,
            'active-evaluations': this.stats.activeEvaluations,
            'total-groups': this.stats.totalGroups
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
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
        const consoleElement = document.getElementById('console-output');
        if (!consoleElement) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span style="opacity: 0.7;">${timestamp}</span> ${message}`;
        
        consoleElement.appendChild(logEntry);
        consoleElement.scrollTop = consoleElement.scrollHeight;
        
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
            log: (msg, type) => this.log(msg, type),
            // Funciones de diagnóstico
            diagnoseMatches: () => this.diagnoseMatchesLocation(),
            compareWithTestApp: () => this.compareWithTestApp(),
            scanAllCollections: () => this.scanAllCollections()
        };
        
        this.log('🛠️ Console helpers cargados: window.cpanel', 'info');
        this.log('  - cpanel.stats() - Ver estadísticas', 'info');
        this.log('  - cpanel.refresh() - Actualizar datos', 'info');
        this.log('  - cpanel.resetAll() - Reset jugadores a 50', 'info');
    }

    /**
     * FUNCIONES DE ELIMINACIÓN COMPLETAS
     */

    /**
     * Ver detalles de jugador
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

    /**
     * Reset jugador individual
     */
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

    /**
     * Eliminar jugador completamente
     */
    async deletePlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showNotification('Jugador no encontrado', 'error');
            return;
        }
        
        if (!confirm(`¿Eliminar definitivamente a ${player.name || 'este jugador'}?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- El jugador de todas las colecciones\n- Sus datos en evaluaciones\n- Sus referencias en partidos`)) {
            return;
        }
        
        try {
            this.log(`🗑️ Eliminando jugador ${player.name}...`, 'info');
            
            // 1. Eliminar de colección de usuarios autenticados
            if (player.source === 'authenticated' || player.isAuthenticated) {
                try {
                    await this.db.collection('futbol_users').doc(playerId).delete();
                    this.log(`  ✓ Eliminado de futbol_users`, 'info');
                } catch (error) {
                    this.log(`  ⚠️ Error eliminando de futbol_users: ${error.message}`, 'warning');
                }
            }
            
            // 2. Eliminar de colección de grupo
            if (player.groupId) {
                try {
                    await this.db.collection(`groups/${player.groupId}/players`).doc(playerId).delete();
                    this.log(`  ✓ Eliminado de grupo ${player.groupId}`, 'info');
                } catch (error) {
                    this.log(`  ⚠️ Error eliminando de grupo: ${error.message}`, 'warning');
                }
            }
            
            // 3. Limpiar referencias en evaluaciones
            try {
                const evaluationsSnapshot = await this.db.collection('evaluations').get();
                const batch = this.db.batch();
                let cleanedEvaluations = 0;
                
                evaluationsSnapshot.forEach(doc => {
                    const evalData = doc.data();
                    let needsUpdate = false;
                    
                    // Limpiar asignaciones
                    if (evalData.assignments && evalData.assignments[playerId]) {
                        delete evalData.assignments[playerId];
                        needsUpdate = true;
                    }
                    
                    // Limpiar completadas
                    if (evalData.completed && evalData.completed[playerId]) {
                        delete evalData.completed[playerId];
                        needsUpdate = true;
                    }
                    
                    if (needsUpdate) {
                        batch.update(doc.ref, {
                            assignments: evalData.assignments,
                            completed: evalData.completed
                        });
                        cleanedEvaluations++;
                    }
                });
                
                if (cleanedEvaluations > 0) {
                    await batch.commit();
                    this.log(`  ✓ Limpiado de ${cleanedEvaluations} evaluaciones`, 'info');
                }
                
            } catch (error) {
                this.log(`  ⚠️ Error limpiando evaluaciones: ${error.message}`, 'warning');
            }
            
            // 4. Actualizar datos locales
            this.players = this.players.filter(p => p.id !== playerId);
            this.stats.totalPlayers = this.players.length;
            
            // 5. Actualizar UI
            this.displayPlayers();
            this.updateDashboard();
            
            this.showNotification(`${player.name} eliminado completamente`, 'success');
            this.log(`✅ Jugador ${player.name} eliminado completamente de todas las colecciones`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando jugador: ${error.message}`, 'error');
            this.showNotification('Error eliminando jugador', 'error');
        }
    }

    /**
     * Ver detalles de partido
     */
    async viewMatch(matchId) {
        console.log('🔍 CPanel.viewMatch ejecutándose con ID:', matchId);
        this.log('🔍 Ejecutando viewMatch desde CPanel', 'info');
        
        const match = this.matches.find(m => m.id === matchId);
        if (!match) {
            this.showNotification('Partido no encontrado', 'error');
            return;
        }
        
        console.log('✅ Match encontrado:', match);
        this.log(`✅ Match encontrado: ${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'}`, 'info');
        
        // Crear modal personalizado para CPanel
        this.showMatchDetailsModal(match);
    }

    /**
     * Mostrar modal de detalles de partido
     */
    showMatchDetailsModal(match) {
        console.log('🎯 CPanel.showMatchDetailsModal ejecutándose:', match);
        this.log('🎯 Creando modal personalizado de CPanel', 'info');
        
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            position: relative;
        `;

        const teamAName = match.teamA?.name || 'Equipo A';
        const teamBName = match.teamB?.name || 'Equipo B';
        const matchDate = new Date(match.createdAt || match.date || Date.now());
        const format = match.format || '5v5';

        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #2c3e50;">⚽ Detalles del Partido</h2>
                <div style="margin-top: 10px; font-size: 18px; font-weight: bold; color: #3498db;">
                    ${teamAName} vs ${teamBName}
                </div>
                <div style="color: #7f8c8d; margin-top: 5px;">
                    ${format} | ${matchDate.toLocaleString()} | Balance: ${match.difference || 0} OVR
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                    <h3 style="text-align: center; background: #3498db; color: white; padding: 10px; margin: -15px -15px 15px; border-radius: 8px 8px 0 0;">
                        ${teamAName}
                    </h3>
                    <div style="text-align: center; margin-bottom: 10px; font-weight: bold;">
                        OVR: ${match.teamA?.ovr || 'N/A'} | Jugadores: ${match.teamA?.players?.length || 0}
                    </div>
                    ${match.teamA?.players ? match.teamA.players.map(player => `
                        <div style="padding: 8px; background: white; margin: 3px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 500;">${player.name || 'Sin nombre'}</span>
                            <span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                                ${player.position || 'MED'} (${player.ovr || 'N/A'})
                            </span>
                        </div>
                    `).join('') : '<div style="text-align: center; color: #7f8c8d;">Sin jugadores</div>'}
                </div>

                <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                    <h3 style="text-align: center; background: #e74c3c; color: white; padding: 10px; margin: -15px -15px 15px; border-radius: 8px 8px 0 0;">
                        ${teamBName}
                    </h3>
                    <div style="text-align: center; margin-bottom: 10px; font-weight: bold;">
                        OVR: ${match.teamB?.ovr || 'N/A'} | Jugadores: ${match.teamB?.players?.length || 0}
                    </div>
                    ${match.teamB?.players ? match.teamB.players.map(player => `
                        <div style="padding: 8px; background: white; margin: 3px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 500;">${player.name || 'Sin nombre'}</span>
                            <span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                                ${player.position || 'MED'} (${player.ovr || 'N/A'})
                            </span>
                        </div>
                    `).join('') : '<div style="text-align: center; color: #7f8c8d;">Sin jugadores</div>'}
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📊 Información Técnica</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                    <div><strong>ID:</strong> ${match.id}</div>
                    <div><strong>Estado:</strong> ${match.status || 'Programado'}</div>
                    <div><strong>Colección:</strong> ${match.collection || 'N/A'}</div>
                    <div><strong>Tipo:</strong> ${match.type || 'N/A'}</div>
                    <div><strong>Fuente:</strong> ${match.source || 'N/A'}</div>
                    ${match.groupId ? `<div><strong>Grupo ID:</strong> ${match.groupId}</div>` : ''}
                </div>
            </div>

            <div style="text-align: center;">
                <button id="close-modal" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                ">
                    🔒 Cerrar
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event listeners para cerrar
        document.getElementById('close-modal').onclick = () => {
            document.body.removeChild(overlay);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Eliminar partido completamente
     */
    async deleteMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) {
            this.showNotification('Partido no encontrado', 'error');
            return;
        }
        
        const teamAName = match.teamA?.name || 'Equipo A';
        const teamBName = match.teamB?.name || 'Equipo B';
        
        if (!confirm(`¿Eliminar partido ${teamAName} vs ${teamBName}?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- El partido de la base de datos\n- Las evaluaciones asociadas\n- Todas las referencias`)) {
            return;
        }
        
        try {
            this.log(`🗑️ Eliminando partido ${teamAName} vs ${teamBName}...`, 'info');
            
            // 1. Eliminar evaluaciones asociadas
            try {
                const evaluationsSnapshot = await this.db.collection('evaluations')
                    .where('matchId', '==', matchId)
                    .get();
                
                const batch = this.db.batch();
                evaluationsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                if (!evaluationsSnapshot.empty) {
                    await batch.commit();
                    this.log(`  ✓ Eliminadas ${evaluationsSnapshot.size} evaluaciones asociadas`, 'info');
                }
                
            } catch (error) {
                this.log(`  ⚠️ Error eliminando evaluaciones: ${error.message}`, 'warning');
            }
            
            // 2. Eliminar partido de Firebase (usando la colección correcta)
            let deletedFromFirebase = false;
            
            // 2a. Intentar eliminar de la colección específica
            if (match.collection) {
                try {
                    if (match.collection.includes('/')) {
                        // Es una colección anidada como groups/{id}/matches
                        await this.db.collection(match.collection).doc(matchId).delete();
                        this.log(`  ✓ Eliminado de ${match.collection}`, 'info');
                        deletedFromFirebase = true;
                    } else {
                        // Es una colección plana como futbol_matches, matches, etc.
                        await this.db.collection(match.collection).doc(matchId).delete();
                        this.log(`  ✓ Eliminado de colección ${match.collection}`, 'info');
                        deletedFromFirebase = true;
                    }
                } catch (error) {
                    this.log(`  ⚠️ Error eliminando de ${match.collection}: ${error.message}`, 'warning');
                }
            }
            
            // 2b. Fallback: intentar eliminar de ubicaciones comunes si no se eliminó arriba
            if (!deletedFromFirebase) {
                const possibleCollections = ['futbol_matches', 'matches'];
                
                for (const collection of possibleCollections) {
                    try {
                        await this.db.collection(collection).doc(matchId).delete();
                        this.log(`  ✓ Eliminado de colección ${collection} (fallback)`, 'info');
                        deletedFromFirebase = true;
                        break;
                    } catch (error) {
                        // Continuar con la siguiente colección
                    }
                }
            }
            
            // 2c. Eliminar también de grupo si aplica (por si está en ambos lugares)
            if (match.groupId) {
                try {
                    await this.db.collection(`groups/${match.groupId}/matches`).doc(matchId).delete();
                    this.log(`  ✓ Eliminado también de grupo ${match.groupId}`, 'info');
                } catch (error) {
                    this.log(`  ⚠️ No se pudo eliminar del grupo: ${error.message}`, 'warning');
                }
            }
            
            if (!deletedFromFirebase) {
                throw new Error('No se pudo eliminar el partido de ninguna colección de Firebase');
            }
            
            // 3. Recargar datos desde Firebase para asegurar consistencia
            this.log('🔄 Recargando datos para verificar eliminación...', 'info');
            await this.loadMatches();
            await this.loadEvaluations();
            
            // 4. Actualizar UI y estadísticas
            this.stats.totalMatches = this.matches.length;
            this.stats.totalEvaluations = this.evaluations.length;
            this.stats.activeEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
            
            this.displayMatches();
            if (this.currentTab === 'evaluations') {
                this.displayEvaluations();
            }
            this.updateDashboard();
            
            this.showNotification(`Partido ${teamAName} vs ${teamBName} eliminado completamente`, 'success');
            this.log(`✅ Partido eliminado completamente con todas sus referencias`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando partido: ${error.message}`, 'error');
            this.showNotification('Error eliminando partido', 'error');
        }
    }

    /**
     * Ver detalles de evaluación
     */
    async viewEvaluation(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) {
            this.showNotification('Evaluación no encontrada', 'error');
            return;
        }

        const totalAssignments = Object.keys(evaluation.assignments || {}).length;
        const completedCount = Object.keys(evaluation.completed || {}).length;
        const participationRate = Math.round((evaluation.participationRate || 0) * 100);
        
        let details = `DETALLES DE EVALUACIÓN:\n`;
        details += `===============================\n`;
        details += `ID: ${evaluation.id}\n`;
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
        
        if (evaluation.assignments && Object.keys(evaluation.assignments).length > 0) {
            details += `\nASIGNACIONES:\n`;
            details += `--------------\n`;
            
            Object.entries(evaluation.assignments).forEach(([playerId, assignment]) => {
                details += `\n• ${assignment.playerName || playerId}:\n`;
                details += `  Estado: ${assignment.completed ? '✅ Completada' : '⏳ Pendiente'}\n`;
                
                if (assignment.toEvaluate) {
                    details += `  Debe evaluar a: ${assignment.toEvaluate.map(p => p.name).join(', ')}\n`;
                }
                
                if (assignment.completed && assignment.completedAt) {
                    details += `  Completada el: ${new Date(assignment.completedAt).toLocaleString()}\n`;
                }
            });
        }
        
        alert(details);
    }

    /**
     * Forzar actualización de OVRs
     */
    async forceOVRUpdate(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) {
            this.showNotification('Evaluación no encontrada', 'error');
            return;
        }
        
        if (!confirm(`¿Forzar actualización de OVRs para la evaluación ${evaluation.matchName || 'sin nombre'}?\n\nEsto actualizará los OVRs de los jugadores basándose en las evaluaciones completadas hasta el momento.`)) {
            return;
        }
        
        try {
            this.log(`⚡ Forzando actualización de OVRs para evaluación ${evaluation.matchName}...`, 'info');
            
            // Usar el sistema unificado de evaluaciones si está disponible
            if (window.UnifiedEvaluationSystem) {
                await window.UnifiedEvaluationSystem.updatePlayerOVRs(evaluation);
                this.log(`  ✓ OVRs actualizados usando UnifiedEvaluationSystem`, 'info');
            } else {
                // Implementación manual si no está disponible el sistema unificado
                await this.manualOVRUpdate(evaluation);
            }
            
            // Recargar evaluaciones para mostrar cambios
            await this.loadEvaluations();
            await this.loadPlayers(); // También recargar jugadores para ver OVRs actualizados
            
            this.showNotification('OVRs actualizados forzosamente', 'success');
            this.log(`✅ Actualización forzosa de OVRs completada`, 'success');
            
        } catch (error) {
            this.log(`❌ Error forzando actualización de OVRs: ${error.message}`, 'error');
            this.showNotification('Error forzando actualización de OVRs', 'error');
        }
    }

    /**
     * Eliminar evaluación completamente
     */
    async deleteEvaluation(evaluationId) {
        const evaluation = this.evaluations.find(e => e.id === evaluationId);
        if (!evaluation) {
            this.showNotification('Evaluación no encontrada', 'error');
            return;
        }
        
        if (!confirm(`¿Eliminar evaluación ${evaluation.matchName || 'sin nombre'}?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- La evaluación completa\n- Todas las asignaciones\n- Todo el progreso de evaluación`)) {
            return;
        }
        
        try {
            this.log(`🗑️ Eliminando evaluación ${evaluation.matchName}...`, 'info');
            
            // Eliminar de Firebase
            await this.db.collection('evaluations').doc(evaluationId).delete();
            this.log(`  ✓ Eliminada de Firebase`, 'info');
            
            // Actualizar datos locales
            this.evaluations = this.evaluations.filter(e => e.id !== evaluationId);
            this.stats.totalEvaluations = this.evaluations.length;
            this.stats.activeEvaluations = this.evaluations.filter(e => e.status === 'pending').length;
            
            // Actualizar UI
            this.displayEvaluations();
            this.updateDashboard();
            
            this.showNotification(`Evaluación ${evaluation.matchName} eliminada completamente`, 'success');
            this.log(`✅ Evaluación eliminada completamente`, 'success');
            
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
     * FUNCIONES DE LIMPIEZA INTELIGENTE
     */
    
    async removeDuplicatePlayers() {
        this.log('🧼 Detectando jugadores duplicados...', 'info');
        
        try {
            // Agrupar jugadores por criterios de duplicación
            const duplicateGroups = this.findDuplicatePlayers();
            
            if (duplicateGroups.length === 0) {
                this.showNotification('No se encontraron jugadores duplicados', 'info');
                this.log('✅ No hay jugadores duplicados', 'success');
                return;
            }
            
            // Mostrar resumen de duplicados encontrados
            let duplicateInfo = `🧼 DUPLICADOS ENCONTRADOS:\n\n`;
            let totalDuplicates = 0;
            
            duplicateGroups.forEach((group, index) => {
                duplicateInfo += `Grupo ${index + 1} - ${group.criteria}:\n`;
                group.duplicates.forEach(player => {
                    duplicateInfo += `  • ${player.name || 'Sin nombre'} (${player.id}) - ${player.source}\n`;
                });
                duplicateInfo += `\n`;
                totalDuplicates += group.duplicates.length - 1; // -1 porque mantenemos uno
            });
            
            duplicateInfo += `Total a eliminar: ${totalDuplicates} jugadores duplicados`;
            
            if (!confirm(`${duplicateInfo}\n\n¿Eliminar ${totalDuplicates} jugadores duplicados?\n\nEsta acción es IRREVERSIBLE.`)) {
                return;
            }
            
            // Eliminar duplicados
            let eliminatedCount = 0;
            
            for (const group of duplicateGroups) {
                const playersToDelete = this.selectPlayersToDelete(group.duplicates);
                
                this.log(`🧼 Grupo "${group.criteria}": Eliminando ${playersToDelete.length} de ${group.duplicates.length} duplicados`, 'info');
                
                for (const player of playersToDelete) {
                    try {
                        await this.deletePlayerSilently(player);
                        eliminatedCount++;
                        this.log(`  ✓ Eliminado: ${player.name || 'Sin nombre'} (${player.id})`, 'info');
                    } catch (error) {
                        this.log(`  ❌ Error eliminando ${player.name}: ${error.message}`, 'error');
                    }
                }
            }
            
            // Recargar jugadores
            await this.loadPlayers();
            this.updateDashboard();
            
            this.showNotification(`${eliminatedCount} jugadores duplicados eliminados`, 'success');
            this.log(`✅ Eliminación de duplicados completada: ${eliminatedCount} jugadores eliminados`, 'success');
            
        } catch (error) {
            this.log(`❌ Error eliminando duplicados: ${error.message}`, 'error');
            this.showNotification('Error eliminando duplicados', 'error');
        }
    }
    
    findDuplicatePlayers() {
        const duplicateGroups = [];
        const processedEmails = new Set();
        const processedNames = new Set();
        
        // 1. Buscar duplicados por email
        this.players.forEach(player => {
            const email = player.email;
            if (email && !processedEmails.has(email)) {
                const duplicatesGroup = this.players.filter(p => p.email === email);
                if (duplicatesGroup.length > 1) {
                    duplicateGroups.push({
                        criteria: `Email: ${email}`,
                        duplicates: duplicatesGroup
                    });
                    processedEmails.add(email);
                }
            }
        });
        
        // 2. Buscar duplicados por nombre (excluyendo los ya procesados por email)
        this.players.forEach(player => {
            const name = player.name;
            if (name && name !== 'Sin nombre' && !processedNames.has(name)) {
                const duplicatesGroup = this.players.filter(p => 
                    p.name === name && 
                    !processedEmails.has(p.email) // No incluir si ya fue procesado por email
                );
                
                if (duplicatesGroup.length > 1) {
                    duplicateGroups.push({
                        criteria: `Nombre: ${name}`,
                        duplicates: duplicatesGroup
                    });
                    processedNames.add(name);
                }
            }
        });
        
        // 3. Buscar duplicados por ID similar (casos especiales)
        const processedIds = new Set();
        this.players.forEach(player => {
            if (!processedIds.has(player.id)) {
                // Buscar IDs que sean muy similares o iguales
                const similarPlayers = this.players.filter(p => 
                    p.id === player.id || // ID exactamente igual (no debería pasar, pero por si acaso)
                    (p.name === player.name && p.email === player.email) // Mismo nombre y email
                );
                
                if (similarPlayers.length > 1) {
                    const alreadyInGroup = duplicateGroups.some(group => 
                        group.duplicates.some(dp => dp.id === player.id)
                    );
                    
                    if (!alreadyInGroup) {
                        duplicateGroups.push({
                            criteria: `ID/Datos similares: ${player.name || 'Sin nombre'}`,
                            duplicates: similarPlayers
                        });
                        similarPlayers.forEach(p => processedIds.add(p.id));
                    }
                }
            }
        });
        
        return duplicateGroups;
    }
    
    selectPlayersToDelete(duplicates) {
        // Estrategia inteligente para decidir cuál mantener y cuáles eliminar
        
        // Prioridades (mayor número = mayor prioridad para mantener):
        const priorities = duplicates.map(player => {
            let priority = 0;
            
            // +10 si es autenticado
            if (player.source === 'authenticated' || player.isAuthenticated) {
                priority += 10;
            }
            
            // +5 si ha sido evaluado
            if (player.hasBeenEvaluated) {
                priority += 5;
            }
            
            // +3 si tiene email
            if (player.email) {
                priority += 3;
            }
            
            // +2 si tiene nombre real (no "Sin nombre")
            if (player.name && player.name !== 'Sin nombre') {
                priority += 2;
            }
            
            // +1 si tiene posición definida
            if (player.position && player.position !== 'N/A') {
                priority += 1;
            }
            
            // +1 por cada 10 puntos de OVR por encima de 50
            if (player.ovr && player.ovr > 50) {
                priority += Math.floor((player.ovr - 50) / 10);
            }
            
            return { player, priority };
        });
        
        // Ordenar por prioridad (mayor primero)
        priorities.sort((a, b) => b.priority - a.priority);
        
        // Mantener el primero (mayor prioridad), eliminar el resto
        const toKeep = priorities[0].player;
        const toDelete = priorities.slice(1).map(p => p.player);
        
        this.log(`  → Manteniendo: ${toKeep.name || 'Sin nombre'} (${toKeep.source}, prioridad: ${priorities[0].priority})`, 'info');
        toDelete.forEach((player, index) => {
            this.log(`  → Eliminando: ${player.name || 'Sin nombre'} (${player.source}, prioridad: ${priorities[index + 1].priority})`, 'warning');
        });
        
        return toDelete;
    }
    
    async deletePlayerSilently(player) {
        // Versión silenciosa de deletePlayer (sin confirmaciones ni notificaciones)
        
        // 1. Eliminar de colección de usuarios autenticados
        if (player.source === 'authenticated' || player.isAuthenticated) {
            try {
                await this.db.collection('futbol_users').doc(player.id).delete();
            } catch (error) {
                // Continuar aunque falle
            }
        }
        
        // 2. Eliminar de colección de grupo
        if (player.groupId) {
            try {
                await this.db.collection(`groups/${player.groupId}/players`).doc(player.id).delete();
            } catch (error) {
                // Continuar aunque falle
            }
        }
        
        // 3. Limpiar referencias en evaluaciones (versión simplificada)
        try {
            const evaluationsSnapshot = await this.db.collection('evaluations')
                .where(`assignments.${player.id}`, '!=', null)
                .limit(5) // Limitar para evitar operaciones muy costosas
                .get();
            
            if (!evaluationsSnapshot.empty) {
                const batch = this.db.batch();
                evaluationsSnapshot.forEach(doc => {
                    const evalData = doc.data();
                    if (evalData.assignments && evalData.assignments[player.id]) {
                        delete evalData.assignments[player.id];
                    }
                    if (evalData.completed && evalData.completed[player.id]) {
                        delete evalData.completed[player.id];
                    }
                    batch.update(doc.ref, {
                        assignments: evalData.assignments,
                        completed: evalData.completed
                    });
                });
                await batch.commit();
            }
        } catch (error) {
            // Continuar aunque falle la limpieza de evaluaciones
        }
        
        // 4. Actualizar datos locales
        this.players = this.players.filter(p => p.id !== player.id);
        this.stats.totalPlayers = this.players.length;
    }
    
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
     * FUNCIONES PELIGROSAS - ELIMINACIÓN MASIVA
     */
    
    async deleteAllPlayers() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS JUGADORES?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- Todos los jugadores de todas las colecciones\n- Sus referencias en partidos y evaluaciones')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL:\n\n¿Realmente quieres eliminar TODOS los jugadores?\n\nEscribe "ELIMINAR TODOS" para confirmar.')) {
            return;
        }
        
        const confirmation = prompt('Escribe exactamente "ELIMINAR TODOS" para confirmar:');
        if (confirmation !== 'ELIMINAR TODOS') {
            this.showNotification('Confirmación incorrecta. Operación cancelada.', 'warning');
            return;
        }
        
        try {
            this.log('⚠️ ELIMINACIÓN MASIVA DE JUGADORES INICIADA', 'warning');
            
            for (const player of [...this.players]) {
                await this.deletePlayer(player.id);
            }
            
            this.showNotification('TODOS los jugadores eliminados', 'success');
            this.log('✅ Eliminación masiva de jugadores completada', 'success');
            
        } catch (error) {
            this.log(`❌ Error en eliminación masiva: ${error.message}`, 'error');
            this.showNotification('Error en eliminación masiva', 'error');
        }
    }
    
    async deleteAllMatches() {
        if (!confirm('⚠️ ¿ELIMINAR TODOS LOS PARTIDOS?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- Todos los partidos\n- Todas las evaluaciones asociadas')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL:\n\n¿Realmente quieres eliminar TODOS los partidos?\n\nEscribe "ELIMINAR TODOS" para confirmar.')) {
            return;
        }
        
        const confirmation = prompt('Escribe exactamente "ELIMINAR TODOS" para confirmar:');
        if (confirmation !== 'ELIMINAR TODOS') {
            this.showNotification('Confirmación incorrecta. Operación cancelada.', 'warning');
            return;
        }
        
        try {
            this.log('⚠️ ELIMINACIÓN MASIVA DE PARTIDOS INICIADA', 'warning');
            
            for (const match of [...this.matches]) {
                await this.deleteMatch(match.id);
            }
            
            this.showNotification('TODOS los partidos eliminados', 'success');
            this.log('✅ Eliminación masiva de partidos completada', 'success');
            
        } catch (error) {
            this.log(`❌ Error en eliminación masiva: ${error.message}`, 'error');
            this.showNotification('Error en eliminación masiva', 'error');
        }
    }
    
    async deleteAllEvaluations() {
        if (!confirm('⚠️ ¿ELIMINAR TODAS LAS EVALUACIONES?\n\nEsta acción es IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMACIÓN FINAL:\n\n¿Realmente quieres eliminar TODAS las evaluaciones?\n\nEscribe "ELIMINAR TODOS" para confirmar.')) {
            return;
        }
        
        const confirmation = prompt('Escribe exactamente "ELIMINAR TODOS" para confirmar:');
        if (confirmation !== 'ELIMINAR TODOS') {
            this.showNotification('Confirmación incorrecta. Operación cancelada.', 'warning');
            return;
        }
        
        try {
            this.log('⚠️ ELIMINACIÓN MASIVA DE EVALUACIONES INICIADA', 'warning');
            
            for (const evaluation of [...this.evaluations]) {
                await this.deleteEvaluation(evaluation.id);
            }
            
            this.showNotification('TODAS las evaluaciones eliminadas', 'success');
            this.log('✅ Eliminación masiva de evaluaciones completada', 'success');
            
        } catch (error) {
            this.log(`❌ Error en eliminación masiva: ${error.message}`, 'error');
            this.showNotification('Error en eliminación masiva', 'error');
        }
    }
    
    async nukeEverything() {
        if (!confirm('☢️ PELIGRO EXTREMO \n\n¿ELIMINAR TODO DE LA BASE DE DATOS?\n\nEsto incluye:\n- Todos los jugadores\n- Todos los partidos\n- Todas las evaluaciones\n\nEsta acción es COMPLETAMENTE IRREVERSIBLE.')) {
            return;
        }
        
        if (!confirm('🚨🚨🚨 Última oportunidad 🚨🚨🚨\n\n¿Estás ABSOLUTAMENTE seguro?\n\nEscribe "ELIMINAR TODO" para confirmar.')) {
            return;
        }
        
        const confirmation = prompt('Escribe exactamente "ELIMINAR TODO" para confirmar:');
        if (confirmation !== 'ELIMINAR TODO') {
            this.showNotification('Confirmación incorrecta. Operación cancelada.', 'warning');
            return;
        }
        
        try {
            this.log('☢️ OPCIÓN NUCLEAR ACTIVADA - ELIMINANDO TODO', 'error');
            
            await this.deleteAllEvaluations();
            await this.deleteAllMatches();
            await this.deleteAllPlayers();
            
            this.showNotification('☢️ BASE DE DATOS COMPLETAMENTE LIMPIA', 'success');
            this.log('✅ Opción nuclear completada - Todo eliminado', 'success');
            
        } catch (error) {
            this.log(`❌ Error en opción nuclear: ${error.message}`, 'error');
            this.showNotification('Error en eliminación completa', 'error');
        }
    }
    
    /**
     * FUNCIÓN DE EXPORTACIÓN
     */
    
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
    
    async manualOVRUpdate(evaluation) {
        this.log('  ⚠️ UnifiedEvaluationSystem no disponible, usando implementación manual', 'warning');
        
        // Recopilar todas las evaluaciones por jugador
        const playerRatings = {};
        
        Object.values(evaluation.assignments || {}).forEach(assignment => {
            if (assignment.completed && assignment.evaluations) {
                Object.entries(assignment.evaluations).forEach(([playerId, evaluationData]) => {
                    if (!playerRatings[playerId]) {
                        playerRatings[playerId] = [];
                    }
                    playerRatings[playerId].push(evaluationData.rating);
                });
            }
        });
        
        // Actualizar OVRs
        for (const [playerId, ratings] of Object.entries(playerRatings)) {
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const ovrChange = Math.round((avgRating - 5) * 2); // Convertir 1-10 a cambio de OVR
            
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                const newOVR = Math.max(40, Math.min(99, (player.ovr || 70) + ovrChange));
                
                const updatedData = {
                    ...player,
                    ovr: newOVR,
                    lastOVRUpdate: Date.now()
                };
                
                await this.updatePlayerInFirebase(player, updatedData);
                this.log(`  ✓ ${player.name}: OVR ${player.ovr} → ${newOVR} (cambio: ${ovrChange})`, 'info');
            }
        }
        
        // Marcar evaluación como actualizada
        await this.db.collection('evaluations').doc(evaluation.id).update({
            ovrUpdateTriggered: true,
            ovrUpdatedAt: Date.now()
        });
    }
    
    /**
     * FUNCIONES DE DIAGNÓSTICO
     */
    
    async diagnoseMatchesLocation() {
        this.log('🔍 DIAGNÓSTICO: Buscando dónde están los partidos...', 'info');
        
        const locations = [];
        
        try {
            // Revisar Storage si está disponible
            if (window.Storage) {
                if (Storage.matches && Storage.matches.length > 0) {
                    locations.push({
                        location: 'window.Storage.matches',
                        count: Storage.matches.length,
                        source: 'local',
                        data: Storage.matches
                    });
                    this.log(`  ✓ Storage.matches: ${Storage.matches.length} partidos`, 'success');
                }
                
                if (Storage.collaborativeMatches && Storage.collaborativeMatches.length > 0) {
                    locations.push({
                        location: 'window.Storage.collaborativeMatches', 
                        count: Storage.collaborativeMatches.length,
                        source: 'local',
                        data: Storage.collaborativeMatches
                    });
                    this.log(`  ✓ Storage.collaborativeMatches: ${Storage.collaborativeMatches.length} partidos`, 'success');
                }
            }
            
            // Revisar todas las colecciones de Firebase
            const collectionsToCheck = [
                'matches', 'match', 'Match', 'partido', 'partidos', 'games', 'game',
                'collaborativeMatches', 'collaborative_matches', 'manual_matches', 'manualMatches'
            ];
            
            for (const collection of collectionsToCheck) {
                try {
                    const snapshot = await this.db.collection(collection).get();
                    if (!snapshot.empty) {
                        const docs = [];
                        snapshot.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
                        locations.push({
                            location: `Firebase: ${collection}`,
                            count: snapshot.size,
                            source: 'firebase',
                            data: docs
                        });
                        this.log(`  ✓ Firebase.${collection}: ${snapshot.size} documentos`, 'success');
                    }
                } catch (error) {
                    // Colección no existe
                }
            }
            
            // Revisar grupos
            const groupsSnapshot = await this.db.collection('groups').get();
            for (const groupDoc of groupsSnapshot.docs) {
                const groupId = groupDoc.id;
                try {
                    const matchesSnapshot = await this.db.collection(`groups/${groupId}/matches`).get();
                    if (!matchesSnapshot.empty) {
                        const docs = [];
                        matchesSnapshot.forEach(doc => docs.push({id: doc.id, ...doc.data()}));
                        locations.push({
                            location: `Firebase: groups/${groupId}/matches`,
                            count: matchesSnapshot.size,
                            source: 'firebase',
                            data: docs
                        });
                        this.log(`  ✓ groups/${groupId}/matches: ${matchesSnapshot.size} documentos`, 'success');
                    }
                } catch (error) {
                    // Grupo sin partidos
                }
            }
            
            // Mostrar resumen
            if (locations.length === 0) {
                this.log('❌ No se encontraron partidos en ninguna ubicación', 'error');
            } else {
                this.log(`📊 RESUMEN - Encontrados partidos en ${locations.length} ubicaciones:`, 'success');
                locations.forEach(loc => {
                    this.log(`  • ${loc.location}: ${loc.count} partidos`, 'info');
                });
            }
            
            return locations;
            
        } catch (error) {
            this.log(`❌ Error en diagnóstico: ${error.message}`, 'error');
            return [];
        }
    }
    
    async compareWithTestApp() {
        this.log('🔍 COMPARACIÓN: CPanel vs TestApp...', 'info');
        
        try {
            // Datos de CPanel
            const cpanelMatches = this.matches.length;
            
            // Datos de TestApp/Storage
            let testAppMatches = 0;
            if (window.Storage && Storage.matches) {
                testAppMatches = Storage.matches.length;
            }
            
            this.log(`📊 COMPARACIÓN:`, 'info');
            this.log(`  • CPanel encuentra: ${cpanelMatches} partidos`, 'info');
            this.log(`  • TestApp/Storage tiene: ${testAppMatches} partidos`, 'info');
            
            if (testAppMatches > cpanelMatches) {
                this.log(`⚠️ TestApp tiene más partidos que CPanel`, 'warning');
                this.log(`🔍 Analizando dónde están los partidos de TestApp...`, 'info');
                
                if (window.Storage && Storage.matches) {
                    Storage.matches.forEach((match, index) => {
                        this.log(`  TestApp[${index}]: ${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'} (ID: ${match.id})`, 'info');
                    });
                }
            }
            
        } catch (error) {
            this.log(`❌ Error comparando con TestApp: ${error.message}`, 'error');
        }
    }
    
    async scanAllCollections() {
        this.log('🔍 ESCANEO COMPLETO: Todas las colecciones de Firebase...', 'info');
        
        try {
            // Lista extendida de posibles nombres de colecciones
            const allPossibleCollections = [
                // Partidos
                'matches', 'match', 'Match', 'MATCHES',
                'partido', 'partidos', 'Partido', 'Partidos',
                'game', 'games', 'Game', 'Games',
                'collaborativeMatches', 'collaborative_matches',
                'manualMatches', 'manual_matches',
                'futbolMatches', 'futbol_matches',
                
                // Jugadores
                'players', 'player', 'Player', 'PLAYERS',
                'jugador', 'jugadores', 'Jugador', 'Jugadores',
                'futbol_users', 'futbolUsers',
                
                // Evaluaciones
                'evaluations', 'evaluation', 'Evaluation',
                'evaluacion', 'evaluaciones',
                
                // Otros
                'groups', 'group', 'Group',
                'teams', 'team', 'Team',
                'users', 'user', 'User',
                'data', 'Data', 'datos'
            ];
            
            const foundCollections = [];
            
            for (const collectionName of allPossibleCollections) {
                try {
                    const snapshot = await this.db.collection(collectionName).get();
                    if (!snapshot.empty) {
                        foundCollections.push({
                            name: collectionName,
                            count: snapshot.size,
                            firstDoc: snapshot.docs[0]?.data()
                        });
                        this.log(`  ✓ ${collectionName}: ${snapshot.size} documentos`, 'success');
                    }
                } catch (error) {
                    // Colección no existe
                }
            }
            
            this.log(`📊 COLECCIONES ENCONTRADAS: ${foundCollections.length}`, 'success');
            foundCollections.forEach(col => {
                this.log(`  • ${col.name}: ${col.count} docs`, 'info');
            });
            
            return foundCollections;
            
        } catch (error) {
            this.log(`❌ Error escaneando colecciones: ${error.message}`, 'error');
            return [];
        }
    }
}

// Crear instancia global
const CPanel = new ControlPanel();

// Hacer disponible globalmente
window.CPanel = CPanel;