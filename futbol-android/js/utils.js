/**
 * Utils Module - Common utility functions
 * EXPANDED: Added support for Persons and Groups validation
 */
const Utils = {
    /**
     * Calculate player OVR based on attributes
     * @param {Object} attributes - Player attributes object
     * @returns {number} Calculated OVR
     */
    calculateOvr(attributes) {
        const { pac, sho, pas, dri, def, phy } = attributes;
        const sum = pac + sho + pas + dri + def + phy;
        return Math.round(sum / 6);
    },

    /**
     * Calculate team OVR average
     * @param {Array} team - Array of player objects
     * @returns {number} Team average OVR
     */
    calculateTeamOvr(team) {
        if (team.length === 0) return 0;
        
        const sum = team.reduce((total, player) => total + player.ovr, 0);
        return Math.round(sum / team.length);
    },

    /**
     * Generate unique ID
     * @returns {string} Unique timestamp-based ID
     */
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format date for display
     * @param {Date|string} date - Date object or string
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!date) return 'Fecha no válida';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return 'Fecha no válida';
        }
        
        return dateObj.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get OVR color class based on rating
     * @param {number} ovr - Player OVR
     * @returns {string} CSS class name
     */
    getOvrColorClass(ovr) {
        if (ovr < 40) return 'ovr-red';
        if (ovr < 60) return 'ovr-orange';
        if (ovr < 80) return 'ovr-green';
        return 'ovr-cyan';
    },

    /**
     * Validate player data
     * @param {Object} player - Player object to validate
     * @returns {Object} Validation result
     */
    validatePlayer(player) {
        const errors = [];

        if (!player.name || player.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (!player.position || !['POR', 'DEF', 'MED', 'DEL'].includes(player.position)) {
            errors.push('Debe seleccionar una posición válida');
        }

        if (!player.attributes) {
            errors.push('Los atributos son requeridos');
        } else {
            const attrs = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
            attrs.forEach(attr => {
                const value = player.attributes[attr];
                if (typeof value !== 'number' || value < 1 || value > 100) {
                    errors.push(`El atributo ${attr.toUpperCase()} debe estar entre 1 y 100`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Balance teams algorithm
     * @param {Array} players - Array of all players
     * @returns {Object} Balanced teams object
     */
    balanceTeams(players) {
        if (players.length < 2) {
            throw new Error('Se necesitan al menos 2 jugadores para generar equipos');
        }

        // Check if we have group context
        if (!this.hasGroupContext()) {
            throw new Error('Debe seleccionar un grupo activo');
        }

        // Sort players by OVR (highest first)
        const sortedPlayers = [...players].sort((a, b) => b.ovr - a.ovr);

        // Distribute players alternating between teams
        const teamA = [];
        const teamB = [];

        sortedPlayers.forEach((player, index) => {
            if (index % 2 === 0) {
                teamA.push(player);
            } else {
                teamB.push(player);
            }
        });

        const teamAOvr = this.calculateTeamOvr(teamA);
        const teamBOvr = this.calculateTeamOvr(teamB);
        const difference = Math.abs(teamAOvr - teamBOvr);

        return {
            teamA: {
                players: teamA,
                ovr: teamAOvr
            },
            teamB: {
                players: teamB,
                ovr: teamBOvr
            },
            difference,
            groupId: Storage.getCurrentGroup().id
        };
    },

    /**
     * Balance teams with specific format (5v5 or 7v7)
     * @param {Array} players - Array of player objects
     * @param {string} format - '5v5' or '7v7'
     * @returns {Object} Balanced teams object with enhanced stats
     */
    balanceTeamsWithFormat(players, format = '5v5') {
        const playersPerTeam = format === '5v5' ? 5 : 7;
        const totalPlayersNeeded = playersPerTeam * 2;
        
        if (players.length < totalPlayersNeeded) {
            throw new Error(`Se necesitan al menos ${totalPlayersNeeded} jugadores para ${format}`);
        }
        
        // Sort players by OVR for better initial distribution
        const sortedPlayers = [...players].sort((a, b) => b.ovr - a.ovr);
        
        // Use the first N players if more than needed
        const selectedPlayers = sortedPlayers.slice(0, totalPlayersNeeded);
        
        // Enhanced balancing algorithm with position consideration
        const teamA = [];
        const teamB = [];
        
        // Separate by position for better team composition
        const byPosition = {
            POR: [],
            DEF: [],
            MED: [],
            DEL: []
        };
        
        selectedPlayers.forEach(player => {
            if (byPosition[player.position]) {
                byPosition[player.position].push(player);
            }
        });
        
        // Distribute goalkeepers evenly if available
        if (byPosition.POR.length >= 2) {
            teamA.push(byPosition.POR[0]);
            teamB.push(byPosition.POR[1]);
            byPosition.POR = byPosition.POR.slice(2);
        } else if (byPosition.POR.length === 1) {
            teamA.push(byPosition.POR[0]);
            byPosition.POR = [];
        }
        
        // Combine remaining players
        const remainingPlayers = [
            ...byPosition.POR,
            ...byPosition.DEF,
            ...byPosition.MED,
            ...byPosition.DEL
        ].sort((a, b) => b.ovr - a.ovr);
        
        // Distribute remaining players using greedy algorithm for balance
        remainingPlayers.forEach(player => {
            const teamATotal = teamA.reduce((sum, p) => sum + p.ovr, 0);
            const teamBTotal = teamB.reduce((sum, p) => sum + p.ovr, 0);
            const teamAAvg = teamA.length ? teamATotal / teamA.length : 0;
            const teamBAvg = teamB.length ? teamBTotal / teamB.length : 0;
            
            // Add to team with fewer players or lower average OVR
            if (teamA.length < playersPerTeam && 
                (teamB.length >= playersPerTeam || teamAAvg <= teamBAvg)) {
                teamA.push(player);
            } else if (teamB.length < playersPerTeam) {
                teamB.push(player);
            } else {
                // Should not reach here, but add to smaller team as fallback
                if (teamA.length < teamB.length) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            }
        });
        
        // Calculate final team stats
        const teamATotal = teamA.reduce((sum, p) => sum + p.ovr, 0);
        const teamBTotal = teamB.reduce((sum, p) => sum + p.ovr, 0);
        const teamAOvr = Math.round(teamATotal / teamA.length) || 0;
        const teamBOvr = Math.round(teamBTotal / teamB.length) || 0;
        const difference = Math.abs(teamAOvr - teamBOvr);
        
        return {
            teamA: {
                players: teamA,
                ovr: teamAOvr
            },
            teamB: {
                players: teamB,
                ovr: teamBOvr
            },
            difference: difference,
            format: format,
            totalPlayers: totalPlayersNeeded,
            groupId: Storage.getCurrentGroup()?.id || null
        };
    },


    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if file is valid image
     * @param {File} file - File object
     * @returns {boolean} True if valid image
     */
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        return validTypes.includes(file.type) && file.size <= maxSize;
    },

    /**
     * Convert file to base64
     * @param {File} file - File object
     * @returns {Promise<string>} Base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * NEW: PERSON VALIDATION AND UTILITIES
     */

    /**
     * Validate person data
     * @param {Object} person - Person object to validate
     * @returns {Object} Validation result
     */
    validatePerson(person) {
        const errors = [];

        if (!person.name || person.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (person.name && person.name.trim().length > 50) {
            errors.push('El nombre no puede exceder 50 caracteres');
        }

        if (!person.email || !this.isValidEmail(person.email)) {
            errors.push('Debe proporcionar un email válido');
        }

        if (person.phone && !this.isValidPhone(person.phone)) {
            errors.push('El teléfono debe tener un formato válido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone format (basic validation)
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if valid phone
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    /**
     * NEW: GROUP VALIDATION AND UTILITIES
     */

    /**
     * Validate group data
     * @param {Object} group - Group object to validate
     * @returns {Object} Validation result
     */
    validateGroup(group) {
        const errors = [];

        if (!group.name || group.name.trim().length < 3) {
            errors.push('El nombre del grupo debe tener al menos 3 caracteres');
        }

        if (group.name && group.name.trim().length > 50) {
            errors.push('El nombre del grupo no puede exceder 50 caracteres');
        }

        if (!group.description || group.description.trim().length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres');
        }

        if (group.description && group.description.trim().length > 200) {
            errors.push('La descripción no puede exceder 200 caracteres');
        }

        if (!group.schedule || group.schedule.trim().length < 5) {
            errors.push('Debe especificar un horario/día para el grupo');
        }

        if (group.maxMembers && (group.maxMembers < 2 || group.maxMembers > 50)) {
            errors.push('El número máximo de miembros debe estar entre 2 y 50');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Generate group code for easy joining
     * @returns {string} 6-character group code
     */
    generateGroupCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * NEW: SESSION AND CONTEXT UTILITIES
     */

    /**
     * Check if user session is valid
     * @returns {boolean} True if valid session
     */
    hasValidSession() {
        const currentPerson = Storage.getCurrentPerson();
        return currentPerson !== null;
    },

    /**
     * Check if group context is set
     * @returns {boolean} True if group is selected
     */
    hasGroupContext() {
        const currentGroup = Storage.getCurrentGroup();
        return currentGroup !== null;
    },

    /**
     * Get session status
     * @returns {Object} Session status object
     */
    getSessionStatus() {
        return {
            hasPerson: this.hasValidSession(),
            hasGroup: this.hasGroupContext(),
            person: Storage.getCurrentPerson(),
            group: Storage.getCurrentGroup()
        };
    },

    /**
     * NEW: NAVIGATION HELPERS
     */

    /**
     * Check if user needs to complete setup
     * @returns {Object} Setup status
     */
    getSetupStatus() {
        const hasPerson = this.hasValidSession();
        const hasGroup = this.hasGroupContext();
        
        return {
            needsPersonSetup: !hasPerson,
            needsGroupSetup: hasPerson && !hasGroup,
            isReady: hasPerson && hasGroup,
            nextStep: !hasPerson ? 'person' : (!hasGroup ? 'group' : 'ready')
        };
    },

    /**
     * Get appropriate landing screen based on setup status
     * @returns {string} Screen ID to navigate to
     */
    getLandingScreen() {
        const setup = this.getSetupStatus();
        
        if (setup.needsPersonSetup) {
            return 'person-setup-screen';
        } else if (setup.needsGroupSetup) {
            return 'group-setup-screen';
        } else {
            return 'register-screen'; // Default to player registration
        }
    },

    /**
     * NEW: TEXT AND FORMATTING UTILITIES
     */

    /**
     * Sanitize text input
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        if (!text) return '';
        return text.trim().replace(/[<>]/g, '');
    },

    /**
     * Format group member count
     * @param {number} count - Number of members
     * @returns {string} Formatted member count
     */
    formatMemberCount(count) {
        if (count === 1) return '1 miembro';
        return `${count} miembros`;
    },

    /**
     * Format group schedule display
     * @param {string} schedule - Group schedule
     * @returns {string} Formatted schedule
     */
    formatSchedule(schedule) {
        // Basic formatting - could be expanded
        return schedule.charAt(0).toUpperCase() + schedule.slice(1).toLowerCase();
    },

    /**
     * NEW: DATA MIGRATION UTILITIES
     */

    /**
     * Migrate legacy players to group system
     * @param {string} defaultGroupId - ID of default group for legacy players
     * @returns {boolean} Success status
     */
    migrateLegacyPlayers(defaultGroupId) {
        try {
            const allPlayers = JSON.parse(localStorage.getItem('futbol_stats_players')) || [];
            let migrated = 0;

            allPlayers.forEach(player => {
                if (!player.groupId) {
                    player.groupId = defaultGroupId;
                    player.personId = Storage.getCurrentPerson()?.id || null;
                    migrated++;
                }
            });

            if (migrated > 0) {
                localStorage.setItem('futbol_stats_players', JSON.stringify(allPlayers));
                console.log(`Migrated ${migrated} legacy players to group system`);
            }

            return true;
        } catch (error) {
            console.error('Error migrating legacy players:', error);
            return false;
        }
    },

    /**
     * Create default group for new users
     * @param {string} personId - ID of person creating the group
     * @returns {Object} Created group object
     */
    createDefaultGroup(personId) {
        const person = Storage.getPersonById(personId);
        const defaultGroup = {
            id: this.generateId(),
            name: `Grupo de ${person.name}`,
            description: 'Grupo personal para organizar partidos',
            schedule: 'Por definir',
            createdBy: personId,
            createdAt: new Date().toISOString(),
            isPrivate: false,
            maxMembers: 20,
            code: this.generateGroupCode()
        };

        return defaultGroup;
    },

    /**
     * QUICK WINS: Utility functions for enhanced UX
     */

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted relative time
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `hace ${interval} ${unit}${interval > 1 ? 's' : ''}`;
            }
        }
        
        return 'hace unos segundos';
    },

    /**
     * Get player availability status
     * @param {string} playerId - Player ID
     * @param {string} matchId - Match ID
     * @returns {string} Status: 'confirmed', 'pending', 'declined'
     */
    getPlayerAvailability(playerId, matchId) {
        // This would check against a confirmations system
        // For now, return random status for demo
        const statuses = ['confirmed', 'pending', 'declined'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    },

    /**
     * Calculate group statistics
     * @param {string} groupId - Group ID
     * @returns {Object} Group statistics
     */
    calculateGroupStats(groupId) {
        const players = Storage.getPlayers().filter(p => p.groupId === groupId);
        const matches = Storage.getMatches().filter(m => m.groupId === groupId);
        
        return {
            totalPlayers: players.length,
            totalMatches: matches.length,
            averageOVR: players.length > 0 
                ? Math.round(players.reduce((sum, p) => sum + p.ovr, 0) / players.length)
                : 0,
            positionDistribution: {
                POR: players.filter(p => p.position === 'POR').length,
                DEF: players.filter(p => p.position === 'DEF').length,
                MED: players.filter(p => p.position === 'MED').length,
                DEL: players.filter(p => p.position === 'DEL').length
            },
            lastMatch: matches.length > 0 
                ? matches[matches.length - 1].date
                : null
        };
    },

    /**
     * Generate shareable group invite link
     * @param {string} groupCode - Group code
     * @returns {string} Shareable URL
     */
    generateInviteLink(groupCode) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?join=${groupCode}`;
    },

    /**
     * Parse URL parameters
     * @returns {Object} URL parameters
     */
    getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        }
        
        return params;
    }
};

// Make Utils globally available
window.Utils = Utils;
