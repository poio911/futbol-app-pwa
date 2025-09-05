const { chromium } = require('playwright');

(async () => {
    console.log('📸 Taking screenshot to see duplicate history...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Navigate to Partidos Manuales section
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({ 
        path: 'match-history-screenshot.png', 
        fullPage: true 
    });
    
    console.log('📸 Screenshot saved as match-history-screenshot.png');
    
    // Also scroll down to make sure we see everything
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
        path: 'match-history-bottom.png', 
        fullPage: true 
    });
    
    console.log('📸 Bottom screenshot saved as match-history-bottom.png');
    
    await page.waitForTimeout(5000);
    await browser.close();
})();