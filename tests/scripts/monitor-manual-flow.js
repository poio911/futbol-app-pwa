const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logs
    page.on('console', msg => {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('[DOM]')) {
            console.log('PAGE LOG:', text);
        }
    });
    
    console.log('🔍 MONITORING MODE - I will watch what happens...');
    console.log('📋 Please perform these steps manually:');
    console.log('   1. Click on PARTIDOS MANUALES');
    console.log('   2. Click on CREAR NUEVO PARTIDO');
    console.log('   3. Fill the form and create match');
    console.log('   4. Select players and generate teams');
    console.log('');
    
    // Navigate to app
    await page.goto('http://localhost:8080');
    console.log('✅ App loaded - waiting for your actions...\n');
    
    // Monitor for changes every 2 seconds
    setInterval(async () => {
        try {
            const state = await page.evaluate(() => {
                const result = {
                    currentMatch: null,
                    localStorage: localStorage.getItem('activeManualMatch'),
                    activeScreen: null,
                    modalVisible: null,
                    buttons: [],
                    teamsDisplayed: false
                };
                
                // Check current match
                if (window.TestApp && window.TestApp.currentMatch) {
                    result.currentMatch = {
                        id: window.TestApp.currentMatch.id,
                        status: window.TestApp.currentMatch.status,
                        hasTeams: !!(window.TestApp.currentMatch.teamA && window.TestApp.currentMatch.teamB)
                    };
                }
                
                // Check active screen
                const activeScreen = document.querySelector('.screen.active');
                if (activeScreen) {
                    result.activeScreen = activeScreen.id;
                }
                
                // Check for modals
                const createModal = document.getElementById('create-manual-match-modal');
                if (createModal) {
                    result.modalVisible = createModal.style.display !== 'none' ? 'create-match' : null;
                }
                
                const playerModal = document.querySelector('[id*="player-selection"]');
                if (playerModal && playerModal.style.display !== 'none') {
                    result.modalVisible = 'player-selection';
                }
                
                // Check for visible buttons
                const visibleButtons = Array.from(document.querySelectorAll('button'))
                    .filter(btn => btn.offsetParent !== null)
                    .filter(btn => btn.textContent.includes('CREAR') || btn.textContent.includes('Generar'))
                    .map(btn => btn.textContent.trim());
                result.buttons = visibleButtons.slice(0, 5);
                
                // Check teams display
                const teamsDisplay = document.getElementById('teams-display');
                result.teamsDisplayed = teamsDisplay && teamsDisplay.innerHTML.length > 100;
                
                return result;
            });
            
            // Log only if something changed
            if (JSON.stringify(state) !== JSON.stringify(global.lastState)) {
                console.log('\n📊 STATE CHANGE:', JSON.stringify(state, null, 2));
                global.lastState = state;
            }
            
        } catch (e) {
            // Page might be navigating
        }
    }, 2000);
    
    // Monitor Firebase for new matches
    setInterval(async () => {
        try {
            const matches = await page.evaluate(async () => {
                if (!window.db) return null;
                
                const snapshot = await db.collection('futbol_matches')
                    .orderBy('createdAt', 'desc')
                    .limit(2)
                    .get();
                
                const results = [];
                snapshot.forEach(doc => {
                    results.push({
                        id: doc.id,
                        status: doc.data().status,
                        createdAt: doc.data().createdAt
                    });
                });
                return results;
            });
            
            if (matches && matches.length > 0) {
                if (JSON.stringify(matches) !== JSON.stringify(global.lastMatches)) {
                    console.log('\n🔥 FIREBASE MATCHES:', matches);
                    global.lastMatches = matches;
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }, 5000);
    
    // Keep running for 2 minutes
    await page.waitForTimeout(120000);
    
    console.log('\n✅ Monitoring complete!');
    await browser.close();
})();