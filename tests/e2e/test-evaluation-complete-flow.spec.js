const { test, expect } = require('@playwright/test');

test.describe('Sistema de Evaluaciones - Flujo Completo', () => {
    test('Debugging completo del flujo de evaluación', async ({ page }) => {
        // Configurar interceptor para logs
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
            }
        });

        // Navegar a la aplicación
        await page.goto('http://localhost:8080');
        
        // Esperar que la app se cargue
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('\n🔍 PASO 1: Verificando estado inicial...');
        
        // Verificar que TestApp.currentUser existe
        const currentUser = await page.evaluate(() => {
            return {
                exists: !!window.TestApp?.currentUser,
                uid: window.TestApp?.currentUser?.uid,
                displayName: window.TestApp?.currentUser?.displayName,
                email: window.TestApp?.currentUser?.email
            };
        });
        console.log('Current User:', currentUser);

        // Verificar que UnifiedEvaluationSystem existe
        const systemExists = await page.evaluate(() => {
            return {
                exists: !!window.UnifiedEvaluationSystem,
                evaluations: window.UnifiedEvaluationSystem?.evaluations?.length || 0
            };
        });
        console.log('UnifiedEvaluationSystem:', systemExists);

        console.log('\n🔍 PASO 2: Navegando a Evaluaciones...');
        
        // Ir a la sección de evaluaciones
        await page.click('[data-section="evaluations"]');
        await page.waitForTimeout(2000);

        // Verificar que se cargó la sección
        const evaluationsSection = await page.isVisible('#evaluations-section');
        console.log('Sección de evaluaciones visible:', evaluationsSection);

        console.log('\n🔍 PASO 3: Verificando evaluaciones disponibles...');
        
        // Obtener información de evaluaciones
        const evaluationsData = await page.evaluate(() => {
            // Verificar Storage.getMatches()
            const matches = window.Storage?.getMatches() || [];
            const completedMatches = matches.filter(m => m.status === 'completed');
            
            return {
                totalMatches: matches.length,
                completedMatches: completedMatches.length,
                matchData: completedMatches.map(m => ({
                    id: m.id,
                    name: m.name,
                    status: m.status,
                    hasEvaluationAssignments: !!m.evaluationAssignments,
                    assignmentKeys: Object.keys(m.evaluationAssignments || {})
                }))
            };
        });
        console.log('Datos de partidos:', evaluationsData);

        console.log('\n🔍 PASO 4: Buscando botón de evaluación...');
        
        // Buscar botones de evaluación
        const evaluationButtons = await page.$$('[id^="eval-btn-"]');
        console.log('Botones de evaluación encontrados:', evaluationButtons.length);

        if (evaluationButtons.length > 0) {
            console.log('\n🔍 PASO 5: Inspeccionando primer botón...');
            
            const buttonInfo = await page.evaluate(() => {
                const button = document.querySelector('[id^="eval-btn-"]');
                if (!button) return null;
                
                return {
                    id: button.id,
                    text: button.textContent.trim(),
                    onclick: button.onclick ? button.onclick.toString() : 'null',
                    style: {
                        background: button.style.background,
                        color: button.style.color,
                        cursor: button.style.cursor
                    },
                    disabled: button.disabled,
                    matchId: button.id.replace('eval-btn-', '')
                };
            });
            console.log('Información del botón:', buttonInfo);

            if (buttonInfo) {
                console.log('\n🔍 PASO 6: Verificando función hasUserPendingEvaluations...');
                
                // Verificar manualmente la función hasUserPendingEvaluations
                const pendingCheck = await page.evaluate((matchId) => {
                    const currentPlayer = window.Storage?.getCurrentPerson();
                    const currentPlayerId = currentPlayer ? currentPlayer.id : null;
                    
                    console.log('Manual check - CurrentPlayer:', currentPlayer);
                    console.log('Manual check - CurrentPlayerId:', currentPlayerId);
                    
                    // Verificar si evaluationUI existe y tiene la función
                    if (!window.evaluationUI) {
                        return { error: 'evaluationUI no existe' };
                    }
                    
                    // Llamar a la función directamente
                    return window.evaluationUI.hasUserPendingEvaluations(matchId, currentPlayerId)
                        .then(result => ({ canEvaluate: result, currentPlayerId }))
                        .catch(error => ({ error: error.message, currentPlayerId }));
                }, buttonInfo.matchId);
                
                console.log('Resultado de hasUserPendingEvaluations:', await pendingCheck);

                console.log('\n🔍 PASO 7: Intentando hacer clic en el botón...');
                
                // Hacer clic en el botón de evaluación
                const buttonSelector = `#${buttonInfo.id}`;
                await page.click(buttonSelector);
                await page.waitForTimeout(1000);

                console.log('\n🔍 PASO 8: Verificando qué pasó después del clic...');
                
                // Verificar si se abrió el modal
                const modalVisible = await page.isVisible('#evaluation-modal.active');
                console.log('Modal de evaluación visible:', modalVisible);

                // Verificar el estado del botón después del clic
                const buttonAfterClick = await page.evaluate((buttonId) => {
                    const button = document.getElementById(buttonId);
                    return button ? {
                        text: button.textContent.trim(),
                        style: {
                            background: button.style.background,
                            color: button.style.color,
                            cursor: button.style.cursor
                        },
                        onclick: button.onclick ? 'exists' : 'null'
                    } : null;
                }, buttonInfo.id);
                console.log('Estado del botón después del clic:', buttonAfterClick);

                if (modalVisible) {
                    console.log('\n✅ ÉXITO: Modal se abrió correctamente');
                    
                    // Verificar contenido del modal
                    const modalContent = await page.evaluate(() => {
                        const modal = document.querySelector('#evaluation-modal');
                        const modeButtons = modal?.querySelectorAll('.eval-mode-btn');
                        const tagsSection = modal?.querySelector('.eval-tags-section');
                        const tagsList = modal?.querySelector('.eval-tags-list');
                        const tagItems = modal?.querySelectorAll('.eval-tag-item');
                        
                        return {
                            hasModal: !!modal,
                            hasModeButtons: modeButtons?.length || 0,
                            hasTagsSection: !!tagsSection,
                            hasTagsList: !!tagsList,
                            tagCount: tagItems?.length || 0,
                            currentMode: window.evaluationUI?.evaluationMode
                        };
                    });
                    console.log('Contenido del modal:', modalContent);
                    
                    if (modalContent.tagCount > 0) {
                        console.log('\n🏷️ ETIQUETAS DETECTADAS: Sistema funcionando correctamente');
                    } else {
                        console.log('\n❌ ERROR: Modal abierto pero sin etiquetas');
                    }
                    
                } else {
                    console.log('\n❌ ERROR: Modal no se abrió');
                    
                    // Verificar errores en consola
                    const errors = await page.evaluate(() => {
                        return window.lastEvaluationError || 'No hay errores capturados';
                    });
                    console.log('Errores capturados:', errors);
                }
            }
        } else {
            console.log('\n❌ ERROR: No se encontraron botones de evaluación');
        }

        console.log('\n🔍 PASO 9: Diagnóstico final del sistema...');
        
        // Diagnóstico final completo
        const finalDiagnostic = await page.evaluate(() => {
            return {
                testApp: {
                    exists: !!window.TestApp,
                    currentUser: window.TestApp?.currentUser ? {
                        uid: window.TestApp.currentUser.uid,
                        displayName: window.TestApp.currentUser.displayName
                    } : null
                },
                evaluationUI: {
                    exists: !!window.evaluationUI,
                    currentEvaluation: window.evaluationUI?.currentEvaluation ? 'exists' : null,
                    evaluationMode: window.evaluationUI?.evaluationMode,
                    selectedTags: window.evaluationUI?.selectedTags?.length || 0
                },
                unifiedSystem: {
                    exists: !!window.UnifiedEvaluationSystem,
                    evaluations: window.UnifiedEvaluationSystem?.evaluations?.length || 0
                },
                storage: {
                    exists: !!window.Storage,
                    currentPerson: window.Storage?.getCurrentPerson() ? 'exists' : null,
                    matches: window.Storage?.getMatches()?.length || 0
                },
                firebase: {
                    exists: !!window.firebase,
                    firestore: !!window.firebase?.firestore
                }
            };
        });
        
        console.log('\n📊 DIAGNÓSTICO FINAL:');
        console.log(JSON.stringify(finalDiagnostic, null, 2));

        // Tomar screenshot final
        await page.screenshot({ path: 'test-results/evaluation-debug-final.png', fullPage: true });
        
        console.log('\n✅ Test de diagnóstico completado');
    });
});