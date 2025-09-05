# 📋 INSTRUCCIONES PERMANENTES PARA CLAUDE
**Creado:** 2025-09-05  
**Propósito:** Sistema de organización y documentación automática del proyecto

---

## 🎯 **OBJETIVO PRINCIPAL**
Mantener el proyecto **FC24 Team Manager** completamente organizado con documentación automática de todos los cambios realizados.

---

## 📁 **ESTRUCTURA DE ORGANIZACIÓN OBLIGATORIA**

### **Carpeta Raíz Limpia:**
```
C:\app.futbol-2\
├── 📄 index.html                    # ⭐ APP PRINCIPAL
├── 📄 manifest.json                 # PWA
├── 📄 service-worker.js             # PWA
├── 📄 INSTRUCCIONES_CLAUDE.md       # 📋 ESTE ARCHIVO
├── 📄 CHANGELOG.md                  # 📋 HISTORIAL DE CAMBIOS
├── 📄 README.md                     # 📋 DOCUMENTACIÓN PRINCIPAL
├── 📂 css/                          # Estilos únicamente
├── 📂 js/                           # Scripts únicamente
├── 📂 images/                       # Imágenes únicamente
├── 📂 docs/                         # 📚 TODA LA DOCUMENTACIÓN
├── 📂 tests/                        # 🧪 ARCHIVOS DE PRUEBA
└── 📂 backup/                       # 🗄️ RESPALDOS Y ARCHIVOS VIEJOS
```

---

## 📝 **SISTEMA DE DOCUMENTACIÓN OBLIGATORIO**

### **1. CHANGELOG.md - REGISTRO AUTOMÁTICO**
**SIEMPRE** que hagas cambios, actualiza `CHANGELOG.md` con este formato:

```markdown
# Changelog - FC24 Team Manager

## [Sin versión] - YYYY-MM-DD

### 🔧 Cambios Realizados
- ✅ **Descripción específica del cambio** - Archivo afectado
- ✅ **Otro cambio** - Archivos modificados
- ✅ **Bug corregido** - Descripción del problema resuelto

### 📁 Archivos Modificados
- `archivo1.js` - líneas X-Y
- `archivo2.css` - líneas A-B  
- `archivo3.html` - sección específica

### 🎯 Impacto
- Descripción del efecto del cambio
- Mejoras obtenidas
- Funcionalidades afectadas

---

## [Versión anterior] - YYYY-MM-DD
[Entradas anteriores...]
```

### **2. README.md - MANTENER ACTUALIZADO**
Siempre mantener actualizado con:
- Estado actual del proyecto
- Funcionalidades implementadas  
- Instrucciones de uso
- Últimos cambios importantes

---

## 🗂️ **REGLAS DE ORGANIZACIÓN DE ARCHIVOS**

### **✅ PERMITIDO EN RAÍZ:**
- `index.html` (app principal)
- `manifest.json`, `service-worker.js` (PWA)
- `INSTRUCCIONES_CLAUDE.md` (este archivo)
- `CHANGELOG.md` (historial)
- `README.md` (documentación principal)

### **❌ PROHIBIDO EN RAÍZ:**
- Archivos .html de prueba → mover a `/tests/`
- Archivos .md de documentación → mover a `/docs/`
- Archivos .js sueltos → mover a `/js/` 
- Archivos .css sueltos → mover a `/css/`
- Archivos backup/old → mover a `/backup/`

### **📂 ORGANIZACIÓN POR CARPETAS:**

#### **`/docs/` - TODA LA DOCUMENTACIÓN**
```
📁 docs/
├── 📋 arquitectura/          # Documentación técnica
├── 📋 sesiones/             # Resúmenes de sesiones
├── 📋 bugs/                 # Documentación de bugs
└── 📋 deployment/           # Guías de despliegue
```

#### **`/tests/` - ARCHIVOS DE PRUEBA**
```
📁 tests/
├── 🧪 unit/                 # Tests unitarios
├── 🧪 integration/          # Tests de integración  
├── 🧪 e2e/                  # Tests end-to-end
└── 🧪 debug/                # Herramientas de debug
```

#### **`/backup/` - RESPALDOS ORGANIZADOS**
```
📁 backup/
├── 🗄️ 2025-09-05/          # Backup por fecha
├── 🗄️ versions/            # Versiones anteriores
└── 🗄️ deprecated/          # Código obsoleto
```

---

## ⚡ **FLUJO DE TRABAJO OBLIGATORIO**

### **ANTES DE HACER CAMBIOS:**
1. **Leer este archivo** para recordar las reglas
2. **Revisar CHANGELOG.md** para contexto
3. **Planificar** qué archivos se van a modificar

### **DURANTE LOS CAMBIOS:**
1. **Hacer cambios** en los archivos necesarios
2. **Probar** que todo funciona correctamente
3. **Documentar** cada modificación

### **DESPUÉS DE HACER CAMBIOS:**
1. **✅ OBLIGATORIO: Actualizar CHANGELOG.md** con fecha actual
2. **✅ OBLIGATORIO: Actualizar README.md** si es necesario
3. **✅ OBLIGATORIO: Organizar archivos** según estructura
4. **✅ OBLIGATORIO: Mover archivos** que no van en raíz
5. **✅ OBLIGATORIO: Crear backup** si los cambios son significativos

---

## 🔄 **COMANDOS DE LIMPIEZA AUTOMÁTICA**

### **Organizar Archivos:**
```bash
# Mover archivos de prueba
mv test-*.html tests/debug/
mv debug-*.html tests/debug/

# Mover documentación
mv *.md docs/ (excepto README.md, CHANGELOG.md, INSTRUCCIONES_CLAUDE.md)

# Mover backups
mv *backup* backup/$(date +%Y-%m-%d)/
mv *old* backup/$(date +%Y-%m-%d)/
```

### **Crear Backup Pre-cambios:**
```bash
# Crear backup con fecha
mkdir -p backup/$(date +%Y-%m-%d)
cp -r js/ backup/$(date +%Y-%m-%d)/js-backup/
cp -r css/ backup/$(date +%Y-%m-%d)/css-backup/
cp index.html backup/$(date +%Y-%m-%d)/
```

---

## 📊 **FORMATO ESTÁNDAR DE COMMITS**

Si se usa Git:
```
tipo(alcance): descripción breve

- Cambio específico 1
- Cambio específico 2  
- Bug corregido X

Archivos modificados:
- archivo1.js (líneas X-Y)
- archivo2.css (nuevos estilos)

Fecha: YYYY-MM-DD
```

**Tipos permitidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación  
- `style`: Cambios de formato/CSS
- `refactor`: Refactorización de código
- `test`: Agregar/modificar tests
- `chore`: Tareas de mantenimiento

---

## 🚨 **REGLAS CRÍTICAS**

### **❌ NUNCA HACER:**
1. Dejar archivos sueltos en raíz sin documentar
2. Hacer cambios sin actualizar CHANGELOG.md
3. Eliminar archivos sin hacer backup primero
4. Dejar código comentado sin explicación
5. Subir archivos temporales o de prueba a producción

### **✅ SIEMPRE HACER:**  
1. Actualizar CHANGELOG.md con CADA cambio
2. Mantener estructura de carpetas organizada
3. Crear backup antes de cambios importantes
4. Documentar la razón de cada modificación
5. Probar que la app sigue funcionando después de cambios

---

## 📋 **CHECKLIST PRE-ENTREGA**

Antes de considerar cualquier trabajo "terminado":

- [ ] ✅ CHANGELOG.md actualizado con fecha actual
- [ ] ✅ README.md actualizado si es necesario  
- [ ] ✅ Archivos organizados en carpetas correctas
- [ ] ✅ Raíz limpia sin archivos temporales
- [ ] ✅ Backup creado si hubo cambios importantes
- [ ] ✅ App probada y funcionando correctamente
- [ ] ✅ Documentación coherente y actualizada

---

## 🎯 **OBJETIVO DE ESTAS INSTRUCCIONES**

**Mantener el proyecto FC24 Team Manager como un sistema profesional, organizado y completamente documentado, donde cada cambio esté registrado cronológicamente y todos los archivos estén en su lugar correcto.**

---

**⚠️ IMPORTANTE:** Este archivo debe leerse SIEMPRE al iniciar trabajo en este proyecto para mantener la consistencia y organización.

**📅 Creado:** 5 de Septiembre 2025  
**🔄 Última actualización:** 5 de Septiembre 2025