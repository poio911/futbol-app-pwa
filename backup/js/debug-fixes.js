/**
 * DEBUG MODULE - Development Utilities
 * Contains debugging functions and error monitoring for development
 * Should be removed or disabled in production
 */

console.log('[Debug] Debug module loaded - DEVELOPMENT MODE');

// Debug navigation helper
window._debugNavTo = function(screenId) {
    if (typeof UI !== 'undefined' && UI.changeScreen) {
        UI.changeScreen(screenId);
        console.log(`[Debug] Navigated to: ${screenId}`);
    } else {
        console.warn('[Debug] UI not available yet');
    }
};

// Force navigation to group setup (for testing)
window.forceNext = function() {
    console.log('🔄 Testing force navigation...');
    if (typeof UI !== 'undefined' && typeof UI.changeScreen === 'function') {
        UI.changeScreen('group-setup-screen');
        console.log('✅ Navigated to group setup screen');
    } else {
        console.error('❌ UI.changeScreen not available');
    }
};

// Debug current state
window.debugState = function() {
    if (typeof App !== 'undefined') {
        console.log('📊 App State:', App.state);
    }
    if (typeof Storage !== 'undefined') {
        console.log('👤 Current Person:', Storage.getCurrentPerson());
        console.log('👥 Current Group:', Storage.getCurrentGroup());
        console.log('🎮 Players:', Storage.getPlayers());
    }
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        console.log('📱 Active Screen:', activeScreen.id);
    }
};

// Global error monitoring
window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript Error:', e.error?.message || e.message);
    console.error('📍 File:', e.filename);
    console.error('📍 Line:', e.lineno, 'Col:', e.colno);
    if (e.error?.stack) {
        console.error('📚 Stack:', e.error.stack);
    }
});

// Monitor unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
});

// DOM ready debug info
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    // Check critical elements
    setTimeout(() => {
        const criticalElements = [
            'person-setup-screen',
            'group-setup-screen',
            'register-screen',
            'main-nav-bar'
        ];
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Element found: ${id}`);
            } else {
                console.warn(`⚠️ Element missing: ${id}`);
            }
        });
        
        // Show available debug commands
        console.log('📝 Debug Commands Available:');
        console.log('  - _debugNavTo("screen-id") : Navigate to screen');
        console.log('  - forceNext() : Force navigate to group setup');
        console.log('  - debugState() : Show current app state');
        
    }, 1000);
});

console.log('✅ Debug module ready');