/**
 * Test App - Simplified version for testing functionality
 */

const TestApp = {
    // State
    currentUser: null,
    currentGroup: null,
    players: [],
    isLoggedIn: false,
    
    // Initialize
    init(authenticatedUser = null, demoMode = false) {
        this.log('🚀 Initializing TestApp...', 'info');
        this.setupNavigation();
        this.checkFirebase();
        
        // Initialize match screen
        this.initMatchScreen();
        
        if (demoMode) {
            // Demo mode - use old system
            this.log('🔍 Running in demo mode', 'info');
            
            // Check if already logged in (old system)
            const savedUser = localStorage.getItem('testapp_user');
            const savedGroup = localStorage.getItem('testapp_group');
            
            if (savedUser && savedGroup) {
                this.currentUser = JSON.parse(savedUser);
                this.currentGroup = JSON.parse(savedGroup);
                this.isLoggedIn = true;
                this.onLoginSuccess();
            } else {
                this.showLoginScreen();
            }
        } else if (authenticatedUser) {
            // New auth system - user is authenticated
            this.log('✅ Authenticated user mode', 'info');
            this.currentUser = authenticatedUser;
            this.isLoggedIn = true;
            
            // Convert authenticated user to player format for compatibility
            this.currentUserAsPlayer = this.convertUserToPlayer(authenticatedUser);
            
            // Set up group (TODO: implement group selection for authenticated users)
            this.handleAuthenticatedUserGroups(authenticatedUser);
            
            this.onLoginSuccess();
        } else {
            // No authentication - should not happen (AuthSystem handles this)
            this.log('⚠️  No user provided - this should not happen', 'warning');
            this.showLoginScreen();
        }
        
        this.log('TestApp initialized', 'success');
    },
    
    // Convert authenticated user to player format for compatibility
    convertUserToPlayer(user) {
        return {
            id: user.uid,
            name: user.displayName,
            position: user.position,
            ovr: user.ovr,
            attributes: {
                pac: user.pac,
                sho: user.sho,
                pas: user.pas,
                dri: user.dri,
                def: user.def,
                phy: user.phy
            },
            photo: user.photo,
            hasBeenEvaluated: user.hasBeenEvaluated || false,
            originalOVR: user.originalOVR || user.ovr,
            groupId: user.currentGroup,
            stats: user.stats || {}
        };
    },
    
    // Handle groups for authenticated users
    handleAuthenticatedUserGroups(user) {
        console.log('🏠 Setting up groups for user:', user.displayName);
        console.log('🏠 User groups:', user.groups);
        console.log('🏠 User currentGroup:', user.currentGroup);
        
        if (user.groups && user.groups.length > 0 && user.currentGroup) {
            // User has groups and a current group selected
            this.currentGroup = {
                id: user.currentGroup,
                name: user.currentGroup === 'o8ZOD6N0KEHrvweFfTAd' ? 'Fútbol en el Galpón' : `Grupo ${user.currentGroup.substring(0, 8)}...`
            };
            
            // CRITICAL: Set the Storage currentGroupId
            Storage.setCurrentGroup(user.currentGroup);
            console.log('✅ Set Storage.currentGroupId to:', user.currentGroup);
        } else {
            // Assign default group if user doesn't have one
            const defaultGroupId = 'o8ZOD6N0KEHrvweFfTAd';
            this.currentGroup = {
                id: defaultGroupId,
                name: 'Fútbol en el Galpón'
            };
            
            // Set the Storage currentGroupId
            Storage.setCurrentGroup(defaultGroupId);
            console.log('✅ Set Storage.currentGroupId to default group:', defaultGroupId);
        }
        
        this.log(`Group assigned: ${this.currentGroup.name}`, 'info');
    },
    
    // Show login screen (legacy - for demo mode compatibility)
    showLoginScreen() {
        // Try to show auth screen first (new system), fallback to old system
        const authScreen = document.getElementById('auth-screen');
        const loginScreen = document.getElementById('login-screen');
        
        if (authScreen) {
            authScreen.style.display = 'flex';
        } else if (loginScreen) {
            loginScreen.style.display = 'flex';
            this.loadUsers();
        } else {
            console.log('No login screen available - user should already be authenticated');
        }
    },
    
    // Load users from Firebase
    async loadUsers() {
        this.log('Loading users from Firebase...', 'info');
        console.log('👥 TestApp: Loading users from Firebase...');
        const container = document.getElementById('users-list');
        if (!container) {
            // Silent return - this is normal if we're not on the users screen
            return;
        }
        container.innerHTML = '<p>Loading...</p>';
        
        try {
            // First try to load from Firebase directly
            if (db) {
                // Load from both collections: new unified users (futbol_users) and old system (persons)
                const [newUsersSnapshot, oldUsersSnapshot] = await Promise.all([
                    db.collection('futbol_users').get(),
                    db.collection('persons').get()
                ]);
                
                const users = [];
                
                // Add new authenticated users (convert to old format for compatibility)
                newUsersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    users.push({
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
                        isAuthenticatedUser: true,
                        originalData: userData
                    });
                });
                
                // Add old system users
                oldUsersSnapshot.forEach(doc => {
                    users.push({ 
                        id: doc.id, 
                        isAuthenticatedUser: false,
                        ...doc.data() 
                    });
                });
                
                if (users.length > 0) {
                    this.displayUsers(users);
                    this.log(`Loaded ${users.length} users from Firebase (${newUsersSnapshot.size} authenticated, ${oldUsersSnapshot.size} old system)`, 'success');
                    return;
                }
            }
            
            // Fallback to Storage if available
            if (Storage && Storage.getPersons) {
                const users = Storage.getPersons();
                if (users && users.length > 0) {
                    this.displayUsers(users);
                    this.log(`Loaded ${users.length} users from Storage`, 'success');
                } else {
                    container.innerHTML = '<p>No users found. Create a test user in Settings.</p>';
                }
            } else {
                container.innerHTML = '<p>Storage not available</p>';
            }
        } catch (error) {
            this.log(`Error loading users: ${error.message}`, 'error');
            container.innerHTML = '<p>Error loading users</p>';
        }
    },
    
    // Display users
    displayUsers(users) {
        const container = document.getElementById('users-list');
        let html = '';
        
        users.forEach(user => {
            // Get profile image
            let profileImageHtml = '';
            if (user.photo || user.profileImage) {
                const imageUrl = user.photo || user.profileImage;
                profileImageHtml = `<img src="${imageUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 10px;" alt="Profile">`;
            } else {
                profileImageHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 18px;">👤</div>`;
            }
            
            // Show authentication status
            const authBadge = user.isAuthenticatedUser ? 
                `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 5px;">AUTH</span>` : 
                `<span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 5px;">LEGACY</span>`;
                
            html += `
                <div class="user-card" onclick="TestApp.selectUser('${user.id}')" style="display: flex; align-items: center; padding: 15px;">
                    ${profileImageHtml}
                    <div style="flex: 1;">
                        <div class="user-name" style="font-weight: 600; color: #333;">
                            ${user.name || 'Unknown'} ${authBadge}
                        </div>
                        <div class="user-email" style="color: #666; font-size: 12px;">
                            ${user.email || 'No email'} | ${user.position || 'No position'} | OVR: ${user.ovr || 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // Select user
    async selectUser(userId) {
        this.log(`Selecting user: ${userId}`, 'info');
        
        try {
            // Get user details
            let user = null;
            
            // Try Firebase first
            if (db) {
                const doc = await db.collection('persons').doc(userId).get();
                if (doc.exists) {
                    user = { id: doc.id, ...doc.data() };
                }
            }
            
            // Fallback to Storage
            if (!user && Storage && Storage.getPersonById) {
                user = Storage.getPersonById(userId);
            }
            
            if (user) {
                this.currentUser = user;
                // Set in Storage if available
                if (Storage) {
                    if (Storage.setCurrentPerson) {
                        Storage.setCurrentPerson(userId);
                        this.log('User set with Storage.setCurrentPerson', 'info');
                    }
                    // Also set currentPersonId directly
                    Storage.currentPersonId = userId;
                    this.log(`Storage.currentPersonId set to: ${userId}`, 'info');
                }
                this.log(`✅ User selected: ${user.name}`, 'success');
                
                // Now load groups for this user
                this.loadGroupsForUser(userId);
            } else {
                this.log(`❌ User not found: ${userId}`, 'error');
                alert('Error: User not found');
            }
        } catch (error) {
            this.log(`Error selecting user: ${error.message}`, 'error');
        }
    },
    
    // Load groups for user
    async loadGroupsForUser(userId) {
        this.log(`Loading groups for user: ${userId}`, 'info');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('group-selector').style.display = 'flex';
        
        const container = document.getElementById('groups-list');
        container.innerHTML = '<p>Loading groups...</p>';
        
        try {
            let groups = [];
            
            // First try to get memberships for this user from Firebase
            if (db) {
                this.log('Checking memberships in Firebase...', 'info');
                
                // Get memberships for this user
                const membershipsSnapshot = await db.collection('memberships')
                    .where('personId', '==', userId)
                    .get();
                
                if (!membershipsSnapshot.empty) {
                    const groupIds = [];
                    membershipsSnapshot.forEach(doc => {
                        const membership = doc.data();
                        if (membership.groupId) {
                            groupIds.push(membership.groupId);
                        }
                    });
                    
                    this.log(`Found ${groupIds.length} group memberships`, 'info');
                    
                    // Now get the actual groups
                    if (groupIds.length > 0) {
                        for (const groupId of groupIds) {
                            const groupDoc = await db.collection('groups').doc(groupId).get();
                            if (groupDoc.exists) {
                                groups.push({ id: groupDoc.id, ...groupDoc.data() });
                            }
                        }
                    }
                } else {
                    this.log('No memberships found, checking if user has a default group...', 'info');
                    
                    // Check if there's a group created by this user
                    const createdGroups = await db.collection('groups')
                        .where('createdBy', '==', userId)
                        .get();
                    
                    if (!createdGroups.empty) {
                        createdGroups.forEach(doc => {
                            groups.push({ id: doc.id, ...doc.data() });
                        });
                    }
                }
            }
            
            // Fallback to Storage if available and no groups found
            if (groups.length === 0 && Storage && Storage.getGroupsForPerson) {
                this.log('Trying Storage.getGroupsForPerson...', 'info');
                const storageGroups = Storage.getGroupsForPerson(userId);
                if (storageGroups && storageGroups.length > 0) {
                    groups = storageGroups;
                }
            }
            
            // If still no groups, check for a demo group or show all available
            if (groups.length === 0 && db) {
                this.log('No groups found for user, showing first available group...', 'info');
                const allGroupsSnapshot = await db.collection('groups').limit(5).get();
                if (!allGroupsSnapshot.empty) {
                    allGroupsSnapshot.forEach(doc => {
                        groups.push({ id: doc.id, ...doc.data() });
                    });
                    this.log('Showing first 5 available groups as fallback', 'info');
                }
            }
            
            if (groups && groups.length > 0) {
                this.displayGroups(groups);
                this.log(`Displaying ${groups.length} groups`, 'success');
                
                // If only one group, auto-select it
                if (groups.length === 1) {
                    this.log('Only one group found, auto-selecting...', 'info');
                    setTimeout(() => this.selectGroup(groups[0].id), 500);
                }
            } else {
                container.innerHTML = `
                    <p>No groups found for this user.</p>
                    <p>You can create a test group in Settings.</p>
                    <button onclick="TestApp.skipGroupSelection()">Continue without group</button>
                `;
            }
        } catch (error) {
            this.log(`Error loading groups: ${error.message}`, 'error');
            container.innerHTML = `
                <p>Error loading groups: ${error.message}</p>
                <button onclick="TestApp.skipGroupSelection()">Skip Group Selection</button>
            `;
        }
    },
    
    // Display groups
    displayGroups(groups) {
        const container = document.getElementById('groups-list');
        let html = '';
        
        groups.forEach(group => {
            // Use the most appropriate ID
            const groupId = group.id || group.groupId || group._id;
            const groupName = group.name || 'Unknown Group';
            const groupCode = group.code || 'N/A';
            
            this.log(`Displaying group: ${groupName} with ID: ${groupId}`, 'info');
            
            html += `
                <div class="group-card" onclick="TestApp.selectGroup('${groupId}')" data-group-id="${groupId}">
                    <div class="group-name">${groupName}</div>
                    <div class="group-code">Code: ${groupCode}</div>
                    <small style="color: #999;">ID: ${groupId.substring(0, 10)}...</small>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // Select group
    async selectGroup(groupId) {
        this.log(`Selecting group: ${groupId}`, 'info');
        
        try {
            let group = null;
            
            // Try Firebase first for most up-to-date data
            if (db) {
                this.log('Fetching group from Firebase...', 'info');
                const doc = await db.collection('groups').doc(groupId).get();
                if (doc.exists) {
                    group = { id: doc.id, ...doc.data() };
                    this.log(`Group found in Firebase: ${group.name}`, 'success');
                } else {
                    this.log(`Group not found with ID ${groupId}, trying alternative methods...`, 'info');
                    
                    // Try to find by matching the ID in all groups
                    const allGroupsSnapshot = await db.collection('groups').get();
                    allGroupsSnapshot.forEach(doc => {
                        const data = doc.data();
                        // Check if the group has this ID stored somewhere
                        if (doc.id === groupId || data.id === groupId || data.groupId === groupId) {
                            group = { id: doc.id, ...data };
                            this.log(`Group found with alternative search: ${group.name}`, 'success');
                        }
                    });
                }
            }
            
            // Fallback to Storage if Firebase fails
            if (!group && Storage && Storage.getGroupById) {
                this.log('Trying Storage.getGroupById...', 'info');
                group = Storage.getGroupById(groupId);
                if (group) {
                    this.log(`Group found in Storage: ${group.name}`, 'success');
                }
            }
            
            // Try to get from cached groups list
            if (!group && Storage && Storage.getGroups) {
                this.log('Trying Storage.getGroups to find match...', 'info');
                const allGroups = Storage.getGroups();
                if (allGroups) {
                    group = allGroups.find(g => 
                        g.id === groupId || 
                        g.groupId === groupId ||
                        g._id === groupId
                    );
                    if (group) {
                        this.log(`Group found in Storage.getGroups: ${group.name}`, 'success');
                    }
                }
            }
            
            // Last resort - check localStorage
            if (!group) {
                this.log('Checking localStorage for group data...', 'info');
                const savedGroup = localStorage.getItem('testapp_group');
                if (savedGroup) {
                    const parsedGroup = JSON.parse(savedGroup);
                    if (parsedGroup.id === groupId) {
                        group = parsedGroup;
                        this.log(`Group found in localStorage: ${group.name}`, 'success');
                    }
                }
            }
            
            if (group) {
                this.currentGroup = group;
                
                // Set in Storage if available
                if (Storage) {
                    if (Storage.setCurrentGroup) {
                        Storage.setCurrentGroup(groupId);
                        this.log('Group set in Storage.setCurrentGroup', 'info');
                    }
                    // Also set the currentGroupId directly
                    Storage.currentGroupId = groupId;
                    this.log(`Storage.currentGroupId set to: ${groupId}`, 'info');
                }
                
                // Save to localStorage for persistence
                localStorage.setItem('testapp_user', JSON.stringify(this.currentUser));
                localStorage.setItem('testapp_group', JSON.stringify(this.currentGroup));
                
                this.log(`✅ Group selected successfully: ${group.name}`, 'success');
                
                // Proceed to main app
                this.onLoginSuccess();
            } else {
                this.log(`❌ Group not found: ${groupId}`, 'error');
                alert('Error: Group not found. Please try again.');
            }
        } catch (error) {
            this.log(`❌ Error selecting group: ${error.message}`, 'error');
            alert(`Error selecting group: ${error.message}`);
        }
    },
    
    // On login success
    onLoginSuccess() {
        this.isLoggedIn = true;
        
        // Hide auth screens (handle both old and new systems)
        const loginScreen = document.getElementById('login-screen');
        const authScreen = document.getElementById('auth-screen');
        const groupSelector = document.getElementById('group-selector');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (authScreen) authScreen.style.display = 'none';
        if (groupSelector) groupSelector.style.display = 'none';
        
        // Update UI
        const currentUserSpan = document.getElementById('current-user');
        const currentGroupSpan = document.getElementById('current-group');
        const activeGroupSpan = document.getElementById('active-group-name');
        
        if (currentUserSpan) {
            currentUserSpan.textContent = this.currentUser?.displayName || this.currentUser?.name || 'Usuario Demo';
        }
        if (currentGroupSpan) {
            currentGroupSpan.textContent = this.currentGroup?.name || 'Grupo Demo';
        }
        if (activeGroupSpan) {
            activeGroupSpan.textContent = this.currentGroup?.name || 'Grupo Demo';
        }
        
        // Navigate to dashboard and set it as active
        this.navigateToScreen('dashboard');
        
        // Load initial data
        this.loadInitialData();
    },
    
    // Skip login
    skipLogin() {
        this.log('Skipping login (demo mode)', 'info');
        this.currentUser = { id: 'demo', name: 'Demo User' };
        this.currentGroup = { id: 'demo', name: 'Demo Group' };
        this.onLoginSuccess();
    },
    
    // Skip group selection
    skipGroupSelection() {
        this.log('Skipping group selection', 'info');
        this.currentGroup = { id: 'demo', name: 'Demo Group' };
        this.onLoginSuccess();
    },
    
    // Logout
    logout() {
        this.log('Logging out...', 'info');
        this.currentUser = null;
        this.currentGroup = null;
        this.isLoggedIn = false;
        
        // Clear ALL session data from both storages
        localStorage.removeItem('testapp_user');
        localStorage.removeItem('testapp_group');
        localStorage.removeItem('auth_current_session');
        localStorage.setItem('auth_logged_out', 'true');
        
        // Clear sessionStorage completely
        sessionStorage.clear();
        
        // Clear Storage session if available
        if (Storage) {
            Storage.currentPersonId = null;
            Storage.currentGroupId = null;
            Storage.clearSession();
        }
        
        // Clear AuthSystem if available
        if (typeof AuthSystem !== 'undefined') {
            AuthSystem.currentUser = null;
            AuthSystem.isAuthenticated = false;
        }
        
        // Clear collaborative system if available
        if (typeof collaborativeSystem !== 'undefined') {
            collaborativeSystem.setCurrentUser(null);
        }
        
        // Reload page
        location.reload();
    },
    
    // Setup navigation
    setupNavigation() {
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Use currentTarget instead of target to always get the button, not the span
                const screen = btn.dataset.screen || e.currentTarget.dataset.screen;
                if (screen) {
                    this.navigateToScreen(screen);
                } else {
                    this.log('Warning: No screen defined for button', 'error');
                }
            });
        });
    },
    
    // Check for pending evaluations
    async checkPendingEvaluations() {
        if (!window.UnifiedEvaluationSystem || !this.currentUser) return;
        
        try {
            const userId = this.currentUser.uid || this.currentUser.id;
            const pendingEvals = await window.UnifiedEvaluationSystem.getPendingEvaluations(userId);
            
            this.pendingEvaluations = pendingEvals.length;
            
            // Update badge
            const badge = document.getElementById('evaluations-badge');
            if (badge) {
                if (this.pendingEvaluations > 0) {
                    badge.textContent = this.pendingEvaluations;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            
            // Update dashboard card
            const card = document.getElementById('pending-evaluations-card');
            const count = document.getElementById('pending-count');
            if (card && count) {
                if (this.pendingEvaluations > 0) {
                    count.textContent = this.pendingEvaluations;
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
            
            this.log(`🎯 ${this.pendingEvaluations} evaluaciones pendientes`, 'info');
            
        } catch (error) {
            console.error('Error checking pending evaluations:', error);
        }
    },
    
    // Navigate to screen
    navigateToScreen(screenName) {
        this.log(`Navigating to: ${screenName}`, 'info');
        
        if (!screenName) {
            this.log('Error: No screen name provided', 'error');
            return;
        }
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });
        
        // Show selected screen
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.add('active');
            
            // Special handling for evaluations screen
            if (screenName === 'evaluations') {
                console.log('[TestApp] Rendering evaluations section...');
                if (window.EvaluationUI) {
                    console.log('[TestApp] EvaluationUI found, calling renderEvaluationsSection');
                    window.EvaluationUI.renderEvaluationsSection();
                } else if (window.evaluationUI) {
                    console.log('[TestApp] evaluationUI found, calling renderEvaluationsSection');
                    window.evaluationUI.renderEvaluationsSection();
                } else {
                    console.error('[TestApp] No EvaluationUI instance found!');
                    // Try to render manually
                    const container = document.getElementById('evaluations-section');
                    if (container) {
                        container.innerHTML = `
                            <div style="padding: 20px; background: #f8f9fa; border-radius: 10px;">
                                <h2>📊 Evaluaciones</h2>
                                <p style="color: orange;">⚠️ Sistema de evaluaciones no cargado automáticamente</p>
                                <div style="display: flex; gap: 10px; margin-top: 20px;">
                                    <button onclick="TestApp.showEvaluationsManually()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                        ✅ Cargar Evaluaciones Manualmente
                                    </button>
                                    <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                        🔄 Recargar Página
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    // Only load manually if not already loading
                    if (!this.isLoadingEvaluations) {
                        setTimeout(() => {
                            this.showEvaluationsManually();
                        }, 500);
                    }
                }
            }
            
            // Update active button state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if (btn.dataset.screen === screenName) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else {
            this.log(`Error: Screen "${screenName}-screen" not found`, 'error');
        }
        
        // Auto-load content for specific screens
        if (screenName === 'evaluate') {
            // Auto-load pending matches when entering EVALUATE section
            setTimeout(() => {
                this.loadPendingMatches();
            }, 100);
        }
        
        // Load profile when navigating to profile screen
        if (screenName === 'profile') {
            this.loadProfile();
        }
        
        // Update CollaborativeSystem when navigating to collaborative screen
        if (screenName === 'collaborative') {
            console.log('📱 Navigating to collaborative screen...');
            console.log('🔍 Checking if collaborativeSystem exists:', typeof collaborativeSystem);
            console.log('🔍 collaborativeSystem object:', window.collaborativeSystem);
            
            // Try to update the user in CollaborativeSystem
            if (typeof collaborativeSystem !== 'undefined') {
                console.log('✅ collaborativeSystem found, updating...');
                // Re-initialize event listeners to ensure they work
                collaborativeSystem.reinitializeEventListeners();
            } else {
                console.log('❌ collaborativeSystem not found, trying to create it...');
                if (typeof CollaborativeSystem !== 'undefined' && !window.collaborativeSystem) {
                    window.collaborativeSystem = new CollaborativeSystem();
                    console.log('✅ Created new collaborativeSystem instance');
                } else if (window.collaborativeSystem) {
                    console.log('⚠️ collaborativeSystem already exists globally, reusing');
                    window.collaborativeSystem.reinitializeEventListeners();
                } else {
                    console.log('❌ CollaborativeSystem class not available');
                    return;
                }
            }
            
            // Use the system (either existing or newly created)
            const system = typeof collaborativeSystem !== 'undefined' ? collaborativeSystem : window.collaborativeSystem;
            
            if (system) {
                
                // First try to get from AuthSystem
                if (window.AuthSystem && window.AuthSystem.currentUser) {
                    console.log('🔄 Updating CollaborativeSystem with AuthSystem user:', window.AuthSystem.currentUser);
                    system.setCurrentUser(window.AuthSystem.currentUser);
                }
                // Otherwise try TestApp
                else if (this.currentUser) {
                    console.log('🔄 Updating CollaborativeSystem with TestApp user:', this.currentUser);
                    system.setCurrentUser(this.currentUser);
                }
                
                // Reload matches to refresh the UI
                system.loadMatches();
            }
        }
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });
    },
    
    // Check Firebase connection
    checkFirebase() {
        this.log('Checking Firebase...', 'info');
        
        if (typeof firebase !== 'undefined') {
            document.getElementById('fb-status').textContent = 'Loaded';
            document.getElementById('fb-status').style.color = 'green';
            
            // Check Firestore
            if (typeof db !== 'undefined' && db) {
                document.getElementById('fb-connection').textContent = 'Connected';
                document.getElementById('fb-connection').style.color = 'green';
                this.log('Firebase connected successfully', 'success');
            } else {
                document.getElementById('fb-connection').textContent = 'Not connected';
                document.getElementById('fb-connection').style.color = 'red';
                this.log('Firebase loaded but not connected', 'error');
            }
        } else {
            document.getElementById('fb-status').textContent = 'Not loaded';
            document.getElementById('fb-status').style.color = 'red';
            this.log('Firebase not loaded', 'error');
        }
    },
    
    // Test Firebase connection
    async testFirebase() {
        this.log('Testing Firebase connection...', 'info');
        
        try {
            if (!db) {
                throw new Error('Database not initialized');
            }
            
            // Try to read a collection
            const snapshot = await db.collection('test').limit(1).get();
            this.log('Firebase test successful', 'success');
            alert('Firebase connection successful!');
        } catch (error) {
            this.log(`Firebase test failed: ${error.message}`, 'error');
            alert(`Firebase test failed: ${error.message}`);
        }
    },
    
    // Load initial data
    async loadInitialData() {
        this.log('Loading initial data...', 'info');
        
        if (!this.isLoggedIn) {
            this.log('Not logged in, skipping data load', 'info');
            return;
        }
        
        // Update UI with current user/group
        if (this.currentUser) {
            const userName = this.currentUser.displayName || this.currentUser.name || 'User';
            document.getElementById('current-user').textContent = userName;
            this.log(`Current user: ${userName}`, 'success');
        } else {
            this.log(`Current user: undefined`, 'warning');
        }
        
        if (this.currentGroup) {
            document.getElementById('current-group').textContent = this.currentGroup.name || 'Group';
            document.getElementById('active-group-name').textContent = this.currentGroup.name || 'None';
            this.log(`Current group: ${this.currentGroup.name}`, 'success');
        }
        
        // Load players count
        await this.loadPlayers();
        
        // Load matches count
        await this.loadMatchesCount();
    },
    
    // Load matches count
    async loadMatchesCount() {
        try {
            let matchCount = 0;
            
            if (Storage && Storage.getMatches) {
                const matches = Storage.getMatches();
                matchCount = matches ? matches.length : 0;
            } else if (db && this.currentGroup) {
                const snapshot = await db.collection('groups')
                    .doc(this.currentGroup.id)
                    .collection('matches')
                    .get();
                matchCount = snapshot.size;
            }
            
            document.getElementById('total-matches').textContent = matchCount;
            this.log(`Loaded ${matchCount} matches`, 'info');
        } catch (error) {
            this.log(`Error loading matches: ${error.message}`, 'error');
        }
    },
    
    // Load players
    async loadPlayers() {
        this.log('Loading players...', 'info');
        
        try {
            // Force reload from Firebase to get latest data
            if (Storage && Storage.loadPlayersFromFirebase) {
                await Storage.loadPlayersFromFirebase();
            }
            
            if (Storage && Storage.getPlayers) {
                this.players = Storage.getPlayers() || [];
                document.getElementById('total-players').textContent = this.players.length;
                this.displayPlayers();
                this.log(`Loaded ${this.players.length} players`, 'success');
            }
        } catch (error) {
            this.log(`Error loading players: ${error.message}`, 'error');
        }
    },
    
    // Display players
    displayPlayers() {
        const container = document.getElementById('players-list');
        
        if (this.players.length === 0) {
            container.innerHTML = '<p>No players found</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        this.players.forEach((player, index) => {
            // Check if photo is emoji or actual image URL
            let photoHtml;
            if (player.photo && player.photo.startsWith('data:') || player.photo && player.photo.startsWith('http')) {
                photoHtml = `<img src="${player.photo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`;
            } else if (player.photo && player.photo.length <= 4) {
                // It's an emoji
                photoHtml = `<div style="width: 50px; height: 50px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${player.photo}
                   </div>`;
            } else {
                // No photo
                photoHtml = `<div style="width: 50px; height: 50px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; color: #999;">
                    <i class='bx bx-user' style="font-size: 24px;"></i>
                   </div>`;
            }
            
            // Get attributes or use defaults
            const attrs = player.attributes || {};
            const pac = attrs.pac || attrs.ritmo || 70;
            const sho = attrs.sho || attrs.tiro || 70;
            const pas = attrs.pas || attrs.pase || 70;
            const dri = attrs.dri || attrs.regate || 70;
            const def = attrs.def || attrs.defensa || 70;
            const phy = attrs.phy || attrs.fisico || 70;
            
            // Expandable card design
            html += `
                <div class="player-card-expandable" id="player-card-${index}" style="
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: all 0.3s;
                ">
                    <div class="card-header" onclick="TestApp.togglePlayerCard(${index})" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        cursor: pointer;
                        background: #fafafa;
                    ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${photoHtml}
                            <div>
                                <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 4px;">
                                    ${player.name}
                                    ${(player.isAuthenticated || player.isAuthenticatedUser) ? 
                                        '<span style="font-size: 10px; background: #e8e8e8; color: #666; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">AUTH</span>' : ''}
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <span style="background: ${this.getPositionColor(player.position)}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                                        ${player.position}
                                    </span>
                                    <span style="background: ${player.ovr >= 80 ? '#27ae60' : player.ovr >= 70 ? '#3498db' : '#95a5a6'}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: bold;">
                                        ${player.ovr}
                                    </span>
                                    ${this.getOVRBoostIndicator(player)}
                                </div>
                            </div>
                        </div>
                        <span class="expand-icon" id="expand-icon-${index}" style="
                            font-size: 16px;
                            color: #666;
                            transition: transform 0.3s;
                        ">▼</span>
                    </div>
                    
                    <div class="card-details" id="player-details-${index}" style="
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.3s ease;
                        background: white;
                    ">
                        <div style="padding: 15px; border-top: 1px solid #e0e0e0;">
                            <div style="
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 10px;
                                margin-bottom: 15px;
                            ">
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">PAC</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(pac)};">${pac}</div>
                                </div>
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">SHO</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(sho)};">${sho}</div>
                                </div>
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">PAS</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(pas)};">${pas}</div>
                                </div>
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">DRI</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(dri)};">${dri}</div>
                                </div>
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">DEF</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(def)};">${def}</div>
                                </div>
                                <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                    <div style="font-size: 10px; color: #666; margin-bottom: 2px;">PHY</div>
                                    <div style="font-size: 18px; font-weight: bold; color: ${this.getStatColor(phy)};">${phy}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 8px;">
                                <button onclick="TestApp.viewPlayer('${player.id}')" style="
                                    flex: 1;
                                    padding: 10px;
                                    background: #3498db;
                                    color: white;
                                    border: none;
                                    border-radius: 6px;
                                    font-weight: 500;
                                    cursor: pointer;
                                ">👁️ Ver Detalle</button>
                                ${(player.isAuthenticated || player.isAuthenticatedUser) ? 
                                    '<button disabled style="flex: 1; padding: 10px; background: #e0e0e0; color: #999; border: none; border-radius: 6px; cursor: not-allowed;">🔒 Protegido</button>' :
                                    `<button onclick="TestApp.editPlayer('${player.id}')" style="
                                        flex: 1;
                                        padding: 10px;
                                        background: #f39c12;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        font-weight: 500;
                                        cursor: pointer;
                                    ">✏️ Editar</button>
                                     <button onclick="TestApp.deletePlayer('${player.id}')" style="
                                        flex: 1;
                                        padding: 10px;
                                        background: #e74c3c;
                                        color: white;
                                        border: none;
                                        border-radius: 6px;
                                        font-weight: 500;
                                        cursor: pointer;
                                    ">🗑️ Eliminar</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    // Toggle player card expansion
    togglePlayerCard(index) {
        const details = document.getElementById(`player-details-${index}`);
        const icon = document.getElementById(`expand-icon-${index}`);
        
        if (details.style.maxHeight === '0px' || !details.style.maxHeight) {
            details.style.maxHeight = '400px';
            icon.style.transform = 'rotate(180deg)';
        } else {
            details.style.maxHeight = '0px';
            icon.style.transform = 'rotate(0deg)';
        }
    },
    
    // Get color based on stat value
    getStatColor(value) {
        if (value >= 80) return '#27ae60';
        if (value >= 70) return '#3498db';
        if (value >= 60) return '#f39c12';
        if (value >= 50) return '#95a5a6';
        return '#e74c3c';
    },
    
    // Get position color
    getPositionColor(position) {
        const colors = {
            'POR': '#ff9500',
            'DEF': '#4466ff',
            'MED': '#22aa22',
            'DEL': '#ff4444'
        };
        return colors[position] || '#666';
    },
    
    // Get OVR boost indicator for evaluated players
    getOVRBoostIndicator(player) {
        // Only show indicator if player has been evaluated
        if (!player.hasBeenEvaluated || !player.originalOVR) {
            return '';
        }
        
        const ovrIncrease = player.ovr - player.originalOVR;
        
        // Only show if there was an actual increase
        if (ovrIncrease <= 0) {
            return '';
        }
        
        // Choose emoji and color based on increase amount
        let emoji = '📈';
        let color = '#27ae60'; // Green
        let bgColor = '#e8f5e8';
        
        if (ovrIncrease >= 5) {
            emoji = '⭐'; // Star for big improvements
            color = '#f39c12'; // Gold
            bgColor = '#fef9e7';
        } else if (ovrIncrease >= 3) {
            emoji = '🔥'; // Fire for good improvements
            color = '#e74c3c'; // Red
            bgColor = '#fdf2f2';
        }
        
        return `
            <span class="ovr-boost-indicator" style="
                background: ${bgColor}; 
                color: ${color}; 
                padding: 2px 6px; 
                border-radius: 12px; 
                font-size: 0.8rem; 
                font-weight: bold;
                border: 1px solid ${color}30;
                margin-left: 5px;
            ">
                ${emoji} +${ovrIncrease}
            </span>
        `;
    },
    
    // Current photo for player
    currentPlayerPhoto: null,
    isEditMode: false,
    
    // Show add player form
    showAddPlayerForm() {
        this.isEditMode = false;
        document.getElementById('player-form-title').textContent = 'Agregar Nuevo Jugador';
        document.getElementById('submit-player-btn').textContent = 'Agregar Jugador';
        document.getElementById('player-id').value = '';
        document.getElementById('add-player-form').style.display = 'block';
        document.getElementById('player-form').reset();
        this.currentPlayerPhoto = null;
        document.getElementById('photo-preview').innerHTML = '<span style="color: #999;">No photo</span>';
        
        // Setup form submission
        const form = document.getElementById('player-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (this.isEditMode) {
                await this.updatePlayer();
            } else {
                await this.addPlayer();
            }
        };
        
        // Calculate OVR when attributes change
        ['pac', 'sho', 'pas', 'dri', 'def', 'phy'].forEach(attr => {
            document.getElementById(`player-${attr}`).addEventListener('change', () => this.calculateOVR());
        });
        
        this.calculateOVR();
    },
    
    // Hide add player form
    hideAddPlayerForm() {
        document.getElementById('add-player-form').style.display = 'none';
        document.getElementById('player-form').reset();
        this.currentPlayerPhoto = null;
        this.isEditMode = false;
    },
    
    // Preview photo
    previewPhoto(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentPlayerPhoto = e.target.result;
                document.getElementById('photo-preview').innerHTML = 
                    `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                this.log('Photo loaded for preview', 'info');
            };
            reader.readAsDataURL(file);
        }
    },
    
    // Clear photo
    clearPhoto() {
        this.currentPlayerPhoto = null;
        document.getElementById('player-photo').value = '';
        document.getElementById('photo-preview').innerHTML = '<span style="color: #999;">No photo</span>';
        this.log('Photo cleared', 'info');
    },
    
    // Calculate OVR
    calculateOVR() {
        const pac = parseInt(document.getElementById('player-pac').value) || 70;
        const sho = parseInt(document.getElementById('player-sho').value) || 70;
        const pas = parseInt(document.getElementById('player-pas').value) || 70;
        const dri = parseInt(document.getElementById('player-dri').value) || 70;
        const def = parseInt(document.getElementById('player-def').value) || 70;
        const phy = parseInt(document.getElementById('player-phy').value) || 70;
        
        const position = document.getElementById('player-position').value;
        let ovr;
        
        // Calculate OVR based on position
        switch(position) {
            case 'POR':
                ovr = Math.round((def * 0.5) + (pas * 0.2) + (phy * 0.2) + (dri * 0.1));
                break;
            case 'DEF':
                ovr = Math.round((def * 0.4) + (phy * 0.3) + (pac * 0.15) + (pas * 0.15));
                break;
            case 'MED':
                ovr = Math.round((pas * 0.35) + (dri * 0.25) + (def * 0.2) + (phy * 0.2));
                break;
            case 'DEL':
                ovr = Math.round((sho * 0.35) + (pac * 0.25) + (dri * 0.25) + (phy * 0.15));
                break;
            default:
                ovr = Math.round((pac + sho + pas + dri + def + phy) / 6);
        }
        
        // Ensure OVR is between 1 and 99
        ovr = Math.min(99, Math.max(1, ovr));
        document.getElementById('player-ovr').value = ovr;
        
        return ovr;
    },
    
    // Add player
    async addPlayer() {
        const name = document.getElementById('player-name').value;
        const position = document.getElementById('player-position').value;
        const pac = parseInt(document.getElementById('player-pac').value);
        const sho = parseInt(document.getElementById('player-sho').value);
        const pas = parseInt(document.getElementById('player-pas').value);
        const dri = parseInt(document.getElementById('player-dri').value);
        const def = parseInt(document.getElementById('player-def').value);
        const phy = parseInt(document.getElementById('player-phy').value);
        const ovr = this.calculateOVR();
        
        this.log(`Adding player: ${name}`, 'info');
        
        try {
            const playerData = {
                name: name,
                position: position,
                ovr: ovr,
                photo: this.currentPlayerPhoto || null,
                attributes: {
                    pac: pac,
                    sho: sho,
                    pas: pas,
                    dri: dri,
                    def: def,
                    phy: phy
                },
                groupId: this.currentGroup?.id,
                createdBy: this.currentUser?.id || this.currentUser?.uid || 'manual_creation',
                createdAt: new Date().toISOString()
            };
            
            if (Storage && Storage.addPlayer) {
                await Storage.addPlayer(playerData);
                this.log(`Jugador agregado: ${name}`, 'success');
                this.hideAddPlayerForm();
                await this.loadPlayers();
            } else {
                throw new Error('Storage.addPlayer no disponible');
            }
        } catch (error) {
            this.log(`Error adding player: ${error.message}`, 'error');
            alert(`Error: ${error.message}`);
        }
    },
    
    // Edit player
    async editPlayer(playerId) {
        this.log(`Edit player: ${playerId}`, 'info');
        
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.log(`Player not found: ${playerId}`, 'error');
            return;
        }
        
        // Check if this is an authenticated user (not editable from here)
        if (player.isAuthenticated || player.isAuthenticatedUser) {
            alert('Los usuarios autenticados no pueden ser editados desde aquí. Deben actualizar su perfil desde su cuenta.');
            return;
        }
        
        this.isEditMode = true;
        document.getElementById('player-form-title').textContent = 'Edit Player';
        document.getElementById('submit-player-btn').textContent = 'Update Player';
        document.getElementById('player-id').value = playerId;
        
        // Fill form with player data
        document.getElementById('player-name').value = player.name;
        document.getElementById('player-position').value = player.position;
        
        // Fill attributes
        const attrs = player.attributes || {};
        document.getElementById('player-pac').value = attrs.pac || attrs.ritmo || 70;
        document.getElementById('player-sho').value = attrs.sho || attrs.tiro || 70;
        document.getElementById('player-pas').value = attrs.pas || attrs.pase || 70;
        document.getElementById('player-dri').value = attrs.dri || attrs.regate || 70;
        document.getElementById('player-def').value = attrs.def || attrs.defensa || 70;
        document.getElementById('player-phy').value = attrs.phy || attrs.fisico || 70;
        
        // Show photo if exists
        if (player.photo) {
            this.currentPlayerPhoto = player.photo;
            document.getElementById('photo-preview').innerHTML = 
                `<img src="${player.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        
        this.calculateOVR();
        document.getElementById('add-player-form').style.display = 'block';
        
        // Setup form submission
        const form = document.getElementById('player-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.updatePlayer();
        };
    },
    
    // Update player
    async updatePlayer() {
        const playerId = document.getElementById('player-id').value;
        const name = document.getElementById('player-name').value;
        const position = document.getElementById('player-position').value;
        const pac = parseInt(document.getElementById('player-pac').value);
        const sho = parseInt(document.getElementById('player-sho').value);
        const pas = parseInt(document.getElementById('player-pas').value);
        const dri = parseInt(document.getElementById('player-dri').value);
        const def = parseInt(document.getElementById('player-def').value);
        const phy = parseInt(document.getElementById('player-phy').value);
        const ovr = this.calculateOVR();
        
        this.log(`Updating player: ${name}`, 'info');
        
        try {
            const playerData = {
                id: playerId,
                name: name,
                position: position,
                ovr: ovr,
                photo: this.currentPlayerPhoto || null,
                attributes: {
                    pac: pac,
                    sho: sho,
                    pas: pas,
                    dri: dri,
                    def: def,
                    phy: phy
                },
                groupId: this.currentGroup?.id,
                updatedAt: new Date().toISOString()
            };
            
            if (Storage && Storage.updatePlayer) {
                // updatePlayer expects the full playerData object with id included
                await Storage.updatePlayer(playerData);
                this.log(`Player updated: ${name}`, 'success');
            } else if (Storage && Storage.addPlayer) {
                // Fallback: delete and re-add
                await Storage.deletePlayer(playerId);
                await Storage.addPlayer(playerData);
                this.log(`Player updated (via delete/add): ${name}`, 'success');
            } else {
                throw new Error('Cannot update player');
            }
            
            this.hideAddPlayerForm();
            await this.loadPlayers();
        } catch (error) {
            this.log(`Error updating player: ${error.message}`, 'error');
            alert(`Error: ${error.message}`);
        }
    },
    
    // View player details
    viewPlayer(playerId) {
        this.log(`View player: ${playerId}`, 'info');
        
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.log(`Player not found: ${playerId}`, 'error');
            return;
        }
        
        const attrs = player.attributes || {};
        const pac = attrs.pac || attrs.ritmo || 70;
        const sho = attrs.sho || attrs.tiro || 70;
        const pas = attrs.pas || attrs.pase || 70;
        const dri = attrs.dri || attrs.regate || 70;
        const def = attrs.def || attrs.defensa || 70;
        const phy = attrs.phy || attrs.fisico || 70;
        
        const photoHtml = player.photo 
            ? `<img src="${player.photo}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;">` 
            : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center;">
                <i class='bx bx-user' style="font-size: 60px; color: #999;"></i>
               </div>`;
        
        const detailsHtml = `
            <div style="padding: 20px; background: white; border-radius: 10px; max-width: 500px; margin: 20px auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    ${photoHtml}
                    <h2 style="margin: 10px 0;">${player.name}</h2>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <span style="background: ${this.getPositionColor(player.position)}; color: white; padding: 5px 15px; border-radius: 5px;">
                            ${player.position}
                        </span>
                        <span style="background: ${player.ovr >= 80 ? '#27ae60' : '#3498db'}; color: white; padding: 5px 15px; border-radius: 5px;">
                            OVR: ${player.ovr}
                        </span>
                    </div>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <h3 style="margin-bottom: 10px;">Attributes</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>PAC (Ritmo): <strong>${pac}</strong></div>
                        <div>SHO (Tiro): <strong>${sho}</strong></div>
                        <div>PAS (Pase): <strong>${pas}</strong></div>
                        <div>DRI (Regate): <strong>${dri}</strong></div>
                        <div>DEF (Defensa): <strong>${def}</strong></div>
                        <div>PHY (Físico): <strong>${phy}</strong></div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="TestApp.editPlayer('${player.id}')" style="background: #f39c12; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">
                        Edit Player
                    </button>
                    <button onclick="TestApp.closePlayerDetails()" style="background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'player-details-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';
        modal.innerHTML = detailsHtml;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePlayerDetails();
            }
        });
    },
    
    // Close player details
    closePlayerDetails() {
        const modal = document.getElementById('player-details-modal');
        if (modal) {
            modal.remove();
        }
    },
    
    // Delete player
    async deletePlayer(playerId) {
        if (!confirm('Delete this player?')) return;
        
        // Check if this is an authenticated user
        const player = this.players.find(p => p.id === playerId);
        if (player && (player.isAuthenticated || player.isAuthenticatedUser)) {
            alert('Los usuarios autenticados no pueden ser eliminados desde aquí.');
            return;
        }
        
        this.log(`Deleting player: ${playerId}`, 'info');
        
        try {
            if (Storage && Storage.deletePlayer) {
                await Storage.deletePlayer(playerId);
                this.log(`Player deleted: ${playerId}`, 'success');
                await this.loadPlayers();
            }
        } catch (error) {
            this.log(`Error deleting player: ${error.message}`, 'error');
        }
    },
    
    // Refresh players
    async refreshPlayers() {
        this.log('Refreshing players...', 'info');
        await this.loadPlayers();
    },
    
    // Match data
    currentMatch: null,
    matchHistory: [],
    
    // Initialize match screen
    initMatchScreen() {
        try {
            // Set default date to today
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);
            
            const dateInput = document.getElementById('match-date');
            const timeInput = document.getElementById('match-time');
            
            if (dateInput) dateInput.value = dateStr;
            if (timeInput) timeInput.value = timeStr;
            
            this.log('Match screen initialized with default date/time', 'info');
        
        // Show match history by default
        setTimeout(() => {
            this.displayMatchHistory();
        }, 500);
        } catch (error) {
            this.log(`Error initializing match screen: ${error.message}`, 'error');
        }
    },

    // Generate balanced teams
    async generateTeams() {
        // Show player selection modal first
        await this.showPlayerSelectionModal();
    },
    
    // Show player selection modal before generating teams
    async showPlayerSelectionModal() {
        this.log('Mostrando selector de jugadores...', 'info');
        
        // Get available players
        await this.loadPlayers();
        
        if (!this.players || this.players.length < 6) {
            alert('Se necesitan al menos 6 jugadores para generar equipos');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">
                    ⚽ Selecciona los jugadores para el partido
                </h2>
                
                <div style="margin-bottom: 20px; text-align: center;">
                    <p style="color: #666; margin-bottom: 10px;">
                        Selecciona entre 6 y 20 jugadores. Los equipos se generarán automáticamente balanceados.
                    </p>
                    <div id="selected-count" style="
                        font-weight: bold; 
                        font-size: 18px; 
                        color: #007bff;
                        margin-bottom: 15px;
                    ">0 jugadores seleccionados</div>
                    
                    <input type="text" 
                           id="location-input" 
                           placeholder="Lugar del partido (ej: Cancha Municipal)" 
                           style="
                               width: 100%;
                               padding: 10px;
                               border: 2px solid #ddd;
                               border-radius: 5px;
                               font-size: 16px;
                               margin-bottom: 20px;
                           ">
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    ${this.players.map(player => `
                        <div style="
                            border: 2px solid #ddd;
                            border-radius: 10px;
                            padding: 15px;
                            cursor: pointer;
                            transition: all 0.3s;
                            background: white;
                        " 
                        class="player-selection-card" 
                        data-player-id="${player.id}"
                        onclick="TestApp.togglePlayerSelection(this, '${player.id}')">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    background: #f0f0f0;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    ${player.photo ? `background-image: url(${player.photo}); background-size: cover; background-position: center;` : ''}
                                ">
                                    ${!player.photo ? player.name.charAt(0) : ''}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; font-size: 16px; color: #333;">
                                        ${player.name}
                                    </div>
                                    <div style="font-size: 14px; color: #666; display: flex; gap: 10px;">
                                        <span style="
                                            background: ${this.getPositionColor(player.position)};
                                            color: white;
                                            padding: 2px 6px;
                                            border-radius: 3px;
                                            font-size: 12px;
                                        ">${player.position}</span>
                                        <span style="font-weight: bold;">OVR: ${player.ovr}</span>
                                    </div>
                                </div>
                                <div class="selection-indicator" style="
                                    width: 24px;
                                    height: 24px;
                                    border-radius: 50%;
                                    border: 2px solid #ddd;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 16px;
                                    color: transparent;
                                ">✓</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="TestApp.generateTeamsFromSelection()" 
                            id="generate-selected-teams-btn"
                            style="
                                flex: 1;
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 15px;
                                border-radius: 5px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                                opacity: 0.5;
                            " disabled>
                        ⚽ Generar Equipos
                    </button>
                    <button onclick="TestApp.cancelPlayerSelection()" 
                            style="
                                flex: 1;
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 15px;
                                border-radius: 5px;
                                font-size: 16px;
                                cursor: pointer;
                            ">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.selectedPlayers = new Set();
    },
    
    // Toggle player selection
    togglePlayerSelection(card, playerId) {
        console.log('🔄 Toggle player selection:', playerId);
        
        // Initialize selectedPlayers if it doesn't exist
        if (!this.selectedPlayers) {
            this.selectedPlayers = new Set();
        }
        
        const indicator = card.querySelector('.selection-indicator');
        const countElement = document.getElementById('selected-count');
        const generateBtn = document.getElementById('generate-selected-teams-btn');
        
        if (this.selectedPlayers.has(playerId)) {
            // Deselect
            this.selectedPlayers.delete(playerId);
            card.style.borderColor = '#ddd';
            card.style.background = 'white';
            indicator.style.background = 'transparent';
            indicator.style.borderColor = '#ddd';
            indicator.style.color = 'transparent';
            console.log('❌ Deselected player:', playerId);
        } else {
            // Select
            this.selectedPlayers.add(playerId);
            card.style.borderColor = '#28a745';
            card.style.background = '#f8fff8';
            indicator.style.background = '#28a745';
            indicator.style.borderColor = '#28a745';
            indicator.style.color = 'white';
            console.log('✅ Selected player:', playerId);
        }
        
        // Update counter
        const count = this.selectedPlayers.size;
        countElement.textContent = `${count} jugadores seleccionados`;
        console.log(`📊 Total selected: ${count}`);
        
        // Enable/disable generate button
        if (count >= 6 && count <= 20) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
            generateBtn.removeAttribute('disabled');
            countElement.style.color = '#28a745';
            console.log('🟢 Generate button enabled');
        } else {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.5';
            generateBtn.style.cursor = 'not-allowed';
            generateBtn.setAttribute('disabled', 'disabled');
            countElement.style.color = count < 6 ? '#dc3545' : '#ffc107';
            console.log('🔴 Generate button disabled');
        }
        
        if (count < 6) {
            countElement.textContent += ' (mínimo 6)';
        } else if (count > 20) {
            countElement.textContent += ' (máximo 20)';
        }
    },
    
    // Cancel player selection modal
    cancelPlayerSelection() {
        const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
        if (modal) {
            modal.remove();
        }
        // Clean up
        this.selectedPlayers = null;
    },
    
    // Generate teams from selected players
    async generateTeamsFromSelection() {
        console.log('🎯 Generate teams from selection called');
        
        try {
            const location = document.getElementById('location-input').value.trim();
            
            if (!this.selectedPlayers || this.selectedPlayers.size < 6) {
                alert('Selecciona al menos 6 jugadores');
                return;
            }
            
            console.log(`📋 Selected players: ${this.selectedPlayers.size}`);
            console.log('👥 Selected player IDs:', Array.from(this.selectedPlayers));
            
            // Get selected player objects
            const selectedPlayerObjects = this.players.filter(p => this.selectedPlayers.has(p.id));
            console.log('🔍 Found player objects:', selectedPlayerObjects.length);
            
            if (selectedPlayerObjects.length === 0) {
                alert('Error: No se pudieron encontrar los jugadores seleccionados');
                return;
            }
            
            // Close modal
            const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
            if (modal) {
                modal.remove();
            }
            
            // Store location for later use
            this.matchLocation = location || 'Por definir';
            console.log('📍 Match location:', this.matchLocation);
            
            // Generate teams with selected players
            await this.generateTeamsWithPlayers(selectedPlayerObjects);
            
        } catch (error) {
            console.error('Error generating teams from selection:', error);
            alert('Error al generar equipos: ' + error.message);
        }
    },
    
    // Generate teams with specific players (original generateTeams logic)
    async generateTeamsWithPlayers(playersToUse) {
        this.log('Generating balanced teams...', 'info');
        
        // Initialize match screen if not done
        if (!document.getElementById('match-date').value) {
            this.initMatchScreen();
        }
        
        // Get match configuration
        const format = document.getElementById('match-format').value;
        const playersPerTeam = parseInt(format.split('v')[0]);
        const minPlayers = playersPerTeam * 2;
        
        if (playersToUse.length < minPlayers) {
            alert(`Se necesitan al menos ${minPlayers} jugadores para el formato ${format}`);
            return;
        }
        
        try {
            // Sort players by OVR for better distribution
            const sortedPlayers = [...playersToUse].sort((a, b) => b.ovr - a.ovr);
            
            const teamA = [];
            const teamB = [];
            
            // Distribute players alternating between teams for balance
            sortedPlayers.forEach((player, index) => {
                if (index % 2 === 0) {
                    if (teamA.length < playersPerTeam) {
                        teamA.push(player);
                    } else if (teamB.length < playersPerTeam) {
                        teamB.push(player);
                    }
                } else {
                    if (teamB.length < playersPerTeam) {
                        teamB.push(player);
                    } else if (teamA.length < playersPerTeam) {
                        teamA.push(player);
                    }
                }
            });
            
            // Calculate team OVRs
            const teamAOvr = Math.round(teamA.reduce((sum, p) => sum + p.ovr, 0) / teamA.length);
            const teamBOvr = Math.round(teamB.reduce((sum, p) => sum + p.ovr, 0) / teamB.length);
            const difference = Math.abs(teamAOvr - teamBOvr);
            
            // Get match date and time
            const matchDate = document.getElementById('match-date').value;
            const matchTime = document.getElementById('match-time').value;
            const matchDateTime = `${matchDate}T${matchTime}:00.000Z`;
            
            // Calculate total team OVR (sum of all players)
            const teamATotalOvr = teamA.reduce((sum, p) => sum + p.ovr, 0);
            const teamBTotalOvr = teamB.reduce((sum, p) => sum + p.ovr, 0);
            
            // Generate team names based on players
            const teamAName = this.generateTeamName(teamA);
            const teamBName = this.generateTeamName(teamB);
            
            // Store current match data
            this.currentMatch = {
                teamA: { 
                    name: teamAName, 
                    players: teamA, 
                    ovr: teamAOvr,
                    totalOvr: teamATotalOvr
                },
                teamB: { 
                    name: teamBName, 
                    players: teamB, 
                    ovr: teamBOvr,
                    totalOvr: teamBTotalOvr
                },
                format: format,
                date: matchDate,
                time: matchTime,
                dateTime: matchDateTime,
                difference: difference,
                status: 'generated',
                location: this.matchLocation || 'Por definir',
                createdAt: new Date().toISOString()
            };
            
            // Display teams
            this.displayTeam('team-a', teamA, `${teamAName} (AVG: ${teamAOvr})`);
            this.displayTeam('team-b', teamB, `${teamBName} (AVG: ${teamBOvr})`);
            
            // Show team balance info
            this.displayTeamBalance(difference, format);
            
            // Show match actions
            document.getElementById('match-actions-generated').style.display = 'block';
            
            this.log(`${format} teams generated - Balance difference: ${difference} OVR`, 'success');
        } catch (error) {
            this.log(`Error generating teams: ${error.message}`, 'error');
        }
    },
    
    // Update match names in Firebase
    async updateMatchInFirebase(match) {
        try {
            if (typeof db !== 'undefined' && db && match.id) {
                const matchData = {
                    'teamA.name': match.teamA.name,
                    'teamB.name': match.teamB.name,
                    updatedAt: Date.now()
                };
                
                // Try updating in futbol_matches collection first
                await db.collection('futbol_matches').doc(match.id).update(matchData);
                console.log(`✅ Updated team names in Firebase for match: ${match.id}`);
            }
        } catch (error) {
            // Silently fail - not critical
            console.log(`⚠️ Could not update match names in Firebase: ${error.message}`);
        }
    },
    
    // Generate team name with political thinkers (right vs left)
    generateTeamName(players) {
        // Political thinkers team names - mix of right and left
        const teamNames = [
            // Left wing / Progressive
            'Marx FC',
            'Los Che Guevaras',
            'Club Lenin',
            'Sanders United',
            'Los Trotskys',
            'Allende Athletic',
            'Los Chavistas',
            'Club Mandela',
            'Kropotkin FC',
            'Los Morales',
            'Chomsky United',
            'Club Gramsci',
            'Los Zapatistas FC',
            'Fidel Athletic',
            'Club Rosa Luxembourg',
            
            // Right wing / Conservative  
            'Trump FC',
            'Los Reagans',
            'Club Thatcher',
            'Pinochet United',
            'Los Friedmans',
            'Bolsonaro Athletic',
            'Club Rand',
            'Los Hayeks',
            'Videla FC',
            'Club Von Mises',
            'Los Macris',
            'Milei United',
            'Club Rockefeller',
            'Los Bushes FC',
            'Kissinger Athletic',
            
            // Centrist/Mixed for balance
            'Los Moderados FC',
            'Club Democrático',
            'Coalición United',
            'Los Centristas',
            'Club Bipartidista'
        ];
        
        // Return random team name
        return teamNames[Math.floor(Math.random() * teamNames.length)];
    },
    
    // Display team with enhanced layout
    displayTeam(containerId, players, teamName) {
        const container = document.querySelector(`#${containerId} .team-players`);
        
        let html = '';
        let totalOVR = 0;
        
        players.forEach(player => {
            totalOVR += player.ovr || 70;
            const photoHtml = player.photo 
                ? `<img src="${player.photo}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` 
                : `<div style="width: 30px; height: 30px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                    ${player.name.charAt(0)}
                   </div>`;
            
            html += `
                <div class="team-player" style="display: flex; align-items: center; padding: 8px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;">
                    ${photoHtml}
                    <div style="margin-left: 10px; flex: 1;">
                        <div style="font-weight: bold;">${player.name}</div>
                        <div style="font-size: 12px; color: #666;">
                            <span style="background: ${this.getPositionColor(player.position)}; color: white; padding: 1px 5px; border-radius: 3px; font-size: 10px;">
                                ${player.position}
                            </span>
                            <span style="margin-left: 5px; font-weight: bold;">OVR: ${player.ovr}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const avgOVR = Math.round(totalOVR / players.length);
        document.querySelector(`#${containerId} h3`).textContent = teamName;
        container.innerHTML = html;
    },
    
    // Display team balance information
    displayTeamBalance(difference, format = '5v5') {
        const teamsDisplay = document.getElementById('teams-display');
        
        let balanceHtml = '';
        let balanceColor = '';
        let balanceText = '';
        
        if (difference <= 2) {
            balanceColor = '#27ae60';
            balanceText = 'Perfectly Balanced!';
        } else if (difference <= 5) {
            balanceColor = '#f39c12';
            balanceText = 'Well Balanced';
        } else {
            balanceColor = '#e74c3c';
            balanceText = 'Unbalanced Teams';
        }
        
        // Get match date and time for display
        const matchDate = document.getElementById('match-date').value;
        const matchTime = document.getElementById('match-time').value;
        
        balanceHtml = `
            <div style="margin: 20px 0; padding: 15px; background: ${balanceColor}; color: white; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0 0 10px 0;">${balanceText}</h4>
                <p style="margin: 0 0 5px 0;">Format: ${format} | OVR Difference: ${difference} points</p>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Scheduled: ${matchDate} at ${matchTime}</p>
            </div>
        `;
        
        // Add balance info after teams
        if (!document.getElementById('team-balance-info')) {
            teamsDisplay.insertAdjacentHTML('afterend', `<div id="team-balance-info">${balanceHtml}</div>`);
        } else {
            document.getElementById('team-balance-info').innerHTML = balanceHtml;
        }
    },
    
    // Save match to history
    async saveMatch() {
        if (!this.currentMatch) {
            alert('No match to save. Generate teams first.');
            return;
        }
        
        this.log('💾 Saving match to new clean Firebase structure...', 'info');
        
        try {
            // Generate unique ID
            const matchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            
            // Get current user and group info
            const currentUserId = Storage?.currentPersonId || 'demo_user';
            const currentGroupId = Storage?.currentGroupId || 'demo_group';
            
            // Get match configuration from form or currentMatch
            const matchFormat = this.currentMatch?.format || document.getElementById('match-format')?.value || '5v5';
            const matchDate = this.currentMatch?.date || document.getElementById('match-date')?.value || new Date().toISOString().split('T')[0];
            const matchTime = this.currentMatch?.time || document.getElementById('match-time')?.value || '14:00';
            
            // Create complete match data
            const matchData = {
                // Basic Info
                id: matchId,
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                savedAt: new Date().toISOString(),
                
                // User & Group Info
                createdBy: currentUserId,
                groupId: currentGroupId,
                
                // Match Configuration
                format: matchFormat,
                date: matchDate,
                time: matchTime,
                
                // Teams Data
                teamA: {
                    name: this.currentMatch.teamA.name,
                    players: this.currentMatch.teamA.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        position: p.position,
                        ovr: p.ovr,
                        attributes: p.attributes
                    })),
                    ovr: this.currentMatch.teamA.ovr,
                    totalOvr: this.currentMatch.teamA.totalOvr
                },
                teamB: {
                    name: this.currentMatch.teamB.name,
                    players: this.currentMatch.teamB.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        position: p.position,
                        ovr: p.ovr,
                        attributes: p.attributes
                    })),
                    ovr: this.currentMatch.teamB.ovr,
                    totalOvr: this.currentMatch.teamB.totalOvr
                },
                
                // Match Stats
                difference: this.currentMatch.difference,
                
                // Evaluation Data (initially empty)
                evaluation: {
                    completed: false,
                    evaluatedAt: null,
                    evaluatedBy: null,
                    goals: {
                        teamA: null,
                        teamB: null
                    },
                    notes: null,
                    playerRatings: {}
                }
            };
            
            // Save directly to Firebase in new clean collection
            if (db) {
                this.log(`🎯 Saving to Firebase collection: futbol_matches`, 'info');
                await db.collection('futbol_matches').doc(matchId).set(matchData);
                this.log(`✅ Match saved successfully to Firebase with ID: ${matchId}`, 'success');
            } else {
                this.log('⚠️  No Firebase connection, saving locally only', 'warning');
            }
            
            // Add to local history
            this.matchHistory.unshift(matchData);
            
            // Clear the current match display
            this.clearMatchDisplay();
            
            // Update UI
            this.displayMatchHistory();
            
            this.log(`🎉 Match saved successfully! ID: ${matchId}`, 'success');
            alert('¡Partido guardado exitosamente! Revisa el historial abajo.');
            
        } catch (error) {
            this.log(`❌ Error saving match: ${error.message}`, 'error');
            alert(`Error guardando partido: ${error.message}`);
        }
    },
    
    // Clear match display after saving
    clearMatchDisplay() {
        // Clear team displays
        document.querySelector('#team-a .team-players').innerHTML = '';
        document.querySelector('#team-b .team-players').innerHTML = '';
        
        // Reset team headers
        document.querySelector('#team-a h3').textContent = 'Team A';
        document.querySelector('#team-b h3').textContent = 'Team B';
        
        // Hide match actions
        document.getElementById('match-actions-generated').style.display = 'none';
        
        // Remove balance info
        const balanceInfo = document.getElementById('team-balance-info');
        if (balanceInfo) {
            balanceInfo.remove();
        }
        
        // Clear current match
        this.currentMatch = null;
        
        this.log('Match display cleared', 'info');
    },
    
    // Display match history - Load ALL matches from Firebase
    async displayMatchHistory() {
        this.log('Loading ALL match history from Firebase...', 'info');
        
        try {
            // Load all matches from Firebase first
            await this.loadAllMatches();
            
            const historyContainer = document.getElementById('match-history');
            if (!historyContainer) {
                // Create match history section
                const matchesScreen = document.getElementById('matches-screen');
                matchesScreen.insertAdjacentHTML('beforeend', `
                    <div id="match-history" style="margin-top: 30px;">
                        <h3>Historial de Partidos (${this.matchHistory.length})</h3>
                        <div id="history-list"></div>
                    </div>
                `);
            }
            
            const historyList = document.getElementById('history-list');
            
            if (this.matchHistory.length === 0) {
                historyList.innerHTML = '<p style="color: #666;">No hay partidos guardados aún. ¡Genera y guarda algunos equipos primero!</p>';
                return;
            }
            
            // Update the header count
            const headerElement = document.querySelector('#match-history h3');
            if (headerElement) {
                headerElement.textContent = `Historial de Partidos (${this.matchHistory.length})`;
            }
            
            let html = '';
            // Sort matches by date (newest first)
            const sortedMatches = [...this.matchHistory].sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA;
            });
            
            sortedMatches.forEach((match, index) => {
            const matchDate = match.date ? new Date(match.date) : new Date(match.createdAt);
            const date = matchDate.toLocaleDateString();
            const time = matchDate.toLocaleTimeString();
            const format = match.format || '5v5';
            
            // Get team names with fallback - update old generic names
            let teamAName = match.teamA?.name || 'Team A';
            let teamBName = match.teamB?.name || 'Team B';
            
            // Update generic team names with lunfardo if they exist
            let needsUpdate = false;
            if (teamAName === 'Team A' && match.teamA?.players && match.teamA.players.length > 0) {
                teamAName = this.generateTeamName(match.teamA.players);
                // Update the match object for future use
                match.teamA.name = teamAName;
                needsUpdate = true;
            }
            if (teamBName === 'Team B' && match.teamB?.players && match.teamB.players.length > 0) {
                teamBName = this.generateTeamName(match.teamB.players);
                // Update the match object for future use
                match.teamB.name = teamBName;
                needsUpdate = true;
            }
            
            // Update in Firebase if names were changed
            if (needsUpdate && match.id) {
                this.updateMatchInFirebase(match);
            }
            const teamAOvr = match.teamA?.ovr || 'N/A';
            const teamBOvr = match.teamB?.ovr || 'N/A';
            const difference = match.difference || 0;
            const status = match.status || 'pending';
            
            html += `
                <div class="match-history-item" style="
                    background: linear-gradient(135deg, #f8f9fa, #ffffff); 
                    padding: 20px; 
                    margin: 15px 0; 
                    border-radius: 12px; 
                    border-left: 4px solid #00ff9d; 
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                " 
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 255, 157, 0.2)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)';">
                    
                    <!-- Título del partido -->
                    <div style="font-weight: 700; margin-bottom: 12px; font-size: 16px; color: #2c3e50; text-align: center;">
                        ⚽ ${teamAName} <span style="color: #00ff9d;">${teamAOvr}</span> vs ${teamBName} <span style="color: #00ff9d;">${teamBOvr}</span>
                    </div>
                    
                    <!-- Información del partido -->
                    <div style="font-size: 13px; color: #666; margin-bottom: 15px; text-align: center;">
                        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 8px;">
                            <span>📅 ${date} ${time}</span>
                            <span>🏟️ ${format}</span>
                            <span>📍 ${match.location || 'Por definir'}</span>
                        </div>
                        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; align-items: center;">
                            <span>⚖️ Balance: ${difference} OVR</span>
                            <span style="
                                background: ${status === 'completed' ? '#27ae60' : '#f39c12'}; 
                                color: white; 
                                padding: 3px 10px; 
                                border-radius: 12px; 
                                font-size: 11px; 
                                font-weight: 600;
                            ">
                                ${status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        ${!match.result ? `
                            <button onclick="TestApp.finishMatchFromHistory('${match.id}')" style="
                                background: linear-gradient(135deg, #00ff9d, #00cc7a); 
                                color: #0a0a0a; 
                                padding: 10px 16px; 
                                border: none; 
                                border-radius: 8px; 
                                font-size: 12px; 
                                font-weight: 600; 
                                cursor: pointer;
                                min-width: 80px;
                                margin: 2px;
                            ">
                                ✅ Finalizar
                            </button>
                        ` : `
                            <span style="
                                background: #27ae60; 
                                color: white; 
                                padding: 10px 16px; 
                                border-radius: 8px; 
                                font-size: 12px; 
                                font-weight: 600;
                                min-width: 80px;
                                display: inline-block;
                                text-align: center;
                                margin: 2px;
                            ">
                                ✅ Completado
                            </span>
                        `}
                        <button onclick="TestApp.viewMatchDetails('${match.id}')" style="
                            background: #3498db; 
                            color: white; 
                            padding: 10px 16px; 
                            border: none; 
                            border-radius: 8px; 
                            font-size: 12px; 
                            cursor: pointer;
                            min-width: 60px;
                            margin: 2px;
                        ">
                            👁️ Ver
                        </button>
                        <button onclick="TestApp.deleteMatch('${match.id}')" style="
                            background: #e74c3c; 
                            color: white; 
                            padding: 10px 16px; 
                            border: none; 
                            border-radius: 8px; 
                            font-size: 12px; 
                            cursor: pointer;
                            min-width: 60px;
                            margin: 2px;
                        ">
                            🗑️ Borrar
                        </button>
                    </div>
                </div>
            `;
        });
        
        historyList.innerHTML = html;
        
        } catch (error) {
            this.log(`Error loading match history: ${error.message}`, 'error');
            const historyList = document.getElementById('history-list');
            if (historyList) {
                historyList.innerHTML = '<p style="color: #e74c3c;">Error cargando historial de partidos</p>';
            }
        }
    },
    
    // Debug function to manually test loadAllMatches with detailed logging
    async debugLoadMatches() {
        this.log('🐛 DEBUG: Manual loadAllMatches test initiated...', 'info');
        this.log('========================================', 'info');
        
        // Clear previous matches
        this.matchHistory = [];
        
        // Call the enhanced loadAllMatches function
        await this.loadAllMatches();
        
        // Summary
        this.log('========================================', 'info');
        this.log(`🏁 DEBUG COMPLETE: Found ${this.matchHistory.length} total matches`, this.matchHistory.length > 0 ? 'success' : 'warning');
        
        if (this.matchHistory.length > 0) {
            this.log('📋 Match Summary:', 'info');
            this.matchHistory.forEach((match, index) => {
                this.log(`   ${index + 1}. ID: ${match.id} | Status: ${match.status} | Group: ${match._groupId} | Collection: ${match._collection}`, 'info');
            });
        }
        
        // Update UI if we found matches
        if (this.matchHistory.length > 0) {
            this.displayMatchHistory();
        }
    },
    
    // Load all matches from Firebase - NEW CLEAN VERSION
    async loadAllMatches() {
        this.log('🔄 Loading matches from new clean Firebase structure...', 'info');
        this.log(`📊 Using collection: futbol_matches`, 'info');
        
        try {
            this.matchHistory = [];
            
            if (!db) {
                this.log('❌ No Firebase connection available', 'error');
                return;
            }
            
            this.log('🔍 Querying futbol_matches collection...', 'info');
            
            // Load from the new clean collection
            const snapshot = await db.collection('futbol_matches')
                .orderBy('createdAt', 'desc')
                .get();
            
            if (snapshot.empty) {
                this.log('📭 No matches found in futbol_matches collection', 'info');
                this.log('💡 This is normal if no matches have been saved with the new system yet', 'info');
                return;
            }
            
            this.log(`📦 Found ${snapshot.size} matches in futbol_matches collection`, 'success');
            
            // Process each match
            let matchIndex = 0;
            snapshot.forEach(doc => {
                const matchData = doc.data();
                
                // Ensure the document ID matches the data ID
                matchData.id = matchData.id || doc.id;
                
                // Add collection info for debugging
                matchData._collection = 'futbol_matches';
                matchData._documentId = doc.id;
                
                this.matchHistory.push(matchData);
                
                this.log(`   Match ${matchIndex + 1}: ${matchData.id} | Status: ${matchData.status} | Format: ${matchData.format} | Created: ${matchData.createdAt?.substring(0, 16)}`, 'info');
                matchIndex++;
            });
            
            this.log(`✅ Successfully loaded ${this.matchHistory.length} matches from new structure`, 'success');
            
        } catch (error) {
            this.log(`❌ Error loading matches: ${error.message}`, 'error');
            console.error('Full error details:', error);
            this.matchHistory = [];
        }
    },
    
    // View match details
    viewMatchDetails(matchId) {
        const match = this.matchHistory.find(m => m.id === matchId);
        if (!match) {
            this.log(`Partido no encontrado: ${matchId}`, 'error');
            return;
        }
        
        const matchDate = match.date ? new Date(match.date) : new Date(match.createdAt);
        const date = matchDate.toLocaleDateString();
        const time = matchDate.toLocaleTimeString();
        const format = match.format || '5v5';
        
        const detailsHtml = `
            <div style="padding: 30px; background: white; border-radius: 12px; max-width: 700px; margin: 20px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">⚽ Detalles del Partido</h2>
                    <div style="margin-top: 12px; font-size: 20px; font-weight: bold; color: #3498db;">
                        ${match.teamA.name} (${match.teamA.ovr}) vs ${match.teamB.name} (${match.teamB.ovr})
                    </div>
                    <div style="color: #7f8c8d; margin-top: 8px; font-size: 14px;">
                        📅 ${format} | ${date} ${time} | ⚖️ Balance: ${match.difference} OVR de diferencia
                    </div>
                </div>
                
                ${match.teamA?.score !== undefined && match.teamB?.score !== undefined ? `
                    <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h3 style="margin: 0; color: #2c3e50;">🏆 Resultado Final</h3>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 10px; color: #e67e22;">
                            ${match.teamA.score} - ${match.teamB.score}
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                    <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                        <h3 style="text-align: center; background: #3498db; color: white; padding: 12px; margin: -15px -15px 15px; border-radius: 8px 8px 0 0;">
                            ${match.teamA.name}
                        </h3>
                        <div style="text-align: center; margin-bottom: 12px; font-weight: bold; color: #2c3e50;">
                            👥 ${match.teamA.players.length} jugadores | ⭐ ${match.teamA.ovr} OVR
                        </div>
                        ${match.teamA.players.map(player => `
                            <div style="padding: 8px; background: white; margin: 4px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <span style="font-weight: 500; color: #2c3e50;">${player.name}</span>
                                <span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                    ${player.position} (${player.ovr})
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                        <h3 style="text-align: center; background: #e74c3c; color: white; padding: 12px; margin: -15px -15px 15px; border-radius: 8px 8px 0 0;">
                            ${match.teamB.name}
                        </h3>
                        <div style="text-align: center; margin-bottom: 12px; font-weight: bold; color: #2c3e50;">
                            👥 ${match.teamB.players.length} jugadores | ⭐ ${match.teamB.ovr} OVR
                        </div>
                        ${match.teamB.players.map(player => `
                            <div style="padding: 8px; background: white; margin: 4px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <span style="font-weight: 500; color: #2c3e50;">${player.name}</span>
                                <span style="background: #e74c3c; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                    ${player.position} (${player.ovr})
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📊 Información del Partido</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; color: #34495e;">
                        <div><strong>📅 Fecha:</strong> ${date}</div>
                        <div><strong>🕐 Hora:</strong> ${time}</div>
                        <div><strong>📋 Formato:</strong> ${format}</div>
                        <div><strong>🆔 ID:</strong> ${match.id}</div>
                        <div><strong>⚖️ Balance:</strong> ${match.difference} OVR</div>
                        <div><strong>📊 Estado:</strong> ${match.status || 'Finalizado'}</div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="TestApp.closeMatchDetails()" style="background: #3498db; color: white; padding: 12px 30px; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                        🔒 Cerrar
                    </button>
                </div>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'match-details-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; overflow-y: auto;';
        modal.innerHTML = detailsHtml;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeMatchDetails();
            }
        });
    },
    
    
    // Close match details modal
    closeMatchDetails() {
        const modal = document.getElementById('match-details-modal');
        if (modal) {
            modal.remove();
        }
    },
    
    // Delete match from history and Firebase
    async deleteMatch(matchId) {
        if (!confirm('¿Eliminar este partido del historial y de la base de datos?')) return;
        
        this.log(`🗑️ Eliminando partido: ${matchId}`, 'info');
        
        try {
            // Delete from new Firebase structure
            if (db) {
                this.log(`🎯 Deleting from futbol_matches collection...`, 'info');
                await db.collection('futbol_matches').doc(matchId).delete();
                this.log(`✅ Partido eliminado de Firebase: ${matchId}`, 'success');
            } else {
                this.log('⚠️  No Firebase connection available', 'warning');
            }
            
            // Remove from local history
            this.matchHistory = this.matchHistory.filter(m => m.id !== matchId);
            
            // Update display
            await this.displayMatchHistory();
            
            this.log('🎉 Partido eliminado exitosamente', 'success');
            alert('Partido eliminado exitosamente de la base de datos');
            
        } catch (error) {
            this.log(`Error eliminando partido: ${error.message}`, 'error');
            alert(`Error eliminando partido: ${error.message}`);
        }
    },

    // Finish match from history - connects to unified evaluation system
    async finishMatchFromHistory(matchId) {
        this.log(`✅ Finalizando partido: ${matchId}`, 'info');
        
        try {
            // Find the match in our history
            const match = this.matchHistory.find(m => m.id === matchId);
            if (!match) {
                throw new Error('Partido no encontrado en el historial');
            }
            
            if (!confirm(`¿Finalizar partido "${match.teamA?.name || 'Team A'} vs ${match.teamB?.name || 'Team B'}"?\n\nSe generarán evaluaciones automáticas para todos los jugadores.`)) {
                return;
            }
            
            // Direct approach - finish match here without MatchManager
            this.log('Finalizando partido directamente...', 'info');
            
            // Update match status
            match.status = 'completed';
            match.completedAt = Date.now();
            match.result = { teamA: 0, teamB: 0 };
            
            // Update in Firebase
            if (db) {
                try {
                    await db.collection('futbol_matches').doc(matchId).update({
                        status: 'completed',
                        completedAt: match.completedAt,
                        result: match.result
                    });
                    this.log('Partido actualizado en Firebase', 'success');
                } catch (error) {
                    this.log(`Error actualizando Firebase: ${error.message}`, 'error');
                }
            }
            
            // Initialize evaluations if available
            if (window.UnifiedEvaluationSystem) {
                try {
                    await window.UnifiedEvaluationSystem.initializeEvaluations(match, 'manual');
                    this.log('✅ Evaluaciones generadas', 'success');
                    alert('✅ Partido finalizado. Evaluaciones enviadas a todos los jugadores.');
                } catch (error) {
                    this.log(`Error generando evaluaciones: ${error.message}`, 'error');
                    alert('✅ Partido finalizado (sin evaluaciones automáticas)');
                }
            } else {
                this.log('UnifiedEvaluationSystem no disponible', 'warning');
                alert('✅ Partido finalizado');
            }
            
            // Update our local history to mark as completed
            const matchIndex = this.matchHistory.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                this.matchHistory[matchIndex].result = { 
                    teamA: 0, 
                    teamB: 0,
                    finishedAt: new Date().toISOString()
                };
                this.matchHistory[matchIndex].status = 'completed';
            }
            
            // Refresh the display
            await this.displayMatchHistory();
            
            this.log('✅ Partido finalizado y evaluaciones generadas', 'success');
            
            // Navigate to evaluations and force render
            setTimeout(() => {
                this.showEvaluationsManually();
            }, 1000);
            
        } catch (error) {
            this.log(`❌ Error finalizando partido: ${error.message}`, 'error');
            alert(`Error finalizando partido: ${error.message}`);
            console.error('Error details:', error);
        }
    },

    // Show evaluations manually
    async showEvaluationsManually() {
        // Prevent multiple simultaneous calls
        if (this.isLoadingEvaluations) {
            return;
        }
        this.isLoadingEvaluations = true;
        
        this.log('Mostrando evaluaciones manualmente...', 'info');
        
        try {
            // Get evaluations directly from Firebase
            const db = firebase.firestore();
            const snapshot = await db.collection('evaluations').get();
            const evaluations = [];
            
            snapshot.forEach(doc => {
                evaluations.push({ id: doc.id, ...doc.data() });
            });
            
            this.log(`Encontradas ${evaluations.length} evaluaciones`, 'info');
            
            // Find the existing evaluations screen or section
            let container = document.getElementById('evaluations-section');
            if (!container) {
                // Try to find the evaluations screen
                container = document.getElementById('evaluations-screen');
                if (!container) {
                    this.log('No se encontró el contenedor de evaluaciones', 'error');
                    return;
                }
            }
            
            // Render evaluations manually
            if (evaluations.length === 0) {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h2>📊 Evaluaciones</h2>
                        <p>No hay evaluaciones generadas aún.</p>
                    </div>
                `;
            } else {
                // Get current user
                const currentUser = this.currentUser || window.AuthSystem?.currentUser;
                const currentUserId = currentUser?.uid || currentUser?.id;
                
                container.innerHTML = `
                    <div style="padding: 20px;">
                        <h2>📊 Evaluaciones Generadas</h2>
                        <div style="display: grid; gap: 15px; margin-top: 20px;">
                            ${evaluations.map(eval => {
                                // Check if current user has pending evaluations for this match
                                const userAssignment = currentUserId && eval.assignments ? eval.assignments[currentUserId] : null;
                                const hasPendingEvaluation = userAssignment && !userAssignment.completed;
                                
                                return `
                                <div style="
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    color: white;
                                    padding: 20px;
                                    border-radius: 12px;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                                ">
                                    <h3>⚽ ${eval.matchName || 'Partido'}</h3>
                                    <p>📅 ${new Date(eval.matchDate).toLocaleDateString()}</p>
                                    <p>🆔 ${eval.matchId}</p>
                                    <p>📊 Estado: ${eval.status}</p>
                                    <p>👥 ${Object.keys(eval.assignments || {}).length} asignaciones</p>
                                    
                                    ${hasPendingEvaluation ? `
                                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                                            <h4>🎯 Tienes evaluaciones pendientes</h4>
                                            <p>Debes evaluar a ${userAssignment.toEvaluate.length} compañeros:</p>
                                            <ul style="margin: 10px 0;">
                                                ${userAssignment.toEvaluate.map(player => `
                                                    <li>${player.name} (${player.position}) - OVR: ${player.ovr}</li>
                                                `).join('')}
                                            </ul>
                                            <button onclick="TestApp.startEvaluation('${eval.matchId}')" style="
                                                background: #28a745;
                                                color: white;
                                                border: none;
                                                padding: 10px 20px;
                                                border-radius: 5px;
                                                cursor: pointer;
                                                font-weight: bold;
                                                margin-top: 10px;
                                            ">
                                                ✅ Evaluar Ahora
                                            </button>
                                        </div>
                                    ` : userAssignment?.completed ? `
                                        <div style="background: rgba(40,167,69,0.2); padding: 10px; border-radius: 5px; margin-top: 10px;">
                                            ✅ Ya completaste tus evaluaciones
                                        </div>
                                    ` : ''}
                                    
                                    <details style="margin-top: 10px;">
                                        <summary style="cursor: pointer; font-weight: bold;">📊 Ver estadísticas del partido</summary>
                                        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                                <div>
                                                    <h4 style="margin: 0 0 10px 0; color: #e0e0e0;">⚽ Información del Partido</h4>
                                                    <p style="margin: 5px 0;"><strong>Tipo:</strong> ${eval.matchType === 'manual' ? 'Manual' : 'Colaborativo'}</p>
                                                    <p style="margin: 5px 0;"><strong>Estado:</strong> ${eval.status === 'pending' ? '⏳ Pendiente' : eval.status === 'completed' ? '✅ Completado' : eval.status}</p>
                                                    <p style="margin: 5px 0;"><strong>Participación:</strong> ${Math.round(eval.participationRate * 100)}%</p>
                                                </div>
                                                <div>
                                                    <h4 style="margin: 0 0 10px 0; color: #e0e0e0;">👥 Equipos</h4>
                                                    <p style="margin: 5px 0;"><strong>${eval.teamA?.name || 'Team A'}:</strong> ${eval.teamA?.players || 0} jugadores</p>
                                                    <p style="margin: 5px 0;"><strong>${eval.teamB?.name || 'Team B'}:</strong> ${eval.teamB?.players || 0} jugadores</p>
                                                    <p style="margin: 5px 0;"><strong>Total asignaciones:</strong> ${Object.keys(eval.assignments || {}).length}</p>
                                                </div>
                                            </div>
                                            
                                            <h4 style="margin: 15px 0 10px 0; color: #e0e0e0;">🎯 Estado de Evaluaciones</h4>
                                            <div style="display: grid; gap: 8px;">
                                                ${Object.entries(eval.assignments || {}).map(([playerId, assignment]) => {
                                                    const isCompleted = assignment.completed;
                                                    const completedCount = Object.keys(eval.completed || {}).length;
                                                    return `
                                                        <div style="
                                                            display: flex; 
                                                            justify-content: space-between; 
                                                            align-items: center;
                                                            padding: 8px 12px;
                                                            background: ${isCompleted ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 193, 7, 0.3)'};
                                                            border-radius: 5px;
                                                            border-left: 3px solid ${isCompleted ? '#28a745' : '#ffc107'};
                                                        ">
                                                            <span style="font-weight: bold;">${assignment.playerName || 'Jugador'}</span>
                                                            <span style="
                                                                background: ${isCompleted ? '#28a745' : '#ffc107'};
                                                                color: ${isCompleted ? 'white' : '#333'};
                                                                padding: 2px 8px;
                                                                border-radius: 12px;
                                                                font-size: 12px;
                                                                font-weight: bold;
                                                            ">
                                                                ${isCompleted ? '✅ Completado' : '⏳ Pendiente'}
                                                            </span>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                            
                                            ${eval.participationRate >= 0.8 && eval.ovrUpdateTriggered ? `
                                                <div style="
                                                    margin-top: 15px;
                                                    padding: 10px;
                                                    background: rgba(40, 167, 69, 0.2);
                                                    border: 1px solid #28a745;
                                                    border-radius: 5px;
                                                ">
                                                    <strong>🏆 ¡OVRs actualizados!</strong>
                                                    <br><small>Los ratings de los jugadores han sido actualizados basándose en las evaluaciones.</small>
                                                </div>
                                            ` : eval.participationRate >= 0.8 ? `
                                                <div style="
                                                    margin-top: 15px;
                                                    padding: 10px;
                                                    background: rgba(255, 193, 7, 0.2);
                                                    border: 1px solid #ffc107;
                                                    border-radius: 5px;
                                                ">
                                                    <strong>⚡ Listo para actualizar OVRs</strong>
                                                    <br><small>Se alcanzó el 80% de participación. Los OVRs se actualizarán pronto.</small>
                                                </div>
                                            ` : `
                                                <div style="
                                                    margin-top: 15px;
                                                    padding: 10px;
                                                    background: rgba(108, 117, 125, 0.2);
                                                    border: 1px solid #6c757d;
                                                    border-radius: 5px;
                                                ">
                                                    <strong>📈 Progreso de evaluaciones</strong>
                                                    <br><small>Se necesita 80% de participación para actualizar OVRs (actual: ${Math.round(eval.participationRate * 100)}%)</small>
                                                </div>
                                            `}
                                        </div>
                                    </details>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                `;
            }
            
        } catch (error) {
            this.log(`Error mostrando evaluaciones: ${error.message}`, 'error');
        } finally {
            this.isLoadingEvaluations = false;
        }
    },
    
    // Start evaluation process for a specific match
    async startEvaluation(matchId) {
        this.log(`Iniciando evaluación para partido: ${matchId}`, 'info');
        
        try {
            // Get current user
            const currentUser = this.currentUser || window.AuthSystem?.currentUser;
            const currentUserId = currentUser?.uid || currentUser?.id;
            
            if (!currentUserId) {
                alert('Por favor inicia sesión para evaluar');
                return;
            }
            
            // Get evaluation data
            const db = firebase.firestore();
            const evalDoc = await db.collection('evaluations').doc(matchId).get();
            
            if (!evalDoc.exists) {
                alert('No se encontró la evaluación');
                return;
            }
            
            const evalData = evalDoc.data();
            const userAssignment = evalData.assignments[currentUserId];
            
            if (!userAssignment) {
                alert('No tienes evaluaciones asignadas para este partido');
                return;
            }
            
            if (userAssignment.completed) {
                alert('Ya completaste tus evaluaciones para este partido');
                return;
            }
            
            // Show evaluation form
            this.showEvaluationForm(matchId, userAssignment.toEvaluate);
            
        } catch (error) {
            this.log(`Error iniciando evaluación: ${error.message}`, 'error');
            alert('Error al cargar la evaluación');
        }
    },
    
    // Show evaluation form for players
    showEvaluationForm(matchId, playersToEvaluate) {
        // Create modal for evaluation
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const evaluations = {};
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="color: #333; margin-bottom: 20px;">🎯 Evalúa a tus compañeros</h2>
                
                ${playersToEvaluate.map((player, index) => `
                    <div style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                    ">
                        <h3 style="color: #333;">
                            ${player.name} 
                            <span style="
                                background: #007bff;
                                color: white;
                                padding: 2px 8px;
                                border-radius: 4px;
                                font-size: 14px;
                                margin-left: 10px;
                            ">${player.position}</span>
                            <span style="
                                background: #6c757d;
                                color: white;
                                padding: 2px 8px;
                                border-radius: 4px;
                                font-size: 14px;
                                margin-left: 5px;
                            ">OVR: ${player.ovr}</span>
                        </h3>
                        
                        <div style="margin-top: 15px;">
                            <label style="display: block; color: #666; margin-bottom: 10px;">
                                Calificación (1-10):
                            </label>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value="5" 
                                id="rating-${player.id}"
                                style="width: 100%;"
                                oninput="document.getElementById('rating-value-${player.id}').textContent = this.value"
                            >
                            <div style="text-align: center; font-size: 24px; font-weight: bold; color: #007bff; margin-top: 10px;">
                                <span id="rating-value-${player.id}">5</span>/10
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <label style="display: block; color: #666; margin-bottom: 5px;">
                                Comentarios (opcional):
                            </label>
                            <textarea 
                                id="comment-${player.id}"
                                rows="3"
                                style="
                                    width: 100%;
                                    padding: 10px;
                                    border: 1px solid #ddd;
                                    border-radius: 5px;
                                    font-family: inherit;
                                "
                                placeholder="¿Cómo jugó ${player.name}?"
                            ></textarea>
                        </div>
                    </div>
                `).join('')}
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="TestApp.submitEvaluations('${matchId}')" style="
                        flex: 1;
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 5px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                    ">
                        ✅ Enviar Evaluaciones
                    </button>
                    <button onclick="document.querySelector('div[style*=\\"position: fixed\\"][style*=\\"z-index: 10000\\"]').remove()" style="
                        flex: 1;
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store players data for submission
        this.currentEvaluationPlayers = playersToEvaluate;
    },
    
    // Submit evaluations
    async submitEvaluations(matchId) {
        // Prevent double submission
        if (this.isSubmittingEvaluation) {
            return;
        }
        this.isSubmittingEvaluation = true;
        
        try {
            // Get current user
            const currentUser = this.currentUser || window.AuthSystem?.currentUser;
            const currentUserId = currentUser?.uid || currentUser?.id;
            
            if (!currentUserId || !this.currentEvaluationPlayers) {
                alert('Error: No se pudo obtener la información necesaria');
                this.isSubmittingEvaluation = false;
                return;
            }
            
            // Collect evaluations
            const evaluations = {};
            
            for (const player of this.currentEvaluationPlayers) {
                const rating = document.getElementById(`rating-${player.id}`).value;
                const comment = document.getElementById(`comment-${player.id}`).value;
                
                evaluations[player.id] = {
                    rating: parseInt(rating),
                    comment: comment,
                    evaluatedAt: Date.now()
                };
            }
            
            // Submit to UnifiedEvaluationSystem
            if (window.UnifiedEvaluationSystem) {
                const result = await window.UnifiedEvaluationSystem.submitEvaluation(
                    matchId, 
                    currentUserId, 
                    evaluations
                );
                
                if (result.success) {
                    // Close modal FIRST
                    const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
                    if (modal) {
                        modal.remove();
                    }
                    
                    // Show success message
                    alert(`✅ Evaluaciones enviadas exitosamente!\n\nTasa de participación: ${Math.round(result.participationRate * 100)}%`);
                    
                    // Clear stored players
                    this.currentEvaluationPlayers = null;
                    
                    // Refresh evaluations display after a short delay
                    setTimeout(() => {
                        this.showEvaluationsManually();
                    }, 500);
                } else {
                    alert('Error al enviar las evaluaciones');
                }
            } else {
                alert('Sistema de evaluaciones no disponible');
            }
            
        } catch (error) {
            console.error('Error submitting evaluations:', error);
            // Check if it's the "already evaluated" error
            if (error.message.includes('No tienes evaluaciones pendientes')) {
                // Close modal
                const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 10000"]');
                if (modal) {
                    modal.remove();
                }
                alert('Ya completaste las evaluaciones para este partido');
                // Refresh display
                this.showEvaluationsManually();
            } else {
                alert('Error al enviar las evaluaciones: ' + error.message);
            }
        } finally {
            this.isSubmittingEvaluation = false;
        }
    },
    
    // === EVALUATION SYSTEM V2 ===
    // Complete rebuild with dual system support
    
    // Performance tags for detailed evaluation
    performanceTags: {
        goleador: { 
            icon: '⚽', 
            label: 'Goleador', 
            points: { sho: 2 },
            description: '+2 Tiro'
        },
        asistencia: { 
            icon: '🎯', 
            label: 'Asistencia', 
            points: { pas: 2 },
            description: '+2 Pase'
        },
        velocidad: { 
            icon: '⚡', 
            label: 'Velocidad destacada', 
            points: { pac: 1 },
            description: '+1 Ritmo'
        },
        defensa: { 
            icon: '🛡️', 
            label: 'Defensa sólida', 
            points: { def: 2 },
            description: '+2 Defensa'
        },
        regate: { 
            icon: '✨', 
            label: 'Regate exitoso', 
            points: { dri: 1 },
            description: '+1 Regate'
        },
        liderazgo: { 
            icon: '👑', 
            label: 'Liderazgo', 
            points: { pas: 1 },
            description: '+1 Pase'
        },
        jugada_clave: { 
            icon: '🔑', 
            label: 'Jugada clave', 
            points: { dri: 1 },
            description: '+1 Regate'
        },
        atajada: { 
            icon: '🥅', 
            label: 'Atajada importante', 
            points: { def: 2 },
            description: '+2 Defensa'
        }
    },
    
    // Evaluation state
    activeEvaluation: null,
    evaluationMode: 'tags', // 'tags' or 'simple'
    
    /**
     * === EVALUATION SYSTEM - MAIN FUNCTIONS ===
     * Complete dual system: Tags (detailed) vs Simple (automatic)
     */
    
    // Load and display pending matches for evaluation
    async loadPendingMatches() {
        this.log('🔄 NEW FUNCTION: Loading pending matches for evaluation from futbol_matches...', 'info');
        
        try {
            // Load all matches from the new structure first
            await this.loadAllMatches();
            
            // Filter pending matches (not evaluated)
            const pendingMatches = this.matchHistory.filter(match => {
                // Check if match has been evaluated
                const isEvaluated = match.evaluation && match.evaluation.completed === true;
                const status = match.status || 'scheduled';
                
                return !isEvaluated && status !== 'evaluated' && status !== 'in_evaluation';
            });
            
            this.displayPendingMatches(pendingMatches);
            
            this.log(`Found ${pendingMatches.length} matches pending evaluation`, 'success');
            
        } catch (error) {
            this.log(`Error loading pending matches: ${error.message}`, 'error');
            document.getElementById('pending-matches-list').innerHTML = 
                '<p style="color: #e74c3c;">Error loading matches. Please try again.</p>';
        }
    },
    
    // Display pending matches in the UI
    displayPendingMatches(pendingMatches) {
        const container = document.getElementById('pending-matches-list');
        
        if (pendingMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>No hay Partidos Pendientes</h3>
                    <p>¡Crea algunos partidos primero en la sección <strong>Partidos</strong>!</p>
                    <button onclick="TestApp.navigateToScreen('matches')" 
                            style="background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-top: 10px;">
                        Ir a Partidos
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<h4>Selecciona un partido para evaluar:</h4>';
        
        pendingMatches.forEach(match => {
            // Use separate date and time fields if available
            const date = match.date || new Date(match.createdAt).toISOString().split('T')[0];
            const time = match.time || new Date(match.createdAt).toLocaleTimeString();
            const format = match.format || '5v5';
            
            html += `
                <div class="pending-match-item" style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f39c12; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #2c3e50;">
                                ${match.teamA.name} (${match.teamA.ovr}) vs ${match.teamB.name} (${match.teamB.ovr})
                            </div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                                📅 ${date} ${time} | ⚽ ${format} | ⚖️ Balance: ${match.difference} OVR | 📊 Status: ${match.status}
                            </div>
                            <div style="font-size: 12px; color: #888;">
                                Players: Team A (${match.teamA.players.length}) vs Team B (${match.teamB.players.length})
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <div style="background: #00ff9d; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
                                ✅ Sistema Automático de Evaluaciones Activo
                            </div>
                            <button onclick="TestApp.deleteMatchFromEvaluate('${match.id}')" 
                                    style="background: #e74c3c; color: white; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s;"
                                    onmouseover="this.style.background='#c0392b'"
                                    onmouseout="this.style.background='#e74c3c'"
                                    title="Eliminar partido">
                                🗑️ Borrar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // Delete match from evaluate section
    async deleteMatchFromEvaluate(matchId) {
        if (!confirm('⚠️ ¿Estás seguro de eliminar este partido?\n\nEsto eliminará el partido permanentemente de la base de datos.')) {
            return;
        }
        
        this.log(`Eliminando partido desde EVALUAR: ${matchId}`, 'info');
        
        try {
            // Delete from new Firebase structure
            if (db) {
                this.log(`🎯 Deleting from futbol_matches collection...`, 'info');
                await db.collection('futbol_matches').doc(matchId).delete();
                this.log(`✅ Partido eliminado de Firebase: ${matchId}`, 'success');
            } else {
                this.log('⚠️  No Firebase connection available', 'warning');
            }
            
            this.log('Partido eliminado exitosamente desde EVALUAR', 'success');
            
            // Reload pending matches to update the list
            await this.loadPendingMatches();
            
        } catch (error) {
            this.log(`Error eliminando partido: ${error.message}`, 'error');
            alert(`Error eliminando partido: ${error.message}`);
        }
    },
    
    /**
     * Start evaluation for a specific match
     * This is the main entry point for match evaluation
     */
    async startMatchEvaluation(matchId) {
        this.log(`🎯 Starting evaluation for match: ${matchId}`, 'info');
        
        try {
            const match = this.matchHistory.find(m => m.id === matchId);
            if (!match) {
                throw new Error('Partido no encontrado');
            }
            
            if (match.status === 'evaluated') {
                throw new Error('Este partido ya ha sido evaluado');
            }
            
            // Set up evaluation data
            this.currentEvaluation = {
                matchId: matchId,
                match: match,
                teamAScore: 0,
                teamBScore: 0,
                playerPerformances: {}
            };
            
            // Initialize player performances
            [...match.teamA.players, ...match.teamB.players].forEach(player => {
                this.currentEvaluation.playerPerformances[player.id] = {
                    playerId: player.id,
                    playerName: player.name,
                    rating: 5.0,
                    goals: 0,
                    tags: [],
                    notes: ''
                };
            });
            
            // Close any open modals
            this.closeMatchDetails();
            
            // Show evaluation form
            this.displayEvaluationForm();
            
        } catch (error) {
            this.log(`Error starting evaluation: ${error.message}`, 'error');
            alert(`Error: ${error.message}`);
        }
    },
    
    // Display evaluation form
    displayEvaluationForm() {
        const match = this.currentEvaluation.match;
        const date = new Date(match.createdAt).toLocaleDateString();
        
        const evaluationForm = document.getElementById('evaluation-form');
        const matchDetails = document.getElementById('match-details');
        const evaluationInputs = document.getElementById('evaluation-inputs');
        
        // Show match details
        matchDetails.innerHTML = `
            <div style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0;">${match.teamA.name} vs ${match.teamB.name}</h4>
                <p style="margin: 0; color: #666;">${date} | Balance: ${match.difference} OVR difference</p>
            </div>
        `;
        
        // Show evaluation inputs
        evaluationInputs.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <h4 style="background: #3498db; color: white; padding: 10px; margin: 0 0 10px 0; border-radius: 5px;">
                        ${match.teamA.name} Score
                    </h4>
                    <input type="number" id="team-a-score" min="0" max="20" value="0" 
                           style="width: 80px; padding: 10px; font-size: 18px; text-align: center; border: 2px solid #3498db; border-radius: 5px;">
                </div>
                <div style="text-align: center;">
                    <h4 style="background: #e74c3c; color: white; padding: 10px; margin: 0 0 10px 0; border-radius: 5px;">
                        ${match.teamB.name} Score
                    </h4>
                    <input type="number" id="team-b-score" min="0" max="20" value="0" 
                           style="width: 80px; padding: 10px; font-size: 18px; text-align: center; border: 2px solid #e74c3c; border-radius: 5px;">
                </div>
            </div>
            
            <!-- Evaluation System Selector -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; text-align: center;">Elegir Sistema de Evaluación</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <label style="display: flex; align-items: center; padding: 10px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s;" onclick="TestApp.selectEvaluationSystem('tags')">
                        <input type="radio" name="eval-system" value="tags" checked style="margin-right: 10px;">
                        <div>
                            <div style="font-weight: bold; color: #2c3e50;">🏷️ Sistema de Etiquetas (Detallado)</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">Control manual con etiquetas de rendimiento</div>
                        </div>
                    </label>
                    <label style="display: flex; align-items: center; padding: 10px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s;" onclick="TestApp.selectEvaluationSystem('rating')">
                        <input type="radio" name="eval-system" value="rating" style="margin-right: 10px;">
                        <div>
                            <div style="font-weight: bold; color: #2c3e50;">📊 Sistema de Calificación (Simple)</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">Distribución automática por posición</div>
                        </div>
                    </label>
                </div>
            </div>
            
            <div id="player-evaluations">
                <h4>Evaluación de Rendimiento de Jugadores</h4>
                <div id="players-evaluation-list"></div>
            </div>
        `;
        
        // Initialize evaluation system to default (tags)
        this.evaluationSystem = 'tags';
        
        // Show player evaluation forms with default system
        this.displayPlayerEvaluations();
        
        // Initialize radio buttons correctly
        setTimeout(() => {
            const radios = document.querySelectorAll('input[name="eval-system"]');
            radios.forEach(radio => {
                radio.checked = radio.value === 'tags';
                const label = radio.closest('label');
                if (radio.checked) {
                    label.style.borderColor = '#3498db';
                    label.style.backgroundColor = '#e8f4f8';
                } else {
                    label.style.borderColor = '#ddd';
                    label.style.backgroundColor = 'white';
                }
            });
        }, 100);
        
        // Show the evaluation form
        evaluationForm.style.display = 'block';
        
        // Hide pending matches list
        document.getElementById('pending-matches').style.display = 'none';
    },
    
    // Select evaluation system
    selectEvaluationSystem(system) {
        this.evaluationSystem = system;
        this.log(`Evaluation system changed to: ${system}`, 'info');
        
        // Update radio button selection
        const radios = document.querySelectorAll('input[name="eval-system"]');
        radios.forEach(radio => {
            radio.checked = radio.value === system;
            const label = radio.closest('label');
            if (radio.checked) {
                label.style.borderColor = '#3498db';
                label.style.backgroundColor = '#e8f4f8';
            } else {
                label.style.borderColor = '#ddd';
                label.style.backgroundColor = 'white';
            }
        });
        
        // Refresh player evaluation forms
        this.displayPlayerEvaluations();
    },
    
    // Display player evaluation forms
    displayPlayerEvaluations() {
        const container = document.getElementById('players-evaluation-list');
        const match = this.currentEvaluation.match;
        
        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h5 style="background: #3498db; color: white; padding: 8px; text-align: center; margin: 0 0 10px 0; border-radius: 5px;">
                        Jugadores ${match.teamA.name}
                    </h5>
                    ${match.teamA.players.map(player => 
                        this.evaluationSystem === 'tags' 
                            ? this.createTagsEvaluationCard(player, '#3498db')
                            : this.createRatingEvaluationCard(player, '#3498db')
                    ).join('')}
                </div>
                
                <div>
                    <h5 style="background: #e74c3c; color: white; padding: 8px; text-align: center; margin: 0 0 10px 0; border-radius: 5px;">
                        Jugadores ${match.teamB.name}
                    </h5>
                    ${match.teamB.players.map(player => 
                        this.evaluationSystem === 'tags'
                            ? this.createTagsEvaluationCard(player, '#e74c3c')
                            : this.createRatingEvaluationCard(player, '#e74c3c')
                    ).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Create tags evaluation card (detailed system)
    createTagsEvaluationCard(player, teamColor) {
        const photoHtml = player.photo 
            ? `<img src="${player.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
            : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                ${player.name.charAt(0)}
               </div>`;
        
        return `
            <div class="player-evaluation-card" style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid ${teamColor};">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    ${photoHtml}
                    <div style="margin-left: 10px;">
                        <div style="font-weight: bold;">${player.name}</div>
                        <div style="font-size: 12px; color: #666;">${player.position} | OVR: ${player.ovr}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Calificación (1-10):</label>
                        <input type="number" id="tags-rating-${player.id}" min="1" max="10" step="0.1" value="${this.currentEvaluation.playerPerformances[player.id].rating}" 
                               onchange="TestApp.updatePlayerRating('${player.id}', this.value)"
                               style="width: 60px; padding: 5px; text-align: center; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Goles:</label>
                        <input type="number" id="tags-goals-${player.id}" min="0" max="10" value="${this.currentEvaluation.playerPerformances[player.id].goals}" 
                               onchange="TestApp.updatePlayerGoals('${player.id}', this.value)"
                               style="width: 60px; padding: 5px; text-align: center; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Etiquetas de Rendimiento:</label>
                    <div class="performance-tags" style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${Object.keys(this.performanceTags).map(tagKey => `
                            <button type="button" class="tag-btn" data-tag="${tagKey}" data-player="${player.id}"
                                    onclick="TestApp.togglePerformanceTag('${player.id}', '${tagKey}')"
                                    style="padding: 3px 8px; border: 1px solid #ddd; background: white; border-radius: 15px; font-size: 10px; cursor: pointer;">
                                ${this.performanceTags[tagKey].icon} ${this.performanceTags[tagKey].label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Notas:</label>
                    <textarea id="tags-notes-${player.id}" placeholder="Notas adicionales..." 
                              onchange="TestApp.updatePlayerNotes('${player.id}', this.value)"
                              style="width: 100%; height: 50px; padding: 5px; border: 1px solid #ddd; border-radius: 3px; resize: vertical; font-size: 12px;">${this.currentEvaluation.playerPerformances[player.id].notes}</textarea>
                </div>
            </div>
        `;
    },
    
    // Create rating evaluation card (simple system)
    createRatingEvaluationCard(player, teamColor) {
        const photoHtml = player.photo 
            ? `<img src="${player.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
            : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                ${player.name.charAt(0)}
               </div>`;
        
        // Get position-specific improvement description
        const positionInfo = this.getPositionImprovementInfo(player.position);
        
        return `
            <div class="player-evaluation-card" style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid ${teamColor};">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    ${photoHtml}
                    <div style="margin-left: 10px;">
                        <div style="font-weight: bold;">${player.name}</div>
                        <div style="font-size: 12px; color: #666;">${player.position} | OVR: ${player.ovr}</div>
                    </div>
                </div>
                
                <div style="background: #e8f4f8; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                    <div style="font-size: 11px; color: #2980b9; font-weight: bold; margin-bottom: 5px;">📊 AUTO DISTRIBUTION FOR ${player.position}:</div>
                    <div style="font-size: 10px; color: #34495e;">${positionInfo}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Calificación General (1-10):</label>
                        <input type="number" id="simple-rating-${player.id}" min="1" max="10" step="0.1" value="${this.currentEvaluation.playerPerformances[player.id].rating}" 
                               onchange="TestApp.updatePlayerRating('${player.id}', this.value)"
                               style="width: 70px; padding: 8px; text-align: center; border: 2px solid #3498db; border-radius: 5px; font-size: 14px; font-weight: bold;">
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Goles Marcados:</label>
                        <input type="number" id="simple-goals-${player.id}" min="0" max="10" value="${this.currentEvaluation.playerPerformances[player.id].goals}" 
                               onchange="TestApp.updatePlayerGoals('${player.id}', this.value)"
                               style="width: 70px; padding: 8px; text-align: center; border: 2px solid #e74c3c; border-radius: 5px; font-size: 14px; font-weight: bold;">
                    </div>
                </div>
                
                <div>
                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Notas:</label>
                    <textarea id="simple-notes-${player.id}" placeholder="Notas adicionales sobre el rendimiento..." 
                              onchange="TestApp.updatePlayerNotes('${player.id}', this.value)"
                              style="width: 100%; height: 50px; padding: 5px; border: 1px solid #ddd; border-radius: 3px; resize: vertical; font-size: 12px;">${this.currentEvaluation.playerPerformances[player.id].notes}</textarea>
                </div>
            </div>
        `;
    },
    
    // Get position-specific improvement info
    getPositionImprovementInfo(position) {
        const distributions = {
            'POR': 'DEF (50%), PAS (20%), PHY (20%), DRI (10%)',
            'DEF': 'DEF (40%), PHY (30%), PAC (15%), PAS (15%)', 
            'MED': 'PAS (35%), DRI (25%), DEF (20%), PHY (20%)',
            'DEL': 'SHO (35%), PAC (25%), DRI (25%), PHY (15%)'
        };
        return distributions[position] || 'Distribución balanceada en todos los atributos';
    },
    
    // Update player rating
    updatePlayerRating(playerId, rating) {
        if (this.currentEvaluation && this.currentEvaluation.playerPerformances[playerId]) {
            this.currentEvaluation.playerPerformances[playerId].rating = parseFloat(rating);
            this.log(`Updated rating for player ${playerId}: ${rating}`, 'info');
        }
    },
    
    // Update player goals
    updatePlayerGoals(playerId, goals) {
        if (this.currentEvaluation && this.currentEvaluation.playerPerformances[playerId]) {
            this.currentEvaluation.playerPerformances[playerId].goals = parseInt(goals) || 0;
            this.log(`Updated goals for player ${playerId}: ${goals}`, 'info');
        }
    },
    
    // Update player notes
    updatePlayerNotes(playerId, notes) {
        if (this.currentEvaluation && this.currentEvaluation.playerPerformances[playerId]) {
            this.currentEvaluation.playerPerformances[playerId].notes = notes;
            this.log(`Updated notes for player ${playerId}`, 'info');
        }
    },
    
    // Toggle performance tag
    togglePerformanceTag(playerId, tagKey) {
        if (!this.currentEvaluation || !this.currentEvaluation.playerPerformances[playerId]) return;
        
        const performance = this.currentEvaluation.playerPerformances[playerId];
        const tagIndex = performance.tags.indexOf(tagKey);
        const button = document.querySelector(`[data-player="${playerId}"][data-tag="${tagKey}"]`);
        
        if (tagIndex === -1) {
            // Add tag
            performance.tags.push(tagKey);
            button.style.background = '#27ae60';
            button.style.color = 'white';
            button.style.borderColor = '#27ae60';
        } else {
            // Remove tag
            performance.tags.splice(tagIndex, 1);
            button.style.background = 'white';
            button.style.color = '#333';
            button.style.borderColor = '#ddd';
        }
        
        this.log(`Toggled tag ${tagKey} for player ${playerId}`, 'info');
    },
    
    // Submit evaluation
    async submitEvaluation() {
        if (!this.currentEvaluation) {
            alert('No hay evaluación en progreso');
            return;
        }
        
        this.log('Submitting match evaluation...', 'info');
        
        try {
            // Get scores
            const teamAScore = parseInt(document.getElementById('team-a-score').value) || 0;
            const teamBScore = parseInt(document.getElementById('team-b-score').value) || 0;
            
            // Update evaluation data
            this.currentEvaluation.teamAScore = teamAScore;
            this.currentEvaluation.teamBScore = teamBScore;
            this.currentEvaluation.evaluatedAt = new Date().toISOString();
            
            // Find and update the match
            const matchIndex = this.matchHistory.findIndex(m => m.id === this.currentEvaluation.matchId);
            if (matchIndex !== -1) {
                this.matchHistory[matchIndex].status = 'evaluated';
                this.matchHistory[matchIndex].teamA.score = teamAScore;
                this.matchHistory[matchIndex].teamB.score = teamBScore;
                this.matchHistory[matchIndex].evaluation = this.currentEvaluation;
                this.matchHistory[matchIndex].evaluatedAt = this.currentEvaluation.evaluatedAt;
            }
            
            // Apply performance improvements to players
            await this.applyPlayerImprovements();
            
            // Save to Storage if available - create clean copy to avoid circular references
            if (Storage && Storage.updateMatch) {
                const cleanMatchData = {
                    id: this.matchHistory[matchIndex].id,
                    status: 'evaluated',
                    format: this.matchHistory[matchIndex].format,
                    date: this.matchHistory[matchIndex].date,
                    time: this.matchHistory[matchIndex].time,
                    createdAt: this.matchHistory[matchIndex].createdAt,
                    createdBy: this.matchHistory[matchIndex].createdBy,
                    groupId: this.matchHistory[matchIndex].groupId,
                    teamA: {
                        name: this.matchHistory[matchIndex].teamA.name,
                        ovr: this.matchHistory[matchIndex].teamA.ovr,
                        totalOvr: this.matchHistory[matchIndex].teamA.totalOvr,
                        score: teamAScore,
                        players: this.matchHistory[matchIndex].teamA.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            position: p.position,
                            ovr: p.ovr,
                            attributes: { ...p.attributes }
                        }))
                    },
                    teamB: {
                        name: this.matchHistory[matchIndex].teamB.name,
                        ovr: this.matchHistory[matchIndex].teamB.ovr,
                        totalOvr: this.matchHistory[matchIndex].teamB.totalOvr,
                        score: teamBScore,
                        players: this.matchHistory[matchIndex].teamB.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            position: p.position,
                            ovr: p.ovr,
                            attributes: { ...p.attributes }
                        }))
                    },
                    difference: this.matchHistory[matchIndex].difference,
                    evaluation: {
                        completed: true,
                        evaluatedAt: this.currentEvaluation.evaluatedAt,
                        evaluatedBy: this.currentEvaluation.evaluatedBy || 'current_user',
                        goals: {
                            teamA: teamAScore,
                            teamB: teamBScore
                        },
                        notes: this.currentEvaluation.notes || '',
                        playerRatings: { ...this.currentEvaluation.playerRatings }
                    },
                    evaluatedAt: this.currentEvaluation.evaluatedAt
                };
                
                await Storage.updateMatch(cleanMatchData);
            }
            
            // Update display
            this.displayMatchHistory();
            
            this.log(`Evaluation saved - Final score: ${teamAScore}-${teamBScore}`, 'success');
            alert(`¡Evaluación del partido guardada!\nMarcador Final: ${teamAScore}-${teamBScore}`);
            
            // Reset and hide form
            this.cancelEvaluation();
            
        } catch (error) {
            this.log(`Error submitting evaluation: ${error.message}`, 'error');
            alert(`Error: ${error.message}`);
        }
    },
    
    // Apply player improvements based on performance
    async applyPlayerImprovements() {
        if (!this.currentEvaluation) return;
        
        for (const playerId in this.currentEvaluation.playerPerformances) {
            const performance = this.currentEvaluation.playerPerformances[playerId];
            const player = this.players.find(p => p.id === playerId);
            
            if (!player) continue;
            
            let improvements = { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
            let totalImprovement = 0;
            
            if (this.evaluationSystem === 'tags') {
                // TAGS SYSTEM - Manual control with performance tags
                
                // Apply performance tag bonuses
                performance.tags.forEach(tagKey => {
                    const tag = this.performanceTags[tagKey];
                    if (tag && tag.points) {
                        Object.keys(tag.points).forEach(attr => {
                            improvements[attr] += tag.points[attr];
                            totalImprovement += tag.points[attr];
                        });
                    }
                });
                
                // Apply rating-based improvement (smaller bonus)
                if (performance.rating >= 8.0) {
                    // Exceptional performance - small bonus to all attributes
                    Object.keys(improvements).forEach(attr => {
                        improvements[attr] += 1;
                    });
                    totalImprovement += 6;
                }
                
            } else if (this.evaluationSystem === 'rating') {
                // RATING SYSTEM - Automatic distribution by position
                
                const basePoints = Math.max(0, Math.round((performance.rating - 5.0) * 2)); // 5.0 = 0 points, 10.0 = 10 points
                
                if (basePoints > 0) {
                    improvements = this.distributePointsByPosition(player.position, basePoints);
                    totalImprovement = basePoints;
                }
            }
            
            // Apply goals bonus (for both systems)
            if (performance.goals > 0) {
                const goalsBonus = Math.min(performance.goals * 2, 8); // Max 8 points for goals
                improvements.sho += goalsBonus;
                totalImprovement += goalsBonus;
                this.log(`Goals bonus: +${goalsBonus} SHO for ${player.name} (${performance.goals} goals)`, 'info');
            }
            
            // Apply improvements to player
            if (totalImprovement > 0) {
                // Save original OVR if this is the first evaluation
                if (!player.hasBeenEvaluated) {
                    player.originalOVR = player.ovr;
                    player.hasBeenEvaluated = true;
                    this.log(`First evaluation for ${player.name} - Original OVR saved: ${player.originalOVR}`, 'info');
                }
                
                Object.keys(improvements).forEach(attr => {
                    if (improvements[attr] > 0 && player.attributes[attr]) {
                        player.attributes[attr] = Math.min(99, player.attributes[attr] + improvements[attr]);
                    }
                });
                
                // Recalculate OVR
                const oldOVR = player.ovr;
                player.ovr = this.calculatePositionBasedOVR(player.attributes, player.position);
                
                this.log(`${player.name} OVR change: ${oldOVR} → ${player.ovr} (Original: ${player.originalOVR || 'N/A'})`, 'info');
                
                // Update player in storage
                if (Storage && Storage.updatePlayer) {
                    await Storage.updatePlayer(player);
                }
                
                this.log(`Player updated: ${player.name} - New OVR: ${player.ovr}`, 'success');
                
                this.log(`Applied ${totalImprovement} improvement points to ${player.name} (${this.evaluationSystem} system)`, 'success');
            }
        }
        
        // Reload players to show updates
        await this.loadPlayers();
    },
    
    // Distribute points by position (for rating system)
    distributePointsByPosition(position, totalPoints) {
        const distributions = {
            'POR': { def: 0.5, pas: 0.2, phy: 0.2, dri: 0.1 },
            'DEF': { def: 0.4, phy: 0.3, pac: 0.15, pas: 0.15 },
            'MED': { pas: 0.35, dri: 0.25, def: 0.2, phy: 0.2 },
            'DEL': { sho: 0.35, pac: 0.25, dri: 0.25, phy: 0.15 }
        };
        
        const distribution = distributions[position] || { pac: 0.17, sho: 0.17, pas: 0.17, dri: 0.17, def: 0.16, phy: 0.16 };
        
        let improvements = { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
        
        Object.keys(distribution).forEach(attr => {
            improvements[attr] = Math.round(totalPoints * distribution[attr]);
        });
        
        return improvements;
    },
    
    // Calculate position-based OVR (duplicate of the form calculation)
    calculatePositionBasedOVR(attributes, position) {
        const { pac, sho, pas, dri, def, phy } = attributes;
        let ovr;
        
        switch(position) {
            case 'POR':
                ovr = Math.round((def * 0.5) + (pas * 0.2) + (phy * 0.2) + (dri * 0.1));
                break;
            case 'DEF':
                ovr = Math.round((def * 0.4) + (phy * 0.3) + (pac * 0.15) + (pas * 0.15));
                break;
            case 'MED':
                ovr = Math.round((pas * 0.35) + (dri * 0.25) + (def * 0.2) + (phy * 0.2));
                break;
            case 'DEL':
                ovr = Math.round((sho * 0.35) + (pac * 0.25) + (dri * 0.25) + (phy * 0.15));
                break;
            default:
                ovr = Math.round((pac + sho + pas + dri + def + phy) / 6);
        }
        
        return Math.min(99, Math.max(1, ovr));
    },
    
    // Cancel evaluation
    cancelEvaluation() {
        this.log('Cancelling evaluation...', 'info');
        
        // Reset evaluation data
        this.currentEvaluation = null;
        
        // Hide evaluation form
        document.getElementById('evaluation-form').style.display = 'none';
        
        // Show pending matches list
        document.getElementById('pending-matches').style.display = 'block';
        
        // Reload pending matches
        this.loadPendingMatches();
    },
    
    // Create test user
    async createTestUser() {
        this.log('Creating test user...', 'info');
        
        try {
            const userData = {
                name: `Test User ${Date.now()}`,
                email: `test${Date.now()}@test.com`
            };
            
            if (Storage && Storage.createPerson) {
                const user = await Storage.createPerson(userData);
                this.log(`Test user created: ${userData.name}`, 'success');
                alert(`Created: ${userData.name}`);
            }
        } catch (error) {
            this.log(`Error creating user: ${error.message}`, 'error');
        }
    },
    
    // List users
    async listUsers() {
        this.log('Listing users...', 'info');
        
        try {
            if (Storage && Storage.getPersons) {
                const users = Storage.getPersons();
                this.log(`Found ${users.length} users`, 'info');
                users.forEach(user => {
                    this.log(`- ${user.name} (${user.id})`, 'info');
                });
            }
        } catch (error) {
            this.log(`Error listing users: ${error.message}`, 'error');
        }
    },
    
    // Create test group
    async createTestGroup() {
        this.log('Creating test group...', 'info');
        
        try {
            const groupData = {
                name: `Test Group ${Date.now()}`,
                description: 'Test group for debugging'
            };
            
            if (Storage && Storage.createGroup) {
                const group = await Storage.createGroup(groupData);
                this.log(`Test group created: ${groupData.name}`, 'success');
                alert(`Created: ${groupData.name}`);
            }
        } catch (error) {
            this.log(`Error creating group: ${error.message}`, 'error');
        }
    },
    
    // List groups
    async listGroups() {
        this.log('Listing groups...', 'info');
        
        try {
            // Check Storage first
            if (Storage && Storage.getGroups) {
                const groups = Storage.getGroups();
                this.log(`Found ${groups.length} groups in Storage`, 'info');
                groups.forEach(group => {
                    const id = group.id || group.groupId || group._id;
                    this.log(`- ${group.name} (ID: ${id})`, 'info');
                });
            }
            
            // Also check Firebase directly
            if (db) {
                this.log('Checking Firebase groups...', 'info');
                const snapshot = await db.collection('groups').get();
                this.log(`Found ${snapshot.size} groups in Firebase`, 'info');
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.log(`- ${data.name} (Firebase ID: ${doc.id})`, 'info');
                    // Show all IDs this group might have
                    if (data.id && data.id !== doc.id) {
                        this.log(`  Alt ID: ${data.id}`, 'info');
                    }
                    if (data.groupId && data.groupId !== doc.id) {
                        this.log(`  Group ID field: ${data.groupId}`, 'info');
                    }
                });
            }
        } catch (error) {
            this.log(`Error listing groups: ${error.message}`, 'error');
        }
    },
    
    // Debug group by ID
    async debugGroupById(groupId) {
        this.log(`Debugging group ID: ${groupId}`, 'info');
        
        try {
            // Check Firebase
            if (db) {
                const doc = await db.collection('groups').doc(groupId).get();
                if (doc.exists) {
                    this.log('✅ Found in Firebase with doc ID', 'success');
                    this.log(JSON.stringify(doc.data(), null, 2), 'info');
                } else {
                    this.log('❌ Not found in Firebase with doc ID', 'error');
                    
                    // Search all groups
                    const snapshot = await db.collection('groups').get();
                    let found = false;
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.id === groupId || data.groupId === groupId) {
                            this.log(`✅ Found with Firebase doc ID: ${doc.id}`, 'success');
                            this.log(JSON.stringify(data, null, 2), 'info');
                            found = true;
                        }
                    });
                    
                    if (!found) {
                        this.log('❌ Not found anywhere in Firebase', 'error');
                    }
                }
            }
            
            // Check Storage
            if (Storage) {
                if (Storage.getGroupById) {
                    const group = Storage.getGroupById(groupId);
                    if (group) {
                        this.log('✅ Found in Storage.getGroupById', 'success');
                        this.log(JSON.stringify(group, null, 2), 'info');
                    } else {
                        this.log('❌ Not found in Storage.getGroupById', 'error');
                    }
                }
                
                if (Storage.getGroups) {
                    const groups = Storage.getGroups();
                    const found = groups.find(g => 
                        g.id === groupId || 
                        g.groupId === groupId ||
                        g._id === groupId
                    );
                    if (found) {
                        this.log('✅ Found in Storage.getGroups', 'success');
                        this.log(JSON.stringify(found, null, 2), 'info');
                    }
                }
            }
        } catch (error) {
            this.log(`Error debugging group: ${error.message}`, 'error');
        }
    },
    
    // Clear cache
    clearCache() {
        this.log('Clearing cache...', 'info');
        if (Storage) {
            Storage.cachedPlayers = [];
            Storage.cachedPersons = [];
            Storage.cachedMatches = [];
        }
        
        // Clear localStorage but preserve logout flag
        const loggedOut = localStorage.getItem('auth_logged_out');
        localStorage.clear();
        if (loggedOut) {
            localStorage.setItem('auth_logged_out', loggedOut);
        }
        
        // Clear sessionStorage completely
        sessionStorage.clear();
        
        this.log('Cache cleared', 'success');
        alert('Cache cleared - Please reload the page');
    },
    
    // Reload app
    reloadApp() {
        this.log('Reloading app...', 'info');
        location.reload();
    },
    
    // Log to console (debug console may be commented out in production)
    log(message, type = 'info') {
        const output = document.getElementById('console-output');
        
        // Only log to UI if debug console exists
        if (output) {
            const time = new Date().toLocaleTimeString();
            const p = document.createElement('p');
            p.className = type;
            p.textContent = `[${time}] ${message}`;
            output.appendChild(p);
            output.scrollTop = output.scrollHeight;
        }
        
        // Also log to browser console
        console.log(`[TestApp] ${message}`);
    },
    
    // OLD loadPendingMatches function removed - using new version at line 1693
    
    // OLD SIMPLE START EVALUATION - DEPRECATED 
    // This function has been replaced by startMatchEvaluation() with full dual system support
    // Keeping as fallback but should not be used
    startEvaluationOLD_DEPRECATED(matchId) {
        console.error('DEPRECATED: Use startMatchEvaluation instead');
        this.startMatchEvaluation(matchId);
    },
    
    // OLD SUBMIT EVALUATION - DEPRECATED
    // This function has been replaced by the full submitEvaluation() with dual system support
    // Redirects to the proper function
    async submitEvaluationOLD_DEPRECATED() {
        console.error('DEPRECATED: Using old submitEvaluation, redirecting to new one');
        await this.submitEvaluation();
    },
    
    // Cancel evaluation
    cancelEvaluation() {
        this.log('Evaluation cancelled', 'info');
        document.getElementById('evaluation-form').style.display = 'none';
        document.getElementById('pending-matches').style.display = 'block';
        this.currentMatchId = null;
    },
    
    // Clear console (only if debug console exists)
    clearConsole() {
        const output = document.getElementById('console-output');
        if (output) {
            output.innerHTML = '';
            this.log('Console cleared', 'info');
        }
    },

    // Profile Management Functions
    async loadProfile() {
        console.log('Loading user profile...');
        
        // Get current authenticated user
        let currentUser = null;
        
        if (window.AuthSystem && window.AuthSystem.currentUser) {
            currentUser = window.AuthSystem.currentUser;
        } else if (this.currentUser) {
            currentUser = this.currentUser;
        }
        
        if (!currentUser) {
            document.getElementById('profile-content').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p>No estás autenticado. Por favor inicia sesión.</p>
                </div>
            `;
            return;
        }
        
        // Update profile display
        document.getElementById('profile-name').textContent = currentUser.displayName || currentUser.name || 'Sin nombre';
        document.getElementById('profile-email').textContent = currentUser.email || 'Sin email';
        document.getElementById('profile-ovr').textContent = currentUser.ovr || 50;
        document.getElementById('profile-position').textContent = currentUser.position || 'MED';
        
        // Update attributes
        document.getElementById('profile-pac').textContent = currentUser.pac || 50;
        document.getElementById('profile-sho').textContent = currentUser.sho || 50;
        document.getElementById('profile-pas').textContent = currentUser.pas || 50;
        document.getElementById('profile-dri').textContent = currentUser.dri || 50;
        document.getElementById('profile-def').textContent = currentUser.def || 50;
        document.getElementById('profile-phy').textContent = currentUser.phy || 50;
        
        // Update photo
        const photoDisplay = document.getElementById('profile-photo-display');
        if (currentUser.photo && currentUser.photo.startsWith('data:')) {
            photoDisplay.innerHTML = `<img src="${currentUser.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else if (currentUser.photo && currentUser.photo.length <= 4) {
            photoDisplay.innerHTML = currentUser.photo;
        } else {
            photoDisplay.innerHTML = '👤';
        }
    },
    
    editProfile() {
        console.log('Entering profile edit mode...');
        
        // Get current user
        let currentUser = null;
        if (window.AuthSystem && window.AuthSystem.currentUser) {
            currentUser = window.AuthSystem.currentUser;
        } else if (this.currentUser) {
            currentUser = this.currentUser;
        }
        
        if (!currentUser) {
            alert('No estás autenticado');
            return;
        }
        
        // Fill form with current data
        document.getElementById('edit-profile-name').value = currentUser.displayName || currentUser.name || '';
        document.getElementById('edit-profile-position').value = currentUser.position || 'MED';
        
        // Show edit form, hide view
        document.getElementById('profile-view').style.display = 'none';
        document.getElementById('profile-edit').style.display = 'block';
    },
    
    cancelEditProfile() {
        // Hide edit form, show view
        document.getElementById('profile-edit').style.display = 'none';
        document.getElementById('profile-view').style.display = 'block';
        
        // Clear file input
        document.getElementById('edit-profile-image').value = '';
    },
    
    async saveProfile(event) {
        event.preventDefault();
        
        console.log('Saving profile...');
        
        // Get current user
        let currentUser = null;
        if (window.AuthSystem && window.AuthSystem.currentUser) {
            currentUser = window.AuthSystem.currentUser;
        } else if (this.currentUser) {
            currentUser = this.currentUser;
        }
        
        if (!currentUser) {
            alert('No estás autenticado');
            return;
        }
        
        const newName = document.getElementById('edit-profile-name').value.trim();
        const newPosition = document.getElementById('edit-profile-position').value;
        const imageFile = document.getElementById('edit-profile-image').files[0];
        
        try {
            // Process image if provided
            let newPhoto = currentUser.photo;
            if (imageFile) {
                // Check file size
                if (imageFile.size > 500 * 1024) {
                    alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 500KB.');
                    return;
                }
                
                // Convert to base64
                newPhoto = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            }
            
            // Calculate new OVR based on position
            const newOVR = this.calculateOVRForPosition(newPosition, {
                pac: currentUser.pac || 50,
                sho: currentUser.sho || 50,
                pas: currentUser.pas || 50,
                dri: currentUser.dri || 50,
                def: currentUser.def || 50,
                phy: currentUser.phy || 50
            });
            
            // Update in Firestore
            if (typeof db !== 'undefined' && db) {
                await db.collection('futbol_users').doc(currentUser.uid).update({
                    displayName: newName,
                    position: newPosition,
                    ovr: newOVR,
                    photo: newPhoto,
                    updatedAt: new Date().toISOString()
                });
                
                // Update local current user
                currentUser.displayName = newName;
                currentUser.name = newName;
                currentUser.position = newPosition;
                currentUser.ovr = newOVR;
                currentUser.photo = newPhoto;
                
                // Update AuthSystem current user
                if (window.AuthSystem) {
                    window.AuthSystem.currentUser = currentUser;
                }
                
                // Update TestApp current user
                this.currentUser = currentUser;
                
                // Update CollaborativeSystem
                if (window.collaborativeSystem) {
                    window.collaborativeSystem.setCurrentUser(currentUser);
                }
                
                // Update session storage with validation data
                const sessionData = {
                    ...currentUser,
                    timestamp: Date.now(),
                    deviceId: AuthSystem ? AuthSystem.getDeviceFingerprint() : null
                };
                
                if (AuthSystem && AuthSystem.USE_SESSION_STORAGE) {
                    sessionStorage.setItem('auth_current_session', JSON.stringify(sessionData));
                } else {
                    localStorage.setItem('auth_current_session', JSON.stringify(sessionData));
                }
                
                console.log('✅ Profile updated successfully');
                alert('Perfil actualizado exitosamente');
                
                // Reload profile display
                this.loadProfile();
                
                // Hide edit form
                this.cancelEditProfile();
                
                // Reload players list to reflect changes
                await this.loadPlayers();
                
                // Update header display
                const headerUserSpan = document.getElementById('current-user');
                if (headerUserSpan) {
                    headerUserSpan.textContent = newName;
                }
            } else {
                alert('Error: No hay conexión con la base de datos');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil: ' + error.message);
        }
    },
    
    calculateOVRForPosition(position, attributes) {
        // Position-based OVR calculation weights
        const weights = {
            'POR': { pac: 0.05, sho: 0.05, pas: 0.15, dri: 0.05, def: 0.35, phy: 0.35 },
            'DEF': { pac: 0.15, sho: 0.10, pas: 0.15, dri: 0.10, def: 0.30, phy: 0.20 },
            'MED': { pac: 0.15, sho: 0.15, pas: 0.25, dri: 0.20, def: 0.15, phy: 0.10 },
            'DEL': { pac: 0.20, sho: 0.30, pas: 0.10, dri: 0.25, def: 0.05, phy: 0.10 }
        };
        
        const w = weights[position] || weights['MED'];
        
        const ovr = Math.round(
            attributes.pac * w.pac +
            attributes.sho * w.sho +
            attributes.pas * w.pas +
            attributes.dri * w.dri +
            attributes.def * w.def +
            attributes.phy * w.phy
        );
        
        return ovr;
    }
};

// Make TestApp global
window.TestApp = TestApp;