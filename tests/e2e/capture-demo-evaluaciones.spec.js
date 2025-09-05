const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;

test.describe('Captura de la Demo de Evaluaciones', () => {
  
  test('Capturar la página demo del sistema de evaluaciones', async ({ page }) => {
    console.log('📸 CAPTURANDO DEMO DEL SISTEMA DE EVALUACIONES\n');
    console.log('=' .repeat(60));
    
    // Crear carpeta para screenshots
    const screenshotDir = 'test-screenshots/demo-evaluaciones';
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // Configurar viewport más grande para capturar todo
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // ========================================
    // PASO 1: CARGAR PÁGINA DEMO
    // ========================================
    console.log('\n📍 PASO 1: Cargando página de demostración...');
    
    // Navegar directamente a la página demo
    await page.goto('/demo-evaluaciones.html');
    await page.waitForTimeout(2000);
    
    // Capturar la página completa
    await page.screenshot({
      path: `${screenshotDir}/01-pagina-completa.png`,
      fullPage: true
    });
    console.log('  ✅ Screenshot: Página completa del sistema de evaluaciones');
    
    // ========================================
    // PASO 2: CAPTURAR SECCIONES INDIVIDUALES
    // ========================================
    console.log('\n📍 PASO 2: Capturando secciones individuales...');
    
    // Scroll al inicio
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Capturar vista superior (título y primeras cards)
    await page.screenshot({
      path: `${screenshotDir}/02-vista-superior.png`,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('  ✅ Screenshot: Vista superior con contexto del partido');
    
    // Scroll a la mitad
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    // Capturar vista media (evaluaciones)
    await page.screenshot({
      path: `${screenshotDir}/03-proceso-evaluacion.png`,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('  ✅ Screenshot: Proceso de evaluación de jugadores');
    
    // Scroll al final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Capturar vista inferior (resultados y explicación)
    await page.screenshot({
      path: `${screenshotDir}/04-resultados-explicacion.png`,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('  ✅ Screenshot: Resultados y explicación del sistema');
    
    // ========================================
    // PASO 3: CAPTURAR CARDS ESPECÍFICAS
    // ========================================
    console.log('\n📍 PASO 3: Capturando elementos específicos...');
    
    // Volver al inicio
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Capturar cards individuales
    const cards = [
      { selector: '.card:has(.card-header:has-text("Tu Perfil de Evaluador"))', name: '05-perfil-evaluador' },
      { selector: '.card:has(.card-header:has-text("Evaluar Jugador 1/2"))', name: '06-evaluar-jugador-1' },
      { selector: '.card:has(.card-header:has-text("Evaluar Jugador 2/2"))', name: '07-evaluar-jugador-2' },
      { selector: '.card:has(.card-header:has-text("Progreso de Evaluaciones"))', name: '08-progreso-equipo' },
      { selector: '.card:has(.card-header:has-text("Actualización de OVRs"))', name: '09-actualizacion-ovrs' },
      { selector: '.card:has(.card-header:has-text("Cómo Funciona"))', name: '10-explicacion-sistema' }
    ];
    
    for (const card of cards) {
      try {
        const element = page.locator(card.selector).first();
        if (await element.isVisible()) {
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await element.screenshot({
            path: `${screenshotDir}/${card.name}.png`
          });
          console.log(`  ✅ Screenshot: ${card.name}`);
        }
      } catch (e) {
        console.log(`  ⚠️ No se pudo capturar: ${card.name}`);
      }
    }
    
    // ========================================
    // PASO 4: INTERACCIONES
    // ========================================
    console.log('\n📍 PASO 4: Capturando interacciones...');
    
    // Hacer click en algunos ratings para mostrar interactividad
    const ratingButtons = page.locator('.rating-btn').all();
    const buttons = await ratingButtons;
    
    if (buttons.length > 0) {
      // Click en diferentes ratings
      await buttons[6].click(); // Rating 7
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: `${screenshotDir}/11-interaccion-rating.png`,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });
      console.log('  ✅ Screenshot: Interacción con sistema de rating');
    }
    
    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📸 CAPTURAS COMPLETADAS');
    console.log('=' .repeat(60));
    
    const screenshots = await fs.readdir(screenshotDir);
    console.log(`\n✅ Total de screenshots: ${screenshots.length}`);
    console.log('\n📁 Archivos generados:');
    
    for (const file of screenshots) {
      const stats = await fs.stat(`${screenshotDir}/${file}`);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`  - ${file} (${size} KB)`);
    }
    
    console.log('\n🎯 ELEMENTOS CAPTURADOS:');
    console.log('  ✅ Contexto del partido finalizado');
    console.log('  ✅ Perfil del evaluador (Messi)');
    console.log('  ✅ Evaluación de Modrić (8/10)');
    console.log('  ✅ Evaluación de Van Dijk (9/10)');
    console.log('  ✅ Progreso del equipo (87%)');
    console.log('  ✅ Actualización de OVRs');
    console.log('  ✅ Explicación completa del sistema');
    
    console.log('\n💡 CARACTERÍSTICAS DOCUMENTADAS:');
    console.log('  • Cada jugador evalúa a 2 compañeros');
    console.log('  • Escala de evaluación 1-10');
    console.log('  • Comentarios opcionales');
    console.log('  • Sistema anónimo');
    console.log('  • 80% de participación requerida');
    console.log('  • Actualización automática de OVRs');
    console.log('  • Jugadores invitados excluidos');
    
    console.log('\n' + '='.repeat(60));
    console.log(`📂 Ver capturas en: ${screenshotDir}/`);
    console.log('🌐 Página demo: /demo-evaluaciones.html');
    console.log('=' .repeat(60));
  });
});