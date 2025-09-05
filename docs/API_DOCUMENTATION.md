# 📚 FC24 Team Manager - API Documentation v3.0.0

## 🔥 **FIREBASE STORAGE API**

### **Clase Principal: `Storage`**
Localizada en: `js/firebase-simple.js`  
Instancia global: `window.Storage`

---

## 👥 **GESTIÓN DE PERSONAS**

### **`getPersons()`**
```javascript
// Obtiene todas las personas
const persons = Storage.getPersons();
// Returns: Array<PersonObject>
```

### **`getPersonById(personId)`**
```javascript
// Obtiene persona por ID
const person = Storage.getPersonById('person-123');
// Returns: PersonObject | null
```

### **`createPerson(personData)`** *(async)*
```javascript
// Crea nueva persona
const person = await Storage.createPerson({
    name: 'Juan Pérez',
    email: 'juan@example.com'
});
// Returns: PersonObject | null
```

### **`personNameExists(name)`**
```javascript
// Verifica si existe el nombre
const exists = Storage.personNameExists('Juan Pérez');
// Returns: boolean
```

---

## 🏆 **GESTIÓN DE GRUPOS**

### **`getGroups()`**
```javascript
// Obtiene grupos del usuario actual
const groups = Storage.getGroups();
// Returns: Array<GroupObject>
```

### **`getGroupsForPerson(personId)`**
```javascript
// Obtiene grupos de una persona específica
const groups = Storage.getGroupsForPerson('person-123');
// Returns: Array<GroupObject>
```

### **`createGroup(groupData)`** *(async)*
```javascript
// Crea nuevo grupo
const group = await Storage.createGroup({
    name: 'FC Barcelona',
    description: 'Equipo de fútbol',
    code: 'FCB123'
});
// Returns: GroupObject | null
```

### **`getGroupById(groupId)`**
```javascript
// Obtiene grupo por ID
const group = Storage.getGroupById('group-123');
// Returns: GroupObject | null
```

### **`groupNameExists(name)`**
```javascript
// Verifica si existe el nombre del grupo
const exists = Storage.groupNameExists('FC Barcelona');
// Returns: boolean
```

---

## ⚽ **GESTIÓN DE JUGADORES**

### **`getPlayers()`**
```javascript
// Obtiene jugadores del grupo actual
const players = Storage.getPlayers();
// Returns: Array<PlayerObject>
```

### **`addPlayer(playerData)`** *(async)*
```javascript
// Agrega nuevo jugador
const success = await Storage.addPlayer({
    name: 'Lionel Messi',
    position: 'DEL',
    attributes: {
        pac: 91, sho: 92, pas: 93, 
        dri: 97, def: 38, phy: 78
    },
    ovr: 92,
    photo: null
});
// Returns: boolean
```

### **`getPlayerById(playerId)`**
```javascript
// Obtiene jugador por ID
const player = Storage.getPlayerById('player-123');
// Returns: PlayerObject | null
```

### **`updatePlayer(playerId, updates)`** *(async)*
```javascript
// Actualiza jugador
const success = await Storage.updatePlayer('player-123', {
    ovr: 95,
    attributes: { pac: 95, sho: 94 }
});
// Returns: boolean
```

### **`deletePlayer(playerId)`** *(async)*
```javascript
// Elimina jugador
const success = await Storage.deletePlayer('player-123');
// Returns: boolean
```

### **`loadPlayersFromFirebase()`** *(async)*
```javascript
// Carga jugadores desde Firebase (actualiza cache)
await Storage.loadPlayersFromFirebase();
// Returns: void
```

---

## 🏅 **GESTIÓN DE PARTIDOS**

### **`getMatches()`**
```javascript
// Obtiene partidos del grupo actual
const matches = Storage.getMatches();
// Returns: Array<MatchObject>
```

### **`addMatch(matchData)`** *(async)*
```javascript
// Agrega nuevo partido
const success = await Storage.addMatch({
    date: new Date().toISOString(),
    teamA: {
        players: [playerObj1, playerObj2],
        ovr: 85
    },
    teamB: {
        players: [playerObj3, playerObj4],
        ovr: 87
    },
    difference: 2,
    status: 'pending',
    format: '5v5',
    result: null,
    evaluations: []
});
// Returns: boolean
```

### **`getMatchById(matchId)`**
```javascript
// Obtiene partido por ID
const match = Storage.getMatchById('match-123');
// Returns: MatchObject | null
```

### **`updateMatch(matchId, updates)`** *(async)*
```javascript
// Actualiza partido
const success = await Storage.updateMatch('match-123', {
    status: 'finished',
    result: { teamA: 3, teamB: 1 }
});
// Returns: boolean
```

### **`loadMatchesFromFirebase()`** *(async)*
```javascript
// Carga partidos desde Firebase (actualiza cache)
await Storage.loadMatchesFromFirebase();
// Returns: void
```

---

## 🔄 **GESTIÓN DE SESIÓN**

### **`getCurrentPerson()`**
```javascript
// Obtiene persona actual
const person = Storage.getCurrentPerson();
// Returns: { id: string } | null
```

### **`getCurrentGroup()`**
```javascript
// Obtiene grupo actual
const group = Storage.getCurrentGroup();
// Returns: { id: string } | null
```

### **`setCurrentPerson(personId)`**
```javascript
// Establece persona actual
Storage.setCurrentPerson('person-123');
// Returns: void
```

### **`setCurrentGroup(groupId)`**
```javascript
// Establece grupo actual
Storage.setCurrentGroup('group-123');
// Returns: void
```

### **`loginAsPerson(personId)`**
```javascript
// Login como persona específica
const success = Storage.loginAsPerson('person-123');
// Returns: boolean
```

### **`clearSession()`**
```javascript
// Limpia sesión actual
Storage.clearSession();
// Returns: void
```

---

## 🏗️ **APP.JS - LÓGICA PRINCIPAL**

### **Clase Principal: `App`**
Localizada en: `js/app.js`  
Instancia global: `window.App` y `window.app`

---

## 🎮 **NAVEGACIÓN Y UI**

### **`init()`**
```javascript
// Inicializa la aplicación
App.init();
// Returns: void
```

### **`navigateToScreen(screenId)`**
```javascript
// Navega a una pantalla específica
App.navigateToScreen('stats-screen');
// Pantallas disponibles: 
// - 'welcome-screen', 'person-setup-screen', 'group-selector-screen'
// - 'create-group-screen', 'join-group-screen', 'register-screen'  
// - 'stats-screen', 'matches-screen', 'evaluate-screen', 'ranking-screen'
```

### **`loadStatsScreen()`**
```javascript
// Carga la pantalla de estadísticas
App.loadStatsScreen();
// Returns: void
```

---

## ⚽ **GESTIÓN DE JUGADORES (APP)**

### **`handlePlayerSubmit(event)`**
```javascript
// Maneja envío de formulario de jugador
App.handlePlayerSubmit(event);
// Returns: void (async)
```

### **`toggleEditMode()`**
```javascript
// Alterna modo de edición de jugadores
App.toggleEditMode();
// Returns: void
```

### **`deletePlayer(playerId)`**
```javascript
// Elimina jugador con confirmación
App.deletePlayer(playerId);
// Returns: void
```

---

## 🏆 **GESTIÓN DE EQUIPOS**

### **`generateTeams()`** *(async)*
```javascript
// Genera equipos balanceados
await App.generateTeams();
// Returns: void
```

### **`displayTeams(teams)`**
```javascript
// Muestra equipos en la UI
App.displayTeams({
    teamA: { players: [...], ovr: 85 },
    teamB: { players: [...], ovr: 87 },
    difference: 2
});
// Returns: void
```

### **`scheduleMatch()`**
```javascript
// Programa un partido con equipos generados
App.scheduleMatch();
// Returns: void
```

---

## 🎯 **SISTEMA DE EVALUACIÓN**

### **`openMatchEvaluation(match)`**
```javascript
// Abre formulario de evaluación para un partido
App.openMatchEvaluation(matchObject);
// Returns: void
```

### **`loadPlayerRatings(match)`**
```javascript
// Carga jugadores para evaluación
App.loadPlayerRatings(matchObject);
// Returns: void
```

### **`createPlayerRatingCard(player, match)`**
```javascript
// Crea card de evaluación para jugador
const cardElement = App.createPlayerRatingCard(playerObj, matchObj);
// Returns: HTMLElement
```

### **`togglePerformanceTag(playerId, tagId)`**
```javascript
// Alterna performance tag para jugador
App.togglePerformanceTag('player-123', 'goleador');
// Returns: void
```

### **`saveMatchEvaluation()`**
```javascript
// Guarda evaluación del partido
App.saveMatchEvaluation();
// Returns: void (async)
```

---

## 🛠️ **UTILS.JS - UTILIDADES**

### **Clase: `Utils`**
Localizada en: `js/utils.js`  
Instancia global: `window.Utils`

---

## ⚖️ **CÁLCULOS DE JUGADORES**

### **`calculateOvr(attributes)`**
```javascript
// Calcula OVR basado en atributos
const ovr = Utils.calculateOvr({
    pac: 90, sho: 85, pas: 88, 
    dri: 92, def: 40, phy: 80
});
// Returns: number (1-99)
```

### **`calculateTeamOvr(team)`**
```javascript
// Calcula OVR promedio del equipo
const teamOvr = Utils.calculateTeamOvr([player1, player2, player3]);
// Returns: number
```

### **`balanceTeams(players)`**
```javascript
// Balancea jugadores en dos equipos
const teams = Utils.balanceTeams([player1, player2, player3, player4]);
// Returns: {
//   teamA: { players: Array, ovr: number },
//   teamB: { players: Array, ovr: number },
//   difference: number,
//   groupId: string
// }
```

### **`balanceTeamsWithFormat(players, format)`**
```javascript
// Balancea equipos con formato específico
const teams = Utils.balanceTeamsWithFormat(players, '5v5');
// Formats: '5v5' | '7v7'
// Returns: TeamsObject
```

---

## 🎨 **UTILIDADES UI**

### **`getOvrColorClass(ovr)`**
```javascript
// Obtiene clase CSS para color de OVR
const cssClass = Utils.getOvrColorClass(92);
// Returns: 'ovr-exceptional' | 'ovr-high' | 'ovr-medium' | 'ovr-low'
```

### **`formatDate(dateString)`**
```javascript
// Formatea fecha para mostrar
const formatted = Utils.formatDate('2025-08-29T10:30:00.000Z');
// Returns: string (formato local)
```

### **`generateId()`**
```javascript
// Genera ID único
const id = Utils.generateId();
// Returns: string (timestamp + random)
```

---

## 🎨 **UI.JS - INTERFAZ DE USUARIO**

### **Clase: `UI`**
Localizada en: `js/ui.js`  
Instancia global: `window.UI`

---

## 🎪 **NOTIFICACIONES**

### **`showNotification(message, type)`**
```javascript
// Muestra notificación temporal
UI.showNotification('Jugador creado exitosamente!', 'success');
// Types: 'success' | 'error' | 'warning' | 'info'
```

### **`showLoading()`**
```javascript
// Muestra indicador de carga
UI.showLoading();
// Returns: void
```

### **`hideLoading()`**
```javascript
// Oculta indicador de carga
UI.hideLoading();
// Returns: void
```

---

## 🖥️ **GESTIÓN DE PANTALLAS**

### **`changeScreen(screenId)`**
```javascript
// Cambia pantalla activa
UI.changeScreen('stats-screen');
// Returns: void
```

### **`resetForm(formId = 'player-form')`**
```javascript
// Reinicia formulario
UI.resetForm('player-form');
// Returns: void
```

---

## 📊 **DISPLAY DE DATOS**

### **`displayPlayers(players, editMode = false)`**
```javascript
// Muestra lista de jugadores
UI.displayPlayers([player1, player2], true);
// Returns: void
```

### **`updatePlayerCounter(count)`**
```javascript
// Actualiza contador de jugadores
UI.updatePlayerCounter(15);
// Returns: void
```

---

## 📝 **ESTRUCTURAS DE DATOS**

### **PersonObject**
```javascript
{
    id: string,
    name: string,
    email: string,
    createdAt: string (ISO date),
    updatedAt?: string (ISO date)
}
```

### **GroupObject**
```javascript
{
    id: string,
    name: string,
    description?: string,
    code: string,
    members: Array<string>, // personIds
    createdAt: string (ISO date),
    updatedAt?: string (ISO date)
}
```

### **PlayerObject**
```javascript
{
    id: string,
    name: string,
    position: 'DEL' | 'MED' | 'DEF' | 'POR',
    attributes: {
        pac: number (1-99), // Velocidad/Ritmo
        sho: number (1-99), // Tiro
        pas: number (1-99), // Pase
        dri: number (1-99), // Regate/Dribbling
        def: number (1-99), // Defensa
        phy: number (1-99)  // Físico
    },
    ovr: number (1-99),     // Overall calculado
    photo?: string | null,   // URL de foto
    groupId: string,
    createdAt: string (ISO date),
    updatedAt?: string (ISO date)
}
```

### **MatchObject**
```javascript
{
    id: string,
    date: string (ISO date),
    createdAt: string (ISO date),
    teamA: {
        players: Array<PlayerObject>,
        ovr: number
    },
    teamB: {
        players: Array<PlayerObject>,
        ovr: number
    },
    difference: number,
    status: 'pending' | 'finished',
    format: '5v5' | '7v7',
    result?: {
        teamA: number,
        teamB: number
    } | null,
    evaluations: Array<EvaluationObject>,
    groupId: string,
    updatedAt?: string (ISO date)
}
```

### **EvaluationObject**
```javascript
{
    playerId: string,
    performanceTags: Array<string>, // ['goleador', 'asistencia', ...]
    timestamp: string (ISO date)
}
```

---

## 🏷️ **PERFORMANCE TAGS DISPONIBLES**

```javascript
const performanceTags = [
    { id: 'goleador', name: 'Goleador', affects: 'sho', points: 2, icon: '⚽' },
    { id: 'asistencia', name: 'Asistencia', affects: 'pas', points: 2, icon: '🎯' },
    { id: 'velocidad', name: 'Velocidad destacada', affects: 'pac', points: 1, icon: '💨' },
    { id: 'defensa-solida', name: 'Defensa sólida', affects: 'def', points: 2, icon: '🛡️' },
    { id: 'regate', name: 'Regate exitoso', affects: 'dri', points: 1, icon: '🤹' },
    { id: 'liderazgo', name: 'Liderazgo', affects: 'pas', points: 1, icon: '👑' },
    { id: 'jugada-clave', name: 'Jugada clave', affects: 'dri', points: 1, icon: '🔑' },
    { id: 'atajada', name: 'Atajada importante', affects: 'def', points: 2, icon: '🥅' },
    { id: 'mal-partido', name: 'Mal partido', affects: 'all', points: -1, icon: '😞' }
];
```

---

## 🔄 **EVENT DELEGATION**

### **Performance Tags Click Handler**
```javascript
// Configurado automáticamente en app.js línea 475
document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.performance-tag')) {
        const tagButton = e.target.closest('.performance-tag');
        const playerId = tagButton.dataset.playerId;
        const tagId = tagButton.dataset.tagId;
        
        if (playerId && tagId) {
            App.togglePerformanceTag(playerId, tagId);
        }
    }
});
```

---

## 🚨 **ERROR HANDLING**

### **Manejo de Errores Firebase**
```javascript
try {
    const success = await Storage.addPlayer(playerData);
    if (!success) {
        UI.showNotification('Error al guardar jugador', 'error');
    }
} catch (error) {
    console.error('Firebase error:', error);
    UI.showNotification('Error de conexión', 'error');
}
```

### **Validaciones**
```javascript
// Validación automática de nombres duplicados
if (Storage.personNameExists(name)) {
    UI.showNotification('El nombre ya existe', 'warning');
    return false;
}
```

---

## 🎯 **EJEMPLOS DE USO**

### **Crear Jugador Completo**
```javascript
async function createPlayer() {
    const playerData = {
        name: 'Cristiano Ronaldo',
        position: 'DEL',
        attributes: {
            pac: 87, sho: 97, pas: 82,
            dri: 89, def: 35, phy: 95
        },
        ovr: 91, // Calculado automáticamente
        photo: null
    };
    
    const success = await Storage.addPlayer(playerData);
    if (success) {
        UI.showNotification('¡Jugador creado!', 'success');
        App.loadStatsScreen(); // Actualizar UI
    }
}
```

### **Generar y Programar Partido**
```javascript
async function createMatch() {
    // 1. Obtener jugadores
    const players = Storage.getPlayers();
    
    // 2. Generar equipos balanceados
    const teams = Utils.balanceTeams(players);
    
    // 3. Crear partido
    const matchData = {
        date: new Date().toISOString(),
        teamA: teams.teamA,
        teamB: teams.teamB,
        difference: teams.difference,
        status: 'pending',
        format: '5v5'
    };
    
    // 4. Guardar partido
    const success = await Storage.addMatch(matchData);
    if (success) {
        UI.showNotification('¡Partido programado!', 'success');
    }
}
```

### **Evaluar Jugador con Performance Tags**
```javascript
function evaluatePlayer(playerId, tags) {
    // tags = ['goleador', 'asistencia']
    
    tags.forEach(tagId => {
        App.togglePerformanceTag(playerId, tagId);
    });
    
    // Guardar evaluación
    App.saveMatchEvaluation();
}
```

---

**📚 Documentación completa de todas las APIs disponibles en FC24 Team Manager v3.0.0** 📚