const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Testing ALL possible history sources...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Navigate to Partidos Manuales section  
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(3000);
    
    // Comprehensive analysis of ALL elements that might show match history
    const fullAnalysis = await page.evaluate(() => {
        const results = {
            visibleSections: [],
            matchCards: [],
            textContaining: {
                'Pinochet': [],
                'United': [],
                'vs': [],
                'Finalizado': [],
                'Manual': []
            }
        };
        
        // Find all visible elements that might be sections showing matches
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 50 && rect.height > 30 && 
                             window.getComputedStyle(el).display !== 'none' &&
                             window.getComputedStyle(el).visibility !== 'hidden';
            
            if (!isVisible) return;
            
            const text = el.textContent || '';
            
            // Look for section-like elements
            if ((el.tagName === 'DIV' || el.tagName === 'SECTION') && 
                (text.includes('Historial') || text.includes('Partidos') || 
                 text.includes('Match') || el.id.includes('history') || 
                 el.id.includes('match'))) {
                
                results.visibleSections.push({
                    index: index,
                    tagName: el.tagName,
                    id: el.id || 'no-id',
                    className: el.className || 'no-class',
                    position: `${Math.round(rect.x)},${Math.round(rect.y)}`,
                    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
                    childrenCount: el.children.length,
                    textLength: text.length,
                    textStart: text.substring(0, 80).replace(/\\s+/g, ' ').trim()
                });
            }
            
            // Look for match-like content
            if (text.includes('Pinochet') || text.includes('United') || 
                text.includes('Club') || text.includes('Finalizado')) {
                
                results.matchCards.push({
                    index: index,
                    tagName: el.tagName,
                    id: el.id || 'no-id',
                    className: el.className || 'no-class',
                    position: `${Math.round(rect.x)},${Math.round(rect.y)}`,
                    textSnippet: text.substring(0, 100).replace(/\\s+/g, ' ').trim(),
                    parentId: el.parentElement ? el.parentElement.id || 'no-parent-id' : 'no-parent'
                });
            }
            
            // Categorize by text content
            Object.keys(results.textContaining).forEach(keyword => {
                if (text.includes(keyword)) {
                    results.textContaining[keyword].push({
                        tagName: el.tagName,
                        id: el.id || 'no-id',
                        className: el.className?.substring(0, 30) || 'no-class',
                        position: `${Math.round(rect.x)},${Math.round(rect.y)}`
                    });
                }
            });
        });
        
        return results;
    });
    
    console.log(`\\n📊 COMPREHENSIVE ANALYSIS:`);
    
    console.log(`\\n🗂️ VISIBLE SECTIONS (${fullAnalysis.visibleSections.length}):`);
    fullAnalysis.visibleSections.forEach((section, i) => {
        console.log(`${i + 1}. ${section.tagName}#${section.id} .${section.className}`);
        console.log(`   Position: ${section.position}, Size: ${section.size}`);
        console.log(`   Children: ${section.childrenCount}, Text: ${section.textLength}chars`);
        console.log(`   Text: "${section.textStart}"`);
        console.log('');
    });
    
    console.log(`\\n⚽ MATCH CARDS FOUND (${fullAnalysis.matchCards.length}):`);
    fullAnalysis.matchCards.forEach((card, i) => {
        console.log(`${i + 1}. ${card.tagName}#${card.id} at ${card.position}`);
        console.log(`   Parent: ${card.parentId}`);  
        console.log(`   Text: "${card.textSnippet}"`);
        console.log('');
    });
    
    console.log(`\\n🔍 TEXT CONTENT ANALYSIS:`);
    Object.keys(fullAnalysis.textContaining).forEach(keyword => {
        const items = fullAnalysis.textContaining[keyword];
        console.log(`"${keyword}": ${items.length} elements`);
        items.slice(0, 3).forEach(item => {
            console.log(`  - ${item.tagName}#${item.id} at ${item.position}`);
        });
    });
    
    await page.waitForTimeout(10000); // Longer wait to inspect
    await browser.close();
    console.log('\\n✅ Full analysis complete');
})();