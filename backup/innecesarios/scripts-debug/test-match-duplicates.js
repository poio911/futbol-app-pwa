const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Testing for duplicate matches within history...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Navigate to Partidos Manuales section
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(3000);
    
    // Analyze match history list content
    const matchAnalysis = await page.evaluate(() => {
        const historyList = document.getElementById('match-history-list');
        if (!historyList) {
            return { error: 'No match history list found' };
        }
        
        const children = Array.from(historyList.children);
        const matchItems = [];
        
        children.forEach((child, index) => {
            const isMatchItem = child.classList.contains('match-history-item') || 
                               child.textContent.includes('vs') || 
                               child.textContent.includes('Finalizado') ||
                               child.textContent.includes('Pinochet') ||
                               child.textContent.includes('Club');
            
            if (isMatchItem) {
                // Extract match ID from onclick if present
                const onclick = child.getAttribute('onclick') || '';
                const matchIdMatch = onclick.match(/showMatchDetails\('([^']+)'\)/);
                const matchId = matchIdMatch ? matchIdMatch[1] : `unknown-${index}`;
                
                matchItems.push({
                    index: index,
                    matchId: matchId,
                    className: child.className,
                    textSnippet: child.textContent.substring(0, 100).replace(/\s+/g, ' ').trim(),
                    hasOnClick: !!onclick,
                    elementType: child.tagName,
                    childrenCount: child.children.length
                });
            }
        });
        
        // Look for duplicates by matchId
        const matchCounts = {};
        matchItems.forEach(item => {
            if (item.matchId !== 'unknown') {
                matchCounts[item.matchId] = (matchCounts[item.matchId] || 0) + 1;
            }
        });
        
        return {
            totalChildren: children.length,
            matchItems: matchItems,
            matchCounts: matchCounts,
            duplicates: Object.keys(matchCounts).filter(id => matchCounts[id] > 1)
        };
    });
    
    if (matchAnalysis.error) {
        console.log('❌ Error:', matchAnalysis.error);
        await browser.close();
        return;
    }
    
    console.log(`\n📊 MATCH ANALYSIS:`);
    console.log(`Total children in match-history-list: ${matchAnalysis.totalChildren}`);
    console.log(`Match items found: ${matchAnalysis.matchItems.length}`);
    console.log(`Duplicate match IDs: ${matchAnalysis.duplicates.length}`);
    
    if (matchAnalysis.duplicates.length > 0) {
        console.log(`\n🔴 DUPLICATES FOUND:`);
        matchAnalysis.duplicates.forEach(matchId => {
            console.log(`- ${matchId}: appears ${matchAnalysis.matchCounts[matchId]} times`);
        });
    }
    
    console.log(`\n📋 ALL MATCH ITEMS:`);
    matchAnalysis.matchItems.forEach((item, i) => {
        console.log(`${i + 1}. [${item.matchId}] ${item.textSnippet}`);
        console.log(`   Type: ${item.elementType}, Classes: ${item.className || 'none'}, Children: ${item.childrenCount}`);
    });
    
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('\n✅ Analysis complete');
})();