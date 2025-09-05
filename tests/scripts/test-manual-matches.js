const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    
    try {
        console.log('🔍 Testing manual matches functionality...');
        
        // Navigate to app
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);
        
        // Click on Partidos Manuales
        console.log('📍 Clicking on Partidos Manuales...');
        await page.click('text=PARTIDOS MANUALES');
        await page.waitForTimeout(1000);
        
        // Check if TestApp is available
        const hasTestApp = await page.evaluate(() => {
            return typeof window.TestApp !== 'undefined';
        });
        console.log('✅ TestApp available:', hasTestApp);
        
        // Get TestApp state
        const testAppState = await page.evaluate(() => {
            if (typeof window.TestApp === 'undefined') return null;
            return {
                currentMatch: window.TestApp.currentMatch,
                matchHistory: window.TestApp.matchHistory?.length || 0,
                matchConfig: window.TestApp.matchConfig,
                localStorage: localStorage.getItem('activeManualMatch')
            };
        });
        console.log('📊 TestApp state:', testAppState);
        
        // Try to create a new match
        console.log('🎯 Attempting to create new match...');
        
        // Try different selectors for create button
        const selectors = [
            'button:has-text("CREAR NUEVO PARTIDO")',
            '.btn-unified:has-text("CREAR NUEVO")',
            'button.btn-primary',
            '[onclick*="openCreateManual"]',
            '#create-manual-match-btn'
        ];
        
        let createButton = null;
        for (const selector of selectors) {
            try {
                createButton = await page.$(selector);
                if (createButton) {
                    console.log(`✅ Found button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`❌ Selector failed: ${selector}`);
            }
        }
        
        if (createButton) {
            console.log('✅ Found create button, clicking...');
            await createButton.click();
            await page.waitForTimeout(2000);
            
            // Check if modal opened
            const modalVisible = await page.isVisible('#create-manual-match-modal');
            console.log('📋 Modal visible:', modalVisible);
            
            if (modalVisible) {
                // Fill form
                console.log('📝 Filling match form...');
                await page.fill('input[name="date"]', '2025-09-03');
                await page.fill('input[name="time"]', '21:00');
                await page.fill('input[name="location"]', 'Test Field');
                await page.selectOption('select[name="format"]', '5v5');
                
                // Click create
                await page.click('button:has-text("Crear Partido")');
                await page.waitForTimeout(2000);
                
                // Check if player selection opened
                const playerModalVisible = await page.isVisible('text=Seleccionar Jugadores');
                console.log('👥 Player selection visible:', playerModalVisible);
            }
        } else {
            console.log('❌ Create button not found');
        }
        
        // Check for any errors
        const errors = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error, [class*="error"]');
            return Array.from(errorElements).map(el => el.textContent);
        });
        
        if (errors.length > 0) {
            console.log('⚠️ Errors found:', errors);
        }
        
        // Get final state
        const finalState = await page.evaluate(() => {
            return {
                currentMatch: window.TestApp?.currentMatch,
                localStorage: localStorage.getItem('activeManualMatch'),
                matchActions: document.getElementById('match-actions-generated')?.style.display,
                teamsDisplay: document.getElementById('teams-display')?.innerHTML
            };
        });
        console.log('📊 Final state:', finalState);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    // Keep browser open for inspection
    console.log('✅ Test complete. Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
    
    await browser.close();
})();