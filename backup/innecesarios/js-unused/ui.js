/**
 * UI Module - Handles all user interface operations
 * COHERENCE FIX 2024-12-XX: Removed trailing duplicated fragment after object close.
 * Added debugCheck() to detect structural issues.
 */
const UI = {
    // DOM Elements cache
    elements: {},

    /**
     * Initialize UI elements cache
     */
    init() {
        // Cache commonly used elements
        this.elements = {
            // Navigation
            navItems: document.querySelectorAll('.nav-item'),
            screens: document.querySelectorAll('.screen'),
            mainNavBar: document.getElementById('main-nav-bar'),
            
            // Loading
            loading: document.getElementById('loading'),
            
            // Player form elements
            playerForm: document.getElementById('player-form'),
            playerName: document.getElementById('player-name'),
            playerPosition: document.getElementById('player-position'),
            playerPhoto: document.getElementById('player-photo'),
            uploadTrigger: document.getElementById('upload-trigger'),
            photoPreview: document.getElementById('photo-preview'),
            previewPhoto: document.getElementById('preview-photo'),
            previewName: document.getElementById('preview-name'),
            previewPosition: document.getElementById('preview-position'),
            previewOvr: document.getElementById('preview-ovr'),
            
            // Stats screen
            playersGrid: document.getElementById('players-grid'),
            
            // Matches screen
            generateTeamsBtn: document.getElementById('generate-teams-btn'),
            teamsContainer: document.getElementById('teams-container'),
            matchList: document.getElementById('match-list'),
            
            // Evaluation screen
            playerSelector: document.getElementById('player-selector'),
            evaluationForm: document.getElementById('evaluation-form'),
            saveEvaluation: document.getElementById('save-evaluation'),
            
            // Ranking screen
            rankingList: document.getElementById('ranking-list'),
            
            // Modal
            playerDetailModal: document.getElementById('player-detail-modal'),
            closeModal: document.getElementById('close-modal'),
            playerDetail: document.getElementById('player-detail'),

            // NEW: Person setup elements
            personForm: document.getElementById('person-form'),
            personName: document.getElementById('person-name'),
            personEmail: document.getElementById('person-email'),
            personPhone: document.getElementById('person-phone'),
            personPhoto: document.getElementById('person-photo'),
            personUploadTrigger: document.getElementById('person-upload-trigger'),
            personPhotoPreview: document.getElementById('person-photo-preview'),
            
            // NEW: Group setup elements
            personGreeting: document.getElementById('person-greeting'),
            createGroupOption: document.getElementById('create-group-option'),
            joinGroupOption: document.getElementById('join-group-option'),
            
            // NEW: Group creation elements
            groupForm: document.getElementById('group-form'),
            groupName: document.getElementById('group-name'),
            groupDescription: document.getElementById('group-description'),
            groupSchedule: document.getElementById('group-schedule'),
            groupMaxMembers: document.getElementById('group-max-members'),
            groupPrivate: document.getElementById('group-private'),
            backToSetup: document.getElementById('back-to-setup'),
            backToSetup2: document.getElementById('back-to-setup-2'),
            
            // NEW: Join group elements
            groupCode: document.getElementById('group-code'),
            groupPreview: document.getElementById('group-preview'),
            searchGroup: document.getElementById('search-group'),
            joinGroupBtn: document.getElementById('join-group-btn'),
            
            // NEW: Group selector elements
            groupsList: document.getElementById('groups-list'),
            createAnotherGroup: document.getElementById('create-another-group'),
            joinAnotherGroup: document.getElementById('join-another-group'),
            
            // NEW: Group context elements
            groupContextHeaders: document.querySelectorAll('.group-context-header'),
            currentGroupName: document.getElementById('current-group-name'),
            currentPersonName: document.getElementById('current-person-name'),
            changeGroupBtn: document.getElementById('change-group-btn'),
            personMenuBtn: document.getElementById('person-menu-btn'),
            
            // NEW: Person menu modal
            personMenuModal: document.getElementById('person-menu-modal'),
            closePersonMenu: document.getElementById('close-person-menu'),
            personMenuAvatar: document.getElementById('person-menu-avatar'),
            personMenuName: document.getElementById('person-menu-name'),
            personMenuEmail: document.getElementById('person-menu-email'),
            changeGroupOption: document.getElementById('change-group-option'),
            manageGroupsOption: document.getElementById('manage-groups-option'),
            exportDataOption: document.getElementById('export-data-option'),
            logoutOption: document.getElementById('logout-option'),

            // NEW: Enhanced match elements
            selectPlayersBtn: document.getElementById('select-players-btn'),
            generateSelectedTeamsBtn: document.getElementById('generate-selected-teams-btn'),
            saveMatchBtn: document.getElementById('save-match-btn'),
            matchFormat: document.getElementById('match-format'),
            playerSelectionArea: document.getElementById('player-selection-area'),
            playerSelectionGrid: document.getElementById('player-selection-grid'),
            closeSelectionBtn: document.getElementById('close-selection-btn'),
            selectAllBtn: document.getElementById('select-all-btn'),
            clearSelectionBtn: document.getElementById('clear-selection-btn'),
            formatDisplay: document.getElementById('format-display'),
            playersNeeded: document.getElementById('players-needed'),
            playersSelected: document.getElementById('players-selected'),
            matchSaveSection: document.querySelector('.match-save-section')
        };

        this.initSliders();
        this.setupEventListeners();
        this.setupNewEventListeners();
    },

    /**
     * Initialize range sliders
     */
    initSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const valueElem = document.getElementById(`${slider.id}-value`);
            
            if (valueElem) {
                valueElem.textContent = slider.value;
            }
            
            slider.addEventListener('input', () => {
                if (valueElem) {
                    valueElem.textContent = slider.value;
                }
                this.updatePreview();
            });
        });
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.playerDetailModal) {
                this.hideModal();
            }
            if (e.target === this.elements.personMenuModal) {
                this.hidePersonMenu();
            }
        });

        // Close modal button
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Update preview on form changes
        if (this.elements.playerName) {
            this.elements.playerName.addEventListener('input', () => this.updatePreview());
        }
        if (this.elements.playerPosition) {
            this.elements.playerPosition.addEventListener('change', () => this.updatePreview());
        }
    },

    /**
     * NEW: Setup event listeners for new components
     */
    setupNewEventListeners() {
        // Player photo upload - Use App's handler exclusively
        if (this.elements.uploadTrigger && this.elements.playerPhoto) {
            this.elements.uploadTrigger.addEventListener('click', () => {
                this.elements.playerPhoto.click();
            });
        }

        // Person photo upload - Use App's handler exclusively  
        if (this.elements.personUploadTrigger && this.elements.personPhoto) {
            this.elements.personUploadTrigger.addEventListener('click', () => {
                this.elements.personPhoto.click();
            });
        }

        // Group setup options
        if (this.elements.createGroupOption) {
            this.elements.createGroupOption.addEventListener('click', () => {
                this.changeScreen('create-group-screen');
            });
        }

        if (this.elements.joinGroupOption) {
            this.elements.joinGroupOption.addEventListener('click', () => {
                this.changeScreen('join-group-screen');
            });
        }

        // Back buttons
        if (this.elements.backToSetup) {
            this.elements.backToSetup.addEventListener('click', () => {
                this.changeScreen('group-setup-screen');
            });
        }

        if (this.elements.backToSetup2) {
            this.elements.backToSetup2.addEventListener('click', () => {
                this.changeScreen('group-setup-screen');
            });
        }

        // Group code input formatting
        if (this.elements.groupCode) {
            this.elements.groupCode.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Person menu
        if (this.elements.personMenuBtn) {
            this.elements.personMenuBtn.addEventListener('click', () => {
                this.showPersonMenu();
            });
        }

        if (this.elements.closePersonMenu) {
            this.elements.closePersonMenu.addEventListener('click', () => {
                this.hidePersonMenu();
            });
        }

        if (this.elements.changeGroupBtn) {
            this.elements.changeGroupBtn.addEventListener('click', () => {
                this.changeScreen('group-selector-screen');
            });
        }

        // NEW: Match elements
        if (this.elements.selectPlayersBtn) {
            this.elements.selectPlayersBtn.addEventListener('click', () => {
                this.showPlayerSelection();
            });
        }

        if (this.elements.closeSelectionBtn) {
            this.elements.closeSelectionBtn.addEventListener('click', () => {
                this.hidePlayerSelection();
            });
        }

        if (this.elements.selectAllBtn) {
            this.elements.selectAllBtn.addEventListener('click', () => {
                this.selectAllPlayers();
            });
        }

        if (this.elements.clearSelectionBtn) {
            this.elements.clearSelectionBtn.addEventListener('click', () => {
                this.clearPlayerSelection();
            });
        }
    },

    /**
     * MODIFIED (COHERENCE FIX): Change active screen with enforced visibility
     * Forza el display para evitar que estilos (p.ej. .setup-screen {display:flex}) mantengan pantallas visibles.
     * @param {string} screenId - Screen ID to show
     */
    changeScreen(screenId) {
        // Enforce visibility for every screen
        this.elements.screens.forEach(screen => {
            const isTarget = screen.id === screenId;
            if (isTarget) {
                screen.classList.add('active');
                // Si es pantalla de setup la mostramos como flex, sino block
                const wantsFlex = screen.classList.contains('setup-screen');
                screen.style.display = wantsFlex ? 'flex' : 'block';
            } else {
                screen.classList.remove('active');
                screen.style.display = 'none';
            }
        });

        // Update navigation only for main screens
        const mainScreens = ['register-screen', 'stats-screen', 'matches-screen', 'evaluate-screen', 'ranking-screen'];
        if (mainScreens.includes(screenId)) {
            this.elements.navItems.forEach(item => {
                item.classList.toggle('active', item.dataset.screen === screenId);
            });
            if (this.elements.mainNavBar) this.elements.mainNavBar.style.display = 'flex';
        } else {
            if (this.elements.mainNavBar) this.elements.mainNavBar.style.display = 'none';
        }

        this.updateGroupContextHeaders();
    },

    /**
     * Show loading spinner with optional message
     */
    showLoading(message = 'Cargando...') {
        // Remove existing loading overlay
        this.hideLoading();
        
        // Create new loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        document.body.appendChild(loadingOverlay);
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        
        // Legacy support
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    },

    /**
     * Show skeleton loading for specific container
     */
    showSkeleton(containerId, type = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'players':
                skeletonHTML = this.generatePlayersSkeleton();
                break;
            case 'dashboard':
                skeletonHTML = this.generateDashboardSkeleton();
                break;
            case 'matches':
                skeletonHTML = this.generateMatchesSkeleton();
                break;
            case 'stats':
                skeletonHTML = this.generateStatsSkeleton();
                break;
            default:
                skeletonHTML = this.generateDefaultSkeleton();
                break;
        }
        
        container.innerHTML = skeletonHTML;
    },

    /**
     * Hide skeleton and show content
     */
    hideSkeleton(containerId, content = '') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (content) {
            container.innerHTML = content;
        } else {
            // Just remove skeleton class to stop animation
            const skeletons = container.querySelectorAll('.skeleton');
            skeletons.forEach(skeleton => {
                skeleton.classList.remove('skeleton');
            });
        }
    },

    /**
     * Generate players skeleton
     */
    generatePlayersSkeleton() {
        return Array(6).fill().map(() => `
            <div class="player-card" style="opacity: 0.7;">
                <div class="player-photo skeleton" style="width: 80px; height: 80px; border-radius: 50%;"></div>
                <div class="player-info">
                    <div class="skeleton skeleton-title" style="width: 120px;"></div>
                    <div class="skeleton skeleton-text" style="width: 80px;"></div>
                    <div class="skeleton skeleton-text" style="width: 60px;"></div>
                </div>
                <div class="player-ovr">
                    <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Generate dashboard skeleton
     */
    generateDashboardSkeleton() {
        return `
            <div class="dashboard-main-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="skeleton skeleton-text" style="width: 150px;"></div>
                    </div>
                    <div class="skeleton skeleton-card"></div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="skeleton skeleton-text" style="width: 120px;"></div>
                    </div>
                    <div class="skeleton skeleton-card"></div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="skeleton skeleton-text" style="width: 140px;"></div>
                    </div>
                    <div class="skeleton skeleton-card"></div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="skeleton skeleton-text" style="width: 130px;"></div>
                    </div>
                    <div class="stats-summary-grid">
                        ${Array(4).fill().map(() => `
                            <div class="mini-stat">
                                <div class="skeleton" style="width: 40px; height: 30px; margin: 0 auto 10px;"></div>
                                <div class="skeleton skeleton-text" style="width: 80px; margin: 0 auto;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Generate matches skeleton
     */
    generateMatchesSkeleton() {
        return Array(4).fill().map(() => `
            <div class="match-card" style="opacity: 0.7;">
                <div class="match-teams">
                    <div class="team">
                        <div class="skeleton skeleton-text" style="width: 100px;"></div>
                        <div class="skeleton skeleton-text" style="width: 60px;"></div>
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="team">
                        <div class="skeleton skeleton-text" style="width: 100px;"></div>
                        <div class="skeleton skeleton-text" style="width: 60px;"></div>
                    </div>
                </div>
                <div class="match-info">
                    <div class="skeleton skeleton-text" style="width: 80px;"></div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Generate stats skeleton
     */
    generateStatsSkeleton() {
        return `
            <div class="stats-table">
                <div class="table-header">
                    <div class="skeleton skeleton-text" style="width: 100px;"></div>
                    <div class="skeleton skeleton-text" style="width: 80px;"></div>
                    <div class="skeleton skeleton-text" style="width: 60px;"></div>
                    <div class="skeleton skeleton-text" style="width: 70px;"></div>
                </div>
                ${Array(8).fill().map(() => `
                    <div class="table-row">
                        <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                        <div class="skeleton skeleton-text" style="width: 120px;"></div>
                        <div class="skeleton skeleton-text" style="width: 40px;"></div>
                        <div class="skeleton skeleton-text" style="width: 50px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Generate default skeleton
     */
    generateDefaultSkeleton() {
        return `
            <div style="padding: 20px;">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        `;
    },

    /**
     * Update player preview card
     */
    updatePreview() {
        if (!this.elements.playerName || !this.elements.playerPosition) return;
        
        const name = this.elements.playerName.value || 'Nombre del Jugador';
        const position = this.elements.playerPosition.value || 'POS';
        
        // Calculate OVR
        const attributes = {
            pac: parseInt(document.getElementById('pac')?.value || 50),
            sho: parseInt(document.getElementById('sho')?.value || 50),
            pas: parseInt(document.getElementById('pas')?.value || 50),
            dri: parseInt(document.getElementById('dri')?.value || 50),
            def: parseInt(document.getElementById('def')?.value || 50),
            phy: parseInt(document.getElementById('phy')?.value || 50)
        };
        
        const ovr = Utils.calculateOvr(attributes);
        
        if (this.elements.previewName) this.elements.previewName.textContent = name;
        if (this.elements.previewPosition) this.elements.previewPosition.textContent = position;
        if (this.elements.previewOvr) this.elements.previewOvr.textContent = ovr;
    },

    /**
     * Create player card HTML with edit mode support
     * @param {Object} player - Player object
     * @param {boolean} editMode - Whether edit mode is active
     * @returns {HTMLElement} Player card element
     */
    createPlayerCard(player, editMode = false) {
        const card = document.createElement('div');
        const isEnhancedMode = document.body.classList.contains('stats-enhancement');
        
        card.className = 'player-card';
        if (editMode) {
            card.className += ' edit-mode';
        }
        
        // Add top performer class for high OVR players in enhanced mode
        if (isEnhancedMode && player.ovr >= 85) {
            card.className += ' top-performer';
        }
        
        card.dataset.playerId = player.id;
        
        if (isEnhancedMode && !editMode) {
            // Enhanced Card Layout
            const topStats = this.getTopPlayerStats(player);
            
            card.innerHTML = `
                <div class="player-card-content">
                    <div class="player-header">
                        <div class="player-name">${player.name}</div>
                        <div class="player-ovr">${player.ovr}</div>
                    </div>
                    
                    <div class="player-position-info">
                        <div class="player-position ${player.position}">${player.position}</div>
                    </div>
                    
                    <div class="player-stats">
                        ${topStats.map(stat => `
                            <div class="stat-item" title="${this.getStatFullName(stat.name)}">
                                <div class="stat-icon">
                                    <i class="bx ${this.getStatIcon(stat.name)}"></i>
                                </div>
                                <div class="stat-label">${stat.name}</div>
                                <div class="stat-value">${stat.value}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="player-actions">
                        <button class="player-action-btn" onclick="UI.showPlayerDetail(${JSON.stringify(player).replace(/"/g, '&quot;')})">
                            VER
                        </button>
                        <button class="player-action-btn history-btn" onclick="UI.showPlayerHistory('${player.id}', '${player.name}')" title="Ver historial">
                            <i class='bx bx-history'></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Classic Card Layout
            let photoHtml = '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';
            if (player.photo) {
                photoHtml = `<img src="${player.photo}" alt="${player.name}">`;
            }
            
            const deleteCheckbox = editMode ? `
                <div class="delete-checkbox">
                    <input type="checkbox" id="delete-${player.id}" data-player-id="${player.id}">
                    <label for="delete-${player.id}"></label>
                </div>
            ` : '';
            
            const deleteButton = editMode ? `
                <button class="quick-delete-btn" onclick="App.confirmDeletePlayer('${player.id}')" title="Eliminar jugador">
                    <i class='bx bx-trash'></i>
                </button>
            ` : '';
            
            // Add position and legendary classes for player card style
            const position = player.position.toLowerCase();
            const isLegendary = player.ovr >= 90;
            card.className += ` ${position}${isLegendary ? ' legendary' : ''}`;
            
            // Get top 3 stats for player card display
            const topStats = this.getTopPlayerStats(player);
            
            const playerPhotoHtml = player.photo ? 
                `<img src="${player.photo}" alt="${player.name}">` :
                `<i class='bx bx-user'></i>`;
            
            // Check if mobile view
            const isMobile = window.innerWidth <= 480;
            
            if (isMobile) {
                // Mobile optimized layout
                card.innerHTML = `
                    ${deleteCheckbox}
                    <div class="player-card-content">
                        <div class="player-position ${position}">${player.position}</div>
                        <div class="player-ovr">${player.ovr}</div>
                        <div class="player-photo">${playerPhotoHtml}</div>
                        <div class="mobile-player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-stats">
                                ${topStats.slice(0, 3).map(stat => `
                                    <div class="player-stat">
                                        <div class="player-stat-value">${stat.value}</div>
                                        <div class="player-stat-label">${stat.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ${!editMode ? `
                            <div class="player-actions">
                                <button class="player-history-btn" onclick="UI.showPlayerHistory('${player.id}', '${player.name}')" title="Ver historial">
                                    <i class='bx bx-history'></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    ${deleteButton}
                `;
            } else {
                // Desktop layout (original)
                card.innerHTML = `
                    ${deleteCheckbox}
                    <div class="player-card-content">
                        <div class="player-ovr">${player.ovr}</div>
                        <div class="player-position ${position}">${player.position}</div>
                        <div class="player-photo">${playerPhotoHtml}</div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">
                            ${topStats.slice(0, 3).map(stat => `
                                <div class="player-stat">
                                    <div class="player-stat-value">${stat.value}</div>
                                    <div class="player-stat-label">${stat.name}</div>
                                </div>
                            `).join('')}
                        </div>
                        ${!editMode ? `
                            <div class="player-actions">
                                <button class="player-history-btn" onclick="UI.showPlayerHistory('${player.id}', '${player.name}')" title="Ver historial">
                                    <i class='bx bx-history'></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    ${deleteButton}
                `;
            }
        }
        
        return card;
    },

    /**
     * Get top 6 stats for enhanced display
     */
    getTopPlayerStats(player) {
        const attributes = player.attributes || {};
        const statsArray = [
            { name: 'PAC', value: attributes.pac || 0 },
            { name: 'SHO', value: attributes.sho || 0 },
            { name: 'PAS', value: attributes.pas || 0 },
            { name: 'DRI', value: attributes.dri || 0 },
            { name: 'DEF', value: attributes.def || 0 },
            { name: 'PHY', value: attributes.phy || 0 }
        ];
        
        return statsArray;
    },

    /**
     * Get stat icon for enhanced display
     */
    getStatIcon(statName) {
        const icons = {
            'PAC': 'bx-run',
            'SHO': 'bx-football', 
            'PAS': 'bx-transfer',
            'DRI': 'bx-trending-up',
            'DEF': 'bx-shield',
            'PHY': 'bx-body'
        };
        return icons[statName] || 'bx-stats';
    },

    /**
     * Get stat full name for tooltips
     */
    getStatFullName(statName) {
        const names = {
            'PAC': 'Velocidad',
            'SHO': 'Tiro',
            'PAS': 'Pase', 
            'DRI': 'Regate',
            'DEF': 'Defensa',
            'PHY': 'Físico'
        };
        return names[statName] || statName;
    },

    /**
     * Display players in grid with edit mode support
     * @param {Array} players - Array of player objects
     * @param {boolean} editMode - Whether edit mode is active
     */
    displayPlayers(players, editMode = false) {
        if (!this.elements.playersGrid) return;
        
        this.elements.playersGrid.innerHTML = '';
        
        if (players.length === 0) {
            this.elements.playersGrid.innerHTML = `
                <p style="text-align: center; padding: 20px; grid-column: 1 / -1;">
                    No hay jugadores registrados aún.
                </p>
            `;
            return;
        }
        
        players.forEach(player => {
            const playerCard = this.createPlayerCard(player, editMode);
            
            if (!editMode) {
                playerCard.addEventListener('click', () => {
                    this.showPlayerDetail(player);
                });
            }
            
            this.elements.playersGrid.appendChild(playerCard);
        });
        
        // Add cleanup duplicates button (only show in non-edit mode and if players > 10)
        if (!editMode && players.length > 10) {
            this.addCleanupDuplicatesButton();
        }
    },

    /**
     * Add cleanup duplicates button to stats screen
     */
    addCleanupDuplicatesButton() {
        // Check if button already exists
        if (document.getElementById('cleanup-duplicates-btn')) return;
        
        const cleanupContainer = document.createElement('div');
        cleanupContainer.className = 'cleanup-container';
        cleanupContainer.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            margin-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        cleanupContainer.innerHTML = `
            <div style="margin-bottom: 10px; color: #888; font-size: 0.9rem;">
                <i class='bx bx-info-circle'></i>
                ¿Ves jugadores duplicados? Limpia la base de datos
            </div>
            <button id="cleanup-duplicates-btn" class="btn btn-warning" style="background: linear-gradient(135deg, #ff6b35, #f7931e); border: none; color: white;">
                <i class='bx bx-broom'></i> Limpiar Duplicados
            </button>
        `;
        
        this.elements.playersGrid.appendChild(cleanupContainer);
        
        // Add event listener
        const cleanupBtn = document.getElementById('cleanup-duplicates-btn');
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', async () => {
                this.handleCleanupDuplicates();
            });
        }
    },

    /**
     * Handle cleanup duplicates button click
     */
    async handleCleanupDuplicates() {
        const confirmMsg = '¿Estás seguro de que quieres limpiar jugadores duplicados?\n\nEsto eliminará jugadores con el mismo nombre, manteniendo solo el primero de cada uno.\n\nEsta acción no se puede deshacer.';
        
        if (!confirm(confirmMsg)) return;
        
        try {
            this.showLoading();
            this.showNotification('🧹 Limpiando jugadores duplicados...', 'info');
            
            const success = await Storage.cleanDuplicatePlayers();
            
            if (success) {
                this.showNotification('✅ Limpieza de duplicados completada exitosamente', 'success');
                
                // Reload the players display
                setTimeout(() => {
                    const players = Storage.getPlayers();
                    this.displayPlayers(players, false);
                }, 1000);
            } else {
                this.showNotification('❌ Error al limpiar duplicados', 'error');
            }
        } catch (error) {
            console.error('Error cleaning duplicates:', error);
            this.showNotification('❌ Error al limpiar duplicados: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Show player detail modal
     * @param {Object} player - Player object
     */
    showPlayerDetail(player) {
        if (!this.elements.playerDetail || !this.elements.playerDetailModal) return;
        
        this.elements.playerDetail.innerHTML = `
            <div class="player-detail-header">
                <div class="player-detail-photo">
                    ${player.photo ? 
                        `<img src="${player.photo}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                        '<div style="width:100%; height:100%; background:#1a1a1a; display:flex; align-items:center; justify-content:center; border-radius:50%;"><i class="bx bx-user" style="font-size:2rem; color:var(--primary-color);"></i></div>'
                    }
                </div>
                <div class="player-detail-info">
                    <div class="player-detail-name">${player.name}</div>
                    <div class="player-detail-position">${player.position}</div>
                </div>
                <div class="player-detail-ovr">${player.ovr}</div>
            </div>
            
            <div class="player-detail-stats">
                ${this.createStatBars(player.attributes)}
            </div>
        `;
        
        this.elements.playerDetailModal.style.display = 'block';
        
        // Animate stat bars
        setTimeout(() => {
            this.animateStatBars(player.attributes);
        }, 100);
    },

    /**
     * Show player history screen
     * @param {string} playerId - Player ID
     * @param {string} playerName - Player name
     */
    showPlayerHistory(playerId, playerName) {
        // Update header
        const headerElement = document.getElementById('history-player-name');
        if (headerElement) {
            headerElement.textContent = playerName;
        }

        // Navigate to history screen
        App.navigateToScreen('player-history-screen');

        // Load player history
        if (typeof PlayerHistory !== 'undefined') {
            PlayerHistory.loadPlayerHistory(playerId);
        } else {
            console.error('PlayerHistory module not loaded');
        }
    },

    /**
     * Create stat bars HTML
     * @param {Object} attributes - Player attributes
     * @returns {string} HTML string
     */
    createStatBars(attributes) {
        const statLabels = {
            pac: 'Ritmo (PAC)',
            sho: 'Tiro (SHO)',
            pas: 'Pase (PAS)',
            dri: 'Regate (DRI)',
            def: 'Defensa (DEF)',
            phy: 'Físico (PHY)'
        };

        return Object.entries(statLabels).map(([key, label]) => `
            <div class="detail-stat">
                <div class="detail-stat-label">
                    <span class="detail-stat-name">${label}</span>
                    <span class="detail-stat-value">${attributes[key]}</span>
                </div>
                <div class="stat-bar-container">
                    <div class="stat-bar" data-stat="${key}" style="width:0%"></div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Animate stat bars
     * @param {Object} attributes - Player attributes
     */
    animateStatBars(attributes) {
        if (!this.elements.playerDetail) return;
        
        const statBars = this.elements.playerDetail.querySelectorAll('.stat-bar');
        
        statBars.forEach(bar => {
            const statKey = bar.dataset.stat;
            const value = attributes[statKey];
            bar.style.width = `${value}%`;
        });
    },

    /**
     * Hide player detail modal
     */
    hideModal() {
        if (this.elements.playerDetailModal) {
            this.elements.playerDetailModal.style.display = 'none';
        }
    },

    /**
     * Reset form to initial state
     */
    resetForm() {
        if (this.elements.playerForm) {
            // Clear file input manually to prevent change events
            if (this.elements.playerPhoto) {
                this.elements.playerPhoto.value = '';
            }
            this.elements.playerForm.reset();
        }
        
        // Reset photo previews
        if (this.elements.photoPreview) {
            this.elements.photoPreview.innerHTML = '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';
        }
        if (this.elements.previewPhoto) {
            this.elements.previewPhoto.innerHTML = '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';
        }
        
        // Reset preview text
        if (this.elements.previewName) this.elements.previewName.textContent = 'Nombre del Jugador';
        if (this.elements.previewPosition) this.elements.previewPosition.textContent = 'POS';
        if (this.elements.previewOvr) this.elements.previewOvr.textContent = '50';
        
        // Reset sliders
        const sliders = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
        sliders.forEach(stat => {
            document.getElementById(stat).value = 50;
            document.getElementById(`${stat}-value`).textContent = 50;
        });
    },

    /**
     * DEPRECATED: Person photo upload is now handled by App.js with Supabase
     */
    // Removed to prevent conflicts with App.handlePersonPhotoUpload

    /**
     * NEW: Update person greeting
     */
    updatePersonGreeting(person) {
        if (this.elements.personGreeting && person && person.name) {
            this.elements.personGreeting.textContent = person.name;
        }
    },

    /**
     * NEW: Create group card element
     */
    createGroupCard(group) {
        const memberCount = Storage.getPersonsInGroup(group.id).length;
        
        const card = document.createElement('div');
        card.className = 'group-card';
        card.dataset.groupId = group.id;
        
        card.innerHTML = `
            <div class="group-card-content">
                <div class="group-card-header">
                    <div>
                        <div class="group-card-title">${group.name}</div>
                    </div>
                    <div class="group-card-code">${group.code}</div>
                </div>
                <div class="group-card-description">${group.description}</div>
                <div class="group-card-meta">
                    <div class="group-schedule">
                        <i class='bx bx-time'></i>
                        <span>${Utils.formatSchedule(group.schedule)}</span>
                    </div>
                    <div class="group-members">
                        <i class='bx bx-group'></i>
                        <span>${Utils.formatMemberCount(memberCount)}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },

    /**
     * NEW: Display groups list
     */
    displayGroups(groups, onGroupSelect) {
        if (!this.elements.groupsList) return;
        
        this.elements.groupsList.innerHTML = '';
        
        if (groups.length === 0) {
            this.elements.groupsList.innerHTML = `
                <p style="text-align: center; padding: 20px; grid-column: 1 / -1;">
                    No tienes acceso a ningún grupo aún.
                </p>
            `;
            return;
        }
        
        groups.forEach(group => {
            const groupCard = this.createGroupCard(group);
            groupCard.addEventListener('click', () => {
                if (onGroupSelect) onGroupSelect(group);
            });
            this.elements.groupsList.appendChild(groupCard);
        });
    },

    /**
     * NEW: Show group preview
     */
    showGroupPreview(group) {
        if (!this.elements.groupPreview) return;
        
        const memberCount = Storage.getPersonsInGroup(group.id).length;
        
        this.elements.groupPreview.innerHTML = `
            <div class="preview-header">
                <div class="preview-title">${group.name}</div>
                <div class="preview-code">${group.code}</div>
            </div>
            <div class="preview-description">${group.description}</div>
            <div class="preview-meta">
                <div class="group-schedule">
                    <i class='bx bx-time'></i>
                    <span>${Utils.formatSchedule(group.schedule)}</span>
                </div>
                <div class="group-members">
                    <i class='bx bx-group'></i>
                    <span>${Utils.formatMemberCount(memberCount)}</span>
                </div>
            </div>
        `;
        
        this.elements.groupPreview.style.display = 'block';
        if (this.elements.joinGroupBtn) {
            this.elements.joinGroupBtn.style.display = 'block';
        }
    },

    /**
     * NEW: Hide group preview
     */
    hideGroupPreview() {
        if (this.elements.groupPreview) {
            this.elements.groupPreview.style.display = 'none';
        }
        if (this.elements.joinGroupBtn) {
            this.elements.joinGroupBtn.style.display = 'none';
        }
    },

    /**
     * NEW: Update group context headers
     */
    updateGroupContextHeaders() {
        const currentGroup = Storage.getCurrentGroup();
        const currentPerson = Storage.getCurrentPerson();
        
        // Update all group name displays
        const groupNameElements = [
            'current-group-name',
            'stats-group-name', 
            'matches-group-name',
            'evaluate-group-name',
            'ranking-group-name'
        ];
        
        groupNameElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = currentGroup ? currentGroup.name : 'Sin Grupo';
            }
        });
        
        // Update person name
        if (this.elements.currentPersonName && currentPerson) {
            this.elements.currentPersonName.textContent = currentPerson.name;
        }
    },

    /**
     * NEW: Show person menu modal
     */
    showPersonMenu() {
        const currentPerson = Storage.getCurrentPerson();
        if (!currentPerson || !this.elements.personMenuModal) return;
        
        // Update person info in menu
        if (this.elements.personMenuName) {
            this.elements.personMenuName.textContent = currentPerson.name;
        }
        if (this.elements.personMenuEmail) {
            this.elements.personMenuEmail.textContent = currentPerson.email;
        }
        
        // Update avatar
        if (this.elements.personMenuAvatar) {
            if (currentPerson.avatar) {
                this.elements.personMenuAvatar.innerHTML = `<img src="${currentPerson.avatar}" alt="${currentPerson.name}">`;
            } else {
                this.elements.personMenuAvatar.innerHTML = '<i class="bx bx-user"></i>';
            }
        }
        
        this.elements.personMenuModal.style.display = 'block';
    },

    /**
     * NEW: Hide person menu modal
     */
    hidePersonMenu() {
        if (this.elements.personMenuModal) {
            this.elements.personMenuModal.style.display = 'none';
        }
    },

    /**
     * NEW: Search group by code
     */
    findGroupByCode(code) {
        if (!code || code.length !== 6) return null;
        
        const groups = Storage.getGroups();
        return groups.find(group => group.code.toUpperCase() === code.toUpperCase());
    },

    /**
     * NEW: Reset forms
     */
    resetPersonForm() {
        if (this.elements.personForm) {
            this.elements.personForm.reset();
        }
        if (this.elements.personPhotoPreview) {
            this.elements.personPhotoPreview.innerHTML = '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';
        }
    },

    resetGroupForm() {
        if (this.elements.groupForm) {
            this.elements.groupForm.reset();
        }
        if (this.elements.groupMaxMembers) {
            this.elements.groupMaxMembers.value = '20';
        }
        if (this.elements.groupPrivate) {
            this.elements.groupPrivate.checked = false;
        }
    },

    resetJoinGroupForm() {
        if (this.elements.groupCode) {
            this.elements.groupCode.value = '';
        }
        this.hideGroupPreview();
    },

    /**
     * Show notification message
     */
    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    },

    /**
     * NEW: Validate setup screens navigation
     */
    getValidatedScreen() {
        const setupStatus = Utils.getSetupStatus();
        
        if (setupStatus.needsPersonSetup) {
            return 'person-setup-screen';
        } else if (setupStatus.needsGroupSetup) {
            return 'group-setup-screen';
        } else {
            return 'register-screen';
        }
    },

    /**
     * NEW: Show setup completion message
     * @param {Object} person - Person object
     * @param {Object} group - Group object
     */
    showSetupComplete(person, group) {
        this.showNotification(
            `¡Bienvenido ${person.name}! Tu grupo "${group.name}" está listo para usar.`,
            'success'
        );
    },

    /**
     * NEW: Show group creation success
     * @param {Object} group - Created group object
     */
    showGroupCreated(group) {
        this.showNotification(
            `Grupo "${group.name}" creado exitosamente. Código: ${group.code}`,
            'success'
        );
    },

    /**
     * NEW: Show group join success
     * @param {Object} group - Joined group object
     */
    showGroupJoined(group) {
        this.showNotification(
            `Te has unido al grupo "${group.name}" exitosamente.`,
            'success'
        );
    },

    /**
     * NEW: Display player selection interface
     */
    showPlayerSelection() {
        const players = Storage.getPlayers();
        const format = this.elements.matchFormat?.value || '5v5';
        const playersNeeded = format === '5v5' ? 10 : 14;
        
        if (players.length < playersNeeded) {
            this.showNotification(`Se necesitan al menos ${playersNeeded} jugadores para ${format}.`, 'warning');
            return;
        }
        
        // Update format info
        if (this.elements.formatDisplay) {
            this.elements.formatDisplay.textContent = `Formato: ${format}`;
        }
        if (this.elements.playersNeeded) {
            this.elements.playersNeeded.textContent = `Jugadores necesarios: ${playersNeeded}`;
        }
        
        // Display players
        this.displayPlayersForSelection(players);
        
        // Show selection area
        if (this.elements.playerSelectionArea) {
            this.elements.playerSelectionArea.style.display = 'block';
        }
        
        this.updateSelectionCounter();
    },

    /**
     * NEW: Display players in selection grid
     */
    displayPlayersForSelection(players) {
        if (!this.elements.playerSelectionGrid) return;
        
        this.elements.playerSelectionGrid.innerHTML = '';
        
        players.forEach(player => {
            const card = document.createElement('div');
            card.className = 'player-selection-card';
            card.dataset.playerId = player.id;
            
            const photoHtml = player.photo ? 
                `<img src="${player.photo}" alt="${player.name}">` : 
                '<i class="bx bx-user"></i>';
            
            card.innerHTML = `
                <div class="player-selection-content">
                    <div class="selection-player-photo">${photoHtml}</div>
                    <div class="selection-player-info">
                        <div class="selection-player-name">${player.name}</div>
                        <div class="selection-player-position">${player.position}</div>
                    </div>
                    <div class="selection-player-ovr">${player.ovr}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.togglePlayerSelection(card, player.id);
            });
            
            this.elements.playerSelectionGrid.appendChild(card);
        });
    },

    /**
     * NEW: Toggle player selection
     */
    togglePlayerSelection(card, playerId) {
        const format = this.elements.matchFormat?.value || '5v5';
        const maxPlayers = format === '5v5' ? 10 : 14;
        const selectedCards = this.elements.playerSelectionGrid.querySelectorAll('.selected');
        
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
        } else {
            if (selectedCards.length >= maxPlayers) {
                this.showNotification(`Solo puedes seleccionar ${maxPlayers} jugadores para ${format}.`, 'warning');
                return;
            }
            card.classList.add('selected');
        }
        
        this.updateSelectionCounter();
    },

    /**
     * NEW: Update selection counter and enable/disable button
     */
    updateSelectionCounter() {
        const selectedCards = this.elements.playerSelectionGrid?.querySelectorAll('.selected') || [];
        const selectedCount = selectedCards.length;
        const format = this.elements.matchFormat?.value || '5v5';
        const neededCount = format === '5v5' ? 10 : 14;
        
        if (this.elements.playersSelected) {
            this.elements.playersSelected.textContent = `Seleccionados: ${selectedCount}`;
        }
        
        // Enable/disable generate button
        if (this.elements.generateSelectedTeamsBtn) {
            this.elements.generateSelectedTeamsBtn.disabled = selectedCount < neededCount;
            
            if (selectedCount >= neededCount) {
                this.elements.generateSelectedTeamsBtn.textContent = `Generar Equipos (${selectedCount})`;
            } else {
                this.elements.generateSelectedTeamsBtn.textContent = `Generar Equipos (${neededCount - selectedCount} más)`;
            }
        }
    },

    /**
     * NEW: Select all players
     */
    selectAllPlayers() {
        const format = this.elements.matchFormat?.value || '5v5';
        const maxPlayers = format === '5v5' ? 10 : 14;
        const allCards = this.elements.playerSelectionGrid?.querySelectorAll('.player-selection-card') || [];
        
        // Clear current selection
        allCards.forEach(card => card.classList.remove('selected'));
        
        // Select first N players
        for (let i = 0; i < Math.min(maxPlayers, allCards.length); i++) {
            allCards[i].classList.add('selected');
        }
        
        this.updateSelectionCounter();
    },

    /**
     * NEW: Clear all selection
     */
    clearPlayerSelection() {
        const allCards = this.elements.playerSelectionGrid?.querySelectorAll('.player-selection-card') || [];
        allCards.forEach(card => card.classList.remove('selected'));
        this.updateSelectionCounter();
    },

    /**
     * NEW: Hide player selection area
     */
    hidePlayerSelection() {
        if (this.elements.playerSelectionArea) {
            this.elements.playerSelectionArea.style.display = 'none';
        }
    },

    /**
     * NEW: Get selected player IDs
     */
    getSelectedPlayerIds() {
        const selectedCards = this.elements.playerSelectionGrid?.querySelectorAll('.selected') || [];
        return Array.from(selectedCards).map(card => card.dataset.playerId);
    },

    // NEW: Structural debug helper
    debugCheck() {
        const required = [
            'changeScreen','showNotification','resetForm',
            'createGroupCard','displayGroups','findGroupByCode'
        ];
        const missing = required.filter(k => typeof this[k] !== 'function');
        if (missing.length) {
            console.error('[UI.debugCheck] Métodos faltantes:', missing);
        }
    },

    /**
     * ENHANCED: Complete Player Selection System
     */
    enhancePlayerSelection() {
        // Add search functionality
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPlayerCards(e.target.value);
            });
        }

        // Add position filter
        const positionFilter = document.getElementById('position-filter');
        if (positionFilter) {
            positionFilter.addEventListener('change', () => {
                this.applyPlayerFilters();
            });
        }

        // Add sort functionality
        const sortSelect = document.getElementById('sort-players');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortPlayerCards(e.target.value);
            });
        }

        // Select all button
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('#player-selection-grid input[type="checkbox"]:not(:disabled)');
                checkboxes.forEach(cb => {
                    cb.checked = true;
                    cb.closest('.selectable-player-card').classList.add('selected');
                });
                this.updateSelectionCounter();
            });
        }

        // Clear selection button
        const clearBtn = document.getElementById('clear-selection-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('#player-selection-grid input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = false;
                    cb.closest('.selectable-player-card').classList.remove('selected');
                });
                this.updateSelectionCounter();
            });
        }

        // Close selection area
        const closeBtn = document.getElementById('close-selection-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const selectionArea = document.getElementById('player-selection-area');
                if (selectionArea) {
                    selectionArea.style.display = 'none';
                }
            });
        }
    },

    filterPlayerCards(searchTerm) {
        const cards = document.querySelectorAll('.selectable-player-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.player-name').textContent.toLowerCase();
            const position = card.querySelector('.player-position').textContent.toLowerCase();
            
            if (name.includes(term) || position.includes(term)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    },

    applyPlayerFilters() {
        const positionFilter = document.getElementById('position-filter')?.value;
        const searchTerm = document.getElementById('player-search')?.value || '';
        const cards = document.querySelectorAll('.selectable-player-card');
        
        cards.forEach(card => {
            const position = card.querySelector('.player-position').textContent;
            const name = card.querySelector('.player-name').textContent.toLowerCase();
            
            const matchesPosition = !positionFilter || position === positionFilter;
            const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
            
            if (matchesPosition && matchesSearch) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    },

    sortPlayerCards(criteria) {
        const grid = document.getElementById('player-selection-grid');
        if (!grid) return;
        
        const cards = Array.from(grid.children);
        
        cards.sort((a, b) => {
            const getOvr = (card) => parseInt(card.querySelector('.player-ovr').textContent);
            const getName = (card) => card.querySelector('.player-name').textContent;
            
            switch(criteria) {
                case 'ovr-desc':
                    return getOvr(b) - getOvr(a);
                case 'ovr-asc':
                    return getOvr(a) - getOvr(b);
                case 'name-asc':
                    return getName(a).localeCompare(getName(b));
                case 'name-desc':
                    return getName(b).localeCompare(getName(a));
                default:
                    return 0;
            }
        });
        
        grid.innerHTML = '';
        cards.forEach(card => grid.appendChild(card));
    },

    /**
     * Recarga las tarjetas de jugadores (útil para responsive)
     */
    reloadPlayerCards() {
        // Reload the stats screen to refresh player cards
        if (typeof App !== 'undefined' && App.loadStatsScreen) {
            try {
                App.loadStatsScreen();
            } catch (error) {
                console.error('Error reloading player cards:', error);
            }
        }
    }
}; // <- ÚNICO CIERRE DEL OBJETO UI

// Setup resize listener para responsive
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Solo recargar si cambió de mobile/desktop
        const wasMobile = document.body.dataset.wasMobile === 'true';
        const isMobile = window.innerWidth <= 480;
        
        if (wasMobile !== isMobile) {
            document.body.dataset.wasMobile = isMobile.toString();
            if (typeof UI !== 'undefined' && UI.reloadPlayerCards) {
                UI.reloadPlayerCards();
            }
        }
    }, 300);
});

// Inicializar estado mobile
document.body.dataset.wasMobile = (window.innerWidth <= 480).toString();

// Exposición explícita para compatibilidad
if (typeof window !== 'undefined') {
    window.UI = UI;
}
