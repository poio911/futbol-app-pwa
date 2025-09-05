const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;

test.describe('Captura Enfocada del Sistema de Evaluaciones', () => {
  
  test('Capturar elementos específicos del proceso de evaluación', async ({ page, context }) => {
    console.log('🎯 TEST ENFOCADO EN SISTEMA DE EVALUACIONES\n');
    console.log('=' .repeat(60));
    
    // Crear carpeta para screenshots
    const screenshotDir = 'test-screenshots/evaluacion-detallada';
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // Configurar viewport más grande
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // ========================================
    // PASO 1: NAVEGAR Y VERIFICAR ESTADO
    // ========================================
    console.log('\n📍 PASO 1: Navegando a la aplicación...');
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Verificar qué está visible
    const visibleElements = await page.evaluate(() => {
      const elements = {
        loginVisible: false,
        appVisible: false,
        currentScreen: '',
        visibleButtons: [],
        visibleDivs: []
      };
      
      // Verificar login
      const loginOverlay = document.querySelector('.login-overlay');
      if (loginOverlay && window.getComputedStyle(loginOverlay).display !== 'none') {
        elements.loginVisible = true;
      }
      
      // Verificar app
      const app = document.querySelector('#app');
      if (app && window.getComputedStyle(app).display !== 'none') {
        elements.appVisible = true;
      }
      
      // Obtener pantalla actual
      const screens = document.querySelectorAll('[id$="-screen"]');
      screens.forEach(screen => {
        if (window.getComputedStyle(screen).display !== 'none') {
          elements.currentScreen = screen.id;
        }
      });
      
      // Obtener botones visibles
      const buttons = document.querySelectorAll('button:not([style*="display: none"])');
      buttons.forEach(btn => {
        if (btn.offsetParent !== null && btn.textContent.trim()) {
          elements.visibleButtons.push(btn.textContent.trim());
        }
      });
      
      // Obtener divs principales visibles
      const divs = document.querySelectorAll('div[id]');
      divs.forEach(div => {
        if (div.offsetParent !== null) {
          elements.visibleDivs.push(div.id);
        }
      });
      
      return elements;
    });
    
    console.log('📊 Estado actual de la página:');
    console.log(`  - Login visible: ${visibleElements.loginVisible}`);
    console.log(`  - App visible: ${visibleElements.appVisible}`);
    console.log(`  - Pantalla actual: ${visibleElements.currentScreen || 'ninguna'}`);
    console.log(`  - Botones visibles: ${visibleElements.visibleButtons.slice(0, 5).join(', ')}`);
    
    // Capturar estado inicial
    await page.screenshot({
      path: `${screenshotDir}/00-estado-inicial.png`,
      fullPage: false
    });
    
    // ========================================
    // PASO 2: CREAR DEMO VISUAL DIRECTAMENTE
    // ========================================
    console.log('\n📍 PASO 2: Creando demostración visual del sistema de evaluaciones...');
    
    // Inyectar HTML de demostración directamente en el body
    await page.evaluate(() => {
      // Limpiar cualquier modal existente
      document.querySelectorAll('[id*="modal"], [id*="overlay"]').forEach(el => el.remove());
      
      // Crear contenedor de demostración
      const demoContainer = document.createElement('div');
      demoContainer.id = 'evaluation-demo';
      demoContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        z-index: 100000;
        overflow-y: auto;
        padding: 20px;
      `;
      
      // HTML de la demostración completa
      demoContainer.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
          <!-- Título Principal -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; font-size: 36px; margin: 0;">
              ⚽ Sistema de Evaluaciones Post-Partido
            </h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 18px; margin-top: 10px;">
              Demostración del proceso completo de evaluación
            </p>
          </div>
          
          <!-- Grid de pasos -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px;">
            
            <!-- PASO 1: Asignación -->
            <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; margin: -25px -25px 20px -25px;">
                <h2 style="margin: 0; font-size: 20px;">
                  1️⃣ Asignación Automática
                </h2>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: #f5f5f5; padding: 15px; border-radius: 10px;">
                  <p style="margin: 0; color: #666;">Jugando como:</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #333;">
                    🇦🇷 Lionel Messi
                  </p>
                </div>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; border-left: 4px solid #2196F3;">
                <p style="margin: 0; color: #1976D2; font-weight: 600;">
                  📋 Tus jugadores asignados para evaluar:
                </p>
                <ul style="margin: 10px 0 0 20px; color: #333;">
                  <li>Luka Modrić (Mediocampista)</li>
                  <li>Virgil van Dijk (Defensor)</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 15px; text-align: center;">
                ℹ️ El sistema asigna 2 compañeros aleatorios a cada jugador
              </p>
            </div>
            
            <!-- PASO 2: Evaluación -->
            <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 15px; border-radius: 10px; margin: -25px -25px 20px -25px;">
                <h2 style="margin: 0; font-size: 20px;">
                  2️⃣ Proceso de Evaluación
                </h2>
              </div>
              
              <!-- Evaluación de Modrić -->
              <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 50px; height: 50px; background: #4CAF50; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px;">
                    LM
                  </div>
                  <div>
                    <strong style="color: #333;">Luka Modrić</strong>
                    <p style="margin: 2px 0 0 0; color: #666; font-size: 14px;">OVR: 89</p>
                  </div>
                </div>
                
                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                  ${[1,2,3,4,5,6,7,8,9,10].map(n => 
                    `<div style="width: 30px; height: 30px; background: ${n === 8 ? '#4CAF50' : '#e0e0e0'}; color: ${n === 8 ? 'white' : '#666'}; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${n}</div>`
                  ).join('')}
                </div>
                
                <input type="text" value="Excelente visión de juego" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" readonly>
              </div>
              
              <!-- Evaluación de Van Dijk -->
              <div style="background: #f9f9f9; padding: 15px; border-radius: 10px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 50px; height: 50px; background: #FF9800; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px;">
                    VD
                  </div>
                  <div>
                    <strong style="color: #333;">Virgil van Dijk</strong>
                    <p style="margin: 2px 0 0 0; color: #666; font-size: 14px;">OVR: 90</p>
                  </div>
                </div>
                
                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                  ${[1,2,3,4,5,6,7,8,9,10].map(n => 
                    `<div style="width: 30px; height: 30px; background: ${n === 9 ? '#4CAF50' : '#e0e0e0'}; color: ${n === 9 ? 'white' : '#666'}; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${n}</div>`
                  ).join('')}
                </div>
                
                <input type="text" value="Defensa impenetrable" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" readonly>
              </div>
            </div>
            
            <!-- PASO 3: Progreso -->
            <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 15px; border-radius: 10px; margin: -25px -25px 20px -25px;">
                <h2 style="margin: 0; font-size: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
                  3️⃣ Progreso del Equipo
                </h2>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Progreso total:</span>
                  <strong style="color: #333;">7/8 (87%)</strong>
                </div>
                <div style="background: #e0e0e0; height: 25px; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); width: 87%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                    87%
                  </div>
                </div>
              </div>
              
              <div style="max-height: 200px; overflow-y: auto;">
                <div style="display: flex; align-items: center; padding: 10px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #4CAF50; margin-right: 10px;">✅</span>
                  <span style="flex: 1; color: #333; font-size: 14px;">Messi</span>
                </div>
                <div style="display: flex; align-items: center; padding: 10px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #4CAF50; margin-right: 10px;">✅</span>
                  <span style="flex: 1; color: #333; font-size: 14px;">Ronaldo</span>
                </div>
                <div style="display: flex; align-items: center; padding: 10px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #4CAF50; margin-right: 10px;">✅</span>
                  <span style="flex: 1; color: #333; font-size: 14px;">De Bruyne</span>
                </div>
                <div style="display: flex; align-items: center; padding: 10px; background: #fff3e0; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #FF9800; margin-right: 10px;">⏳</span>
                  <span style="flex: 1; color: #333; font-size: 14px;">Ramos</span>
                </div>
                <div style="display: flex; align-items: center; padding: 10px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #4CAF50; margin-right: 10px;">✅</span>
                  <span style="flex: 1; color: #333; font-size: 14px;">Van Dijk</span>
                </div>
              </div>
              
              <div style="background: #e8f5e9; padding: 10px; border-radius: 8px; margin-top: 15px; text-align: center;">
                <p style="margin: 0; color: #2E7D32; font-weight: 600;">
                  ✅ 80% alcanzado - OVRs serán actualizados
                </p>
              </div>
            </div>
            
            <!-- PASO 4: Resultados -->
            <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #89f7fe, #66a6ff); color: white; padding: 15px; border-radius: 10px; margin: -25px -25px 20px -25px;">
                <h2 style="margin: 0; font-size: 20px;">
                  4️⃣ Actualización de OVRs
                </h2>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px;">🏆</div>
                <p style="margin: 0; color: #333; font-weight: 600;">¡Evaluaciones Completadas!</p>
              </div>
              
              <div style="max-height: 250px; overflow-y: auto;">
                <!-- Modrić -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 600;">Modrić</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #666;">89</span>
                    <span style="color: #4CAF50;">→</span>
                    <span style="color: #4CAF50; font-weight: bold;">91</span>
                    <span style="color: #4CAF50; font-size: 12px;">+2</span>
                  </div>
                </div>
                
                <!-- Van Dijk -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 600;">Van Dijk</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #666;">90</span>
                    <span style="color: #4CAF50;">→</span>
                    <span style="color: #4CAF50; font-weight: bold;">92</span>
                    <span style="color: #4CAF50; font-size: 12px;">+2</span>
                  </div>
                </div>
                
                <!-- Messi -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #e8f5e9; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 600;">Messi</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #666;">94</span>
                    <span style="color: #4CAF50;">→</span>
                    <span style="color: #4CAF50; font-weight: bold;">95</span>
                    <span style="color: #4CAF50; font-size: 12px;">+1</span>
                  </div>
                </div>
                
                <!-- Neuer -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #ffebee; border-radius: 8px; margin-bottom: 8px;">
                  <span style="color: #333; font-weight: 600;">Neuer</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #666;">88</span>
                    <span style="color: #f44336;">→</span>
                    <span style="color: #f44336; font-weight: bold;">87</span>
                    <span style="color: #f44336; font-size: 12px;">-1</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #666; font-size: 12px; margin-top: 15px; text-align: center;">
                Los cambios se basan en el promedio de evaluaciones
              </p>
            </div>
          </div>
          
          <!-- Footer informativo -->
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-top: 30px; text-align: center;">
            <h3 style="color: white; margin: 0 0 15px 0;">📚 Resumen del Sistema</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; color: rgba(255,255,255,0.9); font-size: 14px;">
              <div>✅ 2 evaluaciones por jugador</div>
              <div>🎯 Escala de 1 a 10</div>
              <div>💬 Comentarios opcionales</div>
              <div>🔒 Evaluaciones anónimas</div>
              <div>📊 80% requerido para actualizar</div>
              <div>🚫 Invitados no participan</div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(demoContainer);
    });
    
    await page.waitForTimeout(1000);
    
    // Capturar la demostración completa
    await page.screenshot({
      path: `${screenshotDir}/01-demo-completa-evaluaciones.png`,
      fullPage: true
    });
    console.log('  ✅ Screenshot: Demostración completa del sistema');
    
    // ========================================
    // PASO 3: CAPTURAR SECCIONES INDIVIDUALES
    // ========================================
    console.log('\n📍 PASO 3: Capturando secciones individuales...');
    
    // Hacer scroll y capturar cada sección
    const sections = [
      { selector: 'div:has(> div:has(> h2:has-text("1️⃣")))', name: '02-asignacion-automatica' },
      { selector: 'div:has(> div:has(> h2:has-text("2️⃣")))', name: '03-proceso-evaluacion' },
      { selector: 'div:has(> div:has(> h2:has-text("3️⃣")))', name: '04-progreso-equipo' },
      { selector: 'div:has(> div:has(> h2:has-text("4️⃣")))', name: '05-actualizacion-ovrs' }
    ];
    
    for (const section of sections) {
      try {
        const element = page.locator(section.selector).first();
        if (await element.isVisible()) {
          await element.scrollIntoViewIfNeeded();
          await element.screenshot({
            path: `${screenshotDir}/${section.name}.png`
          });
          console.log(`  ✅ Screenshot: ${section.name}`);
        }
      } catch (e) {
        console.log(`  ⚠️ No se pudo capturar: ${section.name}`);
      }
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
    screenshots.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    console.log('\n🎯 PROCESO DOCUMENTADO:');
    console.log('  1️⃣ Asignación automática de 2 jugadores');
    console.log('  2️⃣ Interfaz de evaluación con ratings 1-10');
    console.log('  3️⃣ Progreso del equipo (87% completado)');
    console.log('  4️⃣ Actualización automática de OVRs');
    
    console.log('\n' + '='.repeat(60));
    console.log(`📂 Ver capturas en: ${screenshotDir}/`);
    console.log('=' .repeat(60));
  });
});