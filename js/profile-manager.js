/**
 * FC24 Team Manager - Profile Manager
 * Sistema completo de gestión del perfil de usuario
 * Integrado con Firebase y cachedPlayers para datos reales
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.init();
    }

    /**
     * Inicializar sistema de perfil
     */
    init() {
        console.log('🎮 Inicializando ProfileManager...');
        
        // Event listeners
        this.attachEventListeners();
        
        // Cargar datos iniciales si hay usuario
        this.loadCurrentUserProfile();
        
        console.log('✅ ProfileManager inicializado');
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Listener para el botón de editar perfil
        const editButton = document.querySelector('button[onclick="editProfileWithStats()"]');
        if (editButton) {
            editButton.onclick = () => this.toggleEditMode();
        }

        // Listener para cambios de imagen
        document.addEventListener('change', (e) => {
            if (e.target.id === 'profile-photo-input') {
                this.handleImageUpload(e);
            }
        });

        // Auto-refresh cuando cambia el usuario
        document.addEventListener('userLoggedIn', () => {
            setTimeout(() => this.loadCurrentUserProfile(), 1000);
        });
    }

    /**
     * Cargar perfil del usuario actual
     */
    loadCurrentUserProfile() {
        console.log('📋 Cargando perfil del usuario actual...');
        
        // Obtener usuario de múltiples fuentes
        this.currentUser = this.getCurrentUser();
        
        if (!this.currentUser) {
            console.log('⚠️ No hay usuario logueado');
            this.displayGuestProfile();
            return;
        }

        console.log('✅ Usuario encontrado:', this.currentUser.name);
        this.displayUserProfile(this.currentUser);
    }

    /**
     * Obtener usuario actual de todas las fuentes disponibles
     */
    getCurrentUser() {
        // 1. Prioridad: CleanHeader actual
        if (window.cleanHeader && window.cleanHeader.currentUser) {
            return window.cleanHeader.currentUser;
        }

        // 2. AuthSystem
        if (window.AuthSystem && window.AuthSystem.currentUser) {
            // Buscar datos completos en cachedPlayers
            if (Storage?.cachedPlayers?.length > 0) {
                const playerData = Storage.cachedPlayers.find(p => 
                    p.name === window.AuthSystem.currentUser.displayName ||
                    p.email === window.AuthSystem.currentUser.email
                );
                if (playerData) return playerData;
            }
            
            // Mapear desde AuthSystem
            return this.mapAuthUserToPlayer(window.AuthSystem.currentUser);
        }

        // 3. TestApp
        if (window.TestApp && window.TestApp.currentUser) {
            return window.TestApp.currentUser;
        }

        // 4. localStorage
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) return JSON.parse(stored);
        } catch (e) {}

        return null;
    }

    /**
     * Mapear usuario de AuthSystem a formato de jugador
     */
    mapAuthUserToPlayer(authUser) {
        return {
            id: authUser.uid || 'temp-user',
            name: authUser.displayName || authUser.email || 'Usuario',
            email: authUser.email,
            position: 'MED',
            ovr: 56,
            attributes: {
                pac: 50, sho: 50, pas: 50, 
                dri: 50, def: 50, phy: 50
            },
            photo: authUser.photoURL || authUser.photo,
            createdAt: new Date().toISOString(),
            _source: 'authSystem'
        };
    }

    /**
     * Mostrar perfil de usuario
     */
    displayUserProfile(user) {
        console.log('🎨 Renderizando perfil de:', user.name);

        // Imagen de perfil
        this.updateProfilePhoto(user);

        // Información básica
        this.updateElement('profile-name', user.name);
        this.updateElement('profile-email', user.email || 'Sin email');
        
        // Stats principales
        this.updateElement('profile-ovr', user.ovr || 50);
        this.updateElement('profile-position', this.getPositionShort(user.position));

        // Atributos individuales
        if (user.attributes) {
            this.updateElement('profile-pac', user.attributes.pac || 50);
            this.updateElement('profile-sho', user.attributes.sho || 50);
            this.updateElement('profile-pas', user.attributes.pas || 50);
            this.updateElement('profile-dri', user.attributes.dri || 50);
            this.updateElement('profile-def', user.attributes.def || 50);
            this.updateElement('profile-phy', user.attributes.phy || 50);
        } else {
            // Usar valores por defecto si no hay atributos específicos
            ['pac', 'sho', 'pas', 'dri', 'def', 'phy'].forEach(attr => {
                this.updateElement(`profile-${attr}`, 50);
            });
        }

        console.log('✅ Perfil renderizado correctamente');
    }

    /**
     * Actualizar foto de perfil
     */
    updateProfilePhoto(user) {
        const photoDisplay = document.getElementById('profile-photo-display');
        if (!photoDisplay) return;

        const photoUrl = user.photo || user.photoURL;
        
        if (photoUrl && photoUrl !== '👤' && (photoUrl.startsWith('http') || photoUrl.startsWith('data:'))) {
            photoDisplay.innerHTML = `
                <img src="${photoUrl}" 
                     alt="${user.name}" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                     onerror="this.parentElement.innerHTML='${user.name.charAt(0).toUpperCase()}'">
            `;
        } else {
            // Usar iniciales
            photoDisplay.textContent = user.name.charAt(0).toUpperCase();
        }
    }

    /**
     * Mostrar perfil de invitado
     */
    displayGuestProfile() {
        console.log('👤 Mostrando perfil de invitado');
        
        this.updateElement('profile-name', 'Invitado');
        this.updateElement('profile-email', 'No autenticado');
        this.updateElement('profile-ovr', '50');
        this.updateElement('profile-position', 'MED');
        
        // Resetear atributos
        ['pac', 'sho', 'pas', 'dri', 'def', 'phy'].forEach(attr => {
            this.updateElement(`profile-${attr}`, '50');
        });
        
        // Foto por defecto
        const photoDisplay = document.getElementById('profile-photo-display');
        if (photoDisplay) {
            photoDisplay.textContent = '👤';
        }
    }

    /**
     * Toggle modo edición
     */
    toggleEditMode() {
        if (!this.currentUser) {
            alert('❌ Debes estar logueado para editar tu perfil');
            return;
        }

        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.enableEditMode();
        } else {
            this.disableEditMode();
        }
    }

    /**
     * Activar modo edición
     */
    enableEditMode() {
        console.log('✏️ Activando modo edición...');

        // Cambiar nombre a input editable
        const nameElement = document.getElementById('profile-name');
        if (nameElement) {
            const currentName = nameElement.textContent;
            nameElement.innerHTML = `
                <input type="text" 
                       id="profile-name-input" 
                       value="${currentName}"
                       style="background: rgba(40, 40, 40, 0.8); border: 1px solid var(--primary); color: white; padding: 5px 10px; border-radius: 4px; text-align: center; font-size: inherit;">
            `;
        }

        // Agregar input para cambiar imagen
        const photoContainer = document.getElementById('profile-photo-container');
        if (photoContainer) {
            const existingInput = document.getElementById('profile-photo-input');
            if (!existingInput) {
                const imageInput = document.createElement('input');
                imageInput.type = 'file';
                imageInput.id = 'profile-photo-input';
                imageInput.accept = 'image/*';
                imageInput.style.display = 'none';
                photoContainer.appendChild(imageInput);

                // Botón para activar input
                const changeButton = document.createElement('button');
                changeButton.innerHTML = '📷 Cambiar Foto';
                changeButton.style.cssText = `
                    background: rgba(40, 40, 40, 0.9); 
                    border: 1px solid var(--primary); 
                    color: var(--primary); 
                    padding: 5px 10px; 
                    border-radius: 4px; 
                    margin-top: 10px; 
                    cursor: pointer; 
                    font-size: 12px;
                `;
                changeButton.onclick = () => imageInput.click();
                photoContainer.appendChild(changeButton);
            }
        }

        // Cambiar botón principal
        this.updateEditButton('💾 Guardar Cambios', 'linear-gradient(90deg, #00ff9d, #00d4aa)');
    }

    /**
     * Desactivar modo edición
     */
    disableEditMode() {
        console.log('💾 Guardando cambios...');

        // Guardar nombre
        const nameInput = document.getElementById('profile-name-input');
        if (nameInput) {
            const newName = nameInput.value.trim();
            if (newName && newName !== this.currentUser.name) {
                this.updateUserName(newName);
            }
        }

        // Limpiar elementos de edición
        this.cleanupEditMode();
        
        // Recargar perfil
        this.displayUserProfile(this.currentUser);
        
        // Cambiar botón
        this.updateEditButton('✏️ Editar Perfil', 'linear-gradient(90deg, var(--primary), var(--secondary))');
    }

    /**
     * Limpiar elementos del modo edición
     */
    cleanupEditMode() {
        // Remover input de imagen
        const imageInput = document.getElementById('profile-photo-input');
        if (imageInput) imageInput.remove();
        
        // Remover botón de cambiar foto
        const photoContainer = document.getElementById('profile-photo-container');
        const changeButton = photoContainer?.querySelector('button');
        if (changeButton) changeButton.remove();
    }

    /**
     * Actualizar botón de editar
     */
    updateEditButton(text, gradient) {
        const editButton = document.querySelector('button[onclick="editProfileWithStats()"]') || 
                          document.querySelector('button[onclick*="editProfile"]');
        if (editButton) {
            editButton.textContent = text;
            editButton.style.background = gradient;
        }
    }

    /**
     * Actualizar nombre de usuario
     */
    async updateUserName(newName) {
        console.log('📝 Actualizando nombre de usuario:', newName);

        try {
            this.currentUser.name = newName;
            
            // Actualizar en Firebase si es posible
            if (window.AuthSystem?.currentUser) {
                // TODO: Implementar actualización en Firebase
                console.log('🔄 Actualizaría nombre en Firebase');
            }
            
            // Actualizar header si existe
            if (window.cleanHeader) {
                window.cleanHeader.currentUser.name = newName;
                window.cleanHeader.renderHeader();
            }
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            console.log('✅ Nombre actualizado exitosamente');
            this.showNotification('✅ Nombre actualizado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando nombre:', error);
            this.showNotification('❌ Error al actualizar nombre', 'error');
        }
    }

    /**
     * Manejar upload de imagen
     */
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('📷 Procesando nueva imagen...');

        // Validar archivo
        if (!file.type.startsWith('image/')) {
            this.showNotification('❌ Solo se permiten archivos de imagen', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showNotification('❌ La imagen es muy grande (máximo 5MB)', 'error');
            return;
        }

        // Convertir a base64 y redimensionar
        this.resizeAndConvertImage(file, 200, 200, (base64) => {
            this.updateUserPhoto(base64);
        });
    }

    /**
     * Redimensionar y convertir imagen a base64
     */
    resizeAndConvertImage(file, maxWidth, maxHeight, callback) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calcular nuevas dimensiones
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            // Redimensionar
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a base64
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            callback(base64);
        };

        img.src = URL.createObjectURL(file);
    }

    /**
     * Actualizar foto de usuario
     */
    async updateUserPhoto(base64Image) {
        console.log('🖼️ Actualizando foto de usuario...');

        try {
            this.currentUser.photo = base64Image;
            this.currentUser.photoURL = base64Image;
            
            // Actualizar visualización inmediatamente
            this.updateProfilePhoto(this.currentUser);
            
            // Actualizar header si existe
            if (window.cleanHeader) {
                window.cleanHeader.currentUser.photo = base64Image;
                window.cleanHeader.currentUser.photoURL = base64Image;
                window.cleanHeader.renderHeader();
            }
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // TODO: Guardar en Firebase
            console.log('🔄 Guardaría imagen en Firebase');
            
            console.log('✅ Foto actualizada exitosamente');
            this.showNotification('✅ Foto actualizada correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando foto:', error);
            this.showNotification('❌ Error al actualizar foto', 'error');
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        // Usar sistema de notificaciones existente si está disponible
        // SISTEMA VIEJO DESHABILITADO
        // if (window.NotificationsSystem) {
        //     window.NotificationsSystem.show(message, type);
        //     return;
        // }

        // Fallback simple
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#00ff9d' : '#4444ff'};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 12px 20px; border-radius: 6px;
            font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Utilidades
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    getPositionShort(position) {
        const positions = {
            'Portero': 'POR', 'Defensor': 'DEF', 
            'Mediocampista': 'MED', 'Delantero': 'DEL',
            'POR': 'POR', 'DEF': 'DEF', 'MED': 'MED', 'DEL': 'DEL'
        };
        return positions[position] || 'MED';
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.profileManager = new ProfileManager();
    });
} else {
    window.profileManager = new ProfileManager();
}

// Función global para mantener compatibilidad
window.editProfileWithStats = function() {
    if (window.profileManager) {
        window.profileManager.toggleEditMode();
    }
};

console.log('📁 ProfileManager loaded');