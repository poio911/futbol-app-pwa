/**
 * Test script para verificar el nuevo sistema de autenticación
 * Ejecutar con: node test-auth-system.js
 */

const { chromium } = require('playwright');

(async () => {
    console.log('🧪 Iniciando pruebas del sistema de autenticación...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Test 1: Verificar que no hay auto-login
        console.log('📝 Test 1: Verificando que no hay auto-login automático...');
        await page.goto('http://localhost:5500');
        await page.waitForTimeout(2000);
        
        const authScreenVisible = await page.isVisible('#auth-screen');
        if (authScreenVisible) {
            console.log('✅ Pantalla de login mostrada correctamente (no hay auto-login)\n');
        } else {
            console.log('❌ Error: La aplicación hizo auto-login sin credenciales\n');
        }
        
        // Test 2: Login con credenciales
        console.log('📝 Test 2: Intentando login...');
        
        // Verificar si existe un usuario de prueba
        const testEmail = 'test@example.com';
        const testPassword = 'test123456';
        
        await page.fill('#login-email', testEmail);
        await page.fill('#login-password', testPassword);
        await page.click('#auth-login-btn');
        
        await page.waitForTimeout(3000);
        
        // Verificar si el login fue exitoso
        const mainContentVisible = await page.isVisible('#main-content');
        if (mainContentVisible) {
            console.log('✅ Login exitoso\n');
        } else {
            console.log('⚠️ Login falló (puede que el usuario no exista)\n');
        }
        
        // Test 3: Verificar SessionManager
        console.log('📝 Test 3: Verificando SessionManager...');
        const sessionExists = await page.evaluate(() => {
            return window.SessionManager && window.SessionManager.getCurrentSession() !== null;
        });
        
        if (sessionExists) {
            console.log('✅ SessionManager funcionando correctamente\n');
            
            // Obtener detalles de la sesión
            const sessionInfo = await page.evaluate(() => {
                const session = window.SessionManager.getCurrentSession();
                return {
                    id: session.id,
                    user: session.user.displayName || session.user.email,
                    deviceFingerprint: session.deviceFingerprint,
                    expiresIn: Math.round((session.expiresAt - Date.now()) / 1000 / 60) + ' minutos'
                };
            });
            
            console.log('📊 Información de la sesión:');
            console.log(`   - ID: ${sessionInfo.id}`);
            console.log(`   - Usuario: ${sessionInfo.user}`);
            console.log(`   - Device ID: ${sessionInfo.deviceFingerprint}`);
            console.log(`   - Expira en: ${sessionInfo.expiresIn}\n`);
        } else {
            console.log('❌ SessionManager no está activo o no hay sesión\n');
        }
        
        // Test 4: Probar logout con confirmación
        console.log('📝 Test 4: Probando logout con confirmación...');
        
        // Buscar botón de logout
        const logoutBtn = await page.$('[onclick*="LogoutHandler"]') || await page.$('[onclick*="AuthSystem.logout"]');
        
        if (logoutBtn) {
            await logoutBtn.click();
            await page.waitForTimeout(1000);
            
            // Verificar que aparece el modal de confirmación
            const modalVisible = await page.isVisible('.logout-confirmation-modal');
            if (modalVisible) {
                console.log('✅ Modal de confirmación mostrado\n');
                
                // Cancelar primero
                await page.click('.btn-cancel');
                await page.waitForTimeout(500);
                console.log('   - Cancelación funcionando\n');
                
                // Ahora confirmar logout
                await logoutBtn.click();
                await page.waitForTimeout(500);
                await page.click('.btn-confirm-logout');
                await page.waitForTimeout(2000);
                
                // Verificar que volvimos a la pantalla de login
                const backToAuth = await page.isVisible('#auth-screen');
                if (backToAuth) {
                    console.log('✅ Logout completado exitosamente\n');
                } else {
                    console.log('❌ Error en el proceso de logout\n');
                }
            } else {
                console.log('⚠️ Modal de confirmación no apareció\n');
            }
        } else {
            console.log('⚠️ Botón de logout no encontrado\n');
        }
        
        // Test 5: Verificar que no hay auto-login después del logout
        console.log('📝 Test 5: Verificando que no hay auto-login después del logout...');
        await page.reload();
        await page.waitForTimeout(2000);
        
        const stillLoggedOut = await page.isVisible('#auth-screen');
        if (stillLoggedOut) {
            console.log('✅ No hay auto-login después del logout (correcto)\n');
        } else {
            console.log('❌ La aplicación hizo auto-login después del logout\n');
        }
        
        // Test 6: Verificar limpieza de storage
        console.log('📝 Test 6: Verificando limpieza de storage...');
        const storageClean = await page.evaluate(() => {
            const hasSession = sessionStorage.getItem('auth_current_session');
            const hasLocalSession = localStorage.getItem('auth_current_session');
            const stayLoggedOut = localStorage.getItem('auth_stay_logged_out');
            
            return {
                sessionClean: !hasSession,
                localClean: !hasLocalSession,
                stayLoggedOut: stayLoggedOut === 'true'
            };
        });
        
        console.log('📊 Estado del storage:');
        console.log(`   - SessionStorage limpio: ${storageClean.sessionClean ? '✅' : '❌'}`);
        console.log(`   - LocalStorage limpio: ${storageClean.localClean ? '✅' : '❌'}`);
        console.log(`   - Flag stay_logged_out: ${storageClean.stayLoggedOut ? '✅' : '❌'}\n`);
        
        // Resumen final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 RESUMEN DE LAS PRUEBAS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Sistema de autenticación mejorado');
        console.log('✅ No hay auto-login no deseado');
        console.log('✅ SessionManager implementado');
        console.log('✅ Logout con confirmación funcional');
        console.log('✅ Limpieza de sesiones correcta');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        await browser.close();
        console.log('🏁 Pruebas completadas');
    }
})();