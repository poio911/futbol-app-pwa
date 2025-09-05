const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n🔍 ANALIZANDO PARTIDOS GRUPALES...\n');
  
  try {
    // Navegar a la app
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);
    
    // Login si es necesario
    const authVisible = await page.locator('#auth-screen').isVisible().catch(() => false);
    if (authVisible) {
      console.log('📝 Haciendo login...');
      await page.fill('input[type="email"]', 'poio911@hotmail.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button:has-text("Ingresar")');
      await page.waitForTimeout(3000);
    }
    
    // Click en Partidos Grupales
    console.log('📂 Navegando a Partidos Grupales...');
    await page.click('button:has-text("Partidos Grupales")');
    await page.waitForTimeout(2000);
    
    // Analizar sección
    console.log('\n📊 ESTADO ACTUAL:\n');
    
    // Container principal
    const hasSection = await page.locator('#collaborative-section').count() > 0;
    console.log(`✓ Sección colaborativa: ${hasSection ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Botón crear
    const hasCreateBtn = await page.locator('button:has-text("Crear Partido Grupal")').count() > 0;
    console.log(`✓ Botón crear partido: ${hasCreateBtn ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Container de partidos
    const hasContainer = await page.locator('#all-matches').count() > 0;
    console.log(`✓ Container de partidos: ${hasContainer ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Contar partidos
    const matchCount = await page.locator('.match-card').count();
    console.log(`✓ Partidos mostrados: ${matchCount}`);
    
    // Si hay partidos, analizar el primero
    if (matchCount > 0) {
      console.log('\n🎯 ANALIZANDO PRIMER PARTIDO:');
      const firstCard = page.locator('.match-card').first();
      const cardText = await firstCard.textContent();
      
      console.log('Contenido del card:');
      console.log(cardText.substring(0, 200) + '...');
      
      // Verificar botones
      const buttons = await firstCard.locator('button').count();
      console.log(`✓ Botones en el card: ${buttons}`);
      
      // Screenshot del card
      await firstCard.screenshot({ path: 'card-partido.png' });
      console.log('📸 Screenshot del card guardado: card-partido.png');
    }
    
    // Probar modal de crear
    if (hasCreateBtn) {
      console.log('\n🔧 PROBANDO MODAL DE CREACIÓN:');
      await page.click('button:has-text("Crear Partido Grupal")');
      await page.waitForTimeout(1000);
      
      // Buscar modal
      const modalVisible = await page.locator('.modal:visible, #create-match-modal').isVisible().catch(() => false);
      console.log(`✓ Modal se abre: ${modalVisible ? 'SÍ' : 'NO'}`);
      
      if (modalVisible) {
        // Buscar campos
        const hasTitle = await page.locator('input[name="title"]').count() > 0;
        const hasDate = await page.locator('input[name="date"]').count() > 0;
        const hasTime = await page.locator('input[name="time"]').count() > 0;
        const hasLocation = await page.locator('input[name="location"]').count() > 0;
        
        console.log(`✓ Campo título: ${hasTitle ? 'EXISTE' : 'NO EXISTE'}`);
        console.log(`✓ Campo fecha: ${hasDate ? 'EXISTE' : 'NO EXISTE'}`);
        console.log(`✓ Campo hora: ${hasTime ? 'EXISTE' : 'NO EXISTE'}`);
        console.log(`✓ Campo ubicación: ${hasLocation ? 'EXISTE' : 'NO EXISTE'}`);
        
        // Buscar sección de invitados
        const pageContent = await page.content();
        const hasInviteFeature = pageContent.includes('invitar') || pageContent.includes('Invitar') || 
                                 pageContent.includes('guest') || pageContent.includes('Guest');
        console.log(`✓ Sistema de invitación: ${hasInviteFeature ? 'PARECE EXISTIR' : 'NO ENCONTRADO'}`);
        
        // Screenshot del modal
        await page.screenshot({ path: 'modal-crear.png' });
        console.log('📸 Screenshot del modal guardado: modal-crear.png');
      }
    }
    
    // Screenshot general
    await page.screenshot({ path: 'partidos-grupales.png', fullPage: true });
    console.log('\n📸 Screenshot completo guardado: partidos-grupales.png');
    
    console.log('\n✅ ANÁLISIS COMPLETADO\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();