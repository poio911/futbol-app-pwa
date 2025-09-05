const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Testing manual matches view...');
        
        // Navigate to app
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(3000);
        
        // Click on Partidos Manuales
        console.log('📍 Clicking on Partidos Manuales...');
        await page.click('text=PARTIDOS MANUALES');
        await page.waitForTimeout(2000);
        
        // Check what's visible in the manual matches section
        const manualMatchesContent = await page.evaluate(() => {
            const content = document.querySelector('.partidos-manuales-content');
            if (!content) return 'No content found';
            
            return {
                visible: content.style.display !== 'none',
                innerHTML: content.innerHTML.substring(0, 500),
                buttons: Array.from(content.querySelectorAll('button')).map(btn => ({
                    text: btn.textContent.trim(),
                    onclick: btn.getAttribute('onclick'),
                    className: btn.className
                }))
            };
        });
        
        console.log('📋 Manual matches content:', manualMatchesContent);
        
        // Try to call TestApp functions directly
        const testAppFunctions = await page.evaluate(() => {
            if (typeof window.TestApp === 'undefined') return 'TestApp not found';
            
            // Try to open modal directly
            if (window.TestApp.openCreateManualMatchModal) {
                console.log('Opening modal directly...');
                window.TestApp.openCreateManualMatchModal();
                return 'Modal opened via function';
            }
            
            return {
                hasOpenModal: !!window.TestApp.openCreateManualMatchModal,
                hasCreateMatch: !!window.TestApp.createManualMatchFromModal,
                currentMatch: window.TestApp.currentMatch,
                functions: Object.keys(window.TestApp).filter(k => typeof window.TestApp[k] === 'function').slice(0, 10)
            };
        });
        
        console.log('🔧 TestApp functions:', testAppFunctions);
        
        await page.waitForTimeout(5000);
        
        // Check if modal is now visible
        const modalCheck = await page.evaluate(() => {
            const modal = document.getElementById('create-manual-match-modal');
            return {
                exists: !!modal,
                visible: modal ? modal.style.display !== 'none' : false,
                content: modal ? modal.innerHTML.substring(0, 200) : null
            };
        });
        
        console.log('📋 Modal check:', modalCheck);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('✅ Test complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();