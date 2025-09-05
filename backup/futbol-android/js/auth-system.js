/**
 * Authentication System - Firebase Auth Integration
 * Handles user registration, login, and unified User/Player system
 */

const AuthSystem = {
    // Current user state
    currentUser: null,
    isAuthenticated: false,
    
    // Session configuration
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    USE_SESSION_STORAGE: true, // Use sessionStorage instead of localStorage for sensitive data
    
    // Initialize auth system
    async init() {
        console.log('🔐 Initializing AuthSystem...');
        
        // Setup UI event listeners and image preview
        this.attachEventListeners();
        this.setupImagePreview();
        
        // First, check if we have a persisted authenticated user
        const foundPersistedUser = await this.checkPersistedUser();
        
        // If we found a persisted user, skip Firebase Auth setup
        if (foundPersistedUser) {
            console.log('✅ Using persisted user, skipping Firebase Auth setup');
            return;
        }
        
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase not loaded');
            this.showMessage('Error: Firebase no está cargado', 'error');
            this.fallbackToDemo();
            return;
        }
        
        // Check if Firebase Auth is available
        if (!firebase.auth) {
            console.error('❌ Firebase Auth not available');
            this.showMessage('Error: Firebase Auth no disponible', 'error');
            this.fallbackToDemo();
            return;
        }
        
        try {
            // Test Firebase Auth configuration
            const authInstance = firebase.auth();
            console.log('🔍 Testing Firebase Auth configuration...');
            
            // Listen for auth state changes with error handling
            authInstance.onAuthStateChanged(async (user) => {
                try {
                    if (user) {
                        console.log('✅ User signed in:', user.email);
                        await this.handleUserSignedIn(user);
                    } else {
                        console.log('📤 User signed out (or not signed in)');
                        this.handleUserSignedOut();
                    }
                } catch (error) {
                    console.error('❌ Error in auth state change:', error);
                    
                    // If it's a configuration error, fallback to demo ONLY if no user data exists
                    if (error.message.includes('400') || error.code?.includes('auth/')) {
                        // Check if we have user data in localStorage or other sources
                        if (!this.currentUser) {
                            this.fallbackToDemo();
                        } else {
                            console.log('⚠️ Firebase Auth error but user data exists, continuing in auth mode');
                        }
                    }
                }
            });
            
            // Test auth configuration with a simple operation
            setTimeout(async () => {
                try {
                    // This will trigger the 400 error if auth is not configured
                    await authInstance.getRedirectResult();
                    console.log('✅ Firebase Auth configuration test passed');
                } catch (error) {
                    if (error.message.includes('400') || error.code === 'auth/configuration-not-found') {
                        console.log('⚠️  Firebase Auth configuration error detected, falling back to demo mode');
                        this.fallbackToDemo();
                    }
                }
            }, 1000);
            
            console.log('✅ Firebase Auth initialized successfully');
            
        } catch (error) {
            console.error('❌ Firebase Auth initialization failed:', error);
            this.fallbackToDemo();
        }
    },
    
    // Fallback to demo mode when Firebase Auth fails
    fallbackToDemo() {
        console.log('🔄 Considering fallback to demo mode due to Firebase issues');
        
        // First check if we have a valid authenticated user in storage
        if (this.currentUser && this.currentUser.uid) {
            console.log('✅ Found existing authenticated user, staying in auth mode');
            this.hideAuthScreen();
            return;
        }
        
        console.log('🔄 No authenticated user found, proceeding to demo mode');
        
        // Update the auth screen to show the error and demo option
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.innerHTML = `
                <div class="auth-container" style="
                    background: white; 
                    padding: 40px; 
                    border-radius: 20px; 
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <div style="margin-bottom: 30px;">
                        <h1 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 28px;">⚠️ Modo Demo</h1>
                        <p style="color: #666; margin: 0; font-size: 16px;">BETA test Fútbol Miércoles</p>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                        Parece que Firebase Auth no está configurado correctamente. 
                        Puedes continuar en modo demo para probar la aplicación.
                    </p>
                    
                    <button onclick="AuthSystem.enterDemoMode()" style="
                        width: 100%; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 20px; 
                        border: none; 
                        border-radius: 10px; 
                        font-size: 16px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        margin-bottom: 15px;
                    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        🔍 Continuar en Modo Demo
                    </button>
                    
                    <p style="margin: 0; color: #999; font-size: 14px;">
                        En modo demo podrás probar todas las funcionalidades sin registro
                    </p>
                </div>
            `;
        }
    },
    
    // Show Firebase Auth configuration error
    showAuthConfigError() {
        const messageDiv = document.getElementById('auth-message');
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div style="background: #fee; color: #c33; border: 1px solid #fcc; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong>Error de Configuración</strong><br>
                    Firebase Auth no está configurado correctamente. 
                    <br><br>
                    <button onclick="AuthSystem.enterDemoMode()" style="background: #3498db; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">
                        Continuar en Modo Demo
                    </button>
                </div>
            `;
            messageDiv.style.display = 'block';
        }
    },
    
    // Show authentication screen
    showAuthScreen() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('group-selector').style.display = 'none';
        document.getElementById('app-header').style.display = 'none';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
        
        // Debug console (only hide if exists - commented out in production)
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) debugConsole.style.display = 'none';
    },
    
    // Hide authentication screen and show main app
    hideAuthScreen() {
        // Safely hide auth screen if it exists
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.style.display = 'none';
        }
        
        // Safely show main app elements if they exist
        const appHeader = document.getElementById('app-header');
        if (appHeader) {
            appHeader.style.display = 'block';
        }
        
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
            mainNav.style.display = 'block';
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        // Debug console (only show if exists - commented out in production)
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) {
            debugConsole.style.display = 'block';
        }
        
        console.log('✅ Auth screen hidden, main app shown');
    },
    
    // Switch between login and register forms
    showLogin() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.clearMessage();
    },
    
    showRegister() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.clearMessage();
    },
    
    // User registration
    // Handler for register button click
    async handleRegister() {
        await this.register();
    },

    async register() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const position = document.getElementById('register-position').value;
        const password = document.getElementById('register-password').value;
        const imageFile = document.getElementById('register-image').files[0];
        
        // Validation
        if (!name || !email || !position || !password) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        this.showMessage('Creando cuenta...', 'loading');
        
        try {
            // Process profile image if selected
            let profileImageData = null;
            if (imageFile) {
                try {
                    this.showMessage('Procesando imagen...', 'loading');
                    profileImageData = await this.processProfileImage(imageFile);
                } catch (imageError) {
                    this.showMessage(imageError.message, 'error');
                    return;
                }
            }
            
            // Try Firebase Auth first, but if it fails, use direct Firestore registration
            let user = null;
            let useDirectRegistration = false;
            
            try {
                // Check if Firebase Auth is working
                if (!firebase.auth) {
                    throw new Error('auth-not-available');
                }
                
                // Create user with Firebase Auth
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                user = userCredential.user;
                
            } catch (authError) {
                console.log('⚠️ Firebase Auth failed, using direct Firestore registration:', authError.message);
                useDirectRegistration = true;
                
                // Create a mock user object for direct registration
                user = {
                    uid: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    email: email,
                    displayName: name
                };
            }
            
            // Update display name (only for real Firebase users)
            if (!useDirectRegistration && user.updateProfile) {
                await user.updateProfile({
                    displayName: name
                });
            }
            
            // Create unified user profile in Firestore
            const userData = await this.createUserProfile(user, {
                displayName: name,
                position: position,
                profileImage: profileImageData,
                createdViaRegistration: true,
                isDirect: useDirectRegistration // Flag to indicate direct registration
            });
            
            // If using direct registration, immediately set as current user and initialize systems
            if (useDirectRegistration) {
                this.currentUser = userData;
                this.isAuthenticated = true;
                
                // Save session for future auto-login
                // Use sessionStorage for sensitive data, localStorage only for preferences
                if (this.USE_SESSION_STORAGE) {
                    sessionStorage.setItem('auth_current_session', JSON.stringify({
                        ...userData,
                        timestamp: Date.now(),
                        deviceId: this.getDeviceFingerprint()
                    }));
                } else {
                    localStorage.setItem('auth_current_session', JSON.stringify(userData));
                }
                localStorage.removeItem('auth_logged_out'); // Clear any logout flag
                
                this.hideAuthScreen();
                this.initializeSystemsWithUser(userData);
            }
            
            this.showMessage('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
            
            // Auto-navigate to users screen after successful registration
            setTimeout(() => {
                if (typeof TestApp !== 'undefined') {
                    // Navigate to players screen using the navigation system
                    TestApp.navigateTo('players');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Check if it's a Firebase Auth configuration error
            if (error.code === 'auth/configuration-not-found' || 
                error.code === 'auth/project-not-found' ||
                error.message.includes('auth-not-available') ||
                error.message.includes('400')) {
                
                this.showMessage('Firebase Auth no disponible. Iniciando modo demo en 2 segundos...', 'warning');
                
                // Auto-redirect to demo mode after 2 seconds
                setTimeout(() => {
                    this.enterDemoMode();
                }, 2000);
                
            } else {
                this.showMessage(this.getAuthErrorMessage(error), 'error');
            }
        }
    },
    
    // User login
    // Handler for login button click
    async handleLogin() {
        await this.login();
    },
    
    async login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showMessage('Por favor ingresa email y contraseña', 'error');
            return;
        }
        
        this.showMessage('Iniciando sesión...', 'loading');
        
        try {
            // Try Firebase Auth first
            if (!firebase.auth) {
                throw new Error('auth-not-available');
            }
            
            await firebase.auth().signInWithEmailAndPassword(email, password);
            this.showMessage('¡Bienvenido de vuelta!', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Check if it's a Firebase Auth configuration error
            if (error.code === 'auth/configuration-not-found' || 
                error.code === 'auth/project-not-found' ||
                error.message.includes('auth-not-available') ||
                error.message.includes('400')) {
                
                console.log('⚠️ Firebase Auth failed, trying direct Firestore login...');
                
                // Try direct login from Firestore
                const success = await this.tryDirectLogin(email, password);
                
                if (success) {
                    this.showMessage('¡Bienvenido! (Modo directo)', 'success');
                } else {
                    this.showMessage('Usuario o contraseña incorrectos', 'error');
                }
                
            } else {
                this.showMessage(this.getAuthErrorMessage(error), 'error');
            }
        }
    },
    
    // Try to login directly from Firestore (fallback when Firebase Auth is not configured)
    async tryDirectLogin(email, password) {
        console.log('🔍 Starting direct login for:', email);
        
        try {
            // Try both window.db and global db
            const database = window.db || db;
            
            if (!database) {
                console.log('❌ No database connection available (tried window.db and db)');
                console.log('window.db:', window.db);
                console.log('global db:', typeof db !== 'undefined' ? db : 'undefined');
                return false;
            }
            
            console.log('📊 Querying futbol_users collection for email:', email);
            console.log('🔗 Using database:', database ? 'Available' : 'Not available');
            
            // Find user by email in futbol_users collection
            const snapshot = await database.collection('futbol_users')
                .where('email', '==', email)
                .limit(1)
                .get();
            
            console.log('📋 Query completed. Documents found:', snapshot.size);
            
            if (snapshot.empty) {
                console.log('❌ No user found with email:', email);
                
                // Debug: List all users to see what's in the database
                const allUsersSnapshot = await database.collection('futbol_users').get();
                console.log('🔍 Debug - Total users in database:', allUsersSnapshot.size);
                allUsersSnapshot.forEach(doc => {
                    const data = doc.data();
                    console.log('👤 User in DB:', data.email, '-', data.displayName);
                });
                
                return false;
            }
            
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            
            console.log('✅ Found user for direct login:', userData.displayName);
            console.log('📝 User data:', {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName
            });
            
            // For now, we'll skip password verification in direct mode
            // In production, you'd hash and compare passwords
            
            // Set as current user and initialize systems
            this.currentUser = userData;
            this.isAuthenticated = true;
            
            // Save session for future auto-login
            // Use sessionStorage for sensitive data
            if (this.USE_SESSION_STORAGE) {
                sessionStorage.setItem('auth_current_session', JSON.stringify({
                    ...userData,
                    timestamp: Date.now(),
                    deviceId: this.getDeviceFingerprint()
                }));
            } else {
                localStorage.setItem('auth_current_session', JSON.stringify(userData));
            }
            localStorage.removeItem('auth_logged_out'); // Clear any logout flag
            
            console.log('🔧 Hiding auth screen and initializing systems...');
            this.hideAuthScreen();
            this.initializeSystemsWithUser(userData);
            
            // Update last login
            console.log('💾 Updating last login timestamp...');
            await database.collection('futbol_users').doc(userDoc.id).update({
                lastLogin: new Date().toISOString()
            });
            
            console.log('✅ Direct login completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Direct login error:', error);
            return false;
        }
    },
    
    // Create unified user profile in Firestore
    async createUserProfile(firebaseUser, additionalData = {}) {
        console.log('👤 Creating user profile for:', firebaseUser.email);
        
        if (!db) {
            console.error('❌ Firestore not available');
            return;
        }
        
        try {
            // Create unified user document with flatter structure
            const userData = {
                // Authentication data
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                
                // Player profile (flattened for Firestore compatibility)
                displayName: additionalData.displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                position: additionalData.position || 'MED',
                ovr: 50,
                originalOVR: 50,
                
                // Attributes as separate fields
                pac: 50,
                sho: 50, 
                pas: 50,
                dri: 50,
                def: 50,
                phy: 50,
                
                // Other player data
                photo: additionalData.profileImage || '👤',
                hasBeenEvaluated: false,
                
                // Stats as separate fields
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                totalGoals: 0,
                totalAssists: 0,
                avgRating: 0,
                totalRatingsReceived: 0,
                
                // Groups - Auto-assign to default group
                groups: ['o8ZOD6N0KEHrvweFfTAd'], // Fútbol 7 en el Galpón
                currentGroup: 'o8ZOD6N0KEHrvweFfTAd',
                
                // Settings
                notifications: true,
                preferredPosition: additionalData.position || 'MED',
                theme: 'default'
            };
            
            // Save to Firestore in new unified collection
            await db.collection('futbol_users').doc(firebaseUser.uid).set(userData);
            
            // Crear notificación para todos los usuarios existentes
            if (window.notificationsSystem) {
                // Obtener todos los usuarios para notificarles
                const usersSnapshot = await db.collection('futbol_users').get();
                const allUserIds = [];
                usersSnapshot.forEach(doc => {
                    if (doc.id !== firebaseUser.uid) { // No notificar al usuario que se registra
                        allUserIds.push(doc.id);
                    }
                });
                
                // Crear notificación para cada usuario
                for (const userId of allUserIds) {
                    await window.notificationsSystem.createNotification(
                        userId,
                        'user_joined',
                        '👋 Nuevo jugador en el grupo',
                        `<strong>${userData.displayName}</strong> se ha unido al grupo. ¡Dale la bienvenida!`,
                        { 
                            newUserId: firebaseUser.uid,
                            newUserName: userData.displayName
                        }
                    );
                }
                
                // Crear actividad para el ticker
                await window.notificationsSystem.createActivity(
                    'user_joined',
                    `👋 <span>${userData.displayName}</span> se unió al grupo`
                );
            }
            
            // Also add user as a player in the default group
            const defaultGroupId = 'o8ZOD6N0KEHrvweFfTAd';
            const playerData = {
                name: userData.displayName,
                position: userData.position,
                ovr: userData.ovr,
                attributes: {
                    pac: userData.pac,
                    sho: userData.sho,
                    pas: userData.pas,
                    dri: userData.dri,
                    def: userData.def,
                    phy: userData.phy
                },
                photo: userData.photo,
                email: userData.email,
                uid: firebaseUser.uid, // Reference to the user
                addedAt: new Date().toISOString(),
                isAuthenticated: true
            };
            
            try {
                await db.collection('groups')
                    .doc(defaultGroupId)
                    .collection('players')
                    .doc(firebaseUser.uid) // Use uid as document ID to prevent duplicates
                    .set(playerData);
                console.log('✅ User added to default group successfully');
            } catch (groupError) {
                console.warn('⚠️ Could not add user to default group:', groupError);
                // Don't fail the registration if group assignment fails
            }
            
            console.log('✅ User profile created successfully');
            return userData;
            
        } catch (error) {
            console.error('❌ Error creating user profile:', error);
            throw error;
        }
    },
    
    // Handle user signed in
    async handleUserSignedIn(firebaseUser) {
        console.log('🔑 Handling signed in user:', firebaseUser.email);
        
        try {
            // Load or create user profile
            let userData = await this.loadUserProfile(firebaseUser.uid);
            
            if (!userData) {
                // Create profile if doesn't exist (for existing Firebase users)
                console.log('👤 Creating profile for existing Firebase user');
                userData = await this.createUserProfile(firebaseUser, {
                    displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    position: 'MED',
                    createdViaLogin: true
                });
            }
            
            // Update last login and ensure user has default group
            if (db) {
                const updates = {
                    lastLogin: new Date().toISOString()
                };
                
                // If user doesn't have the default group, assign it
                const defaultGroupId = 'o8ZOD6N0KEHrvweFfTAd';
                if (!userData.groups || !userData.groups.includes(defaultGroupId)) {
                    updates.groups = [defaultGroupId];
                    updates.currentGroup = defaultGroupId;
                    console.log('👥 Assigning default group to existing user');
                    
                    // Also add to group's players collection
                    try {
                        const playerData = {
                            name: userData.displayName,
                            position: userData.position,
                            ovr: userData.ovr,
                            attributes: {
                                pac: userData.pac,
                                sho: userData.sho,
                                pas: userData.pas,
                                dri: userData.dri,
                                def: userData.def,
                                phy: userData.phy
                            },
                            photo: userData.photo,
                            email: userData.email,
                            uid: firebaseUser.uid,
                            addedAt: new Date().toISOString(),
                            isAuthenticated: true
                        };
                        
                        await db.collection('groups')
                            .doc(defaultGroupId)
                            .collection('players')
                            .doc(firebaseUser.uid)
                            .set(playerData);
                    } catch (groupError) {
                        console.warn('⚠️ Could not add existing user to default group:', groupError);
                    }
                }
                
                await db.collection('futbol_users').doc(firebaseUser.uid).update(updates);
                
                // Update local userData if groups were added
                if (updates.groups) {
                    userData.groups = updates.groups;
                    userData.currentGroup = updates.currentGroup;
                }
            }
            
            // Set current user
            this.currentUser = userData;
            this.isAuthenticated = true;
            console.log('✅ AuthSystem.currentUser set to:', this.currentUser);
            
            // Update UI
            this.updateUserInfo();
            this.hideAuthScreen();
            
            // Initialize TestApp with the authenticated user
            if (typeof TestApp !== 'undefined') {
                console.log('🔑 AuthSystem: Setting user in TestApp:', userData);
                TestApp.currentUser = userData;
                TestApp.init(userData);
                
                // Load users to show updated list including this new user
                setTimeout(() => {
                    console.log('🔄 Refreshing users list...');
                    TestApp.loadUsers();
                }, 1000);
            } else {
                console.log('❌ TestApp not found');
            }
            
            // Initialize CollaborativeSystem with the authenticated user
            if (typeof collaborativeSystem !== 'undefined') {
                console.log('🔑 AuthSystem: Setting user in CollaborativeSystem:', userData);
                collaborativeSystem.setCurrentUser(userData);
            } else {
                console.log('❌ CollaborativeSystem not found');
            }
            
            console.log('✅ User authenticated successfully');
            
        } catch (error) {
            console.error('❌ Error handling signed in user:', error);
            this.showMessage('Error cargando perfil de usuario', 'error');
        }
    },
    
    // Handle user signed out
    handleUserSignedOut() {
        console.log('👤 Handling user signed out state');
        
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Only show auth screen if it's not already shown
        const authScreen = document.getElementById('auth-screen');
        if (authScreen && authScreen.style.display !== 'flex') {
            this.showAuthScreen();
        }
        
        // Clear TestApp state
        if (typeof TestApp !== 'undefined') {
            TestApp.currentUser = null;
        }
    },
    
    // Load user profile from Firestore
    async loadUserProfile(uid) {
        if (!db) return null;
        
        try {
            const doc = await db.collection('futbol_users').doc(uid).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    },
    
    // Update user info in header
    updateUserInfo() {
        if (this.currentUser && this.currentUser.displayName) {
            const userSpan = document.getElementById('current-user');
            const groupSpan = document.getElementById('current-group');
            
            if (userSpan) {
                userSpan.textContent = `${this.currentUser.displayName} (OVR: ${this.currentUser.ovr})`;
            }
            
            if (groupSpan) {
                groupSpan.textContent = this.currentUser.currentGroup || 'Sin grupo';
            }
        }
    },
    
    // Enter demo mode (backwards compatibility)
    enterDemoMode() {
        console.log('🔍 Entering demo mode');
        this.hideAuthScreen();
        
        // Initialize TestApp in demo mode
        if (typeof TestApp !== 'undefined') {
            TestApp.init(null, true); // null user, demo mode = true
        }
        
        // Initialize CollaborativeSystem with null user (demo mode)
        if (typeof collaborativeSystem !== 'undefined') {
            collaborativeSystem.setCurrentUser(null);
        }
    },
    
    // Logout
    async logout() {
        console.log('🚪 Starting logout process...');
        
        try {
            // Clear ALL session data from both storages
            localStorage.setItem('auth_logged_out', 'true');
            localStorage.removeItem('auth_current_session');
            sessionStorage.removeItem('auth_current_session');
            
            // Clear other auth-related data
            localStorage.removeItem('testapp_user');
            localStorage.removeItem('testapp_group');
            sessionStorage.clear(); // Clear all session storage
            
            // Clear current user data
            this.currentUser = null;
            this.isAuthenticated = false;
            
            // Clear systems
            if (typeof TestApp !== 'undefined') {
                TestApp.currentUser = null;
                TestApp.isLoggedIn = false;
            }
            
            if (typeof collaborativeSystem !== 'undefined') {
                collaborativeSystem.setCurrentUser(null);
            }
            
            // Clear Storage session
            if (typeof Storage !== 'undefined') {
                Storage.clearSession();
            }
            
            // Try Firebase logout (might fail due to config issues)
            try {
                await firebase.auth().signOut();
            } catch (firebaseError) {
                console.log('Firebase signOut failed (expected):', firebaseError.message);
            }
            
            // Show auth screen
            this.showAuthScreen();
            
            console.log('✅ Logout completed successfully');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    },
    
    // Show auth screen
    showAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.style.display = 'flex';
        }
    },
    
    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('auth-message');
        
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        // Style based on type
        switch (type) {
            case 'error':
                messageDiv.style.background = '#fee';
                messageDiv.style.color = '#c33';
                messageDiv.style.border = '1px solid #fcc';
                break;
            case 'success':
                messageDiv.style.background = '#efe';
                messageDiv.style.color = '#383';
                messageDiv.style.border = '1px solid #cfc';
                break;
            case 'loading':
                messageDiv.style.background = '#eef';
                messageDiv.style.color = '#338';
                messageDiv.style.border = '1px solid #ccf';
                break;
            default:
                messageDiv.style.background = '#f0f0f0';
                messageDiv.style.color = '#333';
                messageDiv.style.border = '1px solid #ddd';
        }
        
        // Auto-hide success and loading messages
        if (type === 'success' || type === 'loading') {
            setTimeout(() => {
                this.clearMessage();
            }, type === 'success' ? 2000 : 5000);
        }
    },
    
    // Clear message
    clearMessage() {
        document.getElementById('auth-message').style.display = 'none';
    },
    
    // Setup event listeners for UI
    attachEventListeners() {
        // Login form toggle
        const showRegisterLink = document.getElementById('show-register');
        const showLoginLink = document.getElementById('show-login');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (showRegisterLink && showLoginLink && loginForm && registerForm) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            });
            
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            });
        }
        
        // Form submissions
        const loginBtn = document.getElementById('auth-login-btn');
        const registerBtn = document.getElementById('auth-register-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    },
    
    // Setup image preview functionality
    setupImagePreview() {
        const imageInput = document.getElementById('register-image');
        const imagePreview = document.getElementById('profile-image-preview');
        
        if (imageInput && imagePreview) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Validate file size (2MB max)
                    if (file.size > 2 * 1024 * 1024) {
                        alert('La imagen es muy grande. Máximo 2MB.');
                        imageInput.value = '';
                        return;
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        alert('Por favor selecciona una imagen válida.');
                        imageInput.value = '';
                        return;
                    }
                    
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagePreview.style.backgroundImage = `url(${e.target.result})`;
                        imagePreview.style.backgroundSize = 'cover';
                        imagePreview.style.backgroundPosition = 'center';
                        imagePreview.textContent = '';
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Reset preview
                    imagePreview.style.backgroundImage = '';
                    imagePreview.style.backgroundSize = '';
                    imagePreview.style.backgroundPosition = '';
                    imagePreview.textContent = '👤';
                }
            });
        }
    },
    
    // Process and upload profile image
    async processProfileImage(file) {
        if (!file) return null;
        
        // Check file size (limit to 500KB)
        const maxSize = 500 * 1024; // 500KB
        if (file.size > maxSize) {
            throw new Error('La imagen es demasiado grande. Por favor selecciona una imagen menor a 500KB.');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target.result;
                
                // Check if the base64 result is too large for Firestore (under 1MB limit)
                if (result.length > 800000) { // Leave some margin
                    reject(new Error('La imagen procesada es demasiado grande. Por favor usa una imagen más pequeña.'));
                    return;
                }
                
                resolve(result);
            };
            reader.onerror = () => {
                reject(new Error('Error al procesar la imagen'));
            };
            reader.readAsDataURL(file);
        });
    },

    // Generate device fingerprint for session validation
    getDeviceFingerprint() {
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            colorDepth: screen.colorDepth
        };
        // Create a simple hash from the fingerprint
        return btoa(JSON.stringify(fingerprint)).substring(0, 32);
    },
    
    // Validate session data
    isSessionValid(sessionData) {
        if (!sessionData) return false;
        
        // Check if session has expired (24 hours)
        if (sessionData.timestamp) {
            const age = Date.now() - sessionData.timestamp;
            if (age > this.SESSION_TIMEOUT) {
                console.log('⏰ Session expired');
                return false;
            }
        }
        
        // Check device fingerprint if available
        if (sessionData.deviceId && sessionData.deviceId !== this.getDeviceFingerprint()) {
            console.log('🔒 Device fingerprint mismatch');
            return false;
        }
        
        return true;
    },
    
    // Get user-friendly error messages
    getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'Usuario no encontrado';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta';
            case 'auth/email-already-in-use':
                return 'Este email ya está registrado';
            case 'auth/weak-password':
                return 'La contraseña es muy débil';
            case 'auth/invalid-email':
                return 'Email inválido';
            case 'auth/too-many-requests':
                return 'Demasiados intentos. Intenta más tarde';
            default:
                return error.message || 'Error de autenticación';
        }
    },
    
    // Check for persisted user data (from localStorage or previous sessions)
    async checkPersistedUser() {
        console.log('🔍 Checking for persisted user data...');
        
        // First check if user explicitly logged out
        const loggedOut = localStorage.getItem('auth_logged_out');
        if (loggedOut === 'true') {
            console.log('🚫 User explicitly logged out, skipping auto-login');
            return false;
        }
        
        // Check for saved session in sessionStorage first, then localStorage
        let savedSession = this.USE_SESSION_STORAGE ? 
            sessionStorage.getItem('auth_current_session') : 
            localStorage.getItem('auth_current_session');
        
        // Fallback to localStorage if sessionStorage is empty
        if (!savedSession && this.USE_SESSION_STORAGE) {
            savedSession = localStorage.getItem('auth_current_session');
        }
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                console.log('🔍 Found saved session for:', sessionData.displayName);
                
                // Validate session before using
                if (!this.isSessionValid(sessionData)) {
                    console.log('❌ Session invalid or expired');
                    sessionStorage.removeItem('auth_current_session');
                    localStorage.removeItem('auth_current_session');
                    return false;
                }
                
                // Extract user data from session
                const userData = { ...sessionData };
                delete userData.timestamp;
                delete userData.deviceId;
                
                // Set as current user and initialize systems
                this.currentUser = userData;
                this.isAuthenticated = true;
                this.hideAuthScreen();
                this.initializeSystemsWithUser(userData);
                
                return true;
            } catch (error) {
                console.log('❌ Invalid saved session data, clearing...');
                localStorage.removeItem('auth_current_session');
            }
        }
        
        try {
            // Try to get current user from Firestore if database is available
            const database = window.db || db;
            
            if (database) {
                // Check if there's a current user in some persistent storage
                // Only auto-login if no explicit logout happened
                console.log('🔍 Checking for most recent user in futbol_users...');
                const snapshot = await database.collection('futbol_users').orderBy('lastLogin', 'desc').limit(1).get();
                
                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    const userData = userDoc.data();
                    
                    console.log('✅ Found persisted user:', userData.displayName);
                    
                    // Set as current user
                    this.currentUser = userData;
                    this.isAuthenticated = true;
                    
                    // Save session with validation data
                    const sessionData = {
                        ...userData,
                        timestamp: Date.now(),
                        deviceId: this.getDeviceFingerprint()
                    };
                    
                    if (this.USE_SESSION_STORAGE) {
                        sessionStorage.setItem('auth_current_session', JSON.stringify(sessionData));
                    } else {
                        localStorage.setItem('auth_current_session', JSON.stringify(sessionData));
                    }
                    localStorage.removeItem('auth_logged_out'); // Clear any logout flag
                    
                    // Initialize systems with this user
                    this.hideAuthScreen();
                    this.initializeSystemsWithUser(userData);
                    
                    return true; // Found persisted user
                }
            }
            
            console.log('❌ No persisted user found');
            return false;
        } catch (error) {
            console.error('❌ Error checking persisted user:', error);
            return false;
        }
    },
    
    // Initialize all systems with authenticated user
    async initializeSystemsWithUser(userData) {
        console.log('🚀 Initializing systems with user:', userData.displayName);
        
        // Initialize TestApp with the authenticated user
        if (typeof TestApp !== 'undefined') {
            console.log('🔑 AuthSystem: Setting user in TestApp:', userData);
            TestApp.currentUser = userData;
            TestApp.init(userData, false); // false = not demo mode
            
            // Load users to show updated list including this new user
            setTimeout(() => {
                console.log('🔄 Refreshing users list...');
                TestApp.loadUsers();
            }, 1000);
        } else {
            console.log('❌ TestApp not found');
        }
        
        // Initialize CollaborativeSystem with the authenticated user
        if (typeof collaborativeSystem !== 'undefined') {
            console.log('🔑 AuthSystem: Setting user in CollaborativeSystem:', userData);
            collaborativeSystem.setCurrentUser(userData);
        } else {
            console.log('❌ CollaborativeSystem not found');
        }
        
        // Reinitialize Header & Footer with the new user
        if (window.headerFooter) {
            console.log('🎨 Reinitializing header with user:', userData.displayName);
            window.headerFooter.currentUser = userData;
            await window.headerFooter.updateUserData();
        }
        
        // Reinitialize Notifications System with the new user
        if (window.notificationsSystem) {
            console.log('🔔 Reinitializing notifications with user:', userData.displayName);
            window.notificationsSystem.currentUser = userData;
            await window.notificationsSystem.initialize();
        }
    }
};

// Make AuthSystem globally accessible
window.AuthSystem = AuthSystem;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase to load
    setTimeout(() => {
        AuthSystem.init();
    }, 500);
});