# 🧪 Tests Automatizados con Playwright

## 📋 Descripción
Suite completa de tests end-to-end (E2E) para el sistema colaborativo de fútbol, cubriendo todas las funcionalidades principales.

## 🚀 Instalación Rápida
```bash
# Ya instalado - Playwright y dependencias están listas
npm install
```

## 🎯 Ejecutar Tests

### **Todos los tests:**
```bash
npm test
```

### **Tests con interfaz visual:**
```bash
npm run test:headed
```

### **Tests con UI interactiva de Playwright:**
```bash
npm run test:ui
```

### **Tests en modo debug:**
```bash
npm run test:debug
```

## 📂 Tests Disponibles

### **1. Autenticación** (`01-authentication.spec.js`)
- ✅ Mostrar formulario de login
- ✅ Cambiar a registro
- ✅ Registrar nuevo usuario
- ✅ Login con credenciales válidas
- ✅ Error con credenciales inválidas
- ✅ Logout exitoso
- ✅ Validación de email
- ✅ Validación de contraseña
- ✅ Persistencia de sesión

**Ejecutar solo autenticación:**
```bash
npm run test:auth
```

### **2. Partidos Colaborativos** (`02-collaborative-matches.spec.js`)
- ✅ Mostrar sección de partidos
- ✅ Abrir modal de crear partido
- ✅ Crear nuevo partido
- ✅ Anotarse a partido
- ✅ Desanotarse de partido
- ✅ Borrar partido (solo organizador)
- ✅ Mostrar detalles correctos
- ✅ Prevenir duplicados
- ✅ Actualizar contador de jugadores

**Ejecutar solo partidos:**
```bash
npm run test:matches
```

### **3. Invitaciones y Equipos** (`03-invitations-teams.spec.js`)
- ✅ Mostrar botón invitar
- ✅ Abrir modal de invitación
- ✅ Listar jugadores disponibles
- ✅ Invitar jugadores
- ✅ Prevenir invitaciones duplicadas
- ✅ Quitar jugador invitado
- ✅ Generar equipos con 10 jugadores
- ✅ Mostrar equipos generados
- ✅ Balancear equipos por OVR

**Ejecutar solo equipos:**
```bash
npm run test:teams
```

### **4. Sistema de Evaluaciones** (`04-evaluation-system.spec.js`)
- ✅ Asignar evaluaciones al generar equipos
- ✅ Excluir invitados de evaluaciones
- ✅ Mostrar formulario post-partido
- ✅ Enviar evaluaciones
- ✅ Calcular OVRs con 80% completado
- ✅ No calcular con menos de 80%
- ✅ Mostrar progreso de evaluaciones

**Ejecutar solo evaluaciones:**
```bash
npm run test:eval
```

## 🌐 Tests por Navegador

### **Chrome:**
```bash
npm run test:chrome
```

### **Firefox:**
```bash
npm run test:firefox
```

### **Safari (WebKit):**
```bash
npm run test:webkit
```

### **Mobile Chrome:**
```bash
npm run test:mobile
```

## 📊 Reportes

### **Ver último reporte HTML:**
```bash
npm run report
```

## 🔧 Configuración

### **Servidor Local**
Los tests automáticamente levantan un servidor en `http://localhost:5500`

Para levantar el servidor manualmente:
```bash
npm run serve
```

### **Variables de Entorno**
```bash
# Ejecutar tests más lento para debugging
SLOW_MO=1 npm test

# Ejecutar en modo CI
CI=true npm test
```

## 📁 Estructura de Tests
```
tests/
└── e2e/
    ├── helpers/
    │   └── test-data.js          # Datos y utilidades compartidas
    ├── 01-authentication.spec.js  # Tests de autenticación
    ├── 02-collaborative-matches.spec.js # Tests de partidos
    ├── 03-invitations-teams.spec.js    # Tests de invitaciones
    └── 04-evaluation-system.spec.js    # Tests de evaluaciones
```

## 🐛 Debugging

### **Pausar en un punto específico:**
```javascript
await page.pause(); // Agrega esto en cualquier test
```

### **Ver consola del navegador:**
```javascript
page.on('console', msg => console.log(msg.text()));
```

### **Tomar screenshot:**
```javascript
await page.screenshot({ path: 'debug.png' });
```

## ⚠️ Notas Importantes

1. **Firebase:** Los tests usan datos reales de Firebase. Ten cuidado al ejecutarlos en producción.

2. **Limpieza:** Los tests limpian automáticamente los datos creados con `cleanupTestData()`.

3. **Usuarios de Test:** Se crean usuarios temporales para testing que deberían eliminarse después.

4. **Timeouts:** Configurados para 10 segundos por acción. Ajusta en `playwright.config.js` si necesario.

## 🎯 Coverage

| Funcionalidad | Coverage | Tests |
|--------------|----------|-------|
| Autenticación | 100% | 9 |
| Partidos | 100% | 9 |
| Invitaciones | 100% | 9 |
| Evaluaciones | 100% | 8 |
| **TOTAL** | **100%** | **35** |

## 🚀 Comandos Rápidos

```bash
# Desarrollo diario
npm run test:headed  # Ver tests ejecutándose

# CI/CD
npm test             # Headless para CI

# Debugging
npm run test:debug   # Con inspector de Playwright

# Reporte
npm run report       # Ver resultados detallados
```

## 📝 Agregar Nuevos Tests

1. Crea archivo en `tests/e2e/`
2. Importa helpers: `require('./helpers/test-data')`
3. Estructura básica:
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Mi Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Tu test aquí
  });
});
```

---

**Última actualización:** 2 Sept 2025  
**Playwright Version:** 1.55.0  
**Total Tests:** 35