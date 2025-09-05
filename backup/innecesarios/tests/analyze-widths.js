const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Iniciando análisis de anchos...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navegar a la aplicación
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(3000);
    
    // Objeto para almacenar medidas
    const measurements = {};
    
    // Función para medir elementos de una sección
    async function measureSection(sectionName, screenId, buttonSelector) {
        console.log(`\n📏 Midiendo sección: ${sectionName}`);
        
        try {
            // Navegar a la sección
            await page.click(`button[data-screen="${screenId}"]`);
            await page.waitForTimeout(1500);
            
            const section = page.locator(`#${screenId}-screen`);
            const sectionBox = await section.boundingBox();
            
            measurements[sectionName] = {
                screenWidth: sectionBox ? sectionBox.width : 0,
                screenHeight: sectionBox ? sectionBox.height : 0
            };
            
            console.log(`   Screen container: ${measurements[sectionName].screenWidth}px × ${measurements[sectionName].screenHeight}px`);
            
            // Medir botón principal si existe
            if (buttonSelector) {
                try {
                    const button = page.locator(buttonSelector).first();
                    const buttonBox = await button.boundingBox();
                    measurements[sectionName].buttonWidth = buttonBox ? buttonBox.width : 0;
                    console.log(`   Main button: ${measurements[sectionName].buttonWidth}px`);
                } catch (e) {
                    console.log(`   Main button: No encontrado`);
                    measurements[sectionName].buttonWidth = 0;
                }
            }
            
            // Medir el #app container
            const appContainer = page.locator('#app');
            const appBox = await appContainer.boundingBox();
            measurements[sectionName].appWidth = appBox ? appBox.width : 0;
            console.log(`   App container: ${measurements[sectionName].appWidth}px`);
            
        } catch (error) {
            console.log(`   Error midiendo ${sectionName}: ${error.message}`);
            measurements[sectionName] = {
                screenWidth: 0,
                screenHeight: 0,
                buttonWidth: 0,
                appWidth: 0
            };
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
        console.log(`  - App Container: ${data.appWidth}px`);
        console.log(`  - Screen: ${data.screenWidth}px × ${data.screenHeight}px`);
        console.log(`  - Button: ${data.buttonWidth}px`);
    });
    
    // Detectar diferencias significativas
    console.log('\n🔍 ANÁLISIS DE DIFERENCIAS:');
    console.log('============================');
    
    const widths = Object.entries(measurements).map(([name, data]) => ({
        name,
        app: data.appWidth,
        screen: data.screenWidth,
        button: data.buttonWidth
    }));
    
    // Comparar anchos del container #app
    const appWidths = widths.map(w => w.app).filter(w => w > 0);
    const maxAppWidth = Math.max(...appWidths);
    const minAppWidth = Math.min(...appWidths);
    
    if (maxAppWidth - minAppWidth > 10) {
        console.log(`⚠️  DIFERENCIA EN ANCHOS DE #APP: ${maxAppWidth - minAppWidth}px`);
        widths.forEach(w => {
            if (w.app > 0) {
                const diff = maxAppWidth - w.app;
                console.log(`   ${w.name}: ${w.app}px ${diff > 0 ? `(-${diff}px)` : '(máximo)'}`);
            }
        });
    } else {
        console.log('✅ Anchos de #app consistentes');
    }
    
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
    
    // Comparar anchos de botones
    const buttonWidths = widths.map(w => w.button).filter(w => w > 0);
    if (buttonWidths.length > 0) {
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
    }
    
    // Capturar screenshots para referencia visual
    console.log('\n📸 Capturando screenshots...');
    
    await page.click('button[data-screen="collaborative"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'width-analysis-colaborativos.png', fullPage: false });
    
    await page.click('button[data-screen="matches"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'width-analysis-manuales.png', fullPage: false });
    
    await page.click('button[data-screen="players"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'width-analysis-jugadores.png', fullPage: false });
    
    await page.click('button[data-screen="evaluations"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'width-analysis-evaluaciones.png', fullPage: false });
    
    console.log('\n✅ Análisis completado - Ver screenshots generados');
    console.log('📁 Screenshots guardados en el directorio raíz');
    
    await browser.close();
})();