# 🚀 REFERENCIA RÁPIDA - FC24 Team Manager

## CAMBIOS MÁS IMPORTANTES REALIZADOS HOY

### 1️⃣ MODO DEMO DESHABILITADO
```javascript
// firebase-simple.js - Línea 37
isDemo: false // SIEMPRE false
```

### 2️⃣ LIMPIEZA DE DUPLICADOS
```javascript
// Consola del navegador
Storage.cleanDuplicatePlayers()
```

### 3️⃣ TAGS DE EVALUACIÓN UNIFORMES
```css
/* styles.css - Línea 4089 */
.performance-tag label {
    height: 48px; /* TODOS mismo tamaño */
    grid-template-columns: 35px 1fr auto;
}
```

---

## 📍 UBICACIONES CLAVE EN ARCHIVOS

### `styles.css`
- **Línea 3868**: Inicio estilos evaluación
- **Línea 4089**: Tags de performance
- **Línea 4167**: Media queries mobile
- **Línea 4283**: Botones de acción

### `firebase-simple.js`
- **Línea 37**: Estado demo
- **Línea 654**: deletePlayer()
- **Línea 732**: cleanDuplicatePlayers()
- **Línea 977**: setCurrentPerson()

### `ui.js`
- **Línea 413**: displayPlayers()
- **Línea 448**: addCleanupDuplicatesButton()
- **Línea 486**: handleCleanupDuplicates()

### `match-system-v2.js`
- **Línea 385**: HTML tags evaluación
- **Línea 430**: submitEvaluation()

---

## 🎨 CLASES CSS PRINCIPALES

```css
.evaluation-container     /* Contenedor principal */
.performance-tags-grid    /* Grid de tags */
.performance-tag         /* Tag individual */
.tag-icon               /* Icono del tag */
.tag-label              /* Texto del tag */
.tag-points             /* Puntos del tag */
```

---

## 🔧 COMANDOS DE DEBUG

```javascript
// Ver estado actual
Storage.isDemo              // false
Storage.currentGroupId       // ID grupo
Storage.cachedPlayers.length // Cantidad jugadores

// Limpiar problemas
Storage.cleanDuplicatePlayers() // Eliminar duplicados
localStorage.clear()             // Limpiar todo local
location.reload(true)           // Recargar forzado
```

---

## ⚡ SOLUCIONES RÁPIDAS

| Problema | Solución |
|----------|----------|
| Jugadores duplicados | `Storage.cleanDuplicatePlayers()` |
| CSS no se actualiza | `Ctrl + F5` |
| Datos no se guardan | Verificar `Storage.currentGroupId` |
| Tags mal alineados | Revisar línea 4089 en styles.css |

---

## 📝 PARA CAMBIAR TAMAÑOS

### Tags de Evaluación
```css
/* styles.css - Línea 4089 */
.performance-tag label {
    height: 48px; /* Cambiar altura aquí */
}

.tag-label {
    font-size: 0.8rem; /* Cambiar tamaño texto */
}
```

### Botones
```css
/* styles.css - Línea 4296 */
.evaluation-actions .btn {
    padding: 12px; /* Cambiar padding */
    font-size: 0.85rem; /* Cambiar tamaño */
}
```

---

## 🔴 NO MODIFICAR

1. **Línea 37** de `firebase-simple.js` (isDemo)
2. **Línea 506** de `firebase-simple.js` (getPlayers sin demo)
3. Variables CSS en `:root` sin documentar cambio

---

*Referencia creada: 30/08/2025*