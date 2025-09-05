// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Unified Evaluation System Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');
        
        // Wait for app to load
        await page.waitForTimeout(2000);
    });

    test('Complete flow: Create manual match → Finish → Generate evaluations → View evaluations', async ({ page }) => {
        // Step 1: Navigate to Matches section
        console.log('Step 1: Navigating to Matches section...');
        await page.click('[data-screen="matches"]');
        await page.waitForTimeout(1000);
        
        // Step 2: Generate a manual match
        console.log('Step 2: Generating manual match...');
        await page.click('#generate-teams-btn');
        await page.waitForTimeout(2000);
        
        // Step 3: Save the match
        console.log('Step 3: Saving match...');
        const saveButton = await page.$('#save-match-generated');
        if (saveButton) {
            await saveButton.click();
            await page.waitForTimeout(2000);
        }
        
        // Step 4: Navigate to Match History
        console.log('Step 4: Navigating to Match History...');
        await page.click('[data-screen="match-history"]');
        await page.waitForTimeout(2000);
        
        // Step 5: Find and click Finalizar button
        console.log('Step 5: Looking for Finalizar button...');
        const finalizarButton = await page.$('button:has-text("Finalizar")');
        if (finalizarButton) {
            console.log('Found Finalizar button, clicking...');
            await finalizarButton.click();
            
            // Handle confirmation dialog if it appears
            page.on('dialog', async dialog => {
                console.log('Dialog appeared:', dialog.message());
                await dialog.accept();
            });
            
            await page.waitForTimeout(3000);
        } else {
            console.log('No Finalizar button found - match might already be completed');
        }
        
        // Step 6: Navigate to Evaluations
        console.log('Step 6: Navigating to Evaluations...');
        await page.click('[data-screen="evaluations"]');
        await page.waitForTimeout(2000);
        
        // Step 7: Check if evaluations are visible
        console.log('Step 7: Checking for evaluations...');
        
        // Try to click the manual load button if it exists
        const manualLoadButton = await page.$('button:has-text("Cargar Evaluaciones Manualmente")');
        if (manualLoadButton) {
            console.log('Manual load button found, clicking...');
            await manualLoadButton.click();
            await page.waitForTimeout(2000);
        }
        
        // Check for evaluation content
        const evaluationContent = await page.$('#evaluations-section');
        if (evaluationContent) {
            const text = await evaluationContent.textContent();
            console.log('Evaluations content:', text);
            
            // Check if evaluations are actually displayed
            const hasEvaluations = text.includes('Evaluaciones Generadas') || text.includes('evaluaciones generadas');
            if (hasEvaluations) {
                console.log('✅ Evaluations are displayed successfully!');
            } else if (text.includes('No hay evaluaciones')) {
                console.log('⚠️ No evaluations found yet');
            } else {
                console.log('❓ Unknown evaluation state');
            }
        }
        
        // Step 8: Test navigation after viewing evaluations
        console.log('Step 8: Testing navigation after evaluations...');
        
        // Try navigating to different screens to ensure navigation still works
        await page.click('[data-screen="matches"]');
        await page.waitForTimeout(1000);
        const matchesVisible = await page.isVisible('#matches-screen.active');
        expect(matchesVisible).toBeTruthy();
        console.log('✅ Can navigate to Matches');
        
        await page.click('[data-screen="players"]');
        await page.waitForTimeout(1000);
        const playersVisible = await page.isVisible('#players-screen.active');
        expect(playersVisible).toBeTruthy();
        console.log('✅ Can navigate to Players');
        
        await page.click('[data-screen="evaluations"]');
        await page.waitForTimeout(1000);
        const evaluationsVisible = await page.isVisible('#evaluations-screen.active');
        expect(evaluationsVisible).toBeTruthy();
        console.log('✅ Can navigate back to Evaluations');
        
        console.log('🎉 Test completed successfully!');
    });
    
    test('View existing evaluations in Firebase', async ({ page }) => {
        // Navigate directly to evaluations
        console.log('Navigating to Evaluations...');
        await page.click('[data-screen="evaluations"]');
        await page.waitForTimeout(2000);
        
        // Try manual load if needed
        const manualLoadButton = await page.$('button:has-text("Cargar Evaluaciones Manualmente")');
        if (manualLoadButton) {
            console.log('Loading evaluations manually...');
            await manualLoadButton.click();
            await page.waitForTimeout(2000);
        }
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'evaluations-screen.png', fullPage: true });
        console.log('Screenshot saved as evaluations-screen.png');
        
        // Check what's actually rendered
        const evaluationContent = await page.$eval('#evaluations-section', el => el.innerHTML);
        console.log('Current evaluation content:', evaluationContent);
    });
});