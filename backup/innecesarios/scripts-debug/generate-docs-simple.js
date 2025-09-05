/**
 * Generador de documentación simplificado y robusto
 * Se enfoca en capturar pantallas y navegación básica sin depender tanto de Firebase
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class SimpleDocumentationGenerator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:5500';
        this.docs = {
            title: 'App.futbol - Documentación Completa Visual',
            timestamp: new Date().toISOString(),
            sections: []
        };
        this.screenshotsDir = './docs/screenshots';
    }

    async init() {
        // Crear directorios
        if (!fs.existsSync('./docs')) {
            fs.mkdirSync('./docs');
        }
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir);
        }

        // Inicializar browser
        this.browser = await chromium.launch({ 
            headless: false, 
            slowMo: 2000,
            timeout: 60000
        });
        this.page = await this.browser.newPage();
        await this.page.setViewportSize({ width: 1920, height: 1080 });
    }

    async documentPage(name, url, interactions = []) {
        console.log(`📖 Documentando: ${name}`);
        
        const section = {
            name: name,
            url: url,
            screenshots: [],
            interactions: [],
            timestamp: new Date().toISOString()
        };

        try {
            // Navegar con timeout más largo
            await this.page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            
            // Espera adicional para que cargue
            await this.page.waitForTimeout(5000);

            // Screenshot inicial
            const initialScreenshot = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-inicial.png`;
            await this.page.screenshot({ 
                path: path.join(this.screenshotsDir, initialScreenshot),
                fullPage: true 
            });
            section.screenshots.push({
                name: 'Vista inicial',
                file: initialScreenshot,
                description: `Vista inicial de ${name}`
            });

            // Ejecutar interacciones
            for (let i = 0; i < interactions.length; i++) {
                const interaction = interactions[i];
                console.log(`  💫 Ejecutando: ${interaction.name}`);
                
                try {
                    await this.executeInteraction(interaction);
                    await this.page.waitForTimeout(3000);

                    // Screenshot después de la interacción
                    const screenshotName = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${i + 1}-${interaction.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
                    await this.page.screenshot({ 
                        path: path.join(this.screenshotsDir, screenshotName),
                        fullPage: true 
                    });

                    section.interactions.push({
                        name: interaction.name,
                        description: interaction.description,
                        screenshot: screenshotName,
                        success: true
                    });

                } catch (error) {
                    console.log(`  ❌ Error en interacción: ${error.message}`);
                    section.interactions.push({
                        name: interaction.name,
                        description: interaction.description,
                        error: error.message,
                        success: false
                    });
                }
            }

        } catch (error) {
            console.log(`❌ Error documentando ${name}: ${error.message}`);
            section.error = error.message;
        }

        this.docs.sections.push(section);
        return section;
    }

    async executeInteraction(interaction) {
        switch (interaction.type) {
            case 'click':
                if (interaction.waitForSelector) {
                    await this.page.waitForSelector(interaction.selector, { timeout: 10000 });
                }
                await this.page.click(interaction.selector);
                break;
            case 'fill':
                await this.page.fill(interaction.selector, interaction.value);
                break;
            case 'wait':
                await this.page.waitForTimeout(interaction.duration || 3000);
                break;
            case 'scroll':
                await this.page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight / 2);
                });
                break;
            case 'hover':
                await this.page.hover(interaction.selector);
                break;
            default:
                throw new Error(`Tipo de interacción no soportado: ${interaction.type}`);
        }
    }

    async generateDocumentation() {
        console.log('🚀 Iniciando generación de documentación visual...');
        
        await this.init();

        try {
            // 1. App Principal - Pantalla inicial
            await this.documentPage(
                'App Principal - Pantalla de Inicio',
                `${this.baseUrl}/index.html`,
                [
                    {
                        type: 'wait',
                        name: 'Carga inicial completa',
                        description: 'Esperar que la aplicación cargue completamente',
                        duration: 5000
                    },
                    {
                        type: 'scroll',
                        name: 'Scroll para mostrar contenido',
                        description: 'Hacer scroll para mostrar más contenido de la pantalla'
                    }
                ]
            );

            // 2. App Principal - Navegación por pestañas
            await this.documentPage(
                'App Principal - Navegación completa',
                `${this.baseUrl}/index.html`,
                [
                    {
                        type: 'wait',
                        duration: 3000
                    },
                    {
                        type: 'click',
                        name: 'Navegar a Jugadores',
                        description: 'Clic en la pestaña de Jugadores',
                        selector: '.nav-btn[onclick*="players"], button[onclick*="players"], [data-screen="players"]',
                        waitForSelector: false
                    },
                    {
                        type: 'click',
                        name: 'Navegar a Partidos',
                        description: 'Clic en la pestaña de Partidos',
                        selector: '.nav-btn[onclick*="match"], button[onclick*="match"], [data-screen="match"]',
                        waitForSelector: false
                    },
                    {
                        type: 'click',
                        name: 'Navegar a Evaluaciones',
                        description: 'Clic en la pestaña de Evaluaciones',
                        selector: '.nav-btn[onclick*="evaluate"], button[onclick*="evaluate"], [data-screen="evaluate"]',
                        waitForSelector: false
                    },
                    {
                        type: 'click',
                        name: 'Navegar a Historial',
                        description: 'Clic en la pestaña de Historial',
                        selector: '.nav-btn[onclick*="history"], button[onclick*="history"], [data-screen="history"]',
                        waitForSelector: false
                    }
                ]
            );

            // 3. CPanel - Dashboard
            await this.documentPage(
                'CPanel - Panel de Control',
                `${this.baseUrl}/cpanel.html`,
                [
                    {
                        type: 'wait',
                        name: 'Carga del CPanel',
                        description: 'Esperar que el CPanel cargue completamente',
                        duration: 8000
                    },
                    {
                        type: 'scroll',
                        name: 'Mostrar dashboard completo',
                        description: 'Scroll para mostrar todas las estadísticas del dashboard'
                    }
                ]
            );

            // 4. CPanel - Navegación por pestañas
            await this.documentPage(
                'CPanel - Gestión de Datos',
                `${this.baseUrl}/cpanel.html`,
                [
                    {
                        type: 'wait',
                        duration: 5000
                    },
                    {
                        type: 'click',
                        name: 'Pestaña Jugadores',
                        description: 'Navegar a gestión de jugadores',
                        selector: '.tab-button[onclick*="players"], button[onclick*="switchTab(\'players\')"]',
                        waitForSelector: false
                    },
                    {
                        type: 'wait',
                        duration: 2000
                    },
                    {
                        type: 'click',
                        name: 'Pestaña Partidos',
                        description: 'Navegar a gestión de partidos',
                        selector: '.tab-button[onclick*="matches"], button[onclick*="switchTab(\'matches\')"]',
                        waitForSelector: false
                    },
                    {
                        type: 'wait',
                        duration: 2000
                    },
                    {
                        type: 'click',
                        name: 'Pestaña Evaluaciones',
                        description: 'Navegar a gestión de evaluaciones',
                        selector: '.tab-button[onclick*="evaluations"], button[onclick*="switchTab(\'evaluations\')"]',
                        waitForSelector: false
                    },
                    {
                        type: 'wait',
                        duration: 2000
                    },
                    {
                        type: 'click',
                        name: 'Pestaña Limpieza',
                        description: 'Navegar a herramientas de limpieza',
                        selector: '.tab-button[onclick*="cleanup"], button[onclick*="switchTab(\'cleanup\')"]',
                        waitForSelector: false
                    }
                ]
            );

            // 5. Admin Panel
            await this.documentPage(
                'Admin Panel - Administración',
                `${this.baseUrl}/admin.html`,
                [
                    {
                        type: 'wait',
                        name: 'Carga del Admin Panel',
                        description: 'Esperar que el admin panel cargue',
                        duration: 5000
                    },
                    {
                        type: 'scroll',
                        name: 'Explorar panel completo',
                        description: 'Mostrar todas las opciones administrativas'
                    }
                ]
            );

            // 6. Documentar páginas adicionales si existen
            const additionalPages = [
                { name: 'Página de Configuración', url: '/config.html' },
                { name: 'Página de Ayuda', url: '/help.html' },
                { name: 'Página de Login', url: '/login.html' }
            ];

            for (const page of additionalPages) {
                try {
                    await this.documentPage(
                        page.name,
                        `${this.baseUrl}${page.url}`,
                        [
                            {
                                type: 'wait',
                                name: 'Carga de página',
                                description: `Cargar ${page.name}`,
                                duration: 3000
                            }
                        ]
                    );
                } catch (error) {
                    console.log(`⚠️ Página ${page.name} no disponible: ${error.message}`);
                }
            }

            // Generar reportes
            await this.generateHTMLReport();
            await this.generateMarkdownReport();

            console.log('✅ Documentación visual generada exitosamente!');

        } catch (error) {
            console.error('❌ Error general:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async generateHTMLReport() {
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.docs.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.95);
            color: #2c3e50;
            padding: 3rem 2rem;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .section {
            background: rgba(255,255,255,0.95);
            margin-bottom: 3rem;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .section-header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 2rem;
        }
        .section-header h2 {
            font-size: 1.8rem;
        }
        .section-content {
            padding: 2rem;
        }
        .screenshot {
            width: 100%;
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            margin: 2rem 0;
            transition: transform 0.3s ease;
        }
        .screenshot:hover {
            transform: scale(1.02);
        }
        .interaction {
            background: #f8f9fa;
            padding: 2rem;
            margin: 2rem 0;
            border-left: 5px solid #667eea;
            border-radius: 0 10px 10px 0;
        }
        .interaction.success {
            border-left-color: #27ae60;
            background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(39, 174, 96, 0.05));
        }
        .interaction.error {
            border-left-color: #e74c3c;
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.05));
        }
        .toc {
            background: rgba(255,255,255,0.95);
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .toc h2 {
            color: #2c3e50;
            margin-bottom: 1rem;
        }
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        .toc li {
            margin: 0.8rem 0;
            padding: 0.5rem;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .toc li:hover {
            background: rgba(102, 126, 234, 0.2);
            transform: translateX(10px);
        }
        .toc a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .stat-card {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(102, 126, 234, 0.2);
        }
        .stat-card h3 {
            font-size: 2.5rem;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            .header h1 {
                font-size: 2rem;
            }
            .header {
                padding: 2rem 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 ${this.docs.title}</h1>
            <p>📅 Documentación automática generada el ${new Date(this.docs.timestamp).toLocaleString()}</p>
            <p>🌐 Base URL: <strong>${this.baseUrl}</strong></p>
        </div>

        <div class="toc">
            <h2>📑 Índice de Contenidos</h2>
            <ul>
                ${this.docs.sections.map((section, index) => `
                    <li><a href="#section-${index}">📄 ${section.name}</a></li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📊 Resumen Ejecutivo</h2>
            </div>
            <div class="section-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${this.docs.sections.length}</h3>
                        <p>Páginas Documentadas</p>
                    </div>
                    <div class="stat-card">
                        <h3>${this.docs.sections.reduce((acc, section) => acc + section.screenshots.length, 0)}</h3>
                        <p>Screenshots Capturadas</p>
                    </div>
                    <div class="stat-card">
                        <h3>${this.docs.sections.reduce((acc, section) => acc + section.interactions.length, 0)}</h3>
                        <p>Interacciones Probadas</p>
                    </div>
                    <div class="stat-card">
                        <h3>${this.docs.sections.filter(s => !s.error).length}</h3>
                        <p>Páginas Exitosas</p>
                    </div>
                </div>
            </div>
        </div>

        ${this.docs.sections.map((section, index) => `
            <div class="section" id="section-${index}">
                <div class="section-header">
                    <h2>${section.name}</h2>
                </div>
                <div class="section-content">
                    <p><strong>🔗 URL:</strong> <code>${section.url}</code></p>
                    <p><strong>⏱️ Documentado:</strong> ${new Date(section.timestamp).toLocaleString()}</p>
                    
                    ${section.screenshots.map(screenshot => `
                        <div>
                            <h3>📸 ${screenshot.name}</h3>
                            <p>${screenshot.description}</p>
                            <img src="screenshots/${screenshot.file}" alt="${screenshot.name}" class="screenshot">
                        </div>
                    `).join('')}

                    ${section.interactions.length > 0 ? `
                        <h3>💫 Interacciones Documentadas</h3>
                        ${section.interactions.map(interaction => `
                            <div class="interaction ${interaction.success ? 'success' : 'error'}">
                                <h4>${interaction.name} ${interaction.success ? '✅' : '❌'}</h4>
                                <p>${interaction.description}</p>
                                ${interaction.error ? `<p><strong>❌ Error:</strong> <code>${interaction.error}</code></p>` : ''}
                                ${interaction.screenshot ? `
                                    <img src="screenshots/${interaction.screenshot}" alt="${interaction.name}" class="screenshot">
                                ` : ''}
                            </div>
                        `).join('')}
                    ` : ''}

                    ${section.error ? `
                        <div class="interaction error">
                            <h4>❌ Error de Página</h4>
                            <p><strong>Error:</strong> <code>${section.error}</code></p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;

        fs.writeFileSync('./docs/documentacion-visual-completa.html', htmlContent);
        console.log('📄 Reporte HTML mejorado generado: docs/documentacion-visual-completa.html');
    }

    async generateMarkdownReport() {
        let markdown = `# ${this.docs.title}\n\n`;
        markdown += `*Documentación automática generada el ${new Date(this.docs.timestamp).toLocaleString()}*\n\n`;
        markdown += `**Base URL:** ${this.baseUrl}\n\n`;
        
        // Resumen
        markdown += `## 📊 Resumen Ejecutivo\n\n`;
        markdown += `- **Páginas documentadas:** ${this.docs.sections.length}\n`;
        markdown += `- **Screenshots capturadas:** ${this.docs.sections.reduce((acc, section) => acc + section.screenshots.length, 0)}\n`;
        markdown += `- **Interacciones probadas:** ${this.docs.sections.reduce((acc, section) => acc + section.interactions.length, 0)}\n`;
        markdown += `- **Páginas exitosas:** ${this.docs.sections.filter(s => !s.error).length}\n\n`;
        
        // Índice
        markdown += `## 📑 Índice de Contenidos\n\n`;
        this.docs.sections.forEach((section, index) => {
            markdown += `- [${section.name}](#${section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})\n`;
        });
        markdown += `\n`;

        // Secciones
        this.docs.sections.forEach(section => {
            markdown += `## ${section.name}\n\n`;
            markdown += `**URL:** \`${section.url}\`\n`;
            markdown += `**Documentado:** ${new Date(section.timestamp).toLocaleString()}\n\n`;
            
            section.screenshots.forEach(screenshot => {
                markdown += `### 📸 ${screenshot.name}\n\n`;
                markdown += `${screenshot.description}\n\n`;
                markdown += `![${screenshot.name}](screenshots/${screenshot.file})\n\n`;
            });

            if (section.interactions.length > 0) {
                markdown += `### 💫 Interacciones Documentadas\n\n`;
                section.interactions.forEach(interaction => {
                    markdown += `#### ${interaction.name} ${interaction.success ? '✅' : '❌'}\n\n`;
                    markdown += `${interaction.description}\n\n`;
                    if (interaction.error) {
                        markdown += `**Error:** \`${interaction.error}\`\n\n`;
                    }
                    if (interaction.screenshot) {
                        markdown += `![${interaction.name}](screenshots/${interaction.screenshot})\n\n`;
                    }
                });
            }

            if (section.error) {
                markdown += `**Error de Página:** \`${section.error}\`\n\n`;
            }

            markdown += `---\n\n`;
        });

        fs.writeFileSync('./docs/documentacion-visual-completa.md', markdown);
        console.log('📝 Reporte Markdown mejorado generado: docs/documentacion-visual-completa.md');
    }
}

module.exports = SimpleDocumentationGenerator;

// Ejecutar si es llamado directamente
if (require.main === module) {
    const generator = new SimpleDocumentationGenerator();
    generator.generateDocumentation().catch(console.error);
}