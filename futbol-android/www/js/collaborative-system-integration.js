/**
 * Integración del Sistema Colaborativo con Evaluaciones Unificadas
 * Extiende el sistema colaborativo existente para usar el nuevo sistema de evaluaciones
 */

// Extender el CollaborativeSystem existente
if (typeof CollaborativeSystem !== 'undefined') {
    console.log('🔧 Integrando sistema de evaluaciones unificadas con sistema colaborativo...');
    
    /**
     * Finalizar partido colaborativo y activar evaluaciones automáticas
     */
    CollaborativeSystem.prototype.finalizeMatch = async function(matchId) {
        console.log('🏁 Finalizando partido colaborativo:', matchId);
        
        const match = this.getMatch(matchId);
        if (!match) {
            console.error('❌ Partido no encontrado:', matchId);
            return false;
        }
        
        // Verificar permisos (solo organizador o después de X horas)
        const currentUserId = this.state.currentUser?.uid;
        const isOrganizer = this.isUserOrganizer(match, currentUserId);
        const matchTime = new Date(match.date + ' ' + match.time);
        const hoursAfterMatch = (Date.now() - matchTime.getTime()) / (1000 * 60 * 60);
        
        if (!isOrganizer && hoursAfterMatch < 2) {
            alert('⚠️ Solo el organizador puede finalizar el partido, o espera 2 horas después del partido');
            return false;
        }
        
        try {
            // Actualizar estado del partido
            match.status = 'completed';
            match.completedAt = Date.now();
            
            // Guardar en Firebase
            if (typeof db !== 'undefined' && db) {
                await db.collection('collaborative_matches')
                    .doc(matchId)
                    .update({
                        status: 'completed',
                        completedAt: match.completedAt
                    });
            }
            
            // Inicializar evaluaciones automáticas
            if (window.UnifiedEvaluationSystem) {
                const evalData = await window.UnifiedEvaluationSystem.initializeEvaluations(match, 'collaborative');
                
                if (evalData) {
                    console.log('✅ Evaluaciones creadas para partido colaborativo');
                    
                    // Mostrar notificación
                    if (typeof UI !== 'undefined' && UI.showNotification) {
                        UI.showNotification(
                            '🎯 Partido finalizado. Se han enviado evaluaciones a todos los jugadores.',
                            'success'
                        );
                    } else {
                        alert('✅ Partido finalizado. Evaluaciones enviadas a todos los jugadores.');
                    }
                }
            }
            
            // Actualizar UI
            this.renderUI();
            return true;
            
        } catch (error) {
            console.error('❌ Error finalizando partido:', error);
            alert('Error al finalizar el partido: ' + error.message);
            return false;
        }
    };
    
    /**
     * Renderizar botón de finalizar en partidos colaborativos
     */
    const originalRenderMatch = CollaborativeSystem.prototype.renderSingleMatch;
    CollaborativeSystem.prototype.renderSingleMatch = function(match) {
        const baseHTML = originalRenderMatch ? originalRenderMatch.call(this, match) : '';
        
        // Si el partido está lleno y tiene equipos, agregar botón de finalizar
        if (match.status === 'full' && match.teams) {
            const currentUserId = this.state.currentUser?.uid;
            const isOrganizer = this.isUserOrganizer(match, currentUserId);
            const matchTime = new Date(match.date + ' ' + match.time);
            const isPastMatch = Date.now() > matchTime.getTime();
            
            if ((isOrganizer || isPastMatch) && match.status !== 'completed') {
                const finalizeButton = `
                    <button onclick="collaborativeSystem.finalizeMatch('${match.id}')" style="
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-top: 10px;
                        width: 100%;
                    ">
                        🏁 Finalizar Partido y Enviar Evaluaciones
                    </button>
                `;
                
                // Insertar el botón antes del cierre del div principal
                return baseHTML.replace('</div></div>$', finalizeButton + '</div></div>');
            }
        }
        
        return baseHTML;
    };
    
    console.log('✅ Sistema colaborativo integrado con evaluaciones unificadas');
}

/**
 * Auto-finalización de partidos colaborativos
 * Se ejecuta automáticamente 2 horas después del horario del partido
 */
async function autoFinalizeCollaborativeMatches() {
    console.log('🤖 Verificando partidos para auto-finalización...');
    
    if (typeof db === 'undefined' || !db) {
        console.log('⚠️ Firebase no disponible');
        return;
    }
    
    try {
        // Obtener partidos colaborativos no finalizados
        const snapshot = await db.collection('collaborative_matches')
            .where('status', '==', 'full')
            .get();
        
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;
        
        for (const doc of snapshot.docs) {
            const match = { id: doc.id, ...doc.data() };
            const matchTime = new Date(match.date + ' ' + match.time).getTime();
            
            // Si han pasado más de 2 horas desde el partido
            if (now - matchTime > twoHours && match.status !== 'completed') {
                console.log(`🤖 Auto-finalizando partido: ${match.title}`);
                
                // Actualizar estado
                await db.collection('collaborative_matches')
                    .doc(doc.id)
                    .update({
                        status: 'completed',
                        completedAt: now,
                        autoFinalized: true
                    });
                
                // Inicializar evaluaciones
                if (window.UnifiedEvaluationSystem) {
                    await window.UnifiedEvaluationSystem.initializeEvaluations(match, 'collaborative');
                }
            }
        }
        
        console.log('✅ Verificación de auto-finalización completada');
        
    } catch (error) {
        console.error('❌ Error en auto-finalización:', error);
    }
}

// Ejecutar auto-finalización cada 30 minutos
if (typeof window !== 'undefined') {
    setInterval(autoFinalizeCollaborativeMatches, 30 * 60 * 1000);
    
    // Ejecutar una vez al cargar
    setTimeout(autoFinalizeCollaborativeMatches, 5000);
}