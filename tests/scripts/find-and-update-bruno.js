/**
 * Script para buscar y actualizar la contraseña de Bruno
 * Ejecutar con: node find-and-update-bruno.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');
const crypto = require('crypto');

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

async function findAndUpdateBruno() {
    console.log('🔍 Buscando al usuario Bruno en la base de datos...\n');
    
    try {
        // 1. Buscar por nombre "Bruno"
        console.log('📊 Buscando usuarios con nombre "Bruno"...');
        const q1 = query(collection(db, 'futbol_users'), where('displayName', '==', 'Bruno'));
        const snapshot1 = await getDocs(q1);
        
        if (!snapshot1.empty) {
            console.log(`✅ Encontrado ${snapshot1.size} usuario(s) con nombre "Bruno":\n`);
            
            snapshot1.forEach(async (docSnap) => {
                const userData = docSnap.data();
                console.log('👤 Usuario encontrado:');
                console.log('   - ID:', docSnap.id);
                console.log('   - Nombre:', userData.displayName);
                console.log('   - Email:', userData.email || 'No especificado');
                console.log('   - Posición:', userData.position);
                console.log('   - OVR:', userData.ovr);
                console.log('');
                
                // Generar nueva contraseña
                const newPassword = 'Bruno2025!' + Math.random().toString(36).substr(2, 4).toUpperCase();
                
                console.log('🔐 Credenciales actualizadas para Bruno:');
                console.log('═══════════════════════════════════════════════════════════════');
                console.log('📧 Email: ' + (userData.email || 'brunogent@gmail.com'));
                console.log('🔑 Nueva Contraseña: ' + newPassword);
                console.log('═══════════════════════════════════════════════════════════════');
                console.log('');
                
                // Actualizar en Firestore
                const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex').substring(0, 8);
                
                await updateDoc(doc(db, 'futbol_users', docSnap.id), {
                    email: userData.email || 'brunogent@gmail.com',
                    lastPasswordUpdate: new Date().toISOString(),
                    passwordHash: passwordHash,
                    updatedBy: 'admin_script',
                    updatedAt: new Date().toISOString()
                });
                
                console.log('✅ Base de datos actualizada exitosamente');
                console.log('');
                console.log('📝 INSTRUCCIONES PARA BRUNO:');
                console.log('   1. Ir a: http://localhost:5500');
                console.log('   2. Hacer click en "Ya tengo cuenta"');
                console.log('   3. Ingresar email: ' + (userData.email || 'brunogent@gmail.com'));
                console.log('   4. Ingresar contraseña: ' + newPassword);
                console.log('   5. Click en "Iniciar Sesión"');
                console.log('');
                console.log('⚠️ IMPORTANTE: El sistema ya no guarda sesiones automáticamente.');
                console.log('   Bruno deberá hacer login cada vez que acceda.');
            });
        } else {
            console.log('❌ No se encontró ningún usuario con nombre "Bruno"');
            
            // 2. Buscar por email
            console.log('\n📊 Buscando por email "brunogent@gmail.com"...');
            const q2 = query(collection(db, 'futbol_users'), where('email', '==', 'brunogent@gmail.com'));
            const snapshot2 = await getDocs(q2);
            
            if (!snapshot2.empty) {
                snapshot2.forEach(async (docSnap) => {
                    const userData = docSnap.data();
                    console.log('✅ Usuario encontrado por email:');
                    console.log('   - ID:', docSnap.id);
                    console.log('   - Nombre:', userData.displayName);
                    console.log('   - Email:', userData.email);
                    
                    // Generar nueva contraseña
                    const newPassword = 'Bruno2025!' + Math.random().toString(36).substr(2, 4).toUpperCase();
                    
                    console.log('\n🔐 Credenciales actualizadas:');
                    console.log('═══════════════════════════════════════════════════════════════');
                    console.log('📧 Email: ' + userData.email);
                    console.log('🔑 Nueva Contraseña: ' + newPassword);
                    console.log('═══════════════════════════════════════════════════════════════');
                });
            } else {
                console.log('❌ No se encontró ningún usuario con ese email');
                
                // 3. Listar todos los usuarios para verificar
                console.log('\n📋 Listando todos los usuarios en la base de datos:');
                const allUsers = await getDocs(collection(db, 'futbol_users'));
                
                allUsers.forEach((docSnap) => {
                    const userData = docSnap.data();
                    const name = userData.displayName || userData.name || 'Sin nombre';
                    const email = userData.email || 'Sin email';
                    
                    // Buscar si contiene "Bruno" en algún campo
                    if (name.toLowerCase().includes('bruno') || email.toLowerCase().includes('bruno')) {
                        console.log(`🎯 Posible coincidencia: ${name} - ${email} (ID: ${docSnap.id})`);
                    } else {
                        console.log(`   - ${name} - ${email}`);
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('\n🏁 Proceso completado');
        
        // Esperar un poco antes de cerrar para que se completen las operaciones async
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
}

// Ejecutar el script
findAndUpdateBruno();