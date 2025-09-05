/**
 * Script para crear cuenta de usuario para Bruno
 * Ejecutar con: node create-bruno-account.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
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

async function createBrunoAccount() {
    console.log('🔨 Creando cuenta de usuario para Bruno...\n');
    
    try {
        // Usar el ID que vimos en los logs
        const brunoId = 'user_1756775281080_4zjsitckk';
        const brunoEmail = 'brunogent@gmail.com';
        const newPassword = 'Bruno2025!' + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        // Verificar si ya existe
        console.log('📊 Verificando si Bruno ya existe en futbol_users...');
        const existingDoc = await getDoc(doc(db, 'futbol_users', brunoId));
        
        if (existingDoc.exists()) {
            console.log('✅ Bruno ya tiene cuenta. Actualizando contraseña...');
            const userData = existingDoc.data();
            console.log('   - Nombre:', userData.displayName);
            console.log('   - Email actual:', userData.email);
        } else {
            console.log('📝 Creando nueva cuenta para Bruno...');
            
            // Crear datos del usuario
            const userData = {
                // Authentication data
                uid: brunoId,
                email: brunoEmail,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                
                // Player profile
                displayName: 'Bruno',
                position: 'MED',
                ovr: 50,
                originalOVR: 50,
                
                // Attributes
                pac: 50,
                sho: 50,
                pas: 50,
                dri: 50,
                def: 50,
                phy: 50,
                
                // Other player data
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD...', // Placeholder, tiene foto real
                hasBeenEvaluated: false,
                
                // Stats
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                totalGoals: 0,
                totalAssists: 0,
                avgRating: 0,
                totalRatingsReceived: 0,
                
                // Groups
                groups: ['o8ZOD6N0KEHrvweFfTAd'], // Fútbol en el Galpón
                currentGroup: 'o8ZOD6N0KEHrvweFfTAd',
                
                // Settings
                notifications: true,
                preferredPosition: 'MED',
                theme: 'default',
                
                // Password info
                passwordHash: crypto.createHash('sha256').update(newPassword).digest('hex').substring(0, 8),
                lastPasswordUpdate: new Date().toISOString(),
                createdBy: 'admin_script'
            };
            
            // Guardar en Firestore
            await setDoc(doc(db, 'futbol_users', brunoId), userData);
            console.log('✅ Cuenta creada exitosamente en futbol_users');
        }
        
        // Actualizar información de contraseña
        const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex').substring(0, 8);
        await setDoc(doc(db, 'futbol_users', brunoId), {
            passwordHash: passwordHash,
            lastPasswordUpdate: new Date().toISOString(),
            email: brunoEmail,
            displayName: 'Bruno'
        }, { merge: true });
        
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('           🎉 CUENTA CREADA/ACTUALIZADA PARA BRUNO 🎉          ');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('📧 Email: ' + brunoEmail);
        console.log('🔑 Contraseña: ' + newPassword);
        console.log('');
        console.log('📝 INSTRUCCIONES DE ACCESO:');
        console.log('');
        console.log('1. Abrir el navegador y ir a: http://localhost:5500');
        console.log('');
        console.log('2. En la pantalla de login:');
        console.log('   - Click en "Ya tengo cuenta" (si aparece registro)');
        console.log('   - Email: ' + brunoEmail);
        console.log('   - Contraseña: ' + newPassword);
        console.log('   - Click en "Iniciar Sesión"');
        console.log('');
        console.log('3. Información adicional:');
        console.log('   - Posición: MED (Mediocampista)');
        console.log('   - OVR: 50');
        console.log('   - Grupo: Fútbol en el Galpón');
        console.log('   - ID de usuario: ' + brunoId);
        console.log('');
        console.log('⚠️ NOTAS IMPORTANTES:');
        console.log('   • El sistema NO guarda sesiones automáticamente');
        console.log('   • Bruno deberá hacer login cada vez que acceda');
        console.log('   • La sesión expira después de 2 horas de inactividad');
        console.log('   • Si cierra sesión, deberá volver a ingresar credenciales');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        console.log('💡 Guarda estas credenciales en un lugar seguro');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('🏁 Proceso completado exitosamente');
        process.exit(0);
    }
}

// Ejecutar el script
createBrunoAccount();