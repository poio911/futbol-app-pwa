/**
 * generate-backup.js v2.1
 * Genera un JSON con:
 *  - meta
 *  - data (localStorage export)
 *  - sourceFiles (contenido cargado dinámicamente si posible)
 */
(function () {
    const FILES = [
        'appfutbol.html',
        'css/styles.css',
        'js/storage.js',
        'js/utils.js',
        'js/ui.js',
        'js/app.js'
    ];

    async function fetchText(path) {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (!res.ok) throw new Error(res.status);
            return await res.text();
        } catch {
            return '/* no se pudo leer */';
        }
    }

    async function buildSourceMap() {
        const map = {};
        for (const f of FILES) {
            map[f] = await fetchText(f);
        }
        return map;
    }

    async function generateFullBackup() {
        const data = (typeof Storage !== 'undefined' && Storage.exportData)
            ? Storage.exportData()
            : { warning: 'Storage.exportData no disponible' };

        const sourceFiles = await buildSourceMap();

        const payload = {
            meta: {
                app: 'Fútbol Stats',
                version: '2.1',
                exportedAt: new Date().toISOString()
            },
            data,
            sourceFiles
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `futbol_stats_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('[Backup] JSON generado.');
    }

    window.generateFullBackup = generateFullBackup;
    console.log('[Backup] Usa window.generateFullBackup() para descargar.');
})();
