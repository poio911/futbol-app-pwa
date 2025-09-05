const { chromium } = require('playwright');

(async () => {
    console.log('📐 Analizando distribución de contenido interno...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Usar resolución desktop
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
        console.log(`\n🔍 ${section.name}:`);
        
        // Cambiar a la sección
        await page.click(`button[data-screen="${section.id}"]`);
        await page.waitForTimeout(1000);
        
        // Analizar la distribución visual del contenido
        const contentAnalysis = await page.evaluate((screenId) => {
            const screen = document.getElementById(screenId + '-screen');
            if (!screen) return { error: 'Screen not found' };
            
            const screenRect = screen.getBoundingClientRect();
            const visibleElements = [];
            
            // Buscar todos los elementos visibles dentro de la pantalla
            const allElements = screen.querySelectorAll('*');
            
            allElements.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const computed = window.getComputedStyle(el);
                
                // Solo elementos visibles con área significativa
                if (computed.display !== 'none' && 
                    computed.visibility !== 'hidden' && 
                    rect.width > 0 && rect.height > 0) {
                    
                    const parentRect = el.parentElement ? el.parentElement.getBoundingClientRect() : screenRect;
                    
                    visibleElements.push({
                        tag: el.tagName,
                        id: el.id || `element-${index}`,
                        className: el.className || '',
                        rect: {
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            left: Math.round(rect.left - screenRect.left), // Posición relativa al screen
                            top: Math.round(rect.top - screenRect.top)
                        },
                        computed: {
                            display: computed.display,
                            textAlign: computed.textAlign,
                            width: computed.width,
                            maxWidth: computed.maxWidth,
                            margin: computed.margin,
                            padding: computed.padding
                        },
                        widthUsage: Math.round((rect.width / screenRect.width) * 100), // % del ancho usado
                        textContent: el.textContent ? el.textContent.trim().substring(0, 30) + '...' : ''
                    });
                }
            });
            
            // Ordenar por posición vertical (top) para ver la estructura
            visibleElements.sort((a, b) => a.rect.top - b.rect.top);
            
            return {
                screenWidth: Math.round(screenRect.width),
                screenHeight: Math.round(screenRect.height),
                totalVisibleElements: visibleElements.length,
                elements: visibleElements.slice(0, 15) // Top 15 elementos
            };
        }, section.id);
        
        if (contentAnalysis.error) {
            console.log(`   ERROR: ${contentAnalysis.error}`);
            continue;
        }
        
        console.log(`   Screen: ${contentAnalysis.screenWidth}px × ${contentAnalysis.screenHeight}px`);
        console.log(`   Elementos visibles: ${contentAnalysis.totalVisibleElements}`);
        console.log(`   Distribución de contenido:`);
        
        contentAnalysis.elements.forEach((el, i) => {
            const widthBar = '█'.repeat(Math.floor(el.widthUsage / 5)); // Barra visual del % de ancho
            const alignment = el.computed.textAlign === 'center' ? '[CENTER]' : 
                             el.computed.textAlign === 'right' ? '[RIGHT]' : '[LEFT]';
            
            console.log(`     ${i+1}. ${el.tag}#${el.id} - ${el.rect.width}px (${el.widthUsage}%) ${alignment}`);
            console.log(`        ${widthBar} pos:(${el.rect.left}, ${el.rect.top})`);
            if (el.className) console.log(`        class: ${el.className}`);
            if (el.textContent && el.textContent.trim()) {
                console.log(`        text: ${el.textContent}`);
            }
        });
        
        // Detectar si hay elementos que podrían estar mal distribuidos
        const narrowElements = contentAnalysis.elements.filter(el => 
            el.widthUsage < 50 && el.rect.width > 100 && el.tag !== 'BUTTON'
        );
        
        if (narrowElements.length > 0) {
            console.log(`   ⚠️  Elementos que no usan el ancho completo:`);
            narrowElements.forEach(el => {
                console.log(`      ${el.tag}#${el.id} - ${el.rect.width}px (${el.widthUsage}% de ${contentAnalysis.screenWidth}px)`);
            });
        }
    }
    
    console.log('\n✅ Análisis de distribución completado');
    await browser.close();
})();