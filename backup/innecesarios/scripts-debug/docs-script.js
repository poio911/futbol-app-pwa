/**
 * Script simple para generar documentación
 * Ejecutar con: node docs-script.js
 */

const DocumentationGenerator = require('./generate-docs.js');

async function run() {
    console.log('🚀 Iniciando generación de documentación automática...');
    console.log('📋 Asegúrate de que:');
    console.log('   ✓ El servidor esté ejecutándose en http://localhost:5500');
    console.log('   ✓ Firebase esté configurado y funcional');
    console.log('   ✓ No hay modales o popups abiertos');
    console.log('');
    
    try {
        const generator = new DocumentationGenerator();
        await generator.generateDocumentation();
        
        console.log('');
        console.log('🎉 ¡Documentación generada exitosamente!');
        console.log('📄 Archivos generados:');
        console.log('   • docs/documentacion-completa.html');
        console.log('   • docs/documentacion-completa.md');
        console.log('   • docs/screenshots/ (capturas de pantalla)');
        console.log('');
        console.log('🌐 Para ver la documentación HTML, abre:');
        console.log('   file:///' + __dirname.replace(/\\/g, '/') + '/docs/documentacion-completa.html');
        
    } catch (error) {
        console.error('❌ Error generando documentación:', error);
        process.exit(1);
    }
}

run();