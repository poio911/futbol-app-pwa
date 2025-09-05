const { chromium } = require('playwright');

(async () => {
    console.log('🎨 Iniciando análisis de estilos CSS...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la aplicación
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    // Función para analizar estilos de una sección
    async function analyzeStyles(sectionName, screenId) {
        console.log(`\n🔍 Analizando estilos: ${sectionName}`);
        
        try {
            // Navegar a la sección
            await page.click(`button[data-screen="${screenId}"]`);
            await page.waitForTimeout(1000);
            
            // Analizar #app
            const appStyles = await page.evaluate(() => {
                const app = document.getElementById('app');
                const computedStyles = window.getComputedStyle(app);
                return {
                    width: computedStyles.width,
                    maxWidth: computedStyles.maxWidth,
                    minWidth: computedStyles.minWidth,
                    padding: computedStyles.padding,
                    margin: computedStyles.margin,
                    boxSizing: computedStyles.boxSizing,
                    display: computedStyles.display,
                    position: computedStyles.position
                };
            });
            
            console.log(`   #app estilos:`, JSON.stringify(appStyles, null, 4));
            
            // Analizar #main-content
            const mainContentStyles = await page.evaluate(() => {
                const mainContent = document.getElementById('main-content');
                if (!mainContent) return null;
                const computedStyles = window.getComputedStyle(mainContent);
                return {
                    width: computedStyles.width,
                    maxWidth: computedStyles.maxWidth,
                    minWidth: computedStyles.minWidth,
                    padding: computedStyles.padding,
                    margin: computedStyles.margin,
                    boxSizing: computedStyles.boxSizing,
                    display: computedStyles.display,
                    position: computedStyles.position
                };
            });
            
            if (mainContentStyles) {
                console.log(`   #main-content estilos:`, JSON.stringify(mainContentStyles, null, 4));
            }
            
            // Analizar la pantalla específica
            const screenStyles = await page.evaluate((screenId) => {
                const screen = document.getElementById(screenId + '-screen');
                if (!screen) return null;
                const computedStyles = window.getComputedStyle(screen);
                return {
                    width: computedStyles.width,
                    maxWidth: computedStyles.maxWidth,
                    minWidth: computedStyles.minWidth,
                    padding: computedStyles.padding,
                    margin: computedStyles.margin,
                    boxSizing: computedStyles.boxSizing,
                    display: computedStyles.display,
                    position: computedStyles.position
                };
            }, screenId);
            
            if (screenStyles) {
                console.log(`   #${screenId}-screen estilos:`, JSON.stringify(screenStyles, null, 4));
            }
            
            // Verificar si hay elementos con ancho fijo
            const fixedWidthElements = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const fixedElements = [];
                elements.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    if (styles.width && (styles.width.includes('px') && !styles.width.includes('auto'))) {
                        const width = parseFloat(styles.width);
                        if (width > 400) { // Solo elementos anchos
                            fixedElements.push({
                                tag: el.tagName,
                                id: el.id,
                                class: el.className,
                                width: styles.width,
                                maxWidth: styles.maxWidth
                            });
                        }
                    }
                });
                return fixedElements.slice(0, 5); // Solo los primeros 5
            });
            
            if (fixedWidthElements.length > 0) {
                console.log(`   Elementos con ancho fijo (>400px):`, JSON.stringify(fixedWidthElements, null, 4));
            }
            
        } catch (error) {
            console.log(`   Error analizando ${sectionName}: ${error.message}`);
        }
    }
    
    // Analizar cada sección
    await analyzeStyles('Colaborativos', 'collaborative');
    await analyzeStyles('Manuales', 'matches');
    await analyzeStyles('Jugadores', 'players');
    await analyzeStyles('Evaluaciones', 'evaluations');
    
    console.log('\n✅ Análisis de estilos completado');
    await browser.close();
})();