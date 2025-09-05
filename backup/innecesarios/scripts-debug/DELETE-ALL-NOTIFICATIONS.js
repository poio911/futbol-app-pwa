// ⚠️ SCRIPT PARA BORRAR TODAS LAS NOTIFICACIONES DE FIREBASE
// Ejecuta este código en la consola del navegador (F12 -> Console)
// ADVERTENCIA: Esto borrará TODAS las notificaciones permanentemente

async function deleteAllNotifications() {
    console.log('🗑️ Iniciando eliminación de todas las notificaciones...');
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase no está disponible. Asegúrate de estar en la aplicación.');
        return;
    }
    
    const db = firebase.firestore();
    let deletedCount = 0;
    let errorCount = 0;
    
    try {
        // Obtener todas las notificaciones
        console.log('📊 Obteniendo todas las notificaciones...');
        const notificationsSnapshot = await db.collection('notifications').get();
        
        if (notificationsSnapshot.empty) {
            console.log('✅ No hay notificaciones para eliminar.');
            return;
        }
        
        const totalCount = notificationsSnapshot.size;
        console.log(`📋 Se encontraron ${totalCount} notificaciones`);
        console.log('🔄 Comenzando eliminación...');
        
        // Crear un batch para eliminar todas las notificaciones
        const batchSize = 500; // Firestore tiene un límite de 500 operaciones por batch
        let batch = db.batch();
        let operationCount = 0;
        
        for (const doc of notificationsSnapshot.docs) {
            batch.delete(doc.ref);
            operationCount++;
            
            // Si llegamos al límite del batch, ejecutarlo y crear uno nuevo
            if (operationCount === batchSize) {
                await batch.commit();
                deletedCount += operationCount;
                console.log(`✅ Eliminadas ${deletedCount} de ${totalCount} notificaciones...`);
                batch = db.batch();
                operationCount = 0;
            }
        }
        
        // Ejecutar el último batch si tiene operaciones pendientes
        if (operationCount > 0) {
            await batch.commit();
            deletedCount += operationCount;
        }
        
        console.log('');
        console.log('✅✅✅ ELIMINACIÓN COMPLETADA ✅✅✅');
        console.log(`📊 Resumen:`);
        console.log(`   - Notificaciones eliminadas: ${deletedCount}`);
        console.log(`   - Errores: ${errorCount}`);
        console.log('');
        
        // Opcional: Limpiar también las notificaciones del localStorage
        if (typeof localStorage !== 'undefined') {
            const keys = Object.keys(localStorage);
            const notificationKeys = keys.filter(key => 
                key.includes('notification') || 
                key.includes('alert') || 
                key.includes('message')
            );
            
            if (notificationKeys.length > 0) {
                console.log(`🧹 Limpiando ${notificationKeys.length} entradas del localStorage...`);
                notificationKeys.forEach(key => localStorage.removeItem(key));
                console.log('✅ localStorage limpiado');
            }
        }
        
        // Recargar la página para reflejar los cambios
        console.log('🔄 Recargando la página en 3 segundos...');
        setTimeout(() => {
            location.reload();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error al eliminar notificaciones:', error);
        console.error('Detalles:', error.message);
    }
}

// Función alternativa para eliminar notificaciones por usuario específico
async function deleteNotificationsByUser(userId) {
    console.log(`🗑️ Eliminando notificaciones del usuario: ${userId}`);
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    const db = firebase.firestore();
    
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', userId)
            .get();
            
        if (snapshot.empty) {
            console.log('✅ No hay notificaciones para este usuario');
            return;
        }
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        console.log(`✅ Eliminadas ${snapshot.size} notificaciones del usuario ${userId}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Función para contar notificaciones antes de eliminar
async function countNotifications() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    const db = firebase.firestore();
    
    try {
        const snapshot = await db.collection('notifications').get();
        console.log(`📊 Total de notificaciones en Firebase: ${snapshot.size}`);
        
        // Mostrar algunas estadísticas
        const types = {};
        const users = {};
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            types[data.type || 'unknown'] = (types[data.type || 'unknown'] || 0) + 1;
            users[data.recipientId || 'unknown'] = (users[data.recipientId || 'unknown'] || 0) + 1;
        });
        
        console.log('📈 Por tipo:', types);
        console.log('👥 Por usuario:', users);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// INSTRUCCIONES DE USO:
console.log(`
╔════════════════════════════════════════════════════════════╗
║     🗑️  ELIMINADOR DE NOTIFICACIONES DE FIREBASE  🗑️      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  COMANDOS DISPONIBLES:                                    ║
║                                                            ║
║  1️⃣  countNotifications()                                 ║
║     → Ver cuántas notificaciones hay antes de eliminar    ║
║                                                            ║
║  2️⃣  deleteAllNotifications()                             ║
║     → ELIMINAR TODAS las notificaciones (⚠️ IRREVERSIBLE) ║
║                                                            ║
║  3️⃣  deleteNotificationsByUser('userId')                  ║
║     → Eliminar notificaciones de un usuario específico    ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ⚠️  ADVERTENCIA:                                          ║
║  Esta acción es PERMANENTE y no se puede deshacer.        ║
║  Asegúrate de querer eliminar las notificaciones.         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Para ejecutar, escribe el comando deseado y presiona Enter.
Ejemplo: deleteAllNotifications()
`);