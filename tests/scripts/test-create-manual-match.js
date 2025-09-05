const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logs
    page.on('console', msg => {
        if (!msg.text().includes('Failed to load resource')) {
            console.log('PAGE:', msg.text());
        }
    });
    
    try {
        console.log('🔍 Testing manual match creation...');
        
        // Navigate to app
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(3000);
        
        // Clear any existing active match from localStorage
        await page.evaluate(() => {
            localStorage.removeItem('activeManualMatch');
            if (window.TestApp) {
                window.TestApp.currentMatch = null;
            }
            console.log('✅ Cleared any existing active match');
        });
        
        // Click on Partidos Manuales
        console.log('📍 Navigating to Partidos Manuales...');
        const manualMatchesBtn = await page.$('div.quick-action-card:has-text("PARTIDOS MANUALES")');
        if (manualMatchesBtn) {
            await manualMatchesBtn.click();
            console.log('✅ Clicked on Partidos Manuales card');
        } else {
            console.log('❌ Could not find Partidos Manuales button');
            return;
        }
        
        await page.waitForTimeout(2000);
        
        // Look for the create button - it should be visible now
        console.log('🔍 Looking for create match button...');
        
        // The button might be rendered dynamically, let's check what's in the matches section
        const matchesContent = await page.evaluate(() => {
            const matchesSection = document.getElementById('matches');
            if (!matchesSection) return 'No matches section';
            
            // Look for any button with "CREAR" or "NUEVO"
            const buttons = Array.from(matchesSection.querySelectorAll('button')).map(btn => ({
                text: btn.textContent.trim(),
                onclick: btn.getAttribute('onclick'),
                visible: btn.offsetParent !== null
            }));
            
            return {
                visible: matchesSection.style.display !== 'none',
                buttons: buttons.filter(b => b.text.includes('CREAR') || b.text.includes('NUEVO'))
            };
        });
        
        console.log('📋 Matches section:', matchesContent);
        
        // Try to open create modal directly via JavaScript
        console.log('🎯 Opening create modal directly...');
        await page.evaluate(() => {
            if (window.TestApp && window.TestApp.openCreateManualMatchModal) {
                window.TestApp.openCreateManualMatchModal();
                console.log('✅ Called openCreateManualMatchModal');
            } else {
                console.log('❌ openCreateManualMatchModal not found');
            }
        });
        
        await page.waitForTimeout(2000);
        
        // Check if modal opened
        const modalVisible = await page.isVisible('#create-manual-match-modal');
        console.log('📋 Create match modal visible:', modalVisible);
        
        if (modalVisible) {
            console.log('📝 Filling match details...');
            
            // Fill the form
            await page.fill('input[name="date"]', '2025-09-04');
            await page.fill('input[name="time"]', '20:00');
            await page.fill('input[name="location"]', 'Cancha Test');
            await page.selectOption('select[name="format"]', '5v5');
            
            // Click create button IN THE MODAL
            console.log('🔍 Looking for create button in modal...');
            
            // Scroll down in the modal to see the button
            await page.evaluate(() => {
                const modal = document.querySelector('#create-manual-match-modal .unified-modal-content');
                if (modal) {
                    modal.scrollTop = modal.scrollHeight;
                    console.log('✅ Scrolled modal to bottom');
                }
            });
            
            await page.waitForTimeout(500);
            
            // Click the create button
            const createBtn = await page.$('#create-manual-match-modal button:has-text("Crear Partido")');
            if (createBtn) {
                await createBtn.click();
                console.log('✅ Clicked Crear Partido button');
            } else {
                console.log('❌ Could not find Crear Partido button');
            }
            
            await page.waitForTimeout(2000);
            
            // Check if player selection modal opened
            const playerSelectionVisible = await page.isVisible('text=Seleccionar Jugadores');
            console.log('👥 Player selection modal visible:', playerSelectionVisible);
            
            if (playerSelectionVisible) {
                console.log('✅ Player selection modal opened!');
                
                // Select some players
                const playerCheckboxes = await page.$$('input[type="checkbox"][id^="player-"]');
                console.log(`📋 Found ${playerCheckboxes.length} player checkboxes`);
                
                // Select first 10 players
                for (let i = 0; i < Math.min(10, playerCheckboxes.length); i++) {
                    await playerCheckboxes[i].click();
                    console.log(`✅ Selected player ${i + 1}`);
                }
                
                await page.waitForTimeout(1000);
                
                // Scroll to find the generate teams button
                await page.evaluate(() => {
                    const modal = document.querySelector('.modal-content, [class*="modal"]');
                    if (modal) {
                        modal.scrollTop = modal.scrollHeight;
                        console.log('✅ Scrolled player selection modal');
                    }
                });
                
                // Click generate teams button
                const generateBtn = await page.$('button:has-text("Generar Equipos")');
                if (generateBtn) {
                    await generateBtn.click();
                    console.log('✅ Clicked Generar Equipos');
                } else {
                    console.log('❌ Could not find Generar Equipos button');
                }
            }
        }
        
        await page.waitForTimeout(3000);
        
        // Check final state
        const finalState = await page.evaluate(() => {
            return {
                currentMatch: window.TestApp?.currentMatch,
                localStorage: localStorage.getItem('activeManualMatch'),
                teamsVisible: !!document.querySelector('#teams-display')?.innerHTML,
                matchActionsVisible: document.getElementById('match-actions-generated')?.style.display
            };
        });
        
        console.log('✅ Final state:', finalState);
        
        // Check Firebase for duplicates
        const firebaseCheck = await page.evaluate(async () => {
            if (!window.db) return 'No Firebase connection';
            
            try {
                const snapshot = await db.collection('futbol_matches')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get();
                
                const matches = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    matches.push({
                        id: doc.id,
                        name: data.name,
                        createdAt: data.createdAt,
                        status: data.status
                    });
                });
                
                return matches;
            } catch (error) {
                return `Error: ${error.message}`;
            }
        });
        
        console.log('🔥 Firebase matches:', firebaseCheck);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('✅ Test complete. Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();