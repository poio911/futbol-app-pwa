const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logs
    page.on('console', msg => {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('[DOM]')) {
            console.log('PAGE:', text);
        }
    });
    
    try {
        console.log('🔍 Testing manual match creation flow...');
        
        // Navigate to app
        await page.goto('http://localhost:8080');
        console.log('✅ App loaded');
        await page.waitForTimeout(3000);
        
        // Clear any existing active match from localStorage
        await page.evaluate(() => {
            localStorage.removeItem('activeManualMatch');
            if (window.TestApp) {
                window.TestApp.currentMatch = null;
            }
            console.log('✅ Cleared any existing active match');
        });
        
        // Step 1: Click on "PARTIDOS MANUALES"
        console.log('📍 Step 1: Clicking on PARTIDOS MANUALES...');
        
        // Try different selectors for the manual matches card
        const selectors = [
            'text=PARTIDOS MANUALES',
            '.quick-action-card:has-text("PARTIDOS MANUALES")',
            '[onclick*="matches"]'
        ];
        
        let clicked = false;
        for (const selector of selectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    console.log(`✅ Clicked using selector: ${selector}`);
                    clicked = true;
                    break;
                }
            } catch (e) {
                console.log(`   Selector didn't work: ${selector}`);
            }
        }
        
        if (!clicked) {
            console.log('❌ Could not find PARTIDOS MANUALES button');
            return;
        }
        
        await page.waitForTimeout(2000);
        
        // Step 2: Click on "CREAR NUEVO PARTIDO"
        console.log('📍 Step 2: Looking for CREAR NUEVO PARTIDO button...');
        
        // Look for the create button
        const createSelectors = [
            'button:has-text("CREAR NUEVO PARTIDO")',
            '.btn-primary:has-text("CREAR NUEVO")',
            'button.btn-unified.btn-primary'
        ];
        
        clicked = false;
        for (const selector of createSelectors) {
            try {
                const button = await page.$(selector);
                if (button && await button.isVisible()) {
                    await button.click();
                    console.log(`✅ Clicked CREAR NUEVO PARTIDO with: ${selector}`);
                    clicked = true;
                    break;
                }
            } catch (e) {
                console.log(`   Button selector didn't work: ${selector}`);
            }
        }
        
        if (!clicked) {
            // Try calling the function directly
            console.log('⚠️ Button not found, trying direct function call...');
            await page.evaluate(() => {
                if (window.TestApp && window.TestApp.openCreateManualMatchModal) {
                    window.TestApp.openCreateManualMatchModal();
                    console.log('✅ Called openCreateManualMatchModal directly');
                } else {
                    console.log('❌ Function openCreateManualMatchModal not found');
                }
            });
        }
        
        await page.waitForTimeout(2000);
        
        // Step 3: Fill the match creation form
        console.log('📍 Step 3: Filling match creation form...');
        
        const modalVisible = await page.isVisible('#create-manual-match-modal');
        console.log(`   Modal visible: ${modalVisible}`);
        
        if (modalVisible) {
            // Fill date
            const dateInput = await page.$('input[name="date"]');
            if (dateInput) {
                await dateInput.fill('2025-09-04');
                console.log('✅ Date set to 2025-09-04');
            }
            
            // Fill time
            const timeInput = await page.$('input[name="time"]');
            if (timeInput) {
                await timeInput.fill('20:00');
                console.log('✅ Time set to 20:00');
            }
            
            // Fill location
            const locationInput = await page.$('input[name="location"]');
            if (locationInput) {
                await locationInput.fill('Cancha Test');
                console.log('✅ Location set to Cancha Test');
            }
            
            // Select format 5v5
            const formatSelect = await page.$('select[name="format"]');
            if (formatSelect) {
                await formatSelect.selectOption('5v5');
                console.log('✅ Format set to 5v5');
            }
            
            // Click "Crear Partido" button in modal
            console.log('📍 Step 4: Clicking Crear Partido in modal...');
            
            const createInModalBtn = await page.$('#create-manual-match-modal button:has-text("Crear Partido")');
            if (createInModalBtn) {
                await createInModalBtn.click();
                console.log('✅ Clicked Crear Partido');
            } else {
                // Try calling directly
                await page.evaluate(() => {
                    if (window.TestApp && window.TestApp.createManualMatchFromModal) {
                        window.TestApp.createManualMatchFromModal();
                        console.log('✅ Called createManualMatchFromModal directly');
                    }
                });
            }
        } else {
            console.log('❌ Modal not visible, cannot fill form');
        }
        
        await page.waitForTimeout(2000);
        
        // Step 5: Select 10 players
        console.log('📍 Step 5: Selecting players...');
        
        // Check if player selection modal is visible
        const playerSelectionVisible = await page.isVisible('text=Seleccionar Jugadores');
        console.log(`   Player selection visible: ${playerSelectionVisible}`);
        
        if (playerSelectionVisible) {
            // Select first 10 players
            const checkboxes = await page.$$('input[type="checkbox"][id^="player-"]');
            console.log(`   Found ${checkboxes.length} player checkboxes`);
            
            let selectedCount = 0;
            for (let i = 0; i < checkboxes.length && selectedCount < 10; i++) {
                const isChecked = await checkboxes[i].isChecked();
                if (!isChecked) {
                    await checkboxes[i].click();
                    selectedCount++;
                    console.log(`   ✅ Selected player ${selectedCount}/10`);
                }
            }
            
            // Step 6: Click "Generar Equipos"
            console.log('📍 Step 6: Clicking Generar Equipos...');
            
            // Scroll modal to see the button
            await page.evaluate(() => {
                const modal = document.querySelector('.modal-content, [class*="modal"]');
                if (modal) {
                    modal.scrollTop = modal.scrollHeight;
                }
            });
            
            await page.waitForTimeout(500);
            
            const generateBtn = await page.$('button:has-text("Generar Equipos")');
            if (generateBtn) {
                await generateBtn.click();
                console.log('✅ Clicked Generar Equipos');
            } else {
                console.log('❌ Generar Equipos button not found');
            }
        } else {
            console.log('❌ Player selection modal not visible');
        }
        
        await page.waitForTimeout(3000);
        
        // Check final state
        console.log('📍 Checking final state...');
        
        const state = await page.evaluate(() => {
            const result = {
                currentMatch: null,
                localStorage: localStorage.getItem('activeManualMatch'),
                teamsDisplayed: false,
                matchActionsVisible: false,
                matchesInFirebase: []
            };
            
            // Get current match
            if (window.TestApp && window.TestApp.currentMatch) {
                result.currentMatch = {
                    id: window.TestApp.currentMatch.id,
                    status: window.TestApp.currentMatch.status,
                    teamA: window.TestApp.currentMatch.teamA?.name,
                    teamB: window.TestApp.currentMatch.teamB?.name
                };
            }
            
            // Check teams display
            const teamsDisplay = document.getElementById('teams-display');
            result.teamsDisplayed = teamsDisplay && teamsDisplay.innerHTML.length > 100;
            
            // Check match actions
            const matchActions = document.getElementById('match-actions-generated');
            result.matchActionsVisible = matchActions && matchActions.style.display !== 'none';
            
            return result;
        });
        
        console.log('✅ Final state:', JSON.stringify(state, null, 2));
        
        // Check Firebase for duplicates
        const firebaseMatches = await page.evaluate(async () => {
            if (!window.db) return 'No Firebase';
            
            try {
                const snapshot = await db.collection('futbol_matches')
                    .orderBy('createdAt', 'desc')
                    .limit(3)
                    .get();
                
                const matches = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    matches.push({
                        id: doc.id,
                        name: data.name,
                        status: data.status,
                        createdAt: data.createdAt
                    });
                });
                return matches;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        });
        
        console.log('🔥 Firebase matches:', firebaseMatches);
        
        // Verify no duplicates
        if (Array.isArray(firebaseMatches)) {
            const uniqueIds = new Set(firebaseMatches.map(m => m.id));
            if (uniqueIds.size < firebaseMatches.length) {
                console.log('⚠️ WARNING: Duplicate matches detected in Firebase!');
            } else {
                console.log('✅ No duplicates in Firebase');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('✅ Test complete. Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();