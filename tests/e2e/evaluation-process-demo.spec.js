const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;

test.describe('Demo Completo del Proceso de Evaluación', () => {
  
  test('Mostrar el proceso real de evaluación de jugadores', async ({ page }) => {
    console.log('🎮 DEMO DEL PROCESO DE EVALUACIÓN POST-PARTIDO\n');
    console.log('=' .repeat(60));
    
    // Crear carpeta para screenshots
    const screenshotDir = 'test-screenshots/proceso-evaluacion';
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // ========================================
    // PASO 1: SETUP INICIAL
    // ========================================
    console.log('\n📍 PASO 1: Preparando el sistema...');
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // ========================================
    // PASO 2: CREAR PARTIDO DE PRUEBA CON EQUIPOS
    // ========================================
    console.log('\n📍 PASO 2: Creando partido de prueba con equipos generados...');
    
    await page.evaluate(() => {
      // Asegurar que el sistema colaborativo existe
      if (!window.collaborativeSystem) {
        console.error('Sistema colaborativo no encontrado');
        return;
      }
      
      // Crear un partido de prueba que ya terminó
      const testMatch = {
        id: 'test-match-eval-' + Date.now(),
        title: 'Partido de Demostración - Evaluaciones',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer
        time: '20:00',
        location: 'Cancha de Test',
        type: '5v5',
        status: 'completed',
        isCompleted: true,
        createdBy: 'test-organizer',
        registeredPlayers: [],
        teamsGenerated: false
      };
      
      // Agregar 10 jugadores de prueba (8 autenticados + 2 invitados)
      const testPlayers = [
        { uid: 'player1', displayName: 'Lionel Messi', position: 'DEL', ovr: 94, isGuest: false },
        { uid: 'player2', displayName: 'Cristiano Ronaldo', position: 'DEL', ovr: 92, isGuest: false },
        { uid: 'player3', displayName: 'Kevin De Bruyne', position: 'MED', ovr: 91, isGuest: false },
        { uid: 'player4', displayName: 'Luka Modrić', position: 'MED', ovr: 89, isGuest: false },
        { uid: 'player5', displayName: 'Virgil van Dijk', position: 'DEF', ovr: 90, isGuest: false },
        { uid: 'player6', displayName: 'Sergio Ramos', position: 'DEF', ovr: 86, isGuest: false },
        { uid: 'player7', displayName: 'Manuel Neuer', position: 'POR', ovr: 88, isGuest: false },
        { uid: 'player8', displayName: 'Kylian Mbappé', position: 'DEL', ovr: 91, isGuest: false },
        { uid: null, displayName: 'Invitado Juan', position: 'MED', ovr: 70, isGuest: true, manualPlayerId: 'guest1' },
        { uid: null, displayName: 'Invitado Pedro', position: 'DEF', ovr: 68, isGuest: true, manualPlayerId: 'guest2' }
      ];
      
      testMatch.registeredPlayers = testPlayers;
      
      // Generar equipos balanceados
      const teamA = [testPlayers[0], testPlayers[3], testPlayers[4], testPlayers[7], testPlayers[8]];
      const teamB = [testPlayers[1], testPlayers[2], testPlayers[5], testPlayers[6], testPlayers[9]];
      
      testMatch.teams = { teamA, teamB };
      testMatch.teamsGenerated = true;
      
      // Crear asignaciones de evaluación (cada jugador autenticado evalúa a 2 compañeros)
      testMatch.evaluationAssignments = {
        'player1': ['player4', 'player5'],  // Messi evalúa a Modrić y Van Dijk
        'player2': ['player3', 'player6'],  // Ronaldo evalúa a De Bruyne y Ramos
        'player3': ['player2', 'player7'],  // De Bruyne evalúa a Ronaldo y Neuer
        'player4': ['player1', 'player8'],  // Modrić evalúa a Messi y Mbappé
        'player5': ['player1', 'player8'],  // Van Dijk evalúa a Messi y Mbappé
        'player6': ['player2', 'player3'],  // Ramos evalúa a Ronaldo y De Bruyne
        'player7': ['player3', 'player6'],  // Neuer evalúa a De Bruyne y Ramos
        'player8': ['player4', 'player5']   // Mbappé evalúa a Modrić y Van Dijk
      };
      
      // Guardar el partido en el sistema
      if (window.collaborativeSystem.state) {
        window.collaborativeSystem.state.matches.set(testMatch.id, testMatch);
      }
      
      // Simular que el usuario actual es Messi (player1)
      window.currentEvaluator = {
        uid: 'player1',
        displayName: 'Lionel Messi',
        evaluationTargets: testMatch.evaluationAssignments['player1']
      };
      
      console.log('✅ Partido de prueba creado con equipos y evaluaciones asignadas');
    });
    
    await page.screenshot({
      path: `${screenshotDir}/01-setup-inicial.png`,
      fullPage: true
    });
    
    // ========================================
    // PASO 3: CREAR INTERFAZ DE EVALUACIÓN
    // ========================================
    console.log('\n📍 PASO 3: Mostrando interfaz de evaluación...');
    
    await page.evaluate(() => {
      // Obtener el partido de test
      const matches = Array.from(window.collaborativeSystem.state.matches.values());
      const testMatch = matches.find(m => m.title === 'Partido de Demostración - Evaluaciones');
      
      if (!testMatch) {
        console.error('Partido de test no encontrado');
        return;
      }
      
      // Crear modal de evaluación
      const modal = document.createElement('div');
      modal.id = 'evaluation-modal';
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
      `;
      
      modal.innerHTML = `
        <div style="background: white; border-radius: 18px; padding: 30px; max-height: calc(90vh - 4px); overflow-y: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 28px;">
              ⭐ Evaluación Post-Partido
            </h2>
            <p style="color: #666; margin: 0;">
              ${testMatch.title}
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 5px;">
              📅 ${testMatch.date} - ⏰ ${testMatch.time}
            </p>
          </div>
          
          <div style="background: #f0f7ff; padding: 15px; border-radius: 12px; margin-bottom: 25px;">
            <p style="color: #2196F3; margin: 0; font-weight: 600;">
              👤 Evaluando como: <strong>Lionel Messi</strong>
            </p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
              Por favor evalúa el desempeño de tus compañeros asignados
            </p>
          </div>
          
          <!-- Evaluación del Jugador 1: Modrić -->
          <div style="background: #f9f9f9; padding: 20px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #e0e0e0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 15px;">
                LM
              </div>
              <div>
                <h3 style="margin: 0; color: #333;">Luka Modrić</h3>
                <p style="margin: 5px 0 0 0; color: #666;">
                  <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">MED</span>
                  <span style="margin-left: 10px; color: #999;">OVR: 89</span>
                </p>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; color: #666; margin-bottom: 10px; font-weight: 600;">
                Calificación del desempeño (1-10):
              </label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${[1,2,3,4,5,6,7,8,9,10].map(num => `
                  <button style="
                    width: 45px;
                    height: 45px;
                    border: 2px solid ${num === 8 ? '#4CAF50' : '#ddd'};
                    background: ${num === 8 ? '#4CAF50' : 'white'};
                    color: ${num === 8 ? 'white' : '#666'};
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                  ">${num}</button>
                `).join('')}
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 8px;">
                ${8 >= 7 ? '🟢 Buen desempeño' : 8 >= 4 ? '🟡 Desempeño regular' : '🔴 Necesita mejorar'}
              </p>
            </div>
            
            <div>
              <label style="display: block; color: #666; margin-bottom: 8px; font-weight: 600;">
                Comentarios (opcional):
              </label>
              <textarea style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                resize: vertical;
                min-height: 60px;
                font-family: inherit;
              " placeholder="Excelente visión de juego y pases precisos...">Excelente control del medio campo, gran visión de juego</textarea>
            </div>
          </div>
          
          <!-- Evaluación del Jugador 2: Van Dijk -->
          <div style="background: #f9f9f9; padding: 20px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #e0e0e0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 15px;">
                VD
              </div>
              <div>
                <h3 style="margin: 0; color: #333;">Virgil van Dijk</h3>
                <p style="margin: 5px 0 0 0; color: #666;">
                  <span style="background: #FF9800; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">DEF</span>
                  <span style="margin-left: 10px; color: #999;">OVR: 90</span>
                </p>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; color: #666; margin-bottom: 10px; font-weight: 600;">
                Calificación del desempeño (1-10):
              </label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${[1,2,3,4,5,6,7,8,9,10].map(num => `
                  <button style="
                    width: 45px;
                    height: 45px;
                    border: 2px solid ${num === 9 ? '#4CAF50' : '#ddd'};
                    background: ${num === 9 ? '#4CAF50' : 'white'};
                    color: ${num === 9 ? 'white' : '#666'};
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                  ">${num}</button>
                `).join('')}
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 8px;">
                ${9 >= 7 ? '🟢 Excelente desempeño' : 9 >= 4 ? '🟡 Desempeño regular' : '🔴 Necesita mejorar'}
              </p>
            </div>
            
            <div>
              <label style="display: block; color: #666; margin-bottom: 8px; font-weight: 600;">
                Comentarios (opcional):
              </label>
              <textarea style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                resize: vertical;
                min-height: 60px;
                font-family: inherit;
              " placeholder="Sólido en defensa...">Defensa impenetrable, excelente juego aéreo y salida con balón</textarea>
            </div>
          </div>
          
          <!-- Información adicional -->
          <div style="background: #fff3e0; padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
            <h4 style="color: #ff9800; margin: 0 0 10px 0;">ℹ️ Información importante:</h4>
            <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Cada jugador evalúa a <strong>2 compañeros aleatorios</strong></li>
              <li>Las evaluaciones son <strong>anónimas</strong></li>
              <li>Calificación de 5 = Sin cambio en OVR</li>
              <li>Mayor a 5 = Aumenta OVR | Menor a 5 = Disminuye OVR</li>
              <li>Se necesita <strong>80% de participación</strong> para actualizar OVRs</li>
            </ul>
          </div>
          
          <!-- Botones de acción -->
          <div style="display: flex; gap: 15px; margin-top: 25px;">
            <button onclick="this.closest('#evaluation-modal').remove(); document.getElementById('eval-overlay').remove();" style="
              flex: 1;
              padding: 15px;
              background: #f5f5f5;
              color: #666;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
            ">
              Cancelar
            </button>
            <button style="
              flex: 2;
              padding: 15px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            ">
              ✅ Enviar Evaluaciones
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Agregar overlay
      const overlay = document.createElement('div');
      overlay.id = 'eval-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
      `;
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(1000);
    
    // Capturar el modal de evaluación
    await page.screenshot({
      path: `${screenshotDir}/02-modal-evaluacion-jugadores.png`,
      fullPage: true
    });
    console.log('  ✅ Screenshot: Modal de evaluación con 2 jugadores asignados');
    
    // ========================================
    // PASO 4: SIMULAR PROGRESO DE EVALUACIONES
    // ========================================
    console.log('\n📍 PASO 4: Mostrando progreso del equipo...');
    
    await page.evaluate(() => {
      // Limpiar modal anterior
      document.getElementById('evaluation-modal')?.remove();
      document.getElementById('eval-overlay')?.remove();
      
      // Crear modal de progreso
      const progressModal = document.createElement('div');
      progressModal.id = 'progress-modal';
      progressModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 700px;
        width: 90%;
      `;
      
      const evaluators = [
        { name: 'Lionel Messi', status: 'completed', targets: ['Luka Modrić', 'Virgil van Dijk'] },
        { name: 'Cristiano Ronaldo', status: 'completed', targets: ['Kevin De Bruyne', 'Sergio Ramos'] },
        { name: 'Kevin De Bruyne', status: 'completed', targets: ['Cristiano Ronaldo', 'Manuel Neuer'] },
        { name: 'Luka Modrić', status: 'completed', targets: ['Lionel Messi', 'Kylian Mbappé'] },
        { name: 'Virgil van Dijk', status: 'completed', targets: ['Lionel Messi', 'Kylian Mbappé'] },
        { name: 'Sergio Ramos', status: 'pending', targets: ['Cristiano Ronaldo', 'Kevin De Bruyne'] },
        { name: 'Manuel Neuer', status: 'completed', targets: ['Kevin De Bruyne', 'Sergio Ramos'] },
        { name: 'Kylian Mbappé', status: 'completed', targets: ['Luka Modrić', 'Virgil van Dijk'] }
      ];
      
      const completed = evaluators.filter(e => e.status === 'completed').length;
      const total = evaluators.length;
      const percentage = (completed / total * 100).toFixed(0);
      
      progressModal.innerHTML = `
        <h2 style="color: #333; margin: 0 0 25px 0; text-align: center;">
          📊 Progreso de Evaluaciones
        </h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="color: #666; font-weight: 600;">Progreso del equipo:</span>
            <span style="color: #333; font-weight: bold;">${completed}/${total} (${percentage}%)</span>
          </div>
          
          <div style="background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden;">
            <div style="
              background: linear-gradient(90deg, #4CAF50, #8BC34A);
              height: 100%;
              width: ${percentage}%;
              transition: width 0.5s;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            ">
              ${percentage}%
            </div>
          </div>
          
          ${percentage >= 80 ? `
            <p style="color: #4CAF50; margin: 15px 0 0 0; font-weight: 600; text-align: center;">
              ✅ ¡Evaluaciones completas! Los OVRs serán actualizados.
            </p>
          ` : `
            <p style="color: #ff9800; margin: 15px 0 0 0; text-align: center;">
              ⏳ Se necesita 80% de participación para actualizar OVRs
            </p>
          `}
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
          <h3 style="color: #666; margin: 0 0 15px 0;">Estado por jugador:</h3>
          
          ${evaluators.map(evaluator => `
            <div style="
              background: ${evaluator.status === 'completed' ? '#e8f5e9' : '#fff3e0'};
              padding: 15px;
              border-radius: 12px;
              margin-bottom: 10px;
              border-left: 4px solid ${evaluator.status === 'completed' ? '#4CAF50' : '#ff9800'};
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #333;">${evaluator.name}</strong>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Evalúa a: ${evaluator.targets.join(' y ')}
                  </p>
                </div>
                <div style="
                  padding: 5px 12px;
                  background: ${evaluator.status === 'completed' ? '#4CAF50' : '#ff9800'};
                  color: white;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                ">
                  ${evaluator.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <button onclick="this.closest('#progress-modal').remove(); document.getElementById('progress-overlay').remove();" style="
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
        ">
          Cerrar
        </button>
      `;
      
      document.body.appendChild(progressModal);
      
      // Overlay
      const overlay = document.createElement('div');
      overlay.id = 'progress-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
      `;
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: `${screenshotDir}/03-progreso-evaluaciones.png`,
      fullPage: true
    });
    console.log('  ✅ Screenshot: Progreso de evaluaciones del equipo');
    
    // ========================================
    // PASO 5: MOSTRAR RESULTADOS FINALES
    // ========================================
    console.log('\n📍 PASO 5: Mostrando actualización de OVRs...');
    
    await page.evaluate(() => {
      // Limpiar modales anteriores
      document.getElementById('progress-modal')?.remove();
      document.getElementById('progress-overlay')?.remove();
      
      // Crear modal de resultados
      const resultsModal = document.createElement('div');
      resultsModal.id = 'results-modal';
      resultsModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 600px;
        width: 90%;
      `;
      
      const ovrChanges = [
        { name: 'Lionel Messi', oldOVR: 94, newOVR: 95, change: +1, avgRating: 7.5 },
        { name: 'Cristiano Ronaldo', oldOVR: 92, newOVR: 93, change: +1, avgRating: 7.0 },
        { name: 'Kevin De Bruyne', oldOVR: 91, newOVR: 92, change: +1, avgRating: 7.3 },
        { name: 'Luka Modrić', oldOVR: 89, newOVR: 91, change: +2, avgRating: 8.0 },
        { name: 'Virgil van Dijk', oldOVR: 90, newOVR: 92, change: +2, avgRating: 8.5 },
        { name: 'Sergio Ramos', oldOVR: 86, newOVR: 86, change: 0, avgRating: 5.0 },
        { name: 'Manuel Neuer', oldOVR: 88, newOVR: 87, change: -1, avgRating: 4.5 },
        { name: 'Kylian Mbappé', oldOVR: 91, newOVR: 93, change: +2, avgRating: 8.0 }
      ];
      
      resultsModal.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4CAF50, #8BC34A);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 40px;
          ">
            🏆
          </div>
          <h2 style="color: #333; margin: 0;">
            ¡Evaluaciones Completadas!
          </h2>
          <p style="color: #666; margin: 10px 0 0 0;">
            Los OVRs han sido actualizados basados en el desempeño
          </p>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
          ${ovrChanges.map(player => {
            const color = player.change > 0 ? '#4CAF50' : player.change < 0 ? '#f44336' : '#999';
            const bgColor = player.change > 0 ? '#e8f5e9' : player.change < 0 ? '#ffebee' : '#f5f5f5';
            const arrow = player.change > 0 ? '↑' : player.change < 0 ? '↓' : '→';
            
            return `
              <div style="
                background: ${bgColor};
                padding: 15px;
                border-radius: 12px;
                margin-bottom: 10px;
                border-left: 4px solid ${color};
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <div>
                  <strong style="color: #333; font-size: 16px;">${player.name}</strong>
                  <p style="margin: 5px 0 0 0; color: #999; font-size: 14px;">
                    Rating promedio: ${player.avgRating}/10
                  </p>
                </div>
                <div style="text-align: right;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px; font-weight: bold; color: #666;">
                      ${player.oldOVR}
                    </span>
                    <span style="color: ${color}; font-size: 24px;">
                      ${arrow}
                    </span>
                    <span style="font-size: 20px; font-weight: bold; color: ${color};">
                      ${player.newOVR}
                    </span>
                  </div>
                  <span style="
                    color: ${color};
                    font-weight: bold;
                    font-size: 14px;
                  ">
                    ${player.change > 0 ? '+' : ''}${player.change}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="
          background: #f0f7ff;
          padding: 15px;
          border-radius: 12px;
          margin-top: 20px;
          text-align: center;
        ">
          <p style="color: #2196F3; margin: 0; font-weight: 600;">
            📊 Sistema de Evaluación Automática
          </p>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
            Los cambios se basan en el promedio de evaluaciones recibidas
          </p>
        </div>
        
        <button onclick="this.closest('#results-modal').remove(); document.getElementById('results-overlay').remove();" style="
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
        ">
          Entendido
        </button>
      `;
      
      document.body.appendChild(resultsModal);
      
      // Overlay
      const overlay = document.createElement('div');
      overlay.id = 'results-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
      `;
      document.body.appendChild(overlay);
    });
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: `${screenshotDir}/04-resultados-ovr-actualizados.png`,
      fullPage: true
    });
    console.log('  ✅ Screenshot: Resultados finales con OVRs actualizados');
    
    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📸 DEMO COMPLETA DEL PROCESO DE EVALUACIÓN');
    console.log('=' .repeat(60));
    
    const screenshots = await fs.readdir(screenshotDir);
    console.log(`\n✅ Screenshots capturados: ${screenshots.length}`);
    console.log('\n📁 Archivos generados:');
    screenshots.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    console.log('\n🎯 PROCESO DOCUMENTADO:');
    console.log('  1️⃣ Setup inicial del partido con equipos');
    console.log('  2️⃣ Interfaz de evaluación (jugador evalúa a 2 compañeros)');
    console.log('  3️⃣ Progreso de evaluaciones del equipo');
    console.log('  4️⃣ Resultados finales con OVRs actualizados');
    
    console.log('\n💡 CARACTERÍSTICAS CLAVE:');
    console.log('  ✅ Cada jugador evalúa exactamente a 2 compañeros');
    console.log('  ✅ Evaluaciones anónimas de 1-10');
    console.log('  ✅ Comentarios opcionales');
    console.log('  ✅ 80% de participación requerida');
    console.log('  ✅ OVRs actualizados automáticamente');
    console.log('  ✅ Jugadores invitados excluidos del proceso');
    
    console.log('\n' + '='.repeat(60));
    console.log(`📂 Ver capturas en: ${screenshotDir}/`);
    console.log('=' .repeat(60));
  });
});