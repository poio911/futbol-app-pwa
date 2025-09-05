/**
 * Sistema Unificado de Evaluaciones
 * Maneja evaluaciones automáticas para partidos manuales y colaborativos
 */

class UnifiedEvaluationSystem {
    constructor() {
        this.EVALUATION_TIMEOUT = 72 * 60 * 60 * 1000; // 72 horas
        this.MIN_PARTICIPATION_RATE = 0.8; // 80% para actualizar OVRs
        this.PLAYERS_TO_EVALUATE = 2; // Cada jugador evalúa 2 compañeros
    }

    /**
     * Inicializa evaluaciones para un partido finalizado
     * @param {Object} match - Datos del partido
     * @param {string} matchType - 'manual' o 'collaborative'
     */
    async initializeEvaluations(match, matchType) {
        console.log(`Inicializando evaluaciones para partido ${matchType}:`, match.id);
        
        // Filtrar jugadores elegibles (no invitados)
        const eligiblePlayers = this.getEligiblePlayers(match);
        
        if (eligiblePlayers.length < 3) {
            console.log('No hay suficientes jugadores para evaluaciones');
            return null;
        }

        // Generar asignaciones aleatorias
        const assignments = this.generateEvaluationAssignments(eligiblePlayers, match);
        
        // Crear estructura de evaluación
        const evaluationData = {
            matchId: match.id,
            matchType: matchType,
            matchDate: match.date || match.createdAt || new Date().toISOString(),
            matchName: match.name || `${match.teamA?.name || 'Equipo A'} vs ${match.teamB?.name || 'Equipo B'}`,
            createdAt: Date.now(),
            deadline: Date.now() + this.EVALUATION_TIMEOUT,
            assignments: assignments || {},
            completed: {},
            participationRate: 0,
            ovrUpdateTriggered: false,
            status: 'pending',
            teamA: {
                name: match.teamA?.name || 'Equipo A',
                players: match.teamA?.players?.length || 0
            },
            teamB: {
                name: match.teamB?.name || 'Equipo B', 
                players: match.teamB?.players?.length || 0
            }
        };

        // Guardar en Firebase
        await this.saveEvaluationData(evaluationData);
        
        // Enviar notificaciones
        await this.sendEvaluationNotifications(eligiblePlayers, evaluationData);
        
        return evaluationData;
    }

    /**
     * Obtiene jugadores elegibles para evaluación
     */
    getEligiblePlayers(match) {
        const players = [];
        
        // Recopilar jugadores de ambos equipos
        if (match.teamA?.players) {
            match.teamA.players.forEach(player => {
                if (!player.isGuest) {
                    players.push({
                        ...player,
                        team: 'A',
                        teamName: match.teamA.name || 'Equipo A'
                    });
                }
            });
        }
        
        if (match.teamB?.players) {
            match.teamB.players.forEach(player => {
                if (!player.isGuest) {
                    players.push({
                        ...player,
                        team: 'B',
                        teamName: match.teamB.name || 'Equipo B'
                    });
                }
            });
        }
        
        return players;
    }

    /**
     * Genera asignaciones aleatorias de evaluación
     */
    generateEvaluationAssignments(players, match) {
        const assignments = {};
        
        players.forEach(player => {
            // Obtener compañeros del mismo equipo (excluyendo al jugador actual)
            const teammates = players.filter(p => 
                p.id !== player.id && 
                p.team === player.team
            );
            
            // Si hay suficientes compañeros, asignar 2 aleatorios
            if (teammates.length >= this.PLAYERS_TO_EVALUATE) {
                const selected = this.selectRandomPlayers(teammates, this.PLAYERS_TO_EVALUATE);
                assignments[player.id] = {
                    playerName: player.name,
                    toEvaluate: selected.map(p => {
                        const playerData = {
                            id: p.id,
                            name: p.name,
                            position: p.position || 'Jugador',
                            ovr: p.ovr || 70
                        };
                        // Solo agregar avatar si existe
                        if (p.avatar) {
                            playerData.avatar = p.avatar;
                        }
                        return playerData;
                    }),
                    completed: false,
                    evaluations: {}
                };
            }
        });
        
        return assignments;
    }

    /**
     * Selecciona jugadores aleatorios
     */
    selectRandomPlayers(players, count) {
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Guarda datos de evaluación en Firebase
     */
    async saveEvaluationData(evaluationData) {
        try {
            // Limpiar valores undefined/null para Firebase
            const cleanData = this.cleanDataForFirebase(evaluationData);
            
            const db = firebase.firestore();
            await db.collection('evaluations').doc(cleanData.matchId).set(cleanData);
            console.log('Evaluación guardada:', cleanData.matchId);
        } catch (error) {
            console.error('Error guardando evaluación:', error);
            console.error('Data that failed:', evaluationData);
            throw error;
        }
    }

    /**
     * Limpia datos para Firebase (elimina undefined/null)
     */
    cleanDataForFirebase(obj) {
        if (obj === null || obj === undefined) {
            return null;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanDataForFirebase(item));
        }
        
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const key in obj) {
                const value = obj[key];
                if (value !== undefined && value !== null) {
                    cleaned[key] = this.cleanDataForFirebase(value);
                }
            }
            return cleaned;
        }
        
        return obj;
    }

    /**
     * Envía notificaciones de evaluación pendiente
     */
    async sendEvaluationNotifications(players, evaluationData) {
        // Usar el sistema de notificaciones mejorado si está disponible
        if (window.notificationsSystem) {
            for (const player of players) {
                if (evaluationData.assignments[player.id]) {
                    const playersToEvaluate = evaluationData.assignments[player.id].toEvaluate;
                    const playerNames = playersToEvaluate.map(p => p.name).join(' y ');
                    
                    // Limpiar datos para evitar undefined en Firebase
                    const cleanPlayersData = playersToEvaluate.map(p => ({
                        id: p.id || '',
                        name: p.name || 'Jugador',
                        position: p.position || 'Jugador',
                        ovr: p.ovr || 70
                        // No incluir avatar si es undefined
                    }));
                    
                    await window.notificationsSystem.createNotification(
                        player.id,
                        'evaluation_pending',
                        '🎯 Evaluaciones Pendientes',
                        `Tienes que evaluar a <strong>${playerNames}</strong> del partido ${evaluationData.matchName}`,
                        { 
                            matchId: evaluationData.matchId,
                            matchName: evaluationData.matchName,
                            playersToEvaluate: cleanPlayersData
                        }
                    );
                }
            }
            
            // Crear actividad para el ticker
            await window.notificationsSystem.createActivity(
                'evaluations_pending',
                `📋 Se generaron evaluaciones para el partido <span>${evaluationData.matchName}</span>`
            );
            
            console.log(`Notificaciones de evaluación enviadas para ${players.length} jugadores`);
        } else {
            // Fallback al método anterior si el nuevo sistema no está disponible
            const notifications = [];
            
            players.forEach(player => {
                if (evaluationData.assignments[player.id]) {
                    notifications.push({
                        userId: player.id, // Cambiar playerId a userId
                        type: 'evaluation_pending',
                        title: '🎯 Evaluaciones Pendientes',
                        message: `Tienes 2 compañeros para evaluar del partido ${evaluationData.matchName}`,
                        data: { matchId: evaluationData.matchId },
                        read: false,
                        timestamp: Date.now(),
                        createdAt: new Date().toISOString()
                    });
                }
            });
            
            // Guardar notificaciones en Firebase
            const db = firebase.firestore();
            const batch = db.batch();
            
            notifications.forEach(notif => {
                const ref = db.collection('notifications').doc();
                batch.set(ref, notif);
            });
            
            await batch.commit();
            console.log(`${notifications.length} notificaciones enviadas (fallback)`);
        }
    }

    /**
     * Procesa una evaluación completada
     */
    async submitEvaluation(matchId, evaluatorId, evaluations) {
        try {
            const db = firebase.firestore();
            const evalDoc = await db.collection('evaluations').doc(matchId).get();
            
            if (!evalDoc.exists) {
                throw new Error('Evaluación no encontrada');
            }
            
            const evalData = evalDoc.data();
            
            // Validar que el evaluador tiene asignaciones pendientes
            if (!evalData.assignments[evaluatorId] || evalData.assignments[evaluatorId].completed) {
                throw new Error('No tienes evaluaciones pendientes para este partido');
            }
            
            // Guardar evaluaciones
            evalData.assignments[evaluatorId].completed = true;
            evalData.assignments[evaluatorId].evaluations = evaluations;
            evalData.assignments[evaluatorId].completedAt = Date.now();
            
            // Actualizar contador de completadas
            if (!evalData.completed[evaluatorId]) {
                evalData.completed[evaluatorId] = true;
            }
            
            // Calcular tasa de participación
            const totalAssignments = Object.keys(evalData.assignments).length;
            const completedCount = Object.keys(evalData.completed).length;
            evalData.participationRate = completedCount / totalAssignments;
            
            // Actualizar en Firebase
            await db.collection('evaluations').doc(matchId).update(evalData);
            
            // Verificar si se debe actualizar OVRs
            if (evalData.participationRate >= this.MIN_PARTICIPATION_RATE && !evalData.ovrUpdateTriggered) {
                await this.updatePlayerOVRs(evalData);
            }
            
            return {
                success: true,
                participationRate: evalData.participationRate,
                ovrUpdated: evalData.ovrUpdateTriggered
            };
            
        } catch (error) {
            console.error('Error procesando evaluación:', error);
            throw error;
        }
    }

    /**
     * Actualiza OVRs de jugadores basado en evaluaciones
     */
    async updatePlayerOVRs(evalData) {
        console.log('Actualizando OVRs con participación:', evalData.participationRate);
        
        // Recopilar todas las evaluaciones por jugador
        const playerRatings = {};
        
        Object.values(evalData.assignments).forEach(assignment => {
            if (assignment.completed && assignment.evaluations) {
                Object.entries(assignment.evaluations).forEach(([playerId, evaluation]) => {
                    if (!playerRatings[playerId]) {
                        playerRatings[playerId] = [];
                    }
                    playerRatings[playerId].push(evaluation.rating);
                });
            }
        });
        
        // Calcular nuevos OVRs
        const ovrUpdates = {};
        Object.entries(playerRatings).forEach(([playerId, ratings]) => {
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            // Convertir rating 1-10 a cambio de OVR
            const ovrChange = Math.round((avgRating - 5) * 2); // -8 a +10
            ovrUpdates[playerId] = ovrChange;
        });
        
        // Actualizar OVRs en Firebase
        const db = firebase.firestore();
        const batch = db.batch();
        
        for (const [playerId, ovrChange] of Object.entries(ovrUpdates)) {
            // Primero intentar en futbol_users (jugadores autenticados)
            let playerDoc = await db.collection('futbol_users').doc(playerId).get();
            let isAuthenticated = true;
            
            // Si no está en futbol_users, buscar en groups/groupId/players
            if (!playerDoc.exists && window.Storage && Storage.currentGroupId) {
                playerDoc = await db.collection('groups')
                    .doc(Storage.currentGroupId)
                    .collection('players')
                    .doc(playerId)
                    .get();
                isAuthenticated = false;
            }
            
            if (playerDoc.exists) {
                const playerData = playerDoc.data();
                const currentOVR = playerData.ovr || 70;
                const newOVR = Math.max(40, Math.min(99, currentOVR + ovrChange));
                
                batch.update(playerDoc.ref, {
                    ovr: newOVR,
                    lastOVRUpdate: Date.now(),
                    ovrHistory: firebase.firestore.FieldValue.arrayUnion({
                        date: Date.now(),
                        oldOVR: currentOVR,
                        newOVR: newOVR,
                        change: ovrChange,
                        matchId: evalData.matchId
                    })
                });
                
                console.log(`[OVR Update] ${isAuthenticated ? 'Auth' : 'Group'} player ${playerId}: ${currentOVR} → ${newOVR} (${ovrChange > 0 ? '+' : ''}${ovrChange})`);
                
                // Crear notificación para el jugador evaluado
                if (window.notificationsSystem) {
                    const playerName = playerData.displayName || playerData.name || 'Jugador';
                    const changeText = ovrChange > 0 ? `+${ovrChange}` : `${ovrChange}`;
                    
                    await window.notificationsSystem.createNotification(
                        playerId,
                        'ovr_change',
                        '⚡ Tu OVR ha sido actualizado',
                        `Has recibido evaluaciones del partido ${evalData.matchName}. Tu OVR cambió <strong>${changeText}</strong> (${currentOVR} → ${newOVR})`,
                        { 
                            matchId: evalData.matchId,
                            oldOVR: currentOVR,
                            newOVR: newOVR,
                            change: ovrChange
                        }
                    );
                    
                    // Crear actividad para el ticker
                    await window.notificationsSystem.createActivity(
                        'ovr_update',
                        `📈 <span>${playerName}</span> ${ovrChange > 0 ? 'subió' : 'bajó'} a ${newOVR} OVR`
                    );
                }
            } else {
                console.warn(`[OVR Update] Player ${playerId} not found in any collection`);
            }
        }
        
        // Marcar OVR como actualizado
        batch.update(db.collection('evaluations').doc(evalData.matchId), {
            ovrUpdateTriggered: true,
            ovrUpdatedAt: Date.now(),
            ovrUpdates: ovrUpdates
        });
        
        await batch.commit();
        console.log('OVRs actualizados:', ovrUpdates);
    }

    /**
     * Obtiene evaluaciones pendientes para un jugador
     */
    async getPendingEvaluations(playerId) {
        try {
            const db = firebase.firestore();
            const evaluations = await db.collection('evaluations')
                .where('status', '==', 'pending')
                .where(`assignments.${playerId}.completed`, '==', false)
                .orderBy('createdAt', 'desc')
                .get();
            
            const pending = [];
            evaluations.forEach(doc => {
                const data = doc.data();
                if (data.assignments[playerId] && !data.assignments[playerId].completed) {
                    pending.push({
                        matchId: doc.id,
                        matchName: data.matchName,
                        matchDate: data.matchDate,
                        deadline: data.deadline,
                        playersToEvaluate: data.assignments[playerId].toEvaluate,
                        participationRate: data.participationRate
                    });
                }
            });
            
            return pending;
        } catch (error) {
            console.error('Error obteniendo evaluaciones pendientes:', error);
            return [];
        }
    }

    /**
     * Obtiene historial de evaluaciones completadas
     */
    async getCompletedEvaluations(playerId) {
        try {
            const db = firebase.firestore();
            const evaluations = await db.collection('evaluations')
                .where(`assignments.${playerId}.completed`, '==', true)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            const completed = [];
            evaluations.forEach(doc => {
                const data = doc.data();
                if (data.assignments[playerId]?.completed) {
                    completed.push({
                        matchId: doc.id,
                        matchName: data.matchName,
                        matchDate: data.matchDate,
                        completedAt: data.assignments[playerId].completedAt,
                        evaluations: data.assignments[playerId].evaluations,
                        ovrUpdated: data.ovrUpdateTriggered
                    });
                }
            });
            
            return completed;
        } catch (error) {
            console.error('Error obteniendo evaluaciones completadas:', error);
            return [];
        }
    }

    /**
     * Limpia evaluaciones expiradas
     */
    async cleanupExpiredEvaluations() {
        try {
            const db = firebase.firestore();
            const now = Date.now();
            
            const expired = await db.collection('evaluations')
                .where('deadline', '<', now)
                .where('status', '==', 'pending')
                .get();
            
            const batch = db.batch();
            expired.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'expired',
                    expiredAt: now
                });
            });
            
            await batch.commit();
            console.log(`${expired.size} evaluaciones expiradas`);
        } catch (error) {
            console.error('Error limpiando evaluaciones expiradas:', error);
        }
    }
}

// Exportar instancia única
const unifiedEvaluationSystem = new UnifiedEvaluationSystem();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.UnifiedEvaluationSystem = unifiedEvaluationSystem;
}