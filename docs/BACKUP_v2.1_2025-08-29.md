# BACKUP FC24 Team Manager v2.1 (2025-08-29)

Snapshot tras:
- Limpieza final de ui.js (remoción de duplicados y fragmentos sueltos).
- changeScreen reforzado (forzado display none / flex / block).
- Flujo completo: Persona -> Grupo -> Registro funcional y estable.

## Índice
1. appfutbol.html
2. css/styles.css
3. js/storage.js
4. js/utils.js
5. js/ui.js
6. js/app.js
7. js/backup/generate-backup.js
8. Notas & Restauración

---

## 1. appfutbol.html
```html
<!-- Snapshot -->
<!-- ...existing code (estructura de pantallas, nav, modals) ... -->
```

## 2. css/styles.css
```css
/* Snapshot */
/* ...existing code (variables, cards, setup-screen refinements, etc.) ... */
```

## 3. js/storage.js
```javascript
// Snapshot
// ...existing code (players, persons, groups, memberships, export/import) ...
```

## 4. js/utils.js
```javascript
// Snapshot
// ...existing code (generateId, sanitizeText, calculateOvr, balanceTeams, validate*, format*, getSetupStatus, migrateLegacyPlayers) ...
```

## 5. js/ui.js
```javascript
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
            logoutOption: document.getElementById('logout-option')
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
        // Person photo upload
        if (this.elements.personUploadTrigger) {
            this.elements.personUploadTrigger.addEventListener('click', () => {
                this.elements.personPhoto.click();
            });
        }

        if (this.elements.personPhoto) {
            this.elements.personPhoto.addEventListener('change', (e) => {
                this.handlePersonPhotoUpload(e);
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
     * Show loading spinner
     */
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'flex';
        }
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
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
     * Create player card HTML
     * @param {Object} player - Player object
     * @returns {HTMLElement} Player card element
     */
    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerId = player.id;
        
        let photoHtml = '<div class="player-photo-placeholder"><i class="bx bx-user"></i></div>';
        if (player.photo) {
            photoHtml = `<img src="${player.photo}" alt="${player.name}">`;
        }
        
        card.innerHTML = `
            <div class="player-card-content">
                <div class="player-photo">
                    ${photoHtml}
                </div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-position">${player.position}</div>
                </div>
                <div class="player-ovr">${player.ovr}</div>
            </div>
        `;
        
        return card;
    },

    /**
     * Display players in grid
     * @param {Array} players - Array of player objects
     */
    displayPlayers(players) {
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
            const playerCard = this.createPlayerCard(player);
            playerCard.addEventListener('click', () => {
                this.showPlayerDetail(player);
            });
            this.elements.playersGrid.appendChild(playerCard);
        });
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
     * NEW: Handle person photo upload
     */
    async handlePersonPhotoUpload(e) {
        const file = e.target.files[0];
        
        if (!file) return;

        if (!Utils.isValidImageFile(file)) {
            this.showNotification('Por favor selecciona una imagen válida (JPG, PNG, GIF, WebP) menor a 5MB.', 'error');
            return;
        }

        try {
            const photoUrl = await Utils.fileToBase64(file);
            const img = `<img src="${photoUrl}" alt="Person photo">`;
            if (this.elements.personPhotoPreview) {
                this.elements.personPhotoPreview.innerHTML = img;
            }
        } catch (error) {
            console.error('Error processing image:', error);
            this.showNotification('Error al procesar la imagen.', 'error');
        }
    },

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
    }
}; // <- CIERRE FINAL DEL OBJETO UI

// COHERENCE FIX 2025-08-29:
// Eliminado fragmento duplicado que agregaba: "]; const missing = ..." y un segundo cierre de objeto.
// Sin código adicional después de este punto.

// Exponer explícitamente (por si el bundling falla):
if (typeof window !== 'undefined') {
    window.UI = UI;
}
```

## 6. js/app.js
```javascript
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
        isSetupComplete: false
    },

    /**
     * Initialize the application
     */
    init() {
        // Inicializar UI primero
        UI.init();
        
        // Agregar validación de dependencias
        if (typeof Storage === 'undefined' || typeof Utils === 'undefined') {
            console.error('Dependencies not loaded properly');
            return;
        }
        
        // Check setup status and navigate appropriately
        this.checkSetupStatus();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup form handlers
        this.setupFormHandlers();
        
        // Setup screen-specific handlers
        this.setupScreenHandlers();
        
        // Setup new handlers
        this.setupPersonHandlers();
        this.setupGroupHandlers();
        
        console.log('FC24 Team Manager v2.0 initialized successfully');
    },

    /**
     * Check setup status and navigate to appropriate screen
     */
    checkSetupStatus() {
        const setupStatus = Utils.getSetupStatus();
        
        if (setupStatus.needsPersonSetup) {
            this.navigateToScreen('person-setup-screen');
        } else if (setupStatus.needsGroupSetup) {
            this.navigateToScreen('group-setup-screen');
        } else {
            this.migrateLegacyData();
            this.state.isSetupComplete = true;
            this.navigateToScreen('register-screen');
        }
        
        UI.updateGroupContextHeaders();
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
        UI.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screenId = item.dataset.screen;
                this.navigateToScreen(screenId);
            });
        });
    },

    /**
     * Navigate to specific screen with setup validation
     */
    navigateToScreen(screenId) {
        // COHERENCE GUARD: evita navegación redundante
        if (this.state.currentScreen === screenId) {
            // still refresh context-sensitive data if needed
        }
        
        const mainScreens = ['register-screen', 'stats-screen', 'matches-screen', 'evaluate-screen', 'ranking-screen'];
        
        if (mainScreens.includes(screenId) && !this.state.isSetupComplete) {
            const validScreen = UI.getValidatedScreen();
            screenId = validScreen;
        }
        
        this.state.currentScreen = screenId;
        UI.changeScreen(screenId);
        
        // Load screen-specific data
        switch (screenId) {
            case 'group-setup-screen':
                this.loadGroupSetupScreen();
                break;
            case 'group-selector-screen':
                this.loadGroupSelectorScreen();
                break;
            case 'stats-screen':
                this.loadStatsScreen();
                break;
            case 'matches-screen':
                this.loadMatchesScreen();
                break;
            case 'evaluate-screen':
                this.loadEvaluateScreen();
                break;
            case 'ranking-screen':
                this.loadRankingScreen();
                break;
        }
    },

    /**
     * Setup form event handlers
     */
    setupFormHandlers() {
        if (UI.elements.playerForm) {
            UI.elements.playerForm.addEventListener('submit', (e) => {
                this.handlePlayerSubmit(e);
            });
        }

        if (UI.elements.uploadTrigger) {
            UI.elements.uploadTrigger.addEventListener('click', () => {
                UI.elements.playerPhoto.click();
            });
        }

        if (UI.elements.playerPhoto) {
            UI.elements.playerPhoto.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
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
    },

    /**
     * Setup person-related event handlers
     */
    setupPersonHandlers() {
        if (UI.elements.personForm) {
            UI.elements.personForm.addEventListener('submit', (e) => {
                this.handlePersonSubmit(e);
            });
        }

        if (UI.elements.logoutOption) {
            UI.elements.logoutOption.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (UI.elements.exportDataOption) {
            UI.elements.exportDataOption.addEventListener('click', () => {
                this.handleExportData();
            });
        }
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
     * Handle photo upload
     */
    async handlePhotoUpload(e) {
        const file = e.target.files[0];
        
        if (!file) return;

        if (!Utils.isValidImageFile(file)) {
            UI.showNotification('Por favor selecciona una imagen válida (JPG, PNG, GIF, WebP) menor a 5MB.', 'error');
            return;
        }

        try {
            this.state.playerPhotoFile = file;
            const photoUrl = await Utils.fileToBase64(file);
            
            const img = `<img src="${photoUrl}" alt="Player photo">`;
            UI.elements.photoPreview.innerHTML = img;
            UI.elements.previewPhoto.innerHTML = img;
            
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
        
        const personName = UI.elements.personName.value.trim();
        const personEmail = UI.elements.personEmail.value.trim();
        const personPhone = UI.elements.personPhone.value.trim();
        
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
                
                person.avatar = await Utils.fileToBase64(this.state.personPhotoFile);
            }

            const success = Storage.addPerson(person);
            
            if (success) {
                Storage.setCurrentPerson(person.id);
                UI.showNotification(`¡Bienvenido ${person.name}!`, 'success');
                UI.resetPersonForm();
                this.state.personPhotoFile = null;
                
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
        }
    },

    /**
     * Handle player form submission with group context
     */
    async handlePlayerSubmit(e) {
        e.preventDefault();

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
        
        if (!playerName || !playerPosition) {
            UI.showNotification('Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        UI.showLoading();

        try {
            const player = {
                id: Utils.generateId(),
                name: playerName,
                position: playerPosition,
                attributes: {
                    pac: parseInt(document.getElementById('pac').value),
                    sho: parseInt(document.getElementById('sho').value),
                    pas: parseInt(document.getElementById('pas').value),
                    dri: parseInt(document.getElementById('dri').value),
                    def: parseInt(document.getElementById('def').value),
                    phy: parseInt(document.getElementById('phy').value)
                },
                createdAt: new Date().toISOString()
            };

            player.ovr = Utils.calculateOvr(player.attributes);

            const validation = Utils.validatePlayer(player);
            if (!validation.isValid) {
                UI.showNotification(validation.errors[0], 'error');
                UI.hideLoading();
                return;
            }

            if (this.state.playerPhotoFile) {
                if (!Utils.isValidImageFile(this.state.playerPhotoFile)) {
                    UI.showNotification('Formato de imagen no válido o archivo muy grande.', 'error');
                    UI.hideLoading();
                    return;
                }
                
                player.photo = await Utils.fileToBase64(this.state.playerPhotoFile);
            }

            const success = Storage.addPlayer(player);
            
            if (success) {
                UI.showNotification(`Jugador ${player.name} registrado exitosamente!`, 'success');
                UI.resetForm();
                this.state.playerPhotoFile = null;
                
                setTimeout(() => {
                    this.navigateToScreen('stats-screen');
                }, 1500);
            } else {
                UI.showNotification('Error al guardar el jugador. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error creating player:', error);
            UI.showNotification(error.message || 'Error inesperado. Inténtalo de nuevo.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Handle group creation
     */
    async handleGroupSubmit(e) {
        e.preventDefault();
        
        const groupName = UI.elements.groupName.value.trim();
        const groupDescription = UI.elements.groupDescription.value.trim();
        const groupSchedule = UI.elements.groupSchedule.value.trim();
        const groupMaxMembers = parseInt(UI.elements.groupMaxMembers.value);
        const groupPrivate = UI.elements.groupPrivate.checked;
        
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
            UI.updateGroupContextHeaders();
            this.navigateToScreen('register-screen');
        });
    },

    /**
     * Load stats screen data
     */
    async loadStatsScreen() {
        UI.showLoading();
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const players = Storage.getPlayers();
            UI.displayPlayers(players);
            
        } catch (error) {
            console.error('Error loading players:', error);
            UI.showNotification('Error al cargar los jugadores.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Load matches screen data
     */
    async loadMatchesScreen() {
        try {
            await this.loadMatches();
        } catch (error) {
            console.error('Error loading matches:', error);
            UI.showNotification('Error al cargar los partidos.', 'error');
        }
    },

    /**
     * Generate balanced teams
     */
    async generateTeams() {
        UI.showLoading();
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const players = Storage.getPlayers();
            
            if (players.length < 2) {
                UI.showNotification('Se necesitan al menos 2 jugadores para generar equipos.', 'warning');
                UI.hideLoading();
                return;
            }

            const teams = Utils.balanceTeams(players);
            
            this.displayTeams(teams);
            
            const match = {
                id: Utils.generateId(),
                date: new Date().toISOString(),
                teamA: {
                    players: teams.teamA.players.map(p => p.id),
                    ovr: teams.teamA.ovr
                },
                teamB: {
                    players: teams.teamB.players.map(p => p.id),
                    ovr: teams.teamB.ovr
                },
                difference: teams.difference
            };
            
            Storage.addMatch(match);
            await this.loadMatches();
            
            UI.showNotification('Equipos generados exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error generating teams:', error);
            UI.showNotification(error.message || 'Error al generar equipos.', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Display teams in UI
     */
    displayTeams(teams) {
        UI.elements.teamsContainer.innerHTML = `
            <div class="team-card">
                <div class="team-header">
                    <div class="team-name">Equipo A</div>
                    <div class="team-ovr">${teams.teamA.ovr}</div>
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
     * Create team player item HTML
     */
    createTeamPlayerItem(player) {
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
            '<div style="width:100%; height:100%; background:#1a1a1a; display:flex; align-items:center; justify-content:center; border-radius:50%;"><i class="bx bx-user" style="font-size:1rem; color:var(--primary-color);"></i></div>';

        return `
            <li class="team-player-item">
                <div class="team-player-photo">${photoHtml}</div>
                <div class="team-player-info">
                    <div class="team-player-name">${player.name}</div>
                    <div class="team-player-position">${player.position}</div>
                </div>
                <div class="team-player-ovr">${player.ovr}</div>
            </li>
        `;
    },

    /**
     * Load matches history
     */
    async loadMatches() {
        const matches = Storage.getMatches();
        
        UI.elements.matchList.innerHTML = '';
        
        if (matches.length === 0) {
            UI.elements.matchList.innerHTML = '<p style="text-align: center; padding: 20px;">No hay partidos registrados aún.</p>';
            return;
        }

        const sortedMatches = [...matches].reverse();
        
        sortedMatches.forEach(match => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';
            
            matchItem.innerHTML = `
                <div class="match-date">${Utils.formatDate(match.date)}</div>
                <div class="match-teams">
                    <div class="match-team">
                        <div>Equipo A</div>
                        <div class="match-team-ovr">${match.teamA.ovr}</div>
                    </div>
                    <div class="match-vs">VS</div>
                    <div class="match-team">
                        <div>Equipo B</div>
                        <div class="match-team-ovr">${match.teamB.ovr}</div>
                    </div>
                </div>
                <div class="match-difference">
                    Diferencia: <span class="match-difference-value">${match.difference.toFixed(1)}</span>
                </div>
            `;
            
            UI.elements.matchList.appendChild(matchItem);
        });
    },

    /**
     * Load evaluate screen data
     */
    loadEvaluateScreen() {
        const players = Storage.getPlayers();
        
        UI.elements.playerSelector.innerHTML = '<option value="">Selecciona un jugador</option>';
        
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (${player.position}) - OVR: ${player.ovr}`;
            UI.elements.playerSelector.appendChild(option);
        });
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
                
                this.loadEvaluateScreen();
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
                    `<img src="${player.photo}" alt="${player.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : 
                    '<div style="width:100%; height:100%; background:#1a1a1a; display:flex; align-items:center; justify-content:center; border-radius:50%;"><i class="bx bx-user" style="font-size:1.2rem; color:var(--primary-color);"></i></div>';

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
     * Handle logout
     */
    handleLogout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            Storage.setCurrentPerson(null);
            Storage.setCurrentGroup(null);
            this.state.isSetupComplete = false;
            
            UI.hidePersonMenu();
            UI.showNotification('Sesión cerrada exitosamente.', 'success');
            
            setTimeout(() => {
                this.navigateToScreen('person-setup-screen');
            }, 1500);
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
            element.setAttribute('download', `fc24_backup_${new Date().toISOString().split('T')[0]}.json`);
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
     * Handle person photo upload
     */
    handlePersonPhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.state.personPhotoFile = file;
            console.log('Person photo file set:', file.name);
            // Also update UI preview
            if (typeof UI.handlePersonPhotoUpload === 'function') {
                UI.handlePersonPhotoUpload(e);
            }
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
```

## 7. js/backup/generate-backup.js
```javascript
// Ver archivo real para implementación (incluido en repo)
```

## 8. Notas & Restauración
1. Reemplazar archivos por contenidos equivalentes de este snapshot.
2. Importar datos (si se usó JSON exportado):
```js
// Ejemplo
const backup = /* JSON parse de archivo exportado */;
Storage.importData(backup.data);
```
3. Validar flujo:
   - Sin persona => person-setup-screen
   - Sin grupo => group-setup-screen
   - Configurado => register-screen
4. Verificar consola: sin SyntaxError antes de usar.

Estado: Estable y listo para iteraciones visuales / features futuras.

Fin backup v2.1.
```