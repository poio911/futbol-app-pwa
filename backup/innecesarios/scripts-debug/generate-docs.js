/**
 * Generador automático de documentación con Playwright
 * Navega por toda la aplicación y genera documentación completa
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class DocumentationGenerator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.docs = {
            title: 'App.futbol - Documentación Completa',
            timestamp: new Date().toISOString(),
            sections: []
        };
        this.screenshotsDir = './docs/screenshots';
    }

    async init() {
        // Crear directorio para screenshots
        if (!fs.existsSync('./docs')) {
            fs.mkdirSync('./docs');
        }
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir);
        }

        // Inicializar browser
        this.browser = await chromium.launch({ headless: false, slowMo: 1000 });
        this.page = await this.browser.newPage();
        await this.page.setViewportSize({ width: 1920, height: 1080 });
    }

    async documentSection(sectionName, description, url, interactions = []) {
        console.log(`📖 Documentando: ${sectionName}`);
        
        const section = {
            name: sectionName,
            description: description,
            url: url,
            screenshots: [],
            interactions: [],
            timestamp: new Date().toISOString()
        };

        try {
            // Navegar a la página
            await this.page.goto(url, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);

            // Screenshot inicial
            const initialScreenshot = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-inicial.png`;
            await this.page.screenshot({ 
                path: path.join(this.screenshotsDir, initialScreenshot),
                fullPage: true 
            });
            section.screenshots.push({
                name: 'Vista inicial',
                file: initialScreenshot,
                description: `Vista inicial de ${sectionName}`
            });

            // Ejecutar interacciones
            for (let i = 0; i < interactions.length; i++) {
                const interaction = interactions[i];
                console.log(`  💫 Ejecutando: ${interaction.name}`);
                
                try {
                    // Ejecutar la interacción
                    await this.executeInteraction(interaction);
                    await this.page.waitForTimeout(1500);

                    // Captura después de la interacción
                    const screenshotName = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${i + 1}-${interaction.name.toLowerCase().replace(/\s+/g, '-')}.png`;
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
            console.log(`❌ Error documentando ${sectionName}: ${error.message}`);
            section.error = error.message;
        }

        this.docs.sections.push(section);
        return section;
    }

    async executeInteraction(interaction) {
        switch (interaction.type) {
            case 'click':
                await this.page.click(interaction.selector);
                break;
            case 'fill':
                await this.page.fill(interaction.selector, interaction.value);
                break;
            case 'select':
                await this.page.selectOption(interaction.selector, interaction.value);
                break;
            case 'wait':
                await this.page.waitForTimeout(interaction.duration || 2000);
                break;
            case 'waitForElement':
                await this.page.waitForSelector(interaction.selector);
                break;
            case 'hover':
                await this.page.hover(interaction.selector);
                break;
            case 'evaluate':
                await this.page.evaluate(interaction.script);
                break;
            default:
                throw new Error(`Tipo de interacción no soportado: ${interaction.type}`);
        }
    }

    async generateDocumentation() {
        console.log('🚀 Iniciando generación de documentación...');
        
        await this.init();

        // 1. Documentar App Principal
        await this.documentAppPrincipal();

        // 2. Documentar CPanel
        await this.documentCPanel();

        // 3. Documentar Admin Panel
        await this.documentAdminPanel();

        // Generar archivos finales
        await this.generateHTMLReport();
        await this.generateMarkdownReport();

        await this.browser.close();
        console.log('✅ Documentación generada exitosamente!');
    }

    async documentAppPrincipal() {
        const baseUrl = 'http://localhost:5500/index.html';
        
        // Pantalla principal
        await this.documentSection(
            'App Principal - Inicio',
            'Pantalla principal de la aplicación de fútbol',
            baseUrl,
            [
                {
                    type: 'wait',
                    name: 'Carga inicial',
                    description: 'Esperar que la aplicación cargue completamente',
                    duration: 3000
                },
                {
                    type: 'click',
                    name: 'Menú hamburguesa',
                    description: 'Abrir menú de navegación principal',
                    selector: '.menu-toggle, #menu-toggle, .hamburger-menu'
                }
            ]
        );

        // Pantalla de Jugadores
        await this.documentSection(
            'App Principal - Jugadores',
            'Gestión y visualización de jugadores',
            baseUrl,
            [
                {
                    type: 'evaluate',
                    name: 'Navegar a Jugadores',
                    description: 'Cambiar a la pantalla de jugadores',
                    script: `TestApp.navigateToScreen('players-screen')`
                },
                {
                    type: 'wait',
                    duration: 2000
                },
                {
                    type: 'click',
                    name: 'Botón Añadir Jugador',
                    description: 'Abrir formulario para añadir nuevo jugador',
                    selector: '#add-player-btn'
                }
            ]
        );

        // Pantalla de Partidos
        await this.documentSection(
            'App Principal - Partidos',
            'Gestión de partidos y configuración de equipos',
            baseUrl,
            [
                {
                    type: 'evaluate',
                    name: 'Navegar a Partidos',
                    description: 'Cambiar a la pantalla de partidos',
                    script: `TestApp.navigateToScreen('match-screen')`
                },
                {
                    type: 'wait',
                    duration: 2000
                },
                {
                    type: 'click',
                    name: 'Crear Partido Manual',
                    description: 'Iniciar creación de partido manual',
                    selector: '#create-manual-match'
                }
            ]
        );

        // Pantalla de Evaluaciones
        await this.documentSection(
            'App Principal - Evaluaciones',
            'Sistema de evaluaciones de jugadores',
            baseUrl,
            [
                {
                    type: 'evaluate',
                    name: 'Navegar a Evaluaciones',
                    description: 'Cambiar a la pantalla de evaluaciones',
                    script: `TestApp.navigateToScreen('evaluate-screen')`
                },
                {
                    type: 'wait',
                    duration: 2000
                }
            ]
        );

        // Pantalla de Historial
        await this.documentSection(
            'App Principal - Historial',
            'Historial de partidos y estadísticas',
            baseUrl,
            [
                {
                    type: 'evaluate',
                    name: 'Navegar a Historial',
                    description: 'Cambiar a la pantalla de historial',
                    script: `TestApp.navigateToScreen('history-screen')`
                },
                {
                    type: 'wait',
                    duration: 2000
                }
            ]
        );
    }

    async documentCPanel() {
        const baseUrl = 'http://localhost:5500/cpanel.html';
        
        // Dashboard del CPanel
        await this.documentSection(
            'CPanel - Dashboard',
            'Panel de control administrativo - Vista general',
            baseUrl,
            [
                {
                    type: 'wait',
                    name: 'Carga del CPanel',
                    description: 'Esperar que el CPanel cargue completamente',
                    duration: 3000
                },
                {
                    type: 'click',
                    name: 'Actualizar Todo',
                    description: 'Refrescar todos los datos del dashboard',
                    selector: 'button[onclick*="refreshAll"]'
                }
            ]
        );

        // Gestión de Jugadores
        await this.documentSection(
            'CPanel - Gestión de Jugadores',
            'Administración completa de jugadores',
            baseUrl,
            [
                {
                    type: 'click',
                    name: 'Pestaña Jugadores',
                    description: 'Cambiar a la sección de gestión de jugadores',
                    selector: 'button[onclick*="switchTab(\'players\')"]'
                },
                {
                    type: 'wait',
                    duration: 2000
                },
                {
                    type: 'click',
                    name: 'Cargar Jugadores',
                    description: 'Cargar lista completa de jugadores',
                    selector: 'button[onclick*="loadPlayers"]'
                }
            ]
        );

        // Gestión de Partidos
        await this.documentSection(
            'CPanel - Gestión de Partidos',
            'Administración completa de partidos',
            baseUrl,
            [
                {
                    type: 'click',
                    name: 'Pestaña Partidos',
                    description: 'Cambiar a la sección de gestión de partidos',
                    selector: 'button[onclick*="switchTab(\'matches\')"]'
                },
                {
                    type: 'wait',
                    duration: 2000
                },
                {
                    type: 'click',
                    name: 'Cargar Partidos',
                    description: 'Cargar lista completa de partidos',
                    selector: 'button[onclick*="loadMatches"]'
                }
            ]
        );

        // Gestión de Evaluaciones
        await this.documentSection(
            'CPanel - Gestión de Evaluaciones',
            'Administración del sistema de evaluaciones',
            baseUrl,
            [
                {
                    type: 'click',
                    name: 'Pestaña Evaluaciones',
                    description: 'Cambiar a la sección de evaluaciones',
                    selector: 'button[onclick*="switchTab(\'evaluations\')"]'
                },
                {
                    type: 'wait',
                    duration: 2000
                },
                {
                    type: 'click',
                    name: 'Cargar Evaluaciones',
                    description: 'Cargar lista de evaluaciones',
                    selector: 'button[onclick*="loadEvaluations"]'
                }
            ]
        );

        // Herramientas de Limpieza
        await this.documentSection(
            'CPanel - Herramientas de Limpieza',
            'Herramientas de administración y limpieza de datos',
            baseUrl,
            [
                {
                    type: 'click',
                    name: 'Pestaña Limpieza',
                    description: 'Cambiar a herramientas de limpieza',
                    selector: 'button[onclick*="switchTab(\'cleanup\')"]'
                },
                {
                    type: 'wait',
                    duration: 2000
                }
            ]
        );
    }

    async documentAdminPanel() {
        const baseUrl = 'http://localhost:5500/admin.html';
        
        await this.documentSection(
            'Admin Panel - Gestión General',
            'Panel de administración general del sistema',
            baseUrl,
            [
                {
                    type: 'wait',
                    name: 'Carga del Admin Panel',
                    description: 'Esperar que el panel de administración cargue',
                    duration: 3000
                }
            ]
        );
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
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 2rem;
        }
        .section {
            background: white;
            margin-bottom: 2rem;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #3498db;
            color: white;
            padding: 1rem 2rem;
        }
        .section-content {
            padding: 2rem;
        }
        .screenshot {
            max-width: 100%;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin: 1rem 0;
        }
        .interaction {
            background: #f8f9fa;
            padding: 1rem;
            margin: 1rem 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }
        .error {
            border-left-color: #e74c3c;
            background: #fdf2f2;
        }
        .success {
            border-left-color: #27ae60;
        }
        .toc {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 20px;
        }
        .toc li {
            margin: 0.5rem 0;
        }
        .toc a {
            color: #3498db;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.docs.title}</h1>
        <p>Documentación automática generada el ${new Date(this.docs.timestamp).toLocaleString()}</p>
    </div>

    <div class="toc">
        <h2>📑 Índice de Contenidos</h2>
        <ul>
            ${this.docs.sections.map((section, index) => `
                <li><a href="#section-${index}">${section.name}</a></li>
            `).join('')}
        </ul>
    </div>

    ${this.docs.sections.map((section, index) => `
        <div class="section" id="section-${index}">
            <div class="section-header">
                <h2>${section.name}</h2>
            </div>
            <div class="section-content">
                <p>${section.description}</p>
                <p><strong>URL:</strong> <code>${section.url}</code></p>
                
                ${section.screenshots.map(screenshot => `
                    <div>
                        <h4>${screenshot.name}</h4>
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
                            ${interaction.error ? `<p><strong>Error:</strong> ${interaction.error}</p>` : ''}
                            ${interaction.screenshot ? `<img src="screenshots/${interaction.screenshot}" alt="${interaction.name}" class="screenshot">` : ''}
                        </div>
                    `).join('')}
                ` : ''}

                ${section.error ? `<div class="interaction error"><strong>Error:</strong> ${section.error}</div>` : ''}
            </div>
        </div>
    `).join('')}

    <div class="section">
        <div class="section-header">
            <h2>📊 Resumen de Documentación</h2>
        </div>
        <div class="section-content">
            <ul>
                <li><strong>Secciones documentadas:</strong> ${this.docs.sections.length}</li>
                <li><strong>Screenshots generadas:</strong> ${this.docs.sections.reduce((acc, section) => acc + section.screenshots.length + section.interactions.filter(i => i.screenshot).length, 0)}</li>
                <li><strong>Interacciones probadas:</strong> ${this.docs.sections.reduce((acc, section) => acc + section.interactions.length, 0)}</li>
                <li><strong>Generado el:</strong> ${new Date(this.docs.timestamp).toLocaleString()}</li>
            </ul>
        </div>
    </div>
</body>
</html>
        `;

        fs.writeFileSync('./docs/documentacion-completa.html', htmlContent);
        console.log('📄 Reporte HTML generado: docs/documentacion-completa.html');
    }

    async generateMarkdownReport() {
        let markdown = `# ${this.docs.title}\n\n`;
        markdown += `*Documentación automática generada el ${new Date(this.docs.timestamp).toLocaleString()}*\n\n`;
        
        markdown += `## 📑 Índice de Contenidos\n\n`;
        this.docs.sections.forEach((section, index) => {
            markdown += `- [${section.name}](#${section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})\n`;
        });
        markdown += `\n`;

        this.docs.sections.forEach(section => {
            markdown += `## ${section.name}\n\n`;
            markdown += `${section.description}\n\n`;
            markdown += `**URL:** \`${section.url}\`\n\n`;
            
            section.screenshots.forEach(screenshot => {
                markdown += `### ${screenshot.name}\n\n`;
                markdown += `${screenshot.description}\n\n`;
                markdown += `![${screenshot.name}](screenshots/${screenshot.file})\n\n`;
            });

            if (section.interactions.length > 0) {
                markdown += `### 💫 Interacciones Documentadas\n\n`;
                section.interactions.forEach(interaction => {
                    markdown += `#### ${interaction.name} ${interaction.success ? '✅' : '❌'}\n\n`;
                    markdown += `${interaction.description}\n\n`;
                    if (interaction.error) {
                        markdown += `**Error:** ${interaction.error}\n\n`;
                    }
                    if (interaction.screenshot) {
                        markdown += `![${interaction.name}](screenshots/${interaction.screenshot})\n\n`;
                    }
                });
            }

            if (section.error) {
                markdown += `**Error:** ${section.error}\n\n`;
            }

            markdown += `---\n\n`;
        });

        markdown += `## 📊 Resumen de Documentación\n\n`;
        markdown += `- **Secciones documentadas:** ${this.docs.sections.length}\n`;
        markdown += `- **Screenshots generadas:** ${this.docs.sections.reduce((acc, section) => acc + section.screenshots.length + section.interactions.filter(i => i.screenshot).length, 0)}\n`;
        markdown += `- **Interacciones probadas:** ${this.docs.sections.reduce((acc, section) => acc + section.interactions.length, 0)}\n`;
        markdown += `- **Generado el:** ${new Date(this.docs.timestamp).toLocaleString()}\n`;

        fs.writeFileSync('./docs/documentacion-completa.md', markdown);
        console.log('📝 Reporte Markdown generado: docs/documentacion-completa.md');
    }
}

// Ejecutar generador
async function main() {
    const generator = new DocumentationGenerator();
    await generator.generateDocumentation();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DocumentationGenerator;