/**
 * Mobile Enhancements - Mejoras para la experiencia móvil
 * Incluye gestos táctiles, mejoras de UI y optimizaciones
 */

const MobileEnhancements = {
    touchStartX: 0,
    touchStartY: 0,
    currentScreen: null,
    screens: [],
    isSwipeEnabled: true,
    
    /**
     * Inicializa las mejoras móviles
     */
    init() {
        console.log('📱 Mobile Enhancements initialized');
        
        // Detectar si es móvil
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            this.setupMobileUI();
            this.setupTouchGestures();
            this.setupPullToRefresh();
            this.optimizeForMobile();
            this.setupVirtualKeyboard();
        }
        
        this.setupViewportHeight();
        this.setupOrientationHandler();
    },
    
    /**
     * Detecta si es un dispositivo móvil
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    },
    
    /**
     * Configura la UI para móviles
     */
    setupMobileUI() {
        document.body.classList.add('mobile-device');
        
        // Mejorar touch targets
        this.improveTouchTargets();
        
        // Añadir indicadores visuales de touch
        this.addTouchFeedback();
        
        // Optimizar formularios
        this.optimizeForms();
        
        // Mejorar navegación
        this.enhanceNavigation();
    },
    
    /**
     * Configura gestos táctiles
     */
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!this.isSwipeEnabled) return;
            
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });
        
        // Prevenir zoom con doble tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Añadir long press para opciones contextuales
        this.setupLongPress();
    },
    
    /**
     * Maneja gestos de swipe
     */
    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const threshold = 50; // Mínimo de píxeles para considerar swipe
        
        // Solo procesar swipes horizontales significativos
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe derecha - pantalla anterior
                this.navigatePrevious();
            } else {
                // Swipe izquierda - pantalla siguiente
                this.navigateNext();
            }
        }
    },
    
    /**
     * Navega a la pantalla anterior
     */
    navigatePrevious() {
        const screens = this.getNavigableScreens();
        const currentIndex = screens.indexOf(this.getCurrentScreen());
        
        if (currentIndex > 0) {
            const prevScreen = screens[currentIndex - 1];
            this.animateScreenTransition(prevScreen, 'right');
        }
    },
    
    /**
     * Navega a la pantalla siguiente
     */
    navigateNext() {
        const screens = this.getNavigableScreens();
        const currentIndex = screens.indexOf(this.getCurrentScreen());
        
        if (currentIndex < screens.length - 1) {
            const nextScreen = screens[currentIndex + 1];
            this.animateScreenTransition(nextScreen, 'left');
        }
    },
    
    /**
     * Obtiene pantallas navegables
     */
    getNavigableScreens() {
        return [
            'dashboard-screen',
            'register-screen',
            'stats-screen',
            'matches-screen',
            'evaluate-screen',
            'ranking-screen',
            'advanced-stats-screen'
        ];
    },
    
    /**
     * Obtiene la pantalla actual
     */
    getCurrentScreen() {
        const activeScreen = document.querySelector('.screen.active');
        return activeScreen ? activeScreen.id : null;
    },
    
    /**
     * Anima transición entre pantallas
     */
    animateScreenTransition(screenId, direction) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = document.getElementById(screenId);
        
        if (!currentScreen || !nextScreen) return;
        
        // Añadir clases de animación
        currentScreen.classList.add(`slide-out-${direction}`);
        nextScreen.classList.add(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
        
        // Cambiar pantalla activa
        setTimeout(() => {
            currentScreen.classList.remove('active', `slide-out-${direction}`);
            nextScreen.classList.add('active');
            nextScreen.classList.remove(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
            
            // Actualizar navegación
            if (typeof App !== 'undefined' && App.navigateToScreen) {
                App.navigateToScreen(screenId);
            }
        }, 300);
    },
    
    /**
     * Configura pull to refresh
     */
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        
        const refreshThreshold = 80;
        const refreshIndicator = this.createRefreshIndicator();
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            
            if (diff > 0 && diff < refreshThreshold * 2) {
                e.preventDefault();
                const progress = Math.min(diff / refreshThreshold, 1);
                this.updateRefreshIndicator(refreshIndicator, progress);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (!pulling) return;
            
            const diff = currentY - startY;
            if (diff > refreshThreshold) {
                this.triggerRefresh(refreshIndicator);
            } else {
                this.hideRefreshIndicator(refreshIndicator);
            }
            
            pulling = false;
            startY = 0;
            currentY = 0;
        });
    },
    
    /**
     * Crea indicador de refresh
     */
    createRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = '<i class="bx bx-refresh"></i>';
        document.body.appendChild(indicator);
        return indicator;
    },
    
    /**
     * Actualiza indicador de refresh
     */
    updateRefreshIndicator(indicator, progress) {
        indicator.style.opacity = progress;
        indicator.style.transform = `translateY(${progress * 50}px) rotate(${progress * 180}deg)`;
        indicator.classList.toggle('ready', progress >= 1);
    },
    
    /**
     * Oculta indicador de refresh
     */
    hideRefreshIndicator(indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(0) rotate(0)';
        indicator.classList.remove('ready', 'refreshing');
    },
    
    /**
     * Ejecuta refresh
     */
    triggerRefresh(indicator) {
        indicator.classList.add('refreshing');
        
        // Recargar datos según la pantalla actual
        const currentScreen = this.getCurrentScreen();
        
        setTimeout(() => {
            switch(currentScreen) {
                case 'dashboard-screen':
                    if (typeof App !== 'undefined' && App.loadDashboardScreen) {
                        App.loadDashboardScreen();
                    }
                    break;
                case 'stats-screen':
                    if (typeof App !== 'undefined' && App.loadStatsScreen) {
                        App.loadStatsScreen();
                    }
                    break;
                case 'matches-screen':
                    if (typeof App !== 'undefined' && App.loadMatchesScreen) {
                        App.loadMatchesScreen();
                    }
                    break;
            }
            
            this.hideRefreshIndicator(indicator);
            UI.showNotification('Actualizado', 'success');
        }, 1000);
    },
    
    /**
     * Mejora los touch targets
     */
    improveTouchTargets() {
        // Aumentar área de click para botones pequeños
        const smallButtons = document.querySelectorAll('.btn-icon, .nav-item');
        smallButtons.forEach(btn => {
            btn.style.minWidth = '44px';
            btn.style.minHeight = '44px';
        });
        
        // Mejorar sliders
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.style.minHeight = '44px';
        });
    },
    
    /**
     * Añade feedback táctil
     */
    addTouchFeedback() {
        const style = document.createElement('style');
        style.textContent = `
            .touch-feedback {
                position: relative;
                overflow: hidden;
            }
            
            .touch-feedback::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }
            
            .touch-feedback:active::after {
                width: 100%;
                height: 100%;
            }
            
            @media (hover: none) {
                button, .btn, .nav-item, .player-card {
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Añadir clase a elementos interactivos
        const interactiveElements = document.querySelectorAll('button, .btn, .nav-item');
        interactiveElements.forEach(el => {
            el.classList.add('touch-feedback');
        });
    },
    
    /**
     * Optimiza formularios para móvil
     */
    optimizeForms() {
        // Tipos de input correctos
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.setAttribute('autocomplete', 'email');
            input.setAttribute('inputmode', 'email');
        });
        
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '[0-9]*');
        });
        
        // Auto-focus siguiente campo
        const formInputs = document.querySelectorAll('form input');
        formInputs.forEach((input, index) => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && index < formInputs.length - 1) {
                    e.preventDefault();
                    formInputs[index + 1].focus();
                }
            });
        });
    },
    
    /**
     * Mejora la navegación
     */
    enhanceNavigation() {
        const navbar = document.querySelector('.nav-bar');
        if (!navbar) return;
        
        // Añadir indicador de pantalla activa más visible
        const style = document.createElement('style');
        style.textContent = `
            .nav-item.active::before {
                content: '';
                position: absolute;
                top: -3px;
                left: 50%;
                transform: translateX(-50%);
                width: 30px;
                height: 3px;
                background: var(--primary-color);
                border-radius: 2px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
        
        // Haptic feedback en navegación (si está disponible)
        navbar.addEventListener('click', () => {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        });
    },
    
    /**
     * Configura long press
     */
    setupLongPress() {
        let pressTimer;
        const longPressDuration = 500;
        
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.player-card, .match-card');
            if (!target) return;
            
            pressTimer = setTimeout(() => {
                this.showContextMenu(target, e.touches[0]);
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            }, longPressDuration);
        });
        
        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    },
    
    /**
     * Muestra menú contextual
     */
    showContextMenu(element, touch) {
        // Remover menú anterior si existe
        const existingMenu = document.querySelector('.context-menu-mobile');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu-mobile';
        
        if (element.classList.contains('player-card')) {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="view">Ver Detalles</div>
                <div class="context-menu-item" data-action="edit">Editar</div>
                <div class="context-menu-item" data-action="delete">Eliminar</div>
            `;
        } else if (element.classList.contains('match-card')) {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="evaluate">Evaluar</div>
                <div class="context-menu-item" data-action="view">Ver Detalles</div>
                <div class="context-menu-item" data-action="delete">Eliminar</div>
            `;
        }
        
        // Posicionar menú
        menu.style.position = 'fixed';
        menu.style.left = `${touch.clientX}px`;
        menu.style.top = `${touch.clientY}px`;
        menu.style.transform = 'translate(-50%, -100%)';
        
        document.body.appendChild(menu);
        
        // Cerrar al tocar fuera
        setTimeout(() => {
            document.addEventListener('touchstart', () => {
                menu.remove();
            }, { once: true });
        }, 100);
        
        // Manejar acciones
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextAction(element, action);
                menu.remove();
            }
        });
    },
    
    /**
     * Maneja acción del menú contextual
     */
    handleContextAction(element, action) {
        const id = element.dataset.id;
        
        switch(action) {
            case 'view':
                if (element.classList.contains('player-card')) {
                    const player = Storage.getPlayerById(id);
                    if (player && typeof UI !== 'undefined') {
                        UI.showPlayerDetail(player);
                    }
                }
                break;
            case 'edit':
                if (typeof App !== 'undefined' && App.editPlayer) {
                    App.editPlayer(id);
                }
                break;
            case 'delete':
                if (confirm('¿Eliminar este elemento?')) {
                    if (element.classList.contains('player-card') && typeof App !== 'undefined') {
                        App.deletePlayer(id);
                    }
                }
                break;
            case 'evaluate':
                if (typeof App !== 'undefined' && App.openMatchEvaluation) {
                    const match = Storage.getMatchById(id);
                    if (match) App.openMatchEvaluation(match);
                }
                break;
        }
    },
    
    /**
     * Optimizaciones generales para móvil
     */
    optimizeForMobile() {
        // Lazy loading de imágenes
        this.setupLazyLoading();
        
        // Reducir animaciones si es necesario
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduce-motion');
        }
        
        // Optimizar scroll
        this.optimizeScroll();
        
        // Comprimir cards en móvil
        this.compressCards();
    },
    
    /**
     * Setup lazy loading
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            // Observar todas las imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },
    
    /**
     * Optimiza el scroll
     */
    optimizeScroll() {
        // Smooth scroll con CSS
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                html {
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }
                
                .screen {
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Prevenir overscroll bounce en iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.modal')) {
                e.preventDefault();
            }
        }, { passive: false });
    },
    
    /**
     * Comprime cards en móvil
     */
    compressCards() {
        if (this.isMobile) {
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    .player-card {
                        height: 320px !important;
                    }
                    
                    .player-photo {
                        width: 80px !important;
                        height: 80px !important;
                    }
                    
                    .player-ovr {
                        font-size: 2rem !important;
                    }
                    
                    .player-name {
                        font-size: 0.9rem !important;
                    }
                    
                    .player-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    /**
     * Configura altura del viewport
     */
    setupViewportHeight() {
        // Fix para altura del viewport en móviles
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    },
    
    /**
     * Maneja cambios de orientación
     */
    setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
            // Ajustar UI según orientación
            const isLandscape = window.orientation === 90 || window.orientation === -90;
            document.body.classList.toggle('landscape', isLandscape);
            
            // Notificar si es mejor en portrait
            if (isLandscape && this.isMobile) {
                UI.showNotification('Mejor experiencia en modo vertical', 'info');
            }
        });
    },
    
    /**
     * Configura teclado virtual
     */
    setupVirtualKeyboard() {
        // Ajustar viewport cuando aparece el teclado
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                document.body.classList.add('keyboard-open');
                
                // Scroll al input
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            
            input.addEventListener('blur', () => {
                document.body.classList.remove('keyboard-open');
            });
        });
    }
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileEnhancements.init());
} else {
    MobileEnhancements.init();
}

// Exportar para uso global
window.MobileEnhancements = MobileEnhancements;