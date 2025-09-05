const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Iniciando debug de cambios de ancho...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la aplicación
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    // Inyectar código para monitorear cambios de ancho
    await page.addInitScript(() => {
        // Monitor para cambios en #app
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    console.log('🚨 Style cambió en:', mutation.target.id || mutation.target.tagName, 'Stack:', (new Error()).stack);
                }
            });
        });
        
        // Observe cuando esté disponible
        setTimeout(() => {
            const app = document.getElementById('app');
            if (app) {
                observer.observe(app, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
                
                // Sobrescribir cualquier modificación de width
                const originalSetAttribute = app.setAttribute;
                app.setAttribute = function(name, value) {
                    if (name === 'style' && value.includes('width')) {
                        console.log('🚨 INTENTO de modificar width via setAttribute:', value, 'Stack:', (new Error()).stack);
                    }
                    return originalSetAttribute.call(this, name, value);
                };
                
                // Monitorear acceso al style
                let originalStyle = app.style;
                Object.defineProperty(app, 'style', {
                    get: () => originalStyle,
                    set: (newStyle) => {
                        console.log('🚨 INTENTO de cambiar style completo:', newStyle);
                        originalStyle = newStyle;
                    }
                });
                
                console.log('✅ Monitores instalados en #app');
            }
        }, 1000);
    });
    
    // Función para cambiar de sección y monitorear
    async function testSection(sectionName, screenId) {
        console.log(`\n🔄 Cambiando a sección: ${sectionName}`);
        
        // Capturar ancho antes del cambio
        const beforeWidth = await page.evaluate(() => {
            const app = document.getElementById('app');
            return {
                width: window.getComputedStyle(app).width,
                styleDirect: app.style.width
            };
        });
        
        console.log(`   Ancho ANTES: ${JSON.stringify(beforeWidth)}`);
        
        // Cambiar sección
        await page.click(`button[data-screen="${screenId}"]`);
        await page.waitForTimeout(1000);
        
        // Capturar ancho después del cambio
        const afterWidth = await page.evaluate(() => {
            const app = document.getElementById('app');
            return {
                width: window.getComputedStyle(app).width,
                styleDirect: app.style.width
            };
        });
        
        console.log(`   Ancho DESPUÉS: ${JSON.stringify(afterWidth)}`);
        
        if (beforeWidth.width !== afterWidth.width) {
            console.log(`   ⚠️  CAMBIO DETECTADO: ${beforeWidth.width} → ${afterWidth.width}`);
        } else {
            console.log(`   ✅ Sin cambios`);
        }
    }
    
    // Probar cada sección
    await testSection('Colaborativos', 'collaborative');
    await testSection('Manuales', 'matches');  
    await testSection('Jugadores', 'players');
    await testSection('Evaluaciones', 'evaluations');
    await testSection('Colaborativos', 'collaborative'); // Volver al inicio
    
    console.log('\n✅ Debug completado');
    await browser.close();
})();