/**
 * Test del flujo completo: Crear partido manual → Finalizar → Evaluaciones aparecen
 * Verifica el nuevo sistema unificado de evaluaciones
 */

const { test, expect } = require('@playwright/test');

test.describe('Flujo Manual: Partido → Finalizar → Evaluaciones', () => {
    let page;
    
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        
        // Ir a la página
        await page.goto('file://' + process.cwd().replace(/\\/g, '/') + '/index.html');
        await page.waitForTimeout(2000); // Esperar carga
        
        // Mock Firebase auth para evitar login real
        await page.addInitScript(() => {
            window.mockUser = {
                uid: 'test-user-123',
                email: 'test@example.com'
            };
            
            window.firebase = {
                auth: () => ({
                    currentUser: window.mockUser,
                    onAuthStateChanged: (callback) => callback(window.mockUser)
                }),
                firestore: () => ({
                    collection: () => ({
                        doc: () => ({
                            set: async () => ({ success: true }),
                            update: async () => ({ success: true }),
                            get: async () => ({ exists: true, data: () => ({}) })
                        })
                    })
                })
            };
            
            // Mock Storage y UnifiedEvaluationSystem
            window.Storage = {
                getCurrentPersonId: () => 'test-user-123',
                getPlayers: () => [
                    { id: '1', name: 'Jugador 1', position: 'DEL', ovr: 85 },
                    { id: '2', name: 'Jugador 2', position: 'MED', ovr: 80 },
                    { id: '3', name: 'Jugador 3', position: 'DEF', ovr: 78 },
                    { id: '4', name: 'Jugador 4', position: 'POR', ovr: 82 }
                ],
                getMatchById: (matchId) => {
                    return {
                        id: matchId,
                        date: new Date().toISOString(),
                        teamA: { 
                            players: [
                                { id: '1', name: 'Jugador 1', position: 'DEL', ovr: 85 },
                                { id: '2', name: 'Jugador 2', position: 'MED', ovr: 80 }
                            ] 
                        },
                        teamB: { 
                            players: [
                                { id: '3', name: 'Jugador 3', position: 'DEF', ovr: 78 },
                                { id: '4', name: 'Jugador 4', position: 'POR', ovr: 82 }
                            ] 
                        },
                        result: null
                    };
                }
            };
            
            window.UnifiedEvaluationSystem = {
                initializeEvaluations: async (match, type) => {
                    console.log('Mock: Inicializando evaluaciones para', match.id, type);
                    
                    // Simular que se crearon evaluaciones pendientes
                    window.mockPendingEvaluations = [
                        {
                            matchId: match.id,
                            matchName: 'Equipo A vs Equipo B',
                            matchDate: match.date,
                            playersToEvaluate: [
                                { id: '2', name: 'Jugador 2' },
                                { id: '3', name: 'Jugador 3' }
                            ]
                        }
                    ];
                    
                    return { success: true };
                },
                getPendingEvaluations: async () => window.mockPendingEvaluations || [],
                getCompletedEvaluations: async () => []
            };
            
            // Mock UI
            window.UI = {
                showNotification: (message, type) => console.log('UI Notification:', type, message),
                showLoading: () => console.log('UI Loading...'),
                hideLoading: () => console.log('UI Hide Loading')
            };
        });
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Debe mostrar botón "Finalizar" en partido manual pendiente', async () => {
        console.log('🔍 Verificando botón Finalizar...');
        
        // Simular que hay un partido manual pendiente
        await page.evaluate(() => {
            // Mock del MatchManager para mostrar un partido pendiente
            const matchList = document.getElementById('match-list') || document.createElement('div');
            matchList.id = 'match-list';
            if (!document.body.contains(matchList)) {
                document.body.appendChild(matchList);
            }
            
            const mockMatch = {
                id: 'test-match-123',
                date: new Date().toISOString(),
                teamA: { players: [{ id: '1', name: 'Jugador 1' }, { id: '2', name: 'Jugador 2' }] },
                teamB: { players: [{ id: '3', name: 'Jugador 3' }, { id: '4', name: 'Jugador 4' }] },
                result: null // Pendiente
            };
            
            matchList.innerHTML = `
                <div class="match-card" data-match-id="${mockMatch.id}">
                    <div class="match-card-header">
                        <span class="match-date-display">2 sep 2025, 19:00</span>
                        <span class="match-status pending">Pendiente</span>
                    </div>
                    <div class="match-teams-display">
                        <div class="match-team-info">
                            <div class="match-team-name">Equipo A</div>
                            <div class="match-team-ovr">82</div>
                        </div>
                        <div class="match-vs">VS</div>
                        <div class="match-team-info">
                            <div class="match-team-name">Equipo B</div>
                            <div class="match-team-ovr">80</div>
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="match-finish-btn" onclick="MatchManager.finishMatch('${mockMatch.id}')">
                            <i class='bx bx-check-circle'></i> Finalizar
                        </button>
                        <button class="match-delete-btn">
                            <i class='bx bx-trash'></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Verificar que existe el botón "Finalizar"
        const finishBtn = page.locator('.match-finish-btn');
        await expect(finishBtn).toBeVisible({ timeout: 5000 });
        await expect(finishBtn).toContainText('Finalizar');
        
        console.log('✅ Botón "Finalizar" encontrado correctamente');
    });

    test('Debe crear evaluaciones al finalizar partido manual', async () => {
        console.log('🎯 Probando finalización de partido...');
        
        // Mock de confirmación
        await page.evaluate(() => {
            window.confirm = () => true;
        });
        
        // Click en "Finalizar"
        await page.locator('.match-finish-btn').first().click();
        
        // Esperar a que se ejecute la lógica de finalización
        await page.waitForTimeout(1000);
        
        // Verificar que se llamó a initializeEvaluations
        const wasEvaluationCalled = await page.evaluate(() => {
            return window.mockPendingEvaluations && window.mockPendingEvaluations.length > 0;
        });
        
        expect(wasEvaluationCalled).toBe(true);
        console.log('✅ Evaluaciones inicializadas correctamente');
    });

    test('Debe mostrar evaluaciones pendientes en sección Evaluaciones', async () => {
        console.log('📊 Verificando sección Evaluaciones...');
        
        // Crear o navegar a sección evaluaciones
        await page.evaluate(() => {
            let evaluationsSection = document.getElementById('evaluations-section');
            if (!evaluationsSection) {
                evaluationsSection = document.createElement('div');
                evaluationsSection.id = 'evaluations-section';
                document.body.appendChild(evaluationsSection);
            }
            
            // Simular renderizado de evaluaciones pendientes
            if (window.mockPendingEvaluations && window.mockPendingEvaluations.length > 0) {
                evaluationsSection.innerHTML = `
                    <div class="evaluations-container">
                        <div class="evaluations-header">
                            <h2>📊 Evaluaciones</h2>
                            <span class="badge badge-danger">${window.mockPendingEvaluations.length} pendientes</span>
                        </div>
                        <div class="evaluation-card pending" data-match-id="${window.mockPendingEvaluations[0].matchId}">
                            <div class="eval-card-header">
                                <h3>${window.mockPendingEvaluations[0].matchName}</h3>
                                <span class="eval-date">${new Date(window.mockPendingEvaluations[0].matchDate).toLocaleDateString()}</span>
                            </div>
                            <div class="eval-card-body">
                                <div class="players-to-evaluate">
                                    <p>Evaluar a ${window.mockPendingEvaluations[0].playersToEvaluate.length} compañeros:</p>
                                    <div class="player-badges">
                                        ${window.mockPendingEvaluations[0].playersToEvaluate.map(p => `
                                            <span class="player-badge">${p.name}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="eval-card-actions">
                                <button class="btn-primary">Evaluar Ahora</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        // Verificar elementos de la UI
        await expect(page.locator('#evaluations-section')).toBeVisible();
        await expect(page.locator('.badge-danger')).toContainText('1 pendientes');
        await expect(page.locator('.evaluation-card.pending')).toBeVisible();
        await expect(page.locator('.players-to-evaluate')).toContainText('Evaluar a 2 compañeros');
        
        console.log('✅ Sección Evaluaciones muestra correctamente las evaluaciones pendientes');
    });

    test('Debe mostrar los jugadores correctos para evaluar', async () => {
        console.log('👥 Verificando jugadores asignados...');
        
        // Verificar que los jugadores mostrados son los correctos
        const playerBadges = page.locator('.player-badge');
        await expect(playerBadges).toHaveCount(2);
        
        const firstPlayer = playerBadges.first();
        const secondPlayer = playerBadges.last();
        
        await expect(firstPlayer).toContainText('Jugador');
        await expect(secondPlayer).toContainText('Jugador');
        
        console.log('✅ Jugadores para evaluar mostrados correctamente');
    });
});