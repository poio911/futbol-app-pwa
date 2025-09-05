/**
 * UI de Evaluaciones Unificada
 * Maneja la interfaz de evaluaciones pendientes y completadas
 */

// Función helper para obtener nombres legibles de evaluadores
function getEvaluatorName(evaluatorId) {
    try {
        // Intentar buscar el nombre real del usuario/jugador
        if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid === evaluatorId) {
            return TestApp.currentUser.displayName || TestApp.currentUser.email.split('@')[0];
        }
        
        // Buscar en jugadores manuales
        if (window.Storage) {
            const players = Storage.getPlayers();
            const player = players.find(p => p.id === evaluatorId || p.uid === evaluatorId);
            if (player) {
                return player.name;
            }
        }
        
        // Buscar en usuarios autenticados (si existe la función)
        if (window.collaborativeSystem && collaborativeSystem.state && collaborativeSystem.state.authenticatedUsers) {
            const user = collaborativeSystem.state.authenticatedUsers.get(evaluatorId);
            if (user) {
                return user.displayName || user.email.split('@')[0];
            }
        }
        
        // Si es un ID largo, generar nombre legible como fallback
        if (evaluatorId && typeof evaluatorId === 'string' && evaluatorId.length > 15) {
            const shortId = evaluatorId.slice(-8);
            return `Jugador ${shortId}`;
        }
        
        // Si ya es un nombre corto o legible, devolverlo tal cual
        return evaluatorId || 'Usuario';
    } catch (error) {
        console.warn('Error obteniendo nombre de evaluador:', error);
        return evaluatorId || 'Usuario';
    }
}

class EvaluationUI {
    constructor() {
        this.currentEvaluation = null;
        this.currentPlayerIndex = 0;
        this.evaluationMode = 'labels'; // 'labels' o 'simple'
        this.selectedTags = []; // Para tracking de etiquetas seleccionadas (max 3)
        
        // Traducciones de atributos
        this.attributeTranslations = {
            pac: 'VELOCIDAD',
            sho: 'TIRO', 
            pas: 'PASES',
            dri: 'REGATE',
            def: 'DEFENSA',
            phy: 'FÍSICO'
        };

        // Etiquetas con humor, doble sentido y tooltips
        this.performanceTags = {
            // Con doble sentido/humor
            la_pone_donde_quiere: { 
                icon: '🎯', 
                label: 'La pone donde quiere', 
                points: { pas: 3, dri: 2 },
                tooltip: 'Gran precisión en los pases... la pelota, obvio'
            },
            baila_solo: { 
                icon: '🕺', 
                label: 'Baila solo', 
                points: { dri: 3, pac: 1 },
                tooltip: 'Tan bueno que no necesita compañía para gambetear'
            },
            manos_de_manteca: { 
                icon: '🧈', 
                label: 'Manos de manteca', 
                points: { dri: -3, phy: 1 },
                tooltip: 'Se le escapa hasta el shampoo en la ducha'
            },
            billetera: { 
                icon: '💳', 
                label: 'Billetera', 
                points: { pas: 2, dri: 2 },
                tooltip: 'Siempre saca y asiste... como cuando paga el asado'
            },
            
            // Referencias a jugadores con humor
            modo_suarez: { 
                icon: '🧛', 
                label: 'Modo Suárez', 
                points: { sho: 3, phy: 2 },
                tooltip: 'Goleador nato con tendencia a morder'
            },
            el_chiqui_tapia: { 
                icon: '👔', 
                label: 'El Chiqui Tapia', 
                points: { pas: 3, def: -2 },
                tooltip: 'Maneja el partido desde arriba... literalmente'
            },
            rusito_recoba: { 
                icon: '🚀', 
                label: 'Rusito Recoba', 
                points: { sho: 3, dri: 2 },
                tooltip: 'Pega desde cualquier lado sin miedo'
            },
            
            // Clásicos con twist
            pecho_frio_higuain: { 
                icon: '🧊', 
                label: 'Pecho frío nivel Higuaín', 
                points: { sho: -3, pas: 1 },
                tooltip: 'En los momentos importantes... mejor no'
            },
            arquitecto: { 
                icon: '🏗️', 
                label: 'Arquitecto', 
                points: { pas: 3, dri: 1 },
                tooltip: 'Construye jugadas mejor que el estadio del Wanderers'
            },
            el_del_asado: { 
                icon: '🥩', 
                label: 'El del asado', 
                points: { pas: 2, phy: 1 },
                tooltip: 'Une al equipo... con choripanes'
            },
            
            // Creativos con humor moderno
            netflix: { 
                icon: '📺', 
                label: 'Netflix', 
                points: { dri: -2, pas: 1 },
                tooltip: 'Se la pasa mirando series... de jugadas del rival'
            },
            wifi_del_vecino: { 
                icon: '📶', 
                label: 'WiFi del vecino', 
                points: { pas: 2, pac: -1 },
                tooltip: 'A veces anda, a veces no'
            },
            uber: { 
                icon: '🚗', 
                label: 'Uber', 
                points: { pac: 3, sho: 1 },
                tooltip: 'Siempre llega justo a tiempo al área'
            },
            tinder: { 
                icon: '💕', 
                label: 'Tinder', 
                points: { sho: 3, def: -1 },
                tooltip: 'Define rápido pero no se queda mucho'
            },
            
            // Uruguayos posta
            mate_amargo: { 
                icon: '🧉', 
                label: 'Mate amargo', 
                points: { phy: 2, def: 2 },
                tooltip: 'Fuerte y sin azúcar, como debe ser'
            },
            peñarol_nacional: { 
                icon: '💛', 
                label: 'Peñarol/Nacional', 
                points: { phy: 3, dri: -1 },
                tooltip: 'Depende del cuadro que seas'
            },
            playa_pocitos: { 
                icon: '🏖️', 
                label: 'Playa Pocitos', 
                points: { pas: 2, phy: -1 },
                tooltip: 'Fino pero le falta calle'
            },
            
            // Más humor futbolero
            var_amigo: { 
                icon: '📹', 
                label: 'VAR amigo', 
                points: { def: -2, pas: 3 },
                tooltip: 'El VAR siempre lo favorece... sospechoso'
            },
            tarjeta_amarilla: { 
                icon: '🟨', 
                label: 'Coleccionista', 
                points: { def: 3, phy: 2 },
                tooltip: 'Colecciona amarillas como figuritas'
            },
            offside_eterno: { 
                icon: '🚩', 
                label: 'Offside eterno', 
                points: { sho: 2, pac: -2 },
                tooltip: 'Siempre adelantado... hasta en la fila del súper'
            },
            
            // Clásicos del barrio
            picado_de_domingo: { 
                icon: '⚽', 
                label: 'Picado de domingo', 
                points: { dri: 2, phy: 1 },
                tooltip: 'Juega mejor con resaca que sobrio'
            },
            amague_fatal: { 
                icon: '🔄', 
                label: 'Amague fatal', 
                points: { dri: 3, pac: 1 },
                tooltip: 'Amaga tanto que se marea él mismo'
            },
            caño_maestro: { 
                icon: '🎩', 
                label: 'Caño maestro', 
                points: { dri: 3, pas: 1 },
                tooltip: 'Especialista en humillar rivales'
            },
            
            // Más creativos
            whatsapp: { 
                icon: '📱', 
                label: 'WhatsApp', 
                points: { pas: 3, pac: -1 },
                tooltip: 'Siempre conectado con los compañeros'
            },
            instagram: { 
                icon: '📸', 
                label: 'Instagram', 
                points: { dri: 2, sho: -1 },
                tooltip: 'Más preocupado por la foto que por el gol'
            },
            tiktok: { 
                icon: '🎵', 
                label: 'TikTok', 
                points: { dri: 3, def: -2 },
                tooltip: 'Bailes increíbles, defensa cuestionable'
            },
            mercadolibre: { 
                icon: '📦', 
                label: 'MercadoLibre', 
                points: { pas: 2, sho: 2 },
                tooltip: 'Entrega garantizada al área'
            },
            spotify: { 
                icon: '🎧', 
                label: 'Spotify', 
                points: { pac: 2, dri: 2 },
                tooltip: 'Siempre con ritmo'
            },

            // HUMOR NEGRO - Muerte y Desastres
            titanic: {
                icon: '🚢',
                label: 'Titanic',
                points: { sho: -2, def: 2 },
                tooltip: 'Se hunde cuando más se lo necesita'
            },
            torre_gemelas: {
                icon: '🏢',
                label: 'Torres Gemelas',
                points: { phy: -2, def: -1 },
                tooltip: 'Colapsa bajo presión'
            },
            chernobyl: {
                icon: '☢️',
                label: 'Chernóbyl',
                points: { pas: -2, sho: 2 },
                tooltip: 'Tóxico para los compañeros'
            },
            pompeia: {
                icon: '🌋',
                label: 'Pompeya',
                points: { pac: -2, dri: -2 },
                tooltip: 'Queda petrificado en momentos clave'
            },
            hindenburg: {
                icon: '🎈',
                label: 'Hindenburg',
                points: { sho: 3, def: -2 },
                tooltip: 'Explota cuando menos esperas'
            },
            costa_concordia: {
                icon: '⛵',
                label: 'Costa Concordia',
                points: { pas: -2, dri: -2 },
                tooltip: 'Se va a la deriva'
            },

            // HUMOR NEGRO - Médico Macabro
            cancer_terminal: {
                icon: '🏥',
                label: 'Cáncer terminal',
                points: { pac: -2, sho: -2, pas: -2, dri: -2, def: -2, phy: -2 },
                tooltip: 'Se lo come desde adentro'
            },
            transplante_negro: {
                icon: '🫀',
                label: 'Transplante negro',
                points: { phy: 3, pas: -2 },
                tooltip: 'Le roba vida a otros'
            },
            eutanasia: {
                icon: '💊',
                label: 'Eutanasia',
                points: { sho: 3, phy: -2 },
                tooltip: 'Acaba con el sufrimiento rápido'
            },
            morgue: {
                icon: '⚰️',
                label: 'Morgue',
                points: { def: 3, pac: -2 },
                tooltip: 'Frío como un muerto'
            },
            autopsia: {
                icon: '🔪',
                label: 'Autopsia',
                points: { pas: 3, sho: -2 },
                tooltip: 'Analiza todo cuando ya es tarde'
            },
            coma_inducido: {
                icon: '😴',
                label: 'Coma inducido',
                points: { dri: -2, pac: -2 },
                tooltip: 'Desconectado de la realidad'
            },

            // HUMOR NEGRO - Catástrofes
            hiroshima: {
                icon: '☢️',
                label: 'Hiroshima',
                points: { sho: 3, phy: 3 },
                tooltip: 'Arrasa con todo a su paso'
            },
            tsunami: {
                icon: '🌊',
                label: 'Tsunami',
                points: { pac: -2, phy: 3 },
                tooltip: 'Viene lento pero destruye todo'
            },
            terremoto_haiti: {
                icon: '🌍',
                label: 'Terremoto Haití',
                points: { def: 3, dri: -2 },
                tooltip: 'Deja todo por el suelo'
            },
            incendio_amazonia: {
                icon: '🔥',
                label: 'Incendio Amazonía',
                points: { sho: 3, pas: -2 },
                tooltip: 'Quema todo lo verde'
            },
            tornado: {
                icon: '🌪️',
                label: 'Tornado',
                points: { dri: 3, pas: -2 },
                tooltip: 'Da vueltas sin sentido'
            },

            // HUMOR NEGRO - Guerra y Violencia
            francotirador: {
                icon: '🎯',
                label: 'Francotirador',
                points: { sho: 3, pac: -2 },
                tooltip: 'Una bala, un muerto'
            },
            kamikaze: {
                icon: '✈️',
                label: 'Kamikaze',
                points: { phy: 3, def: -2 },
                tooltip: 'Se sacrifica por el equipo'
            },
            gas_mostaza: {
                icon: '☁️',
                label: 'Gas mostaza',
                points: { def: 3, pas: -2 },
                tooltip: 'Tóxico y letal'
            },
            genocidio: {
                icon: '💀',
                label: 'Genocidio',
                points: { def: 3, phy: 2 },
                tooltip: 'Elimina todo lo que toca'
            },
            vietnam: {
                icon: '🌿',
                label: 'Vietnam',
                points: { pac: -2, def: 3 },
                tooltip: 'Trauma que nunca se va'
            },

            // HUMOR NEGRO - Criminal
            pablo_escobar: {
                icon: '💰',
                label: 'Pablo Escobar',
                points: { sho: 3, phy: 2 },
                tooltip: 'Plata o plomo'
            },
            chapo_guzman: {
                icon: '🕳️',
                label: 'Chapo Guzmán',
                points: { dri: 3, pac: 2 },
                tooltip: 'Siempre encuentra la salida'
            },
            charles_manson: {
                icon: '🔪',
                label: 'Charles Manson',
                points: { pas: 3, def: -2 },
                tooltip: 'Manipula a los demás'
            },
            ted_bundy: {
                icon: '🎭',
                label: 'Ted Bundy',
                points: { dri: 3, phy: -2 },
                tooltip: 'Cara de bueno, alma de diablo'
            },
            jack_destripador: {
                icon: '🔪',
                label: 'Jack el Destripador',
                points: { sho: 3, pas: -2 },
                tooltip: 'Corta limpio y rápido'
            },
            dahmer: {
                icon: '🍽️',
                label: 'Dahmer',
                points: { phy: 3, pas: -2 },
                tooltip: 'Se come a la competencia'
            },

            // HUMOR NEGRO - Desastres Históricos
            edad_media: {
                icon: '⚔️',
                label: 'Edad Media',
                points: { dri: -3, def: 2 },
                tooltip: 'Retrocede 500 años'
            },
            peste_negra: {
                icon: '🐀',
                label: 'Peste Negra',
                points: { pac: -2, pas: -2 },
                tooltip: 'Contagia la mala suerte'
            },
            inquisicion: {
                icon: '🔥',
                label: 'Inquisición',
                points: { def: 3, dri: -2 },
                tooltip: 'Quema todo lo diferente'
            },
            esclavitud: {
                icon: '⛓️',
                label: 'Esclavitud',
                points: { phy: 3, pas: -2 },
                tooltip: 'Trabaja gratis y sin quejas'
            },
            gulag: {
                icon: '🏔️',
                label: 'Gulag',
                points: { phy: 3, pac: -2 },
                tooltip: 'Resiste en condiciones extremas'
            },

            // HUMOR NEGRO - Drogas Duras
            fentanilo: {
                icon: '💉',
                label: 'Fentanilo',
                points: { sho: 3, phy: -3 },
                tooltip: 'Una dosis y chau'
            },
            krokodil: {
                icon: '🦎',
                label: 'Krokodil',
                points: { phy: -3, pac: -2 },
                tooltip: 'Te come desde adentro'
            },
            metanfetamina: {
                icon: '⚡',
                label: 'Metanfetamina',
                points: { pac: 3, phy: -3 },
                tooltip: 'Rápido pero te destruye'
            },
            heroina: {
                icon: '💉',
                label: 'Heroína',
                points: { dri: 3, def: -3 },
                tooltip: 'Te eleva y te mata'
            },
            cocaina_boliviana: {
                icon: '❄️',
                label: 'Cocaína Boliviana',
                points: { pac: 3, pas: -2 },
                tooltip: 'Energía pura y destructiva'
            },

            // HUMOR NEGRO - Freaks y Terror
            payaso_it: {
                icon: '🤡',
                label: 'Payaso IT',
                points: { dri: 3, pas: -2 },
                tooltip: 'Da miedo pero entretiene'
            },
            chucky: {
                icon: '🔪',
                label: 'Chucky',
                points: { sho: 3, phy: -2 },
                tooltip: 'Pequeño pero letal'
            },
            annabelle: {
                icon: '👻',
                label: 'Annabelle',
                points: { dri: 3, def: -2 },
                tooltip: 'Poseído por el demonio'
            },
            slender_man: {
                icon: '👤',
                label: 'Slender Man',
                points: { pac: 3, sho: -2 },
                tooltip: 'Alto, flaco y terrorífico'
            }
        };
    }

    /**
     * Obtiene etiquetas aleatorias para mostrar
     */
    getRandomTags(count = 12) {
        const allTagKeys = Object.keys(this.performanceTags);
        const shuffled = allTagKeys.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Renderiza la sección principal de evaluaciones
     */
    async renderEvaluationsSection() {
        console.log('🔥 [EvaluationUI] renderEvaluationsSection called!');
        const container = document.getElementById('evaluations-section');
        if (!container) {
            console.error('❌ [EvaluationUI] Container evaluations-section not found!');
            return;
        }
        console.log('✅ [EvaluationUI] Container found, proceeding...');

        // Try to get current player ID from multiple sources
        let currentPlayerId = null;
        
        // Get current user from TestApp (the method that was working)
        if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid) {
            currentPlayerId = TestApp.currentUser.uid;
            console.log(`[EvaluationUI] Current user: ${currentPlayerId}`);
        }
        
        if (!currentPlayerId) {
            container.innerHTML = `
                <div class="evaluations-container">
                    <div class="evaluations-header">
                        <h2>📊 Evaluaciones</h2>
                        <p style="color: #ff6b6b;">Error: Usuario no encontrado</p>
                    </div>
                </div>
            `;
            return;
        }

        // Load matches directly from Firebase (like TestApp does)
        let matches = [];
        
        if (window.firebase && firebase.firestore) {
            try {
                console.log(`[EvaluationUI] Loading matches from futbol_matches collection...`);
                const db = firebase.firestore();
                
                const snapshot = await db.collection('futbol_matches')
                    .orderBy('createdAt', 'desc')
                    .get();
                
                if (!snapshot.empty) {
                    snapshot.forEach(doc => {
                        const matchData = doc.data();
                        matchData.id = matchData.id || doc.id;
                        matches.push(matchData);
                    });
                    console.log(`[EvaluationUI] Found ${matches.length} matches in futbol_matches collection`);
                } else {
                    console.log(`[EvaluationUI] No matches found in futbol_matches collection`);
                }
            } catch (firebaseError) {
                console.error('[EvaluationUI] Firebase error loading matches:', firebaseError);
                // Fallback to Storage as backup
                console.log('[EvaluationUI] Falling back to Storage.getMatches()');
                matches = Storage.getMatches() || [];
            }
        } else {
            console.log('[EvaluationUI] Firebase not available, using Storage');
            matches = Storage.getMatches() || [];
        }
        
        console.log(`[EvaluationUI] Total matches loaded: ${matches.length}`);
        
        const basicEvaluations = matches.filter(m => m.status === 'finished' || m.status === 'completed').map(match => ({
            matchId: match.id,
            matchName: match.name || `${match.teamA?.name || 'Equipo A'} vs ${match.teamB?.name || 'Equipo B'}`,
            matchDate: match.date,
            assignments: match.evaluationAssignments || {},
            status: 'pending', // Default status
            teamA: match.teamA || { name: 'Equipo A', players: [] },
            teamB: match.teamB || { name: 'Equipo B', players: [] }
        }));

        // Try to enrich with Firebase data if available
        const evaluations = basicEvaluations;
        
        // Check Firebase for more complete evaluation data
        if (window.firebase && firebase.firestore) {
            try {
                const db = firebase.firestore();
                for (const evaluation of evaluations) {
                    try {
                        const evalDoc = await db.collection('evaluations').doc(evaluation.matchId).get();
                        if (evalDoc.exists) {
                            const firebaseData = evalDoc.data();
                            // Merge Firebase assignments with local data
                            evaluation.assignments = firebaseData.assignments || evaluation.assignments;
                            evaluation.status = firebaseData.status || evaluation.status;
                            console.log(`[EvaluationUI] Enriched ${evaluation.matchId} with Firebase data`);
                        }
                    } catch (evalError) {
                        console.log(`[EvaluationUI] Could not load Firebase data for ${evaluation.matchId}:`, evalError.message);
                    }
                }
            } catch (firebaseError) {
                console.log('[EvaluationUI] Firebase not available for enrichment:', firebaseError.message);
            }
        }
        
        console.log(`[EvaluationUI] Found evaluations:`, evaluations.length);
        return this.renderTestModeWithEvaluation(container, evaluations);
    }

    /**
     * Renderiza evaluaciones pendientes
     */
    renderPendingEvaluations(evaluations) {
        if (evaluations.length === 0) {
            return `
                <div class="no-evaluations">
                    <i class='bx bx-check-circle'></i>
                    <p>No tienes evaluaciones pendientes</p>
                </div>
            `;
        }

        const cards = evaluations.map(evaluation => {
            const deadline = new Date(evaluation.deadline);
            const now = new Date();
            const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
            const urgentClass = hoursLeft < 24 ? 'urgent' : '';

            return `
                <div class="evaluation-card pending ${urgentClass}" data-match-id="${evaluation.matchId}">
                    <div class="eval-card-header">
                        <h3>${evaluation.matchName}</h3>
                        <span class="eval-date">${new Date(evaluation.matchDate).toLocaleDateString()}</span>
                    </div>
                    <div class="eval-card-body">
                        <div class="players-to-evaluate">
                            <p>Evaluar a ${evaluation.playersToEvaluate.length} compañeros:</p>
                            <div class="player-badges">
                                ${evaluation.playersToEvaluate.map(p => `
                                    <span class="player-badge">
                                        ${p.avatar ? `<img src="${p.avatar}" alt="${p.name}">` : '👤'}
                                        ${p.name}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="eval-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${evaluation.participationRate * 100}%"></div>
                            </div>
                            <span class="progress-text">${Math.round(evaluation.participationRate * 100)}% completado</span>
                        </div>
                        <div class="eval-deadline ${urgentClass}">
                            <i class='bx bx-time'></i>
                            ${hoursLeft > 0 ? `${hoursLeft} horas restantes` : 'Expira pronto'}
                        </div>
                    </div>
                    <div class="eval-card-actions">
                        <button class="btn btn-primary start-evaluation-btn" data-match-id="${evaluation.matchId}">
                            Comenzar Evaluación
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="evaluations-section">
                <h3>⏳ Evaluaciones Pendientes</h3>
                <div class="evaluations-grid">
                    ${cards}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza evaluaciones completadas
     */
    renderCompletedEvaluations(evaluations) {
        if (evaluations.length === 0) {
            return '';
        }

        const cards = evaluations.map(evaluation => `
            <div class="evaluation-card completed">
                <div class="eval-card-header">
                    <h3>${evaluation.matchName}</h3>
                    <span class="eval-date">${new Date(evaluation.matchDate).toLocaleDateString()}</span>
                </div>
                <div class="eval-card-body">
                    <div class="completion-info">
                        <i class='bx bx-check-circle'></i>
                        <span>Completado el ${new Date(evaluation.completedAt).toLocaleDateString()}</span>
                    </div>
                    ${evaluation.ovrUpdated ? `
                        <div class="ovr-update-info">
                            <i class='bx bx-trending-up'></i>
                            <span>OVRs actualizados</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="evaluations-section">
                <h3>✅ Evaluaciones Completadas</h3>
                <div class="evaluations-grid">
                    ${cards}
                </div>
            </div>
        `;
    }

    /**
     * Verifica si puede evaluar y abre modal o muestra mensaje
     */
    async checkAndEvaluate(matchId) {
        // Obtener ID del usuario actual - usar TestApp.currentUser directamente
        let currentPlayerId = null;
        
        if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid) {
            currentPlayerId = TestApp.currentUser.uid;
            console.log('[EvaluationUI] Using TestApp.currentUser.uid:', currentPlayerId);
        } else {
            console.error('[EvaluationUI] TestApp.currentUser.uid not available');
        }
        
        const canEvaluate = await this.hasUserPendingEvaluations(matchId, currentPlayerId);
        
        if (!canEvaluate) {
            UI.showNotification('✅ Ya has completado la evaluación de este partido', 'info');
            // Actualizar el botón para mostrar estado completado
            const button = document.getElementById(`eval-btn-${matchId}`);
            if (button) {
                button.innerHTML = '✅ Evaluación Completada';
                button.style.background = '#666';
                button.style.color = '#ccc';
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = 'none';
                button.onclick = null;
            }
            return;
        }
        
        this.startTestEvaluation(matchId);
    }

    /**
     * Abre el modal de evaluación
     */
    async openEvaluationModal(matchId) {
        // Obtener ID del jugador actual de múltiples fuentes
        let currentPlayerId = null;
        
        // Method 1: Try AuthSystem current user  
        if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid) {
            currentPlayerId = TestApp.currentUser.uid;
        }
        // Method 2: Try CollaborativeSystem current user
        else if (window.collaborativeSystem && collaborativeSystem.state && collaborativeSystem.state.currentUser && collaborativeSystem.state.currentUser.uid) {
            currentPlayerId = collaborativeSystem.state.currentUser.uid;
        }
        // Method 3: Try Storage as fallback
        else if (window.Storage && Storage.getCurrentPerson) {
            const currentPlayer = Storage.getCurrentPerson();
            currentPlayerId = currentPlayer ? currentPlayer.id : null;
        }
        const evalData = await this.getEvaluationData(matchId, currentPlayerId);
        
        if (!evalData) {
            UI.showNotification('No se pudo cargar la evaluación', 'error');
            return;
        }

        this.currentEvaluation = evalData;
        this.currentPlayerIndex = 0;
        
        this.showEvaluationModal();
    }

    /**
     * Muestra el modal de evaluación
     */
    showEvaluationModal() {
        // Limpiar etiquetas seleccionadas para cada nuevo jugador
        this.selectedTags = [];
        
        const modal = document.getElementById('evaluation-modal') || this.createEvaluationModal();
        
        const player = this.currentEvaluation.playersToEvaluate[this.currentPlayerIndex];
        const progress = ((this.currentPlayerIndex + 1) / this.currentEvaluation.playersToEvaluate.length) * 100;

        modal.innerHTML = `
            <div class="eval-modal-content">
                <!-- HEADER -->
                <div class="eval-header">
                    <div class="eval-header-content">
                        <h2 class="eval-title">Evaluación</h2>
                        <button class="eval-close-btn" onclick="evaluationUI.closeModal()">✕</button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="eval-body">
                    <!-- Info del Jugador -->
                    <div class="eval-player-card">
                        <div class="eval-player-avatar">
                            ${player.avatar ? `<img src="${player.avatar}" style="width: 100%; height: 100%; border-radius: 50%;">` : '⚽'}
                        </div>
                        <div class="eval-player-info">
                            <h3 class="eval-player-name">${player.name}</h3>
                            <div class="eval-player-details">
                                <span class="eval-player-position">${player.position || 'Jugador'}</span>
                                <span class="eval-player-ovr">OVR ${player.ovr || 70}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Selector de Modo -->
                    <div class="eval-mode-selector">
                        <button class="eval-mode-btn ${this.evaluationMode === 'labels' ? 'active' : ''}" 
                                onclick="evaluationUI.switchMode('labels')">
                            <span>🏷️</span>
                            <span>Por Etiquetas</span>
                        </button>
                        <button class="eval-mode-btn ${this.evaluationMode === 'simple' ? 'active' : ''}" 
                                onclick="evaluationUI.switchMode('simple')">
                            <span>⭐</span>
                            <span>Por Puntos</span>
                        </button>
                    </div>

                    <!-- Formulario de Evaluación -->
                    <div class="evaluation-form">
                        ${this.evaluationMode === 'labels' ? this.renderLabelsForm() : this.renderSimpleForm()}
                    </div>
                </div>

                <!-- FOOTER -->
                <div class="eval-footer">
                    <div class="eval-progress">
                        <span>Jugador ${this.currentPlayerIndex + 1}/${this.currentEvaluation.playersToEvaluate.length}</span>
                        <div class="eval-progress-bar">
                            <div class="eval-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="eval-actions">
                        <button class="eval-btn eval-btn-secondary" onclick="evaluationUI.skipPlayer()">
                            Omitir
                        </button>
                        <button class="eval-btn eval-btn-primary" onclick="evaluationUI.submitPlayerEvaluation()">
                            ${this.currentPlayerIndex < this.currentEvaluation.playersToEvaluate.length - 1 ? 'Siguiente →' : 'Finalizar'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Renderiza formulario por etiquetas
     */
    renderLabelsForm() {
        const currentPlayer = this.currentEvaluation.playersToEvaluate[this.currentPlayerIndex];
        const playerId = currentPlayer.id;
        
        return `
            <div class="eval-tags-section">
                <div class="eval-tags-header">
                    <span class="eval-tags-title">Selecciona hasta 3 etiquetas:</span>
                    <span id="tag-counter-${playerId}" class="eval-tags-counter">0/3</span>
                </div>
                <div class="eval-tags-list">
                    ${this.getRandomTags(12).map(tagKey => {
                        const tag = this.performanceTags[tagKey];
                        // Formatear estadísticas para mostrar
                        const stats = Object.entries(tag.points || {})
                            .map(([key, val]) => {
                                const statName = this.attributeTranslations[key] || key.toUpperCase();
                                const sign = val > 0 ? '+' : '';
                                return `${sign}${val} ${statName}`;
                            })
                            .join(', ');
                        
                        return `
                        <button type="button" class="eval-tag-item" data-tag="${tagKey}" data-player="${playerId}"
                                onclick="evaluationUI.toggleTag('${tagKey}', '${playerId}')">
                            <span class="eval-tag-icon">${tag.icon}</span>
                            <div class="eval-tag-content">
                                <div class="eval-tag-name">${tag.label}</div>
                                <div class="eval-tag-description">${tag.tooltip || ''}</div>
                                <div class="eval-tag-stats">${stats}</div>
                            </div>
                        </button>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Actualiza el rating del jugador
     */
    updateRating(playerId, value) {
        const valueDisplay = document.getElementById(`rating-value-${playerId}`);
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
        
        // Guardar el rating en el jugador actual
        if (this.currentEvaluation && this.currentEvaluation.playersToEvaluate) {
            const player = this.currentEvaluation.playersToEvaluate.find(p => p.id == playerId);
            if (player) {
                if (!player.evaluation) player.evaluation = {};
                player.evaluation.rating = parseFloat(value);
            }
        }
    }

    /**
     * Toggle de etiqueta con límite de 3
     */
    toggleTag(tagKey, playerId) {
        const button = document.querySelector(`[data-tag="${tagKey}"][data-player="${playerId}"]`);
        const counter = document.getElementById(`tag-counter-${playerId}`);
        
        // Convertir selectedTags a Array si es Set
        if (this.selectedTags instanceof Set) {
            this.selectedTags = Array.from(this.selectedTags);
        }
        if (!Array.isArray(this.selectedTags)) {
            this.selectedTags = [];
        }
        
        const tagIndex = this.selectedTags.indexOf(tagKey);
        
        if (tagIndex === -1) {
            // Verificar límite de 3 etiquetas
            if (this.selectedTags.length >= 3) {
                alert('🏷️ Máximo 3 etiquetas. Deselecciona alguna primero.');
                return;
            }
            
            // Agregar etiqueta
            this.selectedTags.push(tagKey);
            if (button) {
                button.classList.add('selected');
            }
        } else {
            // Quitar etiqueta
            this.selectedTags.splice(tagIndex, 1);
            if (button) {
                button.classList.remove('selected');
            }
        }
        
        // Actualizar contador
        if (counter) {
            const count = this.selectedTags.length;
            counter.textContent = `${count}/3`;
            
            if (count === 3) {
                counter.classList.add('full');
            } else {
                counter.classList.remove('full');
            }
        }
    }

    /**
     * Renderiza formulario simplificado
     */
    renderSimpleForm() {
        return `
            <div class="eval-rating-section">
                <h4 class="eval-rating-title">Califica el desempeño del jugador</h4>
                <div class="eval-rating-buttons">
                    ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                        <button class="eval-rating-btn" 
                                onclick="evaluationUI.selectRating(${n})" 
                                data-rating="${n}"
                                id="rating-btn-${n}">
                            ${n}
                        </button>
                    `).join('')}
                </div>
                <div style="text-align: center; margin-top: 15px; font-size: 13px; color: var(--eval-text-secondary);" id="rating-description">
                    <span style="color: #ff4757;">1-4: Malo</span> • 
                    <span style="color: #ffa502;">5-6: Regular</span> • 
                    <span style="color: #00ff9d;">7-10: Bueno</span>
                </div>
            </div>
        `;
    }

    /**
     * Cambia el modo de evaluación
     */
    switchMode(mode) {
        this.evaluationMode = mode;
        this.showEvaluationModal();
    }

    /**
     * Actualiza el valor del slider
     */
    updateSliderValue(key) {
        const slider = document.getElementById(`${key}-slider`);
        const valueDisplay = document.getElementById(`${key}-value`);
        if (slider && valueDisplay) {
            valueDisplay.textContent = slider.value;
        }
    }

    /**
     * Selecciona una calificación simple
     */
    selectRating(rating) {
        // Quitar selección previa
        document.querySelectorAll('.eval-rating-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Seleccionar nuevo rating
        const btn = document.getElementById(`rating-btn-${rating}`);
        if (btn) {
            btn.classList.add('selected');
        }
        
        // Guardar rating seleccionado
        this.selectedRating = rating;
    }

    /**
     * Envía la evaluación del jugador actual
     */
    async submitPlayerEvaluation() {
        const player = this.currentEvaluation.playersToEvaluate[this.currentPlayerIndex];
        const comment = document.getElementById('evaluation-comment')?.value || '';
        
        let evaluationData = {};
        
        if (this.evaluationMode === 'labels') {
            // Obtener etiquetas seleccionadas
            if (this.selectedTags.length === 0) {
                alert('Por favor selecciona al menos una etiqueta');
                return;
            }
            
            // Calcular rating basado en las etiquetas seleccionadas
            let totalPoints = 0;
            let pointCount = 0;
            
            this.selectedTags.forEach(tagKey => {
                const tag = this.performanceTags[tagKey];
                if (tag && tag.points) {
                    Object.values(tag.points).forEach(points => {
                        if (points > 0) {
                            totalPoints += points;
                            pointCount++;
                        }
                    });
                }
            });
            
            // Rating basado en el promedio de puntos (normalizado a escala 1-10)
            const avgPoints = pointCount > 0 ? totalPoints / pointCount : 5;
            const rating = Math.min(10, Math.max(1, Math.round(avgPoints * 2 + 5)));
            
            evaluationData = {
                rating: rating,
                tags: Array.from(this.selectedTags),
                comment: comment
            };
        } else {
            // Obtener rating simple
            if (!this.selectedRating) {
                alert('Por favor selecciona una calificación del 1 al 10');
                return;
            }
            evaluationData = {
                rating: this.selectedRating,
                comment: comment
            };
        }

        // Guardar evaluación
        if (!this.currentEvaluation.evaluations) {
            this.currentEvaluation.evaluations = {};
        }
        
        this.currentEvaluation.evaluations[player.id] = evaluationData;

        // Siguiente jugador o finalizar
        if (this.currentPlayerIndex < this.currentEvaluation.playersToEvaluate.length - 1) {
            this.currentPlayerIndex++;
            this.showEvaluationModal();
        } else {
            await this.submitAllEvaluations();
        }
    }

    /**
     * Omite la evaluación del jugador actual
     */
    skipPlayer() {
        if (this.currentPlayerIndex < this.currentEvaluation.playersToEvaluate.length - 1) {
            this.currentPlayerIndex++;
            this.showEvaluationModal();
        } else {
            this.submitAllEvaluations();
        }
    }

    /**
     * Envía todas las evaluaciones
     */
    async submitAllEvaluations() {
        if (!this.currentEvaluation.evaluations || Object.keys(this.currentEvaluation.evaluations).length === 0) {
            UI.showNotification('No se evaluó a ningún jugador', 'warning');
            this.closeModal();
            return;
        }

        try {
            UI.showLoading();
            
            // Obtener ID del jugador actual - debe ser el mismo que se configuró en startTestEvaluation
            const currentPlayerId = this.currentEvaluation.evaluatorId;
            const result = await window.UnifiedEvaluationSystem.submitEvaluation(
                this.currentEvaluation.matchId,
                currentPlayerId,
                this.currentEvaluation.evaluations
            );

            if (result.success) {
                UI.showNotification('✅ Evaluaciones enviadas correctamente', 'success');
                
                if (result.ovrUpdated) {
                    UI.showNotification('🎯 OVRs actualizados automáticamente', 'info');
                    
                    // Recargar jugadores desde Firebase para actualizar la UI
                    if (window.Storage && Storage.loadPlayersFromFirebase) {
                        console.log('[EvaluationUI] Reloading players to update OVR display...');
                        await Storage.loadPlayersFromFirebase();
                        
                        // Si TestApp está disponible, actualizar su lista también
                        if (window.TestApp && TestApp.loadPlayers) {
                            await TestApp.loadPlayers();
                        }
                    }
                }
                
                // Guardar matchId antes de usarlo (porque closeModal lo limpiará)
                const matchId = this.currentEvaluation.matchId;
                
                // Marcar la evaluación como completada localmente
                if (window.UnifiedEvaluationSystem && window.UnifiedEvaluationSystem.evaluations) {
                    const evaluation = window.UnifiedEvaluationSystem.evaluations.find(e => 
                        e.matchId === matchId
                    );
                    if (evaluation && evaluation.assignments && evaluation.assignments[currentPlayerId]) {
                        evaluation.assignments[currentPlayerId].completed = true;
                        evaluation.assignments[currentPlayerId].completedAt = Date.now();
                        console.log(`[EvaluationUI] Marked evaluation as completed locally for ${matchId}`, evaluation.assignments[currentPlayerId]);
                    }
                }
                
                this.closeModal();
                
                // Actualizar el botón específico inmediatamente
                const button = document.getElementById(`eval-btn-${matchId}`);
                if (button) {
                    button.innerHTML = '✅ Evaluación Completada';
                    button.className = 'eval-btn-completed'; // Usar clase CSS específica
                    button.onclick = null;
                    console.log(`[EvaluationUI] Updated button state for ${matchId}`);
                }
                
                // Esperar un poco antes de actualizar la vista completa
                setTimeout(async () => {
                    await this.renderEvaluationsSection();
                }, 500);
            }
        } catch (error) {
            console.error('Error enviando evaluaciones:', error);
            UI.showNotification('Error al enviar evaluaciones', 'error');
        } finally {
            UI.hideLoading();
        }
    }

    /**
     * Verifica si el usuario tiene evaluaciones pendientes para un partido
     */
    async hasUserPendingEvaluations(matchId, evaluatorId) {
        if (!evaluatorId) {
            console.log(`[EvaluationUI] No evaluatorId provided`);
            return false; // Sin usuario, no puede evaluar
        }
        
        try {
            // Usar Firebase directamente para obtener datos más confiables
            const db = firebase.firestore();
            const evalDoc = await db.collection('evaluations').doc(matchId).get();
            
            if (!evalDoc.exists) {
                console.log(`[EvaluationUI] Evaluation document not found for matchId: ${matchId}`);
                return false;
            }
            
            const evalData = evalDoc.data();
            
            // Verificar si el usuario tiene asignaciones y no las ha completado
            if (evalData.assignments && evalData.assignments[evaluatorId]) {
                const assignment = evalData.assignments[evaluatorId];
                const isCompleted = assignment.completed === true;
                console.log(`[EvaluationUI] Firebase check for ${matchId}: ${isCompleted ? 'completed' : 'pending'}`, assignment);
                return !isCompleted; // Retorna true si NO está completado (puede evaluar)
            } else {
                console.log(`[EvaluationUI] No assignment found for ${evaluatorId} in ${matchId}`);
                return false; // Si no hay assignment, no puede evaluar
            }
        } catch (error) {
            console.error(`[EvaluationUI] Error checking evaluations for ${matchId}:`, error);
            return true; // En caso de error, asumir que puede evaluar
        }
    }

    /**
     * Cierra el modal
     */
    closeModal() {
        const modal = document.getElementById('evaluation-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        this.currentEvaluation = null;
        this.currentPlayerIndex = 0;
        this.selectedTags = [];
        this.selectedRating = null;
    }

    /**
     * Crea el modal si no existe
     */
    createEvaluationModal() {
        const modal = document.createElement('div');
        modal.id = 'evaluation-modal';
        modal.className = 'modal evaluation-modal';
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Obtiene datos de evaluación
     */
    async getEvaluationData(matchId, playerId) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('evaluations').doc(matchId).get();
            
            if (!doc.exists) {
                return null;
            }
            
            const data = doc.data();
            const assignment = data.assignments[playerId];
            
            if (!assignment || assignment.completed) {
                return null;
            }
            
            return {
                matchId: matchId,
                matchName: data.matchName,
                playersToEvaluate: assignment.toEvaluate,
                evaluations: {}
            };
        } catch (error) {
            console.error('Error obteniendo datos de evaluación:', error);
            return null;
        }
    }

    /**
     * Adjunta manejadores de eventos
     */
    attachEventHandlers() {
        document.querySelectorAll('.start-evaluation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchId = e.target.dataset.matchId;
                this.openEvaluationModal(matchId);
            });
        });
    }

    /**
     * Obtiene todas las evaluaciones (modo test)
     */
    async getAllEvaluations() {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('evaluations').get();
            const evaluations = [];
            snapshot.forEach(doc => {
                evaluations.push({ id: doc.id, ...doc.data() });
            });
            console.log('[EvaluationUI] Found evaluations:', evaluations.length);
            return evaluations;
        } catch (error) {
            console.error('Error getting all evaluations:', error);
            return [];
        }
    }

    /**
     * Renderiza todas las evaluaciones en modo test
     */
    renderAllEvaluationsTestMode(container, evaluations) {
        if (!evaluations || evaluations.length === 0) {
            container.innerHTML = `
                <div class="evaluations-container">
                    <div class="evaluations-header">
                        <h2>📊 Evaluaciones (Modo Test)</h2>
                    </div>
                    <div class="empty-state">
                        <p>No hay evaluaciones generadas aún.</p>
                        <p>Finaliza un partido manual para generar evaluaciones automáticas.</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = `
            <div class="evaluations-container">
                <div class="evaluations-header">
                    <h2>📊 Todas las Evaluaciones (Modo Test)</h2>
                    <span class="badge badge-info">${evaluations.length} evaluaciones</span>
                </div>
                <div class="evaluations-list">
                    ${evaluations.map(evaluation => `
                        <div class="evaluation-card test-mode" style="
                            background: rgba(26, 31, 46, 0.8);
                            color: white;
                            padding: 20px;
                            border-radius: 12px;
                            margin-bottom: 15px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        ">
                            <h3>🎮 ${evaluation.matchName || 'Partido sin nombre'}</h3>
                            <p>📅 Fecha: ${new Date(evaluation.matchDate).toLocaleDateString()}</p>
                            <p>🆔 Match ID: ${evaluation.matchId}</p>
                            <p>📊 Estado: ${evaluation.status || 'pending'}</p>
                            <p>👥 ${evaluation.teamA?.name || 'Equipo A'} (${evaluation.teamA?.players?.length || 0}) vs ${evaluation.teamB?.name || 'Equipo B'} (${evaluation.teamB?.players?.length || 0})</p>
                            ${evaluation.assignments ? `
                                <details style="margin-top: 10px;">
                                    <summary style="cursor: pointer;">Ver asignaciones (${Object.keys(evaluation.assignments).length})</summary>
                                    <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 11px;">
${JSON.stringify(evaluation.assignments, null, 2)}
                                    </pre>
                                </details>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Renderiza modo test con capacidad de evaluación
     */
    async renderTestModeWithEvaluation(container, evaluations) {
        if (!evaluations || evaluations.length === 0) {
            container.innerHTML = `
                <div class="evaluations-container">
                    <div class="evaluations-header">
                        <h2>📊 Evaluaciones</h2>
                        <p style="color: #666; font-size: 14px;">Finaliza un partido manual para generar evaluaciones.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Obtener ID del jugador actual de múltiples fuentes
        let currentPlayerId = null;
        
        // Method 1: Try AuthSystem current user  
        if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid) {
            currentPlayerId = TestApp.currentUser.uid;
            console.log(`[EvaluationUI] Render: Got player ID from TestApp.currentUser: ${currentPlayerId}`);
        }
        // Method 2: Try CollaborativeSystem current user
        else if (window.collaborativeSystem && collaborativeSystem.state && collaborativeSystem.state.currentUser && collaborativeSystem.state.currentUser.uid) {
            currentPlayerId = collaborativeSystem.state.currentUser.uid;
            console.log(`[EvaluationUI] Render: Got player ID from collaborativeSystem: ${currentPlayerId}`);
        }
        // Method 3: Try Storage as fallback
        else if (window.Storage && Storage.getCurrentPerson) {
            const currentPlayer = Storage.getCurrentPerson();
            currentPlayerId = currentPlayer ? currentPlayer.id : null;
            console.log(`[EvaluationUI] Render: Got player ID from Storage: ${currentPlayerId}`);
        }
        
        // Verificar estado de cada evaluación
        const evaluationsWithState = [];
        
        console.log(`[EvaluationUI] Checking ${evaluations.length} evaluations for player:`, currentPlayerId);
        
        for (const evaluation of evaluations) {
            const canEvaluate = await this.hasUserPendingEvaluations(evaluation.matchId, currentPlayerId);
            console.log(`[EvaluationUI] Evaluation ${evaluation.matchId.slice(-8)}: canEvaluate = ${canEvaluate}`);
            
            evaluationsWithState.push({
                ...evaluation,
                canEvaluate
            });
        }
        
        // Mostrar todas las evaluaciones en una sola lista
        const html = `
            <div class="evaluations-container">
                <div class="evaluations-header" style="margin-bottom: 20px;">
                    <h2 style="color: #00ff9d; margin: 0;">📊 Evaluaciones</h2>
                    <span style="background: #555; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">${evaluationsWithState.length} partidos</span>
                </div>
                <div class="evaluations-list">
                    ${evaluationsWithState.map(evaluation => {
                        const deadline = new Date(evaluation.deadline || Date.now() + 72*60*60*1000);
                        const now = new Date();
                        const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
                        
                        // Calcular estadísticas de evaluación
                        const assignments = evaluation.assignments || {};
                        const evaluators = Object.keys(assignments);
                        const completed = evaluators.filter(evaluator => {
                            const assignment = assignments[evaluator];
                            return assignment.completed || false;
                        });
                        const pending = evaluators.filter(evaluator => {
                            const assignment = assignments[evaluator];
                            return !assignment.completed;
                        });
                        
                        const isCompleted = !evaluation.canEvaluate;
                        const urgentClass = hoursLeft < 24 && evaluation.canEvaluate ? 'urgent' : '';
                        
                        console.log(`[EvaluationUI] Rendering button for ${evaluation.matchId.slice(-8)}:`, {
                            canEvaluate: evaluation.canEvaluate,
                            isCompleted,
                            buttonText: evaluation.canEvaluate ? '🎯 Evaluar Ahora' : '✅ Evaluación Completada',
                            buttonColor: evaluation.canEvaluate ? '#00ff9d' : '#666'
                        });
                        
                        return `
                            <div class="evaluation-item" style="
                                background: ${isCompleted ? 'rgba(46,204,113,0.1)' : 'rgba(255,71,87,0.1)'};
                                border: 1px solid ${isCompleted ? 'rgba(46,204,113,0.3)' : 'rgba(255,71,87,0.3)'};
                                border-radius: 10px;
                                padding: 20px;
                                margin-bottom: 20px;
                                position: relative;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                ${urgentClass === 'urgent' ? 'border-color: #ff4757; background: rgba(255,71,87,0.2);' : ''}
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                    <h3 style="color: #fff; margin: 0; font-size: 18px; font-weight: 600;">
                                        ${isCompleted ? '✅' : '⚽'} ${evaluation.matchName || `Partido ${evaluation.matchId.slice(-8)}`}
                                    </h3>
                                    ${urgentClass === 'urgent' ? '<span style="background: #ff4757; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">🚨 URGENTE</span>' : ''}
                                    ${isCompleted ? '<span style="background: #2ecc71; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">COMPLETADO</span>' : ''}
                                </div>
                                
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; gap: 20px; font-size: 13px; color: #bbb; margin-bottom: 10px;">
                                        <span>📅 ${new Date(evaluation.matchDate || Date.now()).toLocaleDateString()}</span>
                                        ${!isCompleted && hoursLeft >= 0 ? `<span>⏰ ${hoursLeft} horas restantes</span>` : ''}
                                        ${!isCompleted && hoursLeft < 0 ? '<span style="color: #ff4757;">⏰ ¡Plazo vencido!</span>' : ''}
                                    </div>
                                    <div style="display: flex; gap: 20px; font-size: 13px; color: #bbb;">
                                        <span>🏘️ ${evaluation.teamA?.name || 'Equipo A'} (${evaluation.teamA?.players?.length || 0})</span>
                                        <span>🆚</span>
                                        <span>🏘️ ${evaluation.teamB?.name || 'Equipo B'} (${evaluation.teamB?.players?.length || 0})</span>
                                    </div>
                                </div>
                                
                                <!-- Progreso de evaluaciones -->
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-size: 14px; font-weight: 600; color: #ccc;">Estado de evaluaciones:</span>
                                        <span style="font-size: 12px; color: #999;">${completed.length}/${evaluators.length} completadas</span>
                                    </div>
                                    
                                    <!-- Barra de progreso -->
                                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 10px; overflow: hidden;">
                                        <div style="height: 100%; background: #00ff9d; width: ${evaluators.length > 0 ? (completed.length / evaluators.length) * 100 : 0}%; transition: width 0.3s ease;"></div>
                                    </div>
                                    
                                    <!-- Desplegable de evaluadores -->
                                    <details style="margin-bottom: 10px;">
                                        <summary style="cursor: pointer; color: #00ff9d; font-size: 13px; padding: 5px 0;">👥 Ver evaluadores (${evaluators.length})</summary>
                                        <div style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 12px;">
                                            ${completed.length > 0 ? `
                                                <div style="margin-bottom: 8px;">
                                                    <span style="color: #00ff9d; font-weight: 600;">✅ Completadas (${completed.length}):</span><br>
                                                    ${completed.map(evaluator => `<span style="color: #ccc; margin-left: 10px;">• ${getEvaluatorName(evaluator)}</span>`).join('<br>')}
                                                </div>
                                            ` : ''}
                                            ${pending.length > 0 ? `
                                                <div>
                                                    <span style="color: #ff6b6b; font-weight: 600;">⏳ Pendientes (${pending.length}):</span><br>
                                                    ${pending.map(evaluator => `<span style="color: #ccc; margin-left: 10px;">• ${getEvaluatorName(evaluator)}</span>`).join('<br>')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </details>
                                </div>
                                
                                <!-- Botón de evaluación -->
                                <div style="display: flex; justify-content: center; margin-top: 15px;">
                                    <button 
                                        id="eval-btn-${evaluation.matchId}"
                                        class="${evaluation.canEvaluate ? 'eval-btn-active' : 'eval-btn-completed'}"
                                        ${evaluation.canEvaluate ? `onclick="evaluationUI.checkAndEvaluate('${evaluation.matchId}')"` : ''}
                                        style="
                                        ${evaluation.canEvaluate ? 'background: #00ff9d; color: #000; cursor: pointer;' : ''}
                                        border: none;
                                        padding: 12px 25px;
                                        border-radius: 25px;
                                        font-weight: 600;
                                        font-size: 14px;
                                        transition: all 0.3s ease;
                                        box-shadow: ${evaluation.canEvaluate ? '0 2px 10px rgba(0,255,157,0.3)' : 'none'};
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        min-width: 150px;
                                        justify-content: center;
                                        width: 100%;
                                        max-width: 200px;
                                    "
                                    ${evaluation.canEvaluate ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#00cc7a';" onmouseout="this.style.transform='translateY(0)'; this.style.background='#00ff9d';"` : ''}>
                                        ${evaluation.canEvaluate ? '🎯 Evaluar Ahora' : '✅ Evaluación Completada'}
                                    </button>
                                </div>
                            </div>
                        `;
                        }).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Inicia una evaluación en modo test
     */
    async startTestEvaluation(matchId) {
        try {
            console.log('[EvaluationUI] Iniciando evaluación para match:', matchId);
            
            // Obtener ID del usuario actual - usar TestApp.currentUser directamente
            let currentPlayerId = null;
            
            if (window.TestApp && TestApp.currentUser && TestApp.currentUser.uid) {
                currentPlayerId = TestApp.currentUser.uid;
                console.log('[EvaluationUI] startTestEvaluation using TestApp.currentUser.uid:', currentPlayerId);
            } else {
                alert('No se pudo identificar el usuario actual - TestApp.currentUser no disponible');
                console.error('[EvaluationUI] TestApp.currentUser:', window.TestApp?.currentUser);
                return;
            }
            
            // Obtener datos directamente de Firebase sin usar consultas complejas
            const db = firebase.firestore();
            const evalDoc = await db.collection('evaluations').doc(matchId).get();
            
            if (!evalDoc.exists) {
                alert('Evaluación no encontrada');
                return;
            }
            
            const evalData = evalDoc.data();
            console.log('[EvaluationUI] Datos de evaluación obtenidos de Firebase:', evalData);
            
            // Verificar asignaciones para este usuario
            if (!evalData.assignments || !evalData.assignments[currentPlayerId]) {
                alert('No tienes asignaciones para este partido');
                return;
            }
            
            const userAssignment = evalData.assignments[currentPlayerId];
            if (!userAssignment.toEvaluate || userAssignment.toEvaluate.length === 0) {
                alert('No tienes jugadores asignados para evaluar en este partido');
                return;
            }
            
            console.log('[EvaluationUI] Datos de evaluación obtenidos:', evalData);
            
            // Configurar evaluación actual usando los datos de la asignación
            this.currentEvaluation = {
                matchId: matchId,
                matchName: evalData.matchName || 'Partido',
                playersToEvaluate: userAssignment.toEvaluate,
                evaluatorId: currentPlayerId,  // Usar ID real del usuario
                evaluations: {}
            };
            
            this.currentPlayerIndex = 0;
            
            console.log('[EvaluationUI] Configuración de evaluación:', this.currentEvaluation);
            
            // Mostrar modal de evaluación
            this.showEvaluationModal();
            
        } catch (error) {
            console.error('[EvaluationUI] Error iniciando evaluación test:', error);
            alert('Error al iniciar la evaluación: ' + error.message);
        }
    }
}

// Crear instancia global
const evaluationUI = new EvaluationUI();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.EvaluationUI = evaluationUI;
    window.evaluationUI = evaluationUI; // Para compatibilidad con test-app.js
}