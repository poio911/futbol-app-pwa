/**
 * UI de Evaluaciones Unificada
 * Maneja la interfaz de evaluaciones pendientes y completadas
 */

class EvaluationUI {
    constructor() {
        this.currentEvaluation = null;
        this.currentPlayerIndex = 0;
        this.evaluationMode = 'labels'; // 'labels' o 'simple'
        this.labels = {
            physical: {
                name: 'Rendimiento Físico',
                icon: '💪',
                subcategories: ['Resistencia', 'Velocidad', 'Fuerza']
            },
            technical: {
                name: 'Habilidades Técnicas',
                icon: '⚽',
                subcategories: ['Control del balón', 'Pase', 'Tiro']
            },
            tactical: {
                name: 'Aspectos Tácticos',
                icon: '🧠',
                subcategories: ['Posicionamiento', 'Visión de juego', 'Toma de decisiones']
            },
            attitude: {
                name: 'Actitud',
                icon: '🎯',
                subcategories: ['Trabajo en equipo', 'Comunicación', 'Compromiso']
            }
        };
    }

    /**
     * Renderiza la sección principal de evaluaciones
     */
    async renderEvaluationsSection() {
        const container = document.getElementById('evaluations-section');
        if (!container) return;

        // Try to get current player ID, or use test mode
        let currentPlayerId = null;
        if (window.Storage && Storage.getCurrentPersonId) {
            currentPlayerId = Storage.getCurrentPersonId();
        }
        
        // If no player ID, show all evaluations (test mode)
        if (!currentPlayerId) {
            console.log('[EvaluationUI] No player ID, showing all evaluations in test mode');
            // In test mode, show all evaluations
            const allEvaluations = await this.getAllEvaluations();
            this.renderAllEvaluationsTestMode(container, allEvaluations);
            return;
        }

        // Obtener evaluaciones pendientes y completadas
        const pending = await window.UnifiedEvaluationSystem.getPendingEvaluations(currentPlayerId);
        const completed = await window.UnifiedEvaluationSystem.getCompletedEvaluations(currentPlayerId);

        container.innerHTML = `
            <div class="evaluations-container">
                <div class="evaluations-header">
                    <h2>📊 Evaluaciones</h2>
                    ${pending.length > 0 ? `<span class="badge badge-danger">${pending.length} pendientes</span>` : ''}
                </div>

                ${this.renderPendingEvaluations(pending)}
                ${this.renderCompletedEvaluations(completed)}
            </div>
        `;

        // Attach event handlers
        this.attachEventHandlers();
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

        const cards = evaluations.map(eval => {
            const deadline = new Date(eval.deadline);
            const now = new Date();
            const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
            const urgentClass = hoursLeft < 24 ? 'urgent' : '';

            return `
                <div class="evaluation-card pending ${urgentClass}" data-match-id="${eval.matchId}">
                    <div class="eval-card-header">
                        <h3>${eval.matchName}</h3>
                        <span class="eval-date">${new Date(eval.matchDate).toLocaleDateString()}</span>
                    </div>
                    <div class="eval-card-body">
                        <div class="players-to-evaluate">
                            <p>Evaluar a ${eval.playersToEvaluate.length} compañeros:</p>
                            <div class="player-badges">
                                ${eval.playersToEvaluate.map(p => `
                                    <span class="player-badge">
                                        ${p.avatar ? `<img src="${p.avatar}" alt="${p.name}">` : '👤'}
                                        ${p.name}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="eval-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${eval.participationRate * 100}%"></div>
                            </div>
                            <span class="progress-text">${Math.round(eval.participationRate * 100)}% completado</span>
                        </div>
                        <div class="eval-deadline ${urgentClass}">
                            <i class='bx bx-time'></i>
                            ${hoursLeft > 0 ? `${hoursLeft} horas restantes` : 'Expira pronto'}
                        </div>
                    </div>
                    <div class="eval-card-actions">
                        <button class="btn btn-primary start-evaluation-btn" data-match-id="${eval.matchId}">
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

        const cards = evaluations.map(eval => `
            <div class="evaluation-card completed">
                <div class="eval-card-header">
                    <h3>${eval.matchName}</h3>
                    <span class="eval-date">${new Date(eval.matchDate).toLocaleDateString()}</span>
                </div>
                <div class="eval-card-body">
                    <div class="completion-info">
                        <i class='bx bx-check-circle'></i>
                        <span>Completado el ${new Date(eval.completedAt).toLocaleDateString()}</span>
                    </div>
                    ${eval.ovrUpdated ? `
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
     * Abre el modal de evaluación
     */
    async openEvaluationModal(matchId) {
        const currentPlayerId = Storage.getCurrentPersonId();
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
        const modal = document.getElementById('evaluation-modal') || this.createEvaluationModal();
        
        const player = this.currentEvaluation.playersToEvaluate[this.currentPlayerIndex];
        const progress = ((this.currentPlayerIndex + 1) / this.currentEvaluation.playersToEvaluate.length) * 100;

        modal.innerHTML = `
            <div class="modal-content evaluation-modal-content">
                <div class="modal-header">
                    <h2>Evaluación de Compañeros</h2>
                    <button class="close-modal-btn" onclick="evaluationUI.closeModal()">
                        <i class='bx bx-x'></i>
                    </button>
                </div>

                <div class="evaluation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">Jugador ${this.currentPlayerIndex + 1} de ${this.currentEvaluation.playersToEvaluate.length}</span>
                </div>

                <div class="player-to-evaluate">
                    <div class="player-card-eval">
                        <div class="player-avatar">
                            ${player.avatar ? `<img src="${player.avatar}" alt="${player.name}">` : '<i class="bx bx-user"></i>'}
                        </div>
                        <div class="player-info">
                            <h3>${player.name}</h3>
                            <p>${player.position} • OVR ${player.ovr}</p>
                        </div>
                    </div>
                </div>

                <div class="evaluation-mode-selector">
                    <button class="mode-btn ${this.evaluationMode === 'labels' ? 'active' : ''}" 
                            onclick="evaluationUI.switchMode('labels')">
                        🏷️ Por Etiquetas
                    </button>
                    <button class="mode-btn ${this.evaluationMode === 'simple' ? 'active' : ''}" 
                            onclick="evaluationUI.switchMode('simple')">
                        📊 Simplificado
                    </button>
                </div>

                <div class="evaluation-form">
                    ${this.evaluationMode === 'labels' ? this.renderLabelsForm() : this.renderSimpleForm()}
                </div>

                <div class="comment-section">
                    <label>Comentario (opcional)</label>
                    <textarea id="evaluation-comment" placeholder="Añade un comentario sobre el desempeño..."></textarea>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="evaluationUI.skipPlayer()">
                        Omitir
                    </button>
                    <button class="btn btn-primary" onclick="evaluationUI.submitPlayerEvaluation()">
                        ${this.currentPlayerIndex < this.currentEvaluation.playersToEvaluate.length - 1 ? 'Siguiente →' : 'Finalizar'}
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Renderiza formulario por etiquetas
     */
    renderLabelsForm() {
        return Object.entries(this.labels).map(([key, label]) => `
            <div class="label-category">
                <div class="category-header">
                    <span class="category-icon">${label.icon}</span>
                    <span class="category-name">${label.name}</span>
                    <span class="category-value" id="${key}-value">5</span>
                </div>
                <input type="range" class="evaluation-slider" id="${key}-slider" 
                       min="1" max="10" value="5" 
                       oninput="evaluationUI.updateSliderValue('${key}')">
                <div class="subcategories">
                    ${label.subcategories.map(sub => `<span class="subcategory">${sub}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderiza formulario simplificado
     */
    renderSimpleForm() {
        return `
            <div class="simple-rating">
                <p>Califica el desempeño general del jugador</p>
                <div class="rating-buttons">
                    ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                        <button class="rating-btn ${n <= 4 ? 'poor' : n <= 6 ? 'average' : 'good'}" 
                                onclick="evaluationUI.selectRating(${n})" 
                                data-rating="${n}">
                            ${n}
                        </button>
                    `).join('')}
                </div>
                <div class="rating-description" id="rating-description">
                    Selecciona una calificación
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
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const btn = document.querySelector(`.rating-btn[data-rating="${rating}"]`);
        if (btn) {
            btn.classList.add('selected');
        }

        const descriptions = {
            1: 'Muy bajo desempeño',
            2: 'Bajo desempeño',
            3: 'Por debajo del promedio',
            4: 'Ligeramente por debajo',
            5: 'Desempeño promedio',
            6: 'Ligeramente por encima',
            7: 'Buen desempeño',
            8: 'Muy buen desempeño',
            9: 'Excelente desempeño',
            10: 'Desempeño excepcional'
        };

        const descEl = document.getElementById('rating-description');
        if (descEl) {
            descEl.textContent = descriptions[rating];
        }
    }

    /**
     * Envía la evaluación del jugador actual
     */
    async submitPlayerEvaluation() {
        const player = this.currentEvaluation.playersToEvaluate[this.currentPlayerIndex];
        const comment = document.getElementById('evaluation-comment')?.value || '';
        
        let rating;
        
        if (this.evaluationMode === 'labels') {
            // Calcular promedio de las etiquetas
            const values = Object.keys(this.labels).map(key => {
                const slider = document.getElementById(`${key}-slider`);
                return slider ? parseInt(slider.value) : 5;
            });
            rating = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        } else {
            // Obtener rating simple
            const selectedBtn = document.querySelector('.rating-btn.selected');
            if (!selectedBtn) {
                UI.showNotification('Por favor selecciona una calificación', 'warning');
                return;
            }
            rating = parseInt(selectedBtn.dataset.rating);
        }

        // Guardar evaluación
        if (!this.currentEvaluation.evaluations) {
            this.currentEvaluation.evaluations = {};
        }
        
        this.currentEvaluation.evaluations[player.id] = {
            rating: rating,
            comment: comment,
            evaluatedAt: Date.now()
        };

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
            
            const currentPlayerId = Storage.getCurrentPersonId();
            const result = await window.UnifiedEvaluationSystem.submitEvaluation(
                this.currentEvaluation.matchId,
                currentPlayerId,
                this.currentEvaluation.evaluations
            );

            if (result.success) {
                UI.showNotification('✅ Evaluaciones enviadas correctamente', 'success');
                
                if (result.ovrUpdated) {
                    UI.showNotification('🎯 OVRs actualizados automáticamente', 'info');
                }
                
                this.closeModal();
                await this.renderEvaluationsSection();
            }
        } catch (error) {
            console.error('Error enviando evaluaciones:', error);
            UI.showNotification('Error al enviar evaluaciones', 'error');
        } finally {
            UI.hideLoading();
        }
    }

    /**
     * Cierra el modal
     */
    closeModal() {
        const modal = document.getElementById('evaluation-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentEvaluation = null;
        this.currentPlayerIndex = 0;
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
                    ${evaluations.map(eval => `
                        <div class="evaluation-card test-mode" style="
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            padding: 20px;
                            border-radius: 12px;
                            margin-bottom: 15px;
                        ">
                            <h3>🎮 ${eval.matchName || 'Partido sin nombre'}</h3>
                            <p>📅 Fecha: ${new Date(eval.matchDate).toLocaleDateString()}</p>
                            <p>🆔 Match ID: ${eval.matchId}</p>
                            <p>📊 Estado: ${eval.status || 'pending'}</p>
                            <p>👥 ${eval.teamA?.name || 'Equipo A'} (${eval.teamA?.players || 0}) vs ${eval.teamB?.name || 'Equipo B'} (${eval.teamB?.players || 0})</p>
                            ${eval.assignments ? `
                                <details style="margin-top: 10px;">
                                    <summary style="cursor: pointer;">Ver asignaciones (${Object.keys(eval.assignments).length})</summary>
                                    <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 11px;">
${JSON.stringify(eval.assignments, null, 2)}
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
}

// Crear instancia global
const evaluationUI = new EvaluationUI();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.EvaluationUI = evaluationUI;
}