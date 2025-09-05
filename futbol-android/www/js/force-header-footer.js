/**
 * 🚨 FORZAR HEADER Y FOOTER EN APK
 * Script de emergencia para asegurar que header/footer aparezcan
 */

class ForceHeaderFooter {
    constructor() {
        this.headerCreated = false;
        this.footerCreated = false;
        
        console.log('🚨 ForceHeaderFooter - Iniciando...');
        this.init();
    }
    
    init() {
        // Ejecutar inmediatamente
        this.createHeaderIfMissing();
        this.createFooterIfMissing();
        
        // Ejecutar después de 1 segundo (por si scripts cargan tarde)
        setTimeout(() => {
            this.createHeaderIfMissing();
            this.createFooterIfMissing();
        }, 1000);
        
        // Ejecutar después de 3 segundos (backup final)
        setTimeout(() => {
            this.createHeaderIfMissing();
            this.createFooterIfMissing();
        }, 3000);
        
        // Observar cambios en el DOM
        this.observeDOM();
    }
    
    createHeaderIfMissing() {
        // Buscar si ya existe algún header
        const existingHeaders = document.querySelectorAll('.main-header, .new-header, #header, [class*="header"]');
        
        if (existingHeaders.length === 0) {
            console.log('🚨 No se encontró header - Creando uno de emergencia');
            this.createEmergencyHeader();
        } else {
            console.log('✅ Header encontrado:', existingHeaders[0]);
            // Asegurar que esté visible
            existingHeaders.forEach(header => {
                header.style.display = 'block';
                header.style.visibility = 'visible';
                header.style.opacity = '1';
            });
        }
    }
    
    createEmergencyHeader() {
        if (this.headerCreated) return;
        
        const header = document.createElement('div');
        header.className = 'main-header emergency-header';
        header.id = 'emergency-header';
        
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #00ff9d, #00d4aa); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;">⚽</div>
                    <h1 style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0;">Fútbol App</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(0, 255, 157, 0.3);">
                        <span id="current-user-emergency" style="font-size: 14px; color: #ffffff;">Usuario</span>
                    </div>
                </div>
            </div>
        `;
        
        // Aplicar estilos inline para asegurar que se vea
        Object.assign(header.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            width: '100%',
            zIndex: '9999',
            background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(0, 255, 157, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
            minHeight: '60px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'block',
            visibility: 'visible',
            opacity: '1'
        });
        
        // Insertar al principio del body
        document.body.insertBefore(header, document.body.firstChild);
        
        this.headerCreated = true;
        console.log('✅ Header de emergencia creado');
        
        // Intentar obtener el usuario actual si está disponible
        setTimeout(() => {
            this.updateUserInfo();
        }, 1000);
    }
    
    updateUserInfo() {
        const emergencyUser = document.getElementById('current-user-emergency');
        if (!emergencyUser) return;
        
        // Intentar obtener usuario de diferentes fuentes
        let userName = 'Usuario';
        
        // Fuente 1: elemento current-user existente
        const currentUserElement = document.getElementById('current-user');
        if (currentUserElement && currentUserElement.textContent) {
            userName = currentUserElement.textContent;
        }
        
        // Fuente 2: localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                userName = user.name || user.displayName || userName;
            } catch (e) {
                userName = storedUser;
            }
        }
        
        // Fuente 3: Firebase Auth si está disponible
        if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
            const user = window.firebase.auth().currentUser;
            userName = user.displayName || user.email || userName;
        }
        
        emergencyUser.textContent = userName;
        console.log('👤 Usuario actualizado en header:', userName);
    }
    
    createFooterIfMissing() {
        const existingFooters = document.querySelectorAll('.footer, .main-footer, #footer, [class*="footer"]');
        
        if (existingFooters.length === 0) {
            console.log('🚨 No se encontró footer - Creando uno de emergencia');
            this.createEmergencyFooter();
        } else {
            console.log('✅ Footer encontrado:', existingFooters[0]);
        }
    }
    
    createEmergencyFooter() {
        if (this.footerCreated) return;
        
        const footer = document.createElement('div');
        footer.className = 'main-footer emergency-footer';
        footer.id = 'emergency-footer';
        
        footer.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; padding: 15px;">
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;">
                    © 2025 Fútbol App - Versión APK
                </p>
            </div>
        `;
        
        Object.assign(footer.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            width: '100%',
            background: 'rgba(10, 14, 26, 0.95)',
            borderTop: '1px solid rgba(0, 255, 157, 0.2)',
            zIndex: '9998',
            display: 'block',
            visibility: 'visible',
            opacity: '1'
        });
        
        document.body.appendChild(footer);
        
        this.footerCreated = true;
        console.log('✅ Footer de emergencia creado');
        
        // Ajustar padding del body para el footer
        document.body.style.paddingBottom = '60px';
    }
    
    observeDOM() {
        // Observar cambios en el DOM para reaccionar si se agregan elementos
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldRecheck = true;
                }
            });
            
            if (shouldRecheck) {
                setTimeout(() => {
                    this.createHeaderIfMissing();
                    this.createFooterIfMissing();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👁️ DOM Observer activado para header/footer');
    }
}

// 🚀 INICIALIZAR AUTOMÁTICAMENTE
function initializeForceHeaderFooter() {
    try {
        window.forceHeaderFooter = new ForceHeaderFooter();
    } catch (error) {
        console.error('❌ Error inicializando ForceHeaderFooter:', error);
    }
}

// Inicializar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForceHeaderFooter);
} else {
    initializeForceHeaderFooter();
}

// También inicializar después de un delay por si acaso
setTimeout(initializeForceHeaderFooter, 500);

console.log('🚨 Force Header/Footer script cargado');