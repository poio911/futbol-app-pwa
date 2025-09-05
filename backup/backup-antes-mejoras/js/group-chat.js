/**
 * Group Chat System
 * Sistema de chat grupal en tiempo real para Fútbol Stats
 */

const GroupChat = {
    currentGroupId: null,
    currentUserId: null,
    currentUserName: null,
    messages: [],
    unreadCount: 0,
    isConnected: false,
    messageContainer: null,
    messageInput: null,
    listeners: [],
    
    // Chat state
    isOpen: false,
    lastMessageId: null,
    typingTimeout: null,
    typingUsers: new Set(),
    
    /**
     * Inicializa el sistema de chat
     */
    async init() {
        console.log('💬 Group Chat initialized');
        
        // Obtener información del grupo y usuario actual
        this.loadUserInfo();
        
        // Crear interfaz de chat
        this.createChatInterface();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Conectar al chat del grupo actual
        if (this.currentGroupId) {
            await this.connectToGroupChat(this.currentGroupId);
        }
        
        // Monitorear cambios de grupo
        this.monitorGroupChanges();
        
        // Auto-reconectar si se pierde la conexión
        this.setupAutoReconnect();
        
        // Limpiar mensajes antiguos periódicamente
        this.startMessageCleanup();
    },

    /**
     * Carga información del usuario actual
     */
    loadUserInfo() {
        // Obtener del Storage o localStorage
        if (typeof Storage !== 'undefined') {
            this.currentGroupId = Storage.currentGroupId;
        }
        
        // Obtener usuario desde localStorage o generar uno temporal
        const savedUser = localStorage.getItem('chat-user-info');
        if (savedUser) {
            try {
                const userInfo = JSON.parse(savedUser);
                this.currentUserId = userInfo.id;
                this.currentUserName = userInfo.name;
            } catch (error) {
                console.error('Error parsing user info:', error);
            }
        }
        
        // Si no hay usuario, crear uno temporal
        if (!this.currentUserId) {
            this.currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.currentUserName = 'Usuario' + Math.floor(Math.random() * 1000);
            
            localStorage.setItem('chat-user-info', JSON.stringify({
                id: this.currentUserId,
                name: this.currentUserName
            }));
        }
        
        console.log('Chat user info loaded:', {
            userId: this.currentUserId,
            userName: this.currentUserName,
            groupId: this.currentGroupId
        });
    },

    /**
     * Crea la interfaz del chat
     */
    createChatInterface() {
        // Verificar si ya existe
        if (document.getElementById('group-chat-container')) return;
        
        const chatHTML = `
            <div id="group-chat-container" class="chat-container">
                <!-- Chat Toggle Button -->
                <button id="chat-toggle-btn" class="chat-toggle-btn" onclick="GroupChat.toggleChat()" title="Chat Grupal">
                    <i class='bx bx-chat'></i>
                    <span class="chat-badge" id="chat-badge" style="display: none;">0</span>
                </button>
                
                <!-- Chat Panel -->
                <div id="chat-panel" class="chat-panel">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div class="chat-title">
                            <i class='bx bx-chat'></i>
                            <span>Chat Grupal</span>
                            <span class="chat-status" id="chat-status">
                                <span class="status-dot"></span>
                                <span class="status-text">Desconectado</span>
                            </span>
                        </div>
                        <div class="chat-actions">
                            <button class="chat-action-btn" onclick="GroupChat.clearChat()" title="Limpiar chat">
                                <i class='bx bx-trash'></i>
                            </button>
                            <button class="chat-action-btn" onclick="GroupChat.showChatSettings()" title="Configuración">
                                <i class='bx bx-cog'></i>
                            </button>
                            <button class="chat-action-btn" onclick="GroupChat.toggleChat()" title="Cerrar">
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Chat Messages Area -->
                    <div class="chat-messages" id="chat-messages">
                        <div class="chat-welcome">
                            <div class="welcome-icon">
                                <i class='bx bx-chat-left-dots'></i>
                            </div>
                            <h4>¡Bienvenido al chat grupal!</h4>
                            <p>Comunícate con otros miembros del grupo en tiempo real.</p>
                        </div>
                    </div>
                    
                    <!-- Typing Indicator -->
                    <div class="typing-indicator" id="typing-indicator" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="typing-text"></span>
                    </div>
                    
                    <!-- Chat Input -->
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chat-input" class="chat-input" placeholder="Escribe un mensaje..." maxlength="500">
                            <button id="emoji-btn" class="chat-input-btn" onclick="GroupChat.showEmojiPicker()" title="Emojis">
                                <i class='bx bx-smile'></i>
                            </button>
                            <button id="send-btn" class="chat-input-btn primary" onclick="GroupChat.sendMessage()" title="Enviar">
                                <i class='bx bx-send'></i>
                            </button>
                        </div>
                        <div class="chat-quick-actions">
                            <button class="quick-message-btn" onclick="GroupChat.sendQuickMessage('👍')" title="👍">👍</button>
                            <button class="quick-message-btn" onclick="GroupChat.sendQuickMessage('⚽')" title="⚽">⚽</button>
                            <button class="quick-message-btn" onclick="GroupChat.sendQuickMessage('🔥')" title="🔥">🔥</button>
                            <button class="quick-message-btn" onclick="GroupChat.sendQuickMessage('👏')" title="👏">👏</button>
                            <button class="quick-message-btn" onclick="GroupChat.sendQuickMessage('😂')" title="😂">😂</button>
                        </div>
                    </div>
                </div>
                
                <!-- Emoji Picker -->
                <div id="emoji-picker" class="emoji-picker" style="display: none;">
                    <div class="emoji-categories">
                        <button class="emoji-category active" data-category="recent">🕐</button>
                        <button class="emoji-category" data-category="smileys">😀</button>
                        <button class="emoji-category" data-category="sports">⚽</button>
                        <button class="emoji-category" data-category="objects">🎯</button>
                    </div>
                    <div class="emoji-grid" id="emoji-grid">
                        <!-- Emojis will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Chat Settings Modal -->
            <div id="chat-settings-modal" class="chat-modal" style="display: none;">
                <div class="chat-modal-content">
                    <div class="chat-modal-header">
                        <h3>Configuración de Chat</h3>
                        <button class="chat-modal-close" onclick="GroupChat.closeChatSettings()">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                    <div class="chat-modal-body">
                        <div class="chat-setting-group">
                            <label for="chat-username">Nombre de usuario:</label>
                            <input type="text" id="chat-username" class="chat-setting-input" maxlength="30">
                        </div>
                        
                        <div class="chat-setting-group">
                            <label>
                                <input type="checkbox" id="chat-notifications" checked>
                                Notificaciones de mensajes
                            </label>
                        </div>
                        
                        <div class="chat-setting-group">
                            <label>
                                <input type="checkbox" id="chat-sounds" checked>
                                Sonidos de notificación
                            </label>
                        </div>
                        
                        <div class="chat-setting-group">
                            <label>
                                <input type="checkbox" id="chat-auto-scroll" checked>
                                Auto-scroll al nuevo mensaje
                            </label>
                        </div>
                        
                        <div class="chat-setting-actions">
                            <button class="btn-secondary" onclick="GroupChat.closeChatSettings()">Cancelar</button>
                            <button class="btn-primary" onclick="GroupChat.saveChatSettings()">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        
        // Referencias a elementos
        this.messageContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('chat-input');
        
        // Cargar configuración
        this.loadChatSettings();
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Enter para enviar mensaje
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
            
            // Indicador de escritura
            this.messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }
        
        // Listeners de la aplicación
        document.addEventListener('group-changed', (event) => {
            this.handleGroupChanged(event.detail.groupId);
        });
        
        document.addEventListener('user-changed', (event) => {
            this.handleUserChanged(event.detail);
        });
        
        // Cerrar emoji picker al hacer click fuera
        document.addEventListener('click', (event) => {
            const emojiPicker = document.getElementById('emoji-picker');
            const emojiBtn = document.getElementById('emoji-btn');
            
            if (emojiPicker && !emojiPicker.contains(event.target) && event.target !== emojiBtn) {
                emojiPicker.style.display = 'none';
            }
        });
        
        // Emoji categories
        const categories = document.querySelectorAll('.emoji-category');
        categories.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showEmojiCategory(e.target.dataset.category);
            });
        });
    },

    /**
     * Conecta al chat del grupo
     */
    async connectToGroupChat(groupId) {
        console.log('Connecting to group chat:', groupId);
        
        this.currentGroupId = groupId;
        
        // Verificar si Firebase está disponible
        if (typeof Storage !== 'undefined' && !Storage.isDemo) {
            await this.connectToFirebaseChat(groupId);
        } else {
            // Fallback a localStorage para modo demo
            this.connectToLocalChat(groupId);
        }
        
        this.isConnected = true;
        this.updateConnectionStatus(true);
        await this.loadExistingMessages();
    },

    /**
     * Conecta al chat usando Firestore
     */
    async connectToFirebaseChat(groupId) {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firebase not available');
            }

            const db = firebase.firestore();
            
            // Listener para mensajes en tiempo real
            const unsubscribe = db
                .collection('groups')
                .doc(groupId)
                .collection('chat_messages')
                .orderBy('timestamp', 'asc')
                .limit(100)
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const message = { id: change.doc.id, ...change.doc.data() };
                            
                            // Solo agregar si no existe ya en la UI
                            if (!document.getElementById(`msg-${message.id}`)) {
                                this.addMessage(message);
                            }
                        }
                    });
                }, (error) => {
                    console.error('Error listening to chat messages:', error);
                    // Fallback a localStorage
                    this.connectToLocalChat(groupId);
                });

            this.listeners.push({ unsubscribe });
            console.log('Connected to Firebase chat for group:', groupId);

        } catch (error) {
            console.error('Error connecting to Firebase chat:', error);
            // Fallback a localStorage
            this.connectToLocalChat(groupId);
        }
    },

    /**
     * Conecta al chat usando localStorage (fallback)
     */
    connectToLocalChat(groupId) {
        console.log('Using localStorage chat for group:', groupId);
        this.startMessagePolling();
    },

    /**
     * Desconecta del chat actual
     */
    disconnect() {
        console.log('Disconnecting from group chat');
        
        this.isConnected = false;
        this.currentGroupId = null;
        
        // Limpiar listeners
        this.listeners.forEach(listener => {
            if (listener.unsubscribe) listener.unsubscribe();
        });
        this.listeners = [];
        
        // Actualizar UI
        this.updateConnectionStatus(false);
        this.clearMessages();
    },

    /**
     * Envía un mensaje
     */
    async sendMessage(text = null) {
        const messageText = text || this.messageInput?.value?.trim();
        
        if (!messageText) return;
        
        if (!this.isConnected || !this.currentGroupId) {
            UI.showNotification('No estás conectado al chat', 'warning');
            return;
        }
        
        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            groupId: this.currentGroupId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            text: messageText,
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        
        try {
            // Limpiar input inmediatamente
            if (this.messageInput && !text) {
                this.messageInput.value = '';
            }
            
            // Intentar enviar a Firestore primero
            const success = await this.sendMessageToFirestore(message);
            
            if (!success) {
                // Fallback: agregar localmente y guardar en localStorage
                this.addMessage(message);
                await this.saveMessageToStorage(message);
            }
            
            // Reproducir sonido si está habilitado
            this.playNotificationSound('send');
            
        } catch (error) {
            console.error('Error sending message:', error);
            UI.showNotification('Error al enviar mensaje', 'error');
        }
    },

    /**
     * Envía mensaje a Firestore
     */
    async sendMessageToFirestore(message) {
        try {
            if (typeof Storage === 'undefined' || Storage.isDemo) {
                return false; // Usar localStorage
            }

            if (typeof firebase === 'undefined' || !firebase.firestore) {
                return false; // Firebase no disponible
            }

            const db = firebase.firestore();
            
            // Enviar mensaje a Firestore
            await db
                .collection('groups')
                .doc(this.currentGroupId)
                .collection('chat_messages')
                .add({
                    userId: message.userId,
                    userName: message.userName,
                    text: message.text,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    type: message.type
                });

            console.log('Message sent to Firestore:', message.text);
            return true;

        } catch (error) {
            console.error('Error sending message to Firestore:', error);
            return false; // Fallback a localStorage
        }
    },

    /**
     * Envía un mensaje rápido (emoji)
     */
    sendQuickMessage(emoji) {
        this.sendMessage(emoji);
    },

    /**
     * Agrega un mensaje al chat
     */
    addMessage(message, prepend = false) {
        if (!this.messageContainer) return;
        
        // Verificar si el mensaje ya existe
        if (document.getElementById(`msg-${message.id}`)) return;
        
        const isOwn = message.userId === this.currentUserId;
        const messageTime = new Date(message.timestamp);
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        messageElement.id = `msg-${message.id}`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                ${isOwn ? 
                    '<i class="bx bx-user-circle"></i>' :
                    `<div class="avatar-letter">${message.userName.charAt(0).toUpperCase()}</div>`
                }
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${message.userName}</span>
                    <span class="message-time">${this.formatMessageTime(messageTime)}</span>
                </div>
                <div class="message-text">${this.formatMessageText(message.text)}</div>
            </div>
        `;
        
        if (prepend) {
            const welcomeMsg = this.messageContainer.querySelector('.chat-welcome');
            if (welcomeMsg) welcomeMsg.remove();
            
            this.messageContainer.insertBefore(messageElement, this.messageContainer.firstChild);
        } else {
            const welcomeMsg = this.messageContainer.querySelector('.chat-welcome');
            if (welcomeMsg) welcomeMsg.remove();
            
            this.messageContainer.appendChild(messageElement);
            
            // Auto-scroll si está habilitado
            if (this.getChatSetting('auto-scroll', true)) {
                this.scrollToBottom();
            }
        }
        
        // Incrementar contador de mensajes no leídos si el chat está cerrado
        if (!this.isOpen && !isOwn) {
            this.unreadCount++;
            this.updateUnreadBadge();
            
            // Reproducir sonido de notificación
            this.playNotificationSound('receive');
            
            // Mostrar notificación del sistema si está habilitado
            if (this.getChatSetting('notifications', true)) {
                this.showSystemNotification(message);
            }
        }
        
        // Agregar a la lista de mensajes
        this.messages.push(message);
        
        // Mantener solo los últimos 100 mensajes en memoria
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }
    },

    /**
     * Formatea el texto del mensaje
     */
    formatMessageText(text) {
        // Escapar HTML
        const escaped = text.replace(/[&<>"']/g, (match) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escapeMap[match];
        });
        
        // Convertir URLs a links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    },

    /**
     * Formatea la hora del mensaje
     */
    formatMessageTime(date) {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Scroll al final del chat
     */
    scrollToBottom() {
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    },

    /**
     * Toggle del chat
     */
    toggleChat() {
        const chatPanel = document.getElementById('chat-panel');
        const chatToggleBtn = document.getElementById('chat-toggle-btn');
        
        if (!chatPanel) return;
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chatPanel.classList.add('open');
            chatToggleBtn.classList.add('active');
            
            // Resetear contador no leídos
            this.unreadCount = 0;
            this.updateUnreadBadge();
            
            // Focus en input
            setTimeout(() => {
                if (this.messageInput) this.messageInput.focus();
            }, 100);
            
            // Scroll al final
            this.scrollToBottom();
        } else {
            chatPanel.classList.remove('open');
            chatToggleBtn.classList.remove('active');
        }
    },

    /**
     * Actualiza el badge de mensajes no leídos
     */
    updateUnreadBadge() {
        const badge = document.getElementById('chat-badge');
        if (!badge) return;
        
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    /**
     * Actualiza el estado de conexión
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('chat-status');
        if (!statusElement) return;
        
        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');
        
        if (connected) {
            dot.className = 'status-dot connected';
            text.textContent = 'Conectado';
        } else {
            dot.className = 'status-dot';
            text.textContent = 'Desconectado';
        }
    },

    /**
     * Maneja el cambio de grupo
     */
    async handleGroupChanged(newGroupId) {
        console.log('Group changed to:', newGroupId);
        
        // Desconectar del chat actual
        this.disconnect();
        
        // Conectar al nuevo grupo
        if (newGroupId) {
            await this.connectToGroupChat(newGroupId);
        }
    },

    /**
     * Maneja el cambio de usuario
     */
    handleUserChanged(userInfo) {
        this.currentUserId = userInfo.id;
        this.currentUserName = userInfo.name;
        
        // Guardar en localStorage
        localStorage.setItem('chat-user-info', JSON.stringify(userInfo));
    },

    /**
     * Maneja la escritura (indicador de typing)
     */
    handleTyping() {
        // Simular indicador de escritura
        const typingIndicator = document.getElementById('typing-indicator');
        
        // Cancelar timeout anterior
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // En una implementación real, enviarías evento de typing al servidor
        
        // Ocultar indicador después de 2 segundos sin escribir
        this.typingTimeout = setTimeout(() => {
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
        }, 2000);
    },

    /**
     * Carga mensajes existentes
     */
    async loadExistingMessages() {
        if (!this.currentGroupId) return;
        
        try {
            // Intentar cargar desde Firestore primero
            const firestoreSuccess = await this.loadMessagesFromFirestore();
            
            if (!firestoreSuccess) {
                // Fallback: cargar desde localStorage
                await this.loadMessagesFromLocalStorage();
            }
            
        } catch (error) {
            console.error('Error loading existing messages:', error);
            // Fallback final: localStorage
            await this.loadMessagesFromLocalStorage();
        }
    },

    /**
     * Carga mensajes desde Firestore
     */
    async loadMessagesFromFirestore() {
        try {
            if (typeof Storage === 'undefined' || Storage.isDemo) {
                return false;
            }

            if (typeof firebase === 'undefined' || !firebase.firestore) {
                return false;
            }

            const db = firebase.firestore();
            
            const snapshot = await db
                .collection('groups')
                .doc(this.currentGroupId)
                .collection('chat_messages')
                .orderBy('timestamp', 'asc')
                .limit(50)
                .get();

            let loadedCount = 0;
            snapshot.forEach(doc => {
                const message = { id: doc.id, ...doc.data() };
                
                // Convertir timestamp de Firestore a ISO string
                if (message.timestamp && message.timestamp.toDate) {
                    message.timestamp = message.timestamp.toDate().toISOString();
                } else if (!message.timestamp) {
                    message.timestamp = new Date().toISOString();
                }
                
                this.addMessage(message, true);
                loadedCount++;
            });

            console.log(`Loaded ${loadedCount} messages from Firestore`);
            return true;

        } catch (error) {
            console.error('Error loading messages from Firestore:', error);
            return false;
        }
    },

    /**
     * Carga mensajes desde localStorage
     */
    async loadMessagesFromLocalStorage() {
        try {
            const storageKey = `chat_messages_${this.currentGroupId}`;
            const savedMessages = localStorage.getItem(storageKey);
            
            if (savedMessages) {
                const messages = JSON.parse(savedMessages);
                
                // Cargar últimos 50 mensajes
                const recentMessages = messages.slice(-50);
                
                recentMessages.forEach(message => {
                    this.addMessage(message, true);
                });
                
                console.log(`Loaded ${recentMessages.length} messages from localStorage`);
            }
            
        } catch (error) {
            console.error('Error loading messages from localStorage:', error);
        }
    },

    /**
     * Guarda mensaje en almacenamiento local
     */
    async saveMessageToStorage(message) {
        if (!this.currentGroupId) return;
        
        try {
            const storageKey = `chat_messages_${this.currentGroupId}`;
            const savedMessages = localStorage.getItem(storageKey);
            let messages = savedMessages ? JSON.parse(savedMessages) : [];
            
            messages.push(message);
            
            // Mantener solo los últimos 200 mensajes
            if (messages.length > 200) {
                messages = messages.slice(-200);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(messages));
            
        } catch (error) {
            console.error('Error saving message to storage:', error);
        }
    },

    /**
     * Inicia polling para simular mensajes en tiempo real
     */
    startMessagePolling() {
        // En una implementación real, esto sería reemplazado por WebSocket o Firebase Realtime
        // Por ahora simularemos mensajes esporádicos
        
        setInterval(() => {
            // Solo para demo: generar mensaje ocasional de otro usuario
            if (Math.random() < 0.01 && this.messages.length > 0) { // 1% de probabilidad cada segundo
                this.simulateReceivedMessage();
            }
        }, 1000);
    },

    /**
     * Simula un mensaje recibido (solo para demo)
     */
    simulateReceivedMessage() {
        const demoMessages = [
            '¿Jugamos hoy?',
            '¡Buen partido!',
            '⚽🔥',
            '¿A qué hora nos vemos?',
            '👏👏👏',
            'Nos vemos en la cancha'
        ];
        
        const message = {
            id: 'demo_msg_' + Date.now(),
            groupId: this.currentGroupId,
            userId: 'demo_user',
            userName: 'Demo User',
            text: demoMessages[Math.floor(Math.random() * demoMessages.length)],
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        
        this.addMessage(message);
        this.saveMessageToStorage(message);
    },

    /**
     * Limpia el chat
     */
    clearChat() {
        if (!confirm('¿Estás seguro de que quieres limpiar el chat?')) return;
        
        this.clearMessages();
        
        // Limpiar almacenamiento local
        if (this.currentGroupId) {
            const storageKey = `chat_messages_${this.currentGroupId}`;
            localStorage.removeItem(storageKey);
        }
        
        UI.showNotification('Chat limpiado', 'success');
    },

    /**
     * Limpia los mensajes de la UI
     */
    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = `
                <div class="chat-welcome">
                    <div class="welcome-icon">
                        <i class='bx bx-chat-left-dots'></i>
                    </div>
                    <h4>¡Bienvenido al chat grupal!</h4>
                    <p>Comunícate con otros miembros del grupo en tiempo real.</p>
                </div>
            `;
        }
        
        this.messages = [];
        this.unreadCount = 0;
        this.updateUnreadBadge();
    },

    /**
     * Muestra configuración del chat
     */
    showChatSettings() {
        const modal = document.getElementById('chat-settings-modal');
        const usernameInput = document.getElementById('chat-username');
        
        if (modal && usernameInput) {
            // Cargar configuración actual
            usernameInput.value = this.currentUserName;
            document.getElementById('chat-notifications').checked = this.getChatSetting('notifications', true);
            document.getElementById('chat-sounds').checked = this.getChatSetting('sounds', true);
            document.getElementById('chat-auto-scroll').checked = this.getChatSetting('auto-scroll', true);
            
            modal.style.display = 'block';
        }
    },

    /**
     * Cierra configuración del chat
     */
    closeChatSettings() {
        const modal = document.getElementById('chat-settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Guarda configuración del chat
     */
    saveChatSettings() {
        const usernameInput = document.getElementById('chat-username');
        const newUsername = usernameInput?.value?.trim();
        
        if (newUsername && newUsername !== this.currentUserName) {
            this.currentUserName = newUsername;
            
            // Actualizar localStorage
            localStorage.setItem('chat-user-info', JSON.stringify({
                id: this.currentUserId,
                name: this.currentUserName
            }));
        }
        
        // Guardar otras configuraciones
        const settings = {
            notifications: document.getElementById('chat-notifications').checked,
            sounds: document.getElementById('chat-sounds').checked,
            'auto-scroll': document.getElementById('chat-auto-scroll').checked
        };
        
        localStorage.setItem('chat-settings', JSON.stringify(settings));
        
        this.closeChatSettings();
        UI.showNotification('Configuración guardada', 'success');
    },

    /**
     * Carga configuración del chat
     */
    loadChatSettings() {
        const saved = localStorage.getItem('chat-settings');
        if (saved) {
            try {
                this.chatSettings = JSON.parse(saved);
            } catch (error) {
                console.error('Error loading chat settings:', error);
                this.chatSettings = {};
            }
        } else {
            this.chatSettings = {};
        }
    },

    /**
     * Obtiene configuración del chat
     */
    getChatSetting(key, defaultValue = null) {
        return this.chatSettings?.[key] ?? defaultValue;
    },

    /**
     * Muestra picker de emojis
     */
    showEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            const isVisible = picker.style.display === 'block';
            picker.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.loadEmojis('recent');
            }
        }
    },

    /**
     * Muestra categoría de emojis
     */
    showEmojiCategory(category) {
        // Actualizar botones activos
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Cargar emojis de la categoría
        this.loadEmojis(category);
    },

    /**
     * Carga emojis por categoría
     */
    loadEmojis(category) {
        const grid = document.getElementById('emoji-grid');
        if (!grid) return;
        
        const emojiCategories = {
            recent: ['👍', '⚽', '🔥', '👏', '😂', '❤️', '👌', '💪'],
            smileys: ['😀', '😂', '😊', '😍', '🤔', '😎', '😘', '🙄', '😤', '🤗', '🥳', '😇'],
            sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥅', '🏆', '🥇', '🥈', '🥉'],
            objects: ['🎯', '🔥', '💯', '👏', '👍', '💪', '✨', '⭐', '🎉', '🎊', '🚀', '💎']
        };
        
        const emojis = emojiCategories[category] || emojiCategories.recent;
        
        grid.innerHTML = emojis.map(emoji => 
            `<button class="emoji-btn" onclick="GroupChat.insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
    },

    /**
     * Inserta emoji en el input
     */
    insertEmoji(emoji) {
        if (this.messageInput) {
            const currentValue = this.messageInput.value;
            const cursorPos = this.messageInput.selectionStart;
            
            const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
            this.messageInput.value = newValue;
            
            // Posicionar cursor después del emoji
            this.messageInput.selectionStart = this.messageInput.selectionEnd = cursorPos + emoji.length;
            this.messageInput.focus();
        }
        
        // Cerrar picker
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.style.display = 'none';
        }
        
        // Agregar a recientes
        this.addToRecentEmojis(emoji);
    },

    /**
     * Agrega emoji a recientes
     */
    addToRecentEmojis(emoji) {
        let recent = JSON.parse(localStorage.getItem('recent-emojis') || '[]');
        
        // Remover si ya existe
        recent = recent.filter(e => e !== emoji);
        
        // Agregar al inicio
        recent.unshift(emoji);
        
        // Mantener solo los 8 más recientes
        recent = recent.slice(0, 8);
        
        localStorage.setItem('recent-emojis', JSON.stringify(recent));
    },

    /**
     * Reproduce sonido de notificación
     */
    playNotificationSound(type) {
        if (!this.getChatSetting('sounds', true)) return;
        
        try {
            // En una implementación real, tendrías archivos de audio
            // Por ahora usaremos el API de Audio con frecuencias
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'send') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'receive') {
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    },

    /**
     * Muestra notificación del sistema
     */
    showSystemNotification(message) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(`Mensaje de ${message.userName}`, {
                body: message.text,
                icon: '/icons/icon-192.png',
                badge: '/icons/badge-72.png',
                tag: 'group-chat',
                requireInteraction: false,
                silent: false
            });
            
            // Cerrar automáticamente
            setTimeout(() => {
                notification.close();
            }, 5000);
            
            // Click para abrir chat
            notification.onclick = () => {
                window.focus();
                if (!this.isOpen) {
                    this.toggleChat();
                }
                notification.close();
            };
        }
    },

    /**
     * Configurar auto-reconexión
     */
    setupAutoReconnect() {
        setInterval(() => {
            if (!this.isConnected && this.currentGroupId) {
                console.log('Attempting to reconnect to chat...');
                this.connectToGroupChat(this.currentGroupId);
            }
        }, 30000); // Intentar reconectar cada 30 segundos
    },

    /**
     * Iniciar limpieza de mensajes antiguos
     */
    startMessageCleanup() {
        // Limpiar mensajes antiguos una vez al día
        setInterval(() => {
            this.cleanupOldMessages();
        }, 24 * 60 * 60 * 1000); // 24 horas
    },

    /**
     * Limpia mensajes antiguos del almacenamiento
     */
    cleanupOldMessages() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7); // Mantener solo 7 días
            
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('chat_messages_')) {
                    const messages = JSON.parse(localStorage.getItem(key) || '[]');
                    const filteredMessages = messages.filter(msg => {
                        const messageDate = new Date(msg.timestamp);
                        return messageDate > cutoffDate;
                    });
                    
                    if (filteredMessages.length !== messages.length) {
                        localStorage.setItem(key, JSON.stringify(filteredMessages));
                        console.log(`Cleaned up ${messages.length - filteredMessages.length} old messages from ${key}`);
                    }
                }
            });
        } catch (error) {
            console.error('Error cleaning up old messages:', error);
        }
    },

    /**
     * Monitorea cambios de grupo automáticamente
     */
    monitorGroupChanges() {
        // Verificar cambios periódicamente
        setInterval(() => {
            if (typeof Storage !== 'undefined') {
                const newGroupId = Storage.currentGroupId;
                
                if (newGroupId && newGroupId !== this.currentGroupId) {
                    console.log('Group change detected:', this.currentGroupId, '->', newGroupId);
                    this.handleGroupChanged(newGroupId);
                }
            }
        }, 2000); // Verificar cada 2 segundos
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GroupChat.init());
} else {
    GroupChat.init();
}

// Exportar para uso global
window.GroupChat = GroupChat;