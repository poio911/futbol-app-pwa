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
            this.cachedPlayers = [];  // Clear cache before loading
            
            // SINGLE SOURCE: Load ALL players from futbol_users collection
            console.log('Loading all players from futbol_users collection...');
            const playersSnapshot = await db.collection('futbol_users').get();
            
            playersSnapshot.forEach(doc => {
                const userData = doc.data();
                
                // Filter by group if needed
                if (this.currentGroupId) {
                    // Check if player belongs to current group
                    const belongsToGroup = userData.groupId === this.currentGroupId || 
                                          (userData.groups && userData.groups.includes(this.currentGroupId));
                    
                    if (!belongsToGroup) {
                        return; // Skip players not in current group
                    }
                }
                
                // Extract attributes (handle both direct and nested structure for backward compatibility)
                let attributes = {
                    pac: userData.pac || userData.attributes?.pac || 50,
                    sho: userData.sho || userData.attributes?.sho || 50,
                    pas: userData.pas || userData.attributes?.pas || 50,
                    dri: userData.dri || userData.attributes?.dri || 50,
                    def: userData.def || userData.attributes?.def || 50,
                    phy: userData.phy || userData.attributes?.phy || 50
                };
                
                // Recalculate OVR to ensure consistency
                const position = userData.position || 'MED';
                const calculatedOVR = this.calculateUnifiedOVR(attributes, position);
                
                // Create unified player object
                const player = {
                    id: doc.id,
                    name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'Usuario',
                    position: position,
                    ovr: calculatedOVR,  // Use recalculated OVR for consistency
                    // Keep attributes nested for UI compatibility
                    attributes: attributes,
                    // Also expose direct fields
                    pac: attributes.pac,
                    sho: attributes.sho,
                    pas: attributes.pas,
                    dri: attributes.dri,
                    def: attributes.def,
                    phy: attributes.phy,
                    photo: userData.photo || '👤',
                    email: userData.email,
                    isAuthenticated: !userData.isManualPlayer,  // True if not manual
                    isManualPlayer: userData.isManualPlayer || false,
                    // Include evaluation tracking fields
                    originalOVR: userData.originalOVR,
                    hasBeenEvaluated: userData.hasBeenEvaluated,
                    originalData: userData
                };
                
                this.cachedPlayers.push(player);
                console.log('Loaded player:', player.name, 'OVR:', player.ovr, 'Position:', player.position);
            });
            
            console.log('Total players loaded from futbol_users:', this.cachedPlayers.length);
            
            // Legacy: Also check old groups/players collection for backward compatibility
            if (this.currentGroupId) {
                console.log('Checking legacy players in groups collection...');
                const legacySnapshot = await db.collection('groups')
                    .doc(this.currentGroupId)
                    .collection('players')
                    .get();
                
                let legacyCount = 0;
                for (const doc of legacySnapshot.docs) {
                    const legacyData = doc.data();
                    
                    // Skip invalid players
                    if (!legacyData.name || legacyData.name === 'undefined') {
                        continue;
                    }
                    
                    // Check if already loaded from futbol_users
                    const alreadyLoaded = this.cachedPlayers.some(p => 
                        p.name === legacyData.name && p.position === legacyData.position
                    );
                    
                    if (!alreadyLoaded) {
                        console.log('🔄 Migrating legacy player to futbol_users:', legacyData.name);
                        
                        // Extract attributes
                        const attributes = legacyData.attributes || {
                            pac: legacyData.pac || 50,
                            sho: legacyData.sho || 50,
                            pas: legacyData.pas || 50,
                            dri: legacyData.dri || 50,
                            def: legacyData.def || 50,
                            phy: legacyData.phy || 50
                        };
                        
                        // Calculate OVR
                        const position = legacyData.position || 'MED';
                        const calculatedOVR = this.calculateUnifiedOVR(attributes, position);
                        
                        // Create unified player data
                        const unifiedData = {
                            name: legacyData.name,
                            displayName: legacyData.name,
                            position: position,
                            photo: legacyData.photo || '👤',
                            groupId: this.currentGroupId,
                            groups: [this.currentGroupId],
                            pac: attributes.pac,
                            sho: attributes.sho,
                            pas: attributes.pas,
                            dri: attributes.dri,
                            def: attributes.def,
                            phy: attributes.phy,
                            ovr: calculatedOVR,
                            createdBy: legacyData.createdBy || 'legacy',
                            createdAt: legacyData.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            isManualPlayer: true,
                            originalOVR: legacyData.originalOVR || calculatedOVR,
                            hasBeenEvaluated: legacyData.hasBeenEvaluated || false
                        };
                        
                        // Add to futbol_users
                        const newDocRef = await db.collection('futbol_users').add(unifiedData);
                        
                        // Add to cache
                        this.cachedPlayers.push({
                            id: newDocRef.id,
                            ...unifiedData,
                            attributes: attributes
                        });
                        
                        // Delete from legacy location
                        await doc.ref.delete();
                        
                        legacyCount++;
                        console.log('✅ Migrated legacy player:', legacyData.name);
                    }
                }
                
                if (legacyCount > 0) {
                    console.log(`✅ Migrated ${legacyCount} legacy players to futbol_users`);
                }
            }
            
            console.log('Final player count:', this.cachedPlayers.length);
            
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
            
            // Extract attributes from nested structure if present
            let attributes = {
                pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50
            };
            
            if (playerData.attributes) {
                // If attributes come nested, extract them
                attributes = {
                    pac: playerData.attributes.pac || 50,
                    sho: playerData.attributes.sho || 50,
                    pas: playerData.attributes.pas || 50,
                    dri: playerData.attributes.dri || 50,
                    def: playerData.attributes.def || 50,
                    phy: playerData.attributes.phy || 50
                };
            } else {
                // If attributes come directly
                attributes = {
                    pac: playerData.pac || 50,
                    sho: playerData.sho || 50,
                    pas: playerData.pas || 50,
                    dri: playerData.dri || 50,
                    def: playerData.def || 50,
                    phy: playerData.phy || 50
                };
            }
            
            // Calculate OVR using unified function
            const position = playerData.position || 'MED';
            const calculatedOVR = this.calculateUnifiedOVR(attributes, position);
            
            // Create player with DIRECT FIELDS structure (unified)
            const unifiedPlayerData = {
                name: playerData.name,
                displayName: playerData.name,  // Add displayName for consistency
                position: position,
                photo: playerData.photo || '👤',
                groupId: this.currentGroupId,
                groups: [this.currentGroupId],  // Array of groups for multi-group support
                // Direct attribute fields (NO NESTING)
                pac: attributes.pac,
                sho: attributes.sho,
                pas: attributes.pas,
                dri: attributes.dri,
                def: attributes.def,
                phy: attributes.phy,
                ovr: calculatedOVR,  // Use calculated OVR
                createdBy: playerData.createdBy || 'unknown',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isManualPlayer: true,  // Flag to identify manually created players
                originalOVR: calculatedOVR  // Save original OVR for tracking
            };
            
            console.log('📊 Creating player with unified structure:', {
                name: unifiedPlayerData.name,
                position: unifiedPlayerData.position,
                attributes: attributes,
                calculatedOVR: calculatedOVR
            });
            
            // Save to futbol_users collection (SINGLE SOURCE OF TRUTH)
            const docRef = await db.collection('futbol_users').add(unifiedPlayerData);
            
            // Add to cache with unified structure
            const newPlayer = { 
                id: docRef.id, 
                ...unifiedPlayerData,
                // Keep attributes nested for compatibility with UI
                attributes: attributes
            };
            this.cachedPlayers.push(newPlayer);
            
            console.log('✅ Player added to futbol_users with unified structure:', newPlayer.name);
            
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

    async updatePlayer(playerData) {
        console.log('🔄 updatePlayer called - redirecting to unified system');
        
        // Handle both player object and separate id/updates
        let playerId, updates;
        
        if (typeof playerData === 'string') {
            // Called with (playerId, updates) - old signature
            playerId = arguments[0];
            updates = arguments[1] || {};
        } else if (playerData && playerData.id) {
            // Called with player object
            playerId = playerData.id;
            
            // Extract updates from player object
            updates = {};
            
            // Handle attributes (nested or direct)
            if (playerData.attributes) {
                updates.pac = playerData.attributes.pac;
                updates.sho = playerData.attributes.sho;
                updates.pas = playerData.attributes.pas;
                updates.dri = playerData.attributes.dri;
                updates.def = playerData.attributes.def;
                updates.phy = playerData.attributes.phy;
            } else {
                // Direct fields
                if (playerData.pac !== undefined) updates.pac = playerData.pac;
                if (playerData.sho !== undefined) updates.sho = playerData.sho;
                if (playerData.pas !== undefined) updates.pas = playerData.pas;
                if (playerData.dri !== undefined) updates.dri = playerData.dri;
                if (playerData.def !== undefined) updates.def = playerData.def;
                if (playerData.phy !== undefined) updates.phy = playerData.phy;
            }
            
            // Include other fields
            if (playerData.name) updates.name = playerData.name;
            if (playerData.displayName) updates.displayName = playerData.displayName;
            if (playerData.position) updates.position = playerData.position;
            if (playerData.photo) updates.photo = playerData.photo;
            if (playerData.ovr !== undefined) updates.ovr = playerData.ovr;
        } else {
            console.error('Invalid parameters for updatePlayer');
            return false;
        }
        
        // Use unified update system
        return this.updatePlayerUnified(playerId, updates);
    },

    async deletePlayer(playerId) {
        if (this.isDemo) {
            this.demoPlayers = this.demoPlayers.filter(p => p.id !== playerId);
            console.log('Demo player deleted:', playerId);
            return true;
        }
        
        if (!db) {
            console.error('Cannot delete player: no database connection');
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
            
            // Delete from futbol_users (SINGLE SOURCE OF TRUTH)
            console.log('🔍 Attempting Firebase deletion for player:', playerId);
            console.log('📁 Firebase path: futbol_users/' + playerId);
            
            const docRef = db.collection('futbol_users').doc(playerId);
            const doc = await docRef.get();
            
            console.log('🔍 Firebase doc.exists:', doc.exists);
            if (doc.exists) {
                console.log('📄 Firebase document data:', doc.data());
                await docRef.delete();
                console.log('✅ Player deleted from futbol_users:', playerId);
                
                // Verify deletion
                const verifyDoc = await docRef.get();
                console.log('🔍 Verification - doc still exists:', verifyDoc.exists);
            } else {
                console.log('ℹ️ Player not found in futbol_users:', playerId);
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
     * LEGACY COMPATIBILITY WRAPPER - Now uses unified system
     * Update player with new data - CONVERTED TO USE UNIFIED SYSTEM
     */
    async updatePlayer(playerData) {
        console.log('⚠️ Legacy updatePlayer called - converting to unified system:', {
            player: playerData.name || playerData.displayName,
            playerId: playerData.id,
            newOVR: playerData.ovr,
            hasAttributes: !!playerData.attributes
        });
        
        try {
            // Convert legacy structure to unified updates
            const updates = {};
            
            // Handle attributes from legacy structure
            if (playerData.attributes) {
                const attrs = playerData.attributes;
                if (attrs.pac !== undefined) updates.pac = attrs.pac;
                if (attrs.sho !== undefined) updates.sho = attrs.sho;
                if (attrs.pas !== undefined) updates.pas = attrs.pas;
                if (attrs.dri !== undefined) updates.dri = attrs.dri;
                if (attrs.def !== undefined) updates.def = attrs.def;
                if (attrs.phy !== undefined) updates.phy = attrs.phy;
            }
            
            // Handle direct attributes (new structure compatibility)
            const attributeFields = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
            attributeFields.forEach(attr => {
                if (playerData[attr] !== undefined) {
                    updates[attr] = playerData[attr];
                }
            });
            
            // Handle OVR and other fields
            if (playerData.ovr !== undefined) {
                updates.ovr = playerData.ovr;
            }
            
            console.log('🔄 Converted legacy to unified updates:', updates);
            
            // Use unified function - no evaluation context for legacy calls
            const result = await this.updatePlayerUnified(playerData.id, updates);
            
            if (result) {
                // Update local cache if we have it (maintain compatibility)
                const cacheIndex = this.cachedPlayers?.findIndex(p => p.id === playerData.id);
                if (cacheIndex !== -1 && this.cachedPlayers) {
                    // Update cache with new values
                    Object.keys(updates).forEach(key => {
                        this.cachedPlayers[cacheIndex][key] = updates[key];
                    });
                    console.log('🔄 Local cache updated via unified system');
                }
            }
            
            console.log(`✅ Legacy updatePlayer completed via unified system: ${playerData.name || 'Unknown'}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error in legacy updatePlayer wrapper:', error);
            
            // Fallback to keep legacy compatibility in emergency
            console.log('🚨 FALLBACK: Trying emergency legacy behavior...');
            return await this.updatePlayerEmergencyFallback(playerData);
        }
    },
    
    /**
     * EMERGENCY FALLBACK - Only for critical failures
     */
    async updatePlayerEmergencyFallback(playerData) {
        console.log('🚨 EMERGENCY FALLBACK: Using simplified update');
        
        if (this.isDemo) {
            const playerIndex = this.demoPlayers.findIndex(p => p.id === playerData.id);
            if (playerIndex !== -1) {
                this.demoPlayers[playerIndex] = { ...playerData };
                console.log('✅ Emergency fallback: Demo player updated');
            }
            return true;
        }
        
        if (!db) {
            console.error('❌ Emergency fallback: No database connection');
            return false;
        }
        
        try {
            // Try to update futbol_users directly with attributes
            const userDocRef = db.collection('futbol_users').doc(playerData.id);
            const userDoc = await userDocRef.get();
            
            if (userDoc.exists && playerData.attributes) {
                await userDocRef.update({
                    ovr: playerData.ovr || userDoc.data().ovr,
                    pac: playerData.attributes.pac || userDoc.data().pac || 50,
                    sho: playerData.attributes.sho || userDoc.data().sho || 50,
                    pas: playerData.attributes.pas || userDoc.data().pas || 50,
                    dri: playerData.attributes.dri || userDoc.data().dri || 50,
                    def: playerData.attributes.def || userDoc.data().def || 50,
                    phy: playerData.attributes.phy || userDoc.data().phy || 50,
                    lastActivity: new Date().toISOString()
                });
                console.log('✅ Emergency fallback: Updated futbol_users directly');
                return true;
            }
            
            console.log('⚠️ Emergency fallback: Could not find user or attributes');
            return false;
        } catch (error) {
            console.error('❌ Emergency fallback failed:', error);
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

    // ============= UNIFIED OVR CALCULATION =============
    
    /**
     * SINGLE SOURCE OF TRUTH for OVR calculation
     * All OVR calculations must use this function
     * @param {Object} attributes - Object with pac, sho, pas, dri, def, phy
     * @param {string} position - POR, DEF, MED, or DEL
     * @returns {number} OVR value between 1 and 99
     */
    calculateUnifiedOVR(attributes, position) {
        const { pac = 50, sho = 50, pas = 50, dri = 50, def = 50, phy = 50 } = attributes;
        let ovr;
        
        // Position-specific weights (CONSISTENT ACROSS APP)
        switch(position) {
            case 'POR':
                // Goalkeeper: Defense and Physical most important
                ovr = Math.round(
                    (def * 0.40) +  // 40% Defense
                    (phy * 0.25) +  // 25% Physical
                    (pas * 0.15) +  // 15% Passing
                    (dri * 0.10) +  // 10% Dribbling
                    (pac * 0.05) +  // 5% Pace
                    (sho * 0.05)    // 5% Shooting
                );
                break;
            case 'DEF':
                // Defender: Defense, Physical, and Pace important
                ovr = Math.round(
                    (def * 0.35) +  // 35% Defense
                    (phy * 0.25) +  // 25% Physical
                    (pac * 0.15) +  // 15% Pace
                    (pas * 0.15) +  // 15% Passing
                    (dri * 0.05) +  // 5% Dribbling
                    (sho * 0.05)    // 5% Shooting
                );
                break;
            case 'MED':
                // Midfielder: Passing and Dribbling most important
                ovr = Math.round(
                    (pas * 0.30) +  // 30% Passing
                    (dri * 0.25) +  // 25% Dribbling
                    (def * 0.15) +  // 15% Defense
                    (phy * 0.15) +  // 15% Physical
                    (pac * 0.10) +  // 10% Pace
                    (sho * 0.05)    // 5% Shooting
                );
                break;
            case 'DEL':
                // Forward: Shooting, Pace, and Dribbling most important
                ovr = Math.round(
                    (sho * 0.30) +  // 30% Shooting
                    (pac * 0.25) +  // 25% Pace
                    (dri * 0.20) +  // 20% Dribbling
                    (phy * 0.15) +  // 15% Physical
                    (pas * 0.05) +  // 5% Passing
                    (def * 0.05)    // 5% Defense
                );
                break;
            default:
                // Generic: Equal weights
                ovr = Math.round((pac + sho + pas + dri + def + phy) / 6);
        }
        
        // Ensure OVR is between 1 and 99
        return Math.min(99, Math.max(1, ovr));
    },
    
    // ============= UNIFIED PLAYER UPDATE SYSTEM =============
    
    /**
     * Unified function to update player data - SINGLE SOURCE OF TRUTH
     * Updates futbol_users collection with direct fields (pac, sho, pas, dri, def, phy)
     * @param {string} userId - Firebase Auth UID of the user
     * @param {Object} updates - Object with attributes to update
     * @param {Object} evaluationContext - Optional context for evaluation tracking
     */
    async updatePlayerUnified(userId, updates, evaluationContext = null) {
        console.log('🔄 updatePlayerUnified called:', { 
            userId, 
            updates, 
            hasEvaluationContext: !!evaluationContext 
        });
        
        if (!userId) {
            throw new Error('userId is required for updatePlayerUnified');
        }
        
        if (this.isDemo) {
            console.log('⚠️ Demo mode - updating demo data only');
            const playerIndex = this.demoPlayers.findIndex(p => p.id === userId);
            if (playerIndex !== -1) {
                // Update demo player with new values
                Object.keys(updates).forEach(key => {
                    this.demoPlayers[playerIndex][key] = updates[key];
                });
                console.log('✅ Demo player updated:', this.demoPlayers[playerIndex].name);
                return true;
            }
            return false;
        }
        
        if (!db) {
            throw new Error('Database connection not available');
        }
        
        try {
            // 1. Obtener datos actuales para trazabilidad
            const userDocRef = db.collection('futbol_users').doc(userId);
            const userDoc = await userDocRef.get();
            
            if (!userDoc.exists) {
                console.warn(`⚠️ User ${userId} not found in futbol_users, skipping update`);
                return false;
            }
            
            const currentData = userDoc.data();
            console.log('📖 Current player data loaded:', {
                name: currentData.displayName,
                currentOVR: currentData.ovr,
                currentStats: {
                    pac: currentData.pac,
                    sho: currentData.sho,
                    pas: currentData.pas,
                    dri: currentData.dri,
                    def: currentData.def,
                    phy: currentData.phy
                }
            });
            
            // 2. Preparar actualizaciones con campos directos
            const directUpdates = {
                lastActivity: new Date().toISOString()
            };
            
            // Solo incluir campos de atributos si están en updates
            const attributeFields = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
            attributeFields.forEach(attr => {
                if (updates[attr] !== undefined && updates[attr] !== null) {
                    // Asegurar que los valores están en rango válido (0-99)
                    directUpdates[attr] = Math.max(0, Math.min(99, Math.round(updates[attr])));
                }
            });
            
            // Recalcular OVR automáticamente si se actualizaron atributos
            const hasAttributeUpdates = attributeFields.some(attr => directUpdates[attr] !== undefined);
            if (hasAttributeUpdates) {
                // Obtener posición del jugador
                const position = currentData.position || 'MED';
                
                // Construir objeto de atributos actualizados
                const updatedAttributes = {
                    pac: directUpdates.pac !== undefined ? directUpdates.pac : (currentData.pac || 50),
                    sho: directUpdates.sho !== undefined ? directUpdates.sho : (currentData.sho || 50),
                    pas: directUpdates.pas !== undefined ? directUpdates.pas : (currentData.pas || 50),
                    dri: directUpdates.dri !== undefined ? directUpdates.dri : (currentData.dri || 50),
                    def: directUpdates.def !== undefined ? directUpdates.def : (currentData.def || 50),
                    phy: directUpdates.phy !== undefined ? directUpdates.phy : (currentData.phy || 50)
                };
                
                // Calcular nuevo OVR usando función unificada
                const calculatedOVR = this.calculateUnifiedOVR(updatedAttributes, position);
                directUpdates.ovr = calculatedOVR;
                
                console.log('🎯 OVR recalculado automáticamente:', {
                    position,
                    attributes: updatedAttributes,
                    oldOVR: currentData.ovr || 50,
                    newOVR: calculatedOVR
                });
            } else if (updates.ovr !== undefined) {
                // Si se proporciona OVR directamente sin cambios de atributos, usarlo
                directUpdates.ovr = Math.max(0, Math.min(99, Math.round(updates.ovr)));
            }
            
            console.log('📝 Direct updates prepared:', directUpdates);
            
            // 3. Actualizar en futbol_users (ÚNICA FUENTE DE VERDAD)
            await userDocRef.update(directUpdates);
            
            console.log('✅ Player updated successfully in futbol_users:', userId);
            
            // 4. Registrar trazabilidad si es una evaluación
            if (evaluationContext) {
                await this.logEvaluationTrace(userId, currentData, directUpdates, evaluationContext);
            }
            
            // 5. Actualizar cache local si existe
            if (this.cachedPlayers && this.cachedPlayers.length > 0) {
                const cachedPlayerIndex = this.cachedPlayers.findIndex(p => p.id === userId);
                if (cachedPlayerIndex !== -1) {
                    Object.keys(directUpdates).forEach(key => {
                        this.cachedPlayers[cachedPlayerIndex][key] = directUpdates[key];
                    });
                    console.log('🔄 Local cache updated');
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error in updatePlayerUnified:', error);
            console.error('Context:', { userId, updates, evaluationContext });
            throw error;
        }
    },
    
    /**
     * Log evaluation trace for admin panel trazability
     * @param {string} userId - User being evaluated
     * @param {Object} beforeData - Data before changes
     * @param {Object} updates - Changes being applied
     * @param {Object} context - Evaluation context
     */
    async logEvaluationTrace(userId, beforeData, updates, context) {
        if (!context || !context.matchId || !context.evaluatorId) {
            console.log('⚠️ Incomplete evaluation context, skipping trace log');
            return;
        }
        
        try {
            console.log('📋 Logging evaluation trace...', {
                evaluator: context.evaluatorId,
                evaluated: userId,
                match: context.matchId
            });
            
            const changes = {};
            const attributeFields = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
            
            // Calcular cambios detallados solo para atributos que cambiaron
            attributeFields.forEach(attr => {
                if (updates[attr] !== undefined) {
                    const before = beforeData[attr] || 50;
                    const after = updates[attr];
                    if (before !== after) {
                        changes[attr] = {
                            before: before,
                            after: after,
                            change: after - before
                        };
                    }
                }
            });
            
            // Solo crear log si hubo cambios reales
            if (Object.keys(changes).length > 0) {
                const evaluationLog = {
                    matchId: context.matchId,
                    evaluatorId: context.evaluatorId,
                    evaluatedUserId: userId,
                    evaluatedUserName: beforeData.displayName || 'Usuario',
                    timestamp: new Date().toISOString(),
                    changes: changes,
                    ovrChange: {
                        before: beforeData.ovr || 50,
                        after: updates.ovr || beforeData.ovr || 50,
                        change: (updates.ovr || beforeData.ovr || 50) - (beforeData.ovr || 50)
                    },
                    evaluationType: context.evaluationType || 'unknown',
                    evaluationData: context.evaluationData || {}
                };
                
                await db.collection('evaluation_logs').add(evaluationLog);
                console.log('✅ Evaluation trace logged successfully');
            } else {
                console.log('ℹ️ No attribute changes to log');
            }
            
        } catch (error) {
            console.error('❌ Error logging evaluation trace:', error);
            // Don't throw - trace logging shouldn't break the evaluation
        }
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

// Global utility function to calculate OVR from player data
window.calculatePlayerOVR = function(player) {
    if (!player) return 50;
    
    // PRIORITY 1: Use direct stats if available (unified structure)
    if (player.pac !== undefined && player.sho !== undefined && 
        player.pas !== undefined && player.dri !== undefined && 
        player.def !== undefined && player.phy !== undefined) {
        const calculated = Math.round((player.pac + player.sho + player.pas + player.dri + player.def + player.phy) / 6);
        return Math.max(20, Math.min(99, calculated));
    }
    
    // PRIORITY 2: Use attributes if available (legacy structure)
    if (player.attributes && Object.keys(player.attributes).length >= 6) {
        const attrs = player.attributes;
        const calculated = Math.round((attrs.pac + attrs.sho + attrs.pas + attrs.dri + attrs.def + attrs.phy) / 6);
        return Math.max(20, Math.min(99, calculated));
    }
    
    // PRIORITY 3: Use stored OVR or default
    return player.ovr || 50;
};

// Make Storage globally available
window.Storage = Storage;

console.log('Firebase Simple Storage initialized');