# 📋 ANÁLISIS DE ARCHIVOS - ORGANIZACIÓN DEL SISTEMA

## ✅ ARCHIVOS QUE SÍ SE USAN EN index.html:

### 📱 HTML PRINCIPAL:
- `index.html` ⭐ **ARCHIVO PRINCIPAL - NO MOVER**

### 📁 CSS QUE SE USA:
- `css/evaluation-styles.css`
- `css/header-footer-enhanced.css`
- `css/partidos-grupales-enhanced.css`
- `css/unified-design-system.css`
- `css/players-view-enhanced.css`
- `css/collaborative-matches.css`

### 📁 JS QUE SE USA:
- `js/unified-evaluation-system.js`
- `js/evaluation-ui.js`
- `js/collaborative-system-integration.js`
- `js/notifications-system.js`
- `js/header-footer-enhanced.js`
- `js/partidos-grupales-v2.js`
- `js/team-generator-advanced.js`
- `js/unified-teams-modal.js`
- `js/players-view-enhanced.js`
- `js/firebase-simple.js`
- `js/auth-system.js`
- `js/utils.js`
- `js/match-manager.js`
- `js/collaborative-system.js`
- `js/collaborative-match-renderer.js`
- `js/test-app.js` ⭐ **ARCHIVO PRINCIPAL**

---

## ❌ ARCHIVOS HTML DEMOS/PRUEBAS (MOVER A innecesarios/html-demos/):
- admin.html
- appfutbol.html
- cpanel.html
- debug_test.html
- demo-evaluaciones.html
- demo-evaluacion-etiquetas.html
- demo-flujo-evaluaciones.html
- design-options.html
- ejemplo estilos.html
- Etiquetas_de_Evaluacion.html
- evaluation-accurate-preview.html
- evaluation-mobile-preview.html
- evaluation-preview.html
- evaluation-screen-preview.html
- preview-*.html (todos)
- style-preview-fifa.html
- test-*.html (todos)
- simple-server.html

## ❌ ARCHIVOS BACKUP (MOVER A innecesarios/backups/):
- backup-30-08-2025-index.html
- index-backup-20250902-180251.html
- index-minimal.html
- C:App.futbol-2admin.html

---

## 🔍 ARCHIVOS JS A ANALIZAR (posibles para mover):

### En js/ que NO aparecen en index.html:
- js/seed-demo.js
- js/supabase-storage.js
- js/ui-helpers.js
- js/charts-manager.js
- js/stats-controller.js
- js/tournament-system.js
- js/player-history.js
- js/dashboard-controller.js
- js/error-handler.js
- js/data-export.js
- js/offline-manager.js
- js/mobile-enhancements.js
- js/validators.js
- js/push-notifications.js
- js/group-chat.js
- js/ui.js
- js/storage.js
- js/debug-fixes.js
- js/collaborative-system-original.js
- js/evaluation-distribution.js
- js/admin-panel.js
- js/cpanel.js
- js/cpanel-fixed.js
- js/partidos-grupales-enhanced.js
- js/match-system-v2.js
- js/app.js

### En css/ que NO aparecen en index.html:
- css/styles.css ⚠️ **VERIFICAR SI SE USA INDIRECTAMENTE**
- css/minimal.css
- css/evaluations.css

---

## 🎯 PLAN DE REORGANIZACIÓN:
1. Mantener archivos USADOS en su lugar
2. Mover HTML demos/pruebas a innecesarios/html-demos/
3. Mover backups a innecesarios/backups/
4. Analizar JS/CSS no referenciados y moverlos a innecesarios/
5. Documentar estructura final