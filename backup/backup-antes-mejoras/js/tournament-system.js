/**
 * Tournament System - Sistema completo de torneos y ligas
 * Maneja diferentes formatos de competición
 */

const TournamentSystem = {
    currentTournament: null,
    tournaments: [],
    
    /**
     * Inicializa el sistema de torneos
     */
    init() {
        console.log('🏆 Tournament System initialized');
        this.loadTournaments();
        this.setupEventListeners();
    },
    
    /**
     * Tipos de torneo disponibles
     */
    tournamentTypes: {
        LEAGUE: 'league',              // Todos contra todos
        KNOCKOUT: 'knockout',          // Eliminación directa
        GROUPS: 'groups',              // Fase de grupos + eliminatorias
        SWISS: 'swiss',                // Sistema suizo
        ROUND_ROBIN: 'round_robin'     // Round robin
    },
    
    /**
     * Crea un nuevo torneo
     */
    async createTournament(config) {
        const tournament = {
            id: Utils.generateId(),
            name: config.name,
            type: config.type,
            format: config.format, // 5v5, 7v7, 11v11
            startDate: config.startDate,
            endDate: config.endDate,
            status: 'planning', // planning, active, completed
            groupId: Storage.getCurrentGroup()?.id,
            createdBy: Storage.getCurrentPerson()?.id,
            createdAt: new Date().toISOString(),
            
            // Configuración específica
            teams: [],
            matches: [],
            standings: [],
            rules: config.rules || this.getDefaultRules(config.type),
            prizes: config.prizes || [],
            
            // Estadísticas
            stats: {
                totalMatches: 0,
                playedMatches: 0,
                totalGoals: 0,
                topScorer: null,
                topAssists: null,
                bestTeam: null
            }
        };
        
        // Guardar en Firebase
        const success = await this.saveTournament(tournament);
        
        if (success) {
            this.tournaments.push(tournament);
            UI.showNotification('Torneo creado exitosamente', 'success');
            return tournament;
        }
        
        return null;
    },
    
    /**
     * Obtiene reglas por defecto según el tipo
     */
    getDefaultRules(type) {
        const rules = {
            pointsPerWin: 3,
            pointsPerDraw: 1,
            pointsPerLoss: 0,
            tiebreakers: ['points', 'goalDifference', 'goalsFor', 'headToHead'],
            yellowCardLimit: 2,
            suspensionMatches: 1
        };
        
        switch(type) {
            case this.tournamentTypes.KNOCKOUT:
                rules.extraTime = true;
                rules.penalties = true;
                rules.awayGoals = false;
                break;
            case this.tournamentTypes.GROUPS:
                rules.groupSize = 4;
                rules.qualifyingTeams = 2;
                break;
            case this.tournamentTypes.SWISS:
                rules.rounds = 5;
                rules.pairingSystem = 'swiss';
                break;
        }
        
        return rules;
    },
    
    /**
     * Registra equipos en el torneo
     */
    registerTeams(tournamentId, teams) {
        const tournament = this.getTournamentById(tournamentId);
        if (!tournament) return false;
        
        tournament.teams = teams.map(team => ({
            id: team.id || Utils.generateId(),
            name: team.name,
            players: team.players,
            captain: team.captain,
            logo: team.logo,
            stats: {
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
                form: [] // Últimos 5 resultados
            }
        }));
        
        // Generar calendario según el tipo
        this.generateFixtures(tournament);
        
        return this.saveTournament(tournament);
    },
    
    /**
     * Genera el calendario de partidos
     */
    generateFixtures(tournament) {
        switch(tournament.type) {
            case this.tournamentTypes.LEAGUE:
                this.generateLeagueFixtures(tournament);
                break;
            case this.tournamentTypes.KNOCKOUT:
                this.generateKnockoutFixtures(tournament);
                break;
            case this.tournamentTypes.GROUPS:
                this.generateGroupStageFixtures(tournament);
                break;
            case this.tournamentTypes.SWISS:
                this.generateSwissFixtures(tournament);
                break;
            case this.tournamentTypes.ROUND_ROBIN:
                this.generateRoundRobinFixtures(tournament);
                break;
        }
        
        tournament.stats.totalMatches = tournament.matches.length;
    },
    
    /**
     * Genera fixtures para liga (todos contra todos)
     */
    generateLeagueFixtures(tournament) {
        const teams = tournament.teams;
        const rounds = [];
        const homeAway = tournament.rules.homeAway || false;
        
        // Algoritmo round-robin
        for (let round = 0; round < teams.length - 1; round++) {
            const roundMatches = [];
            
            for (let i = 0; i < teams.length / 2; i++) {
                const home = (round + i) % (teams.length - 1);
                let away = (teams.length - 1 - i + round) % (teams.length - 1);
                
                if (i === 0) {
                    away = teams.length - 1;
                }
                
                roundMatches.push({
                    id: Utils.generateId(),
                    round: round + 1,
                    homeTeam: teams[home],
                    awayTeam: teams[away],
                    date: this.calculateMatchDate(tournament.startDate, round),
                    status: 'scheduled',
                    result: null
                });
            }
            
            rounds.push(roundMatches);
        }
        
        // Si es ida y vuelta, duplicar con equipos invertidos
        if (homeAway) {
            const returnRounds = rounds.map((round, idx) => 
                round.map(match => ({
                    ...match,
                    id: Utils.generateId(),
                    round: rounds.length + idx + 1,
                    homeTeam: match.awayTeam,
                    awayTeam: match.homeTeam,
                    date: this.calculateMatchDate(tournament.startDate, rounds.length + idx)
                }))
            );
            rounds.push(...returnRounds);
        }
        
        tournament.matches = rounds.flat();
    },
    
    /**
     * Genera fixtures para eliminación directa
     */
    generateKnockoutFixtures(tournament) {
        const teams = [...tournament.teams];
        const rounds = [];
        let currentRound = teams;
        let roundNumber = 1;
        
        while (currentRound.length > 1) {
            const roundMatches = [];
            const nextRound = [];
            
            for (let i = 0; i < currentRound.length; i += 2) {
                if (i + 1 < currentRound.length) {
                    const match = {
                        id: Utils.generateId(),
                        round: this.getKnockoutRoundName(currentRound.length),
                        roundNumber,
                        homeTeam: currentRound[i],
                        awayTeam: currentRound[i + 1],
                        date: this.calculateMatchDate(tournament.startDate, roundNumber - 1),
                        status: 'scheduled',
                        result: null,
                        winner: null
                    };
                    
                    roundMatches.push(match);
                    nextRound.push(null); // Placeholder para el ganador
                }
            }
            
            rounds.push(roundMatches);
            currentRound = nextRound;
            roundNumber++;
        }
        
        tournament.matches = rounds.flat();
        tournament.rounds = rounds;
    },
    
    /**
     * Obtiene nombre de la ronda de eliminatorias
     */
    getKnockoutRoundName(teamsCount) {
        switch(teamsCount) {
            case 2: return 'Final';
            case 4: return 'Semifinal';
            case 8: return 'Cuartos de Final';
            case 16: return 'Octavos de Final';
            case 32: return 'Dieciseisavos';
            default: return `Ronda de ${teamsCount}`;
        }
    },
    
    /**
     * Genera fixtures para fase de grupos
     */
    generateGroupStageFixtures(tournament) {
        const teams = [...tournament.teams];
        const groupSize = tournament.rules.groupSize || 4;
        const groups = [];
        
        // Dividir equipos en grupos
        for (let i = 0; i < teams.length; i += groupSize) {
            groups.push({
                name: `Grupo ${String.fromCharCode(65 + groups.length)}`,
                teams: teams.slice(i, i + groupSize)
            });
        }
        
        tournament.groups = groups;
        tournament.matches = [];
        
        // Generar partidos dentro de cada grupo
        groups.forEach(group => {
            for (let i = 0; i < group.teams.length; i++) {
                for (let j = i + 1; j < group.teams.length; j++) {
                    tournament.matches.push({
                        id: Utils.generateId(),
                        phase: 'groups',
                        group: group.name,
                        homeTeam: group.teams[i],
                        awayTeam: group.teams[j],
                        date: this.calculateMatchDate(tournament.startDate, tournament.matches.length),
                        status: 'scheduled',
                        result: null
                    });
                }
            }
        });
    },
    
    /**
     * Calcula fecha de partido
     */
    calculateMatchDate(startDate, roundOffset) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (roundOffset * 7)); // Una semana entre rondas
        return date.toISOString();
    },
    
    /**
     * Actualiza resultado de partido
     */
    async updateMatchResult(tournamentId, matchId, result) {
        const tournament = this.getTournamentById(tournamentId);
        if (!tournament) return false;
        
        const match = tournament.matches.find(m => m.id === matchId);
        if (!match) return false;
        
        match.result = result;
        match.status = 'completed';
        
        // Actualizar estadísticas de equipos
        this.updateTeamStats(tournament, match, result);
        
        // Actualizar tabla de posiciones
        this.updateStandings(tournament);
        
        // Verificar si hay siguiente ronda (eliminatorias)
        if (tournament.type === this.tournamentTypes.KNOCKOUT) {
            this.advanceWinner(tournament, match, result);
        }
        
        // Actualizar estadísticas del torneo
        tournament.stats.playedMatches++;
        tournament.stats.totalGoals += (result.homeScore + result.awayScore);
        
        // Guardar cambios
        return await this.saveTournament(tournament);
    },
    
    /**
     * Actualiza estadísticas de equipos
     */
    updateTeamStats(tournament, match, result) {
        const homeTeam = tournament.teams.find(t => t.id === match.homeTeam.id);
        const awayTeam = tournament.teams.find(t => t.id === match.awayTeam.id);
        
        if (!homeTeam || !awayTeam) return;
        
        // Actualizar partidos jugados
        homeTeam.stats.played++;
        awayTeam.stats.played++;
        
        // Actualizar goles
        homeTeam.stats.goalsFor += result.homeScore;
        homeTeam.stats.goalsAgainst += result.awayScore;
        awayTeam.stats.goalsFor += result.awayScore;
        awayTeam.stats.goalsAgainst += result.homeScore;
        
        // Actualizar diferencia de goles
        homeTeam.stats.goalDifference = homeTeam.stats.goalsFor - homeTeam.stats.goalsAgainst;
        awayTeam.stats.goalDifference = awayTeam.stats.goalsFor - awayTeam.stats.goalsAgainst;
        
        // Determinar resultado y actualizar puntos
        if (result.homeScore > result.awayScore) {
            // Victoria local
            homeTeam.stats.won++;
            homeTeam.stats.points += tournament.rules.pointsPerWin;
            homeTeam.stats.form.push('W');
            
            awayTeam.stats.lost++;
            awayTeam.stats.points += tournament.rules.pointsPerLoss;
            awayTeam.stats.form.push('L');
        } else if (result.homeScore < result.awayScore) {
            // Victoria visitante
            awayTeam.stats.won++;
            awayTeam.stats.points += tournament.rules.pointsPerWin;
            awayTeam.stats.form.push('W');
            
            homeTeam.stats.lost++;
            homeTeam.stats.points += tournament.rules.pointsPerLoss;
            homeTeam.stats.form.push('L');
        } else {
            // Empate
            homeTeam.stats.drawn++;
            homeTeam.stats.points += tournament.rules.pointsPerDraw;
            homeTeam.stats.form.push('D');
            
            awayTeam.stats.drawn++;
            awayTeam.stats.points += tournament.rules.pointsPerDraw;
            awayTeam.stats.form.push('D');
        }
        
        // Mantener solo los últimos 5 resultados en el form
        if (homeTeam.stats.form.length > 5) {
            homeTeam.stats.form.shift();
        }
        if (awayTeam.stats.form.length > 5) {
            awayTeam.stats.form.shift();
        }
    },
    
    /**
     * Actualiza tabla de posiciones
     */
    updateStandings(tournament) {
        if (tournament.type === this.tournamentTypes.KNOCKOUT) {
            return; // No hay tabla en eliminatorias
        }
        
        // Ordenar equipos según criterios de desempate
        const standings = [...tournament.teams].sort((a, b) => {
            // Primero por puntos
            if (b.stats.points !== a.stats.points) {
                return b.stats.points - a.stats.points;
            }
            
            // Luego por diferencia de goles
            if (b.stats.goalDifference !== a.stats.goalDifference) {
                return b.stats.goalDifference - a.stats.goalDifference;
            }
            
            // Luego por goles a favor
            if (b.stats.goalsFor !== a.stats.goalsFor) {
                return b.stats.goalsFor - a.stats.goalsFor;
            }
            
            // Si todo es igual, mantener orden
            return 0;
        });
        
        tournament.standings = standings.map((team, index) => ({
            position: index + 1,
            team: team,
            played: team.stats.played,
            won: team.stats.won,
            drawn: team.stats.drawn,
            lost: team.stats.lost,
            goalsFor: team.stats.goalsFor,
            goalsAgainst: team.stats.goalsAgainst,
            goalDifference: team.stats.goalDifference,
            points: team.stats.points,
            form: team.stats.form
        }));
    },
    
    /**
     * Avanza ganador en eliminatorias
     */
    advanceWinner(tournament, match, result) {
        let winner;
        
        if (result.homeScore > result.awayScore) {
            winner = match.homeTeam;
        } else if (result.awayScore > result.homeScore) {
            winner = match.awayTeam;
        } else {
            // Empate - verificar reglas de desempate
            if (tournament.rules.extraTime && result.extraTime) {
                winner = result.extraTime.homeScore > result.extraTime.awayScore ? 
                    match.homeTeam : match.awayTeam;
            } else if (tournament.rules.penalties && result.penalties) {
                winner = result.penalties.homeScore > result.penalties.awayScore ? 
                    match.homeTeam : match.awayTeam;
            }
        }
        
        match.winner = winner;
        
        // Encontrar siguiente ronda y añadir ganador
        const nextRoundNumber = match.roundNumber + 1;
        const nextRound = tournament.rounds[nextRoundNumber - 1];
        
        if (nextRound) {
            // Determinar posición en siguiente ronda
            const matchIndex = Math.floor(tournament.matches.indexOf(match) / 2);
            const nextMatch = nextRound[matchIndex];
            
            if (nextMatch) {
                if (!nextMatch.homeTeam) {
                    nextMatch.homeTeam = winner;
                } else {
                    nextMatch.awayTeam = winner;
                }
            }
        } else {
            // Es la final - declarar campeón
            tournament.champion = winner;
            tournament.status = 'completed';
            this.declarChampion(tournament, winner);
        }
    },
    
    /**
     * Declara campeón del torneo
     */
    declarChampion(tournament, champion) {
        console.log('🏆 Champion:', champion.name);
        
        // Actualizar estadísticas
        tournament.stats.bestTeam = champion;
        
        // Notificar
        UI.showNotification(`¡${champion.name} es el campeón del ${tournament.name}!`, 'success');
        
        // Actualizar trofeos del equipo/jugadores
        this.awardTrophies(tournament, champion);
    },
    
    /**
     * Otorga trofeos y premios
     */
    awardTrophies(tournament, champion) {
        // Guardar en historial de trofeos
        const trophy = {
            id: Utils.generateId(),
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            teamId: champion.id,
            teamName: champion.name,
            date: new Date().toISOString(),
            type: 'champion'
        };
        
        this.saveTrophy(trophy);
        
        // Otorgar puntos de experiencia a jugadores
        if (champion.players) {
            champion.players.forEach(player => {
                this.awardPlayerXP(player.id, 100); // 100 XP por ganar torneo
            });
        }
    },
    
    /**
     * Carga torneos desde Firebase
     */
    async loadTournaments() {
        if (!db) return;
        
        try {
            const groupId = Storage.getCurrentGroup()?.id;
            if (!groupId) return;
            
            const snapshot = await db.collection('tournaments')
                .where('groupId', '==', groupId)
                .get();
            
            this.tournaments = [];
            snapshot.forEach(doc => {
                this.tournaments.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('Tournaments loaded:', this.tournaments.length);
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    },
    
    /**
     * Guarda torneo en Firebase
     */
    async saveTournament(tournament) {
        if (!db) return false;
        
        try {
            const docRef = db.collection('tournaments').doc(tournament.id);
            await docRef.set(tournament);
            return true;
        } catch (error) {
            console.error('Error saving tournament:', error);
            return false;
        }
    },
    
    /**
     * Obtiene torneo por ID
     */
    getTournamentById(tournamentId) {
        return this.tournaments.find(t => t.id === tournamentId);
    },
    
    /**
     * Obtiene torneos activos
     */
    getActiveTournaments() {
        return this.tournaments.filter(t => t.status === 'active');
    },
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Listener para crear torneo
        const createTournamentBtn = document.getElementById('create-tournament-btn');
        if (createTournamentBtn) {
            createTournamentBtn.addEventListener('click', () => {
                this.showCreateTournamentModal();
            });
        }
    },
    
    /**
     * Muestra modal para crear torneo
     */
    showCreateTournamentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal tournament-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Crear Nuevo Torneo</h2>
                
                <form id="tournament-form">
                    <div class="form-group">
                        <label>Nombre del Torneo</label>
                        <input type="text" id="tournament-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo de Torneo</label>
                        <select id="tournament-type" required>
                            <option value="league">Liga (Todos contra todos)</option>
                            <option value="knockout">Eliminación Directa</option>
                            <option value="groups">Fase de Grupos + Eliminatorias</option>
                            <option value="swiss">Sistema Suizo</option>
                            <option value="round_robin">Round Robin</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Formato de Partidos</label>
                        <select id="tournament-format" required>
                            <option value="5v5">5 vs 5</option>
                            <option value="7v7">7 vs 7</option>
                            <option value="11v11">11 vs 11</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha de Inicio</label>
                        <input type="date" id="tournament-start" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha de Finalización (Estimada)</label>
                        <input type="date" id="tournament-end">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Crear Torneo</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Event listeners
        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };
        
        modal.querySelector('#tournament-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const config = {
                name: document.getElementById('tournament-name').value,
                type: document.getElementById('tournament-type').value,
                format: document.getElementById('tournament-format').value,
                startDate: document.getElementById('tournament-start').value,
                endDate: document.getElementById('tournament-end').value
            };
            
            const tournament = await this.createTournament(config);
            if (tournament) {
                modal.remove();
                this.showTournamentDashboard(tournament.id);
            }
        };
    },
    
    /**
     * Muestra dashboard del torneo
     */
    showTournamentDashboard(tournamentId) {
        const tournament = this.getTournamentById(tournamentId);
        if (!tournament) return;
        
        // Navegar a pantalla de torneo
        App.navigateToScreen('tournament-screen');
        this.renderTournament(tournament);
    },
    
    /**
     * Renderiza torneo en la UI
     */
    renderTournament(tournament) {
        const container = document.getElementById('tournament-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="tournament-header">
                <h1>${tournament.name}</h1>
                <div class="tournament-info">
                    <span class="badge">${tournament.type}</span>
                    <span class="badge">${tournament.format}</span>
                    <span class="badge ${tournament.status}">${tournament.status}</span>
                </div>
            </div>
            
            <div class="tournament-tabs">
                <button class="tab-btn active" data-tab="standings">Tabla</button>
                <button class="tab-btn" data-tab="fixtures">Calendario</button>
                <button class="tab-btn" data-tab="stats">Estadísticas</button>
                <button class="tab-btn" data-tab="teams">Equipos</button>
            </div>
            
            <div class="tournament-content">
                ${this.renderStandings(tournament)}
            </div>
        `;
    },
    
    /**
     * Renderiza tabla de posiciones
     */
    renderStandings(tournament) {
        if (!tournament.standings || tournament.standings.length === 0) {
            return '<p>No hay resultados todavía</p>';
        }
        
        return `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Equipo</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PE</th>
                        <th>PP</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th>Pts</th>
                        <th>Forma</th>
                    </tr>
                </thead>
                <tbody>
                    ${tournament.standings.map(row => `
                        <tr class="${row.position <= 2 ? 'qualified' : ''}">
                            <td>${row.position}</td>
                            <td>${row.team.name}</td>
                            <td>${row.played}</td>
                            <td>${row.won}</td>
                            <td>${row.drawn}</td>
                            <td>${row.lost}</td>
                            <td>${row.goalsFor}</td>
                            <td>${row.goalsAgainst}</td>
                            <td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td>
                            <td><strong>${row.points}</strong></td>
                            <td>${this.renderForm(row.form)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Renderiza forma del equipo
     */
    renderForm(form) {
        return form.map(result => {
            const className = result === 'W' ? 'win' : result === 'D' ? 'draw' : 'loss';
            return `<span class="form-badge ${className}">${result}</span>`;
        }).join('');
    },
    
    /**
     * Guarda trofeo
     */
    async saveTrophy(trophy) {
        if (!db) return false;
        
        try {
            await db.collection('trophies').add(trophy);
            return true;
        } catch (error) {
            console.error('Error saving trophy:', error);
            return false;
        }
    },
    
    /**
     * Otorga XP a jugador
     */
    async awardPlayerXP(playerId, xp) {
        const player = Storage.getPlayerById(playerId);
        if (!player) return;
        
        // Sistema de XP se implementará con gamificación
        console.log(`Awarding ${xp} XP to player ${playerId}`);
    }
};

// Exportar para uso global
window.TournamentSystem = TournamentSystem;