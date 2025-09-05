# 🧪 GUÍA DE TESTING - FC24 TEAM MANAGER
## Manual de Pruebas Paso a Paso
### Versión 2.3.0

---

## 📋 PREPARACIÓN DEL ENTORNO

### Requisitos Previos
1. **Navegador**: Chrome/Firefox/Safari actualizado
2. **Conexión Internet**: Para Firebase y Supabase
3. **Limpiar Datos** (si es necesario):
   ```javascript
   // En consola del navegador
   localStorage.clear();
   sessionStorage.clear();
   // Recargar página
   ```

### Datos de Prueba
- **Nombre Usuario Test**: "Tester QA"
- **Email Test**: "test@fc24.com"
- **Grupo Test**: "Grupo Testing"
- **Código Grupo**: "TEST123"

---

## 🔄 ESCENARIOS DE PRUEBA

## ESCENARIO 1: PRIMER USO COMPLETO

### 1.1 Registro de Nueva Persona
```
PASOS:
1. Abrir aplicación en navegador
2. En Welcome Screen, click en "Nuevo Usuario"
3. Completar formulario:
   - Nombre: "Tester QA"
   - Email: "test@fc24.com"
   - Teléfono: "+1234567890" (opcional)
4. Click en "Continuar"

RESULTADO ESPERADO:
✅ Formulario se valida correctamente
✅ Se navega a pantalla de grupos
✅ No hay errores en consola
✅ Datos se guardan en localStorage

VERIFICACIÓN:
localStorage.getItem('currentPersonId') // Debe existir
```

### 1.2 Crear Nuevo Grupo
```
PASOS:
1. En Group Setup, seleccionar "Crear Nuevo Grupo"
2. Completar:
   - Nombre: "Grupo Testing"
   - Descripción: "Grupo para pruebas"
   - Horario: "Lunes 20:00"
3. Click en "Crear Grupo"

RESULTADO ESPERADO:
✅ Grupo se crea con código único
✅ Se muestra código del grupo
✅ Se navega al Dashboard
✅ Dashboard muestra nombre del grupo

VERIFICACIÓN:
Storage.getCurrentGroup() // Debe retornar el grupo creado
```

### 1.3 Agregar Primer Jugador
```
PASOS:
1. Desde Dashboard, click en "Agregar Jugador"
2. Completar formulario:
   - Nombre: "Lionel Messi"
   - Posición: DEL
   - Foto: Subir una imagen (opcional)
   - Atributos: PAC:85, SHO:94, PAS:91, DRI:95, DEF:35, PHY:65
3. Click en "Guardar Jugador"

RESULTADO ESPERADO:
✅ OVR se calcula automáticamente (75)
✅ Foto se muestra en preview
✅ Jugador se guarda correctamente
✅ Notificación de éxito aparece
✅ Formulario se limpia

VERIFICACIÓN:
Storage.getPlayers() // Debe contener el jugador
```

---

## ESCENARIO 2: GESTIÓN DE JUGADORES

### 2.1 Agregar 10 Jugadores Más
```
JUGADORES DE PRUEBA:
1. Cristiano Ronaldo - DEL - OVR 83
2. Neymar Jr - DEL - OVR 82
3. Kevin De Bruyne - MED - OVR 85
4. Luka Modric - MED - OVR 84
5. Virgil van Dijk - DEF - OVR 86
6. Sergio Ramos - DEF - OVR 83
7. Alisson Becker - POR - OVR 85
8. Kylian Mbappé - DEL - OVR 86
9. Robert Lewandowski - DEL - OVR 85
10. Mohamed Salah - DEL - OVR 84

RESULTADO ESPERADO:
✅ Todos los jugadores se guardan
✅ Lista muestra 11 jugadores total
✅ Búsqueda funciona correctamente
✅ Filtros por posición funcionan
```

### 2.2 Editar Jugador
```
PASOS:
1. Ir a lista de jugadores
2. Click en "Editar" (lápiz)
3. Buscar "Messi"
4. Click en card de Messi
5. Cambiar OVR a 90
6. Guardar cambios

RESULTADO ESPERADO:
✅ Modo edición se activa
✅ Formulario se llena con datos actuales
✅ Cambios se guardan
✅ Card se actualiza inmediatamente
```

### 2.3 Eliminar Jugador
```
PASOS:
1. Activar modo edición
2. Click en X de un jugador
3. Confirmar eliminación

RESULTADO ESPERADO:
✅ Confirmación aparece
✅ Jugador se elimina
✅ Lista se actualiza
✅ No aparece en Firebase
```

---

## ESCENARIO 3: CREACIÓN DE PARTIDO

### 3.1 Generar Equipos Balanceados
```
PASOS:
1. Ir a "Crear Partido"
2. Seleccionar formato 5v5
3. Seleccionar 10 jugadores
4. Click en "Generar Equipos"

RESULTADO ESPERADO:
✅ Equipos se generan con 5 jugadores cada uno
✅ Diferencia de OVR < 3 puntos
✅ Se muestran ambos equipos
✅ Botón "Programar Partido" aparece

VERIFICACIÓN:
- Equipo A OVR ≈ Equipo B OVR
- No hay jugadores repetidos
```

### 3.2 Programar Partido
```
PASOS:
1. Con equipos generados, click en "Programar Partido"
2. Confirmar programación

RESULTADO ESPERADO:
✅ Partido se guarda en Firebase
✅ Notificación de éxito
✅ Navegación a pantalla de evaluación
✅ Partido aparece en Dashboard

VERIFICACIÓN:
Storage.getMatches() // Debe contener el partido
```

---

## ESCENARIO 4: EVALUACIÓN DE PARTIDO

### 4.1 Evaluar Partido Completo
```
PASOS:
1. Ir a "Evaluar"
2. Seleccionar partido pendiente
3. Ingresar marcador: Equipo A: 3, Equipo B: 2
4. Para cada jugador:
   - Seleccionar 2-3 tags de rendimiento
   - Asignar calificación (1-10)
5. Click en "Guardar Evaluación"

RESULTADO ESPERADO:
✅ Todos los jugadores son visibles
✅ Tags se seleccionan correctamente
✅ Calificaciones se guardan
✅ Estadísticas se actualizan
✅ Partido cambia a estado "evaluado"

VERIFICACIÓN:
- El partido no aparece más en pendientes
- Stats de jugadores actualizadas
```

---

## ESCENARIO 5: VISUALIZACIÓN DE ESTADÍSTICAS

### 5.1 Dashboard Actualizado
```
VERIFICAR:
✅ Próximo partido (si hay)
✅ Últimos 3 partidos con resultados
✅ Top 5 jugadores por rendimiento
✅ Estadísticas correctas:
   - Total jugadores
   - Total partidos
   - OVR promedio
   - % Victorias
```

### 5.2 Ranking de Jugadores
```
PASOS:
1. Ir a "Estadísticas"
2. Verificar tabla de ranking

RESULTADO ESPERADO:
✅ Jugadores ordenados por OVR
✅ Partidos jugados correcto
✅ Goles/Asistencias visibles
✅ Calificación promedio correcta
```

---

## ESCENARIO 6: USUARIO RECURRENTE

### 6.1 Logout y Login
```
PASOS:
1. Click en menú de usuario
2. Seleccionar "Cerrar Sesión"
3. Confirmar logout
4. En welcome, seleccionar usuario existente
5. Seleccionar grupo

RESULTADO ESPERADO:
✅ Sesión se cierra correctamente
✅ Navegación a welcome screen
✅ Usuario aparece en lista
✅ Grupos del usuario se muestran
✅ Login exitoso
✅ Datos persisten
```

### 6.2 Cambio de Grupo
```
PASOS:
1. Click en menú de usuario
2. Seleccionar "Cambiar Grupo"
3. Seleccionar otro grupo o crear nuevo

RESULTADO ESPERADO:
✅ Lista de grupos disponibles
✅ Cambio de contexto funciona
✅ Dashboard se actualiza
✅ Jugadores del nuevo grupo se muestran
```

---

## ESCENARIO 7: CASOS EDGE Y ERRORES

### 7.1 Formularios Vacíos
```
PRUEBAS:
1. Intentar guardar jugador sin nombre
2. Intentar crear grupo sin nombre
3. Intentar evaluar sin marcador

RESULTADO ESPERADO:
✅ Validación previene envío
✅ Mensaje de error claro
✅ Focus en campo con error
```

### 7.2 Datos Duplicados
```
PRUEBAS:
1. Intentar crear jugador con nombre existente
2. Intentar crear grupo con nombre existente

RESULTADO ESPERADO:
✅ Validación detecta duplicado
✅ Mensaje explicativo
✅ No se guardan datos duplicados
```

### 7.3 Sin Conexión
```
PASOS:
1. Desconectar internet
2. Intentar varias acciones
3. Reconectar

RESULTADO ESPERADO:
✅ App funciona parcialmente offline
✅ Datos en cache se muestran
✅ Mensajes de error apropiados
✅ Sincronización al reconectar
```

---

## 📱 PRUEBAS RESPONSIVE

### Mobile (iPhone/Android)
```
VERIFICAR EN CADA PANTALLA:
✅ Elementos no se superponen
✅ Texto es legible
✅ Botones son tocables (min 44px)
✅ Formularios usables
✅ Scroll funciona correctamente
✅ Menús y modales accesibles
```

### Tablet (iPad/Android Tablet)
```
VERIFICAR:
✅ Layout se adapta correctamente
✅ Grids mantienen proporciones
✅ Imágenes no se distorsionan
✅ Navegación funcional
```

### Desktop (Diferentes resoluciones)
```
RESOLUCIONES A PROBAR:
- 1920x1080 (Full HD)
- 1366x768 (HD)
- 2560x1440 (2K)

VERIFICAR:
✅ Contenido centrado
✅ Márgenes apropiados
✅ No hay espacios vacíos excesivos
```

---

## 🔧 PRUEBAS DE RENDIMIENTO

### Tiempo de Carga
```
MÉTRICAS OBJETIVO:
- Primera carga: < 3 segundos
- Navegación entre pantallas: < 500ms
- Guardado de datos: < 1 segundo
- Generación de equipos: < 2 segundos
```

### Manejo de Datos
```
PRUEBAS DE VOLUMEN:
1. Agregar 50+ jugadores
2. Crear 20+ partidos
3. Evaluar 15+ partidos

VERIFICAR:
✅ App sigue respondiendo
✅ Búsquedas siguen rápidas
✅ No hay memory leaks
✅ LocalStorage no se llena
```

---

## 🐛 REGISTRO DE ISSUES

### Template para Reportar Bugs
```markdown
## BUG-[NÚMERO]
**Fecha**: DD/MM/YYYY
**Severidad**: Crítico/Alto/Medio/Bajo
**Pantalla**: [Nombre de pantalla]

**Descripción**:
[Descripción clara del problema]

**Pasos para Reproducir**:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Actual**:
[Lo que sucede]

**Resultado Esperado**:
[Lo que debería suceder]

**Screenshots/Videos**:
[Si aplica]

**Información Adicional**:
- Navegador: [Chrome/Firefox/Safari]
- Dispositivo: [Desktop/Mobile/Tablet]
- Consola: [Errores si hay]
```

---

## ✅ CHECKLIST FINAL PRE-PRODUCCIÓN

### Funcionalidad Core
- [ ] Registro y login funcionan
- [ ] CRUD de jugadores completo
- [ ] Generación de equipos balancea correctamente
- [ ] Evaluación actualiza estadísticas
- [ ] Dashboard muestra datos correctos

### Calidad
- [ ] Sin errores en consola
- [ ] Validaciones funcionan
- [ ] Mensajes de error claros
- [ ] Feedback visual presente
- [ ] Performance aceptable

### Compatibilidad
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile responsive ✅

### Datos
- [ ] Persistencia funciona
- [ ] Firebase sincroniza
- [ ] Supabase almacena imágenes
- [ ] No hay pérdida de datos

### UX/UI
- [ ] Navegación intuitiva
- [ ] Diseño consistente
- [ ] Animaciones suaves
- [ ] Estados de carga visibles
- [ ] Accesibilidad básica

---

## 📊 MÉTRICAS DE CALIDAD

### KPIs a Monitorear
1. **Errores por sesión**: < 1
2. **Tiempo de carga inicial**: < 3s
3. **Tasa de completitud de flujos**: > 90%
4. **Satisfacción de usuario**: > 4/5

### Herramientas Recomendadas
- **Lighthouse**: Para performance y accesibilidad
- **Chrome DevTools**: Para debugging y network
- **BrowserStack**: Para testing cross-browser
- **Sentry**: Para error tracking en producción

---

*Documento de Testing v1.0*  
*Última actualización: 30/08/2025*