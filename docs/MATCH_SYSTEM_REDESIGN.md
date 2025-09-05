# Match System Complete Redesign Plan

## Current Issues
1. **Data Duplication**: Matches and evaluations are being saved multiple times
2. **Team Generation**: Not working properly, teams not balanced correctly
3. **Evaluation System**: Cannot save evaluations, statistics not updating
4. **Duplicate Prevention**: Same match can be evaluated multiple times
5. **Data Flow**: Disconnected between Firebase and local storage
6. **UI/UX**: Evaluation interface not matching requirements

## New System Architecture

### 1. Data Structure
```javascript
// Match Object
{
  id: 'match_uuid',
  groupId: 'group_id',
  date: 'ISO_date',
  status: 'scheduled' | 'completed' | 'evaluated',
  teamA: {
    name: 'Equipo A',
    players: ['player_id1', 'player_id2'],
    ovr: 55,
    score: null // Set after match
  },
  teamB: {
    name: 'Equipo B', 
    players: ['player_id3', 'player_id4'],
    ovr: 53,
    score: null
  },
  evaluation: null, // Set after evaluation
  createdAt: timestamp,
  evaluatedAt: null
}

// Evaluation Object
{
  matchId: 'match_uuid',
  teamAScore: 2,
  teamBScore: 1,
  playerPerformance: {
    'player_id': {
      tags: ['goleador', 'asistencia', 'velocidad'],
      rating: 7.5,
      stats: {
        goals: 1,
        assists: 0
      }
    }
  },
  evaluatedBy: 'person_id',
  evaluatedAt: timestamp
}
```

### 2. Implementation Steps

#### Step 1: Fix Team Generation
- Simplify team generation algorithm
- Ensure balanced teams based on OVR
- Prevent duplicate player selection
- Save match immediately after generation

#### Step 2: Match Management
- Create single source of truth in Firebase
- Implement proper match status tracking
- Add match locking when evaluation starts
- Prevent duplicate evaluations

#### Step 3: Evaluation System
- Create performance tags system
- Implement real-time statistics update
- Calculate player ratings based on performance
- Update player OVR based on evaluations

#### Step 4: UI Implementation
- Match the design shown in the image
- Show team OVRs in header
- Display player cards with photos
- Performance tags with icons
- Score input at the top

### 3. Performance Tags
```javascript
const performanceTags = {
  goleador: { icon: '⚽', label: 'Goleador', points: '+2 Tiro' },
  asistencia: { icon: '🎯', label: 'Asistencia', points: '+2 Pase' },
  velocidad: { icon: '⚡', label: 'Velocidad destacada', points: '+1 Ritmo' },
  defensa: { icon: '🛡️', label: 'Defensa sólida', points: '+2 Defensa' },
  regate: { icon: '👑', label: 'Regate exitoso', points: '+1 Regate' },
  liderazgo: { icon: '👑', label: 'Liderazgo', points: '+1 Pase' },
  jugada_clave: { icon: '🔑', label: 'Jugada clave', points: '+1 Regate' },
  atajada: { icon: '🥅', label: 'Atajada importante', points: '+2 Defensa' }
};
```

### 4. Statistics Update Flow
1. User completes evaluation
2. Calculate rating changes for each player
3. Update player statistics in Firebase
4. Recalculate player OVR
5. Update match status to 'evaluated'
6. Lock match from further evaluation

### 5. Files to Modify
- `/js/match-manager.js` - Complete rewrite
- `/js/app.js` - Update match generation logic
- `/js/firebase-simple.js` - Add new match/evaluation methods
- `/css/styles.css` - New evaluation styles
- `/index.html` - Update evaluation section

## Implementation Priority
1. Fix data structure and Firebase integration
2. Implement team generation with proper saving
3. Create evaluation system with duplicate prevention
4. Update UI to match requirements
5. Add real-time statistics updates
6. Test complete flow