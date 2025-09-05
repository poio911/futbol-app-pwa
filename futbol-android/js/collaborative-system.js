console.log('📜 Loading NEW collaborative-system.js (REFACTORED)...');

/**
 * 🔧 COLLABORATIVE FOOTBALL SYSTEM - REFACTORED VERSION
 * 
 * CLEAN ARCHITECTURE WITH:
 * - Clear data structures
 * - Proper state management  
 * - Organizer permissions
 * - Guest player system
 * - Team generation
 * - Evaluation system
 * 
 * Author: Claude Code Assistant
 * Date: 2025-09-01
 */

class CollaborativeSystem {
    constructor() {
        console.log('🏗️ Creating NEW CollaborativeSystem instance...');
        
        // ✅ PHASE 1: CORE DATA STRUCTURES
        this.state = {
            currentUser: null,
            matches: new Map(), // Single source of truth for ALL matches
            isLoading: false,
            error: null
        };
        
        // ✅ PHASE 1: CONFIGURATION
        this.config = {
            maxPlayers: 10,        // Players needed to start a match
            maxTotal: 14,          // Max players including substitutes
            minTeamSize: 5,        // Players per team
            evaluationsPerPlayer: 2 // How many teammates each player evaluates
        };
        
        // ✅ PHASE 1: INTERNAL FLAGS
        this.flags = {
            initialized: false,
            listenersAttached: false,
            isCreatingMatch: false
        };
        
        console.log('✅ Core data structures initialized');
        this.init();
    }

    /**
     * ✅ PHASE 1: INITIALIZATION
     */
    init() {
        console.log('🚀 Initializing NEW CollaborativeSystem...');
        
        if (this.flags.initialized) {
            console.log('⚠️ System already initialized');
            return;
        }
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }
    
    onDOMReady() {
        console.log('📄 DOM ready - completing initialization...');
        this.attachEventListeners();
        this.loadAllMatches();
        this.flags.initialized = true;
        console.log('✅ System initialization complete');
    }

    /**
     * ✅ PHASE 1: STATE MANAGEMENT
     */
    setState(newState) {
        console.log('📊 Updating state:', newState);
        this.state = { ...this.state, ...newState };
        this.renderUI();
    }
    
    getState() {
        return { ...this.state };
    }
    
    /**
     * ✅ PHASE 1: MATCH DATA MANAGEMENT
     */
    addMatch(match, skipRender = false) {
        console.log(`📥 Adding match to state: ${match.id}`);
        this.state.matches.set(match.id, match);
        if (!skipRender) {
            this.renderUI();
        }
    }
    
    getMatch(matchId) {
        return this.state.matches.get(matchId);
    }
    
    getAllMatches() {
        return Array.from(this.state.matches.values());
    }
    
    getAvailableMatches() {
        const currentUserId = this.state.currentUser?.uid;
        return this.getAllMatches().filter(match => {
            // Show if: open status AND (not registered OR is organizer)
            if (match.status !== 'open') return false;
            
            const isRegistered = this.isUserRegistered(match, currentUserId);
            const isOrganizer = this.isUserOrganizer(match, currentUserId);
            
            // Show if not registered (can join) OR if organizer (can manage)
            return !isRegistered || isOrganizer;
        });
    }
    
    getUserMatches() {
        const currentUserId = this.state.currentUser?.uid;
        if (!currentUserId) return [];
        
        return this.getAllMatches().filter(match => 
            this.isUserRegistered(match, currentUserId)
        );
    }

    /**
     * ✅ PHASE 1: USER UTILITY FUNCTIONS
     */
    isUserRegistered(match, userId) {
        if (!match.registeredPlayers || !userId) return false;
        return match.registeredPlayers.some(player => player.uid === userId);
    }
    
    isUserOrganizer(match, userId) {
        if (!match.organizer || !userId) return false;
        return match.organizer.uid === userId;
    }

    /**
     * ✅ PHASE 1: BASIC EVENT LISTENERS (will expand in Phase 2)
     */
    attachEventListeners() {
        if (this.flags.listenersAttached) {
            console.log('⚠️ Event listeners already attached');
            return;
        }
        
        console.log('🔗 Attaching event listeners...');
        
        const createBtn = document.getElementById('create-match-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateMatchModal());
            console.log('✅ Create match button listener attached');
        }
        
        this.flags.listenersAttached = true;
        console.log('✅ Basic event listeners attached');
    }
    
    // ✅ BUG FIX 1: Add missing reinitializeEventListeners method
    reinitializeEventListeners() {
        console.log('🔄 Re-initializing event listeners...');
        this.flags.listenersAttached = false;
        this.attachEventListeners();
    }
    
    // ✅ EMERGENCY FIX 1: Add missing loadMatches alias
    loadMatches() {
        console.log('🔄 loadMatches called - delegating to loadAllMatches');
        return this.loadAllMatches();
    }

    /**
     * ✅ PHASE 2: USER AUTHENTICATION & ORGANIZER LOGIC
     */
    setCurrentUser(user) {
        console.log('👤 Setting current user:', user?.displayName || 'null');
        
        if (!user) {
            this.setState({ currentUser: null });
            return;
        }
        
        // Validate user object
        if (!user.uid || !user.displayName) {
            console.error('❌ Invalid user object:', user);
            this.setState({ error: 'Invalid user data' });
            return;
        }
        
        // Normalize user object
        const normalizedUser = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email || null,
            photo: user.photo || null,
            position: user.position || 'MED',
            ovr: user.ovr || 50,
            currentGroup: user.currentGroup || 'o8ZOD6N0KEHrvweFfTAd'
        };
        
        this.setState({ currentUser: normalizedUser });
        console.log('✅ User set successfully:', normalizedUser.displayName);
        
        // Reload matches with new user context
        this.loadAllMatches();
    }
    
    /**
     * ✅ PHASE 2: ORGANIZER PERMISSION CHECKS
     */
    canUserCreateMatch(userId = null) {
        const user = userId || this.state.currentUser?.uid;
        return !!user; // Any authenticated user can create matches
    }
    
    canUserJoinMatch(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Can't join if already registered
        if (this.isUserRegistered(match, user)) return false;
        
        // Calculate total players including guests
        const totalPlayers = (match.registeredPlayers?.length || 0) + (match.guestPlayers?.length || 0);
        
        // Can't join if match is full
        if (totalPlayers >= (match.maxTotal || 14)) return false;
        
        // Can join if match is open
        return match.status === 'open';
    }
    
    canUserInviteGuests(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Only organizers can invite guests
        if (!this.isUserOrganizer(match, user)) return false;
        
        // Can't invite if match is already at max capacity
        const currentCount = match.registeredPlayers.length + (match.guestPlayers?.length || 0);
        if (currentCount >= match.maxTotal) return false;
        
        return true;
    }
    
    canUserDeleteMatch(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Only organizers can delete matches
        return this.isUserOrganizer(match, user);
    }
    
    canUserLeaveMatch(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Must be registered to leave
        if (!this.isUserRegistered(match, user)) return false;
        
        // Can always leave (even organizers)
        return true;
    }
    
    canUserViewTeams(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Can view if registered in match and teams are generated
        return this.isUserRegistered(match, user) && !!match.teams;
    }
    
    canUserFinalizeMatch(match, userId = null) {
        const user = userId || this.state.currentUser?.uid;
        if (!user) return false;
        
        // Only organizers can finalize
        if (!this.isUserOrganizer(match, user)) return false;
        
        // Must have teams generated and be full
        return match.status === 'full' && !!match.teams && 
               match.registeredPlayers.length >= this.config.maxPlayers;
    }
    
    /**
     * ✅ PHASE 2: USER CONTEXT HELPERS
     */
    getCurrentUser() {
        return this.state.currentUser;
    }
    
    isCurrentUserRegistered(match) {
        const userId = this.state.currentUser?.uid;
        return this.isUserRegistered(match, userId);
    }
    
    isCurrentUserOrganizer(match) {
        const userId = this.state.currentUser?.uid;
        return this.isUserOrganizer(match, userId);
    }
    
    async loadAllMatches() {
        console.log('📥 Loading all matches from Firebase...');
        this.setState({ isLoading: true, error: null });
        
        try {
            let matches = [];
            
            // Load from Firebase
            if (typeof db !== 'undefined' && db) {
                console.log('🔗 Loading from Firebase collection: collaborative_matches');
                const snapshot = await db.collection('collaborative_matches')
                    .where('status', 'in', ['open', 'full'])
                    .get();
                    
                matches = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                console.log(`📊 Loaded ${matches.length} matches from Firebase`);
            } else {
                // Fallback to localStorage
                console.log('🔗 Loading from localStorage fallback');
                matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]')
                    .filter(match => match.status === 'open' || match.status === 'full');
                console.log(`📊 Loaded ${matches.length} matches from localStorage`);
            }
            
            // Clear existing matches and add new ones
            this.state.matches.clear();
            matches.forEach(match => {
                this.state.matches.set(match.id, match);
            });
            
            console.log(`✅ Successfully loaded ${matches.length} matches`);
            this.setState({ isLoading: false });
            
        } catch (error) {
            console.error('❌ Error loading matches:', error);
            this.setState({ isLoading: false, error: error.message });
        }
    }
    
    /**
     * ✅ PHASE 3: MATCH CREATION & LIFECYCLE MANAGEMENT
     */
    showCreateMatchModal() {
        
        // Remove any existing modal first
        const existingModal = document.getElementById('create-match-modal');
        if (existingModal) {
            console.log('⚠️ Removing existing modal...');
            existingModal.remove();
        }
        console.log('🎯 Opening create match modal...');
        
        if (!this.canUserCreateMatch()) {
            alert('❌ Debes estar autenticado para crear un partido');
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="create-match-modal" class="modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
            ">
                <div class="modal-content" style="
                    background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h2 style="margin: 0 0 20px 0; color: #333;">⚽ Crear Nuevo Partido</h2>
                    <div id="create-match-form">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Título del partido:</label>
                            <input type="text" name="title" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha:</label>
                            <input type="date" name="date" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Hora:</label>
                            <input type="time" name="time" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ubicación:</label>
                            <input type="text" name="location" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Formato:</label>
                            <select name="format" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <option value="">Selecciona formato...</option>
                                <option value="5v5">⚽ Fútbol 5 (10 jugadores)</option>
                                <option value="7v7">🏟️ Fútbol 7 (14 jugadores)</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Descripción (opcional):</label>
                            <textarea name="description" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="collaborativeSystem.closeCreateMatchModal()" style="
                                background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;
                            ">Cancelar</button>
                            <button type="button" id="create-match-submit-btn" style="
                                background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;
                            ">Crear Partido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Attach form listener
        const form = document.getElementById('create-match-form');
        if (form) {
            console.log('🔗 Attaching form submit listener...');
            const submitBtn = document.getElementById('create-match-submit-btn');
            if (submitBtn) {
                console.log('🔗 Attaching button click listener...');
                submitBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📝 Submit button clicked!');
                    const formElement = document.getElementById('create-match-form');
                    if (formElement) {
                        // Create a submit event manually
                        const submitEvent = new Event('submit', {
                            bubbles: true,
                            cancelable: true
                        });
                        // Simulate form submission
                        this.handleCreateMatch(submitEvent);
                    }
                    return false;
                };
            }
        } else {
            console.error('❌ Create match form not found!');
        }
        
        // Close on outside click
        const modal = document.getElementById('create-match-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeCreateMatchModal();
        });
        
        console.log('✅ Create match modal opened');
    }
    
    closeCreateMatchModal() {
        const modal = document.getElementById('create-match-modal');
        if (modal) {
            modal.remove();
            console.log('✅ Create match modal closed');
        }
    }
    
    async handleCreateMatch(event) {
        console.log('🚀 handleCreateMatch called!');
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        
        if (this.flags.isCreatingMatch) {
            console.log('⏳ Match creation already in progress...');
            return;
        }
        
        this.flags.isCreatingMatch = true;
        console.log('🏗️ Creating new match...');
        
        try {
            // Get values directly from form inputs
            const title = document.querySelector('#create-match-form input[name="title"]')?.value?.trim();
            const date = document.querySelector('#create-match-form input[name="date"]')?.value;
            const time = document.querySelector('#create-match-form input[name="time"]')?.value;
            const location = document.querySelector('#create-match-form input[name="location"]')?.value?.trim();
            const format = document.querySelector('#create-match-form select[name="format"]')?.value;
            const description = document.querySelector('#create-match-form textarea[name="description"]')?.value?.trim() || '';
            
            const currentUser = this.state.currentUser;
            
            // Validate current user
            if (!currentUser) {
                throw new Error('No current user found');
            }
            
            // Validate required fields
            if (!title || !date || !time || !location || !format) {
                throw new Error('Por favor completa todos los campos obligatorios');
            }
            
            // Get match format and calculate max players
            const maxPlayers = format === '7v7' ? 14 : 10;
            const maxTotal = format === '7v7' ? 18 : 14; // Allow extra substitutes
            
            // Create match object
            const matchData = {
                id: this.generateMatchId(),
                title: title,
                date: date,
                time: time,
                location: location,
                description: description,
                format: format, // '5v5' or '7v7'
                
                // Match configuration
                maxPlayers: maxPlayers,
                maxTotal: maxTotal,
                status: 'open',
                
                // Organizer info
                organizer: {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email
                },
                
                // Players arrays
                registeredPlayers: [], // Will be populated when users join
                guestPlayers: [],       // Invited non-registered players
                
                // Match state
                teams: null,
                evaluationAssignments: null,
                evaluations: [],
                
                // Metadata
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                groupId: currentUser.currentGroup
            };
            
            // Validate required fields
            if (!matchData.title || !matchData.date || !matchData.time || !matchData.location || !matchData.format) {
                throw new Error('Por favor completa todos los campos obligatorios');
            }
            
            // Validate date is not in the past
            const matchDateTime = new Date(`${matchData.date}T${matchData.time}`);
            if (matchDateTime < new Date()) {
                throw new Error('La fecha y hora del partido no puede ser en el pasado');
            }
            
            console.log('💾 Saving match to Firebase...');
            await this.saveMatchToFirebase(matchData);
            
            // Add to local state immediately (skip auto-render)
            this.addMatch(matchData, true);
            
            // Force UI refresh to show the new match
            console.log('🔄 Forcing UI refresh after match creation...');
            this.renderUI();
            
            this.closeCreateMatchModal();
            alert(`✅ ¡Partido "${matchData.title}" creado exitosamente!`);
            
            console.log('✅ Match created successfully and displayed:', matchData.id);
            
        } catch (error) {
            console.error('❌ Error creating match:', error);
            alert(`❌ Error al crear el partido: ${error.message}`);
        } finally {
            this.flags.isCreatingMatch = false;
        }
    }
    
    generateMatchId() {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `match_${timestamp}_${randomStr}`;
    }
    
    async saveMatchToFirebase(matchData) {
        console.log('💾 Saving match to Firebase...', matchData.id);
        
        try {
            // Use the existing Firebase connection (db is global)
            if (typeof db !== 'undefined' && db) {
                await db.collection('collaborative_matches').doc(matchData.id).set(matchData);
                console.log('✅ Match saved to Firebase successfully');
            } else {
                // Fallback to localStorage if Firebase is not available
                console.log('⚠️ Firebase not available, using localStorage fallback');
                const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
                const existingIndex = matches.findIndex(m => m.id === matchData.id);
                if (existingIndex >= 0) {
                    matches[existingIndex] = matchData;
                } else {
                    matches.push(matchData);
                }
                localStorage.setItem('collaborative_matches', JSON.stringify(matches));
                console.log('✅ Match saved to localStorage');
            }
        } catch (error) {
            console.error('❌ Error saving match:', error.message || error);
            console.error('Full error:', error);
            throw error;
        }
    }
    
    /**
     * ✅ PHASE 3: MATCH JOINING/LEAVING
     */
    async joinMatch(matchId) {
        console.log(`🏃 User attempting to join match: ${matchId}`);
        
        const match = this.getMatch(matchId);
        if (!match) {
            alert('❌ Error: No se pudo encontrar el partido');
            return;
        }
        
        const currentUser = this.state.currentUser;
        if (!currentUser) {
            alert('❌ Debes estar autenticado para unirte a un partido');
            return;
        }
        
        if (!this.canUserJoinMatch(match)) {
            alert('❌ No puedes unirte a este partido');
            return;
        }
        
        try {
            // Add user to registered players
            const playerData = {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                position: currentUser.position,
                ovr: currentUser.ovr,
                email: currentUser.email,
                registeredAt: new Date().toISOString(),
                isGuest: false
            };
            
            match.registeredPlayers.push(playerData);
            match.updatedAt = new Date().toISOString();
            
            // Check if match should be marked as full and generate teams
            if (match.registeredPlayers.length >= this.config.maxPlayers) {
                match.status = 'full';
                await this.generateTeamsForMatch(match);
                console.log('🏆 Match is now full - teams generated!');
            }
            
            // Save to Firebase
            await this.saveMatchToFirebase(match);
            
            // Update local state
            this.addMatch(match, true);
            
            // Force UI refresh
            this.renderUI();
            
            // Show success notification
            this.showNotification('✅ ¡Te uniste al partido exitosamente!', 'success');
            console.log('✅ User joined match successfully');
            
        } catch (error) {
            console.error('❌ Error joining match:', error);
            alert('❌ Error al unirse al partido. Intenta de nuevo.');
        }
    }
    
    async leaveMatch(matchId) {
        console.log(`🚪 User attempting to leave match: ${matchId}`);
        
        const match = this.getMatch(matchId);
        if (!match) {
            alert('❌ Error: No se pudo encontrar el partido');
            return;
        }
        
        const currentUser = this.state.currentUser;
        if (!currentUser || !this.canUserLeaveMatch(match)) {
            alert('❌ No puedes salir de este partido');
            return;
        }
        
        if (!confirm('⚠️ ¿Estás seguro de que quieres salir de este partido?')) {
            return;
        }
        
        try {
            // Remove user from registered players
            match.registeredPlayers = match.registeredPlayers.filter(
                player => player.uid !== currentUser.uid
            );
            
            // Update match status if needed
            if (match.status === 'full' && match.registeredPlayers.length < this.config.maxPlayers) {
                match.status = 'open';
                match.teams = null; // Clear teams since we're below minimum
                match.evaluationAssignments = null;
            }
            
            match.updatedAt = new Date().toISOString();
            
            // Save to Firebase
            await this.saveMatchToFirebase(match);
            
            // Update local state
            this.addMatch(match, true);
            
            // Force UI refresh
            this.renderUI();
            
            // Show success notification
            this.showNotification('✅ Saliste del partido exitosamente', 'success');
            console.log('✅ User left match successfully');
            
        } catch (error) {
            console.error('❌ Error leaving match:', error);
            alert('❌ Error al salir del partido. Intenta de nuevo.');
        }
    }
    
    async deleteMatch(matchId) {
        console.log(`🗑️ User attempting to delete match: ${matchId}`);
        
        const match = this.getMatch(matchId);
        if (!match) {
            alert('❌ Error: No se pudo encontrar el partido');
            return;
        }
        
        if (!this.canUserDeleteMatch(match)) {
            alert('❌ No tienes permisos para borrar este partido');
            return;
        }
        
        if (!confirm(`⚠️ ¿Estás seguro de que quieres borrar el partido "${match.title}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            // Delete from Firebase
            if (typeof db !== 'undefined' && db) {
                console.log('🗑️ Deleting from Firebase:', matchId);
                await db.collection('collaborative_matches').doc(matchId).delete();
                console.log('✅ Match deleted from Firebase');
            } else {
                // Delete from localStorage
                console.log('🗑️ Deleting from localStorage:', matchId);
                const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
                const filteredMatches = matches.filter(m => m.id !== matchId);
                localStorage.setItem('collaborative_matches', JSON.stringify(filteredMatches));
                console.log('✅ Match deleted from localStorage');
            }
            
            // Remove from local state
            this.state.matches.delete(matchId);
            this.renderUI();
            
            alert('✅ Partido borrado exitosamente');
            console.log('✅ Match deleted successfully');
            
        } catch (error) {
            console.error('❌ Error deleting match:', error);
            alert('❌ Error al borrar el partido. Intenta de nuevo.');
        }
    }
    
    // ✅ BUG FIX 3: BASIC UI RENDERING
    renderUI() {
        console.log('🎨 Rendering UI...');
        
        const matchesContainer = document.getElementById('all-matches');
        
        if (matchesContainer) {
            // Use new unified rendering
            try {
                this.renderAllMatches();
                console.log('✅ UI rendered successfully (unified mode)');
                return;
            } catch (error) {
                console.error('❌ Error in unified rendering:', error);
            }
        }
        
        // Fallback to legacy containers
        const availableContainer = document.getElementById('available-matches');
        const userContainer = document.getElementById('user-matches');
        
        if (!availableContainer || !userContainer) {
            console.log('⚠️ No UI containers found - skipping render');
            return;
        }
        
        // Use old rendering for backward compatibility
        this.renderAvailableMatches();
        this.renderUserMatches();
        console.log('✅ UI rendered successfully (legacy mode)');
    }
    
    renderAvailableMatches() {
        const container = document.getElementById('available-matches');
        if (!container) return;
        
        const availableMatches = this.getAvailableMatches();
        console.log('🎨 Rendering available matches:', availableMatches.length);
        
        if (availableMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <h3>📅 No hay partidos disponibles</h3>
                    <p>¡Sé el primero en crear uno!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = availableMatches.map(match => this.renderMatchCard(match, 'available')).join('');
    }
    
    renderUserMatches() {
        const container = document.getElementById('user-matches');
        if (!container) return;
        
        const userMatches = this.getUserMatches();
        console.log('🎨 Rendering user matches:', userMatches.length);
        
        if (userMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <h3>⚽ No estás anotado en ningún partido</h3>
                    <p>¡Explora los partidos disponibles arriba!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userMatches.map(match => this.renderMatchCard(match, 'user')).join('');
    }
    
    renderAllMatches() {
        const container = document.getElementById('all-matches');
        if (!container) return;
        
        const allMatches = this.getAllMatches();
        console.log('🎨 Rendering all matches:', allMatches.length);
        
        if (allMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #333; background: rgba(255,255,255,0.9); border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #333;">📅 No hay partidos disponibles</h3>
                    <p style="color: #666;">¡Sé el primero en crear uno!</p>
                </div>
            `;
            return;
        }
        
        // Sort matches by date
        const sortedMatches = allMatches.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        container.innerHTML = sortedMatches.map(match => this.renderMatchCard(match, 'unified')).join('');
    }
    
    renderMatchCard(match, type) {
        const currentUser = this.state.currentUser;
        const isOrganizer = this.isCurrentUserOrganizer(match);
        const isRegistered = this.isCurrentUserRegistered(match);
        
        // Ensure registeredPlayers is an array
        if (!match.registeredPlayers) {
            match.registeredPlayers = [];
        }
        
        // Format date and time
        const matchDate = new Date(`${match.date}T${match.time}`);
        const dateStr = matchDate.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
        const timeStr = matchDate.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Status display
        const statusText = match.status === 'open' ? 'Abierto' : 
                          match.status === 'full' ? 'Completo' : 'Cerrado';
        const statusColor = match.status === 'open' ? '#28a745' : 
                           match.status === 'full' ? '#007bff' : '#6c757d';
        
        // Generate action buttons based on context and permissions
        let buttons = '';
        
        // Modern button styles
        const buttonStyle = `
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        
        // Show Join or Leave button based on registration status
        if (!isRegistered && this.canUserJoinMatch(match)) {
            buttons += `<button onclick="collaborativeSystem.joinMatch('${match.id}')" 
                               style="${buttonStyle} background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"
                               onmouseover="this.style.transform='scale(1.05)'"
                               onmouseout="this.style.transform='scale(1)'">
                            🏃 Anotarse
                        </button>`;
        } else if (isRegistered && this.canUserLeaveMatch(match)) {
            buttons += `<button onclick="collaborativeSystem.leaveMatch('${match.id}')" 
                               style="${buttonStyle} background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;"
                               onmouseover="this.style.transform='scale(1.05)'"
                               onmouseout="this.style.transform='scale(1)'">
                            🚪 Salir
                        </button>`;
        }
        
        // Show View Teams button if registered and teams are generated
        if (isRegistered && this.canUserViewTeams(match)) {
            buttons += `<button onclick="collaborativeSystem.showTeamsModal('${match.id}')" 
                               style="${buttonStyle} background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;"
                               onmouseover="this.style.transform='scale(1.05)'"
                               onmouseout="this.style.transform='scale(1)'">
                            ⚽ Ver Equipos
                        </button>`;
        }
        
        // Invite button always visible for organizer
        if (this.canUserInviteGuests(match)) {
            buttons += `<button onclick="collaborativeSystem.showInviteGuestsModal('${match.id}')" 
                               style="${buttonStyle} background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;"
                               onmouseover="this.style.transform='scale(1.05)'"
                               onmouseout="this.style.transform='scale(1)'">
                            🎭 Invitar
                        </button>`;
        }
        
        if (isOrganizer && this.canUserDeleteMatch(match)) {
            buttons += `<button onclick="collaborativeSystem.deleteMatch('${match.id}')" 
                               style="${buttonStyle} background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white;"
                               onmouseover="this.style.transform='scale(1.05)'"
                               onmouseout="this.style.transform='scale(1)'">
                            🗑️ Borrar
                        </button>`;
        }
        
        // Card style with clean design
        const borderColor = isRegistered ? '#28a745' : '#e0e0e0';
        const borderWidth = isRegistered ? '2px' : '1px';
        
        return `
            <div class="match-card" style="
                border: ${borderWidth} solid ${borderColor}; 
                border-radius: 12px; 
                padding: 20px; 
                margin-bottom: 20px; 
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ${isOrganizer ? 'border-left: 4px solid #007bff;' : ''}
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 1.2em;">
                            ${match.title} 
                            ${isOrganizer ? '<span style="color: #007bff; font-size: 0.75em; font-weight: normal;">(Organizador)</span>' : ''}
                        </h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="background: ${statusColor}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 500;">
                                ${statusText}
                            </span>
                            ${isRegistered ? '<span style="color: #28a745; font-weight: 600; font-size: 0.9em;">✓ Anotado</span>' : ''}
                        </div>
                    </div>
                    <div style="text-align: right; color: #555; font-size: 0.9em; font-weight: 500;">
                        <div>${match.format || '5v5'}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div>
                        <div style="color: #666; font-size: 0.85em; margin-bottom: 3px;">📅 Fecha y hora</div>
                        <div style="font-weight: 600; color: #333;">${dateStr} a las ${timeStr}</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.85em; margin-bottom: 3px;">📍 Ubicación</div>
                        <div style="font-weight: 600; color: #333;">${match.location}</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.85em; margin-bottom: 3px;">👥 Jugadores</div>
                        <div style="font-weight: 600; color: #333;">${match.registeredPlayers.length}/${match.maxPlayers || 10}</div>
                    </div>
                    <div>
                        <div style="color: #666; font-size: 0.85em; margin-bottom: 3px;">👤 Organiza</div>
                        <div style="font-weight: 600; color: #333;">${match.organizer?.displayName || 'Desconocido'}</div>
                    </div>
                </div>
                
                ${match.description ? `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; color: #555; font-style: italic;">
                        ${match.description}
                    </div>
                ` : ''}
                
                ${buttons ? `
                    <div style="border-top: 1px solid #eee; padding-top: 15px;">
                        ${buttons}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Placeholder methods for buttons that will be implemented in later phases
    async showInviteGuestsModal(matchId) {
        console.log('🎭 Opening invite guests modal for match:', matchId);
        
        try {
            const match = this.getMatch(matchId);
            if (!match) {
                alert('❌ Error: No se pudo encontrar el partido');
                return;
            }
            
            // Check if user is the organizer
            const currentUser = this.state.currentUser;
            if (!currentUser || match.organizer.uid !== currentUser.uid) {
                alert('❌ Solo el organizador puede invitar jugadores');
                return;
            }
            
            // Get all players from storage
            const allPlayers = Storage.getPlayers() || [];
            console.log('📋 All players from storage:', allPlayers);
            
            // Get already registered player IDs
            const registeredIds = match.registeredPlayers.map(p => p.uid || p.id);
            console.log('✅ Already registered IDs:', registeredIds);
            
            // Filter available players (not already registered)
            const availablePlayers = allPlayers.filter(player => {
                return !registeredIds.includes(player.id) && 
                       !registeredIds.includes(player.uid) &&
                       player.name && player.name !== 'Nuevo Jugador';
            });
            
            console.log('🆓 Available players:', availablePlayers);
            
            // Calculate current capacity
            const currentCount = match.registeredPlayers.length + (match.guestPlayers?.length || 0);
            const maxCapacity = match.maxTotal || match.maxPlayers || (match.format === '7v7' ? 18 : 14);
            const spotsAvailable = maxCapacity - currentCount;
            
            // Create modal HTML
            const modalHtml = `
                <div id="invite-players-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                ">
                    <div style="
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        max-width: 600px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #333;">🎭 Invitar Jugadores</h2>
                            <button onclick="collaborativeSystem.closeInviteModal()" style="
                                background: transparent;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #999;
                            ">✖</button>
                        </div>
                        
                        <div style="
                            background: #f0f8ff;
                            padding: 15px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                            border: 1px solid #007bff;
                        ">
                            <h3 style="margin: 0 0 10px 0; color: #007bff;">${match.title}</h3>
                            <p style="margin: 5px 0;">📅 ${match.date} - ⏰ ${match.time}</p>
                            <p style="margin: 5px 0;">📍 ${match.location}</p>
                            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold; color: ${spotsAvailable > 0 ? '#28a745' : '#dc3545'}">
                                👥 Jugadores: ${currentCount}/${maxCapacity} 
                                ${spotsAvailable > 0 ? `(${spotsAvailable} lugares disponibles)` : '(COMPLETO)'}
                            </p>
                        </div>
                        
                        ${spotsAvailable > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <h3 style="color: #333; margin-bottom: 15px;">📋 Jugadores Disponibles:</h3>
                                ${availablePlayers.length > 0 ? `
                                    <div id="available-players-list" style="
                                        max-height: 250px;
                                        overflow-y: auto;
                                        border: 1px solid #ddd;
                                        border-radius: 5px;
                                        padding: 10px;
                                    ">
                                        ${availablePlayers.map(player => `
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                padding: 10px;
                                                margin: 5px 0;
                                                background: #f9f9f9;
                                                border-radius: 5px;
                                                cursor: pointer;
                                                transition: background 0.3s;
                                            " 
                                            onmouseover="this.style.background='#e9ecef'"
                                            onmouseout="this.style.background='#f9f9f9'">
                                                <input type="checkbox" 
                                                       id="player-${player.id}" 
                                                       value="${player.id}"
                                                       style="margin-right: 15px; width: 20px; height: 20px; cursor: pointer;">
                                                <label for="player-${player.id}" style="
                                                    display: flex;
                                                    align-items: center;
                                                    width: 100%;
                                                    cursor: pointer;
                                                ">
                                                    <div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                                                        ${player.name ? player.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div style="flex: 1;">
                                                        <div style="font-weight: bold; color: #333;">${player.name}</div>
                                                        <div style="color: #666; font-size: 14px;">
                                                            ${player.position || 'N/A'} | OVR: ${player.ovr || 50}
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <p style="color: #666; text-align: center; padding: 20px;">
                                        No hay jugadores disponibles para invitar
                                    </p>
                                `}
                            </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #333; margin-bottom: 15px;">✅ Jugadores Ya Anotados:</h3>
                            <div style="
                                max-height: 200px;
                                overflow-y: auto;
                                border: 1px solid #ddd;
                                border-radius: 5px;
                                padding: 10px;
                                background: #f9f9f9;
                            ">
                                ${match.registeredPlayers.map(player => `
                                    <div style="
                                        display: flex;
                                        align-items: center;
                                        padding: 10px;
                                        margin: 5px 0;
                                        background: white;
                                        border-radius: 5px;
                                        border: 1px solid #e0e0e0;
                                    ">
                                        <div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                                            ${(player.displayName || player.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; color: #333;">${player.displayName || player.name}</div>
                                            <div style="color: #666; font-size: 14px;">
                                                ${player.position || 'N/A'} | OVR: ${player.ovr || 50}
                                            </div>
                                        </div>
                                        ${match.organizer.uid === currentUser.uid ? `
                                            <button onclick="collaborativeSystem.removePlayerFromMatch('${matchId}', '${player.uid || player.id}')" 
                                                    style="
                                                        background: #dc3545;
                                                        color: white;
                                                        border: none;
                                                        padding: 5px 10px;
                                                        border-radius: 5px;
                                                        cursor: pointer;
                                                        font-size: 12px;
                                                    "
                                                    onmouseover="this.style.opacity='0.8'"
                                                    onmouseout="this.style.opacity='1'">
                                                ❌ Quitar
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                                ${match.guestPlayers && match.guestPlayers.length > 0 ? `
                                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                                        <h4 style="color: #666; margin-bottom: 10px;">👥 Invitados:</h4>
                                        ${match.guestPlayers.map(guest => `
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                padding: 10px;
                                                margin: 5px 0;
                                                background: #fff8dc;
                                                border-radius: 5px;
                                                border: 1px solid #ffd700;
                                            ">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: bold; color: #333;">🎭 ${guest.name}</div>
                                                    <div style="color: #666; font-size: 12px;">Invitado</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button onclick="collaborativeSystem.closeInviteModal()" style="
                                background: #6c757d;
                                color: white;
                                padding: 10px 20px;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 16px;
                            "
                            onmouseover="this.style.opacity='0.8'"
                            onmouseout="this.style.opacity='1'">
                                Cancelar
                            </button>
                            ${spotsAvailable > 0 && availablePlayers.length > 0 ? `
                                <button onclick="collaborativeSystem.saveInvitedPlayers('${matchId}')" style="
                                    background: #28a745;
                                    color: white;
                                    padding: 10px 20px;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 16px;
                                    font-weight: bold;
                                "
                                onmouseover="this.style.opacity='0.8'"
                                onmouseout="this.style.opacity='1'">
                                    💾 Guardar Cambios
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Remove any existing modal
            const existingModal = document.getElementById('invite-players-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
        } catch (error) {
            console.error('❌ Error opening invite modal:', error);
            alert('❌ Error al abrir el modal de invitación');
        }
    }
    
    closeInviteModal() {
        const modal = document.getElementById('invite-players-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    async saveInvitedPlayers(matchId) {
        console.log('💾 Saving invited players for match:', matchId);
        
        try {
            // Get selected players
            const checkboxes = document.querySelectorAll('#available-players-list input[type="checkbox"]:checked');
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);
            
            if (selectedIds.length === 0) {
                alert('⚠️ Por favor selecciona al menos un jugador');
                return;
            }
            
            const match = this.getMatch(matchId);
            if (!match) {
                throw new Error('Match not found');
            }
            
            // Get player data for selected IDs
            const allPlayers = Storage.getPlayers() || [];
            const playersToAdd = allPlayers.filter(p => selectedIds.includes(p.id));
            
            // Check capacity
            const currentCount = match.registeredPlayers.length + (match.guestPlayers?.length || 0);
            const newTotal = currentCount + playersToAdd.length;
            
            if (newTotal > match.maxTotal) {
                alert(`❌ No se pueden agregar ${playersToAdd.length} jugadores. Solo hay ${match.maxTotal - currentCount} lugares disponibles.`);
                return;
            }
            
            // Add players to match
            playersToAdd.forEach(player => {
                match.registeredPlayers.push({
                    uid: player.id,
                    displayName: player.name,
                    position: player.position || 'N/A',
                    ovr: player.ovr || 50,
                    photo: player.photo || '',
                    registeredAt: new Date().toISOString(),
                    isGuest: false
                });
            });
            
            // Update match
            match.updatedAt = new Date().toISOString();
            
            // Save to Firebase
            console.log('📤 Saving updated match to Firebase...');
            await this.saveMatchToFirebase(match);
            
            // Update local state (matches is a Map)
            this.state.matches.set(matchId, match);
            
            // Close modal and refresh UI
            this.closeInviteModal();
            this.renderMatches();
            
            alert(`✅ Se agregaron ${playersToAdd.length} jugador(es) al partido`);
            console.log('✅ Players added successfully');
            
        } catch (error) {
            console.error('❌ Error saving invited players:', error.message || error);
            console.error('Full error details:', error);
            alert(`❌ Error al guardar los jugadores invitados: ${error.message || 'Error desconocido'}`);
        }
    }
    
    async removePlayerFromMatch(matchId, playerId) {
        console.log('🗑️ Removing player from match:', { matchId, playerId });
        
        if (!confirm('¿Estás seguro de que quieres quitar a este jugador del partido?')) {
            return;
        }
        
        try {
            const match = this.getMatch(matchId);
            if (!match) {
                throw new Error('Match not found');
            }
            
            // Remove player from registered players
            match.registeredPlayers = match.registeredPlayers.filter(p => 
                p.uid !== playerId && p.id !== playerId
            );
            
            // Update match
            match.updatedAt = new Date().toISOString();
            
            // Save to Firebase
            await this.saveMatchToFirebase(match);
            
            // Update local state (matches is a Map)
            this.state.matches.set(matchId, match);
            
            // Refresh modal
            this.closeInviteModal();
            await this.showInviteGuestsModal(matchId);
            
            console.log('✅ Player removed successfully');
            
        } catch (error) {
            console.error('❌ Error removing player:', error);
            alert('❌ Error al quitar el jugador');
        }
    }
    
    showTeamsModal(matchId) {
        console.log('⚽ Show teams modal:', matchId);
        
        const match = this.getMatch(matchId);
        if (!match) {
            alert('❌ Error: No se pudo encontrar el partido');
            return;
        }
        
        if (!match.teams) {
            console.log('⚠️ No teams available, generating them first...');
            this.generateTeamsForMatch(match).then(() => {
                // After generating, show modal
                this.displayTeamsModal(match);
            });
        } else {
            this.displayTeamsModal(match);
        }
    }
    
    displayTeamsModal(match) {
        if (!match.teams) {
            alert('❌ No se pudieron generar los equipos');
            return;
        }
        
        // Usar el sistema unificado de modal
        if (window.unifiedTeamsModal) {
            window.unifiedTeamsModal.show(match.teams, {
                title: '⚽ Equipos Generados',
                format: match.format || '5v5',
                showFormation: true,
                showStats: true,
                showBalance: true
            });
        } else {
            console.error('Sistema unificado de modal no disponible');
        }
    }
    
    closeTeamsModal() {
        // Compatibilidad con sistema anterior
        if (window.unifiedTeamsModal) {
            window.unifiedTeamsModal.close();
        }
    }
    
    // ✅ PHASE 5 PREVIEW: Basic team generation (placeholder)
    async generateTeamsForMatch(match) {
        console.log('⚽ Generating teams for match:', match.title);
        
        // Combinar jugadores registrados y invitados
        const registeredPlayers = match.registeredPlayers || [];
        const guestPlayers = match.guestPlayers || [];
        const allPlayers = [...registeredPlayers, ...guestPlayers];
        
        // Verificar cantidad mínima de jugadores
        const minRequired = match.format === '7v7' ? 14 : 10;
        if (allPlayers.length < minRequired) {
            console.log(`⚠️ Not enough players for team generation (${allPlayers.length}/${minRequired})`);
            return;
        }
        
        // Usar el sistema avanzado si está disponible
        if (window.TeamGeneratorAdvanced) {
            try {
                console.log('🎯 Usando sistema avanzado de generación de equipos');
                const result = window.TeamGeneratorAdvanced.generateBalancedTeams(allPlayers, match.format || '5v5');
                
                match.teams = {
                    team1: { 
                        name: result.teamA.name,
                        players: result.teamA.players, 
                        avgOVR: result.teamA.ovr,
                        stats: result.teamA.stats
                    },
                    team2: { 
                        name: result.teamB.name,
                        players: result.teamB.players, 
                        avgOVR: result.teamB.ovr,
                        stats: result.teamB.stats
                    },
                    balance: result.balance,
                    generatedAt: new Date().toISOString()
                };
                
                const guestCount = guestPlayers.length;
                console.log(`✅ Equipos generados con sistema avanzado`);
                console.log(`   ${result.teamA.name}: ${result.teamA.ovr} OVR`);
                console.log(`   ${result.teamB.name}: ${result.teamB.ovr} OVR`);
                console.log(`   Balance: ${result.balance.rating}`);
                console.log(`   Jugadores invitados: ${guestCount}`);
                return;
            } catch (error) {
                console.error('Error en sistema avanzado, usando sistema básico:', error);
                // Continuar con el sistema básico como fallback
            }
        }
        
        // Sistema básico como fallback
        console.log('⚠️ Usando sistema básico de generación de equipos');
        const team1 = [];
        const team2 = [];
        
        // Sort by OVR and alternate assignment for balance
        allPlayers.sort((a, b) => (b.ovr || 70) - (a.ovr || 70));
        
        for (let i = 0; i < allPlayers.length; i++) {
            if (i % 2 === 0) {
                team1.push(allPlayers[i]);
            } else {
                team2.push(allPlayers[i]);
            }
        }
        
        const team1Avg = Math.round(team1.reduce((sum, p) => sum + (p.ovr || 70), 0) / team1.length);
        const team2Avg = Math.round(team2.reduce((sum, p) => sum + (p.ovr || 70), 0) / team2.length);
        
        match.teams = {
            team1: { players: team1, avgOVR: team1Avg },
            team2: { players: team2, avgOVR: team2Avg },
            generatedAt: new Date().toISOString()
        };
        
        const guestCount = guestPlayers.length;
        console.log(`✅ Teams generated with ${guestCount} guests: Team 1 (${team1Avg} OVR) vs Team 2 (${team2Avg} OVR)`);
    }
    
    // ✅ BUG FIX: Add missing renderMatches method
    renderMatches() {
        console.log('🎨 Rendering matches...');
        this.renderUI();
    }

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'collaborative-notification';
        notification.innerHTML = `
            <div class="notification-toast ${type}">
                <div class="notification-content">
                    ${message}
                </div>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('collaborative-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'collaborative-notification-styles';
            style.textContent = `
                .collaborative-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    animation: slideIn 0.3s ease-out;
                }
                
                .notification-toast {
                    background: rgba(25, 25, 25, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px 24px;
                    min-width: 300px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .notification-toast.success {
                    border-left: 4px solid #00ff9d;
                    background: linear-gradient(90deg, rgba(0, 255, 157, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                }
                
                .notification-toast.error {
                    border-left: 4px solid #ff4444;
                    background: linear-gradient(90deg, rgba(255, 68, 68, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                }
                
                .notification-toast.info {
                    border-left: 4px solid #00b4d8;
                    background: linear-gradient(90deg, rgba(0, 180, 216, 0.1) 0%, rgba(25, 25, 25, 0.95) 100%);
                }
                
                .notification-content {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 500;
                    font-family: 'Poppins', sans-serif;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
}

// ✅ PHASE 1: SINGLETON INSTANCE CREATION
console.log('🌟 Creating singleton CollaborativeSystem instance...');
if (!window.collaborativeSystem) {
    window.collaborativeSystem = new CollaborativeSystem();
    console.log('✅ NEW CollaborativeSystem instance created and assigned globally');
} else {
    console.log('⚠️ CollaborativeSystem instance already exists, reusing existing');
}
