const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Testing for duplicate match history...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Navigate to Partidos Manuales section
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(2000);
    
    // Look for match history sections
    const historyAnalysis = await page.evaluate(() => {
        const historyElements = [];
        
        // Look for all elements containing "Historial" text
        const allElements = document.querySelectorAll('*');
        allElements.forEach((el, index) => {
            const text = el.textContent || '';
            if (text.includes('Historial de Partidos') || text.includes('📋 Historial')) {
                historyElements.push({
                    index: index,
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    textContent: text.substring(0, 100) + '...',
                    innerHTML: el.innerHTML.substring(0, 200) + '...',
                    rect: {
                        x: el.getBoundingClientRect().x,
                        y: el.getBoundingClientRect().y,
                        width: el.getBoundingClientRect().width,
                        height: el.getBoundingClientRect().height
                    }
                });
            }
        });
        
        // Also look for elements with specific IDs that might contain match history
        const historyContainers = [
            'match-history-container',
            'match-history-list', 
            'collaborative-matches-container',
            'matches-list',
            'history-container'
        ];
        
        const containers = [];
        historyContainers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                containers.push({
                    id: id,
                    exists: true,
                    visible: el.style.display !== 'none',
                    childrenCount: el.children.length,
                    textLength: el.textContent.length,
                    firstChild: el.firstElementChild ? el.firstElementChild.tagName : 'none'
                });
            } else {
                containers.push({
                    id: id,
                    exists: false
                });
            }
        });
        
        return {
            historyElements: historyElements,
            containers: containers
        };
    });
    
    console.log('\n🎯 ANALYSIS RESULTS:');
    console.log(`Found ${historyAnalysis.historyElements.length} elements containing "Historial"`);
    
    historyAnalysis.historyElements.forEach((el, i) => {
        console.log(`\n--- History Element ${i + 1} ---`);
        console.log(`Tag: ${el.tagName}#${el.id} .${el.className}`);
        console.log(`Position: (${el.rect.x}, ${el.rect.y}) Size: ${el.rect.width}x${el.rect.height}`);
        console.log(`Text: ${el.textContent}`);
        console.log(`HTML: ${el.innerHTML}`);
    });
    
    console.log('\n📦 CONTAINER ANALYSIS:');
    historyAnalysis.containers.forEach(container => {
        if (container.exists) {
            console.log(`✅ ${container.id}: Visible=${container.visible}, Children=${container.childrenCount}, Text=${container.textLength}chars`);
        } else {
            console.log(`❌ ${container.id}: Does not exist`);
        }
    });
    
    await page.waitForTimeout(5000); // Wait to see the page
    await browser.close();
    console.log('\n✅ Analysis complete - check results above');
})();