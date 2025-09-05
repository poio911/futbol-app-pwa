// Test visual del header después del login
const { chromium } = require('playwright');

async function testHeaderVisual() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capturar logs de consola
    page.on('console', msg => console.log('🌐 BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('❌ ERROR:', error.message));
    
    // Ir a la página
    await page.goto('http://127.0.0.1:5501/index.html');
    
    // Esperar a que cargue
    await page.waitForTimeout(2000);
    
    // Tomar screenshot del login
    await page.screenshot({ path: 'login-screen.png', fullPage: true });
    console.log('📷 Screenshot del login guardado: login-screen.png');
    
    // Simular login con credenciales correctas
    await page.fill('#login-email', 'poio911@hotmail.com');
    await page.fill('#login-password', 'Shalke911');
    
    // Hacer click en login
    await page.click('button[onclick="AuthSystem.login()"]');
    console.log('🔐 Iniciando login...');
    
    // Esperar pantalla de carga
    await page.waitForTimeout(2000);
    
    // Tomar screenshot de pantalla de carga
    await page.screenshot({ path: 'loading-screen.png', fullPage: true });
    console.log('📷 Screenshot de pantalla de carga guardado');
    
    // Esperar mucho más tiempo para el header (login real con Firebase)
    await page.waitForTimeout(10000);
    console.log('⏳ Esperando inicialización completa...');
    
    // Tomar screenshot después del login
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('📷 Screenshot después del login guardado: after-login.png');
    
    // Verificar si el header existe
    const header = await page.locator('#new-app-header').count();
    console.log('🔍 Header encontrado:', header > 0);
    
    // También buscar cualquier header
    const anyHeader = await page.locator('header').count();
    console.log('🔍 Cualquier header encontrado:', anyHeader > 0);
    
    // Verificar elementos del header
    const userAvatar = await page.locator('#user-avatar').count();
    const userName = await page.locator('#user-name-text').count();
    console.log('🔍 Avatar encontrado:', userAvatar > 0);
    console.log('🔍 Nombre usuario encontrado:', userName > 0);
    
    // Si el header existe, tomar screenshot solo del header
    if (header > 0) {
        await page.locator('#new-app-header').screenshot({ path: 'header-only.png' });
        console.log('📷 Screenshot solo del header guardado: header-only.png');
    }
    
    // Esperar para inspeccionar manualmente
    console.log('✅ Test completado. Revisar imágenes generadas.');
    console.log('🔍 Manteniendo navegador abierto por 30 segundos para inspección...');
    await page.waitForTimeout(30000);
    
    await browser.close();
}

testHeaderVisual().catch(console.error);