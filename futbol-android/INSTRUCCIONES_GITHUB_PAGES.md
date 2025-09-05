# 🌐 CREAR APK CON GITHUB PAGES

## 📤 PASO 1: Subir a GitHub

### 1. Crea repositorio en GitHub:
- Ve a https://github.com
- Crea nuevo repositorio público
- Nombre: `futbol-app-android`

### 2. Sube los archivos:
```bash
cd futbol-android/
git init
git add .
git commit -m "PWA Futbol App para APK"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/futbol-app-android.git
git push -u origin main
```

### 3. Activar GitHub Pages:
- Ve a Settings → Pages
- Source: Deploy from branch
- Branch: main
- Save

### 4. Tu app estará en:
`https://TU_USUARIO.github.io/futbol-app-android/`

---

## 📱 PASO 2: Generar APK

1. **Ve a PWABuilder**: https://www.pwabuilder.com/
2. **Pega tu URL de GitHub Pages**
3. **Click "Build My PWA"**
4. **Selecciona "Android"**
5. **Descarga tu APK**

---

## 🔧 IMPORTANTE: Configurar HTTPS

GitHub Pages usa HTTPS automáticamente, perfecto para PWA.

Tu manifest.json ya está configurado correctamente.