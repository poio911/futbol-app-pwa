// Comando para resetear todas las estadísticas de jugadores a 50
// Copia y pega este código en la consola del navegador

async function resetAllPlayersTo50() {
    console.log('🔄 Starting player stats reset to 50...');
    
    // Verificar que Storage esté disponible
    if (typeof Storage === 'undefined' || !Storage.currentGroupId) {
        console.error('❌ Storage not available or no group selected');
        return;
    }
    
    try {
        // Cargar todos los jugadores
        console.log('📥 Loading all players...');
        await Storage.loadPlayersFromFirebase();
        const players = Storage.cachedPlayers;
        
        if (!players || players.length === 0) {
            console.error('❌ No players found');
            return;
        }
        
        console.log(`👥 Found ${players.length} players to reset`);
        
        // Función para calcular OVR basado en posición (copiada de TestApp)
        function calculatePositionBasedOVR(attributes, position) {
            const weights = {
                'POR': { pac: 0.1, sho: 0.1, pas: 0.15, dri: 0.1, def: 0.25, phy: 0.3 },
                'DEF': { pac: 0.15, sho: 0.05, pas: 0.15, dri: 0.1, def: 0.35, phy: 0.2 },
                'MED': { pac: 0.15, sho: 0.15, pas: 0.3, dri: 0.25, def: 0.1, phy: 0.05 },
                'DEL': { pac: 0.2, sho: 0.3, pas: 0.15, dri: 0.2, def: 0.05, phy: 0.1 }
            };
            
            const positionWeights = weights[position] || weights['MED'];
            
            return Math.round(
                attributes.pac * positionWeights.pac +
                attributes.sho * positionWeights.sho +
                attributes.pas * positionWeights.pas +
                attributes.dri * positionWeights.dri +
                attributes.def * positionWeights.def +
                attributes.phy * positionWeights.phy
            );
        }
        
        // Resetear cada jugador
        const updatePromises = players.map(async (player, index) => {
            console.log(`🔄 [${index + 1}/${players.length}] Resetting ${player.name}...`);
            
            // Crear datos del jugador con estadísticas en 50
            const resetPlayerData = {
                ...player,
                attributes: {
                    pac: 50,
                    sho: 50,
                    pas: 50,
                    dri: 50,
                    def: 50,
                    phy: 50
                },
                // Calcular OVR con las nuevas estadísticas
                ovr: calculatePositionBasedOVR({
                    pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50
                }, player.position || 'MED'),
                // Resetear campos de evaluación
                originalOVR: undefined,
                hasBeenEvaluated: false,
                updatedAt: new Date().toISOString()
            };
            
            // Establecer originalOVR igual al OVR actual (que será 50)
            resetPlayerData.originalOVR = resetPlayerData.ovr;
            
            console.log(`   📊 ${player.name}: OVR ${player.ovr} → ${resetPlayerData.ovr}, originalOVR: ${resetPlayerData.originalOVR}`);
            
            // Guardar en Firebase
            try {
                await Storage.updatePlayer(resetPlayerData);
                console.log(`   ✅ ${player.name} updated successfully`);
                return { success: true, player: player.name };
            } catch (error) {
                console.error(`   ❌ Error updating ${player.name}:`, error);
                return { success: false, player: player.name, error };
            }
        });
        
        // Esperar a que todas las actualizaciones terminen
        console.log('⏳ Updating all players in Firebase...');
        const results = await Promise.all(updatePromises);
        
        // Mostrar resultados
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`\n🎉 RESET COMPLETE!`);
        console.log(`✅ Successfully reset: ${successful.length} players`);
        
        if (failed.length > 0) {
            console.log(`❌ Failed to reset: ${failed.length} players`);
            failed.forEach(f => console.log(`   - ${f.player}: ${f.error?.message || 'Unknown error'}`));
        }
        
        // Recargar jugadores para mostrar los cambios
        console.log('🔄 Reloading players...');
        await Storage.loadPlayersFromFirebase();
        
        // Si TestApp está disponible, refrescar la vista
        if (typeof TestApp !== 'undefined' && TestApp.displayPlayers) {
            console.log('🎨 Refreshing player display...');
            TestApp.displayPlayers();
        }
        
        console.log('✅ All done! All players now have:');
        console.log('   - All attributes set to 50');
        console.log('   - OVR calculated based on position');
        console.log('   - originalOVR set to current OVR');
        console.log('   - hasBeenEvaluated set to false');
        
    } catch (error) {
        console.error('❌ Error during reset:', error);
    }
}

// Ejecutar el comando
console.log('🚀 Reset All Players Command Loaded');
console.log('💡 Run: resetAllPlayersTo50()');

// También crear una versión que se ejecute inmediatamente si se desea
// resetAllPlayersTo50();