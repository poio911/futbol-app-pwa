const { test, expect } = require('@playwright/test');

test.describe('Smoke Test', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'homepage.png' });
    
    // Wait a bit for content to load
    await page.waitForTimeout(3000);
    
    // Log all visible text
    const visibleText = await page.evaluate(() => document.body.innerText);
    console.log('Page content:', visibleText.substring(0, 500));
    
    // Check for any visible element
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Log all elements with id
    const elementsWithId = await page.evaluate(() => {
      const elements = document.querySelectorAll('[id]');
      return Array.from(elements).map(el => ({
        id: el.id,
        tag: el.tagName,
        visible: el.offsetParent !== null
      }));
    });
    console.log('Elements with ID:', elementsWithId);
    
    // Check what's actually visible
    const loginOverlay = page.locator('.login-overlay');
    const isLoginVisible = await loginOverlay.count() > 0;
    console.log('Login overlay found:', isLoginVisible);
    
    if (isLoginVisible) {
      const loginDisplay = await loginOverlay.first().evaluate(el => window.getComputedStyle(el).display);
      console.log('Login overlay display:', loginDisplay);
    }
    
    // Check for app element
    const app = page.locator('#app');
    const isAppVisible = await app.count() > 0;
    console.log('App element found:', isAppVisible);
    
    if (isAppVisible) {
      const appDisplay = await app.evaluate(el => window.getComputedStyle(el).display);
      console.log('App display:', appDisplay);
    }
  });
});