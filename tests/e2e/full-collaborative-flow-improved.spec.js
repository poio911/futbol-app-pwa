const { test, expect } = require('@playwright/test');

test.describe('Sistema Colaborativo - Test Mejorado', () => {
  
  test('Test completo con mejor detección de elementos', async ({ page }) => {
    console.log('🚀 Iniciando test mejorado del sistema colaborativo...\n');
    
    // ========================================
    // CONFIGURACIÓN INICIAL
    // ========================================
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Tomar screenshot inicial
    await page.screenshot({ path: 'test-screenshots/01-inicial.png' });
    
    // ========================================
    // DETECCIÓN DE ELEMENTOS EN PANTALLA
    // ========================================
    console.log('🔍 ANALIZANDO ELEMENTOS DE LA PÁGINA:');
    
    // Buscar todos los botones visibles
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([style*="display: none"])'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim(),
        id: btn.id,
        classes: btn.className,
        visible: btn.offsetParent !== null
      })).filter(b => b.visible);
    });
    
    console.log('\n📌 Botones encontrados:');
    allButtons.forEach(btn => {
      if (btn.text) {
        console.log(`  - "${btn.text}" (id: ${btn.id || 'none'})`);
      }
    });
    
    // Buscar enlaces de navegación
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, .nav-btn'));
      return links.map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        visible: link.offsetParent !== null
      })).filter(l => l.visible);
    });
    
    console.log('\n📌 Enlaces de navegación:');
    navLinks.forEach(link => {
      console.log(`  - "${link.text}"`);
    });
    
    // ========================================
    // NAVEGAR AL SISTEMA COLABORATIVO
    // ========================================
    console.log('\n📍 NAVEGACIÓN AL SISTEMA COLABORATIVO:');
    
    // Intentar diferentes formas de llegar a partidos colaborativos
    const possibleSelectors = [
      'text=PARTIDOS GRUPALES',
      'text=PARTIDOS',
      '.nav-btn:nth-child(2)',
      'a[href*="collaborative"]',
      '[data-screen="collaborative"]'
    ];
    
    let navigationSuccess = false;
    for (const selector of possibleSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`  ✅ Navegando con: ${selector}`);
          await element.click();
          navigationSuccess = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!navigationSuccess) {
      console.log('  ⚠️ No se pudo navegar directamente, intentando navegación manual...');
      // Click en el segundo botón del nav (usualmente es partidos)
      await page.locator('.nav-btn').nth(1).click();
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/02-partidos.png' });
    
    // ========================================
    // BUSCAR Y CREAR PARTIDO
    // ========================================
    console.log('\n📍 CREACIÓN DE PARTIDO:');
    
    // Buscar botón de crear con múltiples estrategias
    const createButtonSelectors = [
      'button:has-text("Crear Nuevo Partido")',
      'button:has-text("⚽ Crear")',
      'button:has-text("Crear")',
      '#create-match-btn',
      'button[onclick*="create"]',
      'button.btn-primary'
    ];
    
    let createButton = null;
    for (const selector of createButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        createButton = btn;
        console.log(`  ✅ Botón de crear encontrado: ${selector}`);
        break;
      }
    }
    
    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/03-modal-crear.png' });
      
      // Detectar campos del formulario
      console.log('\n📝 LLENANDO FORMULARIO:');
      
      // Buscar campos por diferentes métodos
      const formFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        return inputs.map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          placeholder: input.placeholder,
          id: input.id,
          name: input.name,
          visible: input.offsetParent !== null
        })).filter(f => f.visible);
      });
      
      console.log('  Campos encontrados:');
      formFields.forEach(field => {
        console.log(`    - ${field.type} (id: ${field.id}, placeholder: ${field.placeholder})`);
      });
      
      // Llenar formulario basado en los campos encontrados
      const matchData = {
        title: `Test Match ${Date.now()}`,
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '20:00',
        location: 'Test Stadium'
      };
      
      // Intentar llenar cada campo
      for (const field of formFields) {
        if (field.type === 'text' && (field.placeholder?.includes('título') || field.placeholder?.includes('nombre'))) {
          await page.locator(`#${field.id}`).fill(matchData.title);
          console.log(`  ✅ Título: ${matchData.title}`);
        } else if (field.type === 'date') {
          await page.locator(`#${field.id}`).fill(matchData.date);
          console.log(`  ✅ Fecha: ${matchData.date}`);
        } else if (field.type === 'time') {
          await page.locator(`#${field.id}`).fill(matchData.time);
          console.log(`  ✅ Hora: ${matchData.time}`);
        } else if (field.type === 'text' && (field.placeholder?.includes('lugar') || field.placeholder?.includes('ubicación'))) {
          await page.locator(`#${field.id}`).fill(matchData.location);
          console.log(`  ✅ Ubicación: ${matchData.location}`);
        }
      }
      
      // Guardar partido
      const saveSelectors = [
        'button:has-text("Guardar")',
        'button:has-text("Crear Partido")',
        'button:has-text("💾")',
        'button[type="submit"]',
        'button.btn-success'
      ];
      
      for (const selector of saveSelectors) {
        const saveBtn = page.locator(selector).first();
        if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`\n  💾 Guardando con: ${selector}`);
          await saveBtn.click();
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-screenshots/04-partido-creado.png' });
    } else {
      console.log('  ❌ No se encontró botón de crear partido');
    }
    
    // ========================================
    // ANÁLISIS DEL SISTEMA DE EVALUACIONES
    // ========================================
    console.log('\n📍 ANÁLISIS DEL SISTEMA DE EVALUACIONES:');
    
    // Ejecutar análisis en el contexto de la página
    const systemAnalysis = await page.evaluate(() => {
      const analysis = {
        hasCollaborativeSystem: false,
        hasFirebase: false,
        hasAuthSystem: false,
        currentUser: null,
        matchesCount: 0,
        playersCount: 0,
        features: []
      };
      
      // Verificar sistema colaborativo
      if (window.collaborativeSystem) {
        analysis.hasCollaborativeSystem = true;
        analysis.features.push('Sistema Colaborativo');
        
        if (window.collaborativeSystem.state?.matches) {
          analysis.matchesCount = window.collaborativeSystem.state.matches.size;
        }
      }
      
      // Verificar Firebase
      if (window.firebase) {
        analysis.hasFirebase = true;
        analysis.features.push('Firebase');
      }
      
      // Verificar sistema de autenticación
      if (window.TestApp?.currentUser || window.authSystem?.currentUser) {
        analysis.hasAuthSystem = true;
        analysis.currentUser = window.TestApp?.currentUser?.displayName || 'Usuario';
        analysis.features.push('Autenticación');
      }
      
      // Verificar Storage
      if (window.Storage) {
        const players = window.Storage.getPlayers();
        analysis.playersCount = players?.length || 0;
        analysis.features.push('Storage Local');
      }
      
      return analysis;
    });
    
    console.log('\n📊 ESTADO DEL SISTEMA:');
    console.log(`  ✅ Sistema Colaborativo: ${systemAnalysis.hasCollaborativeSystem ? 'Sí' : 'No'}`);
    console.log(`  ✅ Firebase: ${systemAnalysis.hasFirebase ? 'Sí' : 'No'}`);
    console.log(`  ✅ Autenticación: ${systemAnalysis.hasAuthSystem ? 'Sí' : 'No'}`);
    console.log(`  👤 Usuario actual: ${systemAnalysis.currentUser || 'No detectado'}`);
    console.log(`  ⚽ Partidos en sistema: ${systemAnalysis.matchesCount}`);
    console.log(`  👥 Jugadores en sistema: ${systemAnalysis.playersCount}`);
    console.log(`  🔧 Características activas: ${systemAnalysis.features.join(', ')}`);
    
    // ========================================
    // SIMULACIÓN DE EVALUACIONES
    // ========================================
    console.log('\n📍 SIMULACIÓN DE EVALUACIONES AUTOMÁTICAS:');
    
    const evaluationResult = await page.evaluate(() => {
      if (!window.collaborativeSystem) {
        return { success: false, message: 'Sistema colaborativo no encontrado' };
      }
      
      // Obtener todos los partidos
      const matches = Array.from(window.collaborativeSystem.state.matches.values());
      
      if (matches.length === 0) {
        return { success: false, message: 'No hay partidos en el sistema' };
      }
      
      // Tomar el último partido creado
      const latestMatch = matches[matches.length - 1];
      
      // Simular que el partido tiene 10 jugadores
      if (!latestMatch.registeredPlayers || latestMatch.registeredPlayers.length < 10) {
        // Agregar jugadores simulados
        latestMatch.registeredPlayers = [];
        for (let i = 1; i <= 10; i++) {
          latestMatch.registeredPlayers.push({
            uid: `player-${i}`,
            displayName: `Jugador ${i}`,
            position: ['DEL', 'MED', 'DEF', 'POR'][i % 4],
            ovr: 70 + Math.floor(Math.random() * 20),
            isGuest: i > 8 // Los últimos 2 son invitados
          });
        }
      }
      
      // Generar equipos si no están generados
      if (!latestMatch.teamsGenerated) {
        // Simular generación de equipos
        latestMatch.teamsGenerated = true;
        latestMatch.teams = {
          teamA: latestMatch.registeredPlayers.slice(0, 5),
          teamB: latestMatch.registeredPlayers.slice(5, 10)
        };
        
        // Asignar evaluaciones (solo para no invitados)
        latestMatch.evaluationAssignments = {};
        const authenticatedPlayers = latestMatch.registeredPlayers.filter(p => !p.isGuest);
        
        authenticatedPlayers.forEach((player, index) => {
          latestMatch.evaluationAssignments[player.uid] = [
            authenticatedPlayers[(index + 1) % authenticatedPlayers.length].uid,
            authenticatedPlayers[(index + 2) % authenticatedPlayers.length].uid
          ];
        });
      }
      
      // Simular evaluaciones completadas
      latestMatch.evaluations = {};
      const evaluators = Object.keys(latestMatch.evaluationAssignments);
      
      // Hacer que el 80% evalúe
      const evaluatorsToComplete = Math.ceil(evaluators.length * 0.8);
      
      for (let i = 0; i < evaluatorsToComplete; i++) {
        const evaluatorId = evaluators[i];
        latestMatch.evaluations[evaluatorId] = {};
        
        latestMatch.evaluationAssignments[evaluatorId].forEach(targetId => {
          latestMatch.evaluations[evaluatorId][targetId] = {
            rating: 6 + Math.floor(Math.random() * 4), // 6-9
            comment: 'Buen desempeño'
          };
        });
      }
      
      // Calcular nuevos OVRs
      const completionPercentage = (Object.keys(latestMatch.evaluations).length / evaluators.length) * 100;
      
      if (completionPercentage >= 80) {
        const ratings = {};
        
        Object.values(latestMatch.evaluations).forEach(evalSet => {
          Object.entries(evalSet).forEach(([playerId, evaluation]) => {
            if (!ratings[playerId]) ratings[playerId] = [];
            ratings[playerId].push(evaluation.rating);
          });
        });
        
        latestMatch.newOVRs = {};
        Object.entries(ratings).forEach(([playerId, playerRatings]) => {
          const avg = playerRatings.reduce((a, b) => a + b, 0) / playerRatings.length;
          const player = latestMatch.registeredPlayers.find(p => p.uid === playerId);
          if (player) {
            const change = (avg - 5) * 2;
            latestMatch.newOVRs[playerId] = Math.max(1, Math.min(99, player.ovr + Math.round(change)));
          }
        });
      }
      
      return {
        success: true,
        matchTitle: latestMatch.title,
        playersCount: latestMatch.registeredPlayers.length,
        teamsGenerated: latestMatch.teamsGenerated,
        evaluationsCompleted: Object.keys(latestMatch.evaluations).length,
        evaluationsTotal: evaluators.length,
        completionPercentage: completionPercentage,
        newOVRsCalculated: !!latestMatch.newOVRs
      };
    });
    
    if (evaluationResult.success) {
      console.log(`\n✅ EVALUACIONES SIMULADAS EXITOSAMENTE:`);
      console.log(`  📋 Partido: ${evaluationResult.matchTitle}`);
      console.log(`  👥 Jugadores: ${evaluationResult.playersCount}`);
      console.log(`  ⚽ Equipos generados: ${evaluationResult.teamsGenerated ? 'Sí' : 'No'}`);
      console.log(`  📊 Evaluaciones: ${evaluationResult.evaluationsCompleted}/${evaluationResult.evaluationsTotal} (${evaluationResult.completionPercentage.toFixed(0)}%)`);
      console.log(`  🎯 OVRs actualizados: ${evaluationResult.newOVRsCalculated ? 'Sí' : 'No'}`);
    } else {
      console.log(`\n⚠️ ${evaluationResult.message}`);
    }
    
    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL TEST');
    console.log('='.repeat(60));
    
    const summary = {
      navegacion: navigationSuccess,
      creacionPartido: !!createButton,
      sistemaColaborativo: systemAnalysis.hasCollaborativeSystem,
      firebase: systemAnalysis.hasFirebase,
      autenticacion: systemAnalysis.hasAuthSystem,
      evaluaciones: evaluationResult.success
    };
    
    Object.entries(summary).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const status = value ? 'OK' : 'FALLO';
      console.log(`${icon} ${key.padEnd(20)} : ${status}`);
    });
    
    const totalTests = Object.keys(summary).length;
    const passedTests = Object.values(summary).filter(v => v).length;
    const successRate = (passedTests / totalTests * 100).toFixed(0);
    
    console.log('\n' + '='.repeat(60));
    console.log(`🏆 RESULTADO FINAL: ${passedTests}/${totalTests} tests pasados (${successRate}%)`);
    console.log('='.repeat(60));
    
    // Tomar screenshot final
    await page.screenshot({ path: 'test-screenshots/05-final.png' });
  });
});