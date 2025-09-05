# Backup de Funciones Críticas - Unificación de Evaluaciones
## Creado: 06/02/2025 antes de modificaciones

---

## 🔧 FIREBASE-SIMPLE.JS

### Función updatePlayer (Línea 709)
```javascript
async updatePlayer(playerId, updates) {
    if (this.isDemo) {
        const playerIndex = this.demoPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            this.demoPlayers[playerIndex] = { ...this.demoPlayers[playerIndex], ...updates };
            return true;
        }
        return false;
    }
    
    if (!db || !this.currentGroupId) return false;
    
    try {
        await db.collection('groups').doc(this.currentGroupId).collection('players').doc(playerId).update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Player updated in Firebase:', playerId);
        return true;
    } catch (error) {
        console.error('❌ Error updating player:', error);
        return false;
    }
},
```

### Función updatePlayer (Línea 1332)
```javascript
async updatePlayer(playerData) {
    console.log('🔄 updatePlayer called:', {
        isDemo: this.isDemo, 
        player: playerData.name,
        currentGroupId: this.currentGroupId,
        playerId: playerData.id,
        newOVR: playerData.ovr
    });
    
    if (this.isDemo) {
        // Update demo data
        const playerIndex = this.demoPlayers.findIndex(p => p.id === playerData.id);
        if (playerIndex !== -1) {
            this.demoPlayers[playerIndex] = { ...playerData };
            console.log('✅ Player updated in demo mode:', playerData.name, 'Attributes:', playerData.attributes, 'New OVR:', playerData.ovr);
        }
        return true;
    }
    
    if (!db || !this.currentGroupId) {
        console.error('❌ Cannot update player: no database connection or group ID');
        return false;
    }
    
    try {
        console.log('📤 Updating player in Firebase:', {
            player: playerData.name,
            playerId: playerData.id,
            attributes: playerData.attributes,
            ovr: playerData.ovr
        });
        
        // Update in groups/{groupId}/players collection
        const docRef = db.collection('groups')
            .doc(this.currentGroupId)
            .collection('players')
            .doc(playerData.id);
        
        const updateData = {
            name: playerData.name,
            position: playerData.position,
            attributes: playerData.attributes,
            ovr: playerData.ovr,
            photo: playerData.photo,
            updatedAt: new Date().toISOString(),
            groupId: this.currentGroupId
        };
        
        console.log('📝 Update data being sent:', updateData);
        
        // Try update first, if document doesn't exist, create it
        const doc = await docRef.get();
        if (doc.exists) {
            await docRef.update(updateData);
            console.log('✅ Player document updated successfully');
        } else {
            await docRef.set(updateData);
            console.log('✅ Player document created successfully');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error updating player in Firebase:', error);
        console.error('Player data:', playerData);
        return false;
    }
}
```

---

## 🎮 TEST-APP.JS

### Función applyPlayerImprovements (Línea 4404)
```javascript
async applyPlayerImprovements() {
    if (!this.currentEvaluation) return;
    
    for (const playerId in this.currentEvaluation.playerPerformances) {
        const performance = this.currentEvaluation.playerPerformances[playerId];
        const player = this.players.find(p => p.id === playerId);
        
        if (!player) continue;
        
        let improvements = { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
        let totalImprovement = 0;
        
        if (this.evaluationSystem === 'tags') {
            // TAGS SYSTEM - Manual control with performance tags
            
            // Apply performance tag bonuses
            performance.tags.forEach(tagKey => {
                const tag = this.performanceTags[tagKey];
                if (tag && tag.points) {
                    Object.keys(tag.points).forEach(attr => {
                        improvements[attr] += tag.points[attr];
                        totalImprovement += tag.points[attr];
                    });
                    this.log(`Applied tag "${tag.label}" to ${player.name}: ${JSON.stringify(tag.points)}`, 'info');
                }
            });
            
            // Exceptional performance bonus for high ratings (8.0+)
            if (performance.rating >= 8.0) {
                const exceptionalBonus = 1;
                Object.keys(improvements).forEach(attr => {
                    improvements[attr] += exceptionalBonus;
                    totalImprovement += exceptionalBonus;
                });
                this.log(`Exceptional performance bonus (+${exceptionalBonus} to all stats) for ${player.name} (rating: ${performance.rating})`, 'info');
            }
        } else {
            // RATING SYSTEM - Simple automatic distribution
            const basePoints = Math.max(0, Math.round((performance.rating - 5.0) * 2));
            improvements = this.distributePointsByPosition(player.position, basePoints);
            totalImprovement = basePoints;
            this.log(`Rating system: ${basePoints} points distributed to ${player.name} based on rating ${performance.rating}`, 'info');
        }
        
        // Goals bonus (applies to both systems)
        if (performance.goals > 0) {
            const goalsBonus = Math.min(performance.goals * 2, 8); // Max 8 points for goals
            improvements.sho += goalsBonus;
            totalImprovement += goalsBonus;
            this.log(`Goals bonus: +${goalsBonus} SHO for ${player.name} (${performance.goals} goals)`, 'info');
        }
        
        // Apply improvements to player attributes
        Object.keys(improvements).forEach(attr => {
            if (improvements[attr] > 0) {
                player.attributes[attr] = Math.min(99, player.attributes[attr] + improvements[attr]);
                this.log(`${player.name} ${attr.toUpperCase()}: ${player.attributes[attr] - improvements[attr]} → ${player.attributes[attr]} (+${improvements[attr]})`, 'success');
            }
        });
        
        // Recalculate OVR
        const oldOVR = player.ovr;
        player.ovr = this.calculatePositionBasedOVR(player.attributes, player.position);
        
        this.log(`${player.name} OVR change: ${oldOVR} → ${player.ovr} (Original: ${player.originalOVR || 'N/A'})`, 'info');
        
        // Update player in storage
        if (Storage && Storage.updatePlayer) {
            await Storage.updatePlayer(player);
        }
        
        this.log(`Player updated: ${player.name} - New OVR: ${player.ovr}`, 'success');
        
        this.log(`Applied ${totalImprovement} improvement points to ${player.name} (${this.evaluationSystem} system)`, 'success');
    }
}

// Reload players to show updates
await this.loadPlayers();
},
```

---

## ⚙️ FUNCIONES DE LECTURA CRÍTICAS

### loadPlayers en firebase-simple.js
```javascript
async getPlayers(groupId = null) {
    if (this.isDemo) {
        return this.demoPlayers;
    }
    
    groupId = groupId || this.currentGroupId;
    if (!groupId || !db) return [];
    
    try {
        const snapshot = await db.collection('groups')
            .doc(groupId)
            .collection('players')
            .get();
        
        const players = [];
        snapshot.forEach(doc => {
            players.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Loaded ${players.length} players from group ${groupId}`);
        return players;
    } catch (error) {
        console.error('❌ Error loading players:', error);
        return [];
    }
},
```

---

## 🔐 AUTH-SYSTEM.JS Funciones Críticas

### handleUserSignedIn - Creación inicial de datos
```javascript
// Save to Firestore in new unified collection
await db.collection('futbol_users').doc(firebaseUser.uid).set(userData);
```

### userData structure (Líneas 552-557)
```javascript
// Attributes as separate fields
pac: 50,
sho: 50, 
pas: 50,
dri: 50,
def: 50,
phy: 50,
```

---

## 📝 NOTAS DE BACKUP

### Estado Actual Identificado:
1. **updatePlayer() versión 1** (línea 709): Actualiza `/groups/{id}/players`
2. **updatePlayer() versión 2** (línea 1332): Para demo/cache
3. **applyPlayerImprovements()**: Modifica `player.attributes` pero usa updatePlayer incorrecto
4. **Datos reales**: Están en `/futbol_users` con campos directos
5. **Inconsistencia**: Los cambios no se reflejan en UI principal

### Funciones que DEBEN funcionar después de cambios:
- Evaluación de partidos → Cambios visibles
- Vista de jugadores → Datos actualizados  
- Admin panel → Trazabilidad completa
- Login/registro → Sin cambios

### Archivos con backups manuales:
- `firebase-simple.js` → BACKUP creado en docs
- `test-app.js` → BACKUP creado en docs
- `admin.html` → Modificar con cuidado

---

*Backup creado: 06/02/2025 16:30*  
*Próximo paso: Implementar función unificada*