/**
 * Logout Handler - Manejo mejorado del cierre de sesión con confirmación
 */

const LogoutHandler = {
    /**
     * Manejar click en el botón de logout con confirmación
     */
    handleLogout() {
        // Crear modal de confirmación
        const modal = this.createConfirmationModal();
        document.body.appendChild(modal);
        
        // Animar entrada
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    },
    
    /**
     * Crear modal de confirmación personalizado
     */
    createConfirmationModal() {
        const modal = document.createElement('div');
        modal.className = 'logout-confirmation-modal';
        modal.innerHTML = `
            <div class="logout-modal-backdrop"></div>
            <div class="logout-modal-content">
                <div class="logout-modal-header">
                    <h3>🚪 Cerrar Sesión</h3>
                </div>
                <div class="logout-modal-body">
                    <p>¿Estás seguro que deseas cerrar tu sesión?</p>
                    <p class="logout-info">Se cerrarán todas las sesiones activas en todos los dispositivos.</p>
                </div>
                <div class="logout-modal-footer">
                    <button class="btn-cancel" onclick="LogoutHandler.cancelLogout()">
                        Cancelar
                    </button>
                    <button class="btn-confirm-logout" onclick="LogoutHandler.confirmLogout()">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;
        
        // Añadir estilos si no existen
        if (!document.getElementById('logout-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'logout-modal-styles';
            styles.innerHTML = `
                .logout-confirmation-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .logout-confirmation-modal.show {
                    opacity: 1;
                }
                
                .logout-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                }
                
                .logout-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 15px;
                    padding: 0;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .logout-confirmation-modal.show .logout-modal-content {
                    transform: scale(1);
                }
                
                .logout-modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 15px 15px 0 0;
                }
                
                .logout-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .logout-modal-body {
                    padding: 25px;
                    text-align: center;
                }
                
                .logout-modal-body p {
                    margin: 10px 0;
                    color: #333;
                    font-size: 16px;
                }
                
                .logout-modal-body .logout-info {
                    color: #666;
                    font-size: 14px;
                    margin-top: 15px;
                    padding: 10px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    border-left: 3px solid #e74c3c;
                }
                
                .logout-modal-footer {
                    padding: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                
                .btn-cancel, .btn-confirm-logout {
                    padding: 10px 25px;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 120px;
                }
                
                .btn-cancel {
                    background: #f0f0f0;
                    color: #333;
                }
                
                .btn-cancel:hover {
                    background: #e0e0e0;
                    transform: translateY(-1px);
                }
                
                .btn-confirm-logout {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: white;
                }
                
                .btn-confirm-logout:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
                }
                
                .btn-confirm-logout:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                /* Loading spinner */
                .logout-loading {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid #fff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 0.6s linear infinite;
                    margin-right: 8px;
                    vertical-align: middle;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Success message */
                .logout-success {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #00b09b, #96c93d);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 176, 155, 0.3);
                    font-weight: 600;
                    z-index: 10001;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        return modal;
    },
    
    /**
     * Cancelar logout
     */
    cancelLogout() {
        const modal = document.querySelector('.logout-confirmation-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },
    
    /**
     * Confirmar y ejecutar logout
     */
    async confirmLogout() {
        const confirmBtn = document.querySelector('.btn-confirm-logout');
        if (!confirmBtn) {
            console.error('❌ No se encontró el botón de confirmación de logout');
            // Ejecutar logout directamente si no hay botón
            try {
                if (window.AuthSystem) {
                    await window.AuthSystem.logout(true);
                }
                this.showSuccessMessage();
                return;
            } catch (error) {
                console.error('❌ Error en logout directo:', error);
                return;
            }
        }
        const originalText = confirmBtn.innerHTML;
        
        // Mostrar estado de carga
        confirmBtn.innerHTML = '<span class="logout-loading"></span>Cerrando...';
        confirmBtn.disabled = true;
        
        try {
            // Ejecutar logout
            if (window.AuthSystem) {
                await window.AuthSystem.logout(true); // true = stay logged out
            }
            
            // Mostrar mensaje de éxito
            this.showSuccessMessage();
            
            // Cerrar modal
            setTimeout(() => {
                this.cancelLogout();
            }, 500);
            
        } catch (error) {
            console.error('Error during logout:', error);
            
            // Restaurar botón en caso de error
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
            
            alert('Error al cerrar sesión. Por favor, intenta nuevamente.');
        }
    },
    
    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'logout-success';
        message.textContent = '✅ Sesión cerrada exitosamente';
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 2000);
    }
};

// Hacer LogoutHandler globalmente accesible
window.LogoutHandler = LogoutHandler;

// Sobrescribir los botones de logout existentes
document.addEventListener('DOMContentLoaded', () => {
    // Buscar todos los botones de logout y actualizarlos
    const logoutButtons = document.querySelectorAll('[onclick*="AuthSystem.logout"]');
    logoutButtons.forEach(btn => {
        btn.setAttribute('onclick', 'LogoutHandler.handleLogout()');
    });
});