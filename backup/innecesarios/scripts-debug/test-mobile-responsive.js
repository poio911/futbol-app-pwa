const { chromium } = require('playwright');

(async () => {
    console.log('📱 Probando responsive design...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Resoluciones a probar
    const resolutions = [
        { name: 'Mobile Small', width: 375, height: 667 },
        { name: 'Mobile Medium', width: 414, height: 896 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop Small', width: 1024, height: 768 },
        { name: 'Desktop Large', width: 1280, height: 1024 }
    ];
    
    for (const resolution of resolutions) {
        console.log(`\n📏 Probando ${resolution.name} (${resolution.width}x${resolution.height})`);
        
        // Cambiar resolución
        await page.setViewportSize({ 
            width: resolution.width, 
            height: resolution.height 
        });
        
        // Navegar a la aplicación
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);
        
        // Probar cada sección
        const sections = [
            { name: 'Colaborativos', id: 'collaborative' },
            { name: 'Manuales', id: 'matches' },
            { name: 'Jugadores', id: 'players' },
            { name: 'Evaluaciones', id: 'evaluations' }
        ];
        
        for (const section of sections) {
            await page.click(`button[data-screen="${section.id}"]`);
            await page.waitForTimeout(500);
            
            const measurements = await page.evaluate((screenId) => {
                const app = document.getElementById('app');
                const screen = document.getElementById(screenId + '-screen');
                
                return {
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    app: app ? {
                        width: window.getComputedStyle(app).width,
                        actualWidth: app.getBoundingClientRect().width
                    } : null,
                    screen: screen ? {
                        width: window.getComputedStyle(screen).width,
                        actualWidth: screen.getBoundingClientRect().width
                    } : null
                };
            }, section.id);
            
            console.log(`   ${section.name}:`);
            console.log(`     Viewport: ${measurements.viewport.width}x${measurements.viewport.height}`);
            if (measurements.app) {
                console.log(`     App: ${measurements.app.width} (${measurements.app.actualWidth}px)`);
            }
            if (measurements.screen) {
                console.log(`     Screen: ${measurements.screen.width} (${measurements.screen.actualWidth}px)`);
            }
            
            // Verificar si hay overflow horizontal
            const hasOverflow = await page.evaluate(() => {
                return document.body.scrollWidth > document.body.clientWidth;
            });
            
            if (hasOverflow) {
                console.log(`     ⚠️  OVERFLOW HORIZONTAL detectado`);
            } else {
                console.log(`     ✅ Sin overflow`);
            }
        }
        
        // Capturar screenshot para referencia
        await page.screenshot({ 
            path: `responsive-test-${resolution.name.toLowerCase().replace(' ', '-')}.png`,
            fullPage: false 
        });
    }
    
    console.log('\n✅ Test responsive completado');
    console.log('📸 Screenshots guardados para referencia visual');
    
    await browser.close();
})();