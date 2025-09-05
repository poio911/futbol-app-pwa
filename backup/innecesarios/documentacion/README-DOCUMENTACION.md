# 📖 Generación Automática de Documentación

## 🎯 Descripción

Este proyecto incluye un sistema automático de documentación usando **Playwright** que navega por toda la aplicación, captura screenshots y genera documentación completa en formato HTML y Markdown.

## 📋 Características

- ✅ **Documentación automática** de todas las pantallas
- ✅ **Screenshots en alta calidad** de cada funcionalidad
- ✅ **Interacciones documentadas** paso a paso
- ✅ **Reportes en HTML y Markdown**
- ✅ **Navegación automática** por toda la aplicación
- ✅ **Detección de errores** y problemas

## 🚀 Cómo ejecutar

### Prerequisitos

1. **Servidor ejecutándose:**
   ```bash
   npm run serve
   # O tu método preferido para ejecutar en http://localhost:3000
   ```

2. **Firebase configurado** y funcional
3. **Aplicación sin modales abiertos** (cerrar cualquier popup antes de ejecutar)

### Generar documentación

```bash
# Método recomendado
npm run docs

# O directamente
node docs-script.js
```

## 📊 Lo que se documenta

### 🎮 App Principal (`test-app.html`)
- **Pantalla de inicio** - Vista general y navegación
- **Gestión de Jugadores** - Crear, editar, visualizar jugadores
- **Gestión de Partidos** - Crear partidos manuales y configurar equipos
- **Sistema de Evaluaciones** - Evaluar jugadores post-partido
- **Historial de Partidos** - Ver estadísticas y resultados anteriores

### ⚙️ CPanel (`cpanel.html`)
- **Dashboard administrativo** - Vista general del sistema
- **Gestión de Jugadores** - Administración completa de usuarios
- **Gestión de Partidos** - Ver, eliminar, gestionar partidos
- **Gestión de Evaluaciones** - Administrar sistema de evaluaciones
- **Herramientas de Limpieza** - Limpiar datos de prueba y duplicados

### 🛠️ Admin Panel (`admin.html`)
- **Panel de administración** - Funcionalidades administrativas generales

## 📁 Archivos generados

```
docs/
├── documentacion-completa.html    # Reporte visual completo
├── documentacion-completa.md      # Documentación en Markdown
└── screenshots/                   # Todas las capturas de pantalla
    ├── app-principal-inicio-inicial.png
    ├── cpanel-dashboard-inicial.png
    └── ... (más capturas por cada interacción)
```

## 🎨 Características del reporte HTML

- **Diseño responsivo** y profesional
- **Índice de contenidos** navegable
- **Screenshots en alta resolución**
- **Indicadores de éxito/error** para cada interacción
- **Metadatos completos** de cada sección
- **Timestamps** de generación

## ⚡ Opciones avanzadas

### Personalizar la documentación

Edita `generate-docs.js` para:
- Agregar nuevas secciones
- Modificar interacciones
- Cambiar selectores CSS
- Personalizar el diseño del reporte

### Configuraciones disponibles

```javascript
// En generate-docs.js
this.browser = await chromium.launch({ 
    headless: false,  // Ver el proceso en vivo
    slowMo: 1000     // Velocidad de interacciones
});

await this.page.setViewportSize({ 
    width: 1920, 
    height: 1080 
});
```

## 🐛 Troubleshooting

### Error: "Cannot connect to localhost:3000"
- Verifica que el servidor esté ejecutándose
- Prueba acceder manualmente a `http://localhost:5500/index.html`

### Screenshots borrosas o incompletas
- Aumenta los tiempos de espera en las interacciones
- Verifica que no hay modales abiertos al inicio

### Firebase errors durante la documentación
- Asegúrate que Firebase esté configurado correctamente
- Verifica que hay datos de prueba en la base de datos

### Selectores CSS no encontrados
- Los selectores pueden cambiar si modificas el HTML
- Actualiza los selectores en `generate-docs.js`

## 🔄 Automatización CI/CD

Puedes integrar la generación de documentación en tu pipeline:

```yaml
# GitHub Actions ejemplo
- name: Generate Documentation
  run: |
    npm run serve &
    sleep 10
    npm run docs
    
- name: Deploy Docs
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./docs
```

## 📝 Próximas mejoras

- [ ] Documentación de APIs de Firebase
- [ ] Tests de rendimiento integrados
- [ ] Comparación visual entre versiones
- [ ] Documentación multiidioma
- [ ] Exportar a PDF

## 🤝 Contribuir

Para agregar nuevas secciones de documentación:

1. Edita `documentAppPrincipal()`, `documentCPanel()` o `documentAdminPanel()`
2. Usa `await this.documentSection()` con las interacciones deseadas
3. Ejecuta `npm run docs` para probar

¡La documentación se genera automáticamente! 🎉