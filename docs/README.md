# Fútbol Stats Stats - Aplicación de Gestión de Jugadores

## 📋 Descripción General

Fútbol Stats Stats es una aplicación web Progressive Web App (PWA) diseñada para gestionar jugadores de fútbol estilo FIFA Fútbol Stats. **NUEVA VERSIÓN 2.0** incluye un sistema completo de grupos que permite a las personas organizarse en equipos específicos (ej: "Fútbol Miércoles"), gestionar membresías y mantener contextos separados para cada grupo.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos
```
c:\App.futbol-2\
├── appfutbol.html          # HTML principal con nuevas pantallas
├── css/
│   └── styles.css          # Estilos CSS + componentes de grupos
├── js/
│   ├── storage.js         # Gestión datos + personas/grupos/membresías  
│   ├── utils.js           # Utilidades + validaciones grupos
│   ├── ui.js              # UI + pantallas de gestión grupos
│   └── app.js             # Lógica principal + coordinación grupos
├── BACKUP_v1.0.md         # Backup versión anterior
└── README.md              # Esta documentación
```

### Nueva Arquitectura Multi-Grupo
- **Personas**: Usuarios que se registran en el sistema
- **Grupos**: Colecciones de personas (ej: "Fútbol Miércoles", "Liga Sábados")
- **Membresías**: Relaciones entre personas y grupos
- **Contexto**: Grupo activo determina qué jugadores/partidos se muestran

---

## 🆕 Sistema de Grupos (v2.0)

### Entidades Principales

#### 👤 Personas
```javascript
{
  id: "unique_id",
  name: "Juan Pérez", 
  email: "juan@email.com",
  phone: "+1234567890", // opcional
  avatar: "base64_image", // opcional
  createdAt: "2024-12-01T10:00:00Z"
}
```

#### 👥 Grupos  
```javascript
{
  id: "unique_id",
  name: "Fútbol Miércoles",
  description: "Grupo para partidos de los miércoles",
  schedule: "Miércoles 19:00",
  createdBy: "person_id",
  createdAt: "2024-12-01T10:00:00Z",
  isPrivate: false,
  maxMembers: 20,
  code: "ABC123" // código para unirse
}
```

#### 🔗 Membresías
```javascript
{
  id: "unique_id", 
  personId: "person_id",
  groupId: "group_id",
  role: "member|admin|owner",
  joinedAt: "2024-12-01T10:00:00Z"
}
```

### Flujo de Usuario

1. **Registro de Persona** → Usuario crea su perfil personal
2. **Crear/Unirse a Grupo** → Usuario crea grupo nuevo o se une con código
3. **Seleccionar Grupo Activo** → Elige contexto de trabajo
4. **Gestionar Jugadores** → Registra jugadores dentro del grupo
5. **Funcionalidades Normales** → Stats, equipos, ranking por grupo

---

## ⚙️ Módulos del Sistema (Actualizados)

### 🗄️ Storage Module (`js/storage.js`)
**EXPANDIDO:** Gestión completa de personas, grupos y membresías

#### Nuevas APIs:
```javascript
// Personas
Storage.getPersons()               // Obtener todas las personas
Storage.addPerson(person)          // Agregar nueva persona  
Storage.getPersonById(id)          // Obtener persona por ID
Storage.personNameExists(name)     // Verificar si nombre existe

// Grupos
Storage.getGroups()                // Obtener todos los grupos
Storage.addGroup(group)            // Agregar nuevo grupo
Storage.getGroupById(id)           // Obtener grupo por ID
Storage.groupNameExists(name)      // Verificar si nombre existe

// Membresías
Storage.getMemberships()           // Obtener todas las membresías
Storage.addMembership(membership)  // Agregar nueva membresía
Storage.getGroupsForPerson(id)     // Grupos de una persona
Storage.getPersonsInGroup(id)      // Personas en un grupo
Storage.isPersonInGroup(pid, gid)  // Verificar membresía

// Sesión
Storage.setCurrentPerson(id)       // Establecer persona activa
Storage.getCurrentPerson()         // Obtener persona activa
Storage.setCurrentGroup(id)        // Establecer grupo activo  
Storage.getCurrentGroup()          // Obtener grupo activo
```

#### Cambios en APIs Existentes:
```javascript
// MODIFICADO: Ahora filtra por grupo activo
Storage.getPlayers()              // Solo jugadores del grupo actual
Storage.addPlayer(player)         // Agrega al grupo actual
```

### 🛠️ Utils Module (`js/utils.js`)
**EXPANDIDO:** Validaciones y utilidades para grupos

#### Nuevas APIs:
```javascript
// Validaciones
Utils.validatePerson(person)      // Validar datos de persona
Utils.validateGroup(group)        // Validar datos de grupo
Utils.isValidEmail(email)         // Validar formato email
Utils.isValidPhone(phone)         // Validar formato teléfono

// Utilidades de Grupos
Utils.generateGroupCode()         // Generar código único de grupo
Utils.formatMemberCount(count)    // Formatear conteo de miembros
Utils.formatSchedule(schedule)    // Formatear horario

// Sesión y Contexto
Utils.hasValidSession()           // Verificar sesión válida
Utils.hasGroupContext()           // Verificar grupo seleccionado
Utils.getSessionStatus()          // Estado completo de sesión
Utils.getSetupStatus()            // Estado de configuración inicial
Utils.getLandingScreen()          // Pantalla apropiada según estado

// Migración
Utils.migrateLegacyPlayers(gid)   // Migrar jugadores existentes
Utils.createDefaultGroup(pid)     // Crear grupo por defecto
```

### 🎨 UI Module (`js/ui.js`)
**PRÓXIMA ACTUALIZACIÓN:** Nuevas pantallas y componentes

#### Nuevas Pantallas Planificadas:
- **person-setup-screen**: Registro de personas
- **group-setup-screen**: Crear/unirse a grupos  
- **group-selector**: Cambiar grupo activo
- **group-management**: Administrar grupo

### 🎯 App Module (`js/app.js`)
**PRÓXIMA ACTUALIZACIÓN:** Coordinación del nuevo flujo

#### Nuevas Funcionalidades Planificadas:
- **Gestión de sesión**: Login/logout de personas
- **Configuración inicial**: Guía de setup primera vez
- **Cambio de contexto**: Alternar entre grupos
- **Migración automática**: Datos existentes a nuevo sistema

---

## 🚀 Funcionalidades del Sistema (Actualizadas)

### 🆕 Gestión de Personas
- **Registro Completo**: Nombre, email, teléfono opcional, avatar
- **Validaciones**: Email único, formato válido, longitudes apropiadas
- **Sesión Persistente**: Mantiene usuario activo entre sesiones
- **Perfil Personal**: Información editable del usuario

### 🆕 Sistema de Grupos  
- **Creación de Grupos**: Nombre, descripción, horario, configuración
- **Códigos de Acceso**: Códigos únicos para invitar personas
- **Membresías**: Sistema de roles (owner/admin/member)
- **Grupos Privados/Públicos**: Control de visibilidad
- **Límites de Miembros**: Configuración de capacidad máxima

### 🔄 Contexto por Grupo
- **Aislamiento de Datos**: Cada grupo ve solo sus jugadores/partidos
- **Cambio de Contexto**: Alternar fácilmente entre grupos
- **Historial Separado**: Rankings y estadísticas independientes
- **Configuración Individual**: Cada grupo mantiene su configuración

### 👤 Gestión de Jugadores (Mejorada)
- **Asociación a Grupo**: Jugadores pertenecen al grupo activo
- **Creador Registrado**: Se registra quién agregó cada jugador
- **Migración Automática**: Jugadores existentes se migran automáticamente
- **Funcionalidades Existentes**: Todas las características anteriores preservadas

---

## 🚦 Nuevo Flujo de Usuario

### Primera Vez (Setup)
1. **Registrar Persona** → Crear perfil personal
2. **Crear Primer Grupo** → Definir grupo inicial
3. **Invitar Personas** → Compartir código de grupo
4. **Agregar Jugadores** → Registrar jugadores en el grupo
5. **¡Usar Normalmente!** → Todas las funcionalidades disponibles

### Uso Habitual  
1. **Seleccionar Grupo** → Elegir contexto de trabajo
2. **Ver Dashboard** → Estadísticas del grupo actual
3. **Gestionar Jugadores** → Agregar/evaluar jugadores
4. **Generar Equipos** → Solo con jugadores del grupo
5. **Cambiar Grupo** → Alternar contexto cuando sea necesario

### Unirse a Grupo Existente
1. **Tener Código** → Recibir código de 6 caracteres
2. **Buscar Grupo** → Ingresar código en la app
3. **Solicitar Unión** → Automática o con aprobación
4. **¡Empezar!** → Acceso inmediato al grupo

---

## 🛣️ Plan de Implementación

### ✅ Fase 1: Infraestructura (Completada)
- ✅ Expandir Storage con nuevas entidades
- ✅ Expandir Utils con validaciones
- ✅ Crear backup v1.0
- ✅ Actualizar documentación

### ⏳ Fase 2: Interfaz de Usuario (En Progreso)
- 🔄 Crear pantallas de setup de personas
- 🔄 Crear pantallas de gestión de grupos
- 🔄 Actualizar navegación principal
- 🔄 Agregar selector de grupo activo

### 📋 Fase 3: Lógica de Aplicación (Pendiente)
- ⏳ Implementar flujo de configuración inicial
- ⏳ Agregar gestión de membresías
- ⏳ Migración automática de datos existentes
- ⏳ Testing completo del sistema

### 🚀 Fase 4: Refinamiento (Pendiente)
- ⏳ Optimizaciones de UX
- ⏳ Validaciones adicionales
- ⏳ Manejo de edge cases
- ⏳ Documentación de usuario final

---

## 🔄 Compatibilidad con Versión Anterior

### Migración Automática
- **Jugadores Existentes**: Se asignan automáticamente al primer grupo
- **Partidos Históricos**: Se preservan y se asocian al grupo
- **Sin Pérdida de Datos**: Toda la información anterior se mantiene
- **Funcionalidad Completa**: Todas las características existentes funcionan

### Backup de Seguridad
- **BACKUP_v1.0.md**: Contiene estado funcional anterior
- **BACKUP_v2.0_2025-08-29.md**: Snapshot completo actual
  - Incluye: appfutbol.html, css/styles.css, js/*.js (storage, utils, ui, app, debug-fixes opcional)
  - Script de exportación: js/backup/generate-backup.js
- **BACKUP_v2.1_2025-08-29.md**: Post-fix UI (eliminación duplicados ui.js, control forzado de visibility en changeScreen)
- **Rollback Posible**: Se puede revertir si es necesario
- **Testing Paralelo**: Nueva versión puede probarse sin riesgo

---

## 📱 Roadmap Actualizado

### Próximas Mejoras (v2.1)
1. **Notificaciones de Grupo**: Avisos cuando hay nuevos partidos
2. **Chat Básico**: Comunicación dentro del grupo  
3. **Calendario**: Programación de partidos
4. **Estadísticas de Grupo**: Métricas colectivas

### Futuras Versiones (v3.0+)
1. **Sincronización Cloud**: Backup en la nube
2. **Aplicación Móvil**: App nativa
3. **Torneos Multi-Grupo**: Competencias entre grupos
4. **Integración Social**: Compartir en redes sociales

---

**Fútbol Stats Stats v2.0**  
*Sistema de Grupos Implementado*  
*Estado: En Desarrollo - Infraestructura Completada* 🔄  
*Próximo: Interfaces de Usuario* ⏳

---

## 🔧 Auditoría de Coherencia (Actualización 2024-12-XX)
Cambios recientes:
- ui.js: Eliminado bloque duplicado tras el cierre del objeto que provocaba errores de ejecución.
- ui.js: Consolidada única versión de showNotification y métodos de mensajes.
- ui.js: Añadido UI.debugCheck() para validar estructura en tiempo de carga.
- Respaldo creado: js/backup/ui.pre-clean-2.js con el fragmento eliminado.

Impacto:
- Se elimina SyntaxError que impedía que init() corra.
- Flujo inicial (person-setup → group-setup) vuelve a funcionar.
- Mayor mantenibilidad y trazabilidad de cambios.

Próximo:
- Retirar debug-fixes.js en build final.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 📞 Contacto y Soporte

Para reportar bugs, sugerir mejoras o hacer preguntas sobre el proyecto, por favor utiliza los canales apropiados de comunicación.

---

**Fútbol Stats Stats v1.0**  
*Última actualización: Diciembre 2024*  
*Estado: Producción - Completamente Funcional* ✅

---

## 🔧 Demo / Seed
Incluido js/seed-demo.js que genera:
- Persona "Tester Admin"
- Grupo "Grupo Demo"
- 10 jugadores aleatorios (atributos 40-95)
Auto-ejecución si faltan jugadores.
Forzar regeneración:
```js
seedDemoData(true);
```
