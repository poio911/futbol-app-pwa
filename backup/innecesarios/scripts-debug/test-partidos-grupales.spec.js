const { test, expect, chromium } = require('@playwright/test');

test.describe('Partidos Grupales - Estado Actual', () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Analizar UI y funcionalidad actual', async () => {
    // Navegar a la app
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    console.log('\n=== ANÁLISIS DE PARTIDOS GRUPALES ===\n');
    
    // Intentar login si es necesario
    const authScreen = await page.locator('#auth-screen').count();
    if (authScreen > 0 && await page.locator('#auth-screen').isVisible()) {
      console.log('→ Realizando login...');
      await page.fill('input[type="email"]', 'poio911@hotmail.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button:has-text("Ingresar")');
      await page.waitForTimeout(3000);
    }
    
    // Navegar a Partidos Grupales
    console.log('\n1. NAVEGACIÓN');
    const partidosBtn = page.locator('button:has-text("Partidos Grupales")');
    const btnExists = await partidosBtn.count() > 0;
    console.log(`   ✓ Botón "Partidos Grupales": ${btnExists ? 'EXISTE' : 'NO ENCONTRADO'}`);
    
    if (btnExists) {
      await partidosBtn.click();
      await page.waitForTimeout(1000);
      
      // Analizar la sección de partidos grupales
      const section = await page.locator('#collaborative-section').isVisible();
      console.log(`   ✓ Sección visible: ${section}`);
      
      // Analizar el header de la sección
      console.log('\n2. HEADER DE LA SECCIÓN');
      const createBtn = page.locator('button:has-text("Crear Partido Grupal")');
      const createBtnExists = await createBtn.count() > 0;
      console.log(`   ✓ Botón "Crear Partido Grupal": ${createBtnExists ? 'EXISTE' : 'NO ENCONTRADO'}`);
      
      // Analizar lista de partidos
      console.log('\n3. LISTA DE PARTIDOS');
      const matchesContainer = page.locator('#all-matches');
      const containerExists = await matchesContainer.count() > 0;
      console.log(`   ✓ Container de partidos: ${containerExists ? 'EXISTE' : 'NO ENCONTRADO'}`);
      
      if (containerExists) {
        const matchCards = await page.locator('.match-card').count();
        console.log(`   ✓ Partidos encontrados: ${matchCards}`);
        
        if (matchCards > 0) {
          // Analizar primer partido
          const firstCard = page.locator('.match-card').first();
          const cardHTML = await firstCard.innerHTML();
          
          // Verificar elementos del card
          console.log('\n4. ELEMENTOS DEL CARD DE PARTIDO');
          console.log(`   ✓ Tiene título: ${cardHTML.includes('match-title')}`);
          console.log(`   ✓ Tiene fecha: ${cardHTML.includes('match-date') || cardHTML.includes('📅')}`);
          console.log(`   ✓ Tiene ubicación: ${cardHTML.includes('match-location') || cardHTML.includes('📍')}`);
          console.log(`   ✓ Tiene jugadores: ${cardHTML.includes('registered-count') || cardHTML.includes('/10')}`);
          console.log(`   ✓ Tiene botones: ${cardHTML.includes('button')}`);
          
          // Capturar screenshot del card
          await firstCard.screenshot({ path: 'partido-card-actual.png' });
          console.log('\n   📸 Screenshot guardado: partido-card-actual.png');
        }
      }
      
      // Intentar abrir modal de crear partido
      console.log('\n5. MODAL DE CREACIÓN');
      if (createBtnExists) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('#create-match-modal, .create-match-modal, .modal:visible');
        const modalVisible = await modal.isVisible().catch(() => false);
        console.log(`   ✓ Modal se abre: ${modalVisible}`);
        
        if (modalVisible) {
          // Verificar campos del formulario
          console.log('\n6. CAMPOS DEL FORMULARIO');
          const fields = {
            'Título': 'input[name="title"]',
            'Fecha': 'input[name="date"], input[type="date"]',
            'Hora': 'input[name="time"], input[type="time"]',
            'Ubicación': 'input[name="location"]',
            'Formato': 'select[name="format"]',
            'Descripción': 'textarea[name="description"]'
          };
          
          for (const [name, selector] of Object.entries(fields)) {
            const exists = await page.locator(selector).count() > 0;
            console.log(`   ✓ Campo ${name}: ${exists ? 'EXISTE' : 'NO ENCONTRADO'}`);
          }
          
          // Verificar si hay sistema de invitación
          console.log('\n7. SISTEMA DE INVITACIÓN');
          const inviteSection = await page.locator(':has-text("invitar"), :has-text("Invitar"), :has-text("guest"), :has-text("Guest")').count();
          console.log(`   ✓ Sección de invitación: ${inviteSection > 0 ? 'EXISTE' : 'NO ENCONTRADO'}`);
          
          // Capturar screenshot del modal
          await modal.screenshot({ path: 'modal-crear-partido.png' });
          console.log('\n   📸 Screenshot guardado: modal-crear-partido.png');
          
          // Cerrar modal
          const closeBtn = page.locator('#close-modal, .modal-close, button:has-text("×")').first();
          if (await closeBtn.count() > 0) {
            await closeBtn.click();
          }
        }
      }
      
      // Analizar estilos generales
      console.log('\n8. ANÁLISIS DE ESTILOS');
      const sectionBg = await page.locator('#collaborative-section').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   ✓ Color de fondo: ${sectionBg}`);
      
      if (matchCards > 0) {
        const cardStyles = await page.locator('.match-card').first().evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            background: styles.background,
            borderRadius: styles.borderRadius,
            padding: styles.padding,
            boxShadow: styles.boxShadow
          };
        });
        console.log(`   ✓ Estilos del card:`);
        console.log(`     - Background: ${cardStyles.background.substring(0, 50)}...`);
        console.log(`     - Border radius: ${cardStyles.borderRadius}`);
        console.log(`     - Padding: ${cardStyles.padding}`);
        console.log(`     - Box shadow: ${cardStyles.boxShadow}`);
      }
      
      // Captura final de toda la sección
      await page.screenshot({ path: 'partidos-grupales-completo.png', fullPage: true });
      console.log('\n   📸 Screenshot completo guardado: partidos-grupales-completo.png');
    }
    
    console.log('\n=== FIN DEL ANÁLISIS ===\n');
  });
});