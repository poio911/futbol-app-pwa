/**
 * Simple Firebase Storage - No ES6 modules, compatible with direct script loading
 * Last updated: 2025-08-30 - Demo mode suspended, improved deletion logging
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAes7EVn8hQswS8XgvDMJfN6U4IT_ZL_WY",
  authDomain: "mil-disculpis.firebaseapp.com",
  databaseURL: "https://mil-disculpis-default-rtdb.firebaseio.com",
  projectId: "mil-disculpis",
  storageBucket: "mil-disculpis.firebasestorage.app",
  messagingSenderId: "5614567933",
  appId: "1:5614567933:web:0dce7bf37b8325c0861994",
  measurementId: "G-EMLP4TKXKR"
};

// Initialize Firebase
let app, db;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Database connected:', db ? 'YES' : 'NO');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.warn('🔄 Fallback mode activated - some features may be limited');
    // Fallback to demo mode
    db = null;
}

// Storage replacement with Firebase + demo mode support
const Storage = {
    // State - DEMO MODE SUSPENDED
    currentPersonId: null,
    currentGroupId: null,
    isDemo: false, // Always false - demo mode suspended
    
    // Firebase data cache
    cachedPersons: [],
    cachedPlayers: [],
    cachedMatches: [],
    
    // Demo data cache
    demoPlayers: [
        { id: '1', name: 'Lionel Messi', position: 'DEL', attributes: { pac: 91, sho: 92, pas: 93, dri: 97, def: 38, phy: 78 }, ovr: 92, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '2', name: 'Cristiano Ronaldo', position: 'DEL', attributes: { pac: 87, sho: 97, pas: 82, dri: 89, def: 35, phy: 95 }, ovr: 91, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '3', name: 'Kevin De Bruyne', position: 'MED', attributes: { pac: 76, sho: 88, pas: 96, dri: 88, def: 64, phy: 78 }, ovr: 91, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '4', name: 'Virgil van Dijk', position: 'DEF', attributes: { pac: 79, sho: 60, pas: 71, dri: 72, def: 95, phy: 96 }, ovr: 90, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '5', name: 'Kylian Mbappé', position: 'DEL', attributes: { pac: 97, sho: 89, pas: 80, dri: 92, def: 39, phy: 82 }, ovr: 90, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '6', name: 'Erling Haaland', position: 'DEL', attributes: { pac: 89, sho: 94, pas: 65, dri: 80, def: 45, phy: 88 }, ovr: 88, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '7', name: 'Luka Modrić', position: 'MED', attributes: { pac: 72, sho: 76, pas: 89, dri: 90, def: 72, phy: 65 }, ovr: 87, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '8', name: 'Manuel Neuer', position: 'POR', attributes: { pac: 59, sho: 16, pas: 91, dri: 85, def: 91, phy: 83 }, ovr: 87, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '9', name: 'Pedri', position: 'MED', attributes: { pac: 79, sho: 74, pas: 86, dri: 85, def: 65, phy: 68 }, ovr: 85, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() },
        { id: '10', name: 'Jamal Musiala', position: 'MED', attributes: { pac: 82, sho: 76, pas: 81, dri: 89, def: 42, phy: 65 }, ovr: 84, photo: null, groupId: 'demo-group-1', createdAt: new Date().toISOString() }
    ],
    
    demoMatches: [],
    
    // ============= PERSONS =============
    
    getPersons() {
        // Demo mode suspended - always use Firebase data
        return this.cachedPersons || [];
    },

    getPersonById(personId) {
        if (this.isDemo && personId === 'demo-person-1') {
            return {
                id: 'demo-person-1',
                name: 'Demo User',
                email: 'demo@futbolstats.com',
                createdAt: new Date().toISOString()
            };
        }
        
        // Look in cached persons first
        if (this.cachedPersons && this.cachedPersons.length > 0) {
            const person = this.cachedPersons.find(p => p.id === personId);
            if (person) {
                console.log('Found person in cache:', person.name);
                return person;
            }
        }
        
        // If not in cache, try to get from getPersons (which might have some cached data)
        const allPersons = this.getPersons();
        const person = allPersons.find(p => p.id === personId);
        if (person) {
            console.log('Found person in getPersons:', person.name);
            return person;
        }
        
        console.warn('Person not found with ID:', personId);
        return null;
    },

    addPerson(personData) {
        if (this.isDemo) {
            console.log('Demo mode: Person added', personData);
            return true;
        }
        return this.createPerson(personData);
    },

    async updatePerson(personData) {
        if (this.isDemo) {
            console.log('Demo mode: Person updated', personData);
            return true;
        }
        
        if (!db) {
            console.error('Firebase db not initialized');
            return false;
        }
        
        try {
            const personId = personData.id;
            if (!personId) {
                console.error('No person ID provided for update');
                return false;
            }
            
            // Remove id from data to avoid Firebase error
            const updateData = { ...personData };
            delete updateData.id;
            
            // Check if document exists first
            const docRef = db.collection('persons').doc(personId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                // Update existing document
                await docRef.update(updateData);
                console.log('Person updated in Firebase:', personData.name);
            } else {
                // Create new document if it doesn't exist
                await docRef.set(updateData);
                console.log('Person created in Firebase (was missing):', personData.name);
            }
            
            // Update in cache if present
            if (this.cachedPersons) {
                const index = this.cachedPersons.findIndex(p => p.id === personId);
                if (index !== -1) {
                    this.cachedPersons[index] = personData;
                    console.log('Person updated in cache');
                } else {
                    // Add to cache if not present
                    this.cachedPersons.push(personData);
                    console.log('Person added to cache');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error updating person:', error);
            return false;
        }
    },

    async deletePerson(personId) {
        if (this.isDemo) {
            console.log('Demo mode: Person deleted', personId);
            return true;
        }
        
        if (!db) {
            console.error('Cannot delete person: Firebase db not initialized');
            return false;
        }
        
        try {
            console.log('Deleting person from Firebase:', personId);
            
            // Delete from Firebase
            const docRef = db.collection('persons').doc(personId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                await docRef.delete();
                console.log('Person deleted from Firebase:', personId);
            } else {
                console.warn('Person not found in Firebase:', personId);
            }
            
            // Remove from cache
            const cacheIndex = this.cachedPersons.findIndex(p => p.id === personId);
            if (cacheIndex !== -1) {
                this.cachedPersons.splice(cacheIndex, 1);
                console.log('Person removed from cache:', personId);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting person:', error);
            return false;
        }
    },

    savePersons(persons) {
        // Not needed in new system, but provide for compatibility
        console.log('savePersons called (compatibility mode)');
        return true;
    },

    personNameExists(name) {
        const persons = this.getPersons();
        return persons.some(p => p.name && p.name.toLowerCase() === name.toLowerCase());
    },

    getMemberships() {
        // Return demo memberships if in demo mode
        if (this.isDemo) {
            return [
                {
                    id: 'membership-1',
                    personId: 'demo-person-1',
                    groupId: 'demo-group-1',
                    role: 'owner',
                    createdAt: new Date().toISOString()
                }
            ];
        }
        return [];
    },

    addMembership(membershipData) {
        if (this.isDemo) {
            console.log('Demo mode: Membership added', membershipData);
            return true;
        }
        // In real mode, this would add to Firebase
        return true;
    },

    saveMemberships(memberships) {
        // Not needed in new system, but provide for compatibility
        console.log('saveMemberships called (compatibility mode)');
        return true;
    },

    async createPerson(personData) {
        // Prevent duplicate persons with same data
        const personKey = `${personData.name}_${personData.email}`;
        const now = Date.now();
        if (this.lastAddedPerson === personKey && this.lastAddPersonTime && (now - this.lastAddPersonTime) < 2000) {
            console.log('⚠️ Duplicate person prevented:', personKey);
            return true; // Return success to prevent error messages
        }
        this.lastAddedPerson = personKey;
        this.lastAddPersonTime = now;
        
        if (!db) return null;
        
        try {
            let docRef;
            let personId;
            
            if (personData.id) {
                // Use provided ID
                personId = personData.id;
                docRef = db.collection('persons').doc(personId);
                await docRef.set({
                    ...personData,
                    createdAt: personData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log('Person created with custom ID:', personId);
            } else {
                // Auto-generate ID
                docRef = await db.collection('persons').add({
                    ...personData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                personId = docRef.id;
                console.log('Person created with auto-generated ID:', personId);
            }
            
            const newPerson = { id: personId, ...personData };
            
            // Add to cache if not already present
            if (this.cachedPersons && !this.cachedPersons.find(p => p.id === personId)) {
                this.cachedPersons.push(newPerson);
                console.log('Person added to cache');
            }
            
            return newPerson;
        } catch (error) {
            console.error('Error creating person:', error);
            return null;
        }
    },

    // ============= GROUPS =============
    
    getGroups() {
        return this.getGroupsForPerson(this.currentPersonId);
    },

    cachedGroups: [],
    cachedPersons: [],

    getGroupsForPerson(personId) {
        if (this.isDemo) {
            return [
                {
                    id: 'demo-group-1',
                    name: 'FC Demo Team',
                    description: 'Grupo de demostración',
                    code: 'DEMO123',
                    members: ['demo-person-1'],
                    createdAt: new Date().toISOString()
                }
            ];
        }
        
        // Return cached groups if available
        if (this.cachedGroups.length > 0) {
            console.log('Returning cached groups:', this.cachedGroups.length);
            return this.cachedGroups.filter(g => g.members && g.members.includes(personId));
        }
        
        // Load from Firebase
        this.loadGroupsFromFirebase();
        return [];
    },

    async loadGroupsFromFirebase() {
        if (!db || this.isDemo) return;
        
        try {
            console.log('Loading groups from Firebase...');
            const groupsSnapshot = await db.collection('groups').get();
            
            this.cachedGroups = [];
            groupsSnapshot.forEach(doc => {
                const groupData = { id: doc.id, ...doc.data() };
                console.log('Loaded group:', groupData.name);
                this.cachedGroups.push(groupData);
            });
            
            console.log('Total groups loaded from Firebase:', this.cachedGroups.length);
            
        } catch (error) {
            console.error('Error loading groups from Firebase:', error);
        }
    },

    async loadPersonsFromFirebase() {
        if (!db || this.isDemo) return;
        
        try {
            console.log('Loading persons from Firebase...');
            const personsSnapshot = await db.collection('persons').get();
            
            this.cachedPersons = [];
            personsSnapshot.forEach(doc => {
                const personData = { id: doc.id, ...doc.data() };
                console.log('Loaded person:', personData.name);
                this.cachedPersons.push(personData);
            });
            
            console.log('Total persons loaded from Firebase:', this.cachedPersons.length);
            
        } catch (error) {
            console.error('Error loading persons from Firebase:', error);
        }
    },

    async getAllPersons() {
        console.log('getAllPersons called - isDemo:', this.isDemo, 'db:', !!db);
        
        if (this.isDemo) {
            console.log('Returning demo persons');
            return this.getPersons();
        }
        
        if (!db) {
            console.warn('Firebase db not initialized - returning empty array');
            return [];
        }
        
        try {
            console.log('Loading persons from Firebase...');
            await this.loadPersonsFromFirebase();
            console.log('Loaded persons from Firebase:', this.cachedPersons.length);
            
            // If no persons found in Firebase, could indicate empty database
            if (this.cachedPersons.length === 0) {
                console.log('No persons found in Firebase database');
            }
            
            return this.cachedPersons;
        } catch (error) {
            console.error('Error getting all persons:', error);
            return [];
        }
    },

    getGroupById(groupId) {
        if (this.isDemo && groupId === 'demo-group-1') {
            return {
                id: 'demo-group-1',
                name: 'FC Demo Team',
                description: 'Grupo de demostración',
                code: 'DEMO123',
                members: ['demo-person-1'],
                createdAt: new Date().toISOString()
            };
        }
        return null;
    },

    addGroup(groupData) {
        if (this.isDemo) {
            console.log('Demo mode: Group added', groupData);
            return true;
        }
        return this.createGroup(groupData);
    },

    saveGroups(groups) {
        // Not needed in new system, but provide for compatibility
        console.log('saveGroups called (compatibility mode)');
        return true;
    },

    groupNameExists(name) {
        const groups = this.getGroups();
        return groups.some(g => g.name && g.name.toLowerCase() === name.toLowerCase());
    },

    async createGroup(groupData) {
        if (!db) return null;
        
        try {
            const docRef = await db.collection('groups').add({
                ...groupData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                members: [this.currentPersonId]
            });
            
            return { id: docRef.id, ...groupData, members: [this.currentPersonId] };
        } catch (error) {
            console.error('Error creating group:', error);
            return null;
        }
    },

    async deleteGroup(groupId) {
        if (this.isDemo) {
            console.log('Demo mode: Group deleted', groupId);
            return true;
        }
        
        if (!db) {
            console.error('Firebase db not initialized');
            return false;
        }
        
        try {
            console.log('Deleting group and all associated data:', groupId);
            
            // First delete all subcollections (players, matches)
            console.log('Deleting players in group...');
            const playersRef = db.collection('groups').doc(groupId).collection('players');
            const playersSnapshot = await playersRef.get();
            const playerDeletePromises = playersSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(playerDeletePromises);
            console.log(`Deleted ${playersSnapshot.docs.length} players`);
            
            console.log('Deleting matches in group...');
            const matchesRef = db.collection('groups').doc(groupId).collection('matches');
            const matchesSnapshot = await matchesRef.get();
            const matchDeletePromises = matchesSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(matchDeletePromises);
            console.log(`Deleted ${matchesSnapshot.docs.length} matches`);
            
            // Then delete the group document itself
            await db.collection('groups').doc(groupId).delete();
            console.log('Group document deleted from Firebase:', groupId);
            
            // Clear caches if this was the current group
            if (this.currentGroupId === groupId) {
                this.cachedPlayers = [];
                this.cachedMatches = [];
                this.currentGroupId = null;
                console.log('Cleared caches for deleted group');
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting group:', error);
            return false;
        }
    },

    // ============= PLAYERS =============
    
    getPlayers() {
        console.log('getPlayers called - currentGroupId:', this.currentGroupId);
        
        // Demo mode suspended - always use Firebase data
        
        // For now, return cached players if available
        if (this.cachedPlayers && this.cachedPlayers.length > 0) {
            console.log('Returning cached players:', this.cachedPlayers.length);
            return [...this.cachedPlayers];
        }
        
        // Try to load from Firebase asynchronously
        console.log('Cache empty, loading from Firebase...');
        this.loadPlayersFromFirebase();
        return [];
    },

    cachedPlayers: [],

    async loadPlayersFromFirebase() {
        if (!db || this.isDemo) return;
        
        try {
            // Load authenticated users from futbol_users collection
            console.log('Loading authenticated players from futbol_users...');
            const authUsersSnapshot = await db.collection('futbol_users').get();
            
            const authPlayers = [];
            authUsersSnapshot.forEach(doc => {
                const userData = doc.data();
                authPlayers.push({
                    id: doc.id,
                    name: userData.displayName || userData.email?.split('@')[0] || 'Usuario',
                    position: userData.position || 'MED',
                    ovr: userData.ovr || 50,
                    attributes: {
                        pac: userData.pac || 50,
                        sho: userData.sho || 50,
                        pas: userData.pas || 50,
                        dri: userData.dri || 50,
                        def: userData.def || 50,
                        phy: userData.phy || 50
                    },
                    photo: userData.photo || '👤',
                    email: userData.email,
                    isAuthenticated: true,
                    // Include evaluation tracking fields
                    originalOVR: userData.originalOVR,
                    hasBeenEvaluated: userData.hasBeenEvaluated,
                    originalData: userData
                });
            });
            
            console.log('Found authenticated players:', authPlayers.length);
            
            let allPlayers = [...authPlayers];
            
            // If we have a currentGroupId, also load group-specific players
            if (this.currentGroupId) {
                console.log('Also loading players from group:', this.currentGroupId);
                const playersSnapshot = await db.collection('groups')
                    .doc(this.currentGroupId)
                    .collection('players')
                    .get();
            
                const groupPlayers = [];
                playersSnapshot.forEach(doc => {
                    const playerData = { id: doc.id, isAuthenticated: false, ...doc.data() };
                    
                    // Skip undefined or invalid players
                    if (!playerData.name || playerData.name === 'undefined') {
                        console.log('⚠️ Skipping invalid player:', playerData.id);
                        return;
                    }
                    
                    // Skip if this player is already in the authenticated players list
                    // Check by ID, email, or name to catch duplicates
                    const isDuplicate = authPlayers.some(authPlayer => 
                        authPlayer.id === playerData.id || 
                        (playerData.email && authPlayer.email === playerData.email) ||
                        (playerData.uid && authPlayer.id === playerData.uid)
                    );
                    
                    if (isDuplicate) {
                        console.log('⚠️ Skipping duplicate player from group:', playerData.name, 'ID:', playerData.id);
                        return;
                    }
                    
                    console.log('Loaded group player from Firebase:', playerData.name, 'OVR:', playerData.ovr, 'ID:', playerData.id);
                    groupPlayers.push(playerData);
                });
                
                allPlayers = [...allPlayers, ...groupPlayers];
            }
            
            // Update cache with all players (authenticated + group)
            this.cachedPlayers = allPlayers;
            
            console.log('Total players loaded from Firebase:', this.cachedPlayers.length, 
                       `(${authPlayers.length} authenticated, ${this.cachedPlayers.length - authPlayers.length} group)`);
            
            // Don't automatically refresh UI to avoid overwriting recent changes
            
        } catch (error) {
            console.error('Error loading players from Firebase:', error);
        }
    },

    getPlayerById(playerId) {
        if (this.isDemo) {
            return this.demoPlayers.find(p => p.id === playerId) || null;
        }
        
        // TODO: Implement Firestore player retrieval
        return null;
    },

    async addPlayer(playerData) {
        console.log('🔍 Storage.addPlayer called', {
            name: playerData.name,
            timestamp: new Date().toISOString()
        });
        
        // Prevent duplicate players with same data
        const playerKey = `${playerData.name}_${playerData.position}_${playerData.groupId}`;
        const now = Date.now();
        if (this.lastAddedPlayer === playerKey && this.lastAddTime && (now - this.lastAddTime) < 2000) {
            console.log('⚠️ Duplicate player prevented:', playerKey);
            return true; // Return success to prevent error messages
        }
        this.lastAddedPlayer = playerKey;
        this.lastAddTime = now;
        
        if (this.isDemo) {
            const newPlayer = {
                ...playerData,
                id: Date.now().toString(),
                groupId: this.currentGroupId,
                createdAt: new Date().toISOString()
            };
            this.demoPlayers.push(newPlayer);
            console.log('Demo player added:', newPlayer);
            
            // Dispatch event for notifications
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('player-created', {
                    detail: {
                        id: newPlayer.id,
                        name: newPlayer.name,
                        position: newPlayer.position,
                        ovr: newPlayer.ovr
                    }
                });
                document.dispatchEvent(event);
            }
            
            return true;
        }
        
        if (!db || !this.currentGroupId) {
            console.error('Cannot add player: no database or group');
            return false;
        }
        
        try {
            console.log('Adding player to Firebase:', playerData.name);
            
            // Ensure no undefined values are sent to Firebase
            const cleanPlayerData = { ...playerData };
            if (cleanPlayerData.createdBy === undefined) {
                cleanPlayerData.createdBy = 'unknown';
            }
            
            const docRef = await db.collection('groups').doc(this.currentGroupId).collection('players').add({
                ...cleanPlayerData,
                groupId: this.currentGroupId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            // Add to cache immediately
            const newPlayer = { id: docRef.id, ...playerData, groupId: this.currentGroupId };
            this.cachedPlayers.push(newPlayer);
            console.log('Player added to Firebase and cache:', newPlayer.name);
            
            // Dispatch event for notifications
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('player-created', {
                    detail: {
                        id: newPlayer.id,
                        name: newPlayer.name,
                        position: newPlayer.position,
                        ovr: newPlayer.ovr
                    }
                });
                document.dispatchEvent(event);
            }
            
            return true;
        } catch (error) {
            console.error('Error adding player:', error);
            return false;
        }
    },

    async updatePlayer(playerId, updates) {
        if (this.isDemo) {
            const playerIndex = this.demoPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.demoPlayers[playerIndex] = { ...this.demoPlayers[playerIndex], ...updates };
                return true;
            }
            return false;
        }
        
        if (!db || !this.currentGroupId) return false;
        
        try {
            await db.collection('groups').doc(this.currentGroupId).collection('players').doc(playerId).update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Error updating player:', error);
            return false;
        }
    },

    async deletePlayer(playerId) {
        if (this.isDemo) {
            this.demoPlayers = this.demoPlayers.filter(p => p.id !== playerId);
            console.log('Demo player deleted:', playerId);
            return true;
        }
        
        if (!db || !this.currentGroupId) {
            console.error('Cannot delete player: no database or group');
            return false;
        }
        
        try {
            console.log('Deleting player from Firebase:', playerId);
            
            // First check if player exists in cache (may be demo data)
            const cacheIndex = this.cachedPlayers.findIndex(p => p.id === playerId);
            if (cacheIndex === -1) {
                console.warn('Player not found in cache:', playerId);
                return false;
            }
            
            // Remove from cache first
            this.cachedPlayers.splice(cacheIndex, 1);
            console.log('✅ Player removed from cache:', playerId);
            
            // Try to delete from Firebase (may not exist if it was demo data)
            console.log('🔍 Attempting Firebase deletion for player:', playerId);
            console.log('📁 Firebase path: groups/' + this.currentGroupId + '/players/' + playerId);
            
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('players').doc(playerId);
            const doc = await docRef.get();
            
            console.log('🔍 Firebase doc.exists:', doc.exists);
            if (doc.exists) {
                console.log('📄 Firebase document data:', doc.data());
                await docRef.delete();
                console.log('✅ Player deleted from Firebase:', playerId);
                
                // Verify deletion
                const verifyDoc = await docRef.get();
                console.log('🔍 Verification - doc still exists:', verifyDoc.exists);
            } else {
                console.log('ℹ️ Player was not in Firebase (demo data cleaned from cache):', playerId);
                
                // Let's search for this player in Firebase to see if it exists with different path
                console.log('🔍 Searching for player in all Firebase documents...');
                const allPlayersSnapshot = await db.collection('groups').doc(this.currentGroupId).collection('players').get();
                const foundPlayers = [];
                
                allPlayersSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.name && data.name.includes('Pela') || doc.id === playerId) {
                        console.log('🔍 Found similar player in Firebase:', doc.id, data.name);
                        foundPlayers.push({id: doc.id, name: data.name, data: data});
                    }
                });
                
                // If we found players with similar name, let's try to delete them
                if (foundPlayers.length > 0) {
                    console.log('🧹 Found', foundPlayers.length, 'similar players. Attempting cleanup...');
                    for (const player of foundPlayers) {
                        if (player.name === 'Pela') { // Exact name match
                            console.log('🗑️ Deleting duplicate player from Firebase:', player.id, player.name);
                            try {
                                await db.collection('groups').doc(this.currentGroupId).collection('players').doc(player.id).delete();
                                console.log('✅ Deleted duplicate player:', player.id);
                            } catch (error) {
                                console.error('❌ Error deleting duplicate player:', error);
                            }
                        }
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting player:', error);
            // Still remove from cache even if Firebase delete fails
            const cacheIndex = this.cachedPlayers.findIndex(p => p.id === playerId);
            if (cacheIndex !== -1) {
                this.cachedPlayers.splice(cacheIndex, 1);
                console.log('Player removed from cache after error:', playerId);
            }
            return true; // Return true since we at least removed from cache
        }
    },

    /**
     * Clean duplicate players from Firebase
     */
    async cleanDuplicatePlayers() {
        if (!db || !this.currentGroupId) {
            console.error('Cannot clean duplicates: no database or group');
            return false;
        }

        try {
            console.log('🧹 Starting duplicate player cleanup...');
            const allPlayersSnapshot = await db.collection('groups').doc(this.currentGroupId).collection('players').get();
            
            const playersByName = {};
            const toDelete = [];

            // Group players by name
            allPlayersSnapshot.forEach(doc => {
                const data = doc.data();
                const name = data.name;
                
                if (!playersByName[name]) {
                    playersByName[name] = [];
                }
                playersByName[name].push({id: doc.id, data: data});
            });

            // Find duplicates
            for (const [name, players] of Object.entries(playersByName)) {
                if (players.length > 1) {
                    console.log(`🔍 Found ${players.length} duplicates for "${name}":`, players.map(p => p.id));
                    
                    // Keep the first one, delete the rest
                    for (let i = 1; i < players.length; i++) {
                        toDelete.push(players[i]);
                    }
                }
            }

            // Delete duplicates
            console.log(`🗑️ Deleting ${toDelete.length} duplicate players...`);
            for (const player of toDelete) {
                await db.collection('groups').doc(this.currentGroupId).collection('players').doc(player.id).delete();
                console.log(`✅ Deleted duplicate: ${player.data.name} (${player.id})`);
            }

            // Refresh cache
            await this.loadPlayersFromFirebase();
            console.log('🎉 Duplicate cleanup completed!');
            return true;

        } catch (error) {
            console.error('❌ Error cleaning duplicates:', error);
            return false;
        }
    },

    // ============= MATCHES =============
    
    cachedMatches: [],
    
    getMatches() {
        if (this.isDemo) {
            console.log('Getting demo matches:', this.demoMatches.length);
            return [...this.demoMatches]; // Return copy
        }
        
        // Return cached matches if available
        if (this.cachedMatches.length > 0) {
            console.log('Returning cached matches:', this.cachedMatches.length);
            return [...this.cachedMatches];
        }
        
        // Load from Firebase asynchronously
        this.loadMatchesFromFirebase();
        return [];
    },

    async getMatchById(matchId) {
        console.log(`Looking for match: ${matchId}`);
        
        // First try cached matches
        if (this.cachedMatches && this.cachedMatches.length > 0) {
            const match = this.cachedMatches.find(m => m.id === matchId);
            if (match) {
                console.log(`Getting match by ID ${matchId}: Found in cache`);
                return match;
            }
        }
        
        // Always try to load from Firebase directly (don't rely on cache)
        if (db) {
            try {
                // Try futbol_matches collection (new structure)
                console.log(`Searching in futbol_matches collection...`);
                const doc = await db.collection('futbol_matches').doc(matchId).get();
                if (doc.exists) {
                    const match = { id: doc.id, ...doc.data() };
                    console.log(`Getting match by ID ${matchId}: Found in futbol_matches`, match);
                    // Add to cache for future use
                    if (!this.cachedMatches) this.cachedMatches = [];
                    this.cachedMatches.push(match);
                    return match;
                }
                console.log(`Not found in futbol_matches collection`);
                
                // Also try old structure if we have a groupId
                if (this.currentGroupId) {
                    const oldDoc = await db.collection('groups')
                        .doc(this.currentGroupId)
                        .collection('matches')
                        .doc(matchId)
                        .get();
                    if (oldDoc.exists) {
                        match = { id: oldDoc.id, ...oldDoc.data() };
                        console.log(`Getting match by ID ${matchId}: Found in old structure`);
                        return match;
                    }
                }
            } catch (error) {
                console.error('Error fetching match from Firebase:', error);
            }
        }
        
        console.log(`Getting match by ID ${matchId}: Not found`);
        return null;
    },

    async loadMatchesFromFirebase() {
        if (!db || this.isDemo) return;
        
        try {
            this.cachedMatches = [];
            
            // Load from BOTH collections
            // 1. New structure: futbol_matches
            console.log('Loading matches from futbol_matches collection...');
            const newMatchesSnapshot = await db.collection('futbol_matches')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            newMatchesSnapshot.forEach(doc => {
                const matchData = { id: doc.id, ...doc.data(), _source: 'futbol_matches' };
                console.log('Loaded match from futbol_matches:', matchData.id, matchData.status);
                this.cachedMatches.push(matchData);
            });
            
            // 2. Old structure: groups/[groupId]/matches
            if (this.currentGroupId) {
                console.log('Loading matches from old structure for group:', this.currentGroupId);
                const oldMatchesSnapshot = await db.collection('groups')
                    .doc(this.currentGroupId)
                    .collection('matches')
                    .orderBy('createdAt', 'desc')
                    .get();
                
                oldMatchesSnapshot.forEach(doc => {
                    // Check if not already loaded from new structure
                    if (!this.cachedMatches.find(m => m.id === doc.id)) {
                        const matchData = { id: doc.id, ...doc.data(), _source: 'old_structure' };
                        console.log('Loaded match from old structure:', matchData.id, matchData.status);
                        this.cachedMatches.push(matchData);
                    }
                });
            }
            
            console.log('Total matches loaded from Firebase:', this.cachedMatches.length);
            
            // Trigger UI refresh if matches were loaded
            if (window.App && window.App.loadMatches) {
                setTimeout(() => {
                    window.App.loadMatches();
                }, 100);
            }
            
        } catch (error) {
            console.error('Error loading matches from Firebase:', error);
        }
    },

    getMatchById(matchId) {
        if (this.isDemo) {
            return this.demoMatches.find(m => m.id === matchId) || null;
        }
        
        // Look in cached matches first
        const cachedMatch = this.cachedMatches.find(m => m.id === matchId);
        if (cachedMatch) {
            console.log('Found match in cache:', matchId);
            return cachedMatch;
        }
        
        console.log('Match not found in cache:', matchId);
        return null;
    },

    async addMatch(matchData) {
        if (this.isDemo) {
            const newMatch = {
                ...matchData,
                id: matchData.id || Date.now().toString(),
                groupId: this.currentGroupId,
                createdAt: matchData.createdAt || new Date().toISOString()
            };
            
            console.log('Adding demo match with data:', newMatch);
            console.log('Team A players:', newMatch.teamA?.players?.length || 0);
            console.log('Team B players:', newMatch.teamB?.players?.length || 0);
            
            this.demoMatches.push(newMatch);
            return true;
        }
        
        if (!db || !this.currentGroupId) {
            console.error('Cannot add match: no database or group');
            return false;
        }
        
        try {
            console.log('Adding match to Firebase:', matchData.id || 'auto-generated');
            console.log('Team A players:', matchData.teamA?.players?.length || 0);
            console.log('Team B players:', matchData.teamB?.players?.length || 0);
            
            // Check if match already exists in cache to avoid duplicates
            if (matchData.id) {
                const existingMatch = this.cachedMatches.find(m => m.id === matchData.id);
                if (existingMatch) {
                    console.warn('Match already exists, not adding duplicate:', matchData.id);
                    return true;
                }
            }
            
            let docRef;
            let matchId;
            
            if (matchData.id) {
                // Use provided ID
                matchId = matchData.id;
                docRef = db.collection('groups').doc(this.currentGroupId).collection('matches').doc(matchId);
                await docRef.set({
                    ...matchData,
                    groupId: this.currentGroupId,
                    createdAt: matchData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Auto-generate ID
                docRef = await db.collection('groups').doc(this.currentGroupId).collection('matches').add({
                    ...matchData,
                    groupId: this.currentGroupId,
                    createdAt: matchData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                matchId = docRef.id;
            }
            
            // Add to cache immediately (avoid duplicates)
            const newMatch = { id: matchId, ...matchData, groupId: this.currentGroupId };
            const cacheIndex = this.cachedMatches.findIndex(m => m.id === matchId);
            if (cacheIndex === -1) {
                this.cachedMatches.unshift(newMatch); // Add to beginning (most recent first)
                console.log('Match added to Firebase and cache:', newMatch.id);
            } else {
                console.log('Match already in cache, updating:', matchId);
                this.cachedMatches[cacheIndex] = newMatch;
            }
            
            return true;
        } catch (error) {
            console.error('Error adding match to Firebase:', error);
            return false;
        }
    },

    // Update match with complete match object
    async updateMatch(matchData) {
        if (this.isDemo) {
            const matchIndex = this.demoMatches.findIndex(m => m.id === matchData.id);
            if (matchIndex !== -1) {
                this.demoMatches[matchIndex] = { ...matchData };
                return true;
            }
            return false;
        }
        
        if (!db) return false;
        
        try {
            // Use new clean futbol_matches collection
            const docRef = db.collection('futbol_matches').doc(matchData.id);
            await docRef.update({
                ...matchData,
                updatedAt: new Date().toISOString()
            });
            
            // Update cache
            const cacheIndex = this.cachedMatches.findIndex(m => m.id === matchData.id);
            if (cacheIndex !== -1) {
                this.cachedMatches[cacheIndex] = { ...matchData };
            }
            
            console.log('✅ Match updated in futbol_matches collection:', matchData.id);
            return true;
        } catch (error) {
            console.error('❌ Error updating match in Firebase:', error);
            return false;
        }
    },

    // Legacy update method for backward compatibility
    async updateMatchLegacy(matchId, updates) {
        if (this.isDemo) {
            const matchIndex = this.demoMatches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                this.demoMatches[matchIndex] = { ...this.demoMatches[matchIndex], ...updates };
                return true;
            }
            return false;
        }
        
        if (!db || !this.currentGroupId) return false;
        
        try {
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('matches').doc(matchId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                // Update existing document
                await docRef.update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
                console.log('Match updated in Firebase:', matchId);
            } else {
                // Create new document if it doesn't exist
                await docRef.set({
                    ...updates,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log('Match created in Firebase (was missing):', matchId);
            }
            
            // Update cache
            const cacheIndex = this.cachedMatches.findIndex(m => m.id === matchId);
            if (cacheIndex !== -1) {
                this.cachedMatches[cacheIndex] = { ...this.cachedMatches[cacheIndex], ...updates };
            } else {
                this.cachedMatches.push({ id: matchId, ...updates });
            }
            
            return true;
        } catch (error) {
            console.error('Error updating match:', error);
            return false;
        }
    },

    /**
     * Delete match from Firebase and cache
     */
    async deleteMatch(matchId) {
        if (this.isDemo) {
            const matchIndex = this.demoMatches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                this.demoMatches.splice(matchIndex, 1);
                console.log('Demo match deleted:', matchId);
                return true;
            }
            return false;
        }
        
        if (!db || !this.currentGroupId) {
            console.error('Cannot delete match: no database or group');
            return false;
        }
        
        try {
            console.log('Deleting match from Firebase:', matchId);
            
            // Delete from Firebase
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('matches').doc(matchId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                await docRef.delete();
                console.log('Match deleted from Firebase:', matchId);
            } else {
                console.warn('Match not found in Firebase:', matchId);
            }
            
            // Remove from cache
            const cacheIndex = this.cachedMatches.findIndex(m => m.id === matchId);
            if (cacheIndex !== -1) {
                this.cachedMatches.splice(cacheIndex, 1);
                console.log('Match removed from cache:', matchId);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting match:', error);
            return false;
        }
    },

    // ============= SESSION MANAGEMENT =============
    
    getCurrentPerson() {
        return this.currentPersonId ? { id: this.currentPersonId } : null;
    },

    getCurrentGroup() {
        return this.currentGroupId ? { id: this.currentGroupId } : null;
    },

    setCurrentPerson(personId) {
        this.currentPersonId = personId;
        // Demo mode SUSPENDED - always use real Firebase
        this.isDemo = false;
        console.log('Real mode forced for person:', personId);
    },

    setCurrentGroup(groupId) {
        this.currentGroupId = groupId;
        // Demo mode SUSPENDED - always use real Firebase
        this.isDemo = false;
        console.log('Real mode forced for group:', groupId);
        
        // Dispatch event for other modules to listen
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const event = new CustomEvent('group-changed', {
                detail: { groupId: groupId }
            });
            document.dispatchEvent(event);
        }
    },

    clearSession() {
        this.currentPersonId = null;
        this.currentGroupId = null;
        this.isDemo = false;
        this.demoMatches = [];
    },

    // ============= NEW MATCH SYSTEM V2 METHODS =============
    
    /**
     * Get a single match by ID
     */
    async getMatchById(matchId) {
        if (this.isDemo) {
            return this.demoMatches.find(m => m.id === matchId);
        }
        
        if (!db || !this.currentGroupId) return null;
        
        try {
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('matches').doc(matchId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching match by ID:', error);
            return null;
        }
    },

    /**
     * Get matches for a specific group
     */
    async getMatchesByGroup(groupId) {
        // Use existing getMatches method but filter by group
        if (this.isDemo) {
            return this.demoMatches.filter(m => m.groupId === groupId);
        }
        
        if (!db || !groupId) return [];
        
        try {
            // Load matches from Firebase
            await this.loadMatchesFromFirebase();
            return this.cachedMatches.filter(m => m.groupId === groupId);
        } catch (error) {
            console.error('Error fetching matches by group:', error);
            return [];
        }
    },

    /**
     * Get matches by status
     */
    async getMatchesByStatus(groupId, status) {
        const matches = await this.getMatchesByGroup(groupId);
        return matches.filter(m => m.status === status);
    },

    /**
     * Add a new match to Firebase (alias for the main addMatch method)
     */
    async addMatchV2(matchData) {
        return await this.addMatch(matchData);
    },

    /**
     * Update player with new data
     */
    async updatePlayer(playerData) {
        console.log('🔄 updatePlayer called:', {
            isDemo: this.isDemo, 
            player: playerData.name,
            currentGroupId: this.currentGroupId,
            playerId: playerData.id,
            newOVR: playerData.ovr
        });
        
        if (this.isDemo) {
            // Update demo data
            const playerIndex = this.demoPlayers.findIndex(p => p.id === playerData.id);
            if (playerIndex !== -1) {
                this.demoPlayers[playerIndex] = { ...playerData };
                console.log('✅ Player updated in demo mode:', playerData.name, 'Attributes:', playerData.attributes, 'New OVR:', playerData.ovr);
            }
            return true;
        }
        
        if (!db) {
            console.error('❌ No Firebase database connection');
            return false;
        }
        
        if (!this.currentGroupId) {
            console.error('❌ No currentGroupId available for updating player');
            return false;
        }
        
        try {
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('players').doc(playerData.id);
            
            // First check if document exists
            const doc = await docRef.get();
            console.log('Updating player - exists?', doc.exists, 'Player:', playerData.name);
            
            if (doc.exists) {
                // Use update for existing documents
                await docRef.update({
                    ...playerData,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Use set for new documents
                await docRef.set({
                    ...playerData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            // IMPORTANT: Also update futbol_users collection if this is an authenticated player
            if (playerData.isAuthenticated !== false) {
                console.log('🔄 Also updating authenticated player in futbol_users collection:', playerData.name);
                const userDocRef = db.collection('futbol_users').doc(playerData.id);
                const userDoc = await userDocRef.get();
                
                if (userDoc.exists) {
                    await userDocRef.update({
                        // Update key fields that change during evaluation
                        ovr: playerData.ovr,
                        originalOVR: playerData.originalOVR,
                        hasBeenEvaluated: playerData.hasBeenEvaluated,
                        // Update attributes if they exist
                        ...(playerData.attributes && {
                            pac: playerData.attributes.pac,
                            sho: playerData.attributes.sho,
                            pas: playerData.attributes.pas,
                            dri: playerData.attributes.dri,
                            def: playerData.attributes.def,
                            phy: playerData.attributes.phy
                        }),
                        updatedAt: new Date().toISOString()
                    });
                    console.log('✅ Authenticated player updated in futbol_users collection:', playerData.name);
                } else {
                    console.log('⚠️ Authenticated player not found in futbol_users collection:', playerData.name);
                }
            }
            
            console.log('✅ Player successfully updated in Firebase:', playerData.name, 'New OVR:', playerData.ovr);
            
            // Update local cache if we have it
            const cacheIndex = this.cachedPlayers?.findIndex(p => p.id === playerData.id);
            if (cacheIndex !== -1 && this.cachedPlayers) {
                this.cachedPlayers[cacheIndex] = { ...playerData };
                console.log('✅ Player updated in cache:', playerData.name, 'New OVR:', playerData.ovr);
            } else {
                console.log('Player not found in cache for update:', playerData.id);
            }
            
            console.log('Player updated in Firebase successfully:', playerData.name);
            return true;
        } catch (error) {
            console.error('Error updating player in Firebase:', error);
            return false;
        }
    },

    /**
     * Get a single player by ID
     */
    async getPlayerById(playerId) {
        if (this.isDemo) {
            // Find demo player by ID
            const player = this.demoPlayers.find(p => p.id === playerId);
            console.log('getPlayerById demo mode:', playerId, player ? `Found: ${player.name}` : 'Not found');
            return player || null;
        }
        
        if (!db || !this.currentGroupId) return null;
        
        // First check cache
        if (this.cachedPlayers && this.cachedPlayers.length > 0) {
            const cachedPlayer = this.cachedPlayers.find(p => p.id === playerId);
            if (cachedPlayer) {
                console.log('Player found in cache:', cachedPlayer.name);
                return cachedPlayer;
            }
        } else {
            // Force load players if cache is empty
            console.log('Cache empty, loading players from Firebase...');
            await this.loadPlayersFromFirebase();
            
            // Try cache again after loading
            if (this.cachedPlayers) {
                const cachedPlayer = this.cachedPlayers.find(p => p.id === playerId);
                if (cachedPlayer) {
                    console.log('Player found in cache after reload:', cachedPlayer.name);
                    return cachedPlayer;
                }
            }
        }
        
        try {
            const docRef = db.collection('groups').doc(this.currentGroupId).collection('players').doc(playerId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const player = { id: doc.id, ...doc.data() };
                console.log('Player found in Firebase:', player.name);
                return player;
            }
            console.log('Player not found in Firebase:', playerId);
            return null;
        } catch (error) {
            console.error('Error fetching player by ID:', error);
            return null;
        }
    },

    // ============= UTILITY METHODS =============
    
    getPersonsInGroup(groupId) {
        if (this.isDemo) {
            return this.getPersons();
        }
        return [];
    },

    // ============= COMPATIBILITY METHODS =============
    
    // Alias methods for compatibility
    saveMatch(matchData) {
        return this.addMatch(matchData);
    },

    saveMatches(matches) {
        // Not needed with new system
        return true;
    },

    savePlayers(players) {
        // Not needed with new system
        return true;
    },

    // Login/authentication compatibility
    loginAsPerson(personId) {
        this.setCurrentPerson(personId);
        if (personId === 'demo-person-1') {
            this.setCurrentGroup('demo-group-1');
        }
        return true;
    },

    // Check if has setup
    hasSetupComplete() {
        return this.currentPersonId && this.currentGroupId;
    },

    // Cleanup authenticated user duplicates from groups collection
    async cleanupAuthenticatedDuplicates() {
        if (!db || this.isDemo || !this.currentGroupId) {
            console.log('Cannot clean duplicates - no DB connection or demo mode');
            return false;
        }

        try {
            console.log('🧹 Starting authenticated user duplicates cleanup...');
            
            // Get all authenticated users
            const authUsersSnapshot = await db.collection('futbol_users').get();
            const authUserIds = new Set();
            const authUserEmails = new Set();
            
            authUsersSnapshot.forEach(doc => {
                const userData = doc.data();
                authUserIds.add(doc.id);
                if (userData.email) {
                    authUserEmails.add(userData.email.toLowerCase());
                }
            });
            
            console.log(`Found ${authUserIds.size} authenticated users`);
            
            // Get all players from the current group
            const playersSnapshot = await db.collection('groups')
                .doc(this.currentGroupId)
                .collection('players')
                .get();

            let deletedCount = 0;
            const deletePromises = [];

            playersSnapshot.forEach(doc => {
                const player = doc.data();
                
                // Check if this player is an authenticated user duplicate
                const isDuplicate = authUserIds.has(doc.id) || 
                                  authUserIds.has(player.uid) ||
                                  (player.email && authUserEmails.has(player.email.toLowerCase()));
                
                if (isDuplicate) {
                    console.log(`🗑️ Deleting duplicate authenticated user from group: ${player.name} (${doc.id})`);
                    deletePromises.push(
                        db.collection('groups')
                            .doc(this.currentGroupId)
                            .collection('players')
                            .doc(doc.id)
                            .delete()
                    );
                    deletedCount++;
                }
            });

            // Execute all deletions
            await Promise.all(deletePromises);
            
            console.log(`✅ Cleanup complete! Deleted ${deletedCount} duplicate authenticated users from group`);
            
            // Refresh the cache
            await this.loadPlayersFromFirebase();
            
            return deletedCount;
        } catch (error) {
            console.error('❌ Error cleaning authenticated duplicates:', error);
            return false;
        }
    },

    // Cleanup undefined players
    async cleanupUndefinedPlayers() {
        if (!db || this.isDemo || !this.currentGroupId) {
            console.log('Cannot clean undefined players - no DB connection or demo mode');
            return false;
        }

        try {
            console.log('🧹 Starting undefined players cleanup...');
            
            // Get all players from the current group
            const playersSnapshot = await db.collection('groups')
                .doc(this.currentGroupId)
                .collection('players')
                .get();

            let deletedCount = 0;
            const deletePromises = [];

            playersSnapshot.forEach(doc => {
                const player = doc.data();
                
                // Check if player is undefined or invalid
                if (!player.name || player.name === 'undefined' || player.name === '') {
                    console.log(`🗑️ Deleting undefined player: ${doc.id}`);
                    deletePromises.push(
                        db.collection('groups')
                            .doc(this.currentGroupId)
                            .collection('players')
                            .doc(doc.id)
                            .delete()
                    );
                    deletedCount++;
                }
            });

            // Execute all deletions
            await Promise.all(deletePromises);
            
            console.log(`✅ Cleanup complete! Deleted ${deletedCount} undefined players`);
            
            // Refresh the cache
            await this.loadPlayersFromFirebase();
            
            return deletedCount;
        } catch (error) {
            console.error('❌ Error cleaning undefined players:', error);
            return false;
        }
    }
};

// Make Storage globally available
window.Storage = Storage;

console.log('Firebase Simple Storage initialized');