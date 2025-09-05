/**
 * Dashboard Controller
 * Gestiona y carga los datos del dashboard principal
 */

const DashboardController = {
    currentGroupId: null,
    isLoading: false,
    refreshInterval: null,
    
    /**
     * Inicializa el controlador del dashboard
     */
    async init() {
        console.log('📊 Dashboard Controller initialized');
        
        // Auto-refresh cada 30 segundos
        this.refreshInterval = setInterval(() => {
            if (this.currentGroupId && !this.isLoading) {
                this.loadDashboardData();
            }
        }, 30000);
        
        // Escuchar cambios de grupo
        document.addEventListener('group-changed', (event) => {
            this.handleGroupChanged(event.detail.groupId);
        });
    },

    /**
     * Carga todos los datos del dashboard
     */
    async loadDashboardData(groupId = null) {
        if (this.isLoading) return;
        
        const targetGroupId = groupId || this.currentGroupId || (typeof Storage !== 'undefined' ? Storage.currentGroupId : null);
        
        if (!targetGroupId) {
            console.warn('No group ID available for dashboard');
            this.showEmptyState();
            return;
        }
        
        this.isLoading = true;
        this.currentGroupId = targetGroupId;
        
        console.log('Loading dashboard data for group:', targetGroupId);
        
        try {
            // Mostrar loading state
            this.showLoadingState();
            
            // Cargar datos en paralelo
            await Promise.all([
                this.loadGroupStats(),
                this.loadRecentMatches(),
                this.loadTopPerformers(),
                this.loadQuickStats()
            ]);
            
            console.log('Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Carga estadísticas generales del grupo
     */
    async loadGroupStats() {
        try {
            let players = [];
            let matches = [];
            
            if (typeof Storage !== 'undefined') {
                players = await Storage.getPlayers() || [];
                matches = await Storage.getMatches() || [];
            }
            
            // Estadísticas básicas
            const totalPlayers = players.length;
            const totalMatches = matches.length;
            const avgOvr = totalPlayers > 0 ? 
                Math.round(players.reduce((sum, p) => sum + (p.ovr || 0), 0) / totalPlayers) : 0;
            
            // Calcular tasa de victorias (simplificado)
            const completedMatches = matches.filter(m => m.status === 'completed');
            const winRate = completedMatches.length > 0 ? 
                Math.round((completedMatches.filter(m => m.scoreA > m.scoreB).length / completedMatches.length) * 100) : 0;
            
            // Actualizar UI
            this.updateElement('total-players-stat', totalPlayers);
            this.updateElement('total-matches-stat', totalMatches);
            this.updateElement('avg-ovr-stat', avgOvr);
            this.updateElement('win-rate-stat', `${winRate}%`);
            
        } catch (error) {
            console.error('Error loading group stats:', error);
        }
    },

    /**
     * Carga los últimos partidos
     */
    async loadRecentMatches() {
        try {
            let matches = [];
            
            if (typeof Storage !== 'undefined') {
                matches = await Storage.getMatches() || [];
            }
            
            // Ordenar por fecha más reciente y tomar los últimos 5
            const recentMatches = matches
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .slice(0, 5);
            
            const container = document.getElementById('recent-matches-content');
            if (!container) return;
            
            if (recentMatches.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-football'></i>
                        <p>No hay partidos registrados</p>
                        <button class="btn-primary" onclick="App.navigateToScreen('matches-screen')">
                            Crear Primer Partido
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = recentMatches.map(match => {
                const date = new Date(match.createdAt || match.date);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const statusIcon = this.getMatchStatusIcon(match.status);
                const statusClass = this.getMatchStatusClass(match.status);
                
                return `
                    <div class="recent-match-item ${statusClass}">
                        <div class="match-teams">
                            <div class="team-info">
                                <span class="team-name">${this.truncateTeamName(match.teamA || 'Equipo A')}</span>
                                <span class="team-score">${match.scoreA || 0}</span>
                            </div>
                            <div class="match-vs">vs</div>
                            <div class="team-info">
                                <span class="team-score">${match.scoreB || 0}</span>
                                <span class="team-name">${this.truncateTeamName(match.teamB || 'Equipo B')}</span>
                            </div>
                        </div>
                        <div class="match-meta">
                            <div class="match-status">
                                <i class='bx ${statusIcon}'></i>
                                <span>${this.getMatchStatusText(match.status)}</span>
                            </div>
                            <div class="match-date">${formattedDate}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading recent matches:', error);
        }
    },

    /**
     * Carga los mejores jugadores
     */
    async loadTopPerformers() {
        try {
            let players = [];
            let matches = [];
            
            if (typeof Storage !== 'undefined') {
                players = await Storage.getPlayers() || [];
                matches = await Storage.getMatches() || [];
            }
            
            // Calcular estadísticas de rendimiento
            const playerStats = this.calculatePlayerStats(players, matches);
            
            // Ordenar por puntuación total y tomar los top 5
            const topPerformers = playerStats
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 5);
            
            const container = document.getElementById('top-performers-content');
            if (!container) return;
            
            if (topPerformers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-user'></i>
                        <p>No hay jugadores registrados</p>
                        <button class="btn-primary" onclick="App.navigateToScreen('register-screen')">
                            Registrar Jugador
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = topPerformers.map((player, index) => {
                const rankIcon = this.getRankIcon(index);
                const rankClass = this.getRankClass(index);
                
                return `
                    <div class="top-player-item ${rankClass}">
                        <div class="player-rank">
                            <i class='bx ${rankIcon}'></i>
                            <span>${index + 1}</span>
                        </div>
                        <div class="player-avatar">
                            ${player.photo ? 
                                `<img src="${player.photo}" alt="${player.name}">` :
                                `<div class="avatar-placeholder">
                                    <i class='bx bx-user'></i>
                                </div>`
                            }
                        </div>
                        <div class="player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-position">${player.position}</div>
                        </div>
                        <div class="player-stats">
                            <div class="player-ovr">${player.ovr}</div>
                            <div class="player-performance">
                                <div class="stat-item">
                                    <span class="stat-value">${player.goals}</span>
                                    <span class="stat-label">G</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">${player.assists}</span>
                                    <span class="stat-label">A</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">${player.matches}</span>
                                    <span class="stat-label">PJ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading top performers:', error);
        }
    },

    /**
     * Carga estadísticas rápidas adicionales
     */
    async loadQuickStats() {
        try {
            // Esta función puede expandirse para mostrar más estadísticas
            // Por ahora, las estadísticas básicas ya se cargan en loadGroupStats()
            
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    },

    /**
     * Calcula estadísticas de rendimiento de jugadores
     */
    calculatePlayerStats(players, matches) {
        return players.map(player => {
            // Estadísticas básicas del jugador
            const stats = {
                id: player.id,
                name: player.name,
                position: player.position,
                ovr: player.ovr || 0,
                photo: player.photo,
                goals: 0,
                assists: 0,
                matches: 0,
                wins: 0,
                mvps: 0,
                totalScore: 0
            };
            
            // Buscar estadísticas en partidos
            matches.forEach(match => {
                if (match.players && (match.players.teamA?.includes(player.id) || match.players.teamB?.includes(player.id))) {
                    stats.matches++;
                    
                    // Determinar si ganó el partido
                    const isInTeamA = match.players.teamA?.includes(player.id);
                    const teamAWon = (match.scoreA || 0) > (match.scoreB || 0);
                    if ((isInTeamA && teamAWon) || (!isInTeamA && !teamAWon)) {
                        stats.wins++;
                    }
                }
                
                // Contar goles y asistencias si están registrados
                if (match.events) {
                    match.events.forEach(event => {
                        if (event.playerId === player.id) {
                            if (event.type === 'goal') stats.goals++;
                            if (event.type === 'assist') stats.assists++;
                        }
                    });
                }
                
                // Contar MVPs
                if (match.mvp === player.id) {
                    stats.mvps++;
                }
            });
            
            // Calcular puntuación total (fórmula personalizable)
            stats.totalScore = (stats.ovr * 0.3) + (stats.goals * 5) + (stats.assists * 3) + 
                              (stats.wins * 2) + (stats.mvps * 10) + (stats.matches * 1);
            
            return stats;
        });
    },

    /**
     * Maneja cambio de grupo
     */
    async handleGroupChanged(newGroupId) {
        console.log('Dashboard: Group changed to', newGroupId);
        
        if (newGroupId !== this.currentGroupId) {
            this.currentGroupId = newGroupId;
            await this.loadDashboardData(newGroupId);
        }
    },

    /**
     * Muestra estado de carga
     */
    showLoadingState() {
        const containers = [
            'recent-matches-content',
            'top-performers-content'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Cargando...</p>
                    </div>
                `;
            }
        });
        
        // Loading para stats
        ['total-players-stat', 'total-matches-stat', 'avg-ovr-stat', 'win-rate-stat'].forEach(statId => {
            this.updateElement(statId, '...');
        });
    },

    /**
     * Muestra estado vacío
     */
    showEmptyState() {
        const container = document.getElementById('recent-matches-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-group'></i>
                    <h3>Selecciona un grupo</h3>
                    <p>Selecciona o crea un grupo para ver el dashboard</p>
                    <button class="btn-primary" onclick="App.navigateToScreen('welcome-screen')">
                        Seleccionar Grupo
                    </button>
                </div>
            `;
        }
        
        this.updateElement('total-players-stat', '0');
        this.updateElement('total-matches-stat', '0');
        this.updateElement('avg-ovr-stat', '0');
        this.updateElement('win-rate-stat', '0%');
    },

    /**
     * Muestra estado de error
     */
    showErrorState() {
        const container = document.getElementById('recent-matches-content');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class='bx bx-error'></i>
                    <h3>Error al cargar datos</h3>
                    <p>No se pudieron cargar los datos del dashboard</p>
                    <button class="btn-primary" onclick="DashboardController.loadDashboardData()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    /**
     * Utility functions
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    },

    truncateTeamName(name) {
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
    },

    getMatchStatusIcon(status) {
        const icons = {
            'completed': 'bx-check-circle',
            'in_progress': 'bx-play-circle',
            'scheduled': 'bx-time-five',
            'cancelled': 'bx-x-circle'
        };
        return icons[status] || 'bx-help-circle';
    },

    getMatchStatusClass(status) {
        return `match-status-${status}`;
    },

    getMatchStatusText(status) {
        const texts = {
            'completed': 'Finalizado',
            'in_progress': 'En Juego',
            'scheduled': 'Programado',
            'cancelled': 'Cancelado'
        };
        return texts[status] || 'Desconocido';
    },

    getRankIcon(index) {
        const icons = ['bx-medal', 'bx-award', 'bx-trophy'];
        return icons[index] || 'bx-user';
    },

    getRankClass(index) {
        const classes = ['rank-1', 'rank-2', 'rank-3'];
        return classes[index] || '';
    },

    /**
     * Fuerza la actualización del dashboard
     */
    async forceRefresh() {
        this.isLoading = false; // Reset loading state
        await this.loadDashboardData();
    },

    /**
     * Limpia el intervalo cuando se cierra la app
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DashboardController.init());
} else {
    DashboardController.init();
}

// Exportar para uso global
window.DashboardController = DashboardController;