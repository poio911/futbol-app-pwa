const { test, expect } = require('@playwright/test');

test('Debug manual matches rendering', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:5500');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Switch to Partidos Grupales section
  await page.click('[onclick="switchToScreen(\'collaborative\')"]');
  await page.waitForTimeout(1000);
  
  // Check if collaborative screen is visible
  const collaborativeScreen = await page.locator('#collaborative-screen');
  await expect(collaborativeScreen).toBeVisible();
  
  // Take screenshot of current state
  await page.screenshot({ path: 'debug-collaborative-screen.png', fullPage: true });
  
  // Check if all-matches container exists
  const allMatches = await page.locator('#all-matches');
  await expect(allMatches).toBeVisible();
  
  // Get the content of all-matches
  const content = await allMatches.innerHTML();
  console.log('All-matches content:', content.substring(0, 500));
  
  // Check for any error text like "grid" or "flex" appearing as content
  const textContent = await allMatches.textContent();
  console.log('Text content:', textContent);
  
  if (textContent.includes('grid') || textContent.includes('flex')) {
    console.error('❌ CSS values are appearing as text content!');
    console.error('Full text:', textContent);
  }
  
  // Try to create a match
  const createButton = await page.locator('#create-match-btn');
  if (await createButton.isVisible()) {
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Fill match form if modal appears
    const titleInput = await page.locator('#match-title');
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Match Debug');
      
      const dateInput = await page.locator('#match-date');
      await dateInput.fill('2025-09-04');
      
      const timeInput = await page.locator('#match-time');
      await timeInput.fill('18:00');
      
      const locationInput = await page.locator('#match-location');
      await locationInput.fill('Test Location');
      
      // Submit
      await page.click('button:has-text("Crear Partido")');
      await page.waitForTimeout(2000);
      
      // Check if match was created and how it renders
      const updatedContent = await allMatches.innerHTML();
      console.log('After creating match:', updatedContent.substring(0, 1000));
      
      const updatedText = await allMatches.textContent();
      if (updatedText.includes('grid') || updatedText.includes('flex')) {
        console.error('❌ CSS values still appearing as text after match creation!');
      }
      
      // Take screenshot after match creation
      await page.screenshot({ path: 'debug-after-match-creation.png', fullPage: true });
    }
  }
  
  // Get console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser error:', msg.text());
    }
  });
  
  // Check JavaScript errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  await page.waitForTimeout(1000);
  
  if (errors.length > 0) {
    console.error('JavaScript errors found:', errors);
  }
});