/**
 * Player History System - Sistema completo de historial y trazabilidad
 * Registra todos los cambios y evolución de jugadores
 */

const PlayerHistory = {
    history: [],
    
    /**
     * Inicializa el sistema de historial
     */
    init() {
        console.log('📜 Player History System initialized');
        this.setupEventListeners();
    },
    
    /**
     * Tipos de eventos históricos
     */
    eventTypes: {
        CREATED: 'created',
        ATTRIBUTE_CHANGE: 'attribute_change',
        OVR_CHANGE: 'ovr_change',
        POSITION_CHANGE: 'position_change',
        INJURY: 'injury',
        RECOVERY: 'recovery',
        MATCH_PLAYED: 'match_played',
        GOAL_SCORED: 'goal_scored',
        ASSIST_MADE: 'assist_made',
        CARD_RECEIVED: 'card_received',
        MVP_AWARDED: 'mvp_awarded',
        TROPHY_WON: 'trophy_won',
        MILESTONE: 'milestone',
        PHOTO_UPDATED: 'photo_updated'
    },
    
    /**
     * Registra un evento en el historial
     */
    async recordEvent(playerId, eventType, data = {}) {
        const event = {
            id: Utils.generateId(),
            playerId,
            type: eventType,
            timestamp: new Date().toISOString(),
            data,
            groupId: Storage.getCurrentGroup()?.id,
            recordedBy: Storage.getCurrentPerson()?.id
        };
        
        // Guardar en Firebase
        const success = await this.saveEvent(event);
        
        if (success) {
            this.history.push(event);
            
            // Verificar si se alcanzó algún hito
            this.checkMilestones(playerId, eventType, data);
            
            return event;
        }
        
        return null;
    },
    
    /**
     * Obtiene el historial completo de un jugador
     */
    async getPlayerHistory(playerId) {
        if (!db) return [];
        
        try {
            const snapshot = await db.collection('playerHistory')
                .where('playerId', '==', playerId)
                .orderBy('timestamp', 'desc')
                .get();
            
            const history = [];
            snapshot.forEach(doc => {
                history.push({ id: doc.id, ...doc.data() });
            });
            
            return history;
        } catch (error) {
            console.error('Error loading player history:', error);
            return [];
        }
    },
    
    /**
     * Obtiene timeline de un jugador
     */
    async getPlayerTimeline(playerId) {
        const history = await this.getPlayerHistory(playerId);
        const player = Storage.getPlayerById(playerId);
        
        if (!player) return null;
        
        // Agrupar eventos por fecha
        const timeline = {};
        
        history.forEach(event => {
            const date = new Date(event.timestamp).toLocaleDateString();
            if (!timeline[date]) {
                timeline[date] = [];
            }
            timeline[date].push(event);
        });
        
        return {
            player,
            timeline,
            stats: this.calculateHistoricalStats(history)
        };
    },
    
    /**
     * Calcula estadísticas históricas
     */
    calculateHistoricalStats(history) {
        const stats = {
            totalEvents: history.length,
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            mvpAwards: 0,
            trophies: 0,
            injuries: 0,
            ovrChanges: [],
            attributeChanges: [],
            milestones: []
        };
        
        history.forEach(event => {
            switch(event.type) {
                case this.eventTypes.MATCH_PLAYED:
                    stats.matchesPlayed++;
                    break;
                case this.eventTypes.GOAL_SCORED:
                    stats.goals += event.data.goals || 1;
                    break;
                case this.eventTypes.ASSIST_MADE:
                    stats.assists += event.data.assists || 1;
                    break;
                case this.eventTypes.CARD_RECEIVED:
                    if (event.data.cardType === 'yellow') stats.yellowCards++;
                    if (event.data.cardType === 'red') stats.redCards++;
                    break;
                case this.eventTypes.MVP_AWARDED:
                    stats.mvpAwards++;
                    break;
                case this.eventTypes.TROPHY_WON:
                    stats.trophies++;
                    break;
                case this.eventTypes.INJURY:
                    stats.injuries++;
                    break;
                case this.eventTypes.OVR_CHANGE:
                    stats.ovrChanges.push({
                        date: event.timestamp,
                        oldValue: event.data.oldValue,
                        newValue: event.data.newValue,
                        change: event.data.newValue - event.data.oldValue
                    });
                    break;
                case this.eventTypes.ATTRIBUTE_CHANGE:
                    stats.attributeChanges.push(event.data);
                    break;
                case this.eventTypes.MILESTONE:
                    stats.milestones.push(event.data);
                    break;
            }
        });
        
        return stats;
    },
    
    /**
     * Registra cambio de atributos
     */
    recordAttributeChange(playerId, attribute, oldValue, newValue) {
        return this.recordEvent(playerId, this.eventTypes.ATTRIBUTE_CHANGE, {
            attribute,
            oldValue,
            newValue,
            change: newValue - oldValue
        });
    },
    
    /**
     * Registra cambio de OVR
     */
    recordOVRChange(playerId, oldOVR, newOVR) {
        return this.recordEvent(playerId, this.eventTypes.OVR_CHANGE, {
            oldValue: oldOVR,
            newValue: newOVR,
            change: newOVR - oldOVR
        });
    },
    
    /**
     * Registra partido jugado
     */
    async recordMatchPlayed(playerId, matchId, performance = {}) {
        const event = await this.recordEvent(playerId, this.eventTypes.MATCH_PLAYED, {
            matchId,
            performance,
            date: new Date().toISOString()
        });
        
        // Registrar eventos específicos del partido
        if (performance.goals > 0) {
            await this.recordEvent(playerId, this.eventTypes.GOAL_SCORED, {
                matchId,
                goals: performance.goals
            });
        }
        
        if (performance.assists > 0) {
            await this.recordEvent(playerId, this.eventTypes.ASSIST_MADE, {
                matchId,
                assists: performance.assists
            });
        }
        
        if (performance.cards) {
            for (const card of performance.cards) {
                await this.recordEvent(playerId, this.eventTypes.CARD_RECEIVED, {
                    matchId,
                    cardType: card
                });
            }
        }
        
        if (performance.mvp) {
            await this.recordEvent(playerId, this.eventTypes.MVP_AWARDED, {
                matchId
            });
        }
        
        return event;
    },
    
    /**
     * Registra lesión
     */
    recordInjury(playerId, injuryData) {
        return this.recordEvent(playerId, this.eventTypes.INJURY, {
            type: injuryData.type,
            severity: injuryData.severity,
            estimatedRecovery: injuryData.estimatedRecovery,
            matchId: injuryData.matchId
        });
    },
    
    /**
     * Registra recuperación
     */
    recordRecovery(playerId) {
        return this.recordEvent(playerId, this.eventTypes.RECOVERY, {
            date: new Date().toISOString()
        });
    },
    
    /**
     * Verifica hitos alcanzados
     */
    checkMilestones(playerId, eventType, data) {
        const milestones = {
            matches: [10, 25, 50, 100, 200, 500],
            goals: [10, 25, 50, 100, 200],
            assists: [10, 25, 50, 100],
            mvp: [5, 10, 25],
            ovr: [70, 75, 80, 85, 90, 95]
        };
        
        // Verificar hitos de partidos
        if (eventType === this.eventTypes.MATCH_PLAYED) {
            this.checkNumericMilestone(playerId, 'matches', milestones.matches);
        }
        
        // Verificar hitos de goles
        if (eventType === this.eventTypes.GOAL_SCORED) {
            this.checkNumericMilestone(playerId, 'goals', milestones.goals);
        }
        
        // Verificar hitos de OVR
        if (eventType === this.eventTypes.OVR_CHANGE && data.newValue) {
            for (const milestone of milestones.ovr) {
                if (data.oldValue < milestone && data.newValue >= milestone) {
                    this.recordMilestone(playerId, 'ovr', milestone);
                }
            }
        }
    },
    
    /**
     * Verifica hito numérico
     */
    async checkNumericMilestone(playerId, type, milestones) {
        const history = await this.getPlayerHistory(playerId);
        const count = history.filter(e => {
            if (type === 'matches') return e.type === this.eventTypes.MATCH_PLAYED;
            if (type === 'goals') return e.type === this.eventTypes.GOAL_SCORED;
            if (type === 'assists') return e.type === this.eventTypes.ASSIST_MADE;
            if (type === 'mvp') return e.type === this.eventTypes.MVP_AWARDED;
            return false;
        }).length;
        
        for (const milestone of milestones) {
            if (count === milestone) {
                this.recordMilestone(playerId, type, milestone);
                break;
            }
        }
    },
    
    /**
     * Registra hito alcanzado
     */
    async recordMilestone(playerId, type, value) {
        const player = Storage.getPlayerById(playerId);
        if (!player) return;
        
        const milestoneText = this.getMilestoneText(type, value);
        
        await this.recordEvent(playerId, this.eventTypes.MILESTONE, {
            type,
            value,
            text: milestoneText
        });
        
        // Notificar
        UI.showNotification(`🎉 ${player.name} alcanzó un hito: ${milestoneText}`, 'success');
        
        // Otorgar XP (se implementará con gamificación)
        if (window.GamificationSystem) {
            GamificationSystem.awardXP(playerId, value * 10);
        }
    },
    
    /**
     * Obtiene texto del hito
     */
    getMilestoneText(type, value) {
        const texts = {
            matches: `${value} partidos jugados`,
            goals: `${value} goles marcados`,
            assists: `${value} asistencias`,
            mvp: `${value} premios MVP`,
            ovr: `OVR ${value} alcanzado`
        };
        
        return texts[type] || `${type}: ${value}`;
    },
    
    /**
     * Obtiene evolución de OVR
     */
    async getOVREvolution(playerId) {
        const history = await this.getPlayerHistory(playerId);
        const ovrChanges = history
            .filter(e => e.type === this.eventTypes.OVR_CHANGE)
            .map(e => ({
                date: new Date(e.timestamp),
                value: e.data.newValue
            }))
            .sort((a, b) => a.date - b.date);
        
        // Añadir valor inicial si existe
        const player = Storage.getPlayerById(playerId);
        if (player && player.createdAt) {
            ovrChanges.unshift({
                date: new Date(player.createdAt),
                value: player.initialOVR || player.ovr
            });
        }
        
        return ovrChanges;
    },
    
    /**
     * Obtiene comparación entre fechas
     */
    async getPlayerComparison(playerId, date1, date2) {
        const history = await this.getPlayerHistory(playerId);
        
        // Obtener estado en fecha 1
        const state1 = this.getPlayerStateAtDate(history, date1);
        
        // Obtener estado en fecha 2
        const state2 = this.getPlayerStateAtDate(history, date2);
        
        // Calcular diferencias
        const comparison = {
            ovr: {
                date1: state1.ovr,
                date2: state2.ovr,
                change: state2.ovr - state1.ovr
            },
            attributes: {},
            matches: state2.matches - state1.matches,
            goals: state2.goals - state1.goals,
            assists: state2.assists - state1.assists
        };
        
        // Comparar atributos
        for (const attr in state2.attributes) {
            comparison.attributes[attr] = {
                date1: state1.attributes[attr] || 0,
                date2: state2.attributes[attr] || 0,
                change: (state2.attributes[attr] || 0) - (state1.attributes[attr] || 0)
            };
        }
        
        return comparison;
    },
    
    /**
     * Obtiene estado del jugador en una fecha
     */
    getPlayerStateAtDate(history, date) {
        const relevantHistory = history.filter(e => new Date(e.timestamp) <= date);
        
        const state = {
            ovr: 50,
            attributes: {},
            matches: 0,
            goals: 0,
            assists: 0
        };
        
        relevantHistory.forEach(event => {
            switch(event.type) {
                case this.eventTypes.OVR_CHANGE:
                    state.ovr = event.data.newValue;
                    break;
                case this.eventTypes.ATTRIBUTE_CHANGE:
                    state.attributes[event.data.attribute] = event.data.newValue;
                    break;
                case this.eventTypes.MATCH_PLAYED:
                    state.matches++;
                    break;
                case this.eventTypes.GOAL_SCORED:
                    state.goals += event.data.goals || 1;
                    break;
                case this.eventTypes.ASSIST_MADE:
                    state.assists += event.data.assists || 1;
                    break;
            }
        });
        
        return state;
    },
    
    /**
     * Genera reporte de jugador
     */
    async generatePlayerReport(playerId, period = 'all') {
        const player = Storage.getPlayerById(playerId);
        if (!player) return null;
        
        const history = await this.getPlayerHistory(playerId);
        const filteredHistory = this.filterHistoryByPeriod(history, period);
        const stats = this.calculateHistoricalStats(filteredHistory);
        const ovrEvolution = await this.getOVREvolution(playerId);
        
        return {
            player,
            period,
            stats,
            ovrEvolution,
            recentEvents: filteredHistory.slice(0, 10),
            milestones: filteredHistory.filter(e => e.type === this.eventTypes.MILESTONE)
        };
    },
    
    /**
     * Filtra historial por período
     */
    filterHistoryByPeriod(history, period) {
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'season':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                return history;
        }
        
        return history.filter(e => new Date(e.timestamp) >= startDate);
    },
    
    /**
     * Muestra timeline visual
     */
    renderTimeline(playerId, containerId) {
        this.getPlayerTimeline(playerId).then(data => {
            if (!data) return;
            
            const container = document.getElementById(containerId);
            if (!container) return;
            
            let html = '<div class="player-timeline">';
            
            // Header con info del jugador
            html += `
                <div class="timeline-header">
                    <h3>${data.player.name}</h3>
                    <div class="timeline-stats">
                        <span>${data.stats.matchesPlayed} partidos</span>
                        <span>${data.stats.goals} goles</span>
                        <span>${data.stats.assists} asistencias</span>
                    </div>
                </div>
            `;
            
            // Timeline
            html += '<div class="timeline-content">';
            
            for (const date in data.timeline) {
                html += `
                    <div class="timeline-date">
                        <div class="date-marker">${date}</div>
                        <div class="timeline-events">
                `;
                
                data.timeline[date].forEach(event => {
                    html += this.renderTimelineEvent(event);
                });
                
                html += '</div></div>';
            }
            
            html += '</div></div>';
            
            container.innerHTML = html;
        });
    },
    
    /**
     * Renderiza evento del timeline
     */
    renderTimelineEvent(event) {
        const icon = this.getEventIcon(event.type);
        const text = this.getEventText(event);
        const className = this.getEventClassName(event.type);
        
        return `
            <div class="timeline-event ${className}">
                <span class="event-icon">${icon}</span>
                <span class="event-text">${text}</span>
                <span class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
    },
    
    /**
     * Obtiene icono del evento
     */
    getEventIcon(type) {
        const icons = {
            [this.eventTypes.CREATED]: '🆕',
            [this.eventTypes.MATCH_PLAYED]: '⚽',
            [this.eventTypes.GOAL_SCORED]: '⚽',
            [this.eventTypes.ASSIST_MADE]: '🎯',
            [this.eventTypes.CARD_RECEIVED]: '🟨',
            [this.eventTypes.MVP_AWARDED]: '⭐',
            [this.eventTypes.TROPHY_WON]: '🏆',
            [this.eventTypes.INJURY]: '🏥',
            [this.eventTypes.RECOVERY]: '✅',
            [this.eventTypes.OVR_CHANGE]: '📈',
            [this.eventTypes.MILESTONE]: '🎉',
            [this.eventTypes.ATTRIBUTE_CHANGE]: '💪',
            [this.eventTypes.POSITION_CHANGE]: '🔄'
        };
        
        return icons[type] || '📝';
    },
    
    /**
     * Obtiene texto del evento
     */
    getEventText(event) {
        switch(event.type) {
            case this.eventTypes.CREATED:
                return 'Jugador registrado';
            case this.eventTypes.MATCH_PLAYED:
                return 'Partido jugado';
            case this.eventTypes.GOAL_SCORED:
                return `${event.data.goals || 1} gol(es) marcado(s)`;
            case this.eventTypes.ASSIST_MADE:
                return `${event.data.assists || 1} asistencia(s)`;
            case this.eventTypes.CARD_RECEIVED:
                return `Tarjeta ${event.data.cardType}`;
            case this.eventTypes.MVP_AWARDED:
                return 'Premio MVP';
            case this.eventTypes.TROPHY_WON:
                return `Trofeo: ${event.data.name}`;
            case this.eventTypes.INJURY:
                return `Lesión: ${event.data.type}`;
            case this.eventTypes.RECOVERY:
                return 'Recuperado de lesión';
            case this.eventTypes.OVR_CHANGE:
                const change = event.data.newValue - event.data.oldValue;
                return `OVR: ${event.data.oldValue} → ${event.data.newValue} (${change > 0 ? '+' : ''}${change})`;
            case this.eventTypes.ATTRIBUTE_CHANGE:
                return `${event.data.attribute}: ${event.data.oldValue} → ${event.data.newValue}`;
            case this.eventTypes.MILESTONE:
                return event.data.text;
            default:
                return 'Evento registrado';
        }
    },
    
    /**
     * Obtiene clase CSS del evento
     */
    getEventClassName(type) {
        const positiveEvents = [
            this.eventTypes.GOAL_SCORED,
            this.eventTypes.ASSIST_MADE,
            this.eventTypes.MVP_AWARDED,
            this.eventTypes.TROPHY_WON,
            this.eventTypes.RECOVERY,
            this.eventTypes.MILESTONE
        ];
        
        const negativeEvents = [
            this.eventTypes.CARD_RECEIVED,
            this.eventTypes.INJURY
        ];
        
        if (positiveEvents.includes(type)) return 'positive';
        if (negativeEvents.includes(type)) return 'negative';
        return 'neutral';
    },
    
    /**
     * Guarda evento en Firebase
     */
    async saveEvent(event) {
        if (!db) return false;
        
        try {
            await db.collection('playerHistory').add(event);
            return true;
        } catch (error) {
            console.error('Error saving history event:', error);
            return false;
        }
    },
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Interceptar cambios en jugadores para registrar historial
        if (window.Storage) {
            const originalUpdatePlayer = Storage.updatePlayer;
            Storage.updatePlayer = async function(playerId, updates) {
                const oldPlayer = Storage.getPlayerById(playerId);
                const result = await originalUpdatePlayer.call(this, playerId, updates);
                
                if (result && oldPlayer) {
                    // Verificar cambios y registrar
                    if (updates.ovr && updates.ovr !== oldPlayer.ovr) {
                        PlayerHistory.recordOVRChange(playerId, oldPlayer.ovr, updates.ovr);
                    }
                    
                    if (updates.attributes) {
                        for (const attr in updates.attributes) {
                            if (oldPlayer.attributes[attr] !== updates.attributes[attr]) {
                                PlayerHistory.recordAttributeChange(
                                    playerId,
                                    attr,
                                    oldPlayer.attributes[attr],
                                    updates.attributes[attr]
                                );
                            }
                        }
                    }
                    
                    if (updates.position && updates.position !== oldPlayer.position) {
                        PlayerHistory.recordEvent(playerId, PlayerHistory.eventTypes.POSITION_CHANGE, {
                            oldPosition: oldPlayer.position,
                            newPosition: updates.position
                        });
                    }
                }
                
                return result;
            };
        }
    }
};

// Exportar para uso global
window.PlayerHistory = PlayerHistory;