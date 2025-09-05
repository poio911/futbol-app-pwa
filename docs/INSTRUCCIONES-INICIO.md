# 🚀 CÓMO INICIAR LA APLICACIÓN

## ⚠️ IMPORTANTE: NO ABRAS index.html DIRECTAMENTE
La aplicación necesita un servidor web local para funcionar correctamente debido a las políticas de seguridad CORS del navegador.

## 📋 OPCIONES PARA INICIAR LA APLICACIÓN

### Opción 1: Usando el Script Automático (RECOMENDADO)

#### En Windows:
1. Haz doble clic en `start-server.bat`
2. Se abrirá una ventana de comandos con el servidor
3. Abre tu navegador y ve a: **http://localhost:8080**
4. Para detener: Cierra la ventana o presiona Ctrl+C

#### En Mac/Linux:
1. Abre una terminal en la carpeta del proyecto
2. Ejecuta: `./start-server.sh`
3. Abre tu navegador y ve a: **http://localhost:8080**
4. Para detener: Presiona Ctrl+C en la terminal

### Opción 2: Comando Manual

#### Si tienes Python instalado:
```bash
# En Windows
python -m http.server 8080

# En Mac/Linux
python3 -m http.server 8080
```

Luego abre: **http://localhost:8080**

### Opción 3: Usando Node.js

Si tienes Node.js instalado:
```bash
# Instalar http-server globalmente (solo la primera vez)
npm install -g http-server

# Iniciar el servidor
http-server -p 8080
```

### Opción 4: Usando Live Server en VS Code

Si usas Visual Studio Code:
1. Instala la extensión "Live Server"
2. Haz clic derecho en `index.html`
3. Selecciona "Open with Live Server"

## 🔍 VERIFICACIÓN

Una vez iniciado el servidor:
1. Abre **http://localhost:8080** en tu navegador
2. Deberías ver la pantalla de bienvenida de la aplicación
3. Verifica la consola del navegador (F12) para ver si hay errores

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "Python no está instalado"
- **Windows**: Descarga Python desde https://www.python.org/downloads/
- **Mac**: Ejecuta `brew install python3`
- **Linux**: Ejecuta `sudo apt-get install python3`

### Error: "CORS policy"
- NO abras el archivo directamente (file:///)
- USA un servidor local como se indica arriba

### La página no carga
1. Verifica que el servidor esté funcionando
2. Intenta con otro puerto: `python -m http.server 8081`
3. Revisa la consola del navegador para errores

### Error de Firebase
- Verifica tu conexión a internet
- Los scripts de Firebase necesitan conexión para cargar

## 📱 ACCESO DESDE DISPOSITIVOS MÓVILES

Para probar en tu teléfono:
1. Asegúrate de que tu PC y teléfono estén en la misma red WiFi
2. Encuentra tu IP local:
   - Windows: `ipconfig` (busca IPv4 Address)
   - Mac/Linux: `ifconfig` o `ip addr`
3. En tu teléfono, abre: `http://[TU-IP]:8080`
   - Ejemplo: `http://192.168.1.100:8080`

## ✅ TODO LISTO

Si el servidor está funcionando correctamente:
- La aplicación se cargará sin errores CORS
- Firebase se conectará correctamente
- Podrás navegar entre todas las pantallas
- Los estilos se verán correctamente

---

**Nota:** Siempre usa un servidor local para desarrollo web. Abrir archivos HTML directamente puede causar problemas de seguridad y funcionalidad.