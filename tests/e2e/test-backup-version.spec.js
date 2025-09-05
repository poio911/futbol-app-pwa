const { test, expect } = require('@playwright/test');

test('Test backup version functionality', async ({ page }) => {
  // Navigate to the backup version
  await page.goto('file:///C:/App.futbol-2%20-%20copia/index.html');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/backup-initial.png', fullPage: true });
  
  console.log('🔍 Testing backup version...');
  
  // Check if page loads properly
  const title = await page.title();
  console.log('Page title:', title);
  
  // Test collaborative screen access
  try {
    const collaborativeBtn = await page.locator('[data-screen="collaborative"]').first();
    if (await collaborativeBtn.isVisible()) {
      await collaborativeBtn.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Successfully switched to collaborative screen');
      await page.screenshot({ path: 'test-results/backup-collaborative.png', fullPage: true });
      
      // Check for all-matches container
      const allMatches = await page.locator('#all-matches');
      if (await allMatches.isVisible()) {
        const content = await allMatches.innerHTML();
        const textContent = await allMatches.textContent();
        
        console.log('All-matches container found');
        console.log('Text content length:', textContent.length);
        
        // Check for problematic text
        if (textContent.includes('grid') || textContent.includes('flex')) {
          console.log('⚠️ CSS values found in text content (this is the problem in main version)');
        } else {
          console.log('✅ No CSS values in text content - backup version works correctly');
        }
        
        // Try to create a match if button exists
        const createBtn = await page.locator('#create-match-btn');
        if (await createBtn.isVisible()) {
          console.log('Create match button found, attempting to create match...');
          
          await createBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if modal appears
          const modal = await page.locator('.modal-overlay').first();
          if (await modal.isVisible()) {
            console.log('✅ Create match modal opened successfully');
            
            // Fill form
            await page.fill('#match-title', 'Test Backup Match');
            await page.fill('#match-date', '2025-09-04');
            await page.fill('#match-time', '18:00');
            await page.fill('#match-location', 'Test Location Backup');
            
            // Submit
            const submitBtn = await page.locator('button:has-text("Crear")').first();
            if (await submitBtn.isVisible()) {
              await submitBtn.click();
              await page.waitForTimeout(3000);
              
              console.log('✅ Match creation attempted');
              
              // Check if match appears
              const updatedContent = await allMatches.textContent();
              if (updatedContent.includes('Test Backup Match')) {
                console.log('🎉 Match created and displayed successfully in backup version!');
              } else {
                console.log('❌ Match not displayed after creation');
              }
              
              await page.screenshot({ path: 'test-results/backup-after-match-creation.png', fullPage: true });
            }
          }
        } else {
          console.log('Create match button not found');
        }
      } else {
        console.log('All-matches container not found');
      }
    } else {
      console.log('Collaborative button not found');
    }
  } catch (error) {
    console.error('Error testing collaborative functionality:', error);
  }
  
  // Capture final state
  await page.screenshot({ path: 'test-results/backup-final.png', fullPage: true });
  
  // Get console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Wait a bit to collect logs
  await page.waitForTimeout(2000);
  
  console.log('\n📋 Browser console logs:');
  logs.forEach(log => console.log(log));
  
  // Check for errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  if (errors.length > 0) {
    console.log('\n❌ JavaScript errors:');
    errors.forEach(error => console.log(error));
  } else {
    console.log('\n✅ No JavaScript errors detected');
  }
});