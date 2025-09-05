const { chromium } = require('playwright');

(async () => {
    console.log('📏 Analizando contenido de cada sección...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la aplicación
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    // Función para analizar contenido de una sección
    async function analyzeContent(sectionName, screenId) {
        console.log(`\n🔍 Analizando contenido: ${sectionName}`);
        
        // Cambiar a la sección
        await page.click(`button[data-screen="${screenId}"]`);
        await page.waitForTimeout(1500);
        
        // Obtener todos los elementos visibles y sus anchos
        const contentAnalysis = await page.evaluate((screenId) => {
            const screen = document.getElementById(screenId + '-screen');
            if (!screen) return { error: 'Screen not found' };
            
            const visibleElements = [];
            const allElements = screen.querySelectorAll('*');
            
            allElements.forEach((el, index) => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                
                // Solo elementos visibles y con ancho significativo
                if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 100) {
                    visibleElements.push({
                        tag: el.tagName,
                        id: el.id || `unnamed-${index}`,
                        className: el.className || '',
                        width: rect.width,
                        computedWidth: style.width,
                        maxWidth: style.maxWidth,
                        minWidth: style.minWidth,
                        display: style.display,
                        position: style.position,
                        textContent: el.textContent ? el.textContent.substring(0, 50) + '...' : ''
                    });
                }
            });
            
            // Ordenar por ancho descendente
            visibleElements.sort((a, b) => b.width - a.width);
            
            const screenStyle = window.getComputedStyle(screen);
            return {
                totalElements: allElements.length,
                visibleWideElements: visibleElements.slice(0, 10), // Top 10 más anchos
                screenRect: screen.getBoundingClientRect(),
                screenComputedStyle: {
                    width: screenStyle.width,
                    maxWidth: screenStyle.maxWidth,
                    minWidth: screenStyle.minWidth,
                    display: screenStyle.display
                }
            };
        }, screenId);
        
        console.log(`   Screen dimensions: ${contentAnalysis.screenRect.width}px × ${contentAnalysis.screenRect.height}px`);
        console.log(`   Computed styles:`, JSON.stringify(contentAnalysis.screenComputedStyle, null, 4));
        console.log(`   Total elements: ${contentAnalysis.totalElements}`);
        console.log(`   Wide elements (>100px):`);
        
        contentAnalysis.visibleWideElements.forEach((el, i) => {
            console.log(`      ${i+1}. ${el.tag}#${el.id} - ${el.width}px (computed: ${el.computedWidth}, max: ${el.maxWidth})`);
            if (el.className) console.log(`         Classes: ${el.className}`);
            if (el.textContent && el.textContent.trim()) {
                console.log(`         Text: ${el.textContent.trim().substring(0, 80)}...`);
            }
        });
        
        // Buscar elementos con anchos fijos problemáticos
        const fixedWidthElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const problematic = [];
            
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                
                // Elementos con anchos fijos o muy anchos
                if ((style.width && style.width.includes('px') && parseInt(style.width) > 500) ||
                    (style.minWidth && style.minWidth.includes('px') && parseInt(style.minWidth) > 500) ||
                    rect.width > 600) {
                    
                    problematic.push({
                        tag: el.tagName,
                        id: el.id || 'no-id',
                        className: el.className || '',
                        width: rect.width,
                        computedWidth: style.width,
                        minWidth: style.minWidth,
                        maxWidth: style.maxWidth
                    });
                }
            });
            
            return problematic.slice(0, 5); // Top 5 problemáticos
        });
        
        if (fixedWidthElements.length > 0) {
            console.log(`   🚨 Elementos problemáticos (>500px o fixed):`);
            fixedWidthElements.forEach((el, i) => {
                console.log(`      ${i+1}. ${el.tag}#${el.id}.${el.className} - actual: ${el.width}px, computed: ${el.computedWidth}, min: ${el.minWidth}`);
            });
        }
    }
    
    // Analizar cada sección
    await analyzeContent('Colaborativos', 'collaborative');
    await analyzeContent('Manuales', 'matches');
    await analyzeContent('Jugadores', 'players');
    await analyzeContent('Evaluaciones', 'evaluations');
    
    console.log('\n✅ Análisis de contenido completado');
    await browser.close();
})();