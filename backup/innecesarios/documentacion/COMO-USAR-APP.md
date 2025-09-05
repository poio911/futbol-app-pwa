# 📱 CÓMO USAR INDEX.HTML

## 🚀 INICIO RÁPIDO

1. **Abre con Live Server:**
   - En VS Code: Click derecho en `index.html` → "Open with Live Server"
   - O abre: http://localhost:5500/index.html

2. **Login con Usuario Real:**
   - Verás una pantalla de login con usuarios existentes
   - Selecciona tu usuario de la lista
   - Luego selecciona el grupo
   - ¡Listo! Ya estás conectado con datos reales

## 📊 PANTALLAS DISPONIBLES

### **1. LOGIN (Automático al inicio)**
- Lista todos los usuarios de Firebase
- Click en cualquier usuario para seleccionarlo
- Opción "Skip Login" para modo demo

### **2. SELECTOR DE GRUPOS**
- Aparece después de seleccionar usuario
- Muestra todos los grupos disponibles
- Click en el grupo para entrar

### **3. DASHBOARD**
- Total de jugadores del grupo
- Total de partidos
- Grupo activo
- Botones de test

### **4. PLAYERS**
- **Add Player** - Formulario simple
- Lista de jugadores con:
  - Nombre
  - Posición
  - OVR
  - Botones Edit/Delete
- **Refresh** - Recargar lista

### **5. MATCHES**
- **Generate Teams** - Genera equipos balanceados
- Muestra Team A y Team B
- Calcula promedio de OVR

### **6. STATS**
- Estadísticas (en desarrollo)

### **7. SETTINGS & DEBUG**
- **User Management:**
  - Create Test User
  - List All Users
- **Group Management:**
  - Create Test Group
  - List All Groups
- **Data Management:**
  - Clear Cache
  - Reload App
- **Firebase Status:**
  - Ver estado de conexión

## 🔍 CONSOLA DE DEBUG

En la parte inferior verás una consola que muestra:
- 🔵 Info (azul) - Operaciones normales
- 🟢 Success (verde) - Operaciones exitosas
- 🔴 Error (rojo) - Errores
- Timestamps de cada operación

## 🎯 FLUJO DE TRABAJO

### **Para Agregar un Jugador:**
1. Login con tu usuario
2. Selecciona tu grupo
3. Ve a "Players"
4. Click "Add Player"
5. Llena el formulario
6. Submit

### **Para Generar Equipos:**
1. Asegúrate de tener jugadores
2. Ve a "Matches"
3. Click "Generate Teams"
4. Verás los equipos generados

### **Para Debug:**
1. Ve a "Settings"
2. Usa los botones de test
3. Revisa la consola de debug
4. Clear cache si hay problemas

## ⚠️ SOLUCIÓN DE PROBLEMAS

### **No aparecen usuarios:**
- Verifica conexión a Firebase en Settings
- Click "Refresh Users" en login
- Revisa la consola de debug

### **No se cargan jugadores:**
- Verifica que seleccionaste un grupo
- Click "Refresh" en Players
- Revisa que Firebase esté conectado

### **Error de Firebase:**
- Ve a Settings
- Revisa "Firebase Status"
- Debe decir "Connected" en verde

### **Datos no se actualizan:**
- Click "Clear Cache" en Settings
- Reload la página
- Vuelve a hacer login

## 🔑 CARACTERÍSTICAS ESPECIALES

1. **Persistencia de Sesión:**
   - La app recuerda tu usuario/grupo
   - No necesitas login cada vez
   - Click "Logout" para cambiar usuario

2. **Modo Demo:**
   - "Skip Login" para probar sin datos reales
   - Útil para testing rápido

3. **Debug Visible:**
   - Toda operación se muestra en consola
   - Errores detallados
   - No necesitas abrir DevTools

4. **Datos Reales:**
   - Conectado a Firebase real
   - Mismos datos que la app principal
   - Cambios se guardan

## 📝 CARACTERÍSTICAS PRINCIPALES

| Característica | Descripción |
|---------------|------------|
| Estilos | Sistema colaborativo funcional |
| Debug | Consola visible en pantalla |
| Login | Sistema de autenticación completo |
| Navegación | Botones superiores claros |
| Funcionalidades | Sistema colaborativo completo |
| Base de datos | Firebase Firestore |

## 🚨 IMPORTANTE

- **index.html** es la app principal
- Los cambios SÍ afectan la base de datos real
- Usa con cuidado las funciones de Delete
- Clear Cache no borra datos de Firebase

---

**Última actualización:** 31 de Agosto 2025  
**Archivo:** index.html  
**Propósito:** Testing y debugging de funcionalidades