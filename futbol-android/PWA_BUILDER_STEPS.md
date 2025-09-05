# 📱 CREAR APK CON PWABUILDER (MICROSOFT)

## 🌐 PASO 1: Subir tu PWA a internet

### **GitHub Pages (GRATIS y FÁCIL)**:

1. **Crea cuenta en GitHub** (si no tienes):
   - Ve a https://github.com
   - Sign up gratis

2. **Crear repositorio**:
   - Click "New repository"
   - Nombre: `futbol-app-pwa`
   - ✅ Public
   - ✅ Add README
   - Create repository

3. **Subir archivos**:
   - Click "uploading an existing file"
   - Arrastra TODA la carpeta `futbol-android`
   - Commit changes

4. **Activar GitHub Pages**:
   - Ve a Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: main
   - Save

5. **Tu URL será**:
   `https://TU_USUARIO.github.io/futbol-app-pwa/`

---

## 🏗️ PASO 2: Generar APK con PWABuilder

1. **Ve a**: https://www.pwabuilder.com/
2. **Pega tu URL de GitHub Pages**
3. **Click "Start"**
4. **PWABuilder analiza tu app automáticamente**
5. **Click "Build My PWA"**
6. **Selecciona "Android"**
7. **Download APK**

---

## ⚡ ALTERNATIVA MÁS RÁPIDA: Netlify

### **Si quieres algo más inmediato**:

1. **Ve a**: https://app.netlify.com/
2. **Arrastra la carpeta `futbol-android` completa**
3. **Netlify la sube automáticamente**
4. **Te da una URL como**: `https://amazing-name-123.netlify.app`
5. **Usa esa URL en PWABuilder**

---

## 🔧 VERIFICAR QUE ESTÁ LISTO

### **Tu PWA debe tener** (YA LO TIENES):
- ✅ `manifest.json`
- ✅ `sw.js` (Service Worker)
- ✅ Meta tags móviles
- ✅ HTTPS (GitHub Pages lo da gratis)

---

## 📱 RESULTADO FINAL

PWABuilder te generará:
- **APK nativa para Android**
- **Lista para instalar**
- **Funciona offline**
- **Ícono en menú de apps**
- **Pantalla completa**