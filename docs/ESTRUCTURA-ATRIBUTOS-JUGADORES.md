# Estructura de Atributos de Jugadores en Firebase
## Documentación Técnica - Sistema de Evaluación FC24

---

## 📊 RESUMEN EJECUTIVO

Los 6 atributos principales (pac, sho, pas, dri, def, phy) están almacenados en Firebase Firestore como campos DIRECTOS en cada documento de usuario, siendo únicos para cada jugador. El sistema mantiene compatibilidad con una estructura legacy donde estos atributos estaban anidados en un objeto.

---

## 🗄️ ESTRUCTURA EN BASE DE DATOS

### Colección Principal: `futbol_users`
**Ruta:** `/futbol_users/{uid}`  
**ID del documento:** UID único de Firebase Auth

### Campos de Atributos (Almacenamiento Directo)

```javascript
{
  // Identificación
  uid: "abc123",
  email: "jugador@gmail.com",
  displayName: "Juan Pérez",
  position: "DEL",
  
  // 🎮 ATRIBUTOS PRINCIPALES - CAMPOS DIRECTOS
  pac: 75,  // Pace (Velocidad)
  sho: 82,  // Shooting (Tiro)  
  pas: 68,  // Passing (Pase)
  dri: 79,  // Dribbling (Regate)
  def: 45,  // Defense (Defensa)
  phy: 71,  // Physical (Físico)
  
  // Calificación general
  ovr: 70,  // Overall Rating (calculado como promedio)
  
  // Metadatos
  createdAt: "2025-01-15T10:30:00Z",
  lastLogin: "2025-02-06T15:45:00Z"
}
```

---

## 🔄 DOS FORMAS DE ACCESO

### 1️⃣ FORMA DIRECTA (Nueva/Actual)
Los atributos son **campos directos** en el documento de Firebase.

**Estructura en Firebase:**
```
futbol_users/abc123/
├── email: "jugador@gmail.com"
├── displayName: "Juan Pérez"  
├── pac: 75        ← Campo directo, primer nivel
├── sho: 82        ← Campo directo, primer nivel
├── pas: 68        ← Campo directo, primer nivel
├── dri: 79        ← Campo directo, primer nivel
├── def: 45        ← Campo directo, primer nivel
├── phy: 71        ← Campo directo, primer nivel
└── ovr: 70        ← Campo directo, primer nivel
```

**Acceso en código:**
```javascript
const userDoc = await db.collection('futbol_users').doc(userId).get();
const userData = userDoc.data();

// Acceso DIRECTO
console.log(userData.pac);  // 75
console.log(userData.sho);  // 82
```

### 2️⃣ FORMA LEGACY (Antigua/Compatibilidad)
Sistema antiguo con atributos **anidados en un objeto**.

**Estructura legacy:**
```javascript
{
  id: "player123",
  name: "Juan Pérez",
  attributes: {     // ← Objeto contenedor
    pac: 75,
    sho: 82,
    pas: 68,
    dri: 79,
    def: 45,
    phy: 71
  },
  ovr: 70
}
```

**Acceso en código:**
```javascript
console.log(player.attributes.pac);  // 75
console.log(player.attributes.sho);  // 82
```

---

## 📍 FUNCIONES QUE ACCEDEN A LOS ATRIBUTOS

### 1. **Creación de Usuario** (`auth-system.js`)
**Líneas 552-557**
```javascript
// Valores iniciales al registrarse
pac: 50,
sho: 50, 
pas: 50,
dri: 50,
def: 50,
phy: 50,
```

### 2. **Visualización en UI** (`header-footer-enhanced.js`)
**Líneas 392-397**
```javascript
{ key: 'pac', label: 'Ritmo', value: attrs.pac || 70 },
{ key: 'sho', label: 'Tiro', value: attrs.sho || 70 },
{ key: 'pas', label: 'Pase', value: attrs.pas || 70 },
{ key: 'dri', label: 'Regate', value: attrs.dri || 70 },
{ key: 'def', label: 'Defensa', value: attrs.def || 70 },
{ key: 'phy', label: 'Físico', value: attrs.phy || 70 }
```

### 3. **Vista de Perfil** (`test-app.js`)
**Líneas 4823-4828**
```javascript
document.getElementById('profile-pac').textContent = currentUser.pac || 50;
document.getElementById('profile-sho').textContent = currentUser.sho || 50;
document.getElementById('profile-pas').textContent = currentUser.pas || 50;
document.getElementById('profile-dri').textContent = currentUser.dri || 50;
document.getElementById('profile-def').textContent = currentUser.def || 50;
document.getElementById('profile-phy').textContent = currentUser.phy || 50;
```

### 4. **Cálculos de Equipo** (`team-generator-advanced.js`)
**Líneas 382-387**
```javascript
stats.avgPace += attrs.pac || player.pac || 70;
stats.avgShooting += attrs.sho || player.sho || 70;
stats.avgPassing += attrs.pas || player.pas || 70;
stats.avgDribbling += attrs.dri || player.dri || 70;
stats.avgDefending += attrs.def || player.def || 70;
stats.avgPhysical += attrs.phy || player.phy || 70;
```

### 5. **Compatibilidad** (`players-view-enhanced.js`)
**Líneas 233-241**
```javascript
// Verifica tres posibles ubicaciones
if (player.pac !== undefined || player.sho !== undefined) {
    return {
        pac: player.pac || player.PAC || 50,  // Directo
        sho: player.sho || player.SHO || 50,  // Directo
        // ...
    };
}
```

### 6. **Conversión para Legacy** (`firebase-simple.js`)
**Líneas 539-546**
```javascript
// Lee directos pero crea objeto para compatibilidad
attributes: {
    pac: userData.pac || 50,  // userData.pac es directo
    sho: userData.sho || 50,  // userData.sho es directo
    pas: userData.pas || 50,
    dri: userData.dri || 50,
    def: userData.def || 50,
    phy: userData.phy || 50
}
```

---

## 🔄 FLUJO DE ACTUALIZACIÓN

### 1. Lectura de valores actuales
```javascript
const userDoc = await db.collection('futbol_users').doc(userId).get();
const currentData = userDoc.data();
const currentPac = currentData.pac;
```

### 2. Cálculo de mejoras (después de evaluación)
```javascript
const mejoraPac = 3;  // Basado en rendimiento
const nuevoPac = Math.min(99, currentPac + mejoraPac);
```

### 3. Actualización en Firebase
```javascript
await db.collection('futbol_users').doc(userId).update({
    pac: nuevoPac,
    sho: nuevoSho,
    // Solo actualiza los campos necesarios
});
```

### 4. Recálculo de OVR
```javascript
const nuevoOvr = Math.round((pac + sho + pas + dri + def + phy) / 6);
await db.collection('futbol_users').doc(userId).update({
    ovr: nuevoOvr
});
```

---

## ✅ VENTAJAS DEL SISTEMA ACTUAL

1. **Eficiencia en Queries**
   - Firebase puede indexar campos directos más eficientemente
   - Menor consumo de reads/writes

2. **Simplicidad de Código**
   ```javascript
   // Actual (simple)
   userData.pac
   
   // Legacy (anidado)
   userData.attributes.pac
   ```

3. **Actualizaciones Parciales**
   ```javascript
   // Puede actualizar solo un campo
   .update({ pac: 85 })
   
   // En lugar de todo el objeto
   .update({ 'attributes.pac': 85 })
   ```

4. **Mejor Performance**
   - Menos anidamiento = menos procesamiento
   - Transferencias de datos más ligeras

---

## 🎯 PUNTOS CLAVE

- **Ubicación única**: `/futbol_users/{uid}` para TODOS los usuarios
- **6 atributos base**: pac, sho, pas, dri, def, phy
- **Valores iniciales**: 50 para todos al registrarse
- **Rango válido**: 0-99 para cada atributo
- **OVR calculado**: Promedio simple de los 6 atributos
- **Compatibilidad dual**: Sistema maneja ambas estructuras

---

## 📝 NOTAS IMPORTANTES

1. El sistema SIEMPRE prioriza campos directos sobre anidados
2. Las evaluaciones actualizan directamente estos campos
3. Cada jugador tiene valores únicos e independientes
4. No hay herencia ni valores compartidos entre jugadores
5. Los valores persisten entre sesiones y dispositivos

---

*Documentación generada: 06/02/2025*  
*Sistema: FC24 Football Stats Tracker*  
*Versión: 2.0*