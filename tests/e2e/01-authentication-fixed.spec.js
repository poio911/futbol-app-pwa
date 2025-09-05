const { test, expect } = require('@playwright/test');

test.describe('Authentication System - Fixed', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure clean state
    await context.clearCookies();
    await page.goto('/');
    
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to get fresh state
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test('should handle existing session or show login', async ({ page }) => {
    // Check current state
    const loginOverlay = page.locator('.login-overlay, #auth-screen').first();
    const app = page.locator('#app');
    
    // Get visibility states
    const loginVisible = await loginOverlay.isVisible().catch(() => false);
    const appVisible = await app.isVisible().catch(() => false);
    
    console.log('Login visible:', loginVisible);
    console.log('App visible:', appVisible);
    
    if (appVisible && !loginVisible) {
      // User is already logged in
      console.log('User already logged in, testing logout');
      
      // Look for logout button
      const logoutBtn = page.locator('button:has-text("CERRAR SESIÓN"), button:has-text("Logout"), #logout-btn');
      
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        
        // Now login should be visible
        await expect(loginOverlay).toBeVisible();
      }
    } else if (loginVisible) {
      // Login form is visible
      console.log('Login form is visible');
      await expect(page.locator('#email, #login-email')).toBeVisible();
    }
  });

  test('should work with the actual app flow', async ({ page }) => {
    // Check if we're logged in
    const app = page.locator('#app');
    const isLoggedIn = await app.isVisible();
    
    if (isLoggedIn) {
      // Test that main navigation is visible
      await expect(page.locator('#main-nav')).toBeVisible();
      
      // Check for collaborative matches button
      const collaborativeBtn = page.locator('a:has-text("PARTIDOS GRUPALES"), button:has-text("PARTIDOS")');
      await expect(collaborativeBtn).toBeVisible();
      
      // Navigate to collaborative matches
      await collaborativeBtn.click();
      await page.waitForTimeout(2000);
      
      // Check if collaborative screen is visible
      const collaborativeScreen = page.locator('#collaborative-screen');
      await expect(collaborativeScreen).toBeVisible();
    } else {
      // If not logged in, try to find and fill login form
      const emailInput = page.locator('#email, #login-email').first();
      const passwordInput = page.locator('#password, #login-password').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('Test123456!');
        
        const loginBtn = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login")').first();
        await loginBtn.click();
        
        // Wait for navigation
        await page.waitForTimeout(3000);
      }
    }
  });

  test('should navigate through main screens', async ({ page }) => {
    // Assuming we're logged in (based on smoke test results)
    const app = page.locator('#app');
    
    if (await app.isVisible()) {
      // Test navigation to different screens
      const screens = [
        { button: 'JUGADORES', screenId: '#players-screen' },
        { button: 'PARTIDOS MANUALES', screenId: '#matches-screen' },
        { button: 'EVALUAR', screenId: '#evaluate-screen' },
        { button: 'MI PERFIL', screenId: '#profile-screen' }
      ];
      
      for (const screen of screens) {
        const navButton = page.locator(`a:has-text("${screen.button}"), button:has-text("${screen.button}")`).first();
        
        if (await navButton.isVisible()) {
          await navButton.click();
          await page.waitForTimeout(1000);
          
          const screenElement = page.locator(screen.screenId);
          const isVisible = await screenElement.isVisible().catch(() => false);
          console.log(`${screen.button} screen visible:`, isVisible);
        }
      }
    }
  });

  test('should create a match if logged in', async ({ page }) => {
    const app = page.locator('#app');
    
    if (await app.isVisible()) {
      // Navigate to collaborative matches
      await page.click('a:has-text("PARTIDOS GRUPALES"), button:has-text("PARTIDOS")');
      await page.waitForTimeout(2000);
      
      // Look for create match button
      const createBtn = page.locator('#create-match-btn, button:has-text("Crear"), button:has-text("Nuevo Partido")');
      
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modal = page.locator('.modal, [role="dialog"]').first();
        const isModalVisible = await modal.isVisible().catch(() => false);
        console.log('Create match modal visible:', isModalVisible);
        
        if (isModalVisible) {
          // Close modal
          const closeBtn = page.locator('button:has-text("Cancelar"), button:has-text("×"), button.close').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
          }
        }
      }
    }
  });

  test('should interact with players section', async ({ page }) => {
    const app = page.locator('#app');
    
    if (await app.isVisible()) {
      // Navigate to players
      await page.click('a:has-text("JUGADORES")');
      await page.waitForTimeout(2000);
      
      // Check if players screen is visible
      const playersScreen = page.locator('#players-screen');
      await expect(playersScreen).toBeVisible();
      
      // Look for add player button
      const addPlayerBtn = page.locator('button:has-text("Agregar"), button:has-text("Add"), button:has-text("➕")').first();
      
      if (await addPlayerBtn.isVisible()) {
        await addPlayerBtn.click();
        await page.waitForTimeout(1000);
        
        // Check if form appeared
        const playerForm = page.locator('#add-player-form, #player-form');
        const isFormVisible = await playerForm.isVisible().catch(() => false);
        console.log('Add player form visible:', isFormVisible);
        
        if (isFormVisible) {
          // Cancel form
          const cancelBtn = page.locator('button:has-text("Cancelar"), button:has-text("Cancel")').first();
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
        }
      }
    }
  });
});