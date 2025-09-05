/**
 * App Module - Main application controller
 * EXPANDED: Added support for Person and Group management flow
 */
const App = {
    // Application state
    state: {
        currentPlayerId: null,
        playerPhotoFile: null,
        personPhotoFile: null,
        currentScreen: 'register-screen',
        isSetupComplete: false,
        currentMatchForEvaluation: null,
        generatedTeams: null
    },

    /**
     * Initialize the application
     */
    async init() {
        // Inicializar UI primero
        UI.init();
        
        // Agregar validación de dependencias
        if (typeof Storage === 'undefined' || typeof Utils === 'undefined') {
            console.error('Dependencies not loaded properly');
            return;
        }
        
        // Initialize theme
        this.initializeTheme();
        
        // Check setup status and navigate appropriately
        await this.checkSetupStatus();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup form handlers
        this.setupFormHandlers();
        
        // Setup screen-specific handlers
        this.setupScreenHandlers();
        
        // Setup new handlers
        this.setupPersonHandlers();
        this.setupGroupHandlers();
        
        // Initialize Stats Controller
        if (typeof StatsController !== 'undefined') {
            StatsController.init();
        }
        
        console.log('Fútbol Stats v2.0 initialized successfully');
    },

    /**
     * Check setup status and navigate to appropriate screen
     */
    async checkSetupStatus() {
        // Check for remember me or active session
        const rememberMe = localStorage.getItem('futbol_stats_remember_me');
        const lastPersonId = localStorage.getItem('futbol_stats_last_person_id');
        
        if (rememberMe === 'true' && lastPersonId) {
            // Try to auto-login
            const person = Storage.getPersonById(lastPersonId);
            if (person) {
                Storage.setCurrentPerson(lastPersonId);
                const groups = Storage.getGroupsForPerson(lastPersonId);
                if (groups.length > 0) {
                    // Auto-select first group
                    Storage.setCurrentGroup(groups[0].id);
                    this.navigateToScreen('dashboard-screen');
                    this.loadDashboardScreen();
                    UI.showNotification(`¡Bienvenido de nuevo, ${person.name}!`, 'success');
                    return;
                }
            }
        }
        
        // No auto-login, show welcome screen
        this.navigateToScreen('welcome-screen');
        await this.loadWelcomeScreen();
    },

    /**
     * Load welcome/login screen
     */
    async loadWelcomeScreen() {
        try {
            // Load persons from Firebase first
            await Storage.loadPersonsFromFirebase();
            const persons = Storage.getPersons();
            
            const usersList = document.getElementById('existing-users-list');
            const noUsersMsg = document.getElementById('no-users-message');
            
            if (!usersList || !noUsersMsg) return;
            
            usersList.innerHTML = '';
            
            if (persons.length === 0) {
                noUsersMsg.style.display = 'block';
                usersList.style.display = 'none';
                console.log('No users found in Firebase');
            } else {
                noUsersMsg.style.display = 'none';
                usersList.style.display = 'grid';
                
                console.log('Found users:', persons.length);
                persons.forEach(person => {
                    const userCard = this.createUserLoginCard(person);
                    usersList.appendChild(userCard);
                });
            }
        } catch (error) {
            console.error('Error loading welcome screen:', error);
            // Fallback to showing no users message
            const noUsersMsg = document.getElementById('no-users-message');
            if (noUsersMsg) {
                noUsersMsg.style.display = 'block';
                noUsersMsg.textContent = 'Error al cargar usuarios. Verifica tu conexión.';
            }
        }
        
        this.setupWelcomeHandlers();
    },

    /**
     * Create user card for login selection
     */
    createUserLoginCard(person) {
        const card = document.createElement('div');
        card.className = 'user-login-card';
        card.dataset.personId = person.id;
        
        const lastLogin = person.lastLogin ? 
            `Último acceso: ${new Date(person.lastLogin).toLocaleDateString()}` : 
            'Primera vez';
        
        const avatarHtml = person.avatar ? 
            `<img src="${person.avatar}" alt="${person.name}">` :
            `<i class='bx bx-user-circle'></i>`;
        
        card.innerHTML = `
            <div class="user-avatar">
                ${avatarHtml}
            </div>
            <div class="user-info">
                <div class="user-name">${person.name}</div>
                <div class="user-email">${person.email}</div>
                <div class="user-last-login">${lastLogin}</div>
            </div>
            <button class="delete-user-btn" onclick="App.confirmDeleteUser('${person.id}')" title="Eliminar usuario">
                <i class='bx bx-x'></i>
            </button>
        `;
        
        // Add click handler for login
        card.addEventListener('click', async (e) => {
            if (!e.target.closest('.delete-user-btn')) {
                await this.loginAsPerson(person.id);
            }
        });
        
        return card;
    },

    /**
     * Setup welcome screen handlers
     */
    setupWelcomeHandlers() {
        const createBtn = document.getElementById('create-account-btn');
        const demoBtn = document.getElementById('demo-mode-btn');
        
        if (createBtn && !createBtn.hasListener) {
            createBtn.hasListener = true;
            createBtn.addEventListener('click', () => {
                this.navigateToScreen('person-setup-screen');
            });
        }
        
        if (demoBtn && !demoBtn.hasListener) {
            demoBtn.hasListener = true;
            demoBtn.addEventListener('click', () => {
                this.activateDemoMode();
            });
        }
    },

    /**
     * Login as existing person
     */
    async loginAsPerson(personId) {
        const person = Storage.getPersonById(personId);
        if (!person) {
            UI.showNotification('Usuario no encontrado', 'error');
            return;
        }
        
        // Clear cache on login to ensure fresh styles
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        // Force reload CSS with cache-busting parameter
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
        styleSheets.forEach(sheet => {
            const href = sheet.href;
            if (href && href.includes('styles.css')) {
                sheet.href = href.split('?')[0] + '?v=' + Date.now();
            }
        });
        
        // Update last login
        person.lastLogin = new Date().toISOString();
        Storage.updatePerson(person);
        
        // Set as current person
        Storage.setCurrentPerson(personId);
        
        // Save for remember me
        localStorage.setItem('futbol_stats_last_person_id', personId);
        localStorage.setItem('futbol_stats_remember_me', 'true');
        
        UI.showNotification(`¡Bienvenido de nuevo, ${person.name}!`, 'success');
        
        // Load groups from Firebase first
        await Storage.loadGroupsFromFirebase();
        
        // Check if person has groups
        const groups = Storage.getGroupsForPerson(personId);
        console.log('Groups found for person:', groups.length, groups);
        
        if (groups.length === 0) {
            console.log('No groups found, navigating to group setup');
            // No groups, go to group setup
            this.navigateToScreen('group-setup-screen');
        } else if (groups.length === 1) {
            // One group, auto-select it
            console.log('Auto-selecting group:', groups[0].id);
            Storage.setCurrentGroup(groups[0].id);
            this.state.isSetupComplete = true; // Mark setup as complete
            this.navigateToScreen('dashboard-screen');
            this.loadDashboardScreen();
        } else {
            console.log('Multiple groups, letting user choose');
            // Multiple groups, let user choose
            this.navigateToScreen('group-selector-screen');
            this.loadGroupSelectorScreen();
        }
    },

    /**
     * Confirm and delete a user account
     */
    confirmDeleteUser(personId) {
        const person = Storage.getPersonById(personId);
        if (!person) return;
        
        const confirmMsg = `¿Eliminar la cuenta de ${person.name}?\nSe eliminarán todos sus datos y grupos creados.`;
        
        if (confirm(confirmMsg)) {
            this.deleteUserAccount(personId);
        }
    },

    /**
     * Delete user account
     */
    deleteUserAccount(personId) {
        const success = Storage.deletePerson(personId);
        
        if (success) {
            UI.showNotification('Usuario eliminado correctamente', 'success');
            this.loadWelcomeScreen();
        } else {
            UI.showNotification('Error al eliminar usuario', 'error');
        }
    },

    /**
     * Activate demo mode
     */
    async activateDemoMode() {
        try {
            // Load persons from Firebase first
            await Storage.loadPersonsFromFirebase();
            
            // Create demo user if doesn't exist
            let demoUser = Storage.getPersons().find(p => p.email === 'demo@futbolstats.com');
        
        if (!demoUser) {
            demoUser = {
                id: Utils.generateId(),
                name: 'Usuario Demo',
                email: 'demo@futbolstats.com',
                phone: '',
                avatar: null,
                createdAt: new Date().toISOString()
            };
            Storage.addPerson(demoUser);
            
            // Create demo group
            const demoGroup = {
                id: Utils.generateId(),
                name: 'Grupo Demo',
                description: 'Grupo de demostración con datos de ejemplo',
                schedule: 'Todos los días',
                createdBy: demoUser.id,
                createdAt: new Date().toISOString(),
                isPrivate: false,
                maxMembers: 20,
                code: 'DEMO24'
            };
            Storage.addGroup(demoGroup);
            
            // Create membership
            Storage.addMembership({
                id: Utils.generateId(),
                personId: demoUser.id,
                groupId: demoGroup.id,
                role: 'owner',
                joinedAt: new Date().toISOString()
            });
            
            // Set current
            Storage.setCurrentPerson(demoUser.id);
            Storage.setCurrentGroup(demoGroup.id);
            
            // Generate demo players if needed
            const players = Storage.getPlayers();
            if (players.length === 0) {
                this.generateDemoPlayers(demoGroup.id);
            }
            
            // Mark setup as complete for demo mode
            this.state.isSetupComplete = true;
        } else {
            // Login as existing demo user
            await this.loginAsPerson(demoUser.id);
        }
        } catch (error) {
            console.error('Error activating demo mode:', error);
            UI.showNotification('Error al activar modo demo. Verifica tu conexión.', 'error');
        }
    },

    /**
     * Generate demo players
     */
    generateDemoPlayers(groupId) {
        const positions = ['POR', 'DEF', 'MED', 'DEL'];
        const names = [
            'Lionel Messi', 'Cristiano Ronaldo', 'Neymar Jr', 'Kylian Mbappé',
            'Erling Haaland', 'Kevin De Bruyne', 'Virgil van Dijk', 'Alisson Becker',
            'Robert Lewandowski', 'Mohamed Salah', 'Luka Modrić', 'Karim Benzema'
        ];
        
        names.forEach((name, index) => {
            const position = positions[index % 4];
            const player = {
                id: Utils.generateId(),
                name: name,
                position: position,
                photo: null,
                attributes: {
                    pac: 70 + Math.floor(Math.random() * 25),
                    sho: 70 + Math.floor(Math.random() * 25),
                    pas: 70 + Math.floor(Math.random() * 25),
                    dri: 70 + Math.floor(Math.random() * 25),
                    def: 70 + Math.floor(Math.random() * 25),
                    phy: 70 + Math.floor(Math.random() * 25)
                },
                ovr: 0,
                groupId: groupId,
                personId: Storage.getCurrentPerson()?.id,
                createdAt: new Date().toISOString()
            };
            
            player.ovr = Utils.calculateOvr(player.attributes);
            Storage.addPlayer(player);
        });
        
        UI.showNotification('Modo demo activado con jugadores de ejemplo', 'success');
        this.state.isSetupComplete = true; // Ensure setup is complete
        this.navigateToScreen('dashboard-screen');
        this.loadDashboardScreen();
    },

    /**
     * Migrate legacy data to group system
     */
    migrateLegacyData() {
        const currentGroup = Storage.getCurrentGroup();
        if (currentGroup) {
            Utils.migrateLegacyPlayers(currentGroup.id);
        }
    },

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        console.log('Setting up navigation, navItems found:', UI.elements.navItems?.length);
        if (!UI.elements.navItems) {
            console.error('NavItems not found!');
            return;
        }
        
        UI.elements.navItems.forEach((item, index) => {
            console.log(`Setting up nav item ${index}:`, item.dataset.screen);
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const screenId = item.dataset.screen;
                console.log('Navigation clicked:', screenId);
                await this.navigateToScreen(screenId);
            });
        });
    },

    /**
     * Navigate to specific screen with setup validation
     */
    async navigateToScreen(screenId) {
        console.log(`🔄 Navigating to: ${screenId}`);
        console.log(`📋 Setup complete: ${this.state.isSetupComplete}`);
        
        // COHERENCE GUARD: evita navegación redundante
        if (this.state.currentScreen === screenId) {
            console.log('⚠️ Same screen, skipping navigation');
            // still refresh context-sensitive data if needed
        }
        
        const mainScreens = ['dashboard-screen', 'register-screen', 'stats-screen', 'matches-screen', 'evaluate-screen', 'ranking-screen'];
        
        if (mainScreens.includes(screenId) && !this.state.isSetupComplete) {
            console.log('🚫 Setup incomplete, redirecting...');
            const validScreen = UI.getValidatedScreen();
            console.log(`📍 Redirecting to: ${validScreen}`);
            screenId = validScreen;
        }
        
        this.state.currentScreen = screenId;
        UI.changeScreen(screenId);
        
        // Load screen-specific data
        switch (screenId) {
            case 'dashboard-screen':
                this.loadDashboardScreen();
                break;
            case 'group-setup-screen':
                this.loadGroupSetupScreen();
                break;
            case 'group-selector-screen':
                this.loadGroupSelectorScreen();
                break;
            case 'stats-screen':
                await this.loadStatsScreen();
                break;
            case 'matches-screen':
                try {
                    console.log('🎯 Loading matches screen...');
                    await this.loadMatchesScreen();
                    console.log('✅ Matches screen loaded successfully');
                } catch (error) {
                    console.error('❌ Error loading matches screen:', error);
                    UI.showNotification('Error al cargar la sección de partidos', 'error');
                }
                break;
            case 'evaluate-screen':
                try {
                    console.log('📝 Loading evaluate screen...');
                    await this.loadEvaluateScreen();
                    console.log('✅ Evaluate screen loaded successfully');
                } catch (error) {
                    console.error('❌ Error loading evaluate screen:', error);
                    UI.showNotification('Error al cargar la sección de evaluación', 'error');
                }
                break;
            case 'ranking-screen':
                await this.loadRankingScreen();
                break;
        }
    },

    /**
     * Setup form event handlers
     */
    setupFormHandlers() {
        if (UI.elements.playerForm && !UI.elements.playerForm.hasSubmitListener) {
            UI.elements.playerForm.hasSubmitListener = true;
            UI.elements.playerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only handle if not already submitting
                if (!this.isSubmittingPlayer) {
                    this.handlePlayerSubmit(e);
                }
            }, { once: false, capture: true });
        }

        // Setup photo upload handlers with duplicate prevention
        if (UI.elements.playerPhoto && !UI.elements.playerPhoto.hasListener) {
            UI.elements.playerPhoto.hasListener = true;
            UI.elements.playerPhoto.addEventListener('change', (e) => {
                if (e.isTrusted) { // Only process real user events
                    this.handlePhotoUpload(e);
                }
            });
        }
        
        if (UI.elements.personPhoto && !UI.elements.personPhoto.hasListener) {
            UI.elements.personPhoto.hasListener = true;
            UI.elements.personPhoto.addEventListener('change', (e) => {
                if (e.isTrusted) { // Only process real user events
                    this.handlePersonPhotoUpload(e);
                }
            });
        }
    },

    /**
     * Setup screen-specific event handlers
     */
    setupScreenHandlers() {
        if (UI.elements.generateTeamsBtn) {
            UI.elements.generateTeamsBtn.addEventListener('click', () => {
                this.generateTeams();
            });
        }

        // Add listener for save match button
        const saveMatchBtn = document.getElementById('save-match-btn');
        if (saveMatchBtn) {
            saveMatchBtn.addEventListener('click', async () => {
                await this.saveGeneratedMatch();
            });
        }

        if (UI.elements.playerSelector) {
            UI.elements.playerSelector.addEventListener('change', (e) => {
                this.loadPlayerForEvaluation(e.target.value);
            });
        }

        if (UI.elements.saveEvaluation) {
            UI.elements.saveEvaluation.addEventListener('click', () => {
                this.savePlayerEvaluation();
            });
        }

        // NEW: Enhanced match management
        if (UI.elements.selectPlayersBtn) {
            UI.elements.selectPlayersBtn.addEventListener('click', () => {
                this.showPlayerSelection();
            });
        }

        // Initialize enhanced player selection
        UI.enhancePlayerSelection();

        if (UI.elements.generateSelectedTeamsBtn) {
            UI.elements.generateSelectedTeamsBtn.addEventListener('click', () => {
                this.generateTeamsFromSelected();
            });
        }

        if (UI.elements.saveMatchBtn) {
            UI.elements.saveMatchBtn.addEventListener('click', () => {
                this.saveScheduledMatch();
            });
        }
    },

    /**
     * Setup person-related event handlers
     */
    setupPersonHandlers() {
        if (UI.elements.personForm && !UI.elements.personForm.hasSubmitListener) {
            UI.elements.personForm.hasSubmitListener = true;
            UI.elements.personForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only handle if not already submitting
                if (!this.isSubmittingPerson) {
                    this.handlePersonSubmit(e);
                }
            }, { once: false, capture: true });
        }

        // Person menu button
        const personMenuBtn = document.getElementById('person-menu-btn');
        if (personMenuBtn) {
            personMenuBtn.addEventListener('click', () => {
                this.showPersonMenu();
            });
        }

        // Close person menu
        const closePersonMenu = document.getElementById('close-person-menu');
        if (closePersonMenu) {
            closePersonMenu.addEventListener('click', () => {
                this.hidePersonMenu();
            });
        }

        // Menu options
        const changeGroupBtn = document.getElementById('change-group-option');
        if (changeGroupBtn) {
            changeGroupBtn.addEventListener('click', () => {
                this.hidePersonMenu();
                this.navigateToScreen('group-selector-screen');
            });
        }

        const manageGroupsBtn = document.getElementById('manage-groups-option');
        if (manageGroupsBtn) {
            manageGroupsBtn.addEventListener('click', () => {
                this.hidePersonMenu();
                this.showGroupManagement();
            });
        }

        const importDataBtn = document.getElementById('import-data-option');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.handleImportData();
            });
        }

        const exportDataBtn = document.getElementById('export-data-option');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.handleExportData();
            });
        }

        const themeToggleBtn = document.getElementById('theme-toggle-option');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        const settingsBtn = document.getElementById('settings-option');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        const logoutBtn = document.getElementById('logout-option');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    },

    /**
     * Show person menu with current user data
     */
    showPersonMenu() {
        const modal = document.getElementById('person-menu-modal');
        if (!modal) return;

        const currentPerson = Storage.getCurrentPerson();
        if (!currentPerson) return;

        // Update person info
        const nameEl = document.getElementById('person-menu-name');
        const emailEl = document.getElementById('person-menu-email');
        const avatarEl = document.getElementById('person-menu-avatar');
        const memberSinceEl = document.getElementById('member-since');

        if (nameEl) nameEl.textContent = currentPerson.name;
        if (emailEl) emailEl.textContent = currentPerson.email;
        if (memberSinceEl) {
            const date = new Date(currentPerson.createdAt);
            memberSinceEl.textContent = `Miembro desde: ${date.toLocaleDateString()}`;
        }
        
        if (avatarEl && currentPerson.avatar) {
            avatarEl.innerHTML = `<img src="${currentPerson.avatar}" alt="${currentPerson.name}">`;
        }

        // Update stats
        const groups = Storage.getGroupsForPerson(currentPerson.id);
        const players = Storage.getPlayers();
        const matches = Storage.getMatches();

        const groupsEl = document.getElementById('total-groups');
        const playersEl = document.getElementById('total-players');
        const matchesEl = document.getElementById('total-matches');

        if (groupsEl) groupsEl.textContent = groups.length;
        if (playersEl) playersEl.textContent = players.length;
        if (matchesEl) matchesEl.textContent = matches.length;

        // Show modal
        modal.style.display = 'block';
        modal.classList.add('show');
    },

    /**
     * Hide person menu
     */
    hidePersonMenu() {
        const modal = document.getElementById('person-menu-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    },

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const body = document.body;
        const isCurrentlyDark = body.classList.contains('dark-theme');
        
        if (isCurrentlyDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            this.updateThemeIcon('light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            this.updateThemeIcon('dark');
        }
    },

    /**
     * Update theme icon and text
     */
    updateThemeIcon(theme) {
        const icon = document.getElementById('theme-icon');
        const text = document.getElementById('theme-text');
        
        if (icon) {
            icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
        }
        if (text) {
            text.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
        }
    },

    /**
     * Initialize theme from localStorage
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        this.updateThemeIcon(savedTheme);
    },

    /**
     * Handle data import
     */
    handleImportData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (!data.version || !data.timestamp) {
                        throw new Error('Formato de archivo inválido');
                    }
                    
                    // Import data
                    if (confirm('¿Estás seguro de importar estos datos? Esto sobrescribirá los datos actuales.')) {
                        Storage.importData(data);
                        UI.showNotification('Datos importados exitosamente', 'success');
                        
                        // Reload app
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    UI.showNotification('Error al importar datos: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
        this.hidePersonMenu();
    },

    /**
     * Show settings panel
     */
    showSettings() {
        this.hidePersonMenu();
        // TODO: Implement settings panel
        UI.showNotification('Panel de configuración próximamente', 'info');
    },

    /**
     * Show group management
     */
    showGroupManagement() {
        // TODO: Implement group management screen
        UI.showNotification('Gestión de grupos próximamente', 'info');
    },

    /**
     * Setup group-related event handlers
     */
    setupGroupHandlers() {
        if (UI.elements.groupForm) {
            UI.elements.groupForm.addEventListener('submit', (e) => {
                this.handleGroupSubmit(e);
            });
        }

        if (UI.elements.searchGroup) {
            UI.elements.searchGroup.addEventListener('click', () => {
                this.handleSearchGroup();
            });
        }

        if (UI.elements.joinGroupBtn) {
            UI.elements.joinGroupBtn.addEventListener('click', () => {
                this.handleJoinGroup();
            });
        }

        if (UI.elements.createAnotherGroup) {
            UI.elements.createAnotherGroup.addEventListener('click', () => {
                this.navigateToScreen('create-group-screen');
            });
        }

        if (UI.elements.joinAnotherGroup) {
            UI.elements.joinAnotherGroup.addEventListener('click', () => {
                this.navigateToScreen('join-group-screen');
            });
        }
    },

    /**
     * Handle photo upload - Enhanced with Supabase Storage
     */
    async handlePhotoUpload(e) {
        console.log('🔍 handlePhotoUpload called', {
            isTrusted: e.isTrusted,
            files: e.target.files.length,
            timestamp: new Date().toISOString()
        });
        
        // Prevent duplicate processing
        const now = Date.now();
        if (this.lastPhotoUploadTime && (now - this.lastPhotoUploadTime) < 500) {
            console.log('⚠️ Duplicate photo upload prevented (too fast)');
            return;
        }
        this.lastPhotoUploadTime = now;
        
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Check if we already processed this file
        if (this.lastProcessedFile === file.name + file.size + file.lastModified) {
            console.log('⚠️ Same file already processed');
            return;
        }
        this.lastProcessedFile = file.name + file.size + file.lastModified;

        if (!Utils.isValidImageFile(file)) {
            UI.showNotification('Por favor selecciona una imagen válida (JPG, PNG, GIF, WebP) menor a 10MB.', 'error');
            return;
        }

        try {
            this.state.playerPhotoFile = file;
            
            // Show loading state
            UI.showNotification('Procesando imagen...', 'info');
            
            // For preview, always use base64 to avoid uploading twice
            const previewUrl = await Utils.fileToBase64(file);
            console.log('📷 Image converted to base64 for preview');
            
            const img = `<img src="${previewUrl}" alt="Player photo">`;
            if (UI.elements.photoPreview) {
                UI.elements.photoPreview.innerHTML = img;
            }
            if (UI.elements.previewPhoto) {
                UI.elements.previewPhoto.innerHTML = img;
            }
            
            UI.showNotification('Imagen lista para subir', 'success');
            
        } catch (error) {
            console.error('Error processing image:', error);
            UI.showNotification('Error al procesar la imagen.', 'error');
        }
    },

    /**
     * Handle person registration
     */
    async handlePersonSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        // Prevent double submission
        if (this.isSubmittingPerson) {
            console.log('⚠️ Person submission already in progress');
            return;
        }
        this.isSubmittingPerson = true;
        
        if (!UI.elements.personName || !UI.elements.personEmail) {
            UI.showNotification('Formulario de persona no disponible.', 'error');
            this.isSubmittingPerson = false;
            return;
        }
        
        const personName = UI.elements.personName.value.trim();
        const personEmail = UI.elements.personEmail.value.trim();
        const personPhone = UI.elements.personPhone ? UI.elements.personPhone.value.trim() : '';
        
        UI.showLoading();

        try {
            const person = {
                id: Utils.generateId(),
                name: Utils.sanitizeText(personName),
                email: personEmail.toLowerCase(),
                phone: personPhone || null,
                createdAt: new Date().toISOString()
            };

            const validation = Utils.validatePerson(person);
            if (!validation.isValid) {
                UI.showNotification(validation.errors[0], 'error');
                UI.hideLoading();
                return;
            }

            if (Storage.personNameExists(person.name)) {
                UI.showNotification('Ya existe una persona con ese nombre.', 'error');
                UI.hideLoading();
                return;
            }

            if (this.state.personPhotoFile) {
                if (!Utils.isValidImageFile(this.state.personPhotoFile)) {
                    UI.showNotification('Formato de imagen no válido o archivo muy grande.', 'error');
                    UI.hideLoading();
                    return;
                }
                
                // Upload to Supabase when saving
                if (window.SupabaseStorage && SupabaseStorage.isReady) {
                    try {
                        const personId = person.id || 'person-' + Date.now();
                        person.avatar = await SupabaseStorage.uploadPersonAvatar(personId, this.state.personPhotoFile);
                        console.log('👤 Person avatar uploaded to Supabase:', person.avatar);
                    } catch (uploadError) {
                        console.warn('Failed to upload avatar to Supabase, using base64:', uploadError);
                        person.avatar = await Utils.fileToBase64(this.state.personPhotoFile);
                    }
                } else {
                    person.avatar = await Utils.fileToBase64(this.state.personPhotoFile);
                    console.log('👤 Using base64 avatar (no Supabase)');
                }
            }

            const success = Storage.addPerson(person);
            
            if (success) {
                Storage.setCurrentPerson(person.id);
                UI.showNotification(`¡Bienvenido ${person.name}!`, 'success');
                UI.resetPersonForm();
                this.state.personPhotoFile = null;
                this.state.personAvatarUrl = null;
                this.lastProcessedPersonFile = null; // Clear to allow new files
                
                setTimeout(() => {
                    this.navigateToScreen('group-setup-screen');
                }, 1500);
            } else {
                UI.showNotification('Error al crear el perfil. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error creating person:', error);
            UI.showNotification('Error inesperado. Inténtalo de nuevo.', 'error');
        } finally {
            UI.hideLoading();
            this.isSubmittingPerson = false; // Reset flag after completion
        }
    },

    /**
     * Handle player form submission with group context
     */
    async handlePlayerSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        console.log('🔍 handlePlayerSubmit called', {
            timestamp: new Date().toISOString(),
            isSubmitting: this.isSubmittingPlayer
        });
        
        // Prevent double submission
        if (this.isSubmittingPlayer) {
            console.log('⚠️ Player submission already in progress');
            return;
        }
        this.isSubmittingPlayer = true;

        // COHERENCE GUARD: Evita fallo si Utils.hasGroupContext no existe.
        const hasCtx = (typeof Utils !== 'undefined' && typeof Utils.hasGroupContext === 'function')
            ? Utils.hasGroupContext()
            : !!Storage.getCurrentGroup();

        if (!hasCtx) {
            UI.showNotification('Debe seleccionar un grupo activo para agregar jugadores.', 'error');
            this.navigateToScreen('group-selector-screen');
            return;
        }
        
        const playerName = UI.elements.playerName.value.trim();
        const playerPosition = UI.elements.playerPosition.value;
        const attributes = {
            pac: parseInt(document.getElementById('pac').value),
            sho: parseInt(document.getElementById('sho').value),
            pas: parseInt(document.getElementById('pas').value),
            dri: parseInt(document.getElementById('dri').value),
            def: parseInt(document.getElementById('def').value),
            phy: parseInt(document.getElementById('phy').value)
        };
        
        // Validar usando el nuevo sistema
        const existingPlayers = Storage.getPlayers() || [];
        const validations = [
            () => FormValidator.validatePlayerName(playerName, existingPlayers),
            () => FormValidator.validatePosition(playerPosition),
            () => FormValidator.validatePlayerAttributes(attributes)
        ];
        
        const validationResult = FormValidator.validateForm('player-form', validations);
        if (!validationResult.valid) {
            this.isSubmittingPlayer = false;
            return;
        }

        UI.showLoading();

        try {
            const currentGroup = Storage.getCurrentGroup();
            const player = {
                id: Utils.generateId(),
                name: playerName,
                position: playerPosition,
                attributes: attributes,
                groupId: currentGroup ? currentGroup.id : Storage.currentGroupId,
                createdAt: new Date().toISOString()
            };

            player.ovr = Utils.calculateOvr(player.attributes);

            if (this.state.playerPhotoFile) {
                if (!Utils.isValidImageFile(this.state.playerPhotoFile)) {
                    UI.showNotification('Formato de imagen no válido o archivo muy grande.', 'error');
                    UI.hideLoading();
                    return;
                }
                
                // Upload to Supabase when saving
                if (window.SupabaseStorage && SupabaseStorage.isReady) {
                    try {
                        const playerId = player.id || 'player-' + Date.now();
                        player.photo = await SupabaseStorage.uploadPlayerPhoto(playerId, this.state.playerPhotoFile);
                        console.log('📷 Player photo uploaded to Supabase:', player.photo);
                    } catch (uploadError) {
                        console.warn('Failed to upload to Supabase, using base64:', uploadError);
                        player.photo = await Utils.fileToBase64(this.state.playerPhotoFile);
                    }
                } else {
                    player.photo = await Utils.fileToBase64(this.state.playerPhotoFile);
                    console.log('📷 Using base64 photo (no Supabase)');
                }
            }

            const success = await Storage.addPlayer(player);
            
            if (success) {
                // Feedback visual en el formulario
                const form = document.getElementById('player-form');
                if (form) {
                    UIHelpers.animateSuccess(form);
                }
                
                // Toast con acciones
                UIHelpers.showToast(
                    `¡${player.name} registrado correctamente!`,
                    'success',
                    5000,
                    [
                        {
                            text: 'Agregar Otro',
                            callback: () => {
                                UI.resetForm();
                                document.getElementById('player-name')?.focus();
                            }
                        },
                        {
                            text: 'Ver Estadísticas',
                            callback: () => this.navigateToScreen('stats-screen')
                        }
                    ]
                );
                
                // Clear state before resetting form
                this.state.playerPhotoFile = null;
                this.state.playerPhotoUrl = null;
                this.lastProcessedFile = null; // Clear to allow new files
                
                // Reset form after showing success feedback
                setTimeout(() => {
                    UI.resetForm();
                }, 2000);
                
                // Auto-navigation después de mostrar feedback
                setTimeout(async () => {
                    await this.navigateToScreen('stats-screen');
                }, 5000);
            } else {
                UI.showNotification('Error al guardar el jugador. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error creating player:', error);
            UI.showNotification(error.message || 'Error inesperado. Inténtalo de nuevo.', 'error');
        } finally {
            UI.hideLoading();
            this.isSubmittingPlayer = false; // Reset flag after completion
        }
    },

    /**
     * Handle group creation
     */
    async handleGroupSubmit(e) {
        e.preventDefault();
        
        if (!UI.elements.groupName || !UI.elements.groupDescription || !UI.elements.groupSchedule) {
            UI.showNotification('Formulario de grupo incompleto.', 'error');
            return;
        }
        
        const groupName = UI.elements.groupName.value.trim();
        const groupDescription = UI.elements.groupDescription.value.trim();
        const groupSchedule = UI.elements.groupSchedule.value.trim();
        const groupMaxMembers = UI.elements.groupMaxMembers ? parseInt(UI.elements.groupMaxMembers.value) : 20;
        const groupPrivate = UI.elements.groupPrivate ? UI.elements.groupPrivate.checked : false;
        
        UI.showLoading();

        try {
            const currentPerson = Storage.getCurrentPerson();
            if (!currentPerson) {
                throw new Error('No hay persona activa');
            }

            const group = {
                id: Utils.generateId(),
                name: Utils.sanitizeText(groupName),
                description: Utils.sanitizeText(groupDescription),
                schedule: Utils.sanitizeText(groupSchedule),
                createdBy: currentPerson.id,
                createdAt: new Date().toISOString(),
                isPrivate: groupPrivate,
                maxMembers: groupMaxMembers,
                code: Utils.generateGroupCode()
            };

            const validation = Utils.validateGroup(group);
            if (!validation.isValid) {
                UI.showNotification(validation.errors[0], 'error');
                UI.hideLoading();
                return;
            }

            if (Storage.groupNameExists(group.name)) {
                UI.showNotification('Ya existe un grupo con ese nombre.', 'error');
                UI.hideLoading();
                return;
            }

            const groupSuccess = Storage.addGroup(group);
            
            if (groupSuccess) {
                const membership = {
                    id: Utils.generateId(),
                    personId: currentPerson.id,
                    groupId: group.id,
                    role: 'owner',
                    joinedAt: new Date().toISOString()
                };
                
                const membershipSuccess = Storage.addMembership(membership);
                
                if (membershipSuccess) {
                    Storage.setCurrentGroup(group.id);
                    
                    UI.showNotification(`Grupo "${group.name}" creado exitosamente. Código: ${group.code}`, 'success');
                    UI.resetGroupForm();
                    
                    this.state.isSetupComplete = true;
                    
                    setTimeout(() => {
                        this.navigateToScreen('register-screen');
                    }, 2000);
                } else {
                    UI.showNotification('Error al unirse al grupo.', 'error');
                }
            } else {
                UI.showNotification('Error al crear el grupo. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error creating group:', error);
            UI.showNotification('Error inesperado. Inténtalo de nuevo.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Handle group search by code
     */
    handleSearchGroup() {
        if (!UI.elements.groupCode) {
            UI.showNotification('Campo de código no disponible.', 'error');
            return;
        }
        const code = UI.elements.groupCode.value.trim();
        
        if (!code) {
            UI.showNotification('Ingresa un código de grupo.', 'warning');
            return;
        }
        
        if (code.length !== 6) {
            UI.showNotification('El código debe tener 6 caracteres.', 'warning');
            return;
        }
        
        const group = UI.findGroupByCode(code);
        
        if (group) {
            const currentPerson = Storage.getCurrentPerson();
            if (Storage.isPersonInGroup(currentPerson.id, group.id)) {
                UI.showNotification('Ya eres miembro de este grupo.', 'warning');
                return;
            }
            
            UI.showGroupPreview(group);
        } else {
            UI.hideGroupPreview();
            UI.showNotification('No se encontró ningún grupo con ese código.', 'error');
        }
    },

    /**
     * Handle joining a group
     */
    async handleJoinGroup() {
        if (!UI.elements.groupCode) {
            UI.showNotification('Campo de código no disponible.', 'error');
            return;
        }
        const code = UI.elements.groupCode.value.trim();
        const group = UI.findGroupByCode(code);
        
        if (!group) {
            UI.showNotification('Grupo no encontrado.', 'error');
            return;
        }
        
        UI.showLoading();

        try {
            const currentPerson = Storage.getCurrentPerson();
            
            const currentMembers = Storage.getPersonsInGroup(group.id).length;
            if (currentMembers >= group.maxMembers) {
                UI.showNotification('El grupo ha alcanzado su límite de miembros.', 'error');
                UI.hideLoading();
                return;
            }
            
            const membership = {
                id: Utils.generateId(),
                personId: currentPerson.id,
                groupId: group.id,
                role: 'member',
                joinedAt: new Date().toISOString()
            };
            
            const success = Storage.addMembership(membership);
            
            if (success) {
                Storage.setCurrentGroup(group.id);
                
                UI.showNotification(`Te has unido al grupo "${group.name}" exitosamente.`, 'success');
                UI.resetJoinGroupForm();
                
                this.state.isSetupComplete = true;
                
                setTimeout(() => {
                    this.navigateToScreen('register-screen');
                }, 2000);
            } else {
                UI.showNotification('Error al unirse al grupo.', 'error');
            }

        } catch (error) {
            console.error('Error joining group:', error);
            UI.showNotification('Error inesperado.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load group setup screen
     */
    loadGroupSetupScreen() {
        const currentPerson = Storage.getCurrentPerson();
        if (currentPerson) {
            UI.updatePersonGreeting(currentPerson);
        }
    },

    /**
     * Load group selector screen
     */
    loadGroupSelectorScreen() {
        const currentPerson = Storage.getCurrentPerson();
        if (!currentPerson) {
            this.navigateToScreen('person-setup-screen');
            return;
        }
        
        const userGroups = Storage.getGroupsForPerson(currentPerson.id);
        
        UI.displayGroups(userGroups, (selectedGroup) => {
            Storage.setCurrentGroup(selectedGroup.id);
            this.state.isSetupComplete = true; // Mark setup as complete when group is selected
            UI.updateGroupContextHeaders();
            this.navigateToScreen('dashboard-screen');
            this.loadDashboardScreen();
        });
    },

    /**
     * Load stats screen data with edit mode support
     */
    async loadStatsScreen() {
        UI.showLoading();
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const players = Storage.getPlayers();
            const editMode = document.body.classList.contains('edit-mode');
            UI.displayPlayers(players, editMode);
            
            // Setup edit mode handlers
            this.setupEditModeHandlers();
            
        } catch (error) {
            console.error('Error loading players:', error);
            UI.showNotification('Error al cargar los jugadores.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Setup edit mode handlers for player management
     */
    setupEditModeHandlers() {
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const deleteBtn = document.getElementById('delete-selected-btn');
        
        if (toggleBtn && !toggleBtn.hasListener) {
            toggleBtn.hasListener = true;
            toggleBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }
        
        if (deleteBtn && !deleteBtn.hasListener) {
            deleteBtn.hasListener = true;
            deleteBtn.addEventListener('click', () => {
                this.deleteSelectedPlayers();
            });
        }
    },

    /**
     * Toggle edit mode for player management
     */
    toggleEditMode() {
        const body = document.body;
        const isEditMode = body.classList.toggle('edit-mode');
        
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const deleteBtn = document.getElementById('delete-selected-btn');
        
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isEditMode ? 'bx bx-x' : 'bx bx-edit';
            }
            toggleBtn.title = isEditMode ? 'Salir de edición' : 'Modo edición';
        }
        
        if (deleteBtn) {
            deleteBtn.style.display = isEditMode ? 'inline-flex' : 'none';
        }
        
        // Reload players with new mode
        const players = Storage.getPlayers();
        UI.displayPlayers(players, isEditMode);
        
        if (isEditMode) {
            UI.showNotification('Modo edición activado. Selecciona jugadores para eliminar.', 'info');
        }
    },

    /**
     * Confirm and delete a single player
     */
    confirmDeletePlayer(playerId) {
        const player = Storage.getPlayerById(playerId);
        if (!player) return;
        
        // Usar el nuevo sistema de confirmación
        UIHelpers.confirmDelete(
            player.name,
            () => {
                this.deletePlayer(playerId);
            }
        );
    },

    /**
     * Delete a single player
     */
    async deletePlayer(playerId) {
        const player = Storage.getPlayerById(playerId);
        if (!player) return;
        
        // Mostrar loading
        UI.showLoading('Eliminando jugador...');
        
        try {
            // Encontrar el elemento del jugador para animación
            const playerElement = document.querySelector(`[data-player-id="${playerId}"]`);
            
            // Animación de salida
            if (playerElement) {
                playerElement.style.transition = 'all 0.3s ease-out';
                playerElement.style.transform = 'translateX(-100%)';
                playerElement.style.opacity = '0';
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const success = await Storage.deletePlayer(playerId);
            
            if (success) {
                // Toast con opción de deshacer (si es posible implementar)
                UIHelpers.showToast(
                    `${player.name} eliminado correctamente`,
                    'success',
                    4000,
                    [{
                        text: 'Ver Lista',
                        callback: () => this.navigateToScreen('list-screen')
                    }]
                );
                
                // Reload players
                const players = Storage.getPlayers();
                const editMode = document.body.classList.contains('edit-mode');
                UI.displayPlayers(players, editMode);
                
            } else {
                UI.showNotification('Error al eliminar el jugador.', 'error');
            }
            
        } catch (error) {
            console.error('Error deleting player:', error);
            handleError(error, 'player_deletion');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Delete selected players in bulk
     */
    deleteSelectedPlayers() {
        const checkboxes = document.querySelectorAll('.delete-checkbox input:checked');
        const playerIds = Array.from(checkboxes).map(cb => cb.dataset.playerId);
        
        if (playerIds.length === 0) {
            UI.showNotification('No hay jugadores seleccionados.', 'warning');
            return;
        }
        
        const confirmMsg = `¿Estás seguro de eliminar ${playerIds.length} jugador(es)?\nEsta acción no se puede deshacer.`;
        
        if (confirm(confirmMsg)) {
            let deletedCount = 0;
            
            playerIds.forEach(playerId => {
                if (Storage.deletePlayer(playerId)) {
                    deletedCount++;
                }
            });
            
            if (deletedCount > 0) {
                UI.showNotification(`${deletedCount} jugador(es) eliminado(s).`, 'success');
                
                // Reload players
                const players = Storage.getPlayers();
                const editMode = document.body.classList.contains('edit-mode');
                UI.displayPlayers(players, editMode);
            } else {
                UI.showNotification('Error al eliminar jugadores.', 'error');
            }
        }
    },

    /**
     * Load matches screen data
     */
    async loadMatchesScreen() {
        try {
            console.log('🚀 Starting loadMatchesScreen...');
            console.log('🏢 Current Group ID:', Storage.currentGroupId);
            console.log('🎮 Demo mode:', Storage.isDemo);
            
            // Load players first to calculate OVR if needed
            await Storage.loadPlayersFromFirebase();
            
            // Load matches from Firebase
            await Storage.loadMatchesFromFirebase();
            
            await this.loadMatches();
            
            // Initialize the MatchManager for the new match management system
            if (typeof MatchManager !== 'undefined') {
                console.log('🎮 Initializing MatchManager...');
                MatchManager.init();
            }
            
            console.log('✅ loadMatchesScreen completed successfully');
        } catch (error) {
            console.error('❌ Error loading matches:', error);
            UI.showNotification('Error al cargar los partidos.', 'error');
        }
    },

    /**
     * Generate balanced teams using new system
     */
    async generateTeams() {
        UI.showLoading();
        
        try {
            const players = Storage.getPlayers();
            const format = document.getElementById('match-format')?.value || '5v5';
            
            if (players.length < 4) {
                UI.showNotification('Se necesitan al menos 4 jugadores para generar equipos.', 'warning');
                UI.hideLoading();
                return;
            }

            // Use new match system for team generation
            const teams = MatchSystemV2.generateBalancedTeams(players, format);
            
            this.displayTeams(teams);
            
            // Show save match button (we'll save later when user clicks it)
            const saveSection = document.querySelector('.match-save-section');
            if (saveSection) {
                saveSection.style.display = 'block';
                // Store teams data for later saving
                window.generatedTeams = teams;
                window.generatedFormat = format;
            }
            
            UI.showNotification('Equipos generados exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error generating teams:', error);
            UI.showNotification(error.message || 'Error al generar equipos.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Save the generated match to Firebase
     */
    async saveGeneratedMatch() {
        if (!window.generatedTeams) {
            UI.showNotification('No hay equipos generados para guardar', 'warning');
            return;
        }

        UI.showLoading();
        
        try {
            const matchDateInput = document.getElementById('match-date');
            const matchDate = matchDateInput ? matchDateInput.value : new Date().toISOString();
            const groupId = Storage.getCurrentGroup()?.id;
            
            if (!groupId) {
                throw new Error('No hay grupo seleccionado');
            }

            // Create the match directly using Storage.addMatch
            const match = {
                id: Utils.generateId(),
                groupId: groupId,
                date: matchDate,
                status: 'scheduled',
                teamA: {
                    name: 'Equipo A',
                    players: window.generatedTeams.teamA.players.map(p => p.id),
                    playerDetails: window.generatedTeams.teamA.players,
                    ovr: window.generatedTeams.teamA.ovr,
                    score: null
                },
                teamB: {
                    name: 'Equipo B',
                    players: window.generatedTeams.teamB.players.map(p => p.id),
                    playerDetails: window.generatedTeams.teamB.players,
                    ovr: window.generatedTeams.teamB.ovr,
                    score: null
                },
                evaluation: null,
                createdAt: new Date().toISOString(),
                evaluatedAt: null
            };

            // Save using the existing method
            const success = await Storage.addMatch(match);
            
            if (success) {
                // Hide save button
                const saveSection = document.querySelector('.match-save-section');
                if (saveSection) {
                    saveSection.style.display = 'none';
                }
                
                // Clear stored teams
                window.generatedTeams = null;
                window.generatedFormat = null;
                
                UI.showNotification('Partido programado exitosamente!', 'success');
                await this.loadMatches();
            } else {
                throw new Error('Error al guardar el partido');
            }
            
        } catch (error) {
            console.error('Error saving match:', error);
            UI.showNotification(error.message || 'Error al programar el partido', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Display teams in UI
     */
    displayTeams(teams) {
        // Calculate formation suggestion for each team
        const getFormationSuggestion = (players) => {
            const positions = {};
            players.forEach(p => {
                positions[p.position] = (positions[p.position] || 0) + 1;
            });
            
            const formation = [];
            if (positions['POR']) formation.push(`${positions['POR']} POR`);
            if (positions['DEF']) formation.push(`${positions['DEF']} DEF`);
            if (positions['MED']) formation.push(`${positions['MED']} MED`);
            if (positions['DEL']) formation.push(`${positions['DEL']} DEL`);
            
            return formation.join(' - ') || 'Formación balanceada';
        };

        UI.elements.teamsContainer.innerHTML = `
            <div class="team-card">
                <div class="team-header">
                    <div class="team-name">Equipo A</div>
                    <div class="team-ovr">${teams.teamA.ovr}</div>
                </div>
                <div class="team-formation-info">
                    <div class="formation-label">Formación sugerida:</div>
                    <div>${getFormationSuggestion(teams.teamA.players)}</div>
                </div>
                <ul class="team-players">
                    ${teams.teamA.players.map(player => this.createTeamPlayerItem(player)).join('')}
                </ul>
            </div>
            
            <div class="team-card">
                <div class="team-header">
                    <div class="team-name">Equipo B</div>
                    <div class="team-ovr">${teams.teamB.ovr}</div>
                </div>
                <div class="team-formation-info">
                    <div class="formation-label">Formación sugerida:</div>
                    <div>${getFormationSuggestion(teams.teamB.players)}</div>
                </div>
                <ul class="team-players">
                    ${teams.teamB.players.map(player => this.createTeamPlayerItem(player)).join('')}
                </ul>
            </div>
            
            <div class="match-difference">
                Diferencia de OVR: <span class="match-difference-value">${teams.difference.toFixed(1)}</span>
            </div>
        `;
    },

    /**
     * Display enhanced teams with format support (5v5, 7v7)
     */
    displayEnhancedTeams(teams, format) {
        const playerCount = format === '5v5' ? 5 : 7;
        
        // Close player selection area if open
        const selectionArea = document.getElementById('player-selection-area');
        if (selectionArea) {
            selectionArea.style.display = 'none';
        }
        
        UI.elements.teamsContainer.innerHTML = `
            <div class="teams-display-header">
                <h3>Equipos Generados - Formato ${format}</h3>
                <span class="teams-balance">Balance: ${(100 - teams.difference).toFixed(1)}%</span>
            </div>
            
            <div class="teams-comparison">
                <div class="team-card enhanced">
                    <div class="team-header">
                        <div class="team-name">Equipo A</div>
                        <div class="team-ovr">${teams.teamA.ovr}</div>
                    </div>
                    <div class="team-formation">
                        <span class="formation-label">Formación sugerida:</span>
                        <span class="formation-type">${this.getSuggestedFormation(teams.teamA.players, format)}</span>
                    </div>
                    <ul class="team-players enhanced">
                        ${teams.teamA.players.map((player, index) => 
                            this.createEnhancedTeamPlayerItem(player, index + 1)
                        ).join('')}
                    </ul>
                    <div class="team-stats">
                        <div class="stat-item">
                            <span class="stat-label">PAC:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamA.players, 'pac')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">DEF:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamA.players, 'def')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">SHO:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamA.players, 'sho')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="vs-separator">
                    <span class="vs-text">VS</span>
                    <div class="balance-indicator ${teams.difference <= 2 ? 'balanced' : teams.difference <= 5 ? 'fair' : 'unbalanced'}">
                        ${teams.difference <= 2 ? 'Muy Equilibrado' : teams.difference <= 5 ? 'Equilibrado' : 'Desbalanceado'}
                    </div>
                </div>
                
                <div class="team-card enhanced">
                    <div class="team-header">
                        <div class="team-name">Equipo B</div>
                        <div class="team-ovr">${teams.teamB.ovr}</div>
                    </div>
                    <div class="team-formation">
                        <span class="formation-label">Formación sugerida:</span>
                        <span class="formation-type">${this.getSuggestedFormation(teams.teamB.players, format)}</span>
                    </div>
                    <ul class="team-players enhanced">
                        ${teams.teamB.players.map((player, index) => 
                            this.createEnhancedTeamPlayerItem(player, index + 1)
                        ).join('')}
                    </ul>
                    <div class="team-stats">
                        <div class="stat-item">
                            <span class="stat-label">PAC:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamB.players, 'pac')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">DEF:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamB.players, 'def')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">SHO:</span>
                            <span class="stat-value">${this.calculateTeamAvgStat(teams.teamB.players, 'sho')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="match-summary">
                <div class="summary-item">
                    <i class='bx bx-user-check'></i>
                    <span>${playerCount} jugadores por equipo</span>
                </div>
                <div class="summary-item">
                    <i class='bx bx-equalizer'></i>
                    <span>Diferencia de OVR: ${teams.difference.toFixed(1)}</span>
                </div>
                <div class="summary-item">
                    <i class='bx bx-time'></i>
                    <span>Generado: ${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;
        
        // Show save match section
        const saveSection = document.querySelector('.match-save-section');
        if (saveSection) {
            saveSection.style.display = 'block';
        }
    },

    /**
     * Create enhanced team player item with more details
     */
    createEnhancedTeamPlayerItem(player, number) {
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}" class="player-photo-img">` : 
            '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';

        const positionColor = {
            'POR': 'goalkeeper',
            'DEF': 'defender',
            'MED': 'midfielder',
            'DEL': 'forward'
        };

        return `
            <li class="team-player-item enhanced">
                <div class="player-number">${number}</div>
                <div class="team-player-photo">${photoHtml}</div>
                <div class="team-player-info">
                    <div class="team-player-name">${player.name}</div>
                    <div class="team-player-position ${positionColor[player.position] || ''}">${player.position}</div>
                </div>
                <div class="team-player-ovr">${player.ovr}</div>
                <div class="player-key-stats">
                    <span class="key-stat" title="Velocidad">${player.attributes.pac}</span>
                    <span class="key-stat" title="Defensa">${player.attributes.def}</span>
                    <span class="key-stat" title="Tiro">${player.attributes.sho}</span>
                </div>
            </li>
        `;
    },

    /**
     * Get suggested formation based on player positions
     */
    getSuggestedFormation(players, format) {
        const positions = players.reduce((acc, p) => {
            acc[p.position] = (acc[p.position] || 0) + 1;
            return acc;
        }, {});
        
        if (format === '5v5') {
            // Common 5v5 formations
            if (positions.POR >= 1 && positions.DEF >= 1 && positions.MED >= 2 && positions.DEL >= 1) {
                return '1-1-2-1';
            } else if (positions.POR >= 1 && positions.DEF >= 2 && positions.MED >= 1 && positions.DEL >= 1) {
                return '1-2-1-1';
            } else {
                return '1-2-2';
            }
        } else {
            // Common 7v7 formations
            if (positions.POR >= 1 && positions.DEF >= 2 && positions.MED >= 2 && positions.DEL >= 2) {
                return '1-2-2-2';
            } else if (positions.POR >= 1 && positions.DEF >= 3 && positions.MED >= 2 && positions.DEL >= 1) {
                return '1-3-2-1';
            } else {
                return '1-2-3-1';
            }
        }
    },

    /**
     * Calculate team average for a specific stat
     */
    calculateTeamAvgStat(players, stat) {
        const total = players.reduce((sum, p) => sum + (p.attributes[stat] || 0), 0);
        return Math.round(total / players.length);
    },

    /**
     * Create team player item HTML
     */
    createTeamPlayerItem(player) {
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}">` : 
            '<i class="bx bx-user"></i>';

        const positionClass = `position-${player.position.toLowerCase()}`;

        return `
            <li class="team-player-item">
                <div class="team-player-photo">${photoHtml}</div>
                <div class="team-player-info">
                    <div class="team-player-name">${player.name}</div>
                    <div class="team-player-position ${positionClass}">${player.position}</div>
                </div>
                <div class="team-player-ovr">${player.ovr}</div>
            </li>
        `;
    },

    /**
     * Load matches history
     */
    async loadMatches() {
        console.log('🔍 Starting loadMatches...');
        
        if (!UI.elements.matchList) {
            console.error('❌ matchList element not found!');
            UI.showNotification('Error: Elemento de partidos no encontrado', 'error');
            return;
        }
        
        const matches = Storage.getMatches();
        console.log(`📊 Found ${matches.length} matches`);
        
        UI.elements.matchList.innerHTML = '';
        
        if (matches.length === 0) {
            UI.elements.matchList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No hay partidos registrados aún</h3>
                    <p>Crea tu primer partido usando los controles de arriba</p>
                </div>
            `;
            console.log('ℹ️ No matches found, showing creation message');
            return;
        }

        const sortedMatches = [...matches].reverse();
        
        sortedMatches.forEach(match => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';
            matchItem.dataset.matchId = match.id;
            
            // Ensure OVR values exist, calculate if missing
            const teamAOvr = match.teamA?.ovr || this.calculateTeamOvr(match.teamA?.players || []);
            const teamBOvr = match.teamB?.ovr || this.calculateTeamOvr(match.teamB?.players || []);
            const difference = match.difference || Math.abs(teamAOvr - teamBOvr);
            
            // Get status display
            const statusIcon = match.status === 'finished' ? '✅' : 
                             match.status === 'in-progress' ? '⏳' : '📅';
            const statusText = match.status === 'finished' ? 'Finalizado' : 
                             match.status === 'in-progress' ? 'En Progreso' : 'Programado';
            
            matchItem.innerHTML = `
                <div class="match-header" onclick="App.toggleMatchDetails('${match.id}')">
                    <div class="match-date-info">
                        <div class="match-date-display">
                            <i class='bx bx-calendar'></i>
                            ${Utils.formatDate(match.date)}
                        </div>
                        <div class="match-status-badge status-${match.status || 'scheduled'}">
                            <span class="status-icon">${statusIcon}</span>
                            ${statusText}
                        </div>
                    </div>
                    
                    <div class="match-content-wrapper">
                        <div class="match-teams-simple">
                            <div class="match-teams-info">
                                <div class="team-simple team-a">
                                    <span class="team-name">Equipo A</span>
                                    <span class="team-ovr">${teamAOvr}</span>
                                </div>
                                <span class="vs-simple">vs</span>
                                <div class="team-simple team-b">
                                    <span class="team-name">Equipo B</span>
                                    <span class="team-ovr">${teamBOvr}</span>
                                </div>
                            </div>
                        </div>
                        <div class="match-actions-simple">
                            <button class="btn-icon-danger" onclick="event.stopPropagation(); App.confirmDeleteMatch('${match.id}')" title="Eliminar partido">
                                <i class='bx bx-trash'></i>
                            </button>
                            <i class='bx bx-chevron-down expand-icon'></i>
                        </div>
                    </div>
                </div>
                <div class="match-details" id="details-${match.id}" style="display: none;">
                    ${this.createMatchDetailsHTML(match)}
                </div>
            `;
            
            UI.elements.matchList.appendChild(matchItem);
        });
    },

    /**
     * Toggle match details display
     */
    toggleMatchDetails(matchId) {
        const detailsElement = document.getElementById(`details-${matchId}`);
        const expandIcon = document.querySelector(`[data-match-id="${matchId}"] .expand-icon`);
        
        if (!detailsElement) return;
        
        if (detailsElement.style.display === 'none') {
            detailsElement.style.display = 'block';
            expandIcon.classList.remove('bx-chevron-down');
            expandIcon.classList.add('bx-chevron-up');
        } else {
            detailsElement.style.display = 'none';
            expandIcon.classList.remove('bx-chevron-up');
            expandIcon.classList.add('bx-chevron-down');
        }
    },

    /**
     * Create detailed HTML for match players
     */
    createMatchDetailsHTML(match) {
        const players = Storage.getPlayers();
        
        // Get team A players
        const teamAPlayers = [];
        if (match.teamA?.players) {
            match.teamA.players.forEach(playerId => {
                const player = players.find(p => p.id === playerId);
                if (player) teamAPlayers.push(player);
            });
        }
        
        // Get team B players
        const teamBPlayers = [];
        if (match.teamB?.players) {
            match.teamB.players.forEach(playerId => {
                const player = players.find(p => p.id === playerId);
                if (player) teamBPlayers.push(player);
            });
        }
        
        // Sort players by position and OVR
        const sortPlayers = (players) => {
            const positionOrder = { 'POR': 1, 'DEF': 2, 'MED': 3, 'DEL': 4 };
            return players.sort((a, b) => {
                if (a.position !== b.position) {
                    return (positionOrder[a.position] || 5) - (positionOrder[b.position] || 5);
                }
                return (b.ovr || 0) - (a.ovr || 0);
            });
        };
        
        const createPlayersList = (players, teamName) => {
            const sortedPlayers = sortPlayers([...players]);
            if (sortedPlayers.length === 0) {
                return `
                    <div class="team-details">
                        <h4>${teamName}</h4>
                        <p class="no-players">No hay jugadores asignados</p>
                    </div>
                `;
            }
            
            return `
                <div class="team-details">
                    <h4>${teamName} (${sortedPlayers.length} jugadores)</h4>
                    <div class="players-list">
                        ${sortedPlayers.map(player => `
                            <div class="player-detail">
                                <span class="player-position">${player.position}</span>
                                <span class="player-name">${player.name}</span>
                                <span class="player-ovr">${player.ovr || 'N/A'}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="team-average">
                        Promedio: ${(sortedPlayers.reduce((sum, p) => sum + (p.ovr || 0), 0) / sortedPlayers.length).toFixed(1)}
                    </div>
                </div>
            `;
        };
        
        const resultHTML = match.result ? `
            <div class="match-result">
                <h4>Resultado Final</h4>
                <div class="final-score">
                    <span>Equipo A: ${match.result.teamA}</span>
                    <span class="separator">-</span>
                    <span>Equipo B: ${match.result.teamB}</span>
                </div>
            </div>
        ` : '';
        
        const evaluationsHTML = match.evaluations && match.evaluations.length > 0 ? `
            <div class="match-evaluations">
                <h4>Evaluaciones (${match.evaluations.length} jugadores)</h4>
                <div class="evaluations-summary">
                    ${match.evaluations.map(eval => {
                        const player = players.find(p => p.id === eval.playerId);
                        const playerName = player ? player.name : 'Jugador desconocido';
                        const tagCount = eval.performanceTags ? eval.performanceTags.length : (eval.rating ? 1 : 0);
                        return `<span class="evaluation-item">${playerName} (${tagCount} tags)</span>`;
                    }).join('')}
                </div>
            </div>
        ` : '';
        
        return `
            <div class="match-details-content">
                <div class="teams-comparison">
                    ${createPlayersList(teamAPlayers, 'Equipo A')}
                    ${createPlayersList(teamBPlayers, 'Equipo B')}
                </div>
                ${resultHTML}
                ${evaluationsHTML}
            </div>
        `;
    },

    /**
     * Calculate team OVR from player IDs
     */
    calculateTeamOvr(playerIds) {
        if (!playerIds || playerIds.length === 0) {
            console.log('⚠️ No player IDs provided for OVR calculation');
            return 0;
        }
        
        const players = Storage.getPlayers();
        const teamPlayers = playerIds.map(id => {
            const player = players.find(p => p.id === id);
            if (!player) {
                console.log(`⚠️ Player not found for ID: ${id}`);
            }
            return player;
        }).filter(p => p);
        
        if (teamPlayers.length === 0) {
            console.log('⚠️ No valid players found for team');
            return 0;
        }
        
        const totalOvr = teamPlayers.reduce((sum, player) => sum + (player.ovr || 0), 0);
        const avgOvr = Math.round(totalOvr / teamPlayers.length);
        console.log(`📊 Team OVR: ${avgOvr} (${teamPlayers.length} players)`);
        return avgOvr;
    },

    /**
     * Load evaluate screen with new system
     */
    async loadEvaluateScreen() {
        try {
            console.log('🔍 Starting loadEvaluateScreen with new system...');
            
            // Redirect to new evaluation screen method
            await this.loadEvaluationScreen();
            
        } catch (error) {
            console.error('❌ Error in loadEvaluateScreen:', error);
            UI.showNotification('Error al cargar la sección de evaluación', 'error');
        }
    },

    /**
     * Legacy method - keeping for backward compatibility
     */
    async loadEvaluateScreenLegacy() {
        try {
            console.log('🔍 Starting loadEvaluateScreen...');
            
            // Load matches from Firebase first
            await Storage.loadMatchesFromFirebase();
            const matches = Storage.getMatches();
            console.log(`⚽ Found ${matches.length} matches`);
            
            const matchesContainer = document.getElementById('matches-for-evaluation');
            if (!matchesContainer) {
                console.error('❌ Matches for evaluation container not found');
                UI.showNotification('Error: Contenedor de partidos no encontrado', 'error');
                return;
            }
            
            // Filter matches that are ready for evaluation (completed matches without evaluation)
            const matchesForEvaluation = matches.filter(match => 
                match.status === 'completed' || 
                (!match.result && match.teamA && match.teamB) // Match exists but no result yet
            );
            
            console.log(`🎯 Found ${matchesForEvaluation.length} matches ready for evaluation`);
            
            if (matchesForEvaluation.length === 0) {
                matchesContainer.innerHTML = `
                    <div class="no-matches-message">
                        <i class='bx bx-football' style="font-size: 3rem; color: #00ff88; margin-bottom: 1rem;"></i>
                        <h3>No hay partidos para evaluar</h3>
                        <p>Los partidos aparecerán aquí cuando estén listos para evaluación</p>
                        <button class="btn btn-primary" onclick="App.navigateToScreen('matches-screen')">
                            <i class='bx bx-football'></i> Ver Partidos
                        </button>
                    </div>
                `;
            } else {
                matchesContainer.innerHTML = '';
                matchesForEvaluation.forEach(match => {
                    const matchCard = this.createMatchEvaluationCard(match);
                    matchesContainer.appendChild(matchCard);
                });
            }
            
            console.log('✅ Evaluate screen loaded successfully');
        } catch (error) {
            console.error('❌ Error loading evaluate screen:', error);
            UI.showNotification('Error al cargar la pantalla de evaluación.', 'error');
        }
    },

    // Removed legacy player evaluation system - now using Performance Tags only

    /**
     * Create match card for evaluation selection with improved design
     */
    createMatchEvaluationCard(match) {
        const card = document.createElement('div');
        card.className = 'match-evaluation-card';
        card.dataset.matchId = match.id;
        
        // Combine all players from both teams
        const allPlayers = [];
        if (match.teamA?.players) allPlayers.push(...match.teamA.players);
        if (match.teamB?.players) allPlayers.push(...match.teamB.players);
        
        // Simple header with match info
        card.innerHTML = `
            <div class="match-header">
                <h3>Partido - ${Utils.formatDate(match.date)}</h3>
                <span class="player-count">${allPlayers.length} jugadores</span>
            </div>
            <div class="match-players" data-match-id="${match.id}">
                ${allPlayers.map(player => this.createPlayerRatingCard(player, match)).join('')}
            </div>
            <div class="match-actions">
                <button class="btn btn-success save-evaluations-btn" data-match-id="${match.id}">
                    <i class='bx bx-check'></i> Guardar Evaluaciones
                </button>
                <button class="btn btn-danger delete-match-btn" onclick="App.confirmDeleteMatch('${match.id}')">
                    <i class='bx bx-trash'></i> Eliminar Partido
                </button>
            </div>
        `;
        
        // Setup event delegation for this match
        this.setupMatchEvaluationEvents(card, match.id);
        
        return card;
    },

    /**
     * Create player rating card with Performance Tags system
     */
    createPlayerRatingCard(player, match) {
        const playerId = player.id;
        const existingEvaluation = match.evaluations?.find(e => e.playerId === playerId);
        const selectedTags = existingEvaluation?.performanceTags || [];
        
        return `
            <div class="player-rating-card" data-player-id="${playerId}">
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    <span class="player-position">${player.position}</span>
                    <span class="player-ovr">${player.ovr}</span>
                </div>
                <div class="performance-tags">
                    ${this.createPerformanceTags(playerId, selectedTags)}
                </div>
                <div class="selected-tags-info" id="tags-info-${playerId}">
                    ${this.getSelectedTagsInfo(selectedTags)}
                </div>
            </div>
        `;
    },

    /**
     * Create Performance Tags HTML (9 specific tags)
     */
    createPerformanceTags(playerId, selectedTags = []) {
        const tags = [
            { id: 'goleador', emoji: '⚽', name: 'Goleador', effect: '+2 Tiro' },
            { id: 'asistencia', emoji: '🎯', name: 'Asistencia', effect: '+2 Pase' },
            { id: 'velocidad', emoji: '💨', name: 'Velocidad destacada', effect: '+1 Ritmo' },
            { id: 'defensa', emoji: '🛡️', name: 'Defensa sólida', effect: '+2 Defensa' },
            { id: 'regate', emoji: '🤹', name: 'Regate exitoso', effect: '+1 Regate' },
            { id: 'liderazgo', emoji: '👑', name: 'Liderazgo', effect: '+1 Pase' },
            { id: 'jugada_clave', emoji: '🔑', name: 'Jugada clave', effect: '+1 Regate' },
            { id: 'atajada', emoji: '🥅', name: 'Atajada importante', effect: '+2 Defensa' },
            { id: 'mal_partido', emoji: '😞', name: 'Mal partido', effect: '-1 todas las stats' }
        ];
        
        return tags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            return `
                <button class="performance-tag ${isSelected ? 'selected' : ''}" 
                        data-tag-id="${tag.id}" 
                        data-player-id="${playerId}"
                        title="${tag.name} (${tag.effect})">
                    <span class="tag-emoji">${tag.emoji}</span>
                    <span class="tag-name">${tag.name}</span>
                </button>
            `;
        }).join('');
    },

    /**
     * Setup event delegation for match evaluation
     */
    setupMatchEvaluationEvents(card, matchId) {
        // Event delegation for performance tags
        card.addEventListener('click', (e) => {
            if (e.target.closest('.performance-tag')) {
                const tagButton = e.target.closest('.performance-tag');
                const playerId = tagButton.dataset.playerId;
                const tagId = tagButton.dataset.tagId;
                this.togglePerformanceTag(playerId, tagId, matchId);
            }
            
            // Save evaluations button
            if (e.target.closest('.save-evaluations-btn')) {
                this.saveMatchEvaluations(matchId);
            }
        });
    },

    /**
     * Toggle Performance Tag selection
     */
    togglePerformanceTag(playerId, tagId, matchId) {
        const tagButton = document.querySelector(`[data-player-id="${playerId}"][data-tag-id="${tagId}"]`);
        if (!tagButton) return;
        
        // Toggle visual state
        tagButton.classList.toggle('selected');
        
        // Update selected tags info
        this.updateSelectedTagsInfo(playerId);
        
        console.log(`🏷️ Toggled tag "${tagId}" for player ${playerId}`);
    },

    /**
     * Update selected tags info display
     */
    updateSelectedTagsInfo(playerId) {
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        const selectedTags = Array.from(playerCard.querySelectorAll('.performance-tag.selected'))
            .map(tag => tag.dataset.tagId);
        
        const infoElement = document.getElementById(`tags-info-${playerId}`);
        if (infoElement) {
            infoElement.innerHTML = this.getSelectedTagsInfo(selectedTags);
        }
    },

    /**
     * Get selected tags info text
     */
    getSelectedTagsInfo(selectedTags) {
        if (selectedTags.length === 0) {
            return '<span class="no-tags">Sin etiquetas seleccionadas</span>';
        }
        
        return `<span class="tags-count">${selectedTags.length} etiqueta${selectedTags.length > 1 ? 's' : ''} seleccionada${selectedTags.length > 1 ? 's' : ''}</span>`;
    },

    /**
     * Save match evaluations with Performance Tags
     */
    async saveMatchEvaluations(matchId) {
        try {
            const match = Storage.getMatchById(matchId);
            if (!match) {
                UI.showNotification('Partido no encontrado', 'error');
                return;
            }
            
            // Collect all evaluations
            const evaluations = [];
            const playerCards = document.querySelectorAll(`[data-match-id="${matchId}"] .player-rating-card`);
            
            playerCards.forEach(card => {
                const playerId = card.dataset.playerId;
                const selectedTags = Array.from(card.querySelectorAll('.performance-tag.selected'))
                    .map(tag => tag.dataset.tagId);
                
                if (selectedTags.length > 0) {
                    evaluations.push({
                        playerId: playerId,
                        performanceTags: selectedTags,
                        evaluatedAt: new Date().toISOString()
                    });
                }
            });
            
            // Save evaluations to match
            match.evaluations = evaluations;
            match.status = 'finished';
            
            // Update match in storage
            const success = await Storage.updateMatch(matchId, match);
            
            if (success) {
                UI.showNotification(`Evaluaciones guardadas para ${evaluations.length} jugadores`, 'success');
                
                // Apply performance tag effects to player attributes
                this.applyPerformanceTagEffects(evaluations);
                
                // Reload evaluate screen
                await this.loadEvaluateScreen();
            } else {
                UI.showNotification('Error al guardar evaluaciones', 'error');
            }
            
        } catch (error) {
            console.error('Error saving evaluations:', error);
            UI.showNotification('Error al guardar evaluaciones', 'error');
        }
    },

    /**
     * Apply performance tag effects to player attributes
     */
    applyPerformanceTagEffects(evaluations) {
        evaluations.forEach(evaluation => {
            const player = Storage.getPlayerById(evaluation.playerId);
            if (!player) return;
            
            evaluation.performanceTags.forEach(tagId => {
                switch (tagId) {
                    case 'goleador':
                        player.attributes.sho = Math.min(99, (player.attributes.sho || 70) + 2);
                        break;
                    case 'asistencia':
                        player.attributes.pas = Math.min(99, (player.attributes.pas || 70) + 2);
                        break;
                    case 'velocidad':
                        player.attributes.pac = Math.min(99, (player.attributes.pac || 70) + 1);
                        break;
                    case 'defensa':
                    case 'atajada':
                        player.attributes.def = Math.min(99, (player.attributes.def || 70) + 2);
                        break;
                    case 'regate':
                    case 'jugada_clave':
                        player.attributes.dri = Math.min(99, (player.attributes.dri || 70) + 1);
                        break;
                    case 'liderazgo':
                        player.attributes.pas = Math.min(99, (player.attributes.pas || 70) + 1);
                        break;
                    case 'mal_partido':
                        // Reduce all stats by 1
                        Object.keys(player.attributes).forEach(attr => {
                            player.attributes[attr] = Math.max(40, player.attributes[attr] - 1);
                        });
                        break;
                }
            });
            
            // Recalculate OVR
            player.ovr = Utils.calculateOVR(player.attributes, player.position);
            
            // Update player in storage
            Storage.updatePlayer(player.id, player);
        });
        
        console.log('🎯 Performance tag effects applied to players');
    },

    /**
     * Get OVR class for styling
     */
    getOvrClass(ovr) {
        if (ovr >= 85) return 'high';
        if (ovr >= 75) return 'medium';
        if (ovr >= 65) return 'low';
        return 'very-low';
    },

    /**
     * Confirm match deletion
     */
    confirmDeleteMatch(matchId) {
        const match = Storage.getMatchById(matchId);
        if (!match) {
            UI.showNotification('Partido no encontrado', 'error');
            return;
        }

        const confirmMessage = `¿Estás seguro de que quieres eliminar este partido?\n\nFecha: ${Utils.formatDate(match.date)}\nEquipo A (${match.teamA?.ovr || 0}) vs Equipo B (${match.teamB?.ovr || 0})\n\nEsta acción no se puede deshacer.`;
        
        if (confirm(confirmMessage)) {
            this.deleteMatch(matchId);
        }
    },

    /**
     * Delete match from database and update UI
     */
    async deleteMatch(matchId) {
        try {
            UI.showLoading();
            console.log(`🗑️ Deleting match: ${matchId}`);
            
            const success = await Storage.deleteMatch(matchId);
            
            if (success) {
                UI.showNotification('Partido eliminado exitosamente', 'success');
                
                // Reload both screens if user is on matches or evaluate screen
                const currentScreen = this.state.currentScreen;
                if (currentScreen === 'matches-screen') {
                    await this.loadMatchesScreen();
                } else if (currentScreen === 'evaluate-screen') {
                    await this.loadEvaluateScreen();
                }
                
                console.log('✅ Match deleted successfully');
            } else {
                UI.showNotification('Error al eliminar el partido', 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting match:', error);
            UI.showNotification('Error al eliminar el partido', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load player data for evaluation
     */
    loadPlayerForEvaluation(playerId) {
        if (!playerId) {
            UI.elements.evaluationForm.style.display = 'none';
            this.state.currentPlayerId = null;
            return;
        }

        const player = Storage.getPlayerById(playerId);
        
        if (player) {
            this.state.currentPlayerId = player.id;
            
            Object.entries(player.attributes).forEach(([attr, value]) => {
                const slider = document.getElementById(`eval-${attr}`);
                const valueDisplay = document.getElementById(`eval-${attr}-value`);
                
                if (slider && valueDisplay) {
                    slider.value = value;
                    valueDisplay.textContent = value;
                }
            });
            
            UI.elements.evaluationForm.style.display = 'block';
        }
    },

    /**
     * Save player evaluation
     */
    async savePlayerEvaluation() {
        if (!this.state.currentPlayerId) return;

        UI.showLoading();

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const updatedAttributes = {
                pac: parseInt(document.getElementById('eval-pac').value),
                sho: parseInt(document.getElementById('eval-sho').value),
                pas: parseInt(document.getElementById('eval-pas').value),
                dri: parseInt(document.getElementById('eval-dri').value),
                def: parseInt(document.getElementById('eval-def').value),
                phy: parseInt(document.getElementById('eval-phy').value)
            };

            const updatedOvr = Utils.calculateOvr(updatedAttributes);

            const success = Storage.updatePlayer(this.state.currentPlayerId, {
                attributes: updatedAttributes,
                ovr: updatedOvr
            });

            if (success) {
                UI.showNotification('Evaluación guardada exitosamente!', 'success');
                
                UI.elements.playerSelector.value = '';
                UI.elements.evaluationForm.style.display = 'none';
                this.state.currentPlayerId = null;
                
                await this.loadEvaluateScreen();
            } else {
                UI.showNotification('Error al guardar la evaluación.', 'error');
            }

        } catch (error) {
            console.error('Error saving evaluation:', error);
            UI.showNotification('Error inesperado al guardar.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load ranking screen data
     */
    async loadRankingScreen() {
        UI.showLoading();

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const players = Storage.getPlayers();
            
            const sortedPlayers = [...players].sort((a, b) => b.ovr - a.ovr);
            
            UI.elements.rankingList.innerHTML = '';
            
            if (sortedPlayers.length === 0) {
                UI.elements.rankingList.innerHTML = '<p style="text-align: center; padding: 20px;">No hay jugadores registrados aún.</p>';
                return;
            }

            sortedPlayers.forEach((player, index) => {
                const rankingItem = document.createElement('li');
                rankingItem.className = 'ranking-item';
                
                const ovrClass = Utils.getOvrColorClass(player.ovr);
                const photoHtml = player.photo ? 
                    `<img src="${player.photo}" alt="${player.name}">` : 
                    '<i class="bx bx-user"></i>';

                rankingItem.innerHTML = `
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-photo">${photoHtml}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${player.name}</div>
                        <div class="ranking-position-text">${player.position}</div>
                    </div>
                    <div class="ranking-ovr ${ovrClass}">${player.ovr}</div>
                `;
                
                UI.elements.rankingList.appendChild(rankingItem);
            });

        } catch (error) {
            console.error('Error loading ranking:', error);
            UI.showNotification('Error al cargar el ranking.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load dashboard screen with statistics and charts
     */
    async loadDashboardScreen() {
        try {
            const currentPerson = Storage.getCurrentPerson();
            const currentGroup = Storage.getCurrentGroup();
            
            // Check if we have a person and group
            if (!currentPerson || !currentGroup) {
                console.error('No current person or group found');
                this.navigateToScreen('welcome-screen');
                return;
            }
            
            const players = Storage.getPlayers();
            const matches = Storage.getMatches() || [];
            
            // Update welcome message and date
            const welcomeMsg = document.getElementById('welcome-message');
            if (welcomeMsg) {
                welcomeMsg.textContent = `¡Bienvenido, ${currentPerson.name}!`;
            }
            
            const groupNameEl = document.getElementById('dash-group-name');
            if (groupNameEl) {
                groupNameEl.textContent = currentGroup.name;
            }
            
            const dateEl = document.getElementById('current-date');
            if (dateEl) {
                const today = new Date();
                dateEl.textContent = today.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
            
            // Load dashboard data using the new controller
            if (typeof DashboardController !== 'undefined') {
                await DashboardController.loadDashboardData(currentGroup.id);
            } else {
                // Fallback to old method if controller not available
                this.loadNextMatch(matches);
                this.loadRecentMatches(matches);
                this.loadTopPerformers(matches, players);
                this.updateStatsSummary(players, matches);
            }
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            UI.showNotification('Error al cargar el dashboard.', 'error');
        }
    },

    loadNextMatch(matches) {
        const container = document.getElementById('next-match-content');
        if (!container) return;
        
        // Find scheduled matches
        const scheduledMatches = matches.filter(m => m.status === 'scheduled' || !m.status);
        
        if (scheduledMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #888;">
                    <i class='bx bx-calendar-x' style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No hay partidos programados</p>
                    <button class="quick-action-btn primary" style="margin-top: 15px;" onclick="App.navigateToScreen('matches-screen')">
                        <i class='bx bx-plus'></i>
                        <span>Programar Partido</span>
                    </button>
                </div>
            `;
            return;
        }
        
        // Get the most recent scheduled match
        const nextMatch = scheduledMatches[scheduledMatches.length - 1];
        const teamA = nextMatch.teamA || nextMatch.teams?.teamA;
        const teamB = nextMatch.teamB || nextMatch.teams?.teamB;
        
        container.innerHTML = `
            <div class="next-match-info">
                <div class="match-teams">
                    <div class="team-block">
                        <div class="team-name">${teamA?.name || 'Equipo A'}</div>
                        <div class="team-ovr">OVR ${teamA?.ovr || '--'}</div>
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="team-block">
                        <div class="team-name">${teamB?.name || 'Equipo B'}</div>
                        <div class="team-ovr">OVR ${teamB?.ovr || '--'}</div>
                    </div>
                </div>
                <div class="match-date-time">
                    <div class="match-date">${new Date(nextMatch.date || nextMatch.createdAt).toLocaleDateString('es-ES')}</div>
                    <button class="quick-action-btn primary" onclick="App.navigateToScreen('evaluate-screen')">
                        <span>Evaluar</span>
                    </button>
                </div>
            </div>
        `;
    },

    loadRecentMatches(matches) {
        const container = document.getElementById('recent-matches-content');
        if (!container) return;
        
        // Get completed matches
        const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'evaluated');
        
        if (completedMatches.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No hay partidos completados</div>';
            return;
        }
        
        // Show last 3 matches
        const recentMatches = completedMatches.slice(-3).reverse();
        
        container.innerHTML = recentMatches.map(match => {
            const teamA = match.teamA || match.teams?.teamA;
            const teamB = match.teamB || match.teams?.teamB;
            const scoreA = match.evaluation?.teamAScore || teamA?.score || 0;
            const scoreB = match.evaluation?.teamBScore || teamB?.score || 0;
            const winner = scoreA > scoreB ? teamA?.name : scoreB > scoreA ? teamB?.name : 'Empate';
            
            return `
                <div class="match-item">
                    <div class="match-result">
                        <div class="match-score">
                            ${teamA?.name || 'Equipo A'} ${scoreA} - ${scoreB} ${teamB?.name || 'Equipo B'}
                        </div>
                        <div class="match-winner" style="font-size: 0.8rem;">${winner}</div>
                    </div>
                    <div class="match-info">
                        <div class="match-date-small">${new Date(match.evaluatedAt || match.createdAt).toLocaleDateString('es-ES')}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    loadTopPerformers(matches, players) {
        const container = document.getElementById('top-performers-content');
        if (!container) return;
        
        // Get evaluations from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentEvaluations = matches.filter(m => 
            m.evaluation && 
            new Date(m.evaluatedAt || m.createdAt) > sevenDaysAgo
        );
        
        if (recentEvaluations.length === 0 || players.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No hay evaluaciones recientes</div>';
            return;
        }
        
        // Calculate player ratings from recent evaluations
        const playerRatings = {};
        
        recentEvaluations.forEach(match => {
            if (match.evaluation?.playerPerformance) {
                Object.entries(match.evaluation.playerPerformance).forEach(([playerId, perf]) => {
                    if (!playerRatings[playerId]) {
                        playerRatings[playerId] = { total: 0, count: 0, tags: 0 };
                    }
                    playerRatings[playerId].total += perf.rating || 0;
                    playerRatings[playerId].count += 1;
                    playerRatings[playerId].tags += (perf.tags?.length || 0);
                });
            }
        });
        
        // Calculate average ratings and sort
        const topPerformers = Object.entries(playerRatings)
            .map(([playerId, stats]) => {
                const player = players.find(p => p.id === playerId);
                if (!player) return null;
                return {
                    ...player,
                    avgRating: stats.total / stats.count,
                    totalTags: stats.tags,
                    matchesPlayed: stats.count
                };
            })
            .filter(p => p !== null)
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5);
        
        if (topPerformers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No hay datos de rendimiento</div>';
            return;
        }
        
        container.innerHTML = topPerformers.map((player, index) => `
            <div class="performer-item">
                <div class="performer-rank">${index + 1}</div>
                <div class="performer-info">
                    <div class="performer-name">${player.name}</div>
                    <div class="performer-stats">${player.position} • ${player.matchesPlayed} partido(s)</div>
                </div>
                <div class="performer-rating">${player.avgRating.toFixed(1)}</div>
            </div>
        `).join('');
    },

    updateStatsSummary(players, matches) {
        // Update basic stats
        const totalPlayersEl = document.getElementById('total-players-stat');
        const totalMatchesEl = document.getElementById('total-matches-stat');
        const avgOvrEl = document.getElementById('avg-ovr-stat');
        const winRateEl = document.getElementById('win-rate-stat');
        
        if (totalPlayersEl) totalPlayersEl.textContent = players.length;
        if (totalMatchesEl) totalMatchesEl.textContent = matches.length;
        
        if (avgOvrEl) {
            const avgOvr = players.length > 0 ? 
                Math.round(players.reduce((sum, p) => sum + p.ovr, 0) / players.length) : 0;
            avgOvrEl.textContent = avgOvr;
        }
        
        if (winRateEl) {
            // Calculate win rate for evaluated matches
            const evaluatedMatches = matches.filter(m => m.evaluation);
            if (evaluatedMatches.length > 0) {
                let wins = 0;
                evaluatedMatches.forEach(match => {
                    const scoreA = match.evaluation.teamAScore || 0;
                    const scoreB = match.evaluation.teamBScore || 0;
                    if (scoreA !== scoreB) wins++; // Count non-draws as wins for now
                });
                const winRate = Math.round((wins / evaluatedMatches.length) * 100);
                winRateEl.textContent = `${winRate}%`;
            } else {
                winRateEl.textContent = '--';
            }
        }
    },

    // Old chart functions - commented out as they're no longer used in the new dashboard
    /*
    drawPositionChart(players) {
        // Function deprecated - charts removed from new dashboard
    },
    
    drawOvrChart(players) {
        // Function deprecated - charts removed from new dashboard
    },
    
    loadRecentActivity() {
        // Function deprecated - replaced by loadRecentMatches
    },
    
    loadTopPlayers(players) {
        // Function deprecated - replaced by loadTopPerformers
    },
    */

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // Clear all session data
            Storage.clearSession();
            this.state.isSetupComplete = false;
            
            // Hide any open modals
            UI.hidePersonMenu();
            
            UI.showNotification('Sesión cerrada exitosamente.', 'success');
            
            // Navigate to welcome screen
            setTimeout(() => {
                this.navigateToScreen('welcome-screen');
                this.loadWelcomeScreen();
            }, 1000);
        }
    },

    /**
     * Handle data export
     */
    handleExportData() {
        try {
            const data = Storage.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr));
            element.setAttribute('download', `futbol_stats_backup_${new Date().toISOString().split('T')[0]}.json`);
            element.style.display = 'none';
            
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            
            UI.showNotification('Datos exportados exitosamente.', 'success');
            UI.hidePersonMenu();

        } catch (error) {
            console.error('Error exporting data:', error);
            UI.showNotification('Error al exportar datos.', 'error');
        }
    },

    /**
     * Handle person photo upload - Enhanced with Supabase Storage
     */
    async handlePersonPhotoUpload(e) {
        // Prevent duplicate processing
        const now = Date.now();
        if (this.lastPersonPhotoTime && (now - this.lastPersonPhotoTime) < 500) {
            console.log('⚠️ Duplicate person photo upload prevented (too fast)');
            return;
        }
        this.lastPersonPhotoTime = now;
        
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if we already processed this file
        if (this.lastProcessedPersonFile === file.name + file.size + file.lastModified) {
            console.log('⚠️ Same person file already processed');
            return;
        }
        this.lastProcessedPersonFile = file.name + file.size + file.lastModified;

        if (!Utils.isValidImageFile(file)) {
            UI.showNotification('Por favor selecciona una imagen válida (JPG, PNG, GIF, WebP) menor a 10MB.', 'error');
            return;
        }

        try {
            this.state.personPhotoFile = file;
            console.log('Person photo file set:', file.name);
            
            // Show loading state
            UI.showNotification('Procesando avatar...', 'info');
            
            // For preview, always use base64 to avoid uploading twice
            const previewUrl = await Utils.fileToBase64(file);
            console.log('👤 Avatar converted to base64 for preview');
            
            // Update the preview
            const img = `<img src="${previewUrl}" alt="Person photo">`;
            if (UI.elements.personPhotoPreview) {
                UI.elements.personPhotoPreview.innerHTML = img;
            }
            
            UI.showNotification('Avatar listo para subir', 'success');
        } catch (error) {
            console.error('Error processing person avatar:', error);
            UI.showNotification('Error al procesar el avatar.', 'error');
        }
    },

    /**
     * Enhanced team generation with player selection
     */
    async generateTeamsFromSelected() {
        const selectedPlayerIds = this.getSelectedPlayerIds();
        const format = document.getElementById('match-format')?.value || '5v5';
        
        if (selectedPlayerIds.length < (format === '5v5' ? 10 : 14)) {
            UI.showNotification(`Se necesitan al menos ${format === '5v5' ? '10' : '14'} jugadores para ${format}.`, 'warning');
            return;
        }

        UI.showLoading();
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const allPlayers = Storage.getPlayers();
            const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
            
            const teams = Utils.balanceTeamsWithFormat(selectedPlayers, format);
            
            this.displayEnhancedTeams(teams, format);
            this.currentMatchData = {
                selectedPlayers: selectedPlayerIds,
                format: format,
                teams: teams
            };
            
            // Show save match button
            if (UI.elements.saveMatchBtn) {
                UI.elements.saveMatchBtn.style.display = 'block';
            }
            
            UI.showNotification('Equipos generados exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error generating teams:', error);
            UI.showNotification(error.message || 'Error al generar equipos.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Save scheduled match
     */
    async saveScheduledMatch() {
        if (!this.currentMatchData) {
            UI.showNotification('No hay equipos generados para guardar.', 'error');
            return;
        }

        UI.showLoading();

        try {
            const match = {
                id: Utils.generateId(),
                status: 'programado',
                format: this.currentMatchData.format,
                selectedPlayers: this.currentMatchData.selectedPlayers,
                teamA: {
                    players: this.currentMatchData.teams.teamA.players.map(p => p.id),
                    ovr: this.currentMatchData.teams.teamA.ovr
                },
                teamB: {
                    players: this.currentMatchData.teams.teamB.players.map(p => p.id),
                    ovr: this.currentMatchData.teams.teamB.ovr
                },
                difference: this.currentMatchData.teams.difference,
                result: null,
                evaluations: []
            };
            
            const success = Storage.addMatch(match);
            
            if (success) {
                UI.showNotification('Partido programado exitosamente!', 'success');
                this.currentMatchData = null;
                if (UI.elements.saveMatchBtn) {
                    UI.elements.saveMatchBtn.style.display = 'none';
                }
                await this.loadMatchesScreen();
            } else {
                UI.showNotification('Error al programar el partido.', 'error');
            }

        } catch (error) {
            console.error('Error saving match:', error);
            UI.showNotification('Error inesperado.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Start match (change status to en_curso)
     */
    async startMatch(matchId) {
        try {
            const success = Storage.updateMatch(matchId, { 
                status: 'en_curso',
                startedAt: new Date().toISOString()
            });
            
            if (success) {
                UI.showNotification('Partido iniciado!', 'success');
                await this.loadMatchesScreen();
            }
        } catch (error) {
            console.error('Error starting match:', error);
            UI.showNotification('Error al iniciar partido.', 'error');
        }
    },

    /**
     * Finish match with result
     */
    async finishMatch(matchId, teamAScore, teamBScore) {
        try {
            const success = Storage.updateMatch(matchId, { 
                status: 'finalizado',
                result: { teamA: teamAScore, teamB: teamBScore },
                finishedAt: new Date().toISOString()
            });
            
            if (success) {
                UI.showNotification('Partido finalizado! Ahora puedes evaluar a los jugadores.', 'success');
                await this.loadMatchesScreen();
            }
        } catch (error) {
            console.error('Error finishing match:', error);
            UI.showNotification('Error al finalizar partido.', 'error');
        }
    },

    /**
     * Navigate to post-match evaluation
     */
    navigateToPostMatchEvaluation(matchId) {
        this.state.currentMatchForEvaluation = matchId;
        this.navigateToScreen('post-match-evaluation-screen');
    },

    /**
     * Load evaluation screen with new system
     */
    async loadEvaluationScreen() {
        // Don't navigate, just load data (we're already on evaluate-screen)
        
        try {
            const groupId = Storage.getCurrentGroup()?.id;
            if (!groupId) {
                throw new Error('No hay grupo seleccionado');
            }
            
            // Get matches ready for evaluation
            const matches = await MatchSystemV2.getMatchesForEvaluation(groupId);
            
            const matchesContainer = document.getElementById('matches-for-evaluation');
            if (!matchesContainer) return;
            
            if (matches.length === 0) {
                matchesContainer.innerHTML = `
                    <div class="no-matches">
                        <i class='bx bx-calendar-x'></i>
                        <p>No hay partidos pendientes de evaluación</p>
                        <p>Los partidos ya evaluados no se muestran aquí</p>
                        <p><strong>💡 Genera nuevos partidos</strong> en la sección de Partidos</p>
                    </div>
                `;
                return;
            }
            
            matchesContainer.innerHTML = matches.map(match => this.createMatchForEvaluationCard(match)).join('');
            
        } catch (error) {
            console.error('Error loading evaluation screen:', error);
            UI.showNotification('Error al cargar partidos para evaluación', 'error');
        }
    },

    /**
     * Create match card for evaluation selection
     */
    createMatchForEvaluationCard(match) {
        const matchDate = new Date(match.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const canEvaluate = MatchSystemV2.canEvaluateMatch(match);
        const statusText = match.status === 'evaluated' ? 'Ya evaluado' : 'Pendiente';
        
        return `
            <div class="match-evaluation-card ${canEvaluate ? '' : 'evaluated'}">
                <div class="match-eval-header">
                    <h3>Partido del ${matchDate}</h3>
                    <span class="match-status ${match.status}">${statusText}</span>
                </div>
                
                <div class="match-teams-simple">
                    <div class="match-teams-info">
                        <div class="team-simple team-a">
                            <span class="team-name">${match.teamA.name}</span>
                            <span class="team-ovr">${match.teamA.ovr}</span>
                            <div class="team-players-preview">
                                ${match.teamA.playerDetails ? 
                                    match.teamA.playerDetails.slice(0, 2).map(p => p.name).join(', ') + 
                                    (match.teamA.playerDetails.length > 2 ? '...' : '') :
                                    `${match.teamA.players.length} jugadores`
                                }
                            </div>
                        </div>
                        <span class="vs-simple">vs</span>
                        <div class="team-simple team-b">
                            <span class="team-name">${match.teamB.name}</span>
                            <span class="team-ovr">${match.teamB.ovr}</span>
                            <div class="team-players-preview">
                                ${match.teamB.playerDetails ? 
                                    match.teamB.playerDetails.slice(0, 2).map(p => p.name).join(', ') + 
                                    (match.teamB.playerDetails.length > 2 ? '...' : '') :
                                    `${match.teamB.players.length} jugadores`
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                ${canEvaluate ? `
                    <button class="btn btn-primary" onclick="App.startMatchEvaluation('${match.id}')">
                        <i class='bx bx-edit'></i> Evaluar Partido
                    </button>
                ` : `
                    <div class="evaluation-completed">
                        <i class='bx bx-check-circle'></i>
                        <span>Partido ya evaluado</span>
                        ${match.evaluation ? `
                            <div class="final-score">
                                ${match.teamA.score} - ${match.teamB.score}
                            </div>
                        ` : ''}
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Start match evaluation with new system
     */
    async startMatchEvaluation(matchId) {
        try {
            const match = await MatchSystemV2.startEvaluation(matchId);
            
            // Show evaluation form
            const evaluationForm = document.getElementById('match-evaluation-form');
            const matchesContainer = document.getElementById('matches-for-evaluation');
            
            if (evaluationForm && matchesContainer) {
                matchesContainer.style.display = 'none';
                evaluationForm.style.display = 'block';
                evaluationForm.innerHTML = MatchSystemV2.createEvaluationUI(match);
            }
            
        } catch (error) {
            console.error('Error starting evaluation:', error);
            UI.showNotification(error.message || 'Error al iniciar evaluación', 'error');
        }
    },

    /**
     * Open match evaluation - called by MatchManager (legacy compatibility)
     */
    async openMatchEvaluation(match) {
        if (!match) {
            UI.showNotification('Partido no encontrado para evaluación.', 'error');
            return;
        }

        // Set the current match for evaluation
        this.state.currentMatchForEvaluation = match.id;
        
        // Load the evaluate screen with this specific match
        await this.loadEvaluateScreen();
        
        UI.showNotification(`Evaluando partido del ${Utils.formatDate(match.date)}`, 'info');
    },

    /**
     * Load post-match evaluation screen
     */
    loadPostMatchEvaluationScreen() {
        const matchId = this.state.currentMatchForEvaluation;
        if (!matchId) {
            this.navigateToScreen('matches-screen');
            return;
        }

        const match = Storage.getMatchById(matchId);
        if (!match || match.status !== 'finalizado') {
            UI.showNotification('Partido no válido para evaluación.', 'error');
            this.navigateToScreen('matches-screen');
            return;
        }

        // Load players who participated in the match
        const allPlayers = Storage.getPlayers();
        const participatingPlayers = allPlayers.filter(p => 
            match.selectedPlayers.includes(p.id)
        );

        UI.displayPostMatchEvaluation(match, participatingPlayers);
    },

    /**
     * Save post-match player evaluation
     */
    async savePostMatchEvaluation(matchId, playerId, evaluation) {
        try {
            const match = Storage.getMatchById(matchId);
            if (!match) {
                throw new Error('Partido no encontrado');
            }

            const existingEvaluations = match.evaluations || [];
            const evaluationIndex = existingEvaluations.findIndex(e => e.playerId === playerId);

            const newEvaluation = {
                playerId: playerId,
                rating: evaluation.rating,
                performance: evaluation.performance,
                notes: evaluation.notes || '',
                evaluatedAt: new Date().toISOString()
            };

            if (evaluationIndex !== -1) {
                existingEvaluations[evaluationIndex] = newEvaluation;
            } else {
                existingEvaluations.push(newEvaluation);
            }

            const success = Storage.updateMatch(matchId, { 
                evaluations: existingEvaluations 
            });

            if (success) {
                UI.showNotification('Evaluación guardada exitosamente!', 'success');
                return true;
            } else {
                throw new Error('Error al guardar evaluación');
            }

        } catch (error) {
            console.error('Error saving post-match evaluation:', error);
            UI.showNotification('Error al guardar evaluación.', 'error');
            return false;
        }
    },

    /**
     * Show player selection UI
     */
    showPlayerSelection() {
        UI.showPlayerSelection();
    },

    /**
     * Get selected player IDs from UI
     */
    getSelectedPlayerIds() {
        return UI.getSelectedPlayerIds();
    }
};

// Mobile utilities for enhanced touch experience
const MobileUtils = {
    /**
     * Detect if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    },

    /**
     * Detect if device has touch capability
     */
    isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },

    /**
     * Add mobile-specific classes to body
     */
    addMobileClasses() {
        if (this.isMobile()) {
            document.body.classList.add('mobile-device');
        }
        if (this.isTouchDevice()) {
            document.body.classList.add('touch-device');
        }
        if (window.innerHeight < window.innerWidth && window.innerHeight < 500) {
            document.body.classList.add('landscape-mobile');
        }
    },

    /**
     * Handle mobile viewport height changes (for mobile browsers)
     */
    handleViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    },

    /**
     * Prevent zoom on double tap for iOS
     */
    preventDoubleZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    },

    /**
     * Add smooth scrolling behavior
     */
    addSmoothScrolling() {
        // Enable momentum scrolling on iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Improve scroll performance
        if (this.isTouchDevice()) {
            document.addEventListener('touchstart', function(){}, {passive: true});
            document.addEventListener('touchmove', function(){}, {passive: true});
        }
    },

    /**
     * Initialize mobile utilities
     */
    init() {
        this.addMobileClasses();
        this.handleViewportHeight();
        this.addSmoothScrolling();
        
        if (this.isTouchDevice()) {
            this.preventDoubleZoom();
        }

        // Update viewport height on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportHeight();
                this.addMobileClasses();
            }, 100);
        });

        // Update on window resize
        window.addEventListener('resize', () => {
            this.handleViewportHeight();
            this.addMobileClasses();
        });

        console.log('📱 Mobile utilities initialized');
    }
};

// Make App available globally for initialization
window.App = App;

// Auto-initialize mobile utilities when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileUtils.init();
    });
} else {
    MobileUtils.init();
}

