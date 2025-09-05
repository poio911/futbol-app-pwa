/**
 * SISTEMA AVANZADO DE GENERACIÓN DE EQUIPOS BALANCEADOS
 * Considera: OVR, Posiciones, Atributos específicos y Especialidades
 */

class TeamGeneratorAdvanced {
    constructor() {
        this.positions = {
            'POR': { priority: 1, maxPerTeam: 1 },
            'DEF': { priority: 2, maxPerTeam: 3 },
            'MED': { priority: 3, maxPerTeam: 3 },
            'DEL': { priority: 4, maxPerTeam: 3 }
        };
        
        this.attributes = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
    }

    /**
     * Genera equipos balanceados considerando múltiples factores
     */
    generateBalancedTeams(players, format = '5v5') {
        console.log('🎯 Generando equipos balanceados avanzados...');
        
        const playersPerTeam = parseInt(format.split('v')[0]);
        const totalPlayersNeeded = playersPerTeam * 2;
        
        // Validación
        if (!players || players.length < totalPlayersNeeded) {
            throw new Error(`Se necesitan al menos ${totalPlayersNeeded} jugadores para formato ${format}`);
        }
        
        // Tomar solo los jugadores necesarios
        const selectedPlayers = players.slice(0, totalPlayersNeeded);
        
        // Preparar jugadores con cálculos adicionales
        const enrichedPlayers = this.enrichPlayers(selectedPlayers);
        
        // Separar por posiciones
        const playersByPosition = this.groupByPosition(enrichedPlayers);
        
        // Inicializar equipos
        const teamA = [];
        const teamB = [];
        
        // PASO 1: Distribuir porteros (si hay)
        this.distributeGoalkeepers(playersByPosition.POR || [], teamA, teamB, playersPerTeam);
        
        // PASO 2: Distribuir defensas
        this.distributeByPosition(playersByPosition.DEF || [], teamA, teamB, playersPerTeam);
        
        // PASO 3: Distribuir mediocampistas
        this.distributeByPosition(playersByPosition.MED || [], teamA, teamB, playersPerTeam);
        
        // PASO 4: Distribuir delanteros
        this.distributeByPosition(playersByPosition.DEL || [], teamA, teamB, playersPerTeam);
        
        // PASO 5: Distribuir jugadores sin posición o restantes
        const unassignedPlayers = enrichedPlayers.filter(p => 
            !teamA.includes(p) && !teamB.includes(p)
        );
        this.distributeRemaining(unassignedPlayers, teamA, teamB, playersPerTeam);
        
        // PASO 6: Optimización final - intercambiar jugadores si mejora el balance
        this.optimizeTeams(teamA, teamB);
        
        // Calcular estadísticas de los equipos
        const teamAStats = this.calculateTeamStats(teamA);
        const teamBStats = this.calculateTeamStats(teamB);
        
        // Asignar nombres a los equipos
        const teamNames = this.generateTeamNames();
        
        return {
            teamA: {
                name: teamNames.teamA,
                players: teamA,
                stats: teamAStats,
                ovr: teamAStats.avgOVR
            },
            teamB: {
                name: teamNames.teamB,
                players: teamB,
                stats: teamBStats,
                ovr: teamBStats.avgOVR
            },
            balance: this.calculateBalance(teamAStats, teamBStats)
        };
    }

    /**
     * Enriquece los datos de los jugadores con cálculos adicionales
     */
    enrichPlayers(players) {
        return players.map(player => {
            // Calcular especialidad (atributo más alto)
            const specialty = this.calculateSpecialty(player);
            
            // Calcular OVR por posición
            const positionOVR = this.calculatePositionOVR(player);
            
            return {
                ...player,
                specialty,
                positionOVR,
                overallScore: this.calculateOverallScore(player)
            };
        });
    }

    /**
     * Calcula la especialidad del jugador (su mejor atributo)
     */
    calculateSpecialty(player) {
        const attrs = player.attributes || {};
        let maxAttr = 'balanced';
        let maxValue = 0;
        
        const specialties = {
            pac: '⚡ Velocista',
            sho: '🎯 Tirador',
            pas: '📊 Pasador',
            dri: '✨ Regateador',
            def: '🛡️ Defensor',
            phy: '💪 Físico'
        };
        
        for (const attr of this.attributes) {
            const value = attrs[attr] || player[attr] || 70;
            if (value > maxValue) {
                maxValue = value;
                maxAttr = attr;
            }
        }
        
        return specialties[maxAttr] || '⚖️ Balanceado';
    }

    /**
     * Calcula el OVR ajustado según la posición
     */
    calculatePositionOVR(player) {
        const position = player.position || 'MED';
        const attrs = player.attributes || {};
        
        // Pesos por posición
        const weights = {
            POR: { def: 0.4, phy: 0.3, pas: 0.2, pac: 0.1 },
            DEF: { def: 0.35, phy: 0.25, pac: 0.2, pas: 0.2 },
            MED: { pas: 0.3, dri: 0.25, def: 0.2, phy: 0.25 },
            DEL: { sho: 0.35, pac: 0.25, dri: 0.25, phy: 0.15 }
        };
        
        const posWeights = weights[position] || weights.MED;
        let weightedOVR = 0;
        let totalWeight = 0;
        
        for (const [attr, weight] of Object.entries(posWeights)) {
            const value = attrs[attr] || player[attr] || 70;
            weightedOVR += value * weight;
            totalWeight += weight;
        }
        
        return Math.round(weightedOVR / totalWeight);
    }

    /**
     * Calcula un score general para el jugador
     */
    calculateOverallScore(player) {
        const ovrWeight = 0.5;
        const positionOVRWeight = 0.3;
        const attributesWeight = 0.2;
        
        const ovr = window.calculatePlayerOVR ? window.calculatePlayerOVR(player) : (player.ovr || 70);
        const posOVR = player.positionOVR || ovr;
        
        // Promedio de atributos
        const attrs = player.attributes || {};
        const attrValues = this.attributes.map(a => attrs[a] || player[a] || 70);
        const avgAttrs = attrValues.reduce((a, b) => a + b, 0) / attrValues.length;
        
        return Math.round(
            ovr * ovrWeight + 
            posOVR * positionOVRWeight + 
            avgAttrs * attributesWeight
        );
    }

    /**
     * Agrupa jugadores por posición
     */
    groupByPosition(players) {
        const groups = {};
        
        for (const player of players) {
            const position = player.position || 'MED';
            if (!groups[position]) {
                groups[position] = [];
            }
            groups[position].push(player);
        }
        
        // Ordenar cada grupo por overallScore
        for (const position in groups) {
            groups[position].sort((a, b) => b.overallScore - a.overallScore);
        }
        
        return groups;
    }

    /**
     * Distribuye porteros equitativamente
     */
    distributeGoalkeepers(goalkeepers, teamA, teamB, maxPerTeam) {
        if (goalkeepers.length === 0) return;
        
        // Si hay 2 o más porteros, uno para cada equipo
        if (goalkeepers.length >= 2) {
            teamA.push(goalkeepers[0]);
            teamB.push(goalkeepers[1]);
        } else if (goalkeepers.length === 1) {
            // Si solo hay un portero, al equipo con menos jugadores
            if (teamA.length <= teamB.length) {
                teamA.push(goalkeepers[0]);
            } else {
                teamB.push(goalkeepers[0]);
            }
        }
    }

    /**
     * Distribuye jugadores de una posición específica
     */
    distributeByPosition(players, teamA, teamB, maxPerTeam) {
        let teamANeed = maxPerTeam - teamA.length;
        let teamBNeed = maxPerTeam - teamB.length;
        
        for (let i = 0; i < players.length; i++) {
            if (teamANeed <= 0 && teamBNeed <= 0) break;
            
            const player = players[i];
            
            // Alternar entre equipos, pero verificar que no estén llenos
            if (i % 2 === 0) {
                if (teamANeed > 0) {
                    teamA.push(player);
                    teamANeed--;
                } else if (teamBNeed > 0) {
                    teamB.push(player);
                    teamBNeed--;
                }
            } else {
                if (teamBNeed > 0) {
                    teamB.push(player);
                    teamBNeed--;
                } else if (teamANeed > 0) {
                    teamA.push(player);
                    teamANeed--;
                }
            }
        }
    }

    /**
     * Distribuye jugadores restantes
     */
    distributeRemaining(players, teamA, teamB, maxPerTeam) {
        // Ordenar por overallScore
        players.sort((a, b) => b.overallScore - a.overallScore);
        
        for (const player of players) {
            if (teamA.length >= maxPerTeam && teamB.length >= maxPerTeam) break;
            
            if (teamA.length < maxPerTeam && teamB.length < maxPerTeam) {
                // Ambos tienen espacio, elegir el que tenga menor OVR promedio
                const avgA = this.calculateAvgOVR(teamA);
                const avgB = this.calculateAvgOVR(teamB);
                
                if (avgA <= avgB) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            } else if (teamA.length < maxPerTeam) {
                teamA.push(player);
            } else if (teamB.length < maxPerTeam) {
                teamB.push(player);
            }
        }
    }

    /**
     * Optimiza los equipos intercambiando jugadores si mejora el balance
     */
    optimizeTeams(teamA, teamB) {
        const maxIterations = 10;
        let improved = true;
        let iterations = 0;
        
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            const currentDiff = Math.abs(this.calculateAvgOVR(teamA) - this.calculateAvgOVR(teamB));
            
            // Intentar intercambiar jugadores de la misma posición
            for (let i = 0; i < teamA.length; i++) {
                for (let j = 0; j < teamB.length; j++) {
                    const playerA = teamA[i];
                    const playerB = teamB[j];
                    
                    // Solo intercambiar si son de la misma posición o similares
                    if (this.canSwapPlayers(playerA, playerB)) {
                        // Simular intercambio
                        teamA[i] = playerB;
                        teamB[j] = playerA;
                        
                        const newDiff = Math.abs(this.calculateAvgOVR(teamA) - this.calculateAvgOVR(teamB));
                        
                        if (newDiff < currentDiff) {
                            // El intercambio mejora el balance
                            improved = true;
                            break;
                        } else {
                            // Revertir intercambio
                            teamA[i] = playerA;
                            teamB[j] = playerB;
                        }
                    }
                }
                if (improved) break;
            }
        }
        
        console.log(`Optimización completada en ${iterations} iteraciones`);
    }

    /**
     * Verifica si dos jugadores pueden intercambiarse
     */
    canSwapPlayers(playerA, playerB) {
        // No intercambiar porteros con otras posiciones
        if (playerA.position === 'POR' && playerB.position !== 'POR') return false;
        if (playerB.position === 'POR' && playerA.position !== 'POR') return false;
        
        // Permitir intercambio si la diferencia de OVR no es muy grande
        const ovrA = window.calculatePlayerOVR ? window.calculatePlayerOVR(playerA) : (playerA.ovr || 70);
        const ovrB = window.calculatePlayerOVR ? window.calculatePlayerOVR(playerB) : (playerB.ovr || 70);
        const ovrDiff = Math.abs(ovrA - ovrB);
        return ovrDiff <= 10;
    }

    /**
     * Calcula el OVR promedio de un equipo
     */
    calculateAvgOVR(team) {
        if (team.length === 0) return 0;
        const sum = team.reduce((total, player) => {
            const playerOVR = window.calculatePlayerOVR ? window.calculatePlayerOVR(player) : (player.ovr || 70);
            return total + playerOVR;
        }, 0);
        return sum / team.length;
    }

    /**
     * Calcula estadísticas detalladas del equipo
     */
    calculateTeamStats(team) {
        const stats = {
            avgOVR: 0,
            avgPace: 0,
            avgShooting: 0,
            avgPassing: 0,
            avgDribbling: 0,
            avgDefending: 0,
            avgPhysical: 0,
            positions: {},
            specialties: {}
        };
        
        if (team.length === 0) return stats;
        
        // Calcular promedios
        for (const player of team) {
            const attrs = player.attributes || {};
            const playerOVR = window.calculatePlayerOVR ? window.calculatePlayerOVR(player) : (player.ovr || 70);
            stats.avgOVR += playerOVR;
            stats.avgPace += attrs.pac || player.pac || 70;
            stats.avgShooting += attrs.sho || player.sho || 70;
            stats.avgPassing += attrs.pas || player.pas || 70;
            stats.avgDribbling += attrs.dri || player.dri || 70;
            stats.avgDefending += attrs.def || player.def || 70;
            stats.avgPhysical += attrs.phy || player.phy || 70;
            
            // Contar posiciones
            const position = player.position || 'MED';
            stats.positions[position] = (stats.positions[position] || 0) + 1;
            
            // Contar especialidades
            const specialty = player.specialty || 'Balanceado';
            stats.specialties[specialty] = (stats.specialties[specialty] || 0) + 1;
        }
        
        // Promediar
        const count = team.length;
        stats.avgOVR = Math.round(stats.avgOVR / count);
        stats.avgPace = Math.round(stats.avgPace / count);
        stats.avgShooting = Math.round(stats.avgShooting / count);
        stats.avgPassing = Math.round(stats.avgPassing / count);
        stats.avgDribbling = Math.round(stats.avgDribbling / count);
        stats.avgDefending = Math.round(stats.avgDefending / count);
        stats.avgPhysical = Math.round(stats.avgPhysical / count);
        
        return stats;
    }

    /**
     * Calcula el balance entre los equipos
     */
    calculateBalance(teamAStats, teamBStats) {
        const ovrDiff = Math.abs(teamAStats.avgOVR - teamBStats.avgOVR);
        
        let balanceRating = 'Perfecto';
        let balanceScore = 100;
        
        if (ovrDiff <= 1) {
            balanceRating = '⭐⭐⭐⭐⭐ Perfecto';
            balanceScore = 100;
        } else if (ovrDiff <= 3) {
            balanceRating = '⭐⭐⭐⭐ Excelente';
            balanceScore = 90;
        } else if (ovrDiff <= 5) {
            balanceRating = '⭐⭐⭐ Bueno';
            balanceScore = 75;
        } else if (ovrDiff <= 8) {
            balanceRating = '⭐⭐ Regular';
            balanceScore = 60;
        } else {
            balanceRating = '⭐ Desbalanceado';
            balanceScore = 40;
        }
        
        return {
            rating: balanceRating,
            score: balanceScore,
            ovrDifference: ovrDiff,
            details: {
                paceDiff: Math.abs(teamAStats.avgPace - teamBStats.avgPace),
                shootingDiff: Math.abs(teamAStats.avgShooting - teamBStats.avgShooting),
                passingDiff: Math.abs(teamAStats.avgPassing - teamBStats.avgPassing),
                dribblingDiff: Math.abs(teamAStats.avgDribbling - teamBStats.avgDribbling),
                defendingDiff: Math.abs(teamAStats.avgDefending - teamBStats.avgDefending),
                physicalDiff: Math.abs(teamAStats.avgPhysical - teamBStats.avgPhysical)
            }
        };
    }

    /**
     * Genera nombres para los equipos
     */
    generateTeamNames() {
        const teamNames = [
            { teamA: '🔴 Equipo Rojo', teamB: '🔵 Equipo Azul' },
            { teamA: '⚫ Equipo Negro', teamB: '⚪ Equipo Blanco' },
            { teamA: '🟢 Equipo Verde', teamB: '🟡 Equipo Amarillo' },
            { teamA: '🟣 Equipo Violeta', teamB: '🟠 Equipo Naranja' }
        ];
        
        return teamNames[Math.floor(Math.random() * teamNames.length)];
    }
}

// Crear instancia global
window.TeamGeneratorAdvanced = new TeamGeneratorAdvanced();

console.log('✅ Sistema avanzado de generación de equipos cargado');