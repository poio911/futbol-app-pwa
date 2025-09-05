/**
 * Enhanced Players View System
 * Provides an improved UI for displaying player stats with Firebase integration
 */

const PlayersViewEnhanced = {
    // Initialize the enhanced players view
    init() {
        console.log('🎮 Initializing Enhanced Players View...');
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Listen for players screen activation
        document.addEventListener('screenChanged', (e) => {
            if (e.detail === 'players-screen') {
                this.loadAndDisplayPlayers();
            }
        });
    },

    // Load players from Firebase and display them
    async loadAndDisplayPlayers() {
        try {
            console.log('📊 Loading players from Firebase...');
            console.log('🎯 loadAndDisplayPlayers called - enhanced view active');
            
            // Load players from Storage (which uses Firebase)
            if (typeof Storage !== 'undefined' && Storage.loadPlayersFromFirebase) {
                await Storage.loadPlayersFromFirebase();
            }
            
            // Get players data
            const players = Storage.getPlayers ? Storage.getPlayers() : [];
            console.log(`📊 Loaded ${players.length} players`);
            
            // Display players with enhanced UI
            this.displayPlayers(players);
        } catch (error) {
            console.error('❌ Error loading players:', error);
            this.displayError('No se pudieron cargar los jugadores');
        }
    },

    // Display players with enhanced UI
    displayPlayers(players) {
        const container = document.getElementById('players-list');
        if (!container) return;

        if (!players || players.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No hay jugadores cargados</p>';
            return;
        }

        // Clear existing content
        container.innerHTML = '';
        
        // Sort players by OVR (highest first)
        const sortedPlayers = [...players].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        
        // Render each player card
        sortedPlayers.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            container.appendChild(playerCard);
        });
    },

    // Create enhanced player card
    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        // Get player data (compatible with both formats)
        const playerName = player.name || player.nombre || 'Jugador';
        const playerPosition = player.position || player.posicion || 'Sin Posición';
        
        // Calculate player stats ONCE and store them
        const stats = this.calculatePlayerStats(player);
        const tags = this.getPlayerTags(player, stats);
        
        // Store stats in data attribute for later use
        card.setAttribute('data-player-stats', JSON.stringify(stats));
        
        card.innerHTML = `
            <div class="player-header" onclick="PlayersViewEnhanced.togglePlayerDetails('${player.id}')">
                <div class="player-basic-info">
                    <div class="player-photo">${this.getPlayerPhoto(player)}</div>
                    <div class="player-info">
                        <div class="player-name">${playerName}</div>
                        <div class="player-position ${this.getPositionClass(playerPosition)}">${this.getFullPositionName(playerPosition)}</div>
                    </div>
                </div>
                <div class="player-rating-section">
                    <div class="player-rating ${this.getOVRClass(player.ovr)}">${player.ovr || 50}</div>
                    <span class="expand-icon" id="icon-${player.id}">⌄</span>
                </div>
            </div>
            
            <div class="player-details" id="details-${player.id}">
                ${tags.length > 0 ? `
                    <div class="player-tags">
                        ${tags.map(tag => `
                            <span class="player-tag ${tag.class}">${tag.text}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="radar-section">
                    <div class="radar-container">
                        <div class="radar-chart">
                            <svg class="radar-svg" viewBox="0 0 180 180">
                                <!-- Hexagon grid rings -->
                                <g class="radar-rings">
                                    <polygon points="90,15 141,45 141,135 90,165 39,135 39,45" class="radar-grid"/>
                                    <polygon points="90,27 129,51 129,129 90,153 51,129 51,51" class="radar-grid"/>
                                    <polygon points="90,39 117,57 117,123 90,141 63,123 63,57" class="radar-grid"/>
                                    <polygon points="90,51 105,63 105,117 90,129 75,117 75,63" class="radar-grid"/>
                                </g>
                                
                                <!-- Grid lines from center -->
                                <g class="radar-spokes">
                                    <line x1="90" y1="90" x2="90" y2="15" class="radar-line"/>
                                    <line x1="90" y1="90" x2="141" y2="45" class="radar-line"/>
                                    <line x1="90" y1="90" x2="141" y2="135" class="radar-line"/>
                                    <line x1="90" y1="90" x2="90" y2="165" class="radar-line"/>
                                    <line x1="90" y1="90" x2="39" y2="135" class="radar-line"/>
                                    <line x1="90" y1="90" x2="39" y2="45" class="radar-line"/>
                                </g>
                                
                                <!-- Player data polygon -->
                                <polygon id="radar-area-${player.id}" class="radar-area" points=""/>
                                
                                <!-- Player data points -->
                                <g id="radar-points-${player.id}"></g>
                            </svg>
                            
                            <div class="stat-labels">
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">PAC</span>
                                    <span class="stat-label-value" id="radar-pac-${player.id}">${stats.pac}</span>
                                </div>
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">SHO</span>
                                    <span class="stat-label-value" id="radar-sho-${player.id}">${stats.sho}</span>
                                </div>
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">PAS</span>
                                    <span class="stat-label-value" id="radar-pas-${player.id}">${stats.pas}</span>
                                </div>
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">DRI</span>
                                    <span class="stat-label-value" id="radar-dri-${player.id}">${stats.dri}</span>
                                </div>
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">DEF</span>
                                    <span class="stat-label-value" id="radar-def-${player.id}">${stats.def}</span>
                                </div>
                                <div class="stat-label-positioned">
                                    <span class="stat-label-name">PHY</span>
                                    <span class="stat-label-value" id="radar-phy-${player.id}">${stats.phy}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Estadísticas de partidos ocultas temporalmente -->
                <div class="matches-info" style="display: none;">
                    <div class="matches-stat">
                        <div class="matches-number">${player.matchesPlayed || 0}</div>
                        <div class="matches-label">Partidos</div>
                    </div>
                    <div class="matches-stat">
                        <div class="matches-number">${player.goals || 0}</div>
                        <div class="matches-label">Goles</div>
                    </div>
                    <div class="matches-stat">
                        <div class="matches-number">${player.assists || 0}</div>
                        <div class="matches-label">Asistencias</div>
                    </div>
                    <div class="matches-stat">
                        <div class="matches-number">${this.calculateAverage(player)}</div>
                        <div class="matches-label">Promedio G+A</div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize radar chart with correct stats after card is created
        setTimeout(() => {
            this.updateRadarChartWithStats(player.id, stats);
        }, 100);
        
        return card;
    },

    // Calculate player stats based on position and OVR
    calculatePlayerStats(player) {
        // Debug log only for problematic players
        const playerName = player.name || player.nombre || '';
        if (playerName.toLowerCase().includes('pela') || playerName.toLowerCase().includes('polo')) {
            console.log('Debug - Player data:', {
                name: playerName,
                hasAttributes: !!player.attributes,
                attributes: player.attributes,
                directStats: {
                    pac: player.pac,
                    sho: player.sho,
                    pas: player.pas,
                    dri: player.dri,
                    def: player.def,
                    phy: player.phy
                },
                ovr: player.ovr,
                position: player.position || player.posicion
            });
        }
        
        // Check if player has actual attributes/stats
        if (player.attributes && Object.keys(player.attributes).length > 0) {
            // Ensure all stats have values, use 50 as default if missing
            return {
                pac: player.attributes.pac || player.attributes.PAC || 50,
                sho: player.attributes.sho || player.attributes.SHO || 50,
                pas: player.attributes.pas || player.attributes.PAS || 50,
                dri: player.attributes.dri || player.attributes.DRI || 50,
                def: player.attributes.def || player.attributes.DEF || 50,
                phy: player.attributes.phy || player.attributes.PHY || 50
            };
        }
        
        // If player has individual stats directly on the object
        if (player.pac !== undefined || player.sho !== undefined || 
            player.PAC !== undefined || player.SHO !== undefined) {
            return {
                pac: player.pac || player.PAC || 50,
                sho: player.sho || player.SHO || 50,
                pas: player.pas || player.PAS || 50,
                dri: player.dri || player.DRI || 50,
                def: player.def || player.DEF || 50,
                phy: player.phy || player.PHY || 50
            };
        }
        
        // Otherwise calculate based on OVR and position
        const ovr = player.ovr || 50;
        const position = player.position || player.posicion || '';
        
        // Base stats derived from OVR with position modifiers
        let stats = {
            pac: ovr,
            sho: ovr,
            pas: ovr,
            dri: ovr,
            def: ovr,
            phy: ovr
        };
        
        // Apply position-specific modifiers
        switch(position.toLowerCase()) {
            case 'portero':
            case 'por':
                stats.pac = Math.max(30, ovr - 35);
                stats.sho = Math.max(20, ovr - 45);
                stats.pas = Math.min(99, ovr + 5);
                stats.dri = Math.max(30, ovr - 10);
                stats.def = Math.max(40, ovr - 15);
                stats.phy = Math.max(40, ovr - 5);
                break;
            case 'defensor':
            case 'def':
                stats.pac = Math.max(40, ovr - 10);
                stats.sho = Math.max(30, ovr - 30);
                stats.pas = Math.max(40, ovr - 15);
                stats.dri = Math.max(40, ovr - 20);
                stats.def = Math.min(99, ovr + 10);
                stats.phy = Math.min(99, ovr + 5);
                break;
            case 'centrocampista':
            case 'med':
            case 'mediocampista':
                stats.pac = Math.max(50, ovr - 10);
                stats.sho = Math.max(50, ovr - 5);
                stats.pas = Math.min(99, ovr + 5);
                stats.dri = Math.min(99, ovr);
                stats.def = Math.max(40, ovr - 15);
                stats.phy = Math.max(50, ovr - 5);
                break;
            case 'delantero':
            case 'del':
                stats.pac = Math.min(99, ovr + 5);
                stats.sho = Math.min(99, ovr + 10);
                stats.pas = Math.max(50, ovr - 10);
                stats.dri = Math.min(99, ovr + 5);
                stats.def = Math.max(25, ovr - 35);
                stats.phy = Math.max(50, ovr - 5);
                break;
            default:
                // Default balanced stats for unknown positions
                stats.pac = ovr;
                stats.sho = ovr;
                stats.pas = ovr;
                stats.dri = ovr;
                stats.def = ovr;
                stats.phy = ovr;
        }
        
        // Ensure all stats are within valid range (no randomness)
        Object.keys(stats).forEach(key => {
            stats[key] = Math.max(1, Math.min(99, Math.round(stats[key])));
        });
        
        return stats;
    },

    // Get player tags based on stats
    getPlayerTags(player, stats) {
        const tags = [];
        const ovr = player.ovr || 50;
        const position = player.position || player.posicion || '';
        
        // Shooting tags
        if (stats.sho >= 90) {
            tags.push({ text: '🎯 Francotirador', class: 'legendary' });
        } else if (stats.sho >= 85) {
            tags.push({ text: '⚡ Cañón', class: 'elite' });
        } else if (stats.sho >= 80) {
            tags.push({ text: '🔥 Buen Remate', class: '' });
        }
        
        // Pace tags
        if (stats.pac >= 90) {
            tags.push({ text: '💨 Velocista', class: 'legendary' });
        } else if (stats.pac >= 85) {
            tags.push({ text: '🏃 Rápido', class: '' });
        }
        
        // Passing tags
        if (stats.pas >= 90) {
            tags.push({ text: '🎨 Maestro del Pase', class: 'legendary' });
        } else if (stats.pas >= 85) {
            tags.push({ text: '📐 Visión de Juego', class: 'elite' });
        }
        
        // Dribbling tags
        if (stats.dri >= 90) {
            tags.push({ text: '🕺 Mago del Balón', class: 'legendary' });
        } else if (stats.dri >= 85) {
            tags.push({ text: '⚡ Gran Regate', class: 'elite' });
        }
        
        // Defense tags
        if (stats.def >= 90) {
            tags.push({ text: '🛡️ Muro Infranqueable', class: 'legendary' });
        } else if (stats.def >= 85) {
            tags.push({ text: '🚫 Defensor Sólido', class: 'elite' });
        } else if (stats.def >= 80) {
            tags.push({ text: '💪 Buena Marca', class: '' });
        }
        
        // Physical tags
        if (stats.phy >= 85) {
            tags.push({ text: '💪 Tanque', class: 'elite' });
        } else if (stats.phy >= 80) {
            tags.push({ text: '⚔️ Guerrero', class: '' });
        }
        
        // Position specific
        if ((position === 'Portero' || position === 'POR') && ovr >= 85) {
            tags.push({ text: '🧤 Manos Seguras', class: 'elite' });
        }
        
        // Overall rating tags
        if (ovr >= 90) {
            tags.push({ text: '⭐ Clase Mundial', class: 'legendary' });
        } else if (ovr >= 88) {
            tags.push({ text: '🌟 Crack', class: 'elite' });
        }
        
        // Experience based on matches
        if (player.matchesPlayed >= 100) {
            tags.push({ text: '🎖️ Veterano', class: '' });
        } else if (player.matchesPlayed >= 50) {
            tags.push({ text: '📈 Experimentado', class: '' });
        }
        
        // Goal scorer
        if (player.goals >= 50) {
            tags.push({ text: '⚽ Goleador', class: 'legendary' });
        }
        
        // Playmaker
        if (player.assists >= 50) {
            tags.push({ text: '👁️ Asistidor', class: 'elite' });
        }
        
        return tags;
    },

    // Toggle player details expansion
    togglePlayerDetails(playerId) {
        const details = document.getElementById(`details-${playerId}`);
        const icon = document.getElementById(`icon-${playerId}`);
        
        if (!details || !icon) return;
        
        if (details.classList.contains('expanded')) {
            details.classList.remove('expanded');
            icon.classList.remove('rotated');
        } else {
            details.classList.add('expanded');
            icon.classList.add('rotated');
            
            // Get the player card element
            const playerCard = details.closest('.player-card');
            if (playerCard) {
                // Get stored stats from data attribute
                const storedStats = playerCard.getAttribute('data-player-stats');
                if (storedStats) {
                    const stats = JSON.parse(storedStats);
                    setTimeout(() => this.updateRadarChartWithStats(playerId, stats), 200);
                }
            }
        }
    },

    // Update radar chart with pre-calculated stats
    updateRadarChartWithStats(playerId, stats) {
        const center = { x: 90, y: 90 };
        const maxRadius = 60;
        const statValues = [stats.pac, stats.sho, stats.pas, stats.dri, stats.def, stats.phy];
        
        // Only log for debugging specific players
        const playerElement = document.querySelector(`#details-${playerId}`);
        if (playerElement && playerElement.textContent.includes('Pela')) {
            console.log(`Updating radar for player ${playerId} with stats:`, stats, 'Values:', statValues);
        }
        
        // Calculate points for hexagon
        const points = statValues.map((stat, index) => {
            const angle = (index * 60) * (Math.PI / 180);
            const radius = (stat / 100) * maxRadius;
            const x = center.x + Math.cos(angle - Math.PI / 2) * radius;
            const y = center.y + Math.sin(angle - Math.PI / 2) * radius;
            return `${x},${y}`;
        });
        
        // Update polygon
        const polygon = document.getElementById(`radar-area-${playerId}`);
        if (polygon) {
            polygon.setAttribute('points', points.join(' '));
        }
        
        // Update points
        const pointsGroup = document.getElementById(`radar-points-${playerId}`);
        if (pointsGroup) {
            pointsGroup.innerHTML = '';
            
            statValues.forEach((stat, index) => {
                const angle = (index * 60) * (Math.PI / 180);
                const radius = (stat / 100) * maxRadius;
                const x = center.x + Math.cos(angle - Math.PI / 2) * radius;
                const y = center.y + Math.sin(angle - Math.PI / 2) * radius;
                
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '3');
                circle.setAttribute('class', 'radar-point');
                pointsGroup.appendChild(circle);
            });
        }
    },

    // Helper functions
    getPlayerPhoto(player) {
        console.log('🎯 getPlayerPhoto called for player:', player);
        
        // If player has a real photo (not an emoji), show the image
        if (player && player.photo && player.photo !== '👤' && player.photo.startsWith('data:image/')) {
            console.log('📸 Player has real photo:', player.photo.substring(0, 50) + '...');
            return `<img src="${player.photo}" alt="${player.name || 'Jugador'}">`;
        }
        
        // Generate colorful avatar with initials for players without photo
        const playerName = player.name || player.nombre || '';
        const initials = this.getPlayerInitials(playerName);
        console.log(`👤 Player "${playerName}" -> generating colorful avatar with initials: "${initials}"`);
        
        // If we couldn't get proper initials, show default icon
        if (initials === '?' || !playerName || playerName === 'Jugador') {
            console.log('🔧 Using default icon for:', playerName);
            return '<i class="bx bx-user"></i>';
        }
        
        const colors = this.generateConsistentColors(playerName);
        console.log(`🎨 Generated colors for "${playerName}":`, colors);
        return `<div class="avatar-initials" style="background: ${colors.background}; color: ${colors.text};">${initials}</div>`;
    },

    // Get player initials (first letter of first and last name)
    getPlayerInitials(name) {
        if (!name || name === 'Jugador') return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    },

    // Generate consistent colors based on player name
    generateConsistentColors(name) {
        if (!name) name = 'Default';
        
        // Create hash from name for consistency
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Define color palette
        const colorPalettes = [
            { background: '#FF6B6B', text: '#FFFFFF' }, // Red
            { background: '#4ECDC4', text: '#FFFFFF' }, // Teal  
            { background: '#45B7D1', text: '#FFFFFF' }, // Blue
            { background: '#96CEB4', text: '#FFFFFF' }, // Green
            { background: '#FFEAA7', text: '#2D3436' }, // Yellow
            { background: '#DDA0DD', text: '#FFFFFF' }, // Plum
            { background: '#98D8C8', text: '#2D3436' }, // Mint
            { background: '#F7DC6F', text: '#2D3436' }, // Light Yellow
            { background: '#BB8FCE', text: '#FFFFFF' }, // Light Purple
            { background: '#85C1E9', text: '#FFFFFF' }, // Light Blue
            { background: '#F8C471', text: '#2D3436' }, // Orange
            { background: '#82E0AA', text: '#2D3436' }, // Light Green
        ];
        
        // Select color based on hash
        const colorIndex = Math.abs(hash) % colorPalettes.length;
        return colorPalettes[colorIndex];
    },

    getFullPositionName(position) {
        if (!position) return 'Sin Posición';
        
        const positionNames = {
            'POR': 'Portero',
            'DEF': 'Defensor',
            'MED': 'Mediocampista',
            'DEL': 'Delantero',
            'Portero': 'Portero',
            'Defensor': 'Defensor',
            'Mediocampista': 'Mediocampista',
            'Centrocampista': 'Centrocampista',
            'Delantero': 'Delantero'
        };
        
        return positionNames[position] || position;
    },

    getPositionClass(position) {
        if (!position) return '';
        const positionMap = {
            'Portero': 'position-Portero',
            'POR': 'position-POR',
            'Defensor': 'position-Defensor',
            'DEF': 'position-DEF',
            'Centrocampista': 'position-Centrocampista',
            'Mediocampista': 'position-Centrocampista',
            'MED': 'position-MED',
            'Delantero': 'position-Delantero',
            'DEL': 'position-DEL'
        };
        return positionMap[position] || 'position-' + position;
    },

    getOVRClass(ovr) {
        if (!ovr) return 'ovr-low';
        if (ovr >= 90) return 'ovr-special';
        if (ovr >= 85) return 'ovr-excellent';
        if (ovr >= 80) return 'ovr-gold';
        if (ovr >= 70) return 'ovr-silver';
        if (ovr >= 60) return 'ovr-bronze';
        return 'ovr-low';
    },

    calculateAverage(player) {
        const matches = player.matchesPlayed || 0;
        const goals = player.goals || 0;
        const assists = player.assists || 0;
        
        if (matches === 0) return '0.00';
        return ((goals + assists) / matches).toFixed(2);
    },

    displayError(message) {
        const container = document.getElementById('players-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="margin-bottom: 10px;">⚠️</p>
                <p>${message}</p>
                <button onclick="PlayersViewEnhanced.loadAndDisplayPlayers()" 
                        style="margin-top: 20px; padding: 10px 20px; background: var(--primary); 
                               color: var(--dark); border: none; border-radius: 8px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PlayersViewEnhanced.init());
} else {
    PlayersViewEnhanced.init();
}