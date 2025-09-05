const { test, expect } = require('@playwright/test');

test('Test PARTIDOS MANUALES in backup version', async ({ page }) => {
  // Navigate to backup version
  await page.goto('file:///C:/App.futbol-2%20-%20copia/index.html');
  
  // Wait for load
  await page.waitForTimeout(3000);
  
  console.log('🔍 Testing PARTIDOS MANUALES in backup version...');
  
  // Click on PARTIDOS MANUALES button
  const manualesBtn = await page.locator('[data-screen="matches"]');
  await expect(manualesBtn).toBeVisible();
  
  await manualesBtn.click();
  await page.waitForTimeout(2000);
  
  console.log('✅ Clicked on Partidos Manuales');
  
  // Take screenshot of manual matches screen
  await page.screenshot({ path: 'test-results/backup-partidos-manuales.png', fullPage: true });
  
  // Check if the matches screen is visible
  const matchesScreen = await page.locator('#matches-screen');
  if (await matchesScreen.isVisible()) {
    console.log('✅ Manual matches screen is visible');
    
    // Look for create match functionality - try different buttons
    let createMatchBtn = await page.locator('#create-match-btn');
    if (!(await createMatchBtn.isVisible())) {
      createMatchBtn = await page.locator('button:has-text("➕ Crear")').first();
    }
    if (!(await createMatchBtn.isVisible())) {
      createMatchBtn = await page.locator('button:has-text("Crear Partido")').first();
    }
    
    if (await createMatchBtn.isVisible()) {
      console.log('✅ Create match button found');
      
      // Click create match
      await createMatchBtn.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Clicked create match button, checking if modal opened...');
      
      await page.screenshot({ path: 'test-results/backup-after-click.png', fullPage: true });
      
      // First check if modal exists
      const modal = await page.locator('#create-match-modal');
      
      if (await modal.isVisible()) {
        console.log('✅ Modal is visible, scrolling within modal to find CREAR PARTIDO button...');
        
        // Scroll within the modal to find the CREAR PARTIDO button
        await modal.evaluate(element => element.scrollBy(0, 300));
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-results/backup-modal-scrolled.png', fullPage: true });
        
        // Look for the CREAR PARTIDO button within the modal
        const crearPartidoBtn = await modal.locator('button:has-text("CREAR PARTIDO"), button:has-text("🚀 Crear Partido")').first();
      
      if (await crearPartidoBtn.isVisible()) {
        console.log('✅ Found CREAR PARTIDO button, filling form first...');
        
        // Fill the form before clicking CREAR PARTIDO
        const titleField = await page.locator('#match-title, input[name="title"]').first();
        if (await titleField.isVisible()) {
          await titleField.fill('Test Manual Match Backup');
          console.log('✅ Filled title');
        }
        
        const dateField = await page.locator('#match-date, input[type="date"]').first();
        if (await dateField.isVisible()) {
          await dateField.fill('2025-09-04');
          console.log('✅ Filled date');
        }
        
        const timeField = await page.locator('#match-time, input[type="time"]').first();
        if (await timeField.isVisible()) {
          await timeField.fill('18:00');
          console.log('✅ Filled time');
        }
        
        const locationField = await page.locator('#match-location, input[name="location"]').first();
        if (await locationField.isVisible()) {
          await locationField.fill('Test Location Backup');
          console.log('✅ Filled location');
        }
        
        // Now click CREAR PARTIDO
        await crearPartidoBtn.click();
        await page.waitForTimeout(3000);
        
        console.log('✅ Clicked CREAR PARTIDO button');
        await page.screenshot({ path: 'test-results/backup-after-crear.png', fullPage: true });
        
        // Check if match was created
        const pageContent = await page.textContent('body');
        if (pageContent.includes('Test Manual Match Backup')) {
          console.log('🎉 MATCH CREATED SUCCESSFULLY IN BACKUP!');
          
          // Look for organizer buttons
          if (pageContent.includes('Borrar') || pageContent.includes('Finalizar') || pageContent.includes('Gestionar')) {
            console.log('✅ Organizer buttons found in backup version');
          } else {
            console.log('⚠️ Organizer buttons not found');
          }
        } else {
          console.log('❌ Match not found after creation');
        }
      } else {
        console.log('❌ CREAR PARTIDO button not found in modal');
      }
    } else {
      console.log('❌ Create match modal did not open');
    }
    } else {
      console.log('❌ Create match button not found');
    }
  } else {
    console.log('❌ Manual matches screen not visible');
  }
  
  // Final screenshot
  await page.screenshot({ path: 'test-results/backup-final-state.png', fullPage: true });
  
  // Get console output
  const logs = [];
  page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
  
  await page.waitForTimeout(1000);
  
  console.log('\n📋 Console logs from backup:');
  logs.forEach(log => console.log(log));
});