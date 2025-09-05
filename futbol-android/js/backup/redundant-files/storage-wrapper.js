/**
 * Storage Wrapper - Provides backward compatibility between localStorage and Firestore
 * This wrapper makes async operations appear synchronous for existing code
 */

class StorageWrapper {
    constructor() {
        this.isFirebase = true;
        this.cache = {
            persons: [],
            groups: [],
            players: [],
            matches: [],
            lastUpdate: 0
        };
        this.currentPersonId = null;
        this.currentGroupId = null;
        
        // Initialize with demo data flag
        this.isDemo = false;
    }

    // ============= SYNCHRONOUS WRAPPERS =============
    // These methods provide sync interface for async operations

    getPersons() {
        if (this.isDemo) {
            return this.getDemoPersons();
        }
        // Return cached data for synchronous access
        return this.cache.persons;
    }

    getGroupsForPerson(personId) {
        if (this.isDemo) {
            return this.getDemoGroups();
        }
        return this.cache.groups.filter(g => g.members && g.members.includes(personId));
    }

    getPlayers() {
        if (this.isDemo) {
            return this.getDemoPlayers();
        }
        return this.cache.players;
    }

    getMatches() {
        if (this.isDemo) {
            return this.getDemoMatches();
        }
        return this.cache.matches;
    }

    getPlayerById(playerId) {
        return this.cache.players.find(p => p.id === playerId) || null;
    }

    getMatchById(matchId) {
        return this.cache.matches.find(m => m.id === matchId) || null;
    }

    // ============= DEMO DATA METHODS =============
    
    getDemoPersons() {
        return [
            {
                id: 'demo-person-1',
                name: 'Demo User',
                email: 'demo@futbolstats.com',
                createdAt: new Date().toISOString()
            }
        ];
    }

    getDemoGroups() {
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

    getDemoPlayers() {
        const demoPlayers = [
            { id: '1', name: 'Lionel Messi', position: 'DEL', attributes: { pac: 91, sho: 92, pas: 93, dri: 97, def: 38, phy: 78 }, ovr: 92, photo: null },
            { id: '2', name: 'Cristiano Ronaldo', position: 'DEL', attributes: { pac: 87, sho: 97, pas: 82, dri: 89, def: 35, phy: 95 }, ovr: 91, photo: null },
            { id: '3', name: 'Kevin De Bruyne', position: 'MED', attributes: { pac: 76, sho: 88, pas: 96, dri: 88, def: 64, phy: 78 }, ovr: 91, photo: null },
            { id: '4', name: 'Virgil van Dijk', position: 'DEF', attributes: { pac: 79, sho: 60, pas: 71, dri: 72, def: 95, phy: 96 }, ovr: 90, photo: null },
            { id: '5', name: 'Kylian Mbappé', position: 'DEL', attributes: { pac: 97, sho: 89, pas: 80, dri: 92, def: 39, phy: 82 }, ovr: 90, photo: null },
            { id: '6', name: 'Erling Haaland', position: 'DEL', attributes: { pac: 89, sho: 94, pas: 65, dri: 80, def: 45, phy: 88 }, ovr: 88, photo: null },
            { id: '7', name: 'Luka Modrić', position: 'MED', attributes: { pac: 72, sho: 76, pas: 89, dri: 90, def: 72, phy: 65 }, ovr: 87, photo: null },
            { id: '8', name: 'Manuel Neuer', position: 'POR', attributes: { pac: 59, sho: 16, pas: 91, dri: 85, def: 91, phy: 83 }, ovr: 87, photo: null },
            { id: '9', name: 'Pedri', position: 'MED', attributes: { pac: 79, sho: 74, pas: 86, dri: 85, def: 65, phy: 68 }, ovr: 85, photo: null },
            { id: '10', name: 'Jamal Musiala', position: 'MED', attributes: { pac: 82, sho: 76, pas: 81, dri: 89, def: 42, phy: 65 }, ovr: 84, photo: null }
        ];
        
        return demoPlayers.map(player => ({
            ...player,
            groupId: this.currentGroupId || 'demo-group-1',
            createdAt: new Date().toISOString()
        }));
    }

    getDemoMatches() {
        return [];
    }

    // ============= CRUD OPERATIONS =============
    // These return promises but can be used synchronously for simple operations

    async addPlayer(playerData) {
        if (this.isDemo) {
            // In demo mode, just add to cache
            const newPlayer = {
                ...playerData,
                id: Date.now().toString(),
                groupId: this.currentGroupId,
                createdAt: new Date().toISOString()
            };
            this.cache.players.push(newPlayer);
            return true;
        }
        
        try {
            const success = await window.FirebaseStorage.addPlayer(playerData);
            if (success) {
                await this.refreshCache();
            }
            return success;
        } catch (error) {
            console.error('Error adding player:', error);
            return false;
        }
    }

    async updatePlayer(playerId, updates) {
        if (this.isDemo) {
            const playerIndex = this.cache.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.cache.players[playerIndex] = { ...this.cache.players[playerIndex], ...updates };
                return true;
            }
            return false;
        }
        
        try {
            const success = await window.FirebaseStorage.updatePlayer(playerId, updates);
            if (success) {
                await this.refreshCache();
            }
            return success;
        } catch (error) {
            console.error('Error updating player:', error);
            return false;
        }
    }

    async deletePlayer(playerId) {
        if (this.isDemo) {
            this.cache.players = this.cache.players.filter(p => p.id !== playerId);
            return true;
        }
        
        try {
            const success = await window.FirebaseStorage.deletePlayer(playerId);
            if (success) {
                await this.refreshCache();
            }
            return success;
        } catch (error) {
            console.error('Error deleting player:', error);
            return false;
        }
    }

    async addMatch(matchData) {
        if (this.isDemo) {
            const newMatch = {
                ...matchData,
                id: Date.now().toString(),
                groupId: this.currentGroupId,
                createdAt: new Date().toISOString()
            };
            this.cache.matches.push(newMatch);
            return true;
        }
        
        try {
            const success = await window.FirebaseStorage.addMatch(matchData);
            if (success) {
                await this.refreshCache();
            }
            return success;
        } catch (error) {
            console.error('Error adding match:', error);
            return false;
        }
    }

    async updateMatch(matchId, updates) {
        if (this.isDemo) {
            const matchIndex = this.cache.matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                this.cache.matches[matchIndex] = { ...this.cache.matches[matchIndex], ...updates };
                return true;
            }
            return false;
        }
        
        try {
            const success = await window.FirebaseStorage.updateMatch(matchId, updates);
            if (success) {
                await this.refreshCache();
            }
            return success;
        } catch (error) {
            console.error('Error updating match:', error);
            return false;
        }
    }

    // ============= SESSION MANAGEMENT =============

    getCurrentPerson() {
        if (this.isDemo) {
            return { id: 'demo-person-1' };
        }
        return this.currentPersonId ? { id: this.currentPersonId } : null;
    }

    getCurrentGroup() {
        if (this.isDemo) {
            return { id: 'demo-group-1' };
        }
        return this.currentGroupId ? { id: this.currentGroupId } : null;
    }

    setCurrentPerson(personId) {
        this.currentPersonId = personId;
        if (personId === 'demo-person-1') {
            this.isDemo = true;
        }
    }

    setCurrentGroup(groupId) {
        this.currentGroupId = groupId;
        if (groupId === 'demo-group-1') {
            this.isDemo = true;
        }
    }

    clearSession() {
        this.currentPersonId = null;
        this.currentGroupId = null;
        this.isDemo = false;
        this.clearCache();
    }

    // ============= CACHE MANAGEMENT =============

    async refreshCache() {
        if (this.isDemo) return;
        
        try {
            if (window.FirebaseStorage && this.currentGroupId) {
                this.cache.players = await window.FirebaseStorage.getPlayers();
                this.cache.matches = await window.FirebaseStorage.getMatches();
                this.cache.lastUpdate = Date.now();
            }
        } catch (error) {
            console.error('Error refreshing cache:', error);
        }
    }

    clearCache() {
        this.cache = {
            persons: [],
            groups: [],
            players: [],
            matches: [],
            lastUpdate: 0
        };
    }

    // ============= COMPATIBILITY METHODS =============

    saveMatch(matchData) {
        return this.addMatch(matchData);
    }

    saveMatches() {
        // Not needed with Firestore
        return true;
    }

    getPersonsInGroup(groupId) {
        if (this.isDemo) {
            return this.getDemoPersons();
        }
        return [];
    }
}

// Create singleton instance
const Storage = new StorageWrapper();

// Export for modules and global access
window.Storage = Storage;
export default Storage;