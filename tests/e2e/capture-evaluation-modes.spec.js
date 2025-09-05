const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

test.describe('Capture Evaluation Modes Demo', () => {
    test('capture both evaluation modes', async ({ page }) => {
        // Crear directorio para screenshots
        const screenshotDir = path.join(process.cwd(), 'test-screenshots', 'evaluation-modes');
        await fs.mkdir(screenshotDir, { recursive: true });

        // Navegar a la página demo
        await page.goto('/demo-evaluacion-etiquetas.html');
        await page.waitForLoadState('networkidle');

        // Capturar modo por etiquetas (default)
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-modo-etiquetas.png'),
            fullPage: true 
        });

        // Hacer scroll para mostrar la distribución de puntos
        await page.evaluate(() => {
            document.querySelector('.distribution-info').scrollIntoView({ behavior: 'smooth' });
        });
        await page.waitForTimeout(500);

        await page.screenshot({ 
            path: path.join(screenshotDir, '02-distribucion-explicacion.png'),
            fullPage: false 
        });

        // Cambiar algunas estadísticas
        await page.locator('#pace').fill('78');
        await page.locator('#shooting').fill('85');
        await page.locator('#passing').fill('94');
        await page.waitForTimeout(500);

        await page.screenshot({ 
            path: path.join(screenshotDir, '03-stats-ajustadas.png'),
            fullPage: true 
        });

        // Cambiar a modo simplificado
        await page.click('button:has-text("Modo Simplificado")');
        await page.waitForTimeout(500);

        await page.screenshot({ 
            path: path.join(screenshotDir, '04-modo-simplificado.png'),
            fullPage: true 
        });

        // Seleccionar diferentes ratings
        await page.click('.rating-btn:has-text("5")');
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            path: path.join(screenshotDir, '05-rating-promedio.png'),
            fullPage: false 
        });

        await page.click('.rating-btn:has-text("10")');
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            path: path.join(screenshotDir, '06-rating-excelente.png'),
            fullPage: false 
        });

        // Volver a modo etiquetas y mostrar el total calculado
        await page.click('button:has-text("Por Etiquetas")');
        await page.waitForTimeout(500);

        // Hacer scroll al total
        await page.evaluate(() => {
            document.querySelector('.total-points').scrollIntoView({ behavior: 'smooth' });
        });
        await page.waitForTimeout(500);

        await page.screenshot({ 
            path: path.join(screenshotDir, '07-total-calculado.png'),
            fullPage: false 
        });

        console.log('✅ Screenshots capturados en:', screenshotDir);
    });
});