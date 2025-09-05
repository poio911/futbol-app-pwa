const { chromium } = require('playwright');

(async () => {
    console.log('🎯 Testing full match creation cycle to reproduce duplicate history...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Navigate to Partidos Manuales
    console.log('📱 Navigating to Partidos Manuales...');
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'step1-initial.png' });
    console.log('📸 Step 1: Initial state captured');
    
    // Count initial history sections
    let historyCount = await page.evaluate(() => {
        const historySections = document.querySelectorAll('*');
        let count = 0;
        historySections.forEach(el => {
            if (el.textContent && el.textContent.includes('📋 Historial de Partidos')) {
                count++;
            }
        });
        return count;
    });
    console.log(`📊 Initial history sections: ${historyCount}`);
    
    // Click Create New Match
    console.log('🎮 Creating new match...');
    await page.click('button:has-text("CREAR NUEVO PARTIDO")');
    await page.waitForTimeout(1000);
    
    // Fill match details and save
    await page.click('button:has-text("Guardar y Continuar")');
    await page.waitForTimeout(1000);
    
    // Select players (click on first 10 players)
    console.log('👥 Selecting players...');
    const playerButtons = await page.locator('.player-card').first(10);
    for (let i = 0; i < 10; i++) {
        try {
            await page.locator('.player-card').nth(i).click();
            await page.waitForTimeout(200);
        } catch (e) {
            console.log(`Player ${i} not clickable, continuing...`);
        }
    }
    
    // Generate teams
    console.log('⚡ Generating teams...');
    await page.click('button:has-text("Generar Equipos")');
    await page.waitForTimeout(3000);
    
    // Take screenshot after teams generated
    await page.screenshot({ path: 'step2-teams-generated.png' });
    console.log('📸 Step 2: Teams generated captured');
    
    // Save match
    console.log('💾 Saving match...');
    try {
        await page.click('button:has-text("Guardar Partido")');
        await page.waitForTimeout(2000);
    } catch (e) {
        console.log('Save button not found, looking for alternatives...');
        await page.screenshot({ path: 'step2b-looking-for-save.png' });
    }
    
    // Check history count after saving
    historyCount = await page.evaluate(() => {
        const historySections = document.querySelectorAll('*');
        let count = 0;
        historySections.forEach(el => {
            if (el.textContent && el.textContent.includes('📋 Historial de Partidos')) {
                count++;
            }
        });
        return count;
    });
    console.log(`📊 History sections after saving: ${historyCount}`);
    
    // Take screenshot after saving
    await page.screenshot({ path: 'step3-after-saving.png' });
    console.log('📸 Step 3: After saving captured');
    
    // Try to finalize the match
    console.log('🏁 Trying to finalize match...');
    try {
        // Look for finish/finalize buttons
        const finishButton = page.locator('button:has-text("Finalizar")');
        if (await finishButton.count() > 0) {
            await finishButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Match finalized!');
        } else {
            console.log('❌ No finalize button found');
        }
    } catch (e) {
        console.log('Error finalizing:', e.message);
    }
    
    // Final history count check
    historyCount = await page.evaluate(() => {
        const historySections = document.querySelectorAll('*');
        let count = 0;
        const sections = [];
        historySections.forEach(el => {
            if (el.textContent && el.textContent.includes('📋 Historial de Partidos')) {
                count++;
                sections.push({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    rect: el.getBoundingClientRect()
                });
            }
        });
        return { count, sections };
    });
    
    console.log(`📊 Final history sections: ${historyCount.count}`);
    if (historyCount.count > 1) {
        console.log('🔴 DUPLICATE FOUND! Details:');
        historyCount.sections.forEach((section, i) => {
            console.log(`  ${i + 1}. ${section.tag}#${section.id} .${section.className} at (${section.rect.x}, ${section.rect.y})`);
        });
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'step4-final.png', fullPage: true });
    console.log('📸 Step 4: Final state captured');
    
    await page.waitForTimeout(10000); // Wait to see the result
    await browser.close();
    console.log('✅ Full match cycle test complete - check screenshots and logs above');
})();