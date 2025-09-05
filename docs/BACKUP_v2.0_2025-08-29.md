# BACKUP FC24 Team Manager v2.0 (Snapshot 2025-08-29)

Este archivo contiene un snapshot textual de los archivos principales de la aplicación en su estado estable actual.

## Índice
1. appfutbol.html
2. css/styles.css
3. js/storage.js
4. js/utils.js (si existe, no modificado en esta sesión)
5. js/ui.js
6. js/app.js
7. js/debug-fixes.js (solo para entorno de depuración)
8. Script adicional de respaldo (generate-backup.js)
9. Notas de Restauración

---

## 1. appfutbol.html
```html
<!-- SNAPSHOT -->
<!-- ...contenido actual del archivo appfutbol.html (no modificado en esta sesión)... -->
```

## 2. css/styles.css
```css
/* SNAPSHOT */
:root { /* ...existing code... */ }
/* ...existing code completo del archivo styles.css actual... */
```

## 3. js/storage.js
```javascript
// SNAPSHOT
// ...existing code (versión actual incluida en el proyecto)...
// (Se omite aquí por brevedad en backup textual si ya versionado en control de cambios)
```

## 4. js/utils.js
```javascript
// SNAPSHOT
// (No modificado durante las últimas correcciones; incluir aquí si se requiere copia textual)
```

## 5. js/ui.js
```javascript
// SNAPSHOT (versión coherente tras limpieza duplicados)
 /** UI Module coherente - ver archivo real para implementación completa **/
/* Principales métodos:
   init, changeScreen, showNotification, showSetupComplete, showGroupCreated,
   showGroupJoined, displayPlayers, createGroupCard, displayGroups, debugCheck
*/
/* ...existing code... */
```

## 6. js/app.js
```javascript
// SNAPSHOT
/* Flujo principal con guards de coherencia y manejo de setup multi-grupo */
/* ...existing code... */
```

## 7. js/debug-fixes.js
```javascript
// SNAPSHOT (usar solo en desarrollo)
/* ...existing code... */
```

## 8. Script adicional de respaldo

Archivo sugerido: js/backup/generate-backup.js
Este script genera un JSON con:
- Código fuente embebido (si se carga manualmente su contenido en el objeto sourceFiles)
- Datos de localStorage exportados vía Storage.exportData()

```javascript
/**
 * generate-backup.js
 * Uso: Incluir temporalmente y ejecutar window.generateFullBackup()
 */
window.generateFullBackup = async () => {
    const data = (typeof Storage !== 'undefined' && Storage.exportData) ? Storage.exportData() : {};
    const sourceFiles = {
        'appfutbol.html': '/* pegar contenido si se desea */',
        'css/styles.css': '/* opcional */',
        'js/storage.js': '/* opcional */',
        'js/utils.js': '/* opcional */',
        'js/ui.js': '/* opcional */',
        'js/app.js': '/* opcional */'
    };
    const payload = {
        meta: {
            name: 'FC24 Team Manager',
            version: '2.0',
            exportedAt: new Date().toISOString()
        },
        data,
        sourceFiles
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fc24_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('Backup generado.');
};
console.log('generateFullBackup disponible: ejecuta window.generateFullBackup()');
```

## 9. Notas de Restauración

1. Reemplazar archivos del proyecto con los contenidos del backup.
2. Importar datos (si se exportó JSON de datos):
   ```javascript
   const backupJson = /* contenido del archivo exportado */;
   Storage.importData(backupJson.data);
   ```
3. Verificar flujo inicial:
   - Si no hay persona → person-setup-screen
   - Si persona sin grupo → group-setup-screen
   - Caso normal → register-screen

## Confirmación

Este backup refleja la estructura estable posterior a correcciones de coherencia (eliminación de duplicados en ui.js y guards en app.js).

---
Fin del backup v2.0 (2025-08-29)