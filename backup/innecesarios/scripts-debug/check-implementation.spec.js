const { test, expect } = require('@playwright/test');

test.describe('App.Futbol Implementation Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
  });

  test('Check implemented features', async ({ page }) => {
    console.log('=== CHECKING IMPLEMENTED FEATURES ===\n');
    
    // Check if auth screen exists
    const authScreen = await page.locator('#auth-screen').count();
    console.log(`✓ Auth Screen: ${authScreen > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Login if auth screen is visible
    if (authScreen > 0) {
      const isVisible = await page.locator('#auth-screen').isVisible();
      if (isVisible) {
        console.log('→ Attempting login...');
        await page.fill('input[type="email"]', 'poio911@hotmail.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button:has-text("Ingresar")');
        await page.waitForTimeout(3000);
      }
    }
    
    // Check Header Elements
    console.log('\n=== HEADER ELEMENTS ===');
    const headerExists = await page.locator('.app-header').count() > 0;
    console.log(`✓ Enhanced Header: ${headerExists}`);
    
    if (headerExists) {
      const userProfile = await page.locator('.user-profile').count() > 0;
      const notifications = await page.locator('.notifications-bell').count() > 0;
      const activityTicker = await page.locator('.activity-ticker').count() > 0;
      const headerStats = await page.locator('.header-stats').count() > 0;
      
      console.log(`  → User Profile: ${userProfile}`);
      console.log(`  → Notifications Bell: ${notifications}`);
      console.log(`  → Activity Ticker: ${activityTicker}`);
      console.log(`  → Header Stats: ${headerStats}`);
    }
    
    // Check Navigation
    console.log('\n=== NAVIGATION ===');
    const navButtons = await page.locator('.nav-grid button').count();
    console.log(`✓ Navigation Buttons: ${navButtons} found`);
    
    // List all nav buttons
    const buttons = await page.locator('.nav-grid button').all();
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`  → Button ${i+1}: ${text.trim()}`);
    }
    
    // Check Footer
    console.log('\n=== FOOTER ===');
    const footerExists = await page.locator('.app-footer').count() > 0;
    console.log(`✓ Enhanced Footer: ${footerExists}`);
    
    if (footerExists) {
      const credits = await page.locator('.footer-credits').textContent().catch(() => 'Not found');
      console.log(`  → Credits: ${credits.includes('Santiago López') ? 'Correct' : 'Missing'}`);
    }
    
    // Check User Dropdown
    console.log('\n=== USER DROPDOWN ===');
    const userProfileBtn = await page.locator('.user-profile').count();
    if (userProfileBtn > 0) {
      await page.click('.user-profile');
      await page.waitForTimeout(500);
      
      const dropdownVisible = await page.locator('.user-menu-dropdown').isVisible().catch(() => false);
      console.log(`✓ User Dropdown: ${dropdownVisible ? 'WORKS' : 'NOT WORKING'}`);
      
      if (dropdownVisible) {
        const menuItems = await page.locator('.user-menu-item').count();
        console.log(`  → Menu items: ${menuItems}`);
        
        // Try to click Mi Perfil
        const miPerfil = await page.locator('.user-menu-item:has-text("Mi Perfil")').count();
        if (miPerfil > 0) {
          console.log('  → Testing "Mi Perfil"...');
          await page.click('.user-menu-item:has-text("Mi Perfil")');
          await page.waitForTimeout(1000);
          
          // Check if modal appears
          const modalVisible = await page.locator('.ea-modal-overlay.show, #userModalOverlay, .modal-overlay').isVisible().catch(() => false);
          console.log(`    • Modal appears: ${modalVisible}`);
          
          if (modalVisible) {
            const modalTitle = await page.locator('.modal-title, #modalTitle').textContent().catch(() => 'Not found');
            console.log(`    • Modal title: ${modalTitle}`);
          }
        }
      }
    }
    
    // Check Modals
    console.log('\n=== MODALS ===');
    const eaModal = await page.locator('#ea-modal-overlay').count() > 0;
    const userModal = await page.locator('#userModalOverlay').count() > 0;
    console.log(`✓ EA Modal Overlay: ${eaModal}`);
    console.log(`✓ User Modal Overlay: ${userModal}`);
    
    // Check Evaluation System
    console.log('\n=== EVALUATION SYSTEM ===');
    await page.click('.nav-grid button:has-text("Evaluaciones")').catch(() => {});
    await page.waitForTimeout(1000);
    
    const evaluationSection = await page.locator('#evaluation-section').isVisible().catch(() => false);
    console.log(`✓ Evaluation Section: ${evaluationSection}`);
    
    console.log('\n=== END OF CHECK ===');
  });
});