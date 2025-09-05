const { chromium } = require('playwright');

(async () => {
    console.log('👁️ Analizando diferencias visuales entre secciones...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Usar resolución desktop común
    await page.setViewportSize({ width: 1280, height: 1024 });
    
    // Navegar a la aplicación
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    const sections = [
        { name: 'Colaborativos', id: 'collaborative' },
        { name: 'Manuales', id: 'matches' },
        { name: 'Jugadores', id: 'players' },
        { name: 'Evaluaciones', id: 'evaluations' }
    ];
    
    for (const section of sections) {
        console.log(`\n🔍 Analizando ${section.name}:`);
        
        // Cambiar a la sección
        await page.click(`button[data-screen="${section.id}"]`);
        await page.waitForTimeout(1000);
        
        // Analizar todos los contenedores importantes
        const analysis = await page.evaluate((screenId) => {
            const elements = {
                app: document.getElementById('app'),
                mainContent: document.getElementById('main-content'),
                screen: document.getElementById(screenId + '-screen')
            };
            
            const getElementInfo = (element, name) => {
                if (!element) return { name, error: 'Element not found' };
                
                const rect = element.getBoundingClientRect();
                const computed = window.getComputedStyle(element);
                
                return {
                    name,
                    rect: {
                        width: rect.width,
                        height: rect.height,
                        left: rect.left,
                        right: rect.right
                    },
                    computed: {
                        width: computed.width,
                        maxWidth: computed.maxWidth,
                        minWidth: computed.minWidth,
                        padding: computed.padding,
                        margin: computed.margin,
                        boxSizing: computed.boxSizing
                    }
                };
            };
            
            return {
                app: getElementInfo(elements.app, '#app'),
                mainContent: getElementInfo(elements.mainContent, '#main-content'),
                screen: getElementInfo(elements.screen, `#${screenId}-screen`)
            };
        }, section.id);
        
        // Mostrar información detallada
        Object.values(analysis).forEach(info => {
            if (info.error) {
                console.log(`   ${info.name}: ERROR - ${info.error}`);
                return;
            }
            
            console.log(`   ${info.name}:`);
            console.log(`     Dimensiones: ${info.rect.width}px × ${info.rect.height}px`);
            console.log(`     Posición: left=${info.rect.left}px, right=${info.rect.right}px`);
            console.log(`     CSS width: ${info.computed.width} (min: ${info.computed.minWidth}, max: ${info.computed.maxWidth})`);
            console.log(`     Padding: ${info.computed.padding}`);
            console.log(`     Margin: ${info.computed.margin}`);
        });
        
        // Verificar si el contenido llena el ancho disponible
        const contentFillsWidth = await page.evaluate((screenId) => {
            const screen = document.getElementById(screenId + '-screen');
            if (!screen) return { error: 'Screen not found' };
            
            const screenRect = screen.getBoundingClientRect();
            const children = Array.from(screen.children);
            
            const childrenInfo = children.map((child, index) => {
                const rect = child.getBoundingClientRect();
                const computed = window.getComputedStyle(child);
                return {
                    index,
                    tag: child.tagName,
                    id: child.id || 'no-id',
                    className: child.className || 'no-class',
                    width: rect.width,
                    computedWidth: computed.width,
                    fillsParent: Math.abs(rect.width - screenRect.width) < 5 // Tolerancia de 5px
                };
            });
            
            return {
                screenWidth: screenRect.width,
                children: childrenInfo
            };
        }, section.id);
        
        if (!contentFillsWidth.error) {
            console.log(`   Contenido interno:`);
            console.log(`     Ancho pantalla: ${contentFillsWidth.screenWidth}px`);
            contentFillsWidth.children.forEach(child => {
                const fillStatus = child.fillsParent ? '✅ Llena' : '⚠️ No llena';
                console.log(`     ${child.tag}#${child.id} - ${child.width}px ${fillStatus}`);
            });
        }
        
        // Capturar screenshot
        await page.screenshot({ 
            path: `debug-${section.id}-visual.png`,
            fullPage: false 
        });
    }
    
    console.log('\n✅ Análisis visual completado');
    console.log('📸 Screenshots capturados para cada sección');
    
    await browser.close();
})();