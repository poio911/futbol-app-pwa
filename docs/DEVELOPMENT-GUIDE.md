# Guía de Desarrollo - FC24 Team Manager
## Manual de Referencia Técnica

---

## 📂 ESTRUCTURA DEL PROYECTO

```
C:\App.futbol-2\
├── index.html                 # Aplicación principal
├── admin.html                 # Panel administrativo
├── css/
│   └── styles.css            # Todos los estilos (4300+ líneas)
├── js/
│   ├── app.js                # Lógica principal de la aplicación
│   ├── ui.js                 # Manejo de interfaz de usuario
│   ├── firebase-simple.js   # Integración con Firebase
│   ├── match-system-v2.js   # Sistema de partidos v2
│   ├── utils.js              # Utilidades generales
│   └── supabase-storage.js  # Almacenamiento de imágenes
└── docs/
    ├── CHANGELOG-EVALUATION-SYSTEM.md
    └── DEVELOPMENT-GUIDE.md  # Este archivo
```

---

## 🎯 CONVENCIONES DE CÓDIGO

### JavaScript
```javascript
// Siempre usar async/await para operaciones asíncronas
async function loadData() {
    try {
        const data = await Storage.getPlayers();
        return data;
    } catch (error) {
        console.error('Error:', error);
        UI.showNotification('Error', 'error');
    }
}

// Logging con emojis para debug
console.log('✅ Operación exitosa');
console.log('❌ Error detectado');
console.log('🔍 Buscando datos');
console.log('🧹 Limpiando cache');
```

### CSS
```css
/* Variables centralizadas */
:root {
    --primary-color: #00ff9d;
    --bg-dark: #0a0a0a;
    --border-color: rgba(255, 255, 255, 0.1);
}

/* Nomenclatura BEM modificada */
.component-name { }           /* Bloque */
.component-name-element { }    /* Elemento */
.component-name--modifier { }  /* Modificador */
```

---

## 🔑 COMPONENTES PRINCIPALES

### 1. Sistema de Almacenamiento (Storage)

**Archivo:** `firebase-simple.js`

```javascript
// Métodos principales
Storage.getPlayers()           // Obtener jugadores
Storage.addPlayer(data)        // Agregar jugador
Storage.updatePlayer(player)   // Actualizar jugador
Storage.deletePlayer(id)       // Eliminar jugador
Storage.cleanDuplicatePlayers() // Limpiar duplicados

// Estado global
Storage.currentGroupId         // Grupo actual
Storage.currentPersonId        // Persona actual
Storage.isDemo                 // Modo demo (deshabilitado)
```

### 2. Sistema de UI

**Archivo:** `ui.js`

```javascript
// Métodos principales
UI.showNotification(msg, type)  // Mostrar notificación
UI.showLoading()                 // Mostrar cargando
UI.hideLoading()                 // Ocultar cargando
UI.displayPlayers(players, edit) // Mostrar jugadores
UI.showPlayerDetail(player)      // Detalle de jugador
```

### 3. Sistema de Partidos V2

**Archivo:** `match-system-v2.js`

```javascript
// Flujo de evaluación
MatchSystemV2.generateBalancedTeams(players, format)
MatchSystemV2.createMatch(teamA, teamB, date, groupId)
MatchSystemV2.startEvaluation(matchId)
MatchSystemV2.saveEvaluation(matchId, scoreA, scoreB, performance)
MatchSystemV2.updatePlayerStatistics(match, performance)
```

---

## 🎨 SISTEMA DE ESTILOS

### Ubicaciones Clave en `styles.css`

| Sección | Líneas | Descripción |
|---------|--------|-------------|
| Variables globales | 1-50 | Colores y configuración base |
| Navegación | 100-300 | Barra de navegación y menús |
| Tarjetas de jugador | 400-600 | Player cards y stats |
| Sistema de partidos | 1500-2000 | Matches y teams |
| Evaluación V2 | 3868-4302 | Sistema completo de evaluación |
| Responsive | 4167-4302 | Media queries mobile |

### Variables CSS Importantes

```css
/* En línea 3871-3880 */
:root {
    --eval-bg-primary: #0a0a0a;
    --eval-bg-secondary: #1a1a1a;
    --eval-border-color: rgba(255, 255, 255, 0.1);
    --eval-tag-height: 50px;
    --eval-tag-gap: 10px;
}
```

---

## 🔧 OPERACIONES COMUNES

### Agregar Nueva Funcionalidad

1. **Definir en Storage** (`firebase-simple.js`)
```javascript
async newFeature(data) {
    if (!db || !this.currentGroupId) return false;
    // Implementación
}
```

2. **Crear UI** (`ui.js`)
```javascript
displayNewFeature(data) {
    // Crear HTML
    // Agregar event listeners
}
```

3. **Integrar en App** (`app.js`)
```javascript
async loadNewFeature() {
    const data = await Storage.newFeature();
    UI.displayNewFeature(data);
}
```

### Modificar Estilos de Evaluación

```css
/* Buscar en styles.css línea 3868 */
.performance-tag label {
    height: 48px; /* Cambiar altura aquí */
}

.tag-label {
    font-size: 0.8rem; /* Cambiar tamaño texto */
}
```

### Debugging Firebase

```javascript
// En consola del navegador
Storage.cleanDuplicatePlayers() // Limpiar duplicados
Storage.cachedPlayers           // Ver cache actual
Storage.currentGroupId          // Ver grupo actual
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema: Jugadores Duplicados
```javascript
// Solución manual
Storage.cleanDuplicatePlayers()

// Solución automática (UI)
// Aparece botón cuando hay >10 jugadores
```

### Problema: Datos No Se Guardan
```javascript
// Verificar modo demo
console.log(Storage.isDemo) // Debe ser false

// Verificar grupo
console.log(Storage.currentGroupId) // No debe ser null
```

### Problema: Estilos No Se Aplican
```bash
# Limpiar cache del navegador
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)

# Verificar consola
F12 > Console > Buscar errores CSS
```

---

## 📝 CHECKLIST DE DESARROLLO

### Antes de Modificar Código
- [ ] Hacer backup del archivo
- [ ] Identificar líneas exactas a modificar
- [ ] Revisar dependencias del código
- [ ] Verificar que no hay modo demo activo

### Durante el Desarrollo
- [ ] Usar console.log con emojis para debug
- [ ] Mantener nomenclatura consistente
- [ ] Comentar cambios importantes
- [ ] Probar en móvil y desktop

### Después de Modificar
- [ ] Limpiar console.logs innecesarios
- [ ] Verificar funcionamiento en Firebase
- [ ] Actualizar documentación si es necesario
- [ ] Hacer hard refresh del navegador

---

## 🚀 COMANDOS ÚTILES DE CONSOLA

```javascript
// Estado del sistema
Storage.currentGroupId
Storage.currentPersonId
Storage.cachedPlayers.length
Storage.isDemo

// Operaciones de limpieza
Storage.cleanDuplicatePlayers()
Storage.cachedPlayers = []
localStorage.clear()

// Debug de UI
UI.elements
document.querySelectorAll('.performance-tag').length
document.querySelector('.evaluation-container')
```

---

## 📊 FLUJO DE DATOS

```
Firebase (Firestore)
    ↓
Storage (firebase-simple.js)
    ↓ Cache local
App (app.js)
    ↓ Lógica de negocio
UI (ui.js)
    ↓ Renderizado
DOM (index.html)
```

---

## 🔐 SEGURIDAD

### Configuración Firebase
```javascript
// Archivo: firebase-simple.js, líneas 6-15
const firebaseConfig = {
    apiKey: "...",
    authDomain: "mil-disculpis.firebaseapp.com",
    projectId: "mil-disculpis",
    // etc...
};
```

### Mejores Prácticas
1. Nunca exponer credenciales sensibles
2. Validar datos antes de enviar a Firebase
3. Usar try/catch en todas las operaciones async
4. Limpiar datos de demo regularmente

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
- Mobile: < 480px
- Tablet: 480px - 768px  
- Desktop: > 768px

### Ubicación en CSS
- Mobile: Líneas 4167-4302
- Tablet: Líneas 4064-4166
- Desktop: Estilos base

---

## 🎯 MEJORAS PENDIENTES

1. [ ] Sistema de autenticación completo
2. [ ] Exportación de datos a Excel
3. [ ] Gráficos de estadísticas avanzados
4. [ ] Modo offline con sincronización
5. [ ] Notificaciones push
6. [ ] Sistema de ligas y torneos

---

## 📞 SOPORTE

Para problemas o consultas sobre el código:
1. Revisar esta documentación
2. Buscar en el código con Ctrl+F
3. Revisar console.log del navegador
4. Verificar estado de Firebase

---

*Última actualización: 30/08/2025*
*Versión: 2.0*