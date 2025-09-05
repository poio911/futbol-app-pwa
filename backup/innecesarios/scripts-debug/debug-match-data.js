const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Debugging match data structure...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Go to Partidos Manuales section
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(2000);
    
    // Capture the actual match data structure
    const matchData = await page.evaluate(() => {
        return new Promise((resolve) => {
            // Wait for Firebase to load and match data to be available
            setTimeout(async () => {
                if (window.db) {
                    try {
                        const snapshot = await window.db.collection('futbol_matches')
                            .orderBy('createdAt', 'desc')
                            .limit(2)
                            .get();
                        
                        const matches = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        
                        console.log('🔍 Raw match data from Firebase:', matches);
                        resolve(matches);
                    } catch (error) {
                        console.error('Firebase error:', error);
                        resolve([]);
                    }
                } else {
                    console.log('Firebase not loaded');
                    resolve([]);
                }
            }, 2000);
        });
    });
    
    console.log('\n🎯 MATCH DATA STRUCTURE:');
    if (matchData.length > 0) {
        matchData.forEach((match, i) => {
            console.log(`\n--- Match ${i + 1}: ${match.id} ---`);
            console.log('Available properties:');
            Object.keys(match).forEach(key => {
                const value = match[key];
                if (typeof value === 'object' && value !== null) {
                    console.log(`  ${key}:`, JSON.stringify(value, null, 4));
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            });
        });
        
        // Specifically check for team structure
        console.log('\n🏴 TEAM STRUCTURE ANALYSIS:');
        const firstMatch = matchData[0];
        
        if (firstMatch.teamA || firstMatch.teamB) {
            console.log('✅ Has teamA/teamB properties');
            console.log('TeamA structure:', JSON.stringify(firstMatch.teamA, null, 2));
            console.log('TeamB structure:', JSON.stringify(firstMatch.teamB, null, 2));
        } else {
            console.log('❌ No teamA/teamB properties found');
            
            // Check for alternative player storage
            const possiblePlayerFields = ['players', 'participants', 'selectedPlayers', 'team1', 'team2'];
            possiblePlayerFields.forEach(field => {
                if (firstMatch[field]) {
                    console.log(`Found player data in "${field}":`, JSON.stringify(firstMatch[field], null, 2));
                }
            });
        }
        
    } else {
        console.log('❌ No match data found');
    }
    
    await browser.close();
})();