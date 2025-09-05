/**
 * Demo Seed Script v1
 * Genera: 1 persona, 1 grupo y 10 jugadores aleatorios si no existen.
 * Uso manual: window.seedDemoData(true) // fuerza recreación
 */

(function() {
    const AUTO_RUN = true; // Cambia a false si no quieres ejecución automática
    const TARGET_COUNT = 10;

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function pick(arr) {
        return arr[rand(0, arr.length - 1)];
    }

    function generateAttributes() {
        return {
            pac: rand(40, 95),
            sho: rand(40, 95),
            pas: rand(40, 95),
            dri: rand(40, 95),
            def: rand(30, 90),
            phy: rand(40, 95)
        };
    }

    const NAMES = [
        'Carlos Ruiz','Luis Pérez','Nico Vargas','Javier Soto','Pablo Gómez',
        'Marcos Díaz','Álvaro León','Tomás Ortiz','Miguel Lara','Iván Calderón',
        'Sergio Vidal','Beto Molina','Héctor Silva','Rafa Acosta','Fabián Ríos'
    ];

    const POSITIONS = ['POR','DEF','DEF','DEF','MED','MED','MED','DEL','DEL','DEL','DEL'];

    function ensureCoreEntities(force) {
        // Persona
        let currentPerson = Storage.getCurrentPerson();
        if (!currentPerson || force) {
            const persons = Storage.getPersons();
            currentPerson = {
                id: Utils.generateId(),
                name: 'Tester Admin',
                email: 'tester@example.com',
                phone: null,
                createdAt: new Date().toISOString()
            };
            persons.push(currentPerson);
            Storage.savePersons(persons);
            Storage.setCurrentPerson(currentPerson.id);
        }

        // Grupo
        let currentGroup = Storage.getCurrentGroup();
        if (!currentGroup || force) {
            const groups = Storage.getGroups();
            currentGroup = {
                id: Utils.generateId(),
                name: 'Grupo Demo',
                description: 'Grupo generado automáticamente para pruebas.',
                schedule: 'Miércoles 19:00',
                createdBy: currentPerson.id,
                createdAt: new Date().toISOString(),
                isPrivate: false,
                maxMembers: 30,
                code: (Utils.generateGroupCode ? Utils.generateGroupCode() : Math.random().toString(36).substring(2,8).toUpperCase())
            };
            groups.push(currentGroup);
            Storage.saveGroups(groups);
            Storage.setCurrentGroup(currentGroup.id);

            // Membership
            const memberships = Storage.getMemberships();
            memberships.push({
                id: Utils.generateId(),
                personId: currentPerson.id,
                groupId: currentGroup.id,
                role: 'owner',
                joinedAt: new Date().toISOString()
            });
            Storage.saveMemberships(memberships);
        }
        return { currentPerson, currentGroup };
    }

    function seedPlayers(currentPerson, currentGroup, force) {
        // Skip seeding in Firebase mode - users will create their own players
        console.log('[Seed] Skipping automatic seeding in Firebase mode');
        return;

        if (!force && existingInGroup.length >= TARGET_COUNT) {
            console.log('[Seed] Ya existen', existingInGroup.length, 'jugadores en el grupo. No se genera.');
            return;
        }

        // Limpia jugadores del grupo si force
        let filtered = allPlayers;
        if (force) {
            filtered = allPlayers.filter(p => p.groupId !== currentGroup.id);
        }

        const usedNames = new Set(existingInGroup.map(p => p.name));
        const newPlayers = [];

        // Distribuir posiciones (garantizar al menos 1 POR, 3 DEF, 3 MED, 3 DEL)
        const requiredTemplate = ['POR','DEF','DEF','DEF','MED','MED','MED','DEL','DEL','DEL'];
        for (let i = 0; i < TARGET_COUNT; i++) {
            let nameCandidate;
            let tries = 0;
            while (!nameCandidate || usedNames.has(nameCandidate)) {
                nameCandidate = pick(NAMES) + ' ' + (rand(1,99));
                if (++tries > 20) break;
            }
            usedNames.add(nameCandidate);

            const attributes = generateAttributes();
            const ovr = Utils.calculateOvr(attributes);

            newPlayers.push({
                id: Utils.generateId(),
                name: nameCandidate,
                position: requiredTemplate[i] || pick(POSITIONS),
                attributes,
                ovr,
                photo: null,
                createdAt: new Date().toISOString(),
                groupId: currentGroup.id,
                personId: currentPerson.id
            });
        }

        filtered.push(...newPlayers);
        localStorage.setItem(Storage.KEYS.PLAYERS, JSON.stringify(filtered));
        console.log('[Seed] Jugadores generados:', newPlayers.map(p => `${p.name} (${p.position} OVR:${p.ovr})`));
    }

    async function seedDemoData(force = false) {
        if (typeof Storage === 'undefined' || typeof Utils === 'undefined') {
            console.error('[Seed] Dependencias no cargadas');
            return;
        }
        const { currentPerson, currentGroup } = ensureCoreEntities(force);
        seedPlayers(currentPerson, currentGroup, force);
        // Actualizar cabecera UI si ya existe
        if (window.UI && UI.updateGroupContextHeaders) {
            UI.updateGroupContextHeaders();
        }
        console.log('[Seed] Listo. Usa Utils.balanceTeams(Storage.getPlayers()) para probar el balanceo.');
    }

    window.seedDemoData = seedDemoData;

    if (AUTO_RUN) {
        document.addEventListener('DOMContentLoaded', () => {
            // Autosembrar solo si no hay jugadores en grupo actual
            const cg = Storage.getCurrentGroup();
            const existing = cg ? Storage.getPlayers() : [];
            if (!existing || existing.length < TARGET_COUNT) {
                seedDemoData(false);
            } else {
                console.log('[Seed] Ya hay suficientes jugadores. No se autogenera.');
            }
        });
    }
})();

// seedDemoData is already made globally available above
