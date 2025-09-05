/**
 * FC24 Team Manager - Settings Manager
 * Sistema completo de configuración y preferencias de usuario
 * Integrado con localStorage para persistencia
 */

class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.init();
    }

    /**
     * Configuraciones por defecto
     */
    getDefaultSettings() {
        return {
            // 🎨 Personalización Visual
            visual: {
                primaryColor: '#00ff9d',
                secondaryColor: '#00d4aa',
                fontSize: 'normal', // small, normal, large
                animations: true,
                compactMode: false
            },

            // 🔔 Notificaciones & UX
            notifications: {
                sounds: true,
                push: true,
                confirmations: true,
                autoRefresh: true,
                refreshInterval: 30000 // 30 segundos
            },

            // 📊 Vista de Datos
            dataView: {
                playersPerPage: 20, // 10, 20, 50
                defaultView: 'cards', // cards, list, compact
                showExtendedStats: true,
                debugMode: false
            },

            // 💾 Datos & Storage
            storage: {
                autoBackup: true,
                autoCleanCache: 'weekly', // never, daily, weekly
                autoSync: true,
                offlineMode: false
            },

            // 🎮 Funcionalidad
            functionality: {
                autoLogin: true,
                rememberLastScreen: true,
                keyboardShortcuts: true,
                developerMode: false
            },

            // 🏃‍♂️ Rendimiento
            performance: {
                preloadImages: true,
                lazyLoading: true,
                reducedAnimations: false
            }
        };
    }

    /**
     * Inicializar sistema de configuración
     */
    init() {
        console.log('⚙️ Inicializando SettingsManager...');
        
        // Cargar configuración guardada
        this.loadSettings();
        
        // Aplicar configuración
        this.applyAllSettings();
        
        // Renderizar UI
        this.renderSettingsUI();
        
        console.log('✅ SettingsManager inicializado');
    }

    /**
     * Cargar configuración desde localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('fc24_settings');
            if (saved) {
                const savedSettings = JSON.parse(saved);
                // Merge con configuración por defecto para agregar nuevas opciones
                this.settings = this.mergeSettings(this.getDefaultSettings(), savedSettings);
                console.log('📥 Configuración cargada desde localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración, usando defaults:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Guardar configuración en localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('fc24_settings', JSON.stringify(this.settings));
            console.log('💾 Configuración guardada en localStorage');
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
        }
    }

    /**
     * Merge recursivo de configuraciones
     */
    mergeSettings(defaults, saved) {
        const result = { ...defaults };
        for (const key in saved) {
            if (typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
                result[key] = this.mergeSettings(defaults[key] || {}, saved[key]);
            } else {
                result[key] = saved[key];
            }
        }
        return result;
    }

    /**
     * Aplicar toda la configuración
     */
    applyAllSettings() {
        this.applyVisualSettings();
        this.applyNotificationSettings();
        this.applyDataViewSettings();
        this.applyPerformanceSettings();
    }

    /**
     * Aplicar configuración visual
     */
    applyVisualSettings() {
        const { visual } = this.settings;
        
        // Cambiar colores CSS
        document.documentElement.style.setProperty('--primary', visual.primaryColor);
        document.documentElement.style.setProperty('--secondary', visual.secondaryColor);
        
        // Tamaño de fuente
        const fontSizes = { small: '14px', normal: '16px', large: '18px' };
        document.documentElement.style.setProperty('--base-font-size', fontSizes[visual.fontSize]);
        
        // Animaciones
        if (!visual.animations) {
            document.documentElement.style.setProperty('--animation-duration', '0s');
        } else {
            document.documentElement.style.setProperty('--animation-duration', '0.3s');
        }
        
        // Modo compacto
        document.documentElement.classList.toggle('compact-mode', visual.compactMode);
    }

    /**
     * Aplicar configuración de notificaciones
     */
    applyNotificationSettings() {
        const { notifications } = this.settings;
        
        // Auto-refresh
        if (notifications.autoRefresh && this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (notifications.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                this.refreshData();
            }, notifications.refreshInterval);
        }
    }

    /**
     * Aplicar configuración de vista de datos
     */
    applyDataViewSettings() {
        const { dataView } = this.settings;
        
        // Debug mode
        if (dataView.debugMode) {
            console.log('🐛 Debug mode activado');
            window.FC24_DEBUG = true;
        } else {
            window.FC24_DEBUG = false;
        }
    }

    /**
     * Aplicar configuración de rendimiento
     */
    applyPerformanceSettings() {
        const { performance } = this.settings;
        
        // Animaciones reducidas
        document.documentElement.classList.toggle('reduced-animations', performance.reducedAnimations);
        
        // Lazy loading
        if (performance.lazyLoading) {
            this.enableLazyLoading();
        }
    }

    /**
     * Renderizar interfaz de configuración
     */
    renderSettingsUI() {
        const settingsContent = document.getElementById('settings-content');
        if (!settingsContent) return;

        settingsContent.innerHTML = `
            <div class="settings-container">
                ${this.renderVisualSettings()}
                ${this.renderNotificationSettings()}
                ${this.renderDataViewSettings()}
                ${this.renderStorageSettings()}
                ${this.renderFunctionalitySettings()}
                ${this.renderPerformanceSettings()}
                ${this.renderDebugSection()}
            </div>
            
            <div class="settings-actions">
                <button id="save-settings-btn" class="settings-save-btn">💾 Guardar Configuración</button>
                <button id="reset-settings-btn" class="settings-reset-btn">🔄 Restaurar Defaults</button>
                <button id="export-settings-btn" class="settings-export-btn">📤 Exportar Config</button>
                <button id="import-settings-btn" class="settings-import-btn">📥 Importar Config</button>
            </div>
            
            <input type="file" id="import-file" accept=".json" style="display: none;">
        `;

        this.attachSettingsEventListeners();
        this.updateUIFromSettings();
    }

    /**
     * Renderizar sección visual
     */
    renderVisualSettings() {
        return `
            <div class="settings-section">
                <h3>🎨 Personalización Visual</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>Color Primario:</label>
                        <input type="color" id="primary-color" value="${this.settings.visual.primaryColor}">
                    </div>
                    <div class="setting-item">
                        <label>Color Secundario:</label>
                        <input type="color" id="secondary-color" value="${this.settings.visual.secondaryColor}">
                    </div>
                    <div class="setting-item">
                        <label>Tamaño de Fuente:</label>
                        <select id="font-size">
                            <option value="small">Pequeño</option>
                            <option value="normal">Normal</option>
                            <option value="large">Grande</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="animations"> Animaciones
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="compact-mode"> Modo Compacto
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección notificaciones
     */
    renderNotificationSettings() {
        return `
            <div class="settings-section">
                <h3>🔔 Notificaciones & UX</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="sounds"> Sonidos
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="push-notifications"> Notificaciones Push
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="confirmations"> Confirmaciones
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="auto-refresh"> Auto-refresh
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Intervalo refresh (segundos):</label>
                        <input type="number" id="refresh-interval" min="10" max="300" value="${this.settings.notifications.refreshInterval / 1000}">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección vista de datos
     */
    renderDataViewSettings() {
        return `
            <div class="settings-section">
                <h3>📊 Vista de Datos</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>Jugadores por página:</label>
                        <select id="players-per-page">
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Vista por defecto:</label>
                        <select id="default-view">
                            <option value="cards">Cards</option>
                            <option value="list">Lista</option>
                            <option value="compact">Compacta</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="extended-stats"> Estadísticas Extendidas
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="debug-mode"> Modo Debug
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección storage
     */
    renderStorageSettings() {
        return `
            <div class="settings-section">
                <h3>💾 Datos & Storage</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="auto-backup"> Auto-backup Local
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Limpiar caché:</label>
                        <select id="auto-clean-cache">
                            <option value="never">Nunca</option>
                            <option value="daily">Diariamente</option>
                            <option value="weekly">Semanalmente</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="auto-sync"> Sync Automático
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="offline-mode"> Modo Offline
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección funcionalidad
     */
    renderFunctionalitySettings() {
        return `
            <div class="settings-section">
                <h3>🎮 Funcionalidad</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="auto-login"> Auto-login
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="remember-screen"> Recordar Última Pantalla
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="keyboard-shortcuts"> Shortcuts de Teclado
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="developer-mode"> Modo Desarrollador
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección rendimiento
     */
    renderPerformanceSettings() {
        return `
            <div class="settings-section">
                <h3>🏃‍♂️ Rendimiento</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="preload-images"> Precargar Imágenes
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="lazy-loading"> Lazy Loading
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="reduced-animations"> Animaciones Reducidas
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sección debug (mantener la original)
     */
    renderDebugSection() {
        return `
            <div class="settings-section debug-section">
                <h3>🔧 Debug & Desarrollo</h3>
                <div class="settings-group">
                    <button onclick="TestApp?.clearCache?.()">🗑️ Limpiar Caché</button>
                    <button onclick="TestApp?.reloadApp?.()">🔄 Recargar App</button>
                    <button onclick="TestApp?.listUsers?.()">👥 Listar Usuarios</button>
                    <button onclick="TestApp?.createTestUser?.()">➕ Crear Usuario Prueba</button>
                </div>
                <div id="firebase-status" style="margin-top: 15px; padding: 10px; background: rgba(40, 40, 40, 0.8); border-radius: 6px;">
                    <p>Estado Firebase: <span id="fb-status">Conectado</span></p>
                    <p>Base de Datos: <span id="fb-connection">Operativa</span></p>
                </div>
            </div>
        `;
    }

    /**
     * Adjuntar event listeners
     */
    attachSettingsEventListeners() {
        // Botones principales
        document.getElementById('save-settings-btn')?.addEventListener('click', () => this.saveAllSettings());
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => this.resetToDefaults());
        document.getElementById('export-settings-btn')?.addEventListener('click', () => this.exportSettings());
        document.getElementById('import-settings-btn')?.addEventListener('click', () => this.triggerImport());
        document.getElementById('import-file')?.addEventListener('change', (e) => this.importSettings(e));

        // Auto-save en cambios
        const inputs = document.querySelectorAll('#settings-content input, #settings-content select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                setTimeout(() => this.updateSettingsFromUI(), 100);
            });
        });
    }

    /**
     * Actualizar UI desde configuración actual
     */
    updateUIFromSettings() {
        const { visual, notifications, dataView, storage, functionality, performance } = this.settings;

        // Visual
        this.setElementValue('primary-color', visual.primaryColor);
        this.setElementValue('secondary-color', visual.secondaryColor);
        this.setElementValue('font-size', visual.fontSize);
        this.setElementChecked('animations', visual.animations);
        this.setElementChecked('compact-mode', visual.compactMode);

        // Notifications
        this.setElementChecked('sounds', notifications.sounds);
        this.setElementChecked('push-notifications', notifications.push);
        this.setElementChecked('confirmations', notifications.confirmations);
        this.setElementChecked('auto-refresh', notifications.autoRefresh);
        this.setElementValue('refresh-interval', notifications.refreshInterval / 1000);

        // Data View
        this.setElementValue('players-per-page', dataView.playersPerPage);
        this.setElementValue('default-view', dataView.defaultView);
        this.setElementChecked('extended-stats', dataView.showExtendedStats);
        this.setElementChecked('debug-mode', dataView.debugMode);

        // Storage
        this.setElementChecked('auto-backup', storage.autoBackup);
        this.setElementValue('auto-clean-cache', storage.autoCleanCache);
        this.setElementChecked('auto-sync', storage.autoSync);
        this.setElementChecked('offline-mode', storage.offlineMode);

        // Functionality
        this.setElementChecked('auto-login', functionality.autoLogin);
        this.setElementChecked('remember-screen', functionality.rememberLastScreen);
        this.setElementChecked('keyboard-shortcuts', functionality.keyboardShortcuts);
        this.setElementChecked('developer-mode', functionality.developerMode);

        // Performance
        this.setElementChecked('preload-images', performance.preloadImages);
        this.setElementChecked('lazy-loading', performance.lazyLoading);
        this.setElementChecked('reduced-animations', performance.reducedAnimations);
    }

    /**
     * Actualizar configuración desde UI
     */
    updateSettingsFromUI() {
        // Visual
        this.settings.visual.primaryColor = this.getElementValue('primary-color');
        this.settings.visual.secondaryColor = this.getElementValue('secondary-color');
        this.settings.visual.fontSize = this.getElementValue('font-size');
        this.settings.visual.animations = this.getElementChecked('animations');
        this.settings.visual.compactMode = this.getElementChecked('compact-mode');

        // Notifications
        this.settings.notifications.sounds = this.getElementChecked('sounds');
        this.settings.notifications.push = this.getElementChecked('push-notifications');
        this.settings.notifications.confirmations = this.getElementChecked('confirmations');
        this.settings.notifications.autoRefresh = this.getElementChecked('auto-refresh');
        this.settings.notifications.refreshInterval = parseInt(this.getElementValue('refresh-interval')) * 1000;

        // Data View
        this.settings.dataView.playersPerPage = parseInt(this.getElementValue('players-per-page'));
        this.settings.dataView.defaultView = this.getElementValue('default-view');
        this.settings.dataView.showExtendedStats = this.getElementChecked('extended-stats');
        this.settings.dataView.debugMode = this.getElementChecked('debug-mode');

        // Storage
        this.settings.storage.autoBackup = this.getElementChecked('auto-backup');
        this.settings.storage.autoCleanCache = this.getElementValue('auto-clean-cache');
        this.settings.storage.autoSync = this.getElementChecked('auto-sync');
        this.settings.storage.offlineMode = this.getElementChecked('offline-mode');

        // Functionality
        this.settings.functionality.autoLogin = this.getElementChecked('auto-login');
        this.settings.functionality.rememberLastScreen = this.getElementChecked('remember-screen');
        this.settings.functionality.keyboardShortcuts = this.getElementChecked('keyboard-shortcuts');
        this.settings.functionality.developerMode = this.getElementChecked('developer-mode');

        // Performance
        this.settings.performance.preloadImages = this.getElementChecked('preload-images');
        this.settings.performance.lazyLoading = this.getElementChecked('lazy-loading');
        this.settings.performance.reducedAnimations = this.getElementChecked('reduced-animations');

        // Aplicar cambios inmediatamente
        this.applyAllSettings();
    }

    /**
     * Guardar toda la configuración
     */
    saveAllSettings() {
        this.updateSettingsFromUI();
        this.saveSettings();
        this.showNotification('✅ Configuración guardada correctamente', 'success');
    }

    /**
     * Resetear a configuración por defecto
     */
    resetToDefaults() {
        if (confirm('¿Restaurar configuración por defecto? Se perderán todos los cambios.')) {
            this.settings = this.getDefaultSettings();
            this.applyAllSettings();
            this.updateUIFromSettings();
            this.saveSettings();
            this.showNotification('🔄 Configuración restaurada a valores por defecto', 'info');
        }
    }

    /**
     * Exportar configuración
     */
    exportSettings() {
        const config = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fc24_config_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('📤 Configuración exportada', 'success');
    }

    /**
     * Trigger import
     */
    triggerImport() {
        document.getElementById('import-file').click();
    }

    /**
     * Importar configuración
     */
    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = this.mergeSettings(this.getDefaultSettings(), imported);
                this.applyAllSettings();
                this.updateUIFromSettings();
                this.saveSettings();
                this.showNotification('📥 Configuración importada exitosamente', 'success');
            } catch (error) {
                this.showNotification('❌ Error importando configuración', 'error');
                console.error('Error importing settings:', error);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Utilidades
     */
    setElementValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    setElementChecked(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    }

    getElementValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    getElementChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    }

    refreshData() {
        if (window.TestApp?.refreshData) {
            window.TestApp.refreshData();
        }
    }

    enableLazyLoading() {
        // Implementar lazy loading para imágenes
        const images = document.querySelectorAll('img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        images.forEach(img => observer.observe(img));
    }

    showNotification(message, type = 'info') {
        // Usar sistema de notificaciones existente si está disponible
        if (window.NotificationsSystem) {
            window.NotificationsSystem.show(message, type);
            return;
        }

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
            animation: slideInSettings 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// CSS para configuración
const settingsCSS = `
    .settings-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .settings-section {
        background: var(--card-bg);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
    }
    
    .settings-section h3 {
        margin: 0 0 15px 0;
        color: var(--primary);
        font-size: 16px;
        font-weight: 600;
    }
    
    .settings-group {
        display: grid;
        gap: 12px;
    }
    
    .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
    }
    
    .setting-item label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .setting-item input, .setting-item select {
        background: rgba(40, 40, 40, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        min-width: 120px;
    }
    
    .setting-item input:focus, .setting-item select:focus {
        outline: none;
        border-color: var(--primary);
    }
    
    .settings-actions {
        text-align: center;
        margin-top: 30px;
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .settings-actions button {
        background: linear-gradient(90deg, var(--primary), var(--secondary));
        border: none;
        color: black;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .settings-actions button:hover {
        transform: translateY(-2px);
    }
    
    .settings-reset-btn {
        background: linear-gradient(90deg, #ff6b6b, #ff8e8e) !important;
        color: white !important;
    }
    
    .debug-section {
        border-color: rgba(255, 107, 107, 0.3);
    }
    
    .debug-section button {
        background: rgba(255, 107, 107, 0.2);
        border: 1px solid rgba(255, 107, 107, 0.4);
        color: #ff6b6b;
        padding: 8px 16px;
        border-radius: 4px;
        margin: 4px;
        cursor: pointer;
    }
    
    @keyframes slideInSettings {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .settings-container {
            padding: 10px;
        }
        
        .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        
        .setting-item input, .setting-item select {
            width: 100%;
            min-width: unset;
        }
    }
`;

// Inyectar CSS
if (!document.getElementById('settings-manager-css')) {
    const style = document.createElement('style');
    style.id = 'settings-manager-css';
    style.textContent = settingsCSS;
    document.head.appendChild(style);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsManager = new SettingsManager();
    });
} else {
    window.settingsManager = new SettingsManager();
}

console.log('📁 SettingsManager loaded');