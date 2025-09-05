/**
 * Stats Controller - Controlador para las estadísticas avanzadas
 * Integra ChartsManager con los datos de la aplicación
 */

const StatsController = {
    currentPlayerId: null,
    statsCache: {},
    
    /**
     * Inicializa el controlador de estadísticas
     */
    init() {
        console.log('📊 Stats Controller initialized');
        this.setupEventListeners();
        ChartsManager.init();
    },
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Tabs de estadísticas
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchStatsTab(e.target.dataset.tab);
            });
        });
        
        // Selector de jugador
        const playerSelect = document.getElementById('player-select-stats');
        if (playerSelect) {
            playerSelect.addEventListener('change', (e) => {
                this.loadPlayerStats(e.target.value);
            });
        }
        
        // Comparación de jugadores
        const compareBtn = document.getElementById('compare-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.comparePlayersconst();
            });
        }
        
        // Controles de evolución
        const evolutionMetric = document.getElementById('evolution-metric');
        const evolutionPeriod = document.getElementById('evolution-period');
        if (evolutionMetric && evolutionPeriod) {
            evolutionMetric.addEventListener('change', () => this.updateEvolutionChart());
            evolutionPeriod.addEventListener('change', () => this.updateEvolutionChart());
        }
    },
    
    /**
     * Carga la pantalla de estadísticas avanzadas
     */
    async loadAdvancedStatsScreen() {
        // Actualizar nombre del grupo
        const group = Storage.getCurrentGroup();
        const groupName = group ? Storage.getGroupById(group.id)?.name : 'Sin Grupo';
        const groupNameEl = document.getElementById('adv-stats-group-name');
        if (groupNameEl) groupNameEl.textContent = groupName;
        
        // Cargar jugadores
        const players = Storage.getPlayers();
        this.populatePlayerSelectors(players);
        
        // Cargar estadísticas del grupo por defecto
        this.loadGroupStats();
    },
    
    /**
     * Cambia entre tabs de estadísticas
     */
    switchStatsTab(tabName) {
        // Actualizar tabs activos
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Actualizar contenido
        document.querySelectorAll('.stats-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Cargar datos según el tab
        switch(tabName) {
            case 'player-stats':
                const selectedPlayer = document.getElementById('player-select-stats').value;
                if (selectedPlayer) this.loadPlayerStats(selectedPlayer);
                break;
            case 'group-stats':
                this.loadGroupStats();
                break;
            case 'comparison':
                // Ya está cargado
                break;
            case 'evolution':
                this.updateEvolutionChart();
                break;
        }
    },
    
    /**
     * Llena los selectores de jugadores
     */
    populatePlayerSelectors(players) {
        const selectors = [
            'player-select-stats',
            'player1-compare',
            'player2-compare'
        ];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) return;
            
            // Mantener selección actual si existe
            const currentValue = select.value;
            
            select.innerHTML = '<option value="">Selecciona un jugador</option>';
            
            players.sort((a, b) => b.ovr - a.ovr).forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (${player.position}) - OVR ${player.ovr}`;
                select.appendChild(option);
            });
            
            // Restaurar selección
            if (currentValue) select.value = currentValue;
        });
    },
    
    /**
     * Carga estadísticas de un jugador
     */
    async loadPlayerStats(playerId) {
        if (!playerId) return;
        
        const player = Storage.getPlayerById(playerId);
        if (!player) return;
        
        this.currentPlayerId = playerId;
        
        // Crear gráfico de radar
        ChartsManager.createPlayerRadarChart('player-radar-chart', player);
        
        // Crear gráfico de evolución (simulado por ahora)
        const evolutionData = this.getPlayerEvolutionData(player);
        ChartsManager.createOVREvolutionChart('player-ovr-evolution', evolutionData);
        
        // Cargar estadísticas detalladas
        this.displayPlayerDetailedStats(player);
    },
    
    /**
     * Obtiene datos de evolución de un jugador
     */
    getPlayerEvolutionData(player) {
        // Por ahora simularemos la evolución
        // En producción, esto vendría del historial guardado
        const matches = Storage.getMatches() || [];
        const playerMatches = matches.filter(match => {
            const inTeamA = match.teamA?.players?.some(p => p.id === player.id);
            const inTeamB = match.teamB?.players?.some(p => p.id === player.id);
            return inTeamA || inTeamB;
        });
        
        const dates = [];
        const ovrValues = [];
        let currentOvr = player.ovr;
        
        // Simular evolución basada en evaluaciones
        playerMatches.slice(-10).forEach((match, index) => {
            const date = new Date(match.date);
            dates.push(date.toLocaleDateString());
            
            // Buscar evaluación del jugador
            const evaluation = match.evaluations?.find(e => e.playerId === player.id);
            if (evaluation && evaluation.performanceTags) {
                // Ajustar OVR basado en performance
                const tagCount = evaluation.performanceTags.length;
                currentOvr = Math.min(99, currentOvr + (tagCount * 0.5));
            }
            
            ovrValues.push(currentOvr);
        });
        
        // Si no hay suficientes datos, crear datos de ejemplo
        if (dates.length < 5) {
            const today = new Date();
            for (let i = 4; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - (i * 7));
                dates.push(date.toLocaleDateString());
                ovrValues.push(Math.max(40, player.ovr - (i * 2)));
            }
        }
        
        return { dates, ovr: ovrValues };
    },
    
    /**
     * Muestra estadísticas detalladas del jugador
     */
    displayPlayerDetailedStats(player) {
        const container = document.getElementById('player-detailed-stats');
        if (!container) return;
        
        const matches = Storage.getMatches() || [];
        const playerMatches = matches.filter(match => {
            const inTeamA = match.teamA?.players?.some(p => p.id === player.id);
            const inTeamB = match.teamB?.players?.some(p => p.id === player.id);
            return inTeamA || inTeamB;
        });
        
        // Calcular estadísticas
        let goals = 0;
        let assists = 0;
        let wins = 0;
        let mvpCount = 0;
        
        playerMatches.forEach(match => {
            const evaluation = match.evaluations?.find(e => e.playerId === player.id);
            if (evaluation && evaluation.performanceTags) {
                if (evaluation.performanceTags.includes('goleador')) goals++;
                if (evaluation.performanceTags.includes('asistencia')) assists++;
                if (evaluation.performanceTags.includes('liderazgo')) mvpCount++;
            }
            
            // Determinar si ganó
            const inTeamA = match.teamA?.players?.some(p => p.id === player.id);
            if (match.result) {
                const won = (inTeamA && match.result.teamA > match.result.teamB) ||
                           (!inTeamA && match.result.teamB > match.result.teamA);
                if (won) wins++;
            }
        });
        
        const winRate = playerMatches.length > 0 ? 
            Math.round((wins / playerMatches.length) * 100) : 0;
        
        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${playerMatches.length}</span>
                <span class="stat-label">Partidos Jugados</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${winRate}%</span>
                <span class="stat-label">Victorias</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${goals}</span>
                <span class="stat-label">Goles</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${assists}</span>
                <span class="stat-label">Asistencias</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${mvpCount}</span>
                <span class="stat-label">MVP</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${player.ovr}</span>
                <span class="stat-label">OVR Actual</span>
            </div>
        `;
    },
    
    /**
     * Carga estadísticas del grupo
     */
    async loadGroupStats() {
        const matches = Storage.getMatches() || [];
        const players = Storage.getPlayers() || [];
        
        // Calcular estadísticas del grupo
        const stats = this.calculateGroupStats(matches);
        
        // Crear gráfico de resultados
        ChartsManager.createGroupStatsChart('group-results-chart', stats);
        
        // Crear heatmap de posiciones
        const positionData = this.calculatePositionStats(players);
        ChartsManager.createPositionHeatmap('position-heatmap', positionData);
        
        // Crear gráfico de progreso
        const progressData = this.getGroupProgressData(matches);
        ChartsManager.createProgressChart('group-progress-chart', progressData);
        
        // Mostrar top performers
        this.displayTopPerformers(players);
    },
    
    /**
     * Calcula estadísticas del grupo
     */
    calculateGroupStats(matches) {
        let wins = 0, draws = 0, losses = 0;
        
        // Por ahora simularemos resultados
        // En producción esto vendría de los resultados reales
        matches.forEach(match => {
            if (match.result) {
                if (match.result.teamA > match.result.teamB) wins++;
                else if (match.result.teamA < match.result.teamB) losses++;
                else draws++;
            }
        });
        
        // Si no hay datos, usar valores de ejemplo
        if (wins === 0 && draws === 0 && losses === 0) {
            wins = 15;
            draws = 5;
            losses = 8;
        }
        
        return { wins, draws, losses };
    },
    
    /**
     * Calcula estadísticas por posición
     */
    calculatePositionStats(players) {
        const positions = {
            por: [],
            def: [],
            med: [],
            del: []
        };
        
        players.forEach(player => {
            const pos = player.position?.toLowerCase();
            if (positions[pos]) {
                positions[pos].push(player.ovr);
            }
        });
        
        return {
            por: positions.por.length > 0 ? 
                Math.round(positions.por.reduce((a, b) => a + b, 0) / positions.por.length) : 0,
            def: positions.def.length > 0 ? 
                Math.round(positions.def.reduce((a, b) => a + b, 0) / positions.def.length) : 0,
            med: positions.med.length > 0 ? 
                Math.round(positions.med.reduce((a, b) => a + b, 0) / positions.med.length) : 0,
            del: positions.del.length > 0 ? 
                Math.round(positions.del.reduce((a, b) => a + b, 0) / positions.del.length) : 0
        };
    },
    
    /**
     * Obtiene datos de progreso del grupo
     */
    getGroupProgressData(matches) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                       'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const today = new Date();
        const labels = [];
        const matchCounts = [];
        const avgOvr = [];
        
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            labels.push(months[date.getMonth()]);
            
            // Contar partidos en ese mes
            const monthMatches = matches.filter(match => {
                const matchDate = new Date(match.date);
                return matchDate.getMonth() === date.getMonth() && 
                       matchDate.getFullYear() === date.getFullYear();
            });
            
            matchCounts.push(monthMatches.length || Math.floor(Math.random() * 10) + 5);
            avgOvr.push(Math.floor(Math.random() * 10) + 75);
        }
        
        return {
            labels,
            matches: matchCounts,
            avgOvr
        };
    },
    
    /**
     * Muestra los mejores jugadores
     */
    displayTopPerformers(players) {
        const container = document.getElementById('top-performers-list');
        if (!container) return;
        
        // Ordenar por OVR
        const topPlayers = players
            .sort((a, b) => b.ovr - a.ovr)
            .slice(0, 5);
        
        container.innerHTML = topPlayers.map((player, index) => {
            const photoHtml = player.photo ? 
                `<img src="${player.photo}" alt="${player.name}">` :
                `<i class='bx bx-user'></i>`;
            
            return `
                <div class="performer-item">
                    <div class="performer-rank">#${index + 1}</div>
                    <div class="performer-photo">${photoHtml}</div>
                    <div class="performer-info">
                        <div class="performer-name">${player.name}</div>
                        <div class="performer-stats">${player.position} | ${this.getPlayerMatchCount(player.id)} partidos</div>
                    </div>
                    <div class="performer-ovr">${player.ovr}</div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Obtiene cantidad de partidos de un jugador
     */
    getPlayerMatchCount(playerId) {
        const matches = Storage.getMatches() || [];
        return matches.filter(match => {
            const inTeamA = match.teamA?.players?.some(p => p.id === playerId);
            const inTeamB = match.teamB?.players?.some(p => p.id === playerId);
            return inTeamA || inTeamB;
        }).length;
    },
    
    /**
     * Compara dos jugadores
     */
    comparePlayersconst() {
        const player1Id = document.getElementById('player1-compare').value;
        const player2Id = document.getElementById('player2-compare').value;
        
        if (!player1Id || !player2Id) {
            UI.showNotification('Selecciona dos jugadores para comparar', 'warning');
            return;
        }
        
        if (player1Id === player2Id) {
            UI.showNotification('Selecciona jugadores diferentes', 'warning');
            return;
        }
        
        const player1 = Storage.getPlayerById(player1Id);
        const player2 = Storage.getPlayerById(player2Id);
        
        if (!player1 || !player2) return;
        
        // Mostrar resultados
        document.getElementById('comparison-results').style.display = 'block';
        
        // Crear gráfico de comparación
        ChartsManager.createPlayersComparisonChart('comparison-radar', [player1, player2]);
        
        // Crear tabla de comparación
        this.createComparisonTable(player1, player2);
    },
    
    /**
     * Crea tabla de comparación
     */
    createComparisonTable(player1, player2) {
        const container = document.getElementById('comparison-table');
        if (!container) return;
        
        const attributes = [
            { key: 'pac', label: 'Ritmo' },
            { key: 'sho', label: 'Tiro' },
            { key: 'pas', label: 'Pase' },
            { key: 'dri', label: 'Regate' },
            { key: 'def', label: 'Defensa' },
            { key: 'phy', label: 'Físico' }
        ];
        
        const rows = attributes.map(attr => {
            const val1 = player1.attributes[attr.key] || 50;
            const val2 = player2.attributes[attr.key] || 50;
            const winner1 = val1 > val2 ? 'winner' : '';
            const winner2 = val2 > val1 ? 'winner' : '';
            
            return `
                <tr>
                    <td class="${winner1}">${val1}</td>
                    <td>${attr.label}</td>
                    <td class="${winner2}">${val2}</td>
                </tr>
            `;
        }).join('');
        
        // Añadir OVR
        const ovrWinner1 = player1.ovr > player2.ovr ? 'winner' : '';
        const ovrWinner2 = player2.ovr > player1.ovr ? 'winner' : '';
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>${player1.name}</th>
                        <th>Atributo</th>
                        <th>${player2.name}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="border-top: 2px solid var(--primary-color);">
                        <td class="${ovrWinner1}" style="font-size: 1.2rem; font-weight: 700;">${player1.ovr}</td>
                        <td style="font-weight: 700;">OVR</td>
                        <td class="${ovrWinner2}" style="font-size: 1.2rem; font-weight: 700;">${player2.ovr}</td>
                    </tr>
                </tbody>
            </table>
        `;
    },
    
    /**
     * Actualiza el gráfico de evolución
     */
    updateEvolutionChart() {
        const metric = document.getElementById('evolution-metric').value;
        const period = document.getElementById('evolution-period').value;
        
        // Obtener datos según el período
        const data = this.getEvolutionData(metric, period);
        
        // Crear gráfico
        const ctx = document.getElementById('evolution-chart');
        if (!ctx) return;
        
        if (ChartsManager.charts['evolution-chart']) {
            ChartsManager.charts['evolution-chart'].destroy();
        }
        
        ChartsManager.charts['evolution-chart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: this.getMetricLabel(metric),
                    data: data.values,
                    borderColor: '#00ff9d',
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Evolución: ${this.getMetricLabel(metric)}`,
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: metric === 'matches',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
        
        // Mostrar insights
        this.displayEvolutionInsights(data, metric);
    },
    
    /**
     * Obtiene datos de evolución
     */
    getEvolutionData(metric, period) {
        const labels = [];
        const values = [];
        
        // Generar datos según el período
        const periods = {
            week: 7,
            month: 30,
            season: 90,
            all: 365
        };
        
        const days = periods[period] || 30;
        const step = Math.ceil(days / 10);
        
        for (let i = 0; i < 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - (i * step)));
            labels.push(date.toLocaleDateString());
            
            // Generar valores según la métrica
            switch(metric) {
                case 'ovr':
                    values.push(Math.floor(Math.random() * 10) + 75);
                    break;
                case 'matches':
                    values.push(Math.floor(Math.random() * 5) + 1);
                    break;
                case 'goals':
                    values.push((Math.random() * 3).toFixed(1));
                    break;
                case 'wins':
                    values.push(Math.floor(Math.random() * 40) + 40);
                    break;
            }
        }
        
        return { labels, values };
    },
    
    /**
     * Obtiene etiqueta de métrica
     */
    getMetricLabel(metric) {
        const labels = {
            'ovr': 'OVR Promedio',
            'matches': 'Partidos Jugados',
            'goals': 'Goles por Partido',
            'wins': 'Porcentaje de Victorias'
        };
        return labels[metric] || metric;
    },
    
    /**
     * Muestra insights de evolución
     */
    displayEvolutionInsights(data, metric) {
        const container = document.getElementById('evolution-insights');
        if (!container) return;
        
        const average = data.values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / data.values.length;
        const max = Math.max(...data.values);
        const min = Math.min(...data.values);
        const trend = data.values[data.values.length - 1] > data.values[0] ? 'Subiendo' : 'Bajando';
        
        container.innerHTML = `
            <div class="insight-card">
                <h4>Promedio</h4>
                <p>${average.toFixed(1)}</p>
                <small>En el período seleccionado</small>
            </div>
            <div class="insight-card">
                <h4>Máximo</h4>
                <p>${max}</p>
                <small>Mejor registro</small>
            </div>
            <div class="insight-card">
                <h4>Mínimo</h4>
                <p>${min}</p>
                <small>Registro más bajo</small>
            </div>
            <div class="insight-card">
                <h4>Tendencia</h4>
                <p>${trend}</p>
                <small>Dirección actual</small>
            </div>
        `;
    }
};

// Exportar para uso global
window.StatsController = StatsController;