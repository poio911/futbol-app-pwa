const { test, expect } = require('@playwright/test');
const { testUsers, testMatch, waitForFirebase, waitForCollaborativeSystem, cleanupTestData } = require('./helpers/test-data');

test.describe('Collaborative Matches', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFirebase(page);
    
    // Login as organizer
    await page.fill('#loginEmail', testUsers.organizer.email);
    await page.fill('#loginPassword', testUsers.organizer.password);
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('#mainApp', { state: 'visible' });
    
    // Navigate to collaborative matches
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    await waitForCollaborativeSystem(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await cleanupTestData(page);
  });

  test('should display collaborative matches section', async ({ page }) => {
    // Check main elements are visible
    await expect(page.locator('h2:has-text("🤝 Partidos Colaborativos")')).toBeVisible();
    await expect(page.locator('button:has-text("⚽ Crear Nuevo Partido")')).toBeVisible();
    
    // Check for match sections
    await expect(page.locator('text=📋 Partidos Disponibles')).toBeVisible();
    await expect(page.locator('text=📋 Mis Partidos')).toBeVisible();
  });

  test('should open create match modal', async ({ page }) => {
    // Click create match button
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    
    // Check modal is visible
    const modal = page.locator('#createMatchModal, .modal:has-text("Crear Nuevo Partido")');
    await expect(modal).toBeVisible();
    
    // Check form fields
    await expect(page.locator('#matchTitle, input[placeholder*="título"]')).toBeVisible();
    await expect(page.locator('#matchDate, input[type="date"]')).toBeVisible();
    await expect(page.locator('#matchTime, input[type="time"]')).toBeVisible();
    await expect(page.locator('#matchLocation, input[placeholder*="ubicación"]')).toBeVisible();
    await expect(page.locator('#matchType, select')).toBeVisible();
  });

  test('should create a new match', async ({ page }) => {
    // Open create modal
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    
    // Fill match details
    await page.fill('#matchTitle, input[placeholder*="título"]', testMatch.title);
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.selectOption('#matchType, select', testMatch.type);
    
    // Submit form
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    
    // Wait for modal to close
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden', timeout: 5000 });
    
    // Verify match appears in available matches
    const matchCard = page.locator(`.match-card:has-text("${testMatch.title}")`);
    await expect(matchCard).toBeVisible({ timeout: 10000 });
    
    // Should show organizer badge
    await expect(matchCard.locator('text=(Organizador)')).toBeVisible();
  });

  test('should join a match', async ({ page }) => {
    // First create a match
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Match to Join');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Find the match card
    const matchCard = page.locator('.match-card:has-text("Match to Join")');
    await expect(matchCard).toBeVisible();
    
    // Click join button
    await matchCard.locator('button:has-text("🏃 Anotarse")').click();
    
    // Confirm if there's a confirmation dialog
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    // Match should move to "Mis Partidos"
    await page.waitForTimeout(2000);
    const myMatchesSection = page.locator('#myMatchesSection, div:has-text("📋 Mis Partidos")');
    const joinedMatch = myMatchesSection.locator('.match-card:has-text("Match to Join")');
    await expect(joinedMatch).toBeVisible();
    
    // Should show "Desanotarse" button
    await expect(joinedMatch.locator('button:has-text("🚪 Desanotarse"), button:has-text("🚪 Salir")')).toBeVisible();
  });

  test('should leave a match', async ({ page }) => {
    // Create and join a match first
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Match to Leave');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Join the match
    const matchCard = page.locator('.match-card:has-text("Match to Leave")');
    await matchCard.locator('button:has-text("🏃 Anotarse")').click();
    
    // Confirm join if needed
    const confirmJoin = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
    if (await confirmJoin.isVisible({ timeout: 1000 })) {
      await confirmJoin.click();
    }
    
    await page.waitForTimeout(2000);
    
    // Now leave the match
    const myMatchCard = page.locator('#myMatchesSection .match-card:has-text("Match to Leave"), div:has-text("📋 Mis Partidos") .match-card:has-text("Match to Leave")');
    await myMatchCard.locator('button:has-text("🚪 Desanotarse"), button:has-text("🚪 Salir")').click();
    
    // Confirm leave
    const confirmLeave = page.locator('button:has-text("Confirmar"), button:has-text("Sí, salir")');
    if (await confirmLeave.isVisible({ timeout: 1000 })) {
      await confirmLeave.click();
    }
    
    // Match should move back to available matches
    await page.waitForTimeout(2000);
    const availableSection = page.locator('#availableMatchesSection, div:has-text("📋 Partidos Disponibles")');
    const availableMatch = availableSection.locator('.match-card:has-text("Match to Leave")');
    await expect(availableMatch).toBeVisible();
  });

  test('should delete own match as organizer', async ({ page }) => {
    // Create a match
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Match to Delete');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Find the match card
    const matchCard = page.locator('.match-card:has-text("Match to Delete")');
    await expect(matchCard).toBeVisible();
    
    // Delete button should be visible for organizer
    const deleteButton = matchCard.locator('button:has-text("🗑️ Borrar"), button:has-text("🗑️")');
    await expect(deleteButton).toBeVisible();
    
    // Click delete
    await deleteButton.click();
    
    // Confirm deletion
    const confirmDelete = page.locator('button:has-text("Sí, borrar"), button:has-text("Confirmar")');
    if (await confirmDelete.isVisible({ timeout: 1000 })) {
      await confirmDelete.click();
    }
    
    // Match should disappear
    await page.waitForTimeout(2000);
    await expect(matchCard).not.toBeVisible();
  });

  test('should show match details correctly', async ({ page }) => {
    // Create a match with specific details
    const matchDetails = {
      title: 'Detailed Match Test',
      date: testMatch.date,
      time: '19:30',
      location: 'Stadium Test',
      type: '7v7'
    };
    
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', matchDetails.title);
    await page.fill('#matchDate, input[type="date"]', matchDetails.date);
    await page.fill('#matchTime, input[type="time"]', matchDetails.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', matchDetails.location);
    await page.selectOption('#matchType, select', matchDetails.type);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Find the match card
    const matchCard = page.locator(`.match-card:has-text("${matchDetails.title}")`);
    
    // Verify all details are displayed
    await expect(matchCard).toContainText(matchDetails.title);
    await expect(matchCard).toContainText(matchDetails.time);
    await expect(matchCard).toContainText(matchDetails.location);
    await expect(matchCard).toContainText('7v7');
    
    // Check player count
    await expect(matchCard.locator('text=/👥.*0\\/18/')).toBeVisible(); // 7v7 has max 18 players
  });

  test('should prevent duplicate match creation', async ({ page }) => {
    // Create first match
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Duplicate Test');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Try to create identical match immediately
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Duplicate Test');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    
    // Should either show error or prevent creation
    await page.waitForTimeout(2000);
    
    // Count matches with same title
    const matchCount = await page.locator('.match-card:has-text("Duplicate Test")').count();
    expect(matchCount).toBeLessThanOrEqual(1);
  });

  test('should update player count when joining/leaving', async ({ page }) => {
    // Create a match
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Player Count Test');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
    
    // Get initial count
    const matchCard = page.locator('.match-card:has-text("Player Count Test")');
    const initialCount = await matchCard.locator('text=/👥.*\\/14/').textContent();
    expect(initialCount).toContain('0/14');
    
    // Join the match
    await matchCard.locator('button:has-text("🏃 Anotarse")').click();
    
    // Confirm if needed
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    // Wait for update
    await page.waitForTimeout(2000);
    
    // Check updated count
    const updatedCard = page.locator('.match-card:has-text("Player Count Test")');
    const updatedCount = await updatedCard.locator('text=/👥.*\\/14/').textContent();
    expect(updatedCount).toContain('1/14');
  });
});