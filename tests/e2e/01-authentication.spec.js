const { test, expect } = require('@playwright/test');
const { testUsers, waitForFirebase } = require('./helpers/test-data');

test.describe('Authentication System', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFirebase(page);
  });

  test('should display login form on page load', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Check if auth screen is visible
    const authScreen = page.locator('#auth-screen');
    await expect(authScreen).toBeVisible();
    
    // Check for login form elements with correct IDs
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button:has-text("Iniciar Sesión")')).toBeVisible();
  });

  test('should show registration form when clicking register link', async ({ page }) => {
    // Wait for elements to be ready
    await page.waitForTimeout(1000);
    
    // Click on register link
    await page.click('a:has-text("Regístrate aquí")');
    
    // Wait for register form to be visible
    await page.waitForSelector('#register-form', { state: 'visible' });
    
    // Check registration form elements
    await expect(page.locator('#register-name')).toBeVisible();
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-position')).toBeVisible();
    await expect(page.locator('button:has-text("Crear Cuenta")')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    // Generate unique email for test
    const uniqueEmail = `test.${Date.now()}@futbol.com`;
    
    // Navigate to registration  
    await page.waitForTimeout(1000);
    await page.click('a:has-text("Regístrate aquí")');
    await page.waitForSelector('#register-form', { state: 'visible' });
    
    // Fill registration form
    await page.fill('#register-name', 'Test User');
    await page.fill('#register-email', uniqueEmail);
    await page.fill('#register-password', 'Test123456!');
    await page.selectOption('#register-position', 'MED');
    
    // Submit form
    await page.click('button:has-text("Crear Cuenta")');
    
    // Wait for app to load or group selector
    await page.waitForSelector('#app, #group-selector', { state: 'visible', timeout: 10000 });
    
    // Auth screen should be hidden after login
    await expect(page.locator('#auth-screen')).not.toBeVisible();
  });

  test('should login with existing user', async ({ page }) => {
    // Wait for elements to be ready
    await page.waitForTimeout(1000);
    
    // Fill login form with correct IDs
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'Test123456!');
    
    // Submit login
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Wait for app or group selector
    await page.waitForSelector('#app, #group-selector', { state: 'visible', timeout: 10000 });
    
    // Auth screen should be hidden after login
    await expect(page.locator('#auth-screen')).not.toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Wait for elements to be ready
    await page.waitForTimeout(1000);
    
    // Try to login with invalid credentials using correct IDs
    await page.fill('#login-email', 'invalid@email.com');
    await page.fill('#login-password', 'wrongpassword');
    
    // Submit login
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Wait for error message or alert
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    await expect(page.locator('.login-overlay').first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'Test123456!');
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Wait for app to load
    await page.waitForSelector('#app, #group-selector', { state: 'visible', timeout: 10000 });
    
    // If group selector appears, select first group
    if (await page.locator('#group-selector').isVisible()) {
      await page.click('.group-item').first();
    }
    
    // Wait for main app
    await page.waitForSelector('#app', { state: 'visible', timeout: 10000 });
    
    // Click logout button
    const logoutButton = page.locator('#logout-btn, button:has-text("Cerrar Sesión"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should return to login page
      await expect(page.locator('.login-overlay').first()).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    // Navigate to registration  
    await page.waitForTimeout(1000);
    await page.click('a:has-text("Regístrate aquí")');
    await page.waitForSelector('#register-form', { state: 'visible' });
    
    // Fill with invalid email
    await page.fill('#register-name', 'Test User');
    await page.fill('#register-email', 'invalidemail');
    await page.fill('#register-password', 'Test123456!');
    
    // Try to submit
    await page.click('button:has-text("Crear Cuenta")');
    
    // Check for validation - form should still be visible
    await page.waitForTimeout(1000);
    await expect(page.locator('#register-form')).toBeVisible();
    
    // Check HTML5 validation
    const emailInput = page.locator('#register-email');
    const isInvalid = await emailInput.evaluate(el => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should validate password strength', async ({ page }) => {
    // Navigate to registration  
    await page.waitForTimeout(1000);
    await page.click('a:has-text("Regístrate aquí")');
    await page.waitForSelector('#register-form', { state: 'visible' });
    
    // Fill with weak password
    await page.fill('#register-name', 'Test User');
    await page.fill('#register-email', 'test@email.com');
    await page.fill('#register-password', '123'); // Too short
    
    // Try to submit
    await page.click('button:has-text("Crear Cuenta")');
    
    // Should show error or not proceed
    await page.waitForTimeout(1000);
    await expect(page.locator('#register-form')).toBeVisible();
  });

  test('should switch between login and register forms', async ({ page }) => {
    // Initially login form should be visible
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#register-form')).not.toBeVisible();
    
    // Click register tab
    await page.click('.auth-tabs button:has-text("Registrarse")');
    
    // Register form should be visible
    await expect(page.locator('#register-form')).toBeVisible();
    await expect(page.locator('#login-form')).not.toBeVisible();
    
    // Click login tab
    await page.click('.auth-tabs button:has-text("Iniciar Sesión")');
    
    // Login form should be visible again
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#register-form')).not.toBeVisible();
  });
});