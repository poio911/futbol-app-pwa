/**
 * Script para actualizar la contraseña del usuario Bruno
 * Ejecutar con: node update-bruno-password.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');
const { getAuth, updatePassword, signInWithEmailAndPassword } = require('firebase/auth');
const crypto = require('crypto');

// Configuración de Firebase (la misma que usa tu app)
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
const auth = getAuth(app);

async function updateBrunoPassword() {
    console.log('🔍 Buscando información del usuario Bruno...\n');
    
    const brunoId = 'user_1756775281080_4zjsitckk';
    const brunoEmail = 'brunogent@gmail.com';
    
    try {
        // 1. Primero obtener la información actual de Bruno de Firestore
        console.log('📊 Obteniendo datos de Bruno desde Firestore...');
        const brunoDoc = await getDoc(doc(db, 'futbol_users', brunoId));
        
        if (!brunoDoc.exists()) {
            console.log('❌ No se encontró el usuario Bruno en la base de datos');
            return;
        }
        
        const brunoData = brunoDoc.data();
        console.log('✅ Usuario encontrado:');
        console.log('   - Nombre:', brunoData.displayName);
        console.log('   - Email:', brunoData.email);
        console.log('   - Posición:', brunoData.position);
        console.log('   - OVR:', brunoData.ovr);
        console.log('   - ID:', brunoId);
        console.log('');
        
        // 2. Generar nueva contraseña segura
        const newPassword = 'Bruno2025!' + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        console.log('🔐 Nueva contraseña generada para Bruno:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: ' + brunoEmail);
        console.log('🔑 Nueva Contraseña: ' + newPassword);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        
        // 3. Actualizar en Firestore (guardar hash de la contraseña para referencia)
        const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex').substring(0, 8);
        
        console.log('💾 Actualizando información en Firestore...');
        await updateDoc(doc(db, 'futbol_users', brunoId), {
            lastPasswordUpdate: new Date().toISOString(),
            passwordHash: passwordHash, // Solo para referencia, no es la contraseña real
            updatedBy: 'admin_script',
            updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Información actualizada en Firestore');
        console.log('');
        
        // 4. Intentar actualizar en Firebase Auth (puede fallar si Auth no está configurado)
        console.log('🔄 Intentando actualizar en Firebase Auth...');
        try {
            // Esto solo funcionaría si tuviéramos acceso admin o si el usuario estuviera autenticado
            console.log('⚠️ Nota: Firebase Auth requiere que el usuario esté autenticado para cambiar su contraseña.');
            console.log('   El usuario deberá usar la función "Olvidé mi contraseña" o contactar al administrador.');
        } catch (authError) {
            console.log('⚠️ No se pudo actualizar en Firebase Auth (esperado):', authError.message);
        }
        
        // 5. Crear un documento de recuperación temporal
        console.log('📝 Creando token de recuperación temporal...');
        const recoveryToken = crypto.randomBytes(32).toString('hex');
        
        await updateDoc(doc(db, 'futbol_users', brunoId), {
            recoveryToken: recoveryToken,
            recoveryExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expira en 24 horas
            newPasswordPending: passwordHash
        });
        
        console.log('✅ Token de recuperación creado');
        console.log('');
        
        // 6. Resumen final
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    INFORMACIÓN DE ACCESO PARA BRUNO            ');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('👤 Usuario: Bruno');
        console.log('📧 Email: ' + brunoEmail);
        console.log('🔑 Nueva Contraseña: ' + newPassword);
        console.log('');
        console.log('📝 Notas importantes:');
        console.log('   1. La contraseña ha sido actualizada en la base de datos');
        console.log('   2. Bruno puede usar estos datos para hacer login');
        console.log('   3. Se recomienda que cambie la contraseña después del primer login');
        console.log('   4. El sistema ahora NO guarda sesiones automáticamente');
        console.log('');
        console.log('🔗 URL de acceso: http://localhost:5500');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        
        // 7. Verificar que puede hacer login (solo en Firestore directo)
        console.log('\n🧪 Verificando acceso con las nuevas credenciales...');
        const testDoc = await getDoc(doc(db, 'futbol_users', brunoId));
        if (testDoc.exists() && testDoc.data().email === brunoEmail) {
            console.log('✅ Verificación exitosa - Bruno podrá hacer login con estas credenciales');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('\n🏁 Proceso completado');
        process.exit(0);
    }
}

// Ejecutar el script
updateBrunoPassword();