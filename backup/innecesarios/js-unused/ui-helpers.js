/**
 * UI Helper Functions - Confirmaciones, Tooltips y Feedback Visual
 */

class UIHelpers {
    /**
     * Mostrar confirmación modal
     */
    static showConfirmation(title, message, onConfirm, onCancel = null, options = {}) {
        const defaults = {
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            type: 'warning', // warning, danger, info, success
            autoClose: false,
            timeout: 0
        };
        
        const config = { ...defaults, ...options };
        
        // Crear backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'confirm-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;
        
        // Crear dialog
        const dialog = document.createElement('div');
        dialog.className = `confirm-dialog confirm-${config.type}`;
        
        // Icono según tipo
        const icons = {
            warning: '⚠️',
            danger: '❌',
            info: 'ℹ️',
            success: '✅'
        };
        
        dialog.innerHTML = `
            <div class="confirm-header">
                <span class="confirm-icon">${icons[config.type] || '❓'}</span>
                <h3>${title}</h3>
            </div>
            <div class="confirm-body">
                <p>${message}</p>
            </div>
            <div class="confirm-dialog-buttons">
                <button class="btn-cancel" id="confirm-cancel">${config.cancelText}</button>
                <button class="btn-confirm" id="confirm-ok">${config.confirmText}</button>
            </div>
        `;
        
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
        
        // Focus en botón confirmar
        setTimeout(() => {
            document.getElementById('confirm-ok')?.focus();
        }, 100);
        
        // Event handlers
        const cleanup = () => {
            backdrop.remove();
        };
        
        const handleConfirm = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };
        
        const handleCancel = () => {
            cleanup();
            if (onCancel) onCancel();
        };
        
        // Buttons
        document.getElementById('confirm-ok').addEventListener('click', handleConfirm);
        document.getElementById('confirm-cancel').addEventListener('click', handleCancel);
        
        // Backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) handleCancel();
        });
        
        // Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                handleCancel();
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Auto close
        if (config.timeout > 0) {
            setTimeout(handleCancel, config.timeout);
        }
        
        return {
            close: cleanup,
            confirm: handleConfirm,
            cancel: handleCancel
        };
    }

    /**
     * Confirmación para eliminación
     */
    static confirmDelete(itemName, onConfirm, onCancel = null) {
        return this.showConfirmation(
            'Confirmar Eliminación',
            `¿Estás seguro de que deseas eliminar "${itemName}"?<br><br><small style="color: #ff9999;">Esta acción no se puede deshacer.</small>`,
            onConfirm,
            onCancel,
            {
                type: 'danger',
                confirmText: 'Eliminar',
                cancelText: 'Conservar'
            }
        );
    }

    /**
     * Agregar tooltip a elemento
     */
    static addTooltip(element, text, position = 'top') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        element.classList.add('tooltip');
        element.setAttribute('data-tooltip', text);
        element.setAttribute('data-tooltip-position', position);
        
        // Agregar estilos dinámicos si no existen
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `
                .tooltip[data-tooltip-position="bottom"]::after {
                    top: calc(100% + 10px);
                    bottom: auto;
                }
                
                .tooltip[data-tooltip-position="bottom"]::before {
                    top: calc(100% + 5px);
                    bottom: auto;
                    border-top-color: transparent;
                    border-bottom-color: rgba(0, 0, 0, 0.95);
                }
                
                .tooltip[data-tooltip-position="left"]::after {
                    right: calc(100% + 10px);
                    left: auto;
                    top: 50%;
                    bottom: auto;
                    transform: translateY(-50%);
                }
                
                .tooltip[data-tooltip-position="left"]::before {
                    right: calc(100% + 5px);
                    left: auto;
                    top: 50%;
                    bottom: auto;
                    transform: translateY(-50%);
                    border-top-color: transparent;
                    border-left-color: rgba(0, 0, 0, 0.95);
                }
                
                .tooltip[data-tooltip-position="right"]::after {
                    left: calc(100% + 10px);
                    right: auto;
                    top: 50%;
                    bottom: auto;
                    transform: translateY(-50%);
                }
                
                .tooltip[data-tooltip-position="right"]::before {
                    left: calc(100% + 5px);
                    right: auto;
                    top: 50%;
                    bottom: auto;
                    transform: translateY(-50%);
                    border-top-color: transparent;
                    border-right-color: rgba(0, 0, 0, 0.95);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Remover tooltip de elemento
     */
    static removeTooltip(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        element.classList.remove('tooltip');
        element.removeAttribute('data-tooltip');
        element.removeAttribute('data-tooltip-position');
    }

    /**
     * Mostrar feedback visual temporal
     */
    static showFeedback(element, type = 'success', duration = 2000) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        const originalClasses = element.className;
        
        // Agregar clase de feedback
        element.classList.add(`feedback-${type}`);
        
        // Agregar animación
        element.style.animation = 'feedbackPulse 0.3s ease-out';
        
        // Remover después del duration
        setTimeout(() => {
            element.classList.remove(`feedback-${type}`);
            element.style.animation = '';
        }, duration);
        
        // Agregar estilos de feedback si no existen
        if (!document.getElementById('feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'feedback-styles';
            style.textContent = `
                .feedback-success {
                    background: rgba(0, 255, 157, 0.1) !important;
                    border-color: var(--primary-color) !important;
                    box-shadow: 0 0 0 3px rgba(0, 255, 157, 0.1) !important;
                }
                
                .feedback-error {
                    background: rgba(255, 68, 68, 0.1) !important;
                    border-color: #ff4444 !important;
                    box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1) !important;
                }
                
                .feedback-warning {
                    background: rgba(255, 170, 0, 0.1) !important;
                    border-color: #ffaa00 !important;
                    box-shadow: 0 0 0 3px rgba(255, 170, 0, 0.1) !important;
                }
                
                @keyframes feedbackPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Animación de éxito en elemento
     */
    static animateSuccess(element, callback = null) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        // Agregar checkmark animado
        const checkmark = document.createElement('div');
        checkmark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            color: var(--primary-color);
            z-index: 1000;
            animation: successPop 0.5s ease-out;
        `;
        checkmark.innerHTML = '✓';
        
        element.style.position = 'relative';
        element.appendChild(checkmark);
        
        // Remover después de la animación
        setTimeout(() => {
            checkmark.remove();
            if (callback) callback();
        }, 500);
        
        // Agregar estilos si no existen
        if (!document.getElementById('success-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'success-animation-styles';
            style.textContent = `
                @keyframes successPop {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0);
                    }
                    70% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Progress bar temporal
     */
    static showProgress(element, duration = 3000, callback = null) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        // Crear barra de progreso
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--primary-color);
            width: 0%;
            transition: width ${duration}ms linear;
            z-index: 100;
        `;
        
        element.style.position = 'relative';
        element.appendChild(progressBar);
        
        // Iniciar progreso
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 10);
        
        // Remover al completar
        setTimeout(() => {
            progressBar.remove();
            if (callback) callback();
        }, duration + 100);
    }

    /**
     * Crear notificación toast personalizada
     */
    static showToast(message, type = 'info', duration = 4000, actions = []) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = `
                <div class="toast-actions">
                    ${actions.map((action, index) => `
                        <button class="toast-action-btn" data-action="${index}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
            </div>
            ${actionsHTML}
            <button class="toast-close">&times;</button>
        `;
        
        // Estilos inline para el toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a1a, #111);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            min-width: 300px;
            max-width: 500px;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease-out;
            color: white;
        `;
        
        document.body.appendChild(toast);
        
        // Event handlers
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Action buttons
        actions.forEach((action, index) => {
            const btn = toast.querySelector(`[data-action="${index}"]`);
            if (btn && action.callback) {
                btn.addEventListener('click', () => {
                    action.callback();
                    toast.remove();
                });
            }
        });
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }
        
        // Agregar estilos de toast si no existen
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .toast-actions {
                    margin-top: 10px;
                    display: flex;
                    gap: 10px;
                }
                
                .toast-action-btn {
                    background: rgba(0, 255, 157, 0.1);
                    border: 1px solid rgba(0, 255, 157, 0.3);
                    color: var(--primary-color);
                    padding: 5px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                
                .toast-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
            `;
            document.head.appendChild(style);
        }
        
        return toast;
    }

    /**
     * Inicializar todos los tooltips automáticamente
     */
    static initializeTooltips() {
        // Buscar elementos con data-tooltip
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            if (!element.classList.contains('tooltip')) {
                const text = element.getAttribute('data-tooltip');
                const position = element.getAttribute('data-tooltip-position') || 'top';
                this.addTooltip(element, text, position);
            }
        });
    }
}

// Hacer disponible globalmente
window.UIHelpers = UIHelpers;

// Auto inicializar tooltips cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UIHelpers.initializeTooltips();
});

// Reinicializar tooltips cuando se actualice el contenido dinámico
const observer = new MutationObserver(() => {
    UIHelpers.initializeTooltips();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🎨 UI Helpers initialized');