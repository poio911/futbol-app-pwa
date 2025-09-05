/**
 * Script para corregir la foto de Bruno
 * Ejecutar con: node fix-bruno-photo.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAes7EVn8hQswS8XgvDMJfN6U4IT_ZL_WY",
    authDomain: "mil-disculpis.firebaseapp.com",
    projectId: "mil-disculpis",
    storageBucket: "mil-disculpis.appspot.com",
    messagingSenderId: "967972118415",
    appId: "1:967972118415:web:6348b5b0c5c91e0e4cfd42"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixBrunoPhoto() {
    console.log('🖼️ Corrigiendo la foto de Bruno...\n');
    
    try {
        const brunoId = 'user_1756775281080_4zjsitckk';
        
        // 1. Verificar el estado actual
        console.log('📊 Verificando datos actuales de Bruno...');
        const brunoDoc = await getDoc(doc(db, 'futbol_users', brunoId));
        
        if (!brunoDoc.exists()) {
            console.log('❌ No se encontró el usuario Bruno');
            return;
        }
        
        const currentData = brunoDoc.data();
        console.log('✅ Usuario encontrado:');
        console.log('   - Nombre:', currentData.displayName);
        console.log('   - Email:', currentData.email);
        console.log('   - Foto actual:', currentData.photo ? 'Tiene foto (corrupta)' : 'Sin foto');
        
        // 2. Actualizar con avatar por defecto
        console.log('\n🎨 Actualizando foto...');
        
        // Usar un emoji o marcador simple como avatar por defecto
        // Este es el mismo formato que usan otros usuarios sin foto
        await updateDoc(doc(db, 'futbol_users', brunoId), {
            photo: '👤', // Avatar por defecto
            photoUpdatedAt: new Date().toISOString(),
            photoUpdatedBy: 'admin_script'
        });
        
        console.log('✅ Foto actualizada correctamente');
        
        // 3. También actualizar en la colección del grupo si existe
        console.log('\n📊 Actualizando en la colección del grupo...');
        const groupId = 'o8ZOD6N0KEHrvweFfTAd';
        
        try {
            const groupPlayerDoc = await getDoc(doc(db, 'groups', groupId, 'players', brunoId));
            
            if (groupPlayerDoc.exists()) {
                await updateDoc(doc(db, 'groups', groupId, 'players', brunoId), {
                    photo: '👤',
                    photoUpdatedAt: new Date().toISOString()
                });
                console.log('✅ Foto actualizada en el grupo');
            } else {
                console.log('⚠️ Bruno no está en la colección de jugadores del grupo (normal si es usuario nuevo)');
            }
        } catch (groupError) {
            console.log('⚠️ No se pudo actualizar en el grupo:', groupError.message);
        }
        
        // 4. Resumen final
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ FOTO CORREGIDA EXITOSAMENTE              ');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('👤 Usuario: Bruno');
        console.log('📧 Email: brunogent@gmail.com');
        console.log('🖼️ Nueva foto: Avatar por defecto (👤)');
        console.log('');
        console.log('📝 Notas:');
        console.log('   • La foto corrupta ha sido eliminada');
        console.log('   • Se asignó el avatar por defecto');
        console.log('   • El sistema mostrará las iniciales "B" con colores');
        console.log('   • Bruno puede subir una nueva foto desde su perfil');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('\n🏁 Proceso completado');
        process.exit(0);
    }
}

// Ejecutar el script
fixBrunoPhoto();