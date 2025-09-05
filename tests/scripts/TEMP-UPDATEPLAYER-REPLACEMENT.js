/**
 * REPLACEMENT FOR updatePlayer function in firebase-simple.js
 * Lines 1332-1429 should be replaced with this code
 */

/**
 * LEGACY COMPATIBILITY WRAPPER - Now uses unified system
 * Update player with new data - CONVERTED TO USE UNIFIED SYSTEM
 */
async updatePlayer(playerData) {
    console.log('⚠️ Legacy updatePlayer called - converting to unified system:', {
        player: playerData.name || playerData.displayName,
        playerId: playerData.id,
        newOVR: playerData.ovr,
        hasAttributes: !!playerData.attributes
    });
    
    try {
        // Convert legacy structure to unified updates
        const updates = {};
        
        // Handle attributes from legacy structure
        if (playerData.attributes) {
            const attrs = playerData.attributes;
            if (attrs.pac !== undefined) updates.pac = attrs.pac;
            if (attrs.sho !== undefined) updates.sho = attrs.sho;
            if (attrs.pas !== undefined) updates.pas = attrs.pas;
            if (attrs.dri !== undefined) updates.dri = attrs.dri;
            if (attrs.def !== undefined) updates.def = attrs.def;
            if (attrs.phy !== undefined) updates.phy = attrs.phy;
        }
        
        // Handle direct attributes (new structure compatibility)
        const attributeFields = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
        attributeFields.forEach(attr => {
            if (playerData[attr] !== undefined) {
                updates[attr] = playerData[attr];
            }
        });
        
        // Handle OVR and other fields
        if (playerData.ovr !== undefined) {
            updates.ovr = playerData.ovr;
        }
        
        console.log('🔄 Converted legacy to unified updates:', updates);
        
        // Use unified function - no evaluation context for legacy calls
        const result = await this.updatePlayerUnified(playerData.id, updates);
        
        if (result) {
            // Update local cache if we have it (maintain compatibility)
            const cacheIndex = this.cachedPlayers?.findIndex(p => p.id === playerData.id);
            if (cacheIndex !== -1 && this.cachedPlayers) {
                // Update cache with new values
                Object.keys(updates).forEach(key => {
                    this.cachedPlayers[cacheIndex][key] = updates[key];
                });
                console.log('🔄 Local cache updated via unified system');
            }
        }
        
        console.log(`✅ Legacy updatePlayer completed via unified system: ${playerData.name || 'Unknown'}`);
        return result;
        
    } catch (error) {
        console.error('❌ Error in legacy updatePlayer wrapper:', error);
        
        // Fallback to keep legacy compatibility in emergency
        console.log('🚨 FALLBACK: Trying emergency legacy behavior...');
        return await this.updatePlayerEmergencyFallback(playerData);
    }
},

/**
 * EMERGENCY FALLBACK - Only for critical failures
 */
async updatePlayerEmergencyFallback(playerData) {
    console.log('🚨 EMERGENCY FALLBACK: Using simplified update');
    
    if (this.isDemo) {
        const playerIndex = this.demoPlayers.findIndex(p => p.id === playerData.id);
        if (playerIndex !== -1) {
            this.demoPlayers[playerIndex] = { ...playerData };
            console.log('✅ Emergency fallback: Demo player updated');
        }
        return true;
    }
    
    if (!db) {
        console.error('❌ Emergency fallback: No database connection');
        return false;
    }
    
    try {
        // Try to update futbol_users directly with attributes
        const userDocRef = db.collection('futbol_users').doc(playerData.id);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists && playerData.attributes) {
            await userDocRef.update({
                ovr: playerData.ovr || userDoc.data().ovr,
                pac: playerData.attributes.pac || userDoc.data().pac || 50,
                sho: playerData.attributes.sho || userDoc.data().sho || 50,
                pas: playerData.attributes.pas || userDoc.data().pas || 50,
                dri: playerData.attributes.dri || userDoc.data().dri || 50,
                def: playerData.attributes.def || userDoc.data().def || 50,
                phy: playerData.attributes.phy || userDoc.data().phy || 50,
                lastActivity: new Date().toISOString()
            });
            console.log('✅ Emergency fallback: Updated futbol_users directly');
            return true;
        }
        
        console.log('⚠️ Emergency fallback: Could not find user or attributes');
        return false;
    } catch (error) {
        console.error('❌ Emergency fallback failed:', error);
        return false;
    }
},