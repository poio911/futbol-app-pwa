/**
 * Match System V2 - Complete redesign for proper match and evaluation management
 */

const MatchSystemV2 = {
    // Performance tags configuration
    performanceTags: {
        goleador: { 
            icon: '⚽', 
            label: 'Goleador', 
            points: { sho: 2 },
            description: '+2 Tiro'
        },
        asistencia: { 
            icon: '🎯', 
            label: 'Asistencia', 
            points: { pas: 2 },
            description: '+2 Pase'
        },
        velocidad: { 
            icon: '⚡', 
            label: 'Velocidad destacada', 
            points: { pac: 1 },
            description: '+1 Ritmo'
        },
        defensa: { 
            icon: '🛡️', 
            label: 'Defensa sólida', 
            points: { def: 2 },
            description: '+2 Defensa'
        },
        regate: { 
            icon: '✨', 
            label: 'Regate exitoso', 
            points: { dri: 1 },
            description: '+1 Regate'
        },
        liderazgo: { 
            icon: '👑', 
            label: 'Liderazgo', 
            points: { pas: 1 },
            description: '+1 Pase'
        },
        jugada_clave: { 
            icon: '🔑', 
            label: 'Jugada clave', 
            points: { dri: 1 },
            description: '+1 Regate'
        },
        atajada: { 
            icon: '🥅', 
            label: 'Atajada importante', 
            points: { def: 2 },
            description: '+2 Defensa'
        }
    },

    /**
     * Generate balanced teams from selected players
     */
    generateBalancedTeams(players, format = '5v5') {
        const playersPerTeam = parseInt(format.split('v')[0]);
        
        // Validate we have enough players
        if (players.length < playersPerTeam * 2) {
            throw new Error(`Necesitas al menos ${playersPerTeam * 2} jugadores para ${format}`);
        }

        // Sort players by OVR for better distribution
        const sortedPlayers = [...players].sort((a, b) => b.ovr - a.ovr);
        
        const teamA = [];
        const teamB = [];
        
        // Distribute players alternating between teams
        sortedPlayers.forEach((player, index) => {
            if (index % 2 === 0) {
                if (teamA.length < playersPerTeam) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            } else {
                if (teamB.length < playersPerTeam) {
                    teamB.push(player);
                } else {
                    teamA.push(player);
                }
            }
        });

        // Calculate team OVRs
        const teamAOvr = Math.round(teamA.reduce((sum, p) => sum + p.ovr, 0) / teamA.length);
        const teamBOvr = Math.round(teamB.reduce((sum, p) => sum + p.ovr, 0) / teamB.length);

        return {
            teamA: {
                name: 'Equipo A',
                players: teamA,
                ovr: teamAOvr
            },
            teamB: {
                name: 'Equipo B',
                players: teamB,
                ovr: teamBOvr
            },
            difference: Math.abs(teamAOvr - teamBOvr)
        };
    },

    /**
     * Create and save a new match
     */
    async createMatch(teamA, teamB, matchDate, groupId) {
        const match = {
            id: Utils.generateId(),
            groupId: groupId,
            date: matchDate || new Date().toISOString(),
            status: 'scheduled',
            teamA: {
                name: teamA.name,
                players: teamA.players.map(p => p.id),
                playerDetails: teamA.players, // Keep full details for display
                ovr: teamA.ovr,
                score: null
            },
            teamB: {
                name: teamB.name,
                players: teamB.players.map(p => p.id),
                playerDetails: teamB.players, // Keep full details for display
                ovr: teamB.ovr,
                score: null
            },
            evaluation: null,
            createdAt: new Date().toISOString(),
            evaluatedAt: null
        };

        // Save to Firebase
        try {
            await Storage.addMatch(match);
            console.log('Match created successfully:', match.id);
            return match;
        } catch (error) {
            console.error('Error creating match:', error);
            throw error;
        }
    },

    /**
     * Get all matches for a group
     */
    async getMatchesForGroup(groupId) {
        try {
            const matches = await Storage.getMatchesByGroup(groupId);
            return matches.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error fetching matches:', error);
            return [];
        }
    },

    /**
     * Get matches ready for evaluation
     */
    async getMatchesForEvaluation(groupId) {
        const matches = await this.getMatchesForGroup(groupId);
        console.log('All matches for evaluation:', matches);
        const filteredMatches = matches.filter(m => m.status !== 'evaluated');
        console.log('Filtered matches for evaluation:', filteredMatches);
        return filteredMatches;
    },

    /**
     * Check if match can be evaluated
     */
    canEvaluateMatch(match) {
        return match.status !== 'evaluated';
    },

    /**
     * Start match evaluation
     */
    async startEvaluation(matchId) {
        const match = await Storage.getMatchById(matchId);
        
        if (!match) {
            throw new Error('Partido no encontrado');
        }

        if (match.status === 'evaluated') {
            throw new Error('Este partido ya fue evaluado');
        }

        // Load full player details if not already present
        if (!match.teamA.playerDetails) {
            match.teamA.playerDetails = [];
            for (const playerId of match.teamA.players) {
                const player = await Storage.getPlayerById(playerId);
                if (player) {
                    match.teamA.playerDetails.push(player);
                }
            }
        }

        if (!match.teamB.playerDetails) {
            match.teamB.playerDetails = [];
            for (const playerId of match.teamB.players) {
                const player = await Storage.getPlayerById(playerId);
                if (player) {
                    match.teamB.playerDetails.push(player);
                }
            }
        }

        // Update status to prevent duplicate evaluation
        match.status = 'in_evaluation';
        await Storage.updateMatch(match);

        return match;
    },

    /**
     * Save match evaluation
     */
    async saveEvaluation(matchId, teamAScore, teamBScore, playerPerformance) {
        const match = await Storage.getMatchById(matchId);
        
        if (!match) {
            throw new Error('Partido no encontrado');
        }

        if (match.status === 'evaluated') {
            throw new Error('Este partido ya fue evaluado');
        }

        // Create evaluation object
        const evaluation = {
            matchId: matchId,
            teamAScore: teamAScore,
            teamBScore: teamBScore,
            playerPerformance: playerPerformance,
            evaluatedBy: Storage.getCurrentPerson(),
            evaluatedAt: new Date().toISOString()
        };

        // Update match with evaluation
        match.teamA.score = teamAScore;
        match.teamB.score = teamBScore;
        match.evaluation = evaluation;
        match.status = 'evaluated';
        match.evaluatedAt = evaluation.evaluatedAt;

        // Save to Firebase
        await Storage.updateMatch(match);

        // Update player statistics
        await this.updatePlayerStatistics(match, playerPerformance);
        return match;
    },

    /**
     * Update player statistics based on evaluation
     */
    async updatePlayerStatistics(match, playerPerformance) {
        const allPlayerIds = [
            ...match.teamA.players,
            ...match.teamB.players
        ];

        for (const playerId of allPlayerIds) {
            const player = await Storage.getPlayerById(playerId);
            if (!player) continue;

            const performance = playerPerformance[playerId];
            if (!performance) continue;

            // Update stats based on performance tags
            if (performance.tags && performance.tags.length > 0) {
                for (const tagId of performance.tags) {
                    const tag = this.performanceTags[tagId];
                    if (tag && tag.points) {
                        // Apply stat improvements
                        for (const [stat, value] of Object.entries(tag.points)) {
                            if (player.attributes[stat]) {
                                player.attributes[stat] = Math.min(99, player.attributes[stat] + value);
                            }
                        }
                    }
                }
            }

            // Update match history
            if (!player.matchHistory) {
                player.matchHistory = [];
            }

            player.matchHistory.push({
                matchId: match.id,
                date: match.date,
                performance: performance,
                teamScore: match.teamA.players.includes(playerId) ? 
                    match.teamA.score : match.teamB.score,
                opponentScore: match.teamA.players.includes(playerId) ? 
                    match.teamB.score : match.teamA.score
            });

            // Recalculate OVR
            player.ovr = Utils.calculateOvr(player.attributes);

            // Save updated player
            await Storage.updatePlayer(player);
        }
    },

    /**
     * Create evaluation UI for a match
     */
    createEvaluationUI(match) {
        const allPlayers = [
            ...match.teamA.playerDetails.map(p => ({...p, team: 'A'})),
            ...match.teamB.playerDetails.map(p => ({...p, team: 'B'}))
        ];

        return `
            <div class="evaluation-container">
                <!-- Match Header -->
                <div class="evaluation-header">
                    <h2>Resultado del Partido</h2>
                    <div class="teams-score-section">
                        <div class="team-score-input">
                            <h3>${match.teamA.name} (OVR: ${match.teamA.ovr})</h3>
                            <input type="number" id="team-a-score" class="score-input" min="0" max="20" value="0">
                        </div>
                        <div class="score-separator">-</div>
                        <div class="team-score-input">
                            <h3>${match.teamB.name} (OVR: ${match.teamB.ovr})</h3>
                            <input type="number" id="team-b-score" class="score-input" min="0" max="20" value="0">
                        </div>
                    </div>
                </div>

                <!-- Player Performance Section -->
                <div class="player-performance-section">
                    <h3>Calificar Jugadores</h3>
                    <div class="players-grid">
                        ${allPlayers.map(player => this.createPlayerEvaluationCard(player)).join('')}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="evaluation-actions">
                    <button class="btn btn-success" onclick="MatchSystemV2.submitEvaluation('${match.id}')">
                        <i class='bx bx-save'></i> Guardar Evaluación
                    </button>
                    <button class="btn btn-secondary" onclick="MatchSystemV2.cancelEvaluation('${match.id}')">
                        <i class='bx bx-x'></i> Cancelar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Create player evaluation card
     */
    createPlayerEvaluationCard(player) {
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}">` :
            `<i class='bx bx-user'></i>`;

        const positionClass = `position-${player.position.toLowerCase()}`;

        return `
            <div class="player-evaluation-simple" data-player-id="${player.id}">
                <div class="player-eval-info">
                    <div class="player-basic-info">
                        <span class="player-name">${player.name}</span>
                        <span class="player-details">
                            <span class="player-position ${positionClass}">${player.position}</span>
                            <span class="player-ovr">${player.ovr}</span>
                        </span>
                    </div>
                    <div class="performance-tags-inline">
                        ${Object.entries(this.performanceTags).map(([id, tag]) => `
                            <label class="tag-option" for="tag-${player.id}-${id}">
                                <input type="checkbox" id="tag-${player.id}-${id}" 
                                       name="tags-${player.id}" value="${id}">
                                <span class="tag-content">
                                    ${tag.icon} ${tag.label}
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Submit evaluation
     */
    async submitEvaluation(matchId) {
        const teamAScore = parseInt(document.getElementById('team-a-score').value);
        const teamBScore = parseInt(document.getElementById('team-b-score').value);

        // Collect player performance data
        const playerPerformance = {};
        const playerCards = document.querySelectorAll('.player-evaluation-card');
        
        playerCards.forEach(card => {
            const playerId = card.dataset.playerId;
            const selectedTags = [];
            
            card.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                selectedTags.push(checkbox.value);
            });

            playerPerformance[playerId] = {
                tags: selectedTags,
                rating: this.calculatePlayerRating(selectedTags, teamAScore, teamBScore)
            };
        });

        try {
            await this.saveEvaluation(matchId, teamAScore, teamBScore, playerPerformance);
            UI.showNotification('Evaluación guardada exitosamente', 'success');
            
            // Show success message and redirect after a brief delay
            setTimeout(() => {
                App.loadEvaluationScreen(); // Reload to show updated matches list
            }, 1500); // 1.5 second delay to show the success message
            
            // Temporarily show success state
            document.querySelector('.evaluation-container').innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--primary-color);">
                    <i class='bx bx-check-circle' style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <h2 style="margin-bottom: 10px;">¡Partido Evaluado!</h2>
                    <p style="color: #888; margin-bottom: 20px;">La evaluación se guardó correctamente</p>
                    <p style="color: #888; font-size: 0.9rem;">Redirigiendo...</p>
                </div>
            `;
        } catch (error) {
            console.error('Error saving evaluation:', error);
            UI.showNotification('Error al guardar la evaluación', 'error');
        }
    },

    /**
     * Calculate player rating based on performance
     */
    calculatePlayerRating(tags, teamScore, opponentScore) {
        let rating = 6.0; // Base rating

        // Adjust for match result
        if (teamScore > opponentScore) {
            rating += 0.5; // Win bonus
        } else if (teamScore < opponentScore) {
            rating -= 0.5; // Loss penalty
        }

        // Adjust for performance tags
        rating += tags.length * 0.3;

        // Cap between 1 and 10
        return Math.min(10, Math.max(1, rating));
    },

    /**
     * Cancel evaluation
     */
    async cancelEvaluation(matchId) {
        const match = await Storage.getMatchById(matchId);
        if (match && match.status === 'in_evaluation') {
            match.status = 'scheduled';
            await Storage.updateMatch(match);
        }
        App.loadEvaluationScreen();
    }
};

// Make it globally available
window.MatchSystemV2 = MatchSystemV2;