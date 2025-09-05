const { test, expect } = require('@playwright/test');
const { testUsers, testMatch, testPlayers, waitForFirebase, waitForCollaborativeSystem, cleanupTestData } = require('./helpers/test-data');

test.describe('Invitations and Team Generation', () => {
  
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
    
    // Create a test match
    await page.click('button:has-text("⚽ Crear Nuevo Partido")');
    await page.fill('#matchTitle, input[placeholder*="título"]', 'Team Generation Test');
    await page.fill('#matchDate, input[type="date"]', testMatch.date);
    await page.fill('#matchTime, input[type="time"]', testMatch.time);
    await page.fill('#matchLocation, input[placeholder*="ubicación"]', testMatch.location);
    await page.click('button:has-text("💾 Guardar"), button:has-text("Crear Partido")');
    await page.waitForSelector('#createMatchModal, .modal', { state: 'hidden' });
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('should show invite button on all matches', async ({ page }) => {
    // Find the match card
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await expect(matchCard).toBeVisible();
    
    // Invite button should be visible
    const inviteButton = matchCard.locator('button:has-text("🎭 Invitar")');
    await expect(inviteButton).toBeVisible();
  });

  test('should open invite modal', async ({ page }) => {
    // Click invite button
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Check modal is visible
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    await expect(modal).toBeVisible();
    
    // Check modal content
    await expect(modal.locator('text=📋 Team Generation Test')).toBeVisible();
    await expect(modal.locator('text=/👥.*Jugadores:/')).toBeVisible();
    await expect(modal.locator('text=📋 Jugadores Disponibles')).toBeVisible();
  });

  test('should display available players in invite modal', async ({ page }) => {
    // First add some manual players to the system
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    
    // Add test players
    for (const player of testPlayers.slice(0, 3)) {
      await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
      await page.fill('#playerName, input[placeholder*="nombre"]', player.name);
      await page.selectOption('#playerPosition, select', player.position);
      await page.fill('#playerOvr, input[type="number"]', player.ovr.toString());
      await page.click('button:has-text("💾"), button:has-text("Guardar")');
      await page.waitForTimeout(500);
    }
    
    // Go back to matches
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    
    // Open invite modal
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Check players are listed
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    for (const player of testPlayers.slice(0, 3)) {
      await expect(modal.locator(`text=${player.name}`)).toBeVisible();
    }
  });

  test('should invite players to match', async ({ page }) => {
    // Add players first
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    for (const player of testPlayers.slice(0, 2)) {
      await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
      await page.fill('#playerName, input[placeholder*="nombre"]', player.name);
      await page.selectOption('#playerPosition, select', player.position);
      await page.fill('#playerOvr, input[type="number"]', player.ovr.toString());
      await page.click('button:has-text("💾"), button:has-text("Guardar")');
      await page.waitForTimeout(500);
    }
    
    // Go to matches and open invite modal
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Select players
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    await modal.locator(`input[type="checkbox"][value*="${testPlayers[0].name}"], label:has-text("${testPlayers[0].name}") input`).first().check();
    await modal.locator(`input[type="checkbox"][value*="${testPlayers[1].name}"], label:has-text("${testPlayers[1].name}") input`).first().check();
    
    // Save invitations
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    
    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Check player count updated
    await page.waitForTimeout(2000);
    const updatedCard = page.locator('.match-card:has-text("Team Generation Test")');
    const playerCount = await updatedCard.locator('text=/👥.*\\/14/').textContent();
    expect(playerCount).toContain('2/14'); // 2 invited players
  });

  test('should prevent inviting duplicate players', async ({ page }) => {
    // Add and invite a player
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
    await page.fill('#playerName, input[placeholder*="nombre"]', 'Unique Player');
    await page.selectOption('#playerPosition, select', 'MED');
    await page.fill('#playerOvr, input[type="number"]', '75');
    await page.click('button:has-text("💾"), button:has-text("Guardar")');
    
    // Invite the player
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    await modal.locator('input[type="checkbox"][value*="Unique Player"], label:has-text("Unique Player") input').first().check();
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Try to invite same player again
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Player should be in "already invited" section or disabled
    const inviteModal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    const alreadyInvited = inviteModal.locator('text=✅ Jugadores Ya Anotados, text=Ya anotados');
    
    if (await alreadyInvited.isVisible({ timeout: 1000 })) {
      await expect(alreadyInvited).toContainText('Unique Player');
    } else {
      // Or checkbox should be disabled
      const checkbox = inviteModal.locator('input[type="checkbox"][value*="Unique Player"]');
      const isDisabled = await checkbox.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should remove invited player from match', async ({ page }) => {
    // Add and invite a player
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
    await page.fill('#playerName, input[placeholder*="nombre"]', 'Player to Remove');
    await page.selectOption('#playerPosition, select', 'DEF');
    await page.fill('#playerOvr, input[type="number"]', '70');
    await page.click('button:has-text("💾"), button:has-text("Guardar")');
    
    // Invite the player
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    let modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    await modal.locator('input[type="checkbox"][value*="Player to Remove"], label:has-text("Player to Remove") input').first().check();
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Open invite modal again
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Find and remove the player
    modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    const removeButton = modal.locator('button:has-text("❌ Quitar"), button:has-text("❌")').first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Confirm removal if needed
      const confirmRemove = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
      if (await confirmRemove.isVisible({ timeout: 1000 })) {
        await confirmRemove.click();
      }
    }
    
    // Player should be back in available list
    await page.waitForTimeout(1000);
    const availableSection = modal.locator('text=📋 Jugadores Disponibles').locator('..');
    await expect(availableSection).toContainText('Player to Remove');
  });

  test('should generate teams when 10 players are registered', async ({ page }) => {
    // Add 10 players to the system
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    for (const player of testPlayers) {
      await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
      await page.fill('#playerName, input[placeholder*="nombre"]', player.name);
      await page.selectOption('#playerPosition, select', player.position);
      await page.fill('#playerOvr, input[type="number"]', player.ovr.toString());
      await page.click('button:has-text("💾"), button:has-text("Guardar")');
      await page.waitForTimeout(300);
    }
    
    // Go to matches and invite all 10 players
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    // Select all players
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    for (const player of testPlayers) {
      const checkbox = modal.locator(`input[type="checkbox"][value*="${player.name}"], label:has-text("${player.name}") input`).first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
    
    // Save invitations
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Wait for team generation
    await page.waitForTimeout(3000);
    
    // "Ver Equipos" button should appear
    const viewTeamsButton = matchCard.locator('button:has-text("⚽ Ver Equipos")');
    await expect(viewTeamsButton).toBeVisible({ timeout: 10000 });
  });

  test('should display generated teams', async ({ page }) => {
    // Setup: Add 10 players and invite them
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    for (const player of testPlayers) {
      await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
      await page.fill('#playerName, input[placeholder*="nombre"]', player.name);
      await page.selectOption('#playerPosition, select', player.position);
      await page.fill('#playerOvr, input[type="number"]', player.ovr.toString());
      await page.click('button:has-text("💾"), button:has-text("Guardar")');
      await page.waitForTimeout(300);
    }
    
    // Invite all players
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    for (const player of testPlayers) {
      const checkbox = modal.locator(`input[type="checkbox"][value*="${player.name}"], label:has-text("${player.name}") input`).first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Wait and click "Ver Equipos"
    await page.waitForTimeout(3000);
    await matchCard.locator('button:has-text("⚽ Ver Equipos")').click();
    
    // Check teams modal
    const teamsModal = page.locator('.modal:has-text("Equipos Generados"), #teamsModal');
    await expect(teamsModal).toBeVisible();
    
    // Should show two teams
    await expect(teamsModal.locator('text=Equipo A, text=Team A')).toBeVisible();
    await expect(teamsModal.locator('text=Equipo B, text=Team B')).toBeVisible();
    
    // Should show team averages
    await expect(teamsModal.locator('text=/AVG:.*\\d+/')).toBeVisible();
    
    // Should have 5 players per team
    const teamAPlayers = teamsModal.locator('.team:has-text("Equipo A"), .team:has-text("Team A")').locator('.player-item, li');
    const teamBPlayers = teamsModal.locator('.team:has-text("Equipo B"), .team:has-text("Team B")').locator('.player-item, li');
    
    await expect(teamAPlayers).toHaveCount(5);
    await expect(teamBPlayers).toHaveCount(5);
  });

  test('should balance teams by OVR', async ({ page }) => {
    // Add players with varied OVRs
    const variedPlayers = [
      { name: 'High1', position: 'DEL', ovr: 95 },
      { name: 'High2', position: 'MED', ovr: 90 },
      { name: 'Med1', position: 'DEF', ovr: 75 },
      { name: 'Med2', position: 'POR', ovr: 70 },
      { name: 'Med3', position: 'DEL', ovr: 72 },
      { name: 'Low1', position: 'MED', ovr: 60 },
      { name: 'Low2', position: 'DEF', ovr: 55 },
      { name: 'Low3', position: 'DEL', ovr: 58 },
      { name: 'Low4', position: 'MED', ovr: 52 },
      { name: 'Low5', position: 'DEF', ovr: 50 }
    ];
    
    // Add all players
    await page.click('[data-screen="players"], button:has-text("Jugadores")');
    for (const player of variedPlayers) {
      await page.click('button:has-text("➕ Agregar Jugador"), button:has-text("Add Player")');
      await page.fill('#playerName, input[placeholder*="nombre"]', player.name);
      await page.selectOption('#playerPosition, select', player.position);
      await page.fill('#playerOvr, input[type="number"]', player.ovr.toString());
      await page.click('button:has-text("💾"), button:has-text("Guardar")');
      await page.waitForTimeout(300);
    }
    
    // Invite all players
    await page.click('[data-screen="collaborative"], button:has-text("🤝 Partidos")');
    const matchCard = page.locator('.match-card:has-text("Team Generation Test")');
    await matchCard.locator('button:has-text("🎭 Invitar")').click();
    
    const modal = page.locator('#inviteGuestsModal, .modal:has-text("Invitar Jugadores")');
    for (const player of variedPlayers) {
      const checkbox = modal.locator(`input[type="checkbox"][value*="${player.name}"], label:has-text("${player.name}") input`).first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
    await modal.locator('button:has-text("💾 Guardar"), button:has-text("Invitar")').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // View teams
    await page.waitForTimeout(3000);
    await matchCard.locator('button:has-text("⚽ Ver Equipos")').click();
    
    // Get team averages
    const teamsModal = page.locator('.modal:has-text("Equipos Generados"), #teamsModal');
    const teamAAvg = await teamsModal.locator('.team:has-text("Equipo A"), .team:has-text("Team A")').locator('text=/AVG:.*\\d+/').textContent();
    const teamBAvg = await teamsModal.locator('.team:has-text("Equipo B"), .team:has-text("Team B")').locator('text=/AVG:.*\\d+/').textContent();
    
    // Extract numbers
    const avgA = parseInt(teamAAvg.match(/\d+/)[0]);
    const avgB = parseInt(teamBAvg.match(/\d+/)[0]);
    
    // Teams should be balanced (difference less than 5 OVR points)
    const difference = Math.abs(avgA - avgB);
    expect(difference).toBeLessThanOrEqual(5);
  });
});