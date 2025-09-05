console.log('📜 Loading collaborative-system.js...');

class CollaborativeSystem {
    constructor() {
        console.log('🏗️ Creating CollaborativeSystem instance...');
        this.currentUser = null;
        this.availableMatches = [];
        this.userMatches = [];
        this._isCreatingMatch = false; // Prevent double submission
        this._listenersAttached = false; // Track if listeners are already attached
        this._loadMatchesTimer = null; // Debounce timer for loadMatches
        this.init();
    }

    init() {
        console.log('🚀 Initializing CollaborativeSystem...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachEventListeners();
                this.loadMatches();
            });
        } else {
            this.attachEventListeners();
            this.loadMatches();
        }
    }

    setCurrentUser(user) {
        console.log('🤝 CollaborativeSystem: Setting current user:', user);
        this.currentUser = user;
        if (user) {
            this.loadUserMatches();
        }
    }

    attachEventListeners() {
        console.log('🔗 Attaching event listeners...');
        
        // Prevent multiple attachments
        if (this._listenersAttached) {
            console.log('⚠️ Event listeners already attached, skipping...');
            return;
        }
        
        // Create match button
        const createMatchBtn = document.getElementById('create-match-btn');
        console.log('Create match button found:', createMatchBtn);
        
        if (createMatchBtn) {
            // Remove any existing listeners first
            const newBtn = createMatchBtn.cloneNode(true);
            createMatchBtn.parentNode.replaceChild(newBtn, createMatchBtn);
            
            // Add single listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Create match button clicked!');
                this.showCreateMatchModal();
            });
            console.log('✅ Event listener attached to create match button');
        } else {
            console.log('❌ Create match button not found');
        }

        // Modal close button
        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeCreateMatchModal());
        }

        // Create match form
        const createMatchForm = document.getElementById('create-match-form');
        if (createMatchForm) {
            // Remove any existing listeners first
            const newForm = createMatchForm.cloneNode(true);
            createMatchForm.parentNode.replaceChild(newForm, createMatchForm);
            
            // Add single listener with debounce
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent double submission
                if (this._isCreatingMatch) {
                    console.log('⏳ Already creating match, please wait...');
                    return;
                }
                
                this.handleCreateMatch(e);
            });
        }
        
        // Mark listeners as attached
        this._listenersAttached = true;
        console.log('✅ All event listeners attached successfully');
    }

    showCreateMatchModal() {
        console.log('🎯 Attempting to show create match modal...');
        
        const modal = document.getElementById('create-match-modal');
        console.log('Modal element found:', modal);
        
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ Modal should now be visible');
        } else {
            console.log('❌ Modal element not found');
        }
    }

    closeCreateMatchModal() {
        const modal = document.getElementById('create-match-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        // Reset form
        const form = document.getElementById('create-match-form');
        if (form) {
            form.reset();
        }
    }

    async handleCreateMatch(e) {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (this._isCreatingMatch) {
            console.log('⏳ Match creation already in progress...');
            return;
        }
        this._isCreatingMatch = true;
        
        console.log('🤝 CollaborativeSystem: Attempting to create match');
        console.log('🤝 Current user:', this.currentUser);
        
        // Try to get user from AuthSystem if not set
        if (!this.currentUser && window.AuthSystem && window.AuthSystem.currentUser) {
            console.log('🔄 Getting user from AuthSystem...');
            this.currentUser = window.AuthSystem.currentUser;
        }
        
        // Try to get user from TestApp if still not set
        if (!this.currentUser && window.TestApp && window.TestApp.currentUser) {
            console.log('🔄 Getting user from TestApp...');
            this.currentUser = window.TestApp.currentUser;
        }
        
        console.log('🤝 Final current user:', this.currentUser);
        
        if (!this.currentUser) {
            console.log('❌ No current user found in any system');
            alert('Debes estar autenticado para crear un partido. Por favor, recarga la página e inicia sesión nuevamente.');
            return;
        }

        const formData = new FormData(e.target);
        const matchData = {
            id: this.generateMatchId(),
            organizer: {
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName,
                email: this.currentUser.email
            },
            title: formData.get('match-title'),
            date: formData.get('match-date'),
            time: formData.get('match-time'),
            location: formData.get('match-location'),
            maxPlayers: parseInt(formData.get('max-players') || '10'),
            description: formData.get('match-description') || '',
            registeredPlayers: [], // Organizador no se anota automáticamente
            status: 'open', // open, full, started, completed
            createdAt: new Date().toISOString(),
            groupId: this.currentUser.currentGroup || 'o8ZOD6N0KEHrvweFfTAd' // Default group
        };

        try {
            await this.saveMatchToFirestore(matchData);
            this.closeCreateMatchModal();
            this.loadMatches();
            this.showSuccessMessage('¡Partido creado exitosamente!');
        } catch (error) {
            console.error('Error creating match:', error);
            alert('Error al crear el partido. Intenta de nuevo.');
        } finally {
            // Reset the flag
            this._isCreatingMatch = false;
        }
    }

    async saveMatchToFirestore(matchData) {
        if (typeof db !== 'undefined' && db) {
            // Use Firestore
            await db.collection('collaborative_matches').doc(matchData.id).set(matchData);
        } else {
            // Fallback to localStorage
            const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
            matches.push(matchData);
            localStorage.setItem('collaborative_matches', JSON.stringify(matches));
        }
    }

    async loadMatches() {
        // Debounce to prevent rapid calls
        if (this._loadMatchesTimer) {
            console.log('⏳ loadMatches debounced - skipping rapid call');
            clearTimeout(this._loadMatchesTimer);
        }
        
        // Set a new timer
        this._loadMatchesTimer = setTimeout(() => {
            this._loadMatchesTimer = null;
        }, 500); // 500ms debounce
        
        try {
            let matches = [];
            
            if (typeof db !== 'undefined' && db) {
                // Load from Firestore - Simplified query to avoid index requirement
                console.log('📥 Loading matches from Firestore (simplified query)...');
                try {
                    // Try the complex query first - get ALL matches except completed evaluation
                    const snapshot = await db.collection('collaborative_matches')
                        .where('status', 'in', ['open', 'full'])
                        .orderBy('createdAt', 'desc')
                        .get();
                    matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log('✅ Complex query succeeded');
                } catch (indexError) {
                    console.log('⚠️ Complex query failed, using simple query...');
                    // Fallback to simple query without orderBy
                    const simpleSnapshot = await db.collection('collaborative_matches')
                        .where('status', 'in', ['open', 'full'])
                        .get();
                    matches = simpleSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Client-side sorting
                    console.log('✅ Simple query succeeded with client-side sorting');
                }
            } else {
                // Fallback to localStorage
                matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]')
                    .filter(match => match.status === 'open');
            }

            // Deduplicate matches by ID
            const uniqueMatches = [];
            const seenIds = new Set();
            
            for (const match of matches) {
                if (!seenIds.has(match.id)) {
                    seenIds.add(match.id);
                    uniqueMatches.push(match);
                }
            }
            
            this.availableMatches = uniqueMatches;
            console.log('📊 DEBUG: Available matches loaded:', uniqueMatches.length, '(deduped from', matches.length, ')');
            console.log('📋 DEBUG: Match details:', uniqueMatches.map(m => ({id: m.id, title: m.title, players: m.registeredPlayers?.length || 0})));
            
            this.renderAvailableMatches();
            console.log('🎨 DEBUG: renderAvailableMatches called');
            
            // Also load user matches
            await this.loadUserMatches();
            
            // Also load pending evaluations
            await this.loadPendingEvaluations();
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    async loadUserMatches() {
        console.log('📥 Loading user matches...');
        if (!this.currentUser) {
            console.log('❌ No current user, skipping user matches load');
            return;
        }

        try {
            let matches = [];
            
            if (window.db || typeof db !== 'undefined') {
                // Load from Firestore - get all matches and filter client-side
                // (Firestore can't do deep object queries in arrays)
                const database = window.db || db;
                const snapshot = await database.collection('collaborative_matches')
                    .get();
                
                const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                matches = allMatches.filter(match => 
                    match.registeredPlayers && 
                    match.registeredPlayers.some(player => player.uid === this.currentUser.uid)
                );
            } else {
                // Fallback to localStorage
                matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]')
                    .filter(match => 
                        match.registeredPlayers.some(player => player.uid === this.currentUser.uid)
                    );
            }

            this.userMatches = matches;
            console.log('✅ User matches loaded:', matches.length);
            console.log('📋 User match details:', matches.map(m => ({id: m.id, title: m.title})));
            this.renderUserMatches();
        } catch (error) {
            console.error('Error loading user matches:', error);
        }
    }

    renderAvailableMatches() {
        console.log('🎨 RENDER DEBUG: renderAvailableMatches started');
        const container = document.getElementById('available-matches');
        console.log('📦 RENDER DEBUG: Container found:', !!container);
        console.log('📊 RENDER DEBUG: Matches to render:', this.availableMatches?.length || 0);
        
        if (!container) {
            console.error('❌ RENDER DEBUG: available-matches container not found!');
            return;
        }

        if (this.availableMatches.length === 0) {
            console.log('📝 RENDER DEBUG: No matches, showing empty state');
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay partidos disponibles</p>
                    <p class="text-muted">¡Sé el primero en crear uno!</p>
                </div>
            `;
            return;
        }
        
        console.log('🎯 RENDER DEBUG: Starting to render', this.availableMatches.length, 'matches');

        // Filter matches where user is NOT registered (truly available matches)
        const trulyAvailableMatches = this.availableMatches.filter(match => {
            if (!this.currentUser) return true; // Show all if not logged in
            
            const isUserInMatch = match.registeredPlayers && match.registeredPlayers.some(p => 
                p.uid === this.currentUser.uid || p.uid === this.currentUser.id
            );
            return !isUserInMatch; // Only show matches where user is NOT registered
        });
        
        console.log('🔄 RENDER DEBUG: Filtered to', trulyAvailableMatches.length, 'truly available matches');

        if (trulyAvailableMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No hay partidos disponibles para anotarse</p>
                    <p class="text-muted">Ya estás registrado en todos los partidos activos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = trulyAvailableMatches.map(match => `
            <div class="match-card">
                <div class="match-header">
                    <h4>${match.title}</h4>
                    <span class="match-status ${match.status}">${this.getStatusText(match.status)}</span>
                </div>
                <div class="match-details">
                    <div class="detail">
                        <span class="icon">📅</span>
                        <span>${this.formatDate(match.date)} a las ${match.time}</span>
                    </div>
                    <div class="detail">
                        <span class="icon">📍</span>
                        <span>${match.location}</span>
                    </div>
                    <div class="detail">
                        <span class="icon">👥</span>
                        <span>${match.registeredPlayers.length}/${match.maxPlayers} jugadores</span>
                    </div>
                    <div class="detail">
                        <span class="icon">👤</span>
                        <span>Organiza: ${match.organizer.displayName}</span>
                    </div>
                </div>
                ${match.description ? `<div class="match-description">${match.description}</div>` : ''}
                <div class="match-actions">
                    ${this.canJoinMatch(match) ? 
                        `<button class="btn btn-primary" onclick="collaborativeSystem.joinMatch('${match.id}')">
                            🏃‍♂️ Anotarse
                        </button>` : 
                        `<button class="btn btn-disabled" disabled>
                            ${this.getJoinButtonText(match)}
                        </button>`
                    }
                    
                    <!-- Botones adicionales para partidos donde el usuario está registrado -->
                    ${match.registeredPlayers && match.registeredPlayers.some(p => p.uid === this.currentUser?.uid) ? `
                        <br><br>
                        <button onclick="collaborativeSystem.showInviteGuestsModal('${match.id}')" 
                                style="background: #6c757d; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; margin: 2px;">
                            🎭 Invitar
                        </button>
                        
                        <button onclick="alert('Ver jugadores: ' + JSON.stringify(${JSON.stringify(match.registeredPlayers?.map(p => p.displayName) || [])}, null, 2))" 
                                style="background: #17a2b8; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; margin: 2px;">
                            👥 Ver Jugadores
                        </button>
                        
                        ${match.organizer && match.organizer.uid === this.currentUser?.uid ? `
                            <button onclick="collaborativeSystem.deleteMatch('${match.id}')" 
                                    style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; margin: 2px;">
                                🗑️ Borrar
                            </button>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        console.log('✅ RENDER DEBUG: HTML generated and set to container');
        console.log('📏 RENDER DEBUG: Final container innerHTML length:', container.innerHTML.length);
        
        // Re-enable user matches rendering
        // Don't render user matches here - wait for loadUserMatches to complete
        console.log('✅ RENDER DEBUG: Available matches rendered, user matches will be loaded separately');
    }
    
    // Removed renderUserMatchesFromAvailable - using renderUserMatches instead
    
    /* DEPRECATED - renderUserMatchesFromAvailable() {
        console.log('🔄 RENDER DEBUG: Rendering user matches from available matches');
        console.log('🔍 RENDER DEBUG: Current user:', this.currentUser?.displayName);
        console.log('🔍 RENDER DEBUG: Available matches count:', this.availableMatches?.length);
        const container = document.getElementById('user-matches');
        if (!container) {
            console.error('❌ RENDER DEBUG: user-matches container not found!');
            return;
        }

        if (!this.currentUser) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Inicia sesión para ver tus partidos</p>
                </div>
            `;
            return;
        }

        // Filter matches where user IS registered
        const userMatches = this.availableMatches.filter(match => {
            const isUserInMatch = match.registeredPlayers && match.registeredPlayers.some(p => 
                p.uid === this.currentUser.uid || p.uid === this.currentUser.id
            );
            return isUserInMatch;
        });

        console.log('🎯 RENDER DEBUG: Found', userMatches.length, 'user matches');

        if (userMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No estás anotado en ningún partido</p>
                    <p class="text-muted">¡Explora los partidos disponibles arriba!</p>
                </div>
            `;
            return;
        }

        // Render user matches with full functionality
        container.innerHTML = userMatches.map(match => {
            const isOrganizer = match.organizer && (
                match.organizer.uid === this.currentUser.uid || 
                match.organizer.uid === this.currentUser.id
            );
            
            const authenticatedPlayers = match.registeredPlayers.filter(p => !p.isGuest) || [];
            const guestPlayers = match.registeredPlayers.filter(p => p.isGuest) || [];

            return `
                <div class="match-card user-match">
                    <div class="match-header">
                        <h4>${match.title} ${isOrganizer ? '<span style="color: #007bff; font-size: 0.8em;">(Organizador)</span>' : ''}</h4>
                        <span class="match-status ${match.status}">${this.getStatusText(match.status)}</span>
                    </div>
                    <div class="match-details">
                        <div class="detail">
                            <span class="icon">📅</span>
                            <span>${this.formatDate(match.date)} a las ${match.time}</span>
                        </div>
                        <div class="detail">
                            <span class="icon">📍</span>
                            <span>${match.location}</span>
                        </div>
                        <div class="detail">
                            <span class="icon">👥</span>
                            <span>${match.registeredPlayers.length}/${match.maxPlayers} jugadores 
                               ${guestPlayers.length > 0 ? `(${guestPlayers.length} invitados)` : ''}
                            </span>
                        </div>
                        <div class="detail">
                            <span class="icon">👤</span>
                            <span>Organiza: ${match.organizer.displayName}</span>
                        </div>
                    </div>
                    
                    ${match.description ? `<div class="match-description">${match.description}</div>` : ''}
                    
                    <!-- Jugadores anotados -->
                    ${match.registeredPlayers.length > 0 ? `
                        <details style="margin: 15px 0;">
                            <summary style="cursor: pointer; font-weight: 600; color: #666; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                                👥 Ver jugadores anotados (${match.registeredPlayers.length})
                            </summary>
                            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                                ${authenticatedPlayers.length > 0 ? `
                                    <p><strong>👤 Usuarios registrados:</strong></p>
                                    <ul style="margin: 5px 0 10px 20px; list-style-type: none; padding: 0;">
                                        ${authenticatedPlayers.map(p => `
                                            <li style="padding: 5px; background: white; margin: 3px 0; border-radius: 3px; border-left: 3px solid #28a745;">
                                                <strong>${p.displayName}</strong> (${p.position}) - OVR ${p.ovr}
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                                ${guestPlayers.length > 0 ? `
                                    <p><strong>🎭 Invitados:</strong></p>
                                    <ul style="margin: 5px 0 10px 20px; list-style-type: none; padding: 0;">
                                        ${guestPlayers.map(p => `
                                            <li style="padding: 5px; background: white; margin: 3px 0; border-radius: 3px; border-left: 3px solid #ffc107;">
                                                <strong>${p.displayName}</strong> (${p.position}) - OVR ${p.ovr} 
                                                <em style="color: #666;">- invitado por ${p.invitedBy || 'alguien'}</em>
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </details>
                    ` : ''}
                    
                    <!-- Botones de acción -->
                    <div class="match-actions" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        <button class="btn btn-danger" onclick="collaborativeSystem.leaveMatch('${match.id}')" 
                                style="background: #dc3545; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">
                            🚪 Desanotarse
                        </button>
                        
                        <button class="btn btn-secondary" onclick="collaborativeSystem.showInviteGuestsModal('${match.id}')" 
                                style="background: #6c757d; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">
                            🎭 Invitar
                        </button>
                        
                        ${match.status === 'full' && match.teams ? `
                            <button class="btn btn-info" onclick="collaborativeSystem.showTeamsModal('${match.id}')" 
                                    style="background: #17a2b8; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">
                                ⚽ Ver Equipos
                            </button>
                            <button class="btn btn-success" onclick="collaborativeSystem.finalizeMatch('${match.id}')" 
                                    style="background: #28a745; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-left: 5px;">
                                🏁 Finalizar Partido
                            </button>
                        ` : ''}
                        
                        ${isOrganizer ? `
                            <button class="btn btn-warning" onclick="collaborativeSystem.deleteMatch('${match.id}')" 
                                    style="background: #e74c3c; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">
                                🗑️ Borrar Partido
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ RENDER DEBUG: User matches rendered with', userMatches.length, 'matches');
    } */

    renderUserMatches() {
        const container = document.getElementById('user-matches');
        if (!container) return;
        
        console.log('🎨 Rendering user matches:', this.userMatches.length);
        this.userMatches.forEach(match => {
            console.log(`📋 Match ${match.id}: status=${match.status}, players=${match.registeredPlayers.length}, hasTeams=${!!match.teams}`);
        });

        if (this.userMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No estás anotado en ningún partido</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.userMatches.map(match => {
            const isOrganizer = match.organizer && this.currentUser && 
                               match.organizer.uid === this.currentUser.uid;
            
            return `
            <div class="match-card user-match">
                <div class="match-header">
                    <h4>${match.title}</h4>
                    <span class="match-status ${match.status}">${this.getStatusText(match.status)}</span>
                </div>
                <div class="match-details">
                    <div class="detail">
                        <span class="icon">📅</span>
                        <span>${this.formatDate(match.date)} a las ${match.time}</span>
                    </div>
                    <div class="detail">
                        <span class="icon">📍</span>
                        <span>${match.location}</span>
                    </div>
                    <div class="detail">
                        <span class="icon">👥</span>
                        <span>${match.registeredPlayers.length}/${match.maxPlayers} jugadores</span>
                    </div>
                    <div class="detail">
                        <span class="icon">👤</span>
                        <span>Organiza: ${match.organizer?.displayName || 'Desconocido'}</span>
                    </div>
                </div>
                <div class="match-actions">
                    ${match.status === 'open' ? 
                        `<button class="btn btn-secondary" onclick="collaborativeSystem.leaveMatch('${match.id}')">
                            🚪 Desanotarse
                        </button>` : ''
                    }
                    ${isOrganizer && match.status === 'open' && match.registeredPlayers.length < match.maxPlayers ? 
                        `<button class="btn btn-primary" onclick="collaborativeSystem.showInviteGuestsModal('${match.id}')">
                            🎭 Invitar
                        </button>` : ''
                    }
                    ${match.registeredPlayers.length >= match.maxPlayers && match.status === 'full' && match.teams ?
                        `<button class="btn btn-success" onclick="collaborativeSystem.showTeamsModal('${match.id}')">
                            ⚽ Ver Equipos
                        </button>
                        ${isOrganizer ? 
                            `<button class="btn btn-warning" onclick="collaborativeSystem.finalizeMatch('${match.id}')">
                                🏁 Finalizar Partido
                            </button>` : ''
                        }` : ''
                    }
                    ${isOrganizer ? 
                        `<button class="btn btn-danger" onclick="collaborativeSystem.deleteMatch('${match.id}')">
                            🗑️ Borrar
                        </button>` : ''
                    }
                </div>
            </div>
        `}).join('');
    }

    canJoinMatch(match) {
        // Try to get user from systems if not set
        if (!this.currentUser) {
            this.checkAndUpdateCurrentUser();
        }
        
        if (!this.currentUser) {
            console.log('❌ CollaborativeSystem: No current user in canJoinMatch');
            return false;
        }
        
        if (match.registeredPlayers.length >= match.maxPlayers) return false;
        
        // Check if user is already registered
        const isRegistered = match.registeredPlayers.some(player => player.uid === this.currentUser.uid);
        
        if (isRegistered) {
            console.log('👤 User already registered in match:', this.currentUser.uid);
        }
        
        return !isRegistered;
    }
    
    checkAndUpdateCurrentUser() {
        // Try to get user from AuthSystem
        if (!this.currentUser && window.AuthSystem && window.AuthSystem.currentUser) {
            console.log('🔄 CollaborativeSystem: Getting user from AuthSystem...');
            this.currentUser = window.AuthSystem.currentUser;
        }
        
        // Try to get user from TestApp
        if (!this.currentUser && window.TestApp && window.TestApp.currentUser) {
            console.log('🔄 CollaborativeSystem: Getting user from TestApp...');
            this.currentUser = window.TestApp.currentUser;
        }
        
        if (this.currentUser) {
            console.log('✅ CollaborativeSystem: User found:', this.currentUser.displayName || this.currentUser.email);
        }
    }

    getJoinButtonText(match) {
        // Try to get user from systems if not set
        if (!this.currentUser) {
            this.checkAndUpdateCurrentUser();
        }
        
        if (!this.currentUser) return 'Inicia sesión para anotarte';
        if (match.registeredPlayers.length >= match.maxPlayers) return 'Partido lleno';
        if (match.registeredPlayers.some(player => player.uid === this.currentUser.uid)) {
            return 'Ya estás anotado';
        }
        return 'Anotarse';
    }

    async joinMatch(matchId) {
        console.log('🏃 Attempting to join match:', matchId);
        
        // Try to get user from systems if not set
        if (!this.currentUser) {
            this.checkAndUpdateCurrentUser();
        }
        
        if (!this.currentUser) {
            console.log('❌ CollaborativeSystem: No user found for joinMatch');
            console.log('AuthSystem.currentUser:', window.AuthSystem?.currentUser);
            console.log('TestApp.currentUser:', window.TestApp?.currentUser);
            alert('Debes estar autenticado para anotarte al partido. Por favor, recarga la página.');
            return;
        }
        
        console.log('✅ User found for joining match:', this.currentUser.displayName || this.currentUser.email);

        try {
            const match = this.availableMatches.find(m => m.id === matchId);
            if (!match) return;

            // Add current user to registered players
            const playerData = {
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName,
                position: this.currentUser.position,
                ovr: this.currentUser.ovr,
                registeredAt: new Date().toISOString()
            };

            match.registeredPlayers.push(playerData);

            // Check if match is now full
            if (match.registeredPlayers.length >= match.maxPlayers) {
                match.status = 'full';
                // Generate teams automatically
                await this.generateTeamsForMatch(match);
            }

            await this.updateMatchInFirestore(match);
            await this.loadMatches();
            await this.loadUserMatches();
            
            this.showSuccessMessage('¡Te anotaste al partido exitosamente!');
        } catch (error) {
            console.error('Error joining match:', error);
            alert('Error al anotarse al partido. Intenta de nuevo.');
        }
    }

    async leaveMatch(matchId) {
        if (!this.currentUser) return;

        try {
            const match = this.userMatches.find(m => m.id === matchId);
            if (!match) return;

            // Remove current user from registered players
            match.registeredPlayers = match.registeredPlayers.filter(
                player => player.uid !== this.currentUser.uid
            );

            // Update status if needed
            if (match.status === 'full' && match.registeredPlayers.length < match.maxPlayers) {
                match.status = 'open';
            }

            await this.updateMatchInFirestore(match);
            await this.loadMatches();
            await this.loadUserMatches();
            
            this.showSuccessMessage('Te desanotaste del partido');
        } catch (error) {
            console.error('Error leaving match:', error);
            alert('Error al desanotarse del partido. Intenta de nuevo.');
        }
    }

    async generateTeamsForMatch(match) {
        console.log('⚽ Generating teams for match:', match.title);
        
        const players = match.registeredPlayers.map(p => ({
            name: p.displayName,
            position: p.position,
            ovr: p.ovr,
            uid: p.uid
        }));

        // Improved team balancing algorithm
        // 1. Sort by OVR
        players.sort((a, b) => b.ovr - a.ovr);
        
        // 2. Separate by positions for better balance
        const goalkeepers = players.filter(p => p.position === 'POR');
        const defenders = players.filter(p => p.position === 'DEF');
        const midfielders = players.filter(p => p.position === 'MED');
        const forwards = players.filter(p => p.position === 'DEL');
        
        const team1 = [];
        const team2 = [];
        let team1OVR = 0;
        let team2OVR = 0;
        
        // Distribute goalkeepers first (if any)
        for (let i = 0; i < goalkeepers.length; i++) {
            if (i % 2 === 0) {
                team1.push(goalkeepers[i]);
                team1OVR += goalkeepers[i].ovr;
            } else {
                team2.push(goalkeepers[i]);
                team2OVR += goalkeepers[i].ovr;
            }
        }
        
        // Combine other positions and distribute based on current team balance
        const otherPlayers = [...defenders, ...midfielders, ...forwards];
        
        for (const player of otherPlayers) {
            // Add to the team with lower total OVR to maintain balance
            if (team1OVR <= team2OVR && team1.length < 5) {
                team1.push(player);
                team1OVR += player.ovr;
            } else if (team2.length < 5) {
                team2.push(player);
                team2OVR += player.ovr;
            } else {
                // If one team is full, add to the other
                if (team1.length < 5) {
                    team1.push(player);
                    team1OVR += player.ovr;
                } else {
                    team2.push(player);
                    team2OVR += player.ovr;
                }
            }
        }
        
        // Calculate team averages
        const team1Avg = Math.round(team1OVR / team1.length);
        const team2Avg = Math.round(team2OVR / team2.length);
        
        console.log(`📊 Team 1 AVG OVR: ${team1Avg} | Team 2 AVG OVR: ${team2Avg}`);
        console.log(`👥 Team 1: ${team1.map(p => p.name).join(', ')}`);
        console.log(`👥 Team 2: ${team2.map(p => p.name).join(', ')}`);

        match.teams = {
            team1: {
                players: team1,
                avgOVR: team1Avg,
                totalOVR: team1OVR
            },
            team2: {
                players: team2,
                avgOVR: team2Avg,
                totalOVR: team2OVR
            },
            generatedAt: new Date().toISOString(),
            balanceDiff: Math.abs(team1Avg - team2Avg)
        };

        // Set up evaluation assignments
        match.evaluationAssignments = this.generateEvaluationAssignments(players);
        
        console.log('✅ Teams generated successfully');
    }

    generateEvaluationAssignments(players) {
        console.log('📝 Generating evaluation assignments for', players.length, 'players');
        
        const assignments = {};
        const evaluationCount = {};
        
        // Initialize counters
        players.forEach(p => {
            assignments[p.uid] = [];
            evaluationCount[p.uid] = 0;
        });
        
        // Each player evaluates 2 others
        for (const evaluator of players) {
            // Get potential players to evaluate (exclude self)
            let availableToEvaluate = players
                .filter(p => p.uid !== evaluator.uid)
                .sort((a, b) => evaluationCount[a.uid] - evaluationCount[b.uid]); // Prioritize less evaluated players
            
            // Select 2 players with least evaluations
            for (let i = 0; i < 2 && i < availableToEvaluate.length; i++) {
                const playerToEvaluate = availableToEvaluate[i];
                assignments[evaluator.uid].push({
                    uid: playerToEvaluate.uid,
                    name: playerToEvaluate.name,
                    position: playerToEvaluate.position
                });
                evaluationCount[playerToEvaluate.uid]++;
            }
        }
        
        // Log distribution
        console.log('📊 Evaluation distribution:');
        Object.entries(evaluationCount).forEach(([uid, count]) => {
            const player = players.find(p => p.uid === uid);
            console.log(`- ${player.name}: será evaluado ${count} veces`);
        });
        
        return assignments;
    }

    // Public method to re-initialize event listeners
    reinitializeEventListeners() {
        console.log('🔄 Re-initializing event listeners...');
        // Reset the flag to allow re-attachment
        this._listenersAttached = false;
        this.attachEventListeners();
    }

    async updateMatchInFirestore(match) {
        if (typeof db !== 'undefined' && db) {
            await db.collection('collaborative_matches').doc(match.id).set(match);
        } else {
            // Fallback to localStorage
            const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
            const index = matches.findIndex(m => m.id === match.id);
            if (index !== -1) {
                matches[index] = match;
                localStorage.setItem('collaborative_matches', JSON.stringify(matches));
            }
        }
    }

    generateMatchId() {
        return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async getMatchById(matchId) {
        try {
            if (typeof db !== 'undefined' && db) {
                const doc = await db.collection('collaborative_matches').doc(matchId).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
            } else {
                // Fallback to localStorage
                const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
                return matches.find(m => m.id === matchId);
            }
        } catch (error) {
            console.error('Error getting match by ID:', error);
        }
        return null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    getStatusText(status) {
        const statusMap = {
            'open': 'Abierto',
            'full': 'Completo',
            'started': 'En juego',
            'completed': 'Finalizado'
        };
        return statusMap[status] || status;
    }

    async loadPendingEvaluations() {
        if (!this.currentUser) return;
        
        try {
            // Load matches where user is registered and match has teams generated
            const matchesSnapshot = await db.collection('collaborative_matches')
                .where('status', 'in', ['full', 'completed'])
                .get();
            
            const pendingEvaluations = [];
            
            matchesSnapshot.forEach(doc => {
                const match = doc.data();
                
                // Check if user is in this match
                const isInMatch = match.registeredPlayers?.some(p => p.uid === this.currentUser.uid);
                
                if (isInMatch && match.evaluationAssignments && match.evaluationAssignments[this.currentUser.uid]) {
                    // Check if evaluations are already submitted
                    const userEvaluations = match.submittedEvaluations?.[this.currentUser.uid];
                    
                    if (!userEvaluations || userEvaluations.length === 0) {
                        pendingEvaluations.push({
                            matchId: match.id,
                            matchTitle: match.title,
                            matchDate: match.date,
                            playersToEvaluate: match.evaluationAssignments[this.currentUser.uid],
                            teams: match.teams
                        });
                    }
                }
            });
            
            this.displayPendingEvaluations(pendingEvaluations);
            
        } catch (error) {
            console.error('Error loading pending evaluations:', error);
        }
    }
    
    displayPendingEvaluations(evaluations) {
        const section = document.getElementById('evaluation-section');
        const container = document.getElementById('pending-evaluations');
        
        if (!section || !container) return;
        
        if (evaluations.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        let html = '';
        evaluations.forEach(evaluation => {
            html += `
                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h4>⚽ ${evaluation.matchTitle}</h4>
                    <p style="color: #666; margin: 10px 0;">📅 ${this.formatDate(evaluation.matchDate)}</p>
                    
                    <div style="margin-top: 20px;">
                        <h5>Evalúa a estos jugadores:</h5>
                        ${evaluation.playersToEvaluate.map(player => `
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                    <span style="font-weight: bold;">👤 ${player.name} (${player.position})</span>
                                </div>
                                
                                <div class="evaluation-form" data-match-id="${evaluation.matchId}" data-player-uid="${player.uid}">
                                    <label style="display: block; margin-top: 10px;">
                                        Rendimiento General (1-10):
                                        <input type="range" min="1" max="10" value="5" 
                                               id="ovr-${evaluation.matchId}-${player.uid}"
                                               style="width: 100%; margin-top: 5px;"
                                               oninput="this.nextElementSibling.textContent = this.value">
                                        <span style="font-weight: bold; color: #007bff;">5</span>
                                    </label>
                                    
                                    <label style="display: block; margin-top: 15px;">
                                        Comentarios (opcional):
                                        <textarea id="comment-${evaluation.matchId}-${player.uid}"
                                                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; margin-top: 5px;"
                                                  rows="2"
                                                  placeholder="Buen juego, buena actitud, etc..."></textarea>
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                        
                        <button onclick="collaborativeSystem.submitEvaluations('${evaluation.matchId}')" 
                                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                       color: white; 
                                       padding: 12px 30px; 
                                       border: none; 
                                       border-radius: 8px; 
                                       cursor: pointer; 
                                       margin-top: 20px;
                                       width: 100%;
                                       font-size: 16px;
                                       font-weight: bold;">
                            📤 Enviar Evaluaciones
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    async submitEvaluations(matchId) {
        if (!this.currentUser) return;
        
        try {
            // Get the match document
            const matchDoc = await db.collection('collaborative_matches').doc(matchId).get();
            const match = matchDoc.data();
            
            if (!match) {
                alert('No se encontró el partido');
                return;
            }
            
            // Collect evaluations for this match
            const evaluations = [];
            const playersToEvaluate = match.evaluationAssignments[this.currentUser.uid];
            
            for (const player of playersToEvaluate) {
                const ovrElement = document.getElementById(`ovr-${matchId}-${player.uid}`);
                const commentElement = document.getElementById(`comment-${matchId}-${player.uid}`);
                
                if (ovrElement) {
                    evaluations.push({
                        playerUid: player.uid,
                        playerName: player.name,
                        rating: parseInt(ovrElement.value),
                        comment: commentElement ? commentElement.value : '',
                        evaluatorUid: this.currentUser.uid,
                        evaluatorName: this.currentUser.displayName,
                        submittedAt: new Date().toISOString()
                    });
                }
            }
            
            if (evaluations.length === 0) {
                alert('No hay evaluaciones para enviar');
                return;
            }
            
            // Initialize submittedEvaluations if doesn't exist
            if (!match.submittedEvaluations) {
                match.submittedEvaluations = {};
            }
            
            // Store the evaluations
            match.submittedEvaluations[this.currentUser.uid] = evaluations;
            
            // Update match in Firestore
            await db.collection('collaborative_matches').doc(matchId).update({
                submittedEvaluations: match.submittedEvaluations
            });
            
            // Check if all evaluations are complete
            await this.checkAndUpdatePlayerOVRs(matchId);
            
            // Reload evaluations
            await this.loadPendingEvaluations();
            
            this.showSuccessMessage('¡Evaluaciones enviadas exitosamente!');
            
        } catch (error) {
            console.error('Error submitting evaluations:', error);
            alert('Error al enviar las evaluaciones. Intenta de nuevo.');
        }
    }
    
    async checkAndUpdatePlayerOVRs(matchId) {
        try {
            const matchDoc = await db.collection('collaborative_matches').doc(matchId).get();
            const match = matchDoc.data();
            
            if (!match.submittedEvaluations) return;
            
            // Count total expected evaluations
            const totalPlayers = match.registeredPlayers.length;
            const expectedEvaluations = totalPlayers; // Each player should evaluate 2 others
            const submittedCount = Object.keys(match.submittedEvaluations).length;
            
            console.log(`📊 Evaluations progress: ${submittedCount}/${expectedEvaluations}`);
            
            // If all evaluations are complete, calculate new OVRs
            if (submittedCount >= expectedEvaluations * 0.8) { // 80% threshold
                console.log('✅ Sufficient evaluations received. Calculating new OVRs...');
                
                // Collect all ratings per player
                const playerRatings = {};
                
                Object.values(match.submittedEvaluations).forEach(evaluatorSubmissions => {
                    evaluatorSubmissions.forEach(evaluation => {
                        if (!playerRatings[evaluation.playerUid]) {
                            playerRatings[evaluation.playerUid] = {
                                name: evaluation.playerName,
                                ratings: [],
                                comments: []
                            };
                        }
                        playerRatings[evaluation.playerUid].ratings.push(evaluation.rating);
                        if (evaluation.comment) {
                            playerRatings[evaluation.playerUid].comments.push(evaluation.comment);
                        }
                    });
                });
                
                // Calculate and update OVRs
                for (const [playerUid, data] of Object.entries(playerRatings)) {
                    if (data.ratings.length > 0) {
                        // Calculate average rating (1-10 scale)
                        const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
                        
                        // Get player's current OVR
                        const playerDoc = await db.collection('futbol_users').doc(playerUid).get();
                        if (playerDoc.exists) {
                            const playerData = playerDoc.data();
                            const currentOVR = playerData.ovr || 50;
                            
                            // Calculate OVR change based on rating
                            // Rating 5 = no change, >5 increases OVR, <5 decreases OVR
                            const ovrChange = Math.round((avgRating - 5) * 2); // -8 to +10 range
                            const newOVR = Math.max(1, Math.min(99, currentOVR + ovrChange));
                            
                            // Update player's OVR
                            await db.collection('futbol_users').doc(playerUid).update({
                                ovr: newOVR,
                                lastEvaluation: {
                                    matchId: matchId,
                                    avgRating: avgRating,
                                    ratingsCount: data.ratings.length,
                                    ovrChange: ovrChange,
                                    updatedAt: new Date().toISOString()
                                }
                            });
                            
                            console.log(`✅ Updated ${data.name}: OVR ${currentOVR} → ${newOVR} (${ovrChange >= 0 ? '+' : ''}${ovrChange})`);
                        }
                    }
                }
                
                // Mark match as evaluation complete
                await db.collection('collaborative_matches').doc(matchId).update({
                    evaluationsComplete: true,
                    evaluationsCompletedAt: new Date().toISOString()
                });
                
                console.log('🎉 All OVRs updated successfully!');
            }
        } catch (error) {
            console.error('Error updating OVRs:', error);
        }
    }

    showSuccessMessage(message) {
        // Create a temporary toast message
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    viewMatchDetails(matchId) {
        const match = this.availableMatches.find(m => m.id === matchId) || 
                     this.userMatches.find(m => m.id === matchId);
        
        if (!match) {
            console.error('Match not found:', matchId);
            return;
        }
        
        if (!match.teams) {
            alert('Los equipos aún no han sido generados para este partido');
            return;
        }
        
        // Create modal with team details
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // Generate HTML for teams
        const team1HTML = match.teams.team1.players.map(p => `
            <div style="padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 5px;">
                <strong>${p.name}</strong> - ${p.position} (OVR: ${p.ovr})
            </div>
        `).join('');
        
        const team2HTML = match.teams.team2.players.map(p => `
            <div style="padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 5px;">
                <strong>${p.name}</strong> - ${p.position} (OVR: ${p.ovr})
            </div>
        `).join('');
        
        // Check if current user has evaluations to complete
        let evaluationHTML = '';
        if (this.currentUser && match.evaluationAssignments && match.evaluationAssignments[this.currentUser.uid]) {
            const myEvaluations = match.evaluationAssignments[this.currentUser.uid];
            evaluationHTML = `
                <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0;">📝 Tus Evaluaciones Asignadas</h4>
                    <p>Después del partido, deberás evaluar a:</p>
                    ${myEvaluations.map(p => `
                        <div style="padding: 5px; margin: 5px 0;">
                            • <strong>${p.name}</strong> (${p.position})
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0;">⚽ ${match.title}</h2>
            <p style="color: #666;">📅 ${this.formatDate(match.date)} a las ${match.time}</p>
            <p style="color: #666;">📍 ${match.location}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
                <div>
                    <h3 style="background: #007bff; color: white; padding: 10px; border-radius: 5px; text-align: center;">
                        Equipo 1
                        <div style="font-size: 14px; margin-top: 5px;">
                            AVG OVR: ${match.teams.team1.avgOVR}
                        </div>
                    </h3>
                    ${team1HTML}
                </div>
                <div>
                    <h3 style="background: #dc3545; color: white; padding: 10px; border-radius: 5px; text-align: center;">
                        Equipo 2
                        <div style="font-size: 14px; margin-top: 5px;">
                            AVG OVR: ${match.teams.team2.avgOVR}
                        </div>
                    </h3>
                    ${team2HTML}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
                <span style="color: #4caf50; font-weight: bold;">
                    ⚖️ Diferencia de balance: ${match.teams.balanceDiff} OVR
                </span>
            </div>
            
            ${evaluationHTML}
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    padding: 10px 30px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    Cerrar
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async showInviteGuestsModal(matchId) {
        console.log('🎭 Opening invite players modal for match:', matchId);
        
        // Get ALL available players (both registered and manual)
        let availablePlayers = [];
        try {
            if (window.TestApp && window.TestApp.players) {
                availablePlayers = window.TestApp.players.filter(p => 
                    p.name && p.name.trim() // All players with valid names
                );
                console.log('🔍 Found', availablePlayers.length, 'total players to check:', availablePlayers.map(p => p.name));
            }
        } catch (error) {
            console.error('Error getting players:', error);
        }
        
        if (availablePlayers.length === 0) {
            alert('No hay jugadores disponibles para invitar.');
            return;
        }
        
        const match = this.availableMatches.find(m => m.id === matchId);
        if (!match) return;
        
        // Filter out players already in the match
        const registeredPlayerNames = match.registeredPlayers.map(p => p.displayName?.toLowerCase());
        const guestPlayerNames = (match.guestPlayers || []).map(p => p.displayName?.toLowerCase());
        const allRegisteredNames = [...registeredPlayerNames, ...guestPlayerNames];
        
        const availablePlayersFiltered = availablePlayers.filter(player => {
            const playerName = player.name?.toLowerCase();
            return !allRegisteredNames.includes(playerName);
        });
        
        if (availablePlayersFiltered.length === 0) {
            if (availablePlayers.length === 0) {
                alert('No hay jugadores disponibles para invitar.');
            } else {
                alert('Todos los jugadores disponibles ya están en este partido.');
            }
            return;
        }
        
        console.log('🔍 Filtered players available for invite:', availablePlayersFiltered.length, availablePlayersFiltered.map(p => p.name));
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'invite-guests-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 25px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 70%;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        modalContent.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">🎭 Invitar Jugadores</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Selecciona jugadores para invitar al partido:<br>
                <small><em>Solo se muestran jugadores que NO están ya anotados.</em></small>
            </p>
            
            <div id="available-players-list">
                ${availablePlayersFiltered.map(player => `
                    <div style="
                        padding: 12px;
                        margin-bottom: 8px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        background: #f8f9fa;
                    ">
                        <label style="display: flex; align-items: center; cursor: pointer; margin: 0;">
                            <input type="checkbox" value="${player.id || player.name}" data-name="${player.name}" style="margin-right: 12px; transform: scale(1.2);">
                            <div>
                                <strong style="color: #333; font-size: 16px;">${player.name}</strong><br>
                                <small style="color: #666;">OVR: ${player.ovr} | Posición: ${player.position || 'N/A'}</small>
                            </div>
                        </label>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="collaborativeSystem.inviteSelectedGuests('${matchId}')" 
                        style="background: #28a745; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; flex: 1;">
                    ✅ Invitar Seleccionados
                </button>
                <button onclick="collaborativeSystem.closeInviteGuestsModal()" 
                        style="background: #6c757d; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer;">
                    Cancelar
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeInviteGuestsModal();
            }
        });
    }

    closeInviteGuestsModal() {
        const modal = document.getElementById('invite-guests-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    async inviteSelectedGuests(matchId) {
        const checkboxes = document.querySelectorAll('#invite-guests-modal input[type="checkbox"]:checked');
        
        if (checkboxes.length === 0) {
            alert('Por favor selecciona al menos un jugador para invitar');
            return;
        }
        
        try {
            const match = this.availableMatches.find(m => m.id === matchId) || 
                         this.userMatches.find(m => m.id === matchId);
            if (!match) {
                alert('Error: No se pudo encontrar el partido');
                return;
            }
            
            // Allow some flexibility for substitutes (up to 14 players total)
            const currentPlayers = match.registeredPlayers.length;
            const playersToAdd = checkboxes.length;
            const absoluteMax = 14; // Allow up to 14 players (10 + 4 substitutes)
            
            if (currentPlayers + playersToAdd > absoluteMax) {
                alert(`⚠️ No se pueden agregar ${playersToAdd} jugadores. El partido permite máximo ${absoluteMax} jugadores y ya hay ${currentPlayers}.`);
                return;
            }
            
            if (!match.guestPlayers) {
                match.guestPlayers = [];
            }
            
            let addedCount = 0;
            
            checkboxes.forEach(checkbox => {
                const playerName = checkbox.dataset.name;
                const playerId = checkbox.value;
                
                // Find the player in TestApp.players to get full data
                const player = window.TestApp?.players?.find(p => 
                    (p.id === playerId || p.name === playerName)
                );
                
                if (player && playerName) {
                    // Add as guest player
                    match.guestPlayers.push({
                        displayName: playerName,
                        position: player.position || 'MED',
                        ovr: player.ovr || 50,
                        isGuest: true,
                        invitedBy: this.currentUser.displayName,
                        addedAt: new Date().toISOString()
                    });
                    
                    // Also add to registeredPlayers to count towards total
                    match.registeredPlayers.push({
                        displayName: playerName,
                        position: player.position || 'MED',
                        ovr: player.ovr || 50,
                        isGuest: true,
                        invitedBy: this.currentUser.displayName,
                        registeredAt: new Date().toISOString()
                    });
                    
                    addedCount++;
                }
            });
            
            // Update match status if full and generate teams
            if (match.registeredPlayers.length >= match.maxPlayers) {
                match.status = 'full';
                console.log('🏃 Match is full! Generating teams...');
                await this.generateTeamsForMatch(match);
                console.log('✅ Teams generated successfully with guests');
            }
            
            // Save to Firebase
            if (typeof db !== 'undefined' && db) {
                await db.collection('collaborative_matches').doc(matchId).set(match);
            }
            
            this.closeInviteGuestsModal();
            this.loadMatches(); // Refresh display
            
            alert(`¡${addedCount} invitado${addedCount > 1 ? 's' : ''} agregado${addedCount > 1 ? 's' : ''} al partido!`);
            
        } catch (error) {
            console.error('Error inviting guests:', error);
            alert('Error al invitar jugadores. Intenta de nuevo.');
        }
    }

    async leaveMatch(matchId) {
        if (!confirm('⚠️ ¿Estás seguro de que quieres desanotarte de este partido?')) {
            return;
        }

        console.log('🚪 Leaving match:', matchId);

        try {
            const match = await this.getMatchById(matchId);
            if (!match) {
                alert('❌ Error: No se pudo encontrar el partido');
                return;
            }

            // Remove user from registered players
            match.registeredPlayers = match.registeredPlayers.filter(p => 
                p.uid !== this.currentUser.uid && p.uid !== this.currentUser.id
            );

            // Update match status if needed
            if (match.registeredPlayers.length < match.maxPlayers) {
                match.status = 'open';
            }

            await this.updateMatchInFirestore(match);
            alert('✅ Te has desanotado del partido exitosamente');
            await this.loadMatches(); // Refresh display
            
        } catch (error) {
            console.error('❌ Error leaving match:', error);
            alert('❌ Error al desanotarse del partido');
        }
    }

    showTeamsModal(matchId) {
        const match = this.availableMatches.find(m => m.id === matchId);
        if (!match || !match.teams) {
            alert('❌ No se encontraron los equipos para este partido');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'teams-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); display: flex; align-items: center; 
            justify-content: center; z-index: 9999;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; padding: 25px; border-radius: 12px; 
            max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">⚽ Equipos Generados</h3>
            <p style="color: #666; margin-bottom: 20px;">Partido: <strong>${match.title}</strong></p>
            
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                    <h4 style="color: #1976d2; margin-top: 0;">🟦 Equipo 1</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${(match.teams.team1 || []).map(player => `
                            <li style="padding: 5px; background: white; margin: 3px 0; border-radius: 3px;">
                                <strong>${player.displayName}</strong> (${player.position}) - OVR ${player.ovr}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div style="flex: 1; padding: 15px; background: #ffebee; border-radius: 8px;">
                    <h4 style="color: #d32f2f; margin-top: 0;">🟥 Equipo 2</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${(match.teams.team2 || []).map(player => `
                            <li style="padding: 5px; background: white; margin: 3px 0; border-radius: 3px;">
                                <strong>${player.displayName}</strong> (${player.position}) - OVR ${player.ovr}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            <button onclick="document.getElementById('teams-modal').remove()" 
                    style="background: #6c757d; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                Cerrar
            </button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async finalizeMatch(matchId) {
        if (!confirm('🏁 ¿Finalizar este partido y activar las evaluaciones automáticas?')) {
            return;
        }

        console.log('🏁 Finalizing match:', matchId);

        try {
            const match = this.availableMatches.find(m => m.id === matchId);
            if (!match) {
                alert('❌ Error: No se pudo encontrar el partido');
                return;
            }

            // Change status to completed to trigger evaluations
            match.status = 'completed';
            match.finalizedAt = new Date().toISOString();
            match.finalizedBy = this.currentUser.uid;

            // Save to Firebase
            if (typeof db !== 'undefined' && db) {
                await db.collection('collaborative_matches').doc(matchId).set(match);
            }

            alert('✅ Partido finalizado. Las evaluaciones automáticas se activarán próximamente.');
            this.loadMatches(); // Refresh display
            
        } catch (error) {
            console.error('❌ Error finalizing match:', error);
            alert('❌ Error al finalizar el partido');
        }
    }

    async cleanupDuplicateMatches() {
        console.log('🧹 Cleaning up duplicate matches...');
        
        try {
            if (typeof db !== 'undefined' && db) {
                const snapshot = await db.collection('collaborative_matches').get();
                const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Group by creation time and title to find duplicates
                const matchGroups = {};
                matches.forEach(match => {
                    const key = `${match.title}_${match.date}_${match.time}`;
                    if (!matchGroups[key]) {
                        matchGroups[key] = [];
                    }
                    matchGroups[key].push(match);
                });
                
                // Delete duplicates (keep the first one)
                let duplicatesDeleted = 0;
                for (const key in matchGroups) {
                    const group = matchGroups[key];
                    if (group.length > 1) {
                        console.log(`Found ${group.length} duplicates for: ${key}`);
                        // Keep the first, delete the rest
                        for (let i = 1; i < group.length; i++) {
                            await db.collection('collaborative_matches').doc(group[i].id).delete();
                            duplicatesDeleted++;
                            console.log(`Deleted duplicate: ${group[i].id}`);
                        }
                    }
                }
                
                console.log(`✅ Cleanup complete. Deleted ${duplicatesDeleted} duplicate matches.`);
                
                // Reload matches
                await this.loadMatches();
            }
        } catch (error) {
            console.error('❌ Error cleaning up duplicates:', error);
        }
    }
    
    async deleteMatch(matchId) {
        if (!confirm('⚠️ ¿Estás seguro de que quieres borrar este partido? Esta acción no se puede deshacer.')) {
            return;
        }

        console.log('🗑️ Deleting match:', matchId);

        try {
            if (typeof db !== 'undefined' && db) {
                await db.collection('collaborative_matches').doc(matchId).delete();
                console.log('✅ Match deleted from Firestore');
            } else {
                // Fallback to localStorage
                const matches = JSON.parse(localStorage.getItem('collaborative_matches') || '[]');
                const filteredMatches = matches.filter(m => m.id !== matchId);
                localStorage.setItem('collaborative_matches', JSON.stringify(filteredMatches));
                console.log('✅ Match deleted from localStorage');
            }

            alert('✅ Partido borrado exitosamente');
            this.loadMatches(); // Refresh display
            
        } catch (error) {
            console.error('❌ Error deleting match:', error);
            alert('❌ Error al borrar el partido');
        }
    }
}

// Initialize collaborative system - ONLY ONCE
console.log('🌟 Checking for existing collaborative system...');
if (!window.collaborativeSystem) {
    console.log('📦 Creating new CollaborativeSystem instance...');
    const collaborativeSystem = new CollaborativeSystem();
    window.collaborativeSystem = collaborativeSystem;
    console.log('✅ Global collaborative system created:', collaborativeSystem);
} else {
    console.log('⚠️ CollaborativeSystem already exists, reusing existing instance');
}