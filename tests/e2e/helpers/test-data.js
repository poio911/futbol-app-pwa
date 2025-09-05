// Test data and utilities for Playwright tests

const testUsers = {
  organizer: {
    email: 'test.organizer@futbol.com',
    password: 'Test123456!',
    displayName: 'Test Organizer'
  },
  player1: {
    email: 'test.player1@futbol.com',
    password: 'Test123456!',
    displayName: 'Test Player 1'
  },
  player2: {
    email: 'test.player2@futbol.com',
    password: 'Test123456!',
    displayName: 'Test Player 2'
  }
};

const testMatch = {
  title: 'Test Match - Automated',
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  time: '20:00',
  location: 'Test Stadium',
  type: '5v5'
};

const testPlayers = [
  { name: 'Player A', position: 'DEL', ovr: 85 },
  { name: 'Player B', position: 'MED', ovr: 80 },
  { name: 'Player C', position: 'DEF', ovr: 75 },
  { name: 'Player D', position: 'POR', ovr: 70 },
  { name: 'Player E', position: 'DEL', ovr: 82 },
  { name: 'Player F', position: 'MED', ovr: 78 },
  { name: 'Player G', position: 'DEF', ovr: 73 },
  { name: 'Player H', position: 'DEL', ovr: 79 },
  { name: 'Player I', position: 'MED', ovr: 76 },
  { name: 'Player J', position: 'DEF', ovr: 74 }
];

const waitForFirebase = async (page) => {
  // Wait for Firebase to be initialized
  await page.waitForFunction(() => {
    return window.firebase && 
           window.firebase.auth && 
           typeof window.firebase.auth === 'function';
  }, { timeout: 10000 });
};

const waitForCollaborativeSystem = async (page) => {
  // Wait for CollaborativeSystem to be available
  await page.waitForFunction(() => {
    return window.collaborativeSystem && 
           typeof window.collaborativeSystem.loadMatches === 'function';
  }, { timeout: 10000 });
};

const cleanupTestData = async (page) => {
  // Clean up test matches created during tests
  await page.evaluate(() => {
    if (window.collaborativeSystem) {
      const matches = window.collaborativeSystem.state.matches;
      matches.forEach((match, id) => {
        if (match.title && match.title.includes('Test Match - Automated')) {
          window.collaborativeSystem.deleteMatch(id);
        }
      });
    }
  });
};

module.exports = {
  testUsers,
  testMatch,
  testPlayers,
  waitForFirebase,
  waitForCollaborativeSystem,
  cleanupTestData
};