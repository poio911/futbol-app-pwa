const { test, expect } = require('@playwright/test');

test.describe('Análisis de diferencias de ancho entre secciones', () => {
    
    test('Comparar anchos de contenedores entre secciones', async ({ page }) => {
        console.log('🔍 Iniciando análisis de anchos...');
        
        // Navegar a la aplicación
        await page.goto('http://localhost:8080');
        await page.waitForTimeout(2000);
        
        // Objeto para almacenar medidas
        const measurements = {};
        
        // Función para medir elementos de una sección
        async function measureSection(sectionName, screenId, buttonId) {
            console.log(`\n📏 Midiendo sección: ${sectionName}`);
            
            // Navegar a la sección
            await page.click(`button[data-screen="${screenId}"]`);
            await page.waitForTimeout(1000);
            
            const section = page.locator(`#${screenId}-screen`);
            const sectionBox = await section.boundingBox();
            
            measurements[sectionName] = {
                screenWidth: sectionBox ? sectionBox.width : 0,
                screenHeight: sectionBox ? sectionBox.height : 0
            };
            
            console.log(`   Screen container: ${measurements[sectionName].screenWidth}px × ${measurements[sectionName].screenHeight}px`);
            
            // Medir botón principal si existe
            if (buttonId) {
                try {
                    const button = page.locator(buttonId).first();
                    const buttonBox = await button.boundingBox();
                    measurements[sectionName].buttonWidth = buttonBox ? buttonBox.width : 0;
                    console.log(`   Main button: ${measurements[sectionName].buttonWidth}px`);
                } catch (e) {
                    console.log(`   Main button: No encontrado`);
                    measurements[sectionName].buttonWidth = 0;
                }
            }
            
            // Medir elementos específicos de cada sección
            try {
                if (sectionName === 'Colaborativos') {
                    // Buscar contenedor de partidos
                    const matchesContainer = page.locator('#all-matches, #available-matches').first();
                    const matchesBox = await matchesContainer.boundingBox();
                    measurements[sectionName].contentWidth = matchesBox ? matchesBox.width : 0;
                    console.log(`   Content container: ${measurements[sectionName].contentWidth}px`);
                }
                
                if (sectionName === 'Manuales') {
                    // Buscar área de contenido principal
                    const contentArea = page.locator('#matches-screen .screen').first();
                    const contentBox = await contentArea.boundingBox();
                    measurements[sectionName].contentWidth = contentBox ? contentBox.width : 0;
                    console.log(`   Content container: ${measurements[sectionName].contentWidth}px`);
                }
                
                if (sectionName === 'Jugadores') {
                    // Buscar lista de jugadores
                    const playersContainer = page.locator('#players-screen .screen').first();
                    const playersBox = await playersContainer.boundingBox();
                    measurements[sectionName].contentWidth = playersBox ? playersBox.width : 0;
                    console.log(`   Content container: ${measurements[sectionName].contentWidth}px`);
                }
                
                if (sectionName === 'Evaluaciones') {
                    // Buscar contenedor de evaluaciones
                    const evalContainer = page.locator('#evaluations-screen .screen').first();
                    const evalBox = await evalContainer.boundingBox();
                    measurements[sectionName].contentWidth = evalBox ? evalBox.width : 0;
                    console.log(`   Content container: ${measurements[sectionName].contentWidth}px`);
                }
            } catch (e) {
                console.log(`   Content container: Error midiendo - ${e.message}`);
                measurements[sectionName].contentWidth = 0;
            }
        }
        
        // Medir cada sección
        await measureSection('Colaborativos', 'collaborative', '#create-match-btn');
        await measureSection('Manuales', 'matches', 'button[onclick*="showCreateManualMatchModal"]');
        await measureSection('Jugadores', 'players', null);
        await measureSection('Evaluaciones', 'evaluations', null);
        
        // Analizar diferencias
        console.log('\n📊 RESUMEN DE MEDIDAS:');
        console.log('========================');
        
        Object.entries(measurements).forEach(([section, data]) => {
            console.log(`${section}:`);
            console.log(`  - Screen: ${data.screenWidth}px × ${data.screenHeight}px`);
            console.log(`  - Button: ${data.buttonWidth}px`);
            console.log(`  - Content: ${data.contentWidth}px`);
        });
        
        // Detectar diferencias significativas
        console.log('\n🔍 ANÁLISIS DE DIFERENCIAS:');
        console.log('============================');
        
        const widths = Object.entries(measurements).map(([name, data]) => ({
            name,
            screen: data.screenWidth,
            content: data.contentWidth,
            button: data.buttonWidth
        }));
        
        // Comparar anchos de pantalla
        const screenWidths = widths.map(w => w.screen).filter(w => w > 0);
        const maxScreenWidth = Math.max(...screenWidths);
        const minScreenWidth = Math.min(...screenWidths);
        
        if (maxScreenWidth - minScreenWidth > 10) {
            console.log(`⚠️  DIFERENCIA EN ANCHOS DE PANTALLA: ${maxScreenWidth - minScreenWidth}px`);
            widths.forEach(w => {
                if (w.screen > 0) {
                    const diff = maxScreenWidth - w.screen;
                    console.log(`   ${w.name}: ${w.screen}px ${diff > 0 ? `(-${diff}px)` : '(máximo)'}`);
                }
            });
        } else {
            console.log('✅ Anchos de pantalla consistentes');
        }
        
        // Comparar anchos de contenido
        const contentWidths = widths.map(w => w.content).filter(w => w > 0);
        const maxContentWidth = Math.max(...contentWidths);
        const minContentWidth = Math.min(...contentWidths);
        
        if (maxContentWidth - minContentWidth > 10) {
            console.log(`⚠️  DIFERENCIA EN ANCHOS DE CONTENIDO: ${maxContentWidth - minContentWidth}px`);
            widths.forEach(w => {
                if (w.content > 0) {
                    const diff = maxContentWidth - w.content;
                    console.log(`   ${w.name}: ${w.content}px ${diff > 0 ? `(-${diff}px)` : '(máximo)'}`);
                }
            });
        } else {
            console.log('✅ Anchos de contenido consistentes');
        }
        
        // Comparar anchos de botones
        const buttonWidths = widths.map(w => w.button).filter(w => w > 0);
        const maxButtonWidth = Math.max(...buttonWidths);
        const minButtonWidth = Math.min(...buttonWidths);
        
        if (maxButtonWidth - minButtonWidth > 10) {
            console.log(`⚠️  DIFERENCIA EN ANCHOS DE BOTONES: ${maxButtonWidth - minButtonWidth}px`);
            widths.forEach(w => {
                if (w.button > 0) {
                    const diff = maxButtonWidth - w.button;
                    console.log(`   ${w.name}: ${w.button}px ${diff > 0 ? `(-${diff}px)` : '(máximo)'}`);
                }
            });
        } else {
            console.log('✅ Anchos de botones consistentes');
        }
        
        // Capturar screenshots para referencia visual
        console.log('\n📸 Capturando screenshots...');
        
        await page.click('button[data-screen="collaborative"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'width-analysis-colaborativos.png', fullPage: true });
        
        await page.click('button[data-screen="matches"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'width-analysis-manuales.png', fullPage: true });
        
        await page.click('button[data-screen="players"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'width-analysis-jugadores.png', fullPage: true });
        
        await page.click('button[data-screen="evaluations"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'width-analysis-evaluaciones.png', fullPage: true });
        
        console.log('✅ Análisis completado - Ver screenshots generados');
    });
});