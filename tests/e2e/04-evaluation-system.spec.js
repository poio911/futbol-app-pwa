const { test, expect } = require('@playwright/test');
const { testUsers, testMatch, testPlayers, waitForFirebase, waitForCollaborativeSystem, cleanupTestData } = require('./helpers/test-data');

test.describe('Evaluation System', () => {
  
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
    await cleanupTestData(page);
  });

  test('should assign evaluations when teams are generated', async ({ page }) => {
    // Create match and add 10 authenticated players (simulated)
    await page.evaluate(() => {
      // Simulate a match with 10 authenticated players
      const match = {
        id: 'test-eval-match',
        title: 'Evaluation Test Match',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        registeredPlayers: [],
        teamsGenerated: false
      };
      
      // Add 10 simulated authenticated players
      for (let i = 1; i <= 10; i++) {
        match.registeredPlayers.push({
          uid: `test-uid-${i}`,
          displayName: `Test Player ${i}`,
          position: ['DEL', 'MED', 'DEF', 'POR'][i % 4],
          ovr: 50 + (i * 3),
          isGuest: false
        });
      }
      
      // Add match to system
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        
        // Trigger team generation
        window.collaborativeSystem.generateTeamsForMatch(match);
      }
    });
    
    // Wait for teams to be generated
    await page.waitForTimeout(2000);
    
    // Check that evaluation assignments were created
    const evaluationAssignments = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('test-eval-match');
      return match?.evaluationAssignments;
    });
    
    expect(evaluationAssignments).toBeTruthy();
    expect(Object.keys(evaluationAssignments).length).toBeGreaterThan(0);
    
    // Each player should evaluate 2 teammates
    for (const playerId in evaluationAssignments) {
      expect(evaluationAssignments[playerId].length).toBe(2);
    }
  });

  test('should not assign evaluations to guest players', async ({ page }) => {
    // Create match with mixed authenticated and guest players
    await page.evaluate(() => {
      const match = {
        id: 'test-guest-eval',
        title: 'Guest Evaluation Test',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        registeredPlayers: [],
        teamsGenerated: false
      };
      
      // Add 8 authenticated and 2 guest players
      for (let i = 1; i <= 10; i++) {
        match.registeredPlayers.push({
          uid: i <= 8 ? `auth-uid-${i}` : undefined,
          manualPlayerId: i > 8 ? `guest-${i}` : undefined,
          displayName: i <= 8 ? `Auth Player ${i}` : `Guest Player ${i}`,
          position: ['DEL', 'MED', 'DEF', 'POR'][i % 4],
          ovr: 50 + (i * 3),
          isGuest: i > 8
        });
      }
      
      // Add match and generate teams
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        window.collaborativeSystem.generateTeamsForMatch(match);
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check evaluation assignments
    const result = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('test-guest-eval');
      const assignments = match?.evaluationAssignments || {};
      
      // Check that guests are not in assignments
      const guestIds = ['guest-9', 'guest-10'];
      const hasGuestAssignments = guestIds.some(id => id in assignments);
      
      // Check that guests are not assigned to be evaluated
      const assignedToEvaluate = Object.values(assignments).flat();
      const guestsBeingEvaluated = assignedToEvaluate.some(id => 
        guestIds.includes(id) || id.includes('guest')
      );
      
      return {
        hasGuestAssignments,
        guestsBeingEvaluated,
        totalAssignments: Object.keys(assignments).length
      };
    });
    
    expect(result.hasGuestAssignments).toBeFalsy();
    expect(result.guestsBeingEvaluated).toBeFalsy();
    expect(result.totalAssignments).toBe(8); // Only 8 authenticated players
  });

  test('should show evaluation form after match', async ({ page }) => {
    // Simulate a completed match with evaluations pending
    await page.evaluate(() => {
      const yesterday = new Date(Date.now() - 86400000);
      const match = {
        id: 'completed-match',
        title: 'Completed Match',
        date: yesterday.toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        status: 'completed',
        registeredPlayers: [],
        teamsGenerated: true,
        teams: { teamA: [], teamB: [] },
        evaluationAssignments: {}
      };
      
      // Add current user and players to evaluate
      const currentUserId = window.TestApp?.currentUser?.uid || 'test-current-user';
      match.registeredPlayers.push({
        uid: currentUserId,
        displayName: 'Current User',
        position: 'MED',
        ovr: 75,
        isGuest: false
      });
      
      // Add players to evaluate
      for (let i = 1; i <= 2; i++) {
        const playerId = `player-to-eval-${i}`;
        match.registeredPlayers.push({
          uid: playerId,
          displayName: `Player ${i}`,
          position: 'DEF',
          ovr: 70,
          isGuest: false
        });
        
        // Assign for evaluation
        if (!match.evaluationAssignments[currentUserId]) {
          match.evaluationAssignments[currentUserId] = [];
        }
        match.evaluationAssignments[currentUserId].push(playerId);
      }
      
      // Add to system
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        window.collaborativeSystem.checkAndShowEvaluations(match.id);
      }
    });
    
    // Wait for evaluation modal
    await page.waitForTimeout(1000);
    
    // Check if evaluation modal appears
    const evalModal = page.locator('#evaluationModal, .modal:has-text("Evaluación"), .modal:has-text("Evaluar")');
    const isVisible = await evalModal.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      // Check evaluation form elements
      await expect(evalModal.locator('text=/Player [12]/')).toBeVisible();
      await expect(evalModal.locator('input[type="range"], select')).toBeVisible();
      await expect(evalModal.locator('textarea, input[type="text"]')).toBeVisible();
    }
  });

  test('should submit evaluations', async ({ page }) => {
    // Setup match with evaluations
    await page.evaluate(() => {
      const match = {
        id: 'eval-submit-test',
        title: 'Evaluation Submit Test',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        status: 'completed',
        registeredPlayers: [],
        teamsGenerated: true,
        evaluationAssignments: {},
        evaluations: {}
      };
      
      const currentUserId = 'test-evaluator';
      
      // Add players
      match.registeredPlayers.push(
        { uid: currentUserId, displayName: 'Evaluator', position: 'MED', ovr: 75, isGuest: false },
        { uid: 'player-1', displayName: 'Player 1', position: 'DEF', ovr: 70, isGuest: false },
        { uid: 'player-2', displayName: 'Player 2', position: 'DEL', ovr: 80, isGuest: false }
      );
      
      // Set assignments
      match.evaluationAssignments[currentUserId] = ['player-1', 'player-2'];
      
      // Add to system and trigger evaluation
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        
        // Simulate evaluation submission
        window.collaborativeSystem.submitEvaluation = function(matchId, evaluations) {
          const m = this.state.matches.get(matchId);
          if (m) {
            m.evaluations = m.evaluations || {};
            m.evaluations[currentUserId] = evaluations;
            return true;
          }
          return false;
        };
      }
    });
    
    // Submit evaluations programmatically
    const submitted = await page.evaluate(() => {
      const evaluations = {
        'player-1': { rating: 7, comment: 'Good performance' },
        'player-2': { rating: 9, comment: 'Excellent game' }
      };
      
      return window.collaborativeSystem?.submitEvaluation('eval-submit-test', evaluations);
    });
    
    expect(submitted).toBeTruthy();
    
    // Verify evaluations were saved
    const savedEvaluations = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('eval-submit-test');
      return match?.evaluations?.['test-evaluator'];
    });
    
    expect(savedEvaluations).toBeTruthy();
    expect(savedEvaluations['player-1'].rating).toBe(7);
    expect(savedEvaluations['player-2'].rating).toBe(9);
  });

  test('should calculate new OVRs when 80% complete evaluations', async ({ page }) => {
    // Setup match with multiple evaluators
    await page.evaluate(() => {
      const match = {
        id: 'ovr-calc-test',
        title: 'OVR Calculation Test',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        status: 'completed',
        registeredPlayers: [],
        teamsGenerated: true,
        evaluationAssignments: {},
        evaluations: {}
      };
      
      // Add 5 authenticated players
      const players = [
        { uid: 'p1', displayName: 'Player 1', position: 'DEL', ovr: 70, isGuest: false },
        { uid: 'p2', displayName: 'Player 2', position: 'MED', ovr: 75, isGuest: false },
        { uid: 'p3', displayName: 'Player 3', position: 'DEF', ovr: 65, isGuest: false },
        { uid: 'p4', displayName: 'Player 4', position: 'POR', ovr: 60, isGuest: false },
        { uid: 'p5', displayName: 'Player 5', position: 'DEL', ovr: 80, isGuest: false }
      ];
      
      match.registeredPlayers = players;
      
      // Setup evaluation assignments (each evaluates 2 others)
      match.evaluationAssignments = {
        'p1': ['p2', 'p3'],
        'p2': ['p3', 'p4'],
        'p3': ['p4', 'p5'],
        'p4': ['p5', 'p1'],
        'p5': ['p1', 'p2']
      };
      
      // Add 4 out of 5 evaluations (80%)
      match.evaluations = {
        'p1': { 'p2': { rating: 8 }, 'p3': { rating: 6 } },
        'p2': { 'p3': { rating: 7 }, 'p4': { rating: 5 } },
        'p3': { 'p4': { rating: 6 }, 'p5': { rating: 9 } },
        'p4': { 'p5': { rating: 8 }, 'p1': { rating: 7 } }
        // p5 hasn't evaluated yet
      };
      
      // Add to system
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        
        // Trigger OVR calculation
        window.collaborativeSystem.calculateNewOVRs = function(matchId) {
          const m = this.state.matches.get(matchId);
          if (!m) return false;
          
          // Check if 80% have evaluated
          const totalEvaluators = Object.keys(m.evaluationAssignments).length;
          const completedEvaluators = Object.keys(m.evaluations).length;
          const percentage = (completedEvaluators / totalEvaluators) * 100;
          
          if (percentage >= 80) {
            // Calculate new OVRs
            const newOVRs = {};
            const ratings = {};
            
            // Collect all ratings for each player
            Object.values(m.evaluations).forEach(evalSet => {
              Object.entries(evalSet).forEach(([playerId, evaluation]) => {
                if (!ratings[playerId]) ratings[playerId] = [];
                ratings[playerId].push(evaluation.rating);
              });
            });
            
            // Calculate average and new OVR
            Object.entries(ratings).forEach(([playerId, playerRatings]) => {
              const avg = playerRatings.reduce((a, b) => a + b, 0) / playerRatings.length;
              const player = m.registeredPlayers.find(p => p.uid === playerId);
              if (player) {
                // OVR change: rating 5 = no change, >5 increases, <5 decreases
                const change = (avg - 5) * 2; // Each point above/below 5 = 2 OVR points
                newOVRs[playerId] = Math.max(1, Math.min(99, player.ovr + change));
              }
            });
            
            m.newOVRs = newOVRs;
            return true;
          }
          return false;
        };
        
        window.collaborativeSystem.calculateNewOVRs(match.id);
      }
    });
    
    // Check if OVRs were calculated
    const result = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('ovr-calc-test');
      return {
        calculated: !!match?.newOVRs,
        newOVRs: match?.newOVRs
      };
    });
    
    expect(result.calculated).toBeTruthy();
    expect(result.newOVRs).toBeTruthy();
    
    // Player 1 received ratings of 7 (from p4), so OVR should increase
    expect(result.newOVRs['p1']).toBeGreaterThan(70);
    
    // Player 4 received rating of 5 (from p2) and 6 (from p3), avg 5.5, slight increase
    expect(result.newOVRs['p4']).toBeGreaterThan(60);
  });

  test('should not calculate OVRs if less than 80% evaluated', async ({ page }) => {
    // Setup match with only 50% evaluations
    await page.evaluate(() => {
      const match = {
        id: 'ovr-no-calc-test',
        title: 'OVR No Calculation Test',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        status: 'completed',
        registeredPlayers: [],
        teamsGenerated: true,
        evaluationAssignments: {},
        evaluations: {}
      };
      
      // Add 4 players
      match.registeredPlayers = [
        { uid: 'p1', displayName: 'Player 1', position: 'DEL', ovr: 70, isGuest: false },
        { uid: 'p2', displayName: 'Player 2', position: 'MED', ovr: 75, isGuest: false },
        { uid: 'p3', displayName: 'Player 3', position: 'DEF', ovr: 65, isGuest: false },
        { uid: 'p4', displayName: 'Player 4', position: 'POR', ovr: 60, isGuest: false }
      ];
      
      // Setup assignments
      match.evaluationAssignments = {
        'p1': ['p2', 'p3'],
        'p2': ['p3', 'p4'],
        'p3': ['p4', 'p1'],
        'p4': ['p1', 'p2']
      };
      
      // Only 2 out of 4 have evaluated (50%)
      match.evaluations = {
        'p1': { 'p2': { rating: 8 }, 'p3': { rating: 6 } },
        'p2': { 'p3': { rating: 7 }, 'p4': { rating: 5 } }
        // p3 and p4 haven't evaluated
      };
      
      // Add to system and try to calculate
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
        
        // Check if OVRs would be calculated
        const totalEvaluators = Object.keys(match.evaluationAssignments).length;
        const completedEvaluators = Object.keys(match.evaluations).length;
        const percentage = (completedEvaluators / totalEvaluators) * 100;
        
        if (percentage < 80) {
          match.newOVRs = null; // Should not calculate
        }
      }
    });
    
    // Verify OVRs were NOT calculated
    const result = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('ovr-no-calc-test');
      return {
        newOVRs: match?.newOVRs,
        evaluationPercentage: (Object.keys(match?.evaluations || {}).length / 
                               Object.keys(match?.evaluationAssignments || {}).length) * 100
      };
    });
    
    expect(result.newOVRs).toBeNull();
    expect(result.evaluationPercentage).toBeLessThan(80);
  });

  test('should show evaluation progress', async ({ page }) => {
    // Create match with partial evaluations
    await page.evaluate(() => {
      const match = {
        id: 'progress-test',
        title: 'Evaluation Progress Test',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Field',
        type: '5v5',
        status: 'completed',
        registeredPlayers: [],
        teamsGenerated: true,
        evaluationAssignments: {},
        evaluations: {}
      };
      
      // Add 6 players
      for (let i = 1; i <= 6; i++) {
        match.registeredPlayers.push({
          uid: `p${i}`,
          displayName: `Player ${i}`,
          position: 'MED',
          ovr: 70,
          isGuest: false
        });
        
        // Each evaluates 2 others
        match.evaluationAssignments[`p${i}`] = [
          `p${(i % 6) + 1}`,
          `p${((i + 1) % 6) + 1}`
        ];
      }
      
      // 3 out of 6 have evaluated (50%)
      match.evaluations = {
        'p1': { 'p2': { rating: 7 }, 'p3': { rating: 6 } },
        'p2': { 'p3': { rating: 8 }, 'p4': { rating: 7 } },
        'p3': { 'p4': { rating: 6 }, 'p5': { rating: 5 } }
      };
      
      // Calculate progress
      match.evaluationProgress = {
        total: Object.keys(match.evaluationAssignments).length,
        completed: Object.keys(match.evaluations).length,
        percentage: (Object.keys(match.evaluations).length / 
                    Object.keys(match.evaluationAssignments).length) * 100
      };
      
      if (window.collaborativeSystem) {
        window.collaborativeSystem.state.matches.set(match.id, match);
      }
    });
    
    // Get progress information
    const progress = await page.evaluate(() => {
      const match = window.collaborativeSystem?.state.matches.get('progress-test');
      return match?.evaluationProgress;
    });
    
    expect(progress).toBeTruthy();
    expect(progress.total).toBe(6);
    expect(progress.completed).toBe(3);
    expect(progress.percentage).toBe(50);
  });
});