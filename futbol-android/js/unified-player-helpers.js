/* ====================================
   SISTEMA UNIFICADO DE HELPERS PARA JUGADORES
   ==================================== */

class UnifiedPlayerHelpers {
    
    /**
     * Iconos unificados para estadísticas
     */
    static getStatIcon(statKey) {
        const iconMap = {
            'pac': 'bx bx-run',           // Velocidad
            'sho': 'bx bx-target-lock',   // Tiro
            'pas': 'bx bx-share',         // Pase
            'dri': 'bx bx-joystick',      // Regate
            'def': 'bx bx-shield',        // Defensa
            'phy': 'bx bx-body'           // Físico
        };
        return iconMap[statKey] || 'bx bx-question-mark';
    }
    
    /**
     * Nombres unificados para estadísticas
     */
    static getStatName(statKey) {
        const nameMap = {
            'pac': 'VEL',  // Velocidad
            'sho': 'TIR',  // Tiro
            'pas': 'PAS',  // Pase
            'dri': 'REG',  // Regate
            'def': 'DEF',  // Defensa
            'phy': 'FÍS'   // Físico
        };
        return nameMap[statKey] || statKey.toUpperCase();
    }
    
    /**
     * Iconos unificados para posiciones
     */
    static getPositionIcon(position) {
        const iconMap = {
            'POR': 'bx bxs-hand',
            'Portero': 'bx bxs-hand',
            'DEF': 'bx bx-shield-alt-2',
            'Defensor': 'bx bx-shield-alt-2',
            'MED': 'bx bx-target-lock',
            'Centrocampista': 'bx bx-target-lock',
            'Mediocampista': 'bx bx-target-lock',
            'DEL': 'bx bx-football',
            'Delantero': 'bx bx-football'
        };
        return iconMap[position] || 'bx bx-user';
    }
    
    /**
     * Clase CSS unificada para posiciones
     */
    static getPositionClass(position) {
        const classMap = {
            'POR': 'pos-por',
            'Portero': 'pos-por',
            'DEF': 'pos-def',
            'Defensor': 'pos-def',
            'MED': 'pos-med',
            'Centrocampista': 'pos-med',
            'Mediocampista': 'pos-med',
            'DEL': 'pos-del',
            'Delantero': 'pos-del'
        };
        return classMap[position] || 'pos-med';
    }
    
    /**
     * Nombre corto unificado para posiciones
     */
    static getPositionShort(position) {
        const shortMap = {
            'Portero': 'POR',
            'Defensor': 'DEF',
            'Centrocampista': 'MED',
            'Mediocampista': 'MED',
            'Delantero': 'DEL'
        };
        return shortMap[position] || position;
    }
    
    /**
     * Calcula la mejor estadística de un jugador
     */
    static getBestStat(stats) {
        if (!stats || typeof stats !== 'object') {
            return {
                key: 'pac',
                name: 'VEL',
                value: 70,
                icon: 'bx bx-run'
            };
        }
        
        let maxStat = 'pac';
        let maxValue = stats.pac || 0;
        
        Object.keys(stats).forEach(statKey => {
            if (stats[statKey] > maxValue) {
                maxStat = statKey;
                maxValue = stats[statKey];
            }
        });
        
        return {
            key: maxStat,
            name: this.getStatName(maxStat),
            value: maxValue,
            icon: this.getStatIcon(maxStat)
        };
    }
    
    /**
     * Genera HTML unificado para badge de posición
     */
    static createPositionBadge(position, includeIcon = true) {
        const posClass = this.getPositionClass(position);
        const posShort = this.getPositionShort(position);
        const icon = includeIcon ? `<i class="${this.getPositionIcon(position)}"></i>` : '';
        
        return `<div class="player-position-badge ${posClass}">
            ${icon}${posShort}
        </div>`;
    }
    
    /**
     * Genera HTML unificado para badge de OVR
     */
    static createOVRBadge(ovr, size = 'normal') {
        const sizeClass = size === 'small' ? 'small' : '';
        return `<div class="ovr-badge ${sizeClass}">${ovr || 70}</div>`;
    }
    
    /**
     * Genera HTML unificado para mejor estadística
     */
    static createBestStatBadge(stats) {
        const bestStat = this.getBestStat(stats);
        return `<div class="best-stat">
            <i class="${bestStat.icon}"></i>
            ${bestStat.name} ${bestStat.value}
        </div>`;
    }
    
    /**
     * Genera HTML para indicador de cambio de OVR
     */
    static createOVRChangeIndicator(oldOVR, newOVR) {
        if (!oldOVR || !newOVR || oldOVR === newOVR) {
            return '';
        }
        
        const diff = newOVR - oldOVR;
        const isIncrease = diff > 0;
        const className = isIncrease ? 'increase' : 'decrease';
        const icon = isIncrease ? 'bx bx-up-arrow' : 'bx bx-down-arrow';
        const symbol = isIncrease ? '+' : '';
        
        return `<div class="ovr-change ${className}">
            <i class="${icon}"></i>
            ${symbol}${diff}
        </div>`;
    }
    
    /**
     * Genera avatar unificado para jugador
     */
    static createPlayerAvatar(player, size = 'normal') {
        const sizeClass = size !== 'normal' ? size : '';
        
        if (player.photo && player.photo.startsWith('data:image')) {
            return `<div class="player-avatar ${sizeClass}">
                <img src="${player.photo}" alt="${player.name || player.displayName}" />
            </div>`;
        }
        
        // Generar iniciales si no hay foto
        const name = player.name || player.displayName || 'Usuario';
        const initials = name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);
        
        return `<div class="player-avatar ${sizeClass}">
            <span class="avatar-initials">${initials}</span>
        </div>`;
    }
    
    /**
     * Genera card completo de información del jugador
     */
    static createPlayerInfoCard(player, options = {}) {
        const {
            showAvatar = true,
            showPosition = true,
            showOVR = true,
            showBestStat = true,
            showOVRChange = false,
            size = 'normal',
            includeIcons = true
        } = options;
        
        const stats = player.stats || this.calculatePlayerStats(player);
        const avatar = showAvatar ? this.createPlayerAvatar(player, size) : '';
        const position = showPosition ? this.createPositionBadge(player.position, includeIcons) : '';
        const ovr = showOVR ? this.createOVRBadge(player.ovr, size) : '';
        const bestStat = showBestStat ? this.createBestStatBadge(stats) : '';
        const ovrChange = showOVRChange && player.originalOVR ? 
            this.createOVRChangeIndicator(player.originalOVR, player.ovr) : '';
        
        return {
            avatar,
            position,
            ovr,
            bestStat,
            ovrChange,
            html: `
                <div class="unified-player-card">
                    ${avatar}
                    <div class="player-info">
                        <h3 class="player-name">${player.name || player.displayName}</h3>
                        <div class="player-details">
                            ${position}
                            ${bestStat}
                            ${ovrChange}
                        </div>
                    </div>
                    ${ovr}
                </div>
            `
        };
    }
    
    /**
     * Calcula estadísticas del jugador (manteniendo compatibilidad)
     */
    static calculatePlayerStats(player) {
        if (player.stats) return player.stats;
        
        // Cálculo basado en OVR si no hay estadísticas específicas
        const baseOVR = player.ovr || 70;
        const variance = 10; // Variación de ±10 puntos
        
        return {
            pac: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2)),
            sho: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2)),
            pas: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2)),
            dri: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2)),
            def: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2)),
            phy: Math.max(30, Math.min(99, baseOVR + Math.floor(Math.random() * variance) - variance/2))
        };
    }
    
    /**
     * Aplicar estilos unificados a elementos existentes
     */
    static applyUnifiedStyles(container = document) {
        // Aplicar clases unificadas a elementos existentes
        const positionElements = container.querySelectorAll('.player-position, .user-position');
        positionElements.forEach(el => {
            const position = el.textContent.trim();
            const posClass = this.getPositionClass(position);
            el.classList.add('player-position-badge', posClass);
        });
        
        const ovrElements = container.querySelectorAll('.player-rating, .ovr-large');
        ovrElements.forEach(el => {
            el.classList.add('ovr-badge');
        });
        
        const bestStatElements = container.querySelectorAll('.best-stat');
        bestStatElements.forEach(el => {
            el.classList.add('best-stat-badge');
        });
    }
}

// Hacer disponible globalmente
window.UnifiedPlayerHelpers = UnifiedPlayerHelpers;