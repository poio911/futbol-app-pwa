/**
 * Sistema de Distribución de Puntos para Evaluaciones
 * 
 * Convierte una calificación general (1-10) en estadísticas específicas
 * basándose en la posición del jugador y pesos predefinidos
 */

class EvaluationDistribution {
    constructor() {
        // Pesos por posición (qué tan importante es cada stat para cada posición)
        this.positionWeights = {
            'Portero': {
                pace: 0.05,
                shooting: 0.05,
                passing: 0.15,
                dribbling: 0.10,
                defending: 0.35,
                physical: 0.30
            },
            'Defensa Central': {
                pace: 0.10,
                shooting: 0.05,
                passing: 0.15,
                dribbling: 0.10,
                defending: 0.40,
                physical: 0.20
            },
            'Lateral': {
                pace: 0.20,
                shooting: 0.10,
                passing: 0.20,
                dribbling: 0.15,
                defending: 0.25,
                physical: 0.10
            },
            'Mediocampista Defensivo': {
                pace: 0.10,
                shooting: 0.10,
                passing: 0.25,
                dribbling: 0.15,
                defending: 0.25,
                physical: 0.15
            },
            'Mediocampista Central': {
                pace: 0.15,
                shooting: 0.15,
                passing: 0.30,
                dribbling: 0.20,
                defending: 0.10,
                physical: 0.10
            },
            'Mediocampista Ofensivo': {
                pace: 0.15,
                shooting: 0.20,
                passing: 0.25,
                dribbling: 0.25,
                defending: 0.05,
                physical: 0.10
            },
            'Extremo': {
                pace: 0.30,
                shooting: 0.15,
                passing: 0.15,
                dribbling: 0.30,
                defending: 0.05,
                physical: 0.05
            },
            'Delantero': {
                pace: 0.20,
                shooting: 0.35,
                passing: 0.10,
                dribbling: 0.20,
                defending: 0.05,
                physical: 0.10
            }
        };

        // Mapeo de calificación general a rango de estadísticas
        this.ratingRanges = {
            1: { min: 40, max: 49 },  // Muy bajo
            2: { min: 50, max: 54 },  // Bajo
            3: { min: 55, max: 59 },  // Por debajo del promedio
            4: { min: 60, max: 64 },  // Ligeramente por debajo
            5: { min: 65, max: 69 },  // Promedio
            6: { min: 70, max: 74 },  // Ligeramente por encima
            7: { min: 75, max: 79 },  // Bueno
            8: { min: 80, max: 84 },  // Muy bueno
            9: { min: 85, max: 89 },  // Excelente
            10: { min: 90, max: 99 }  // Excepcional
        };
    }

    /**
     * Distribuye una calificación general en estadísticas específicas
     * @param {number} generalRating - Calificación general (1-10)
     * @param {string} position - Posición del jugador
     * @param {Object} currentStats - Estadísticas actuales del jugador (opcional)
     * @returns {Object} Estadísticas distribuidas
     */
    distributeRating(generalRating, position, currentStats = null) {
        const weights = this.positionWeights[position] || this.positionWeights['Mediocampista Central'];
        const range = this.ratingRanges[generalRating];
        
        // Base para las estadísticas
        const baseValue = (range.min + range.max) / 2;
        const variance = (range.max - range.min) / 2;
        
        const stats = {};
        const statNames = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
        
        // Si hay estadísticas actuales, las usamos como referencia
        if (currentStats) {
            statNames.forEach(stat => {
                // Ajustamos las stats actuales hacia el rango objetivo
                const currentValue = currentStats[stat] || baseValue;
                const weight = weights[stat];
                
                // Mayor peso = más cercano al valor objetivo
                // Menor peso = más variación permitida
                const targetValue = baseValue + (variance * weight * 2 - variance);
                
                // Interpolación suave entre valor actual y objetivo
                stats[stat] = Math.round(
                    currentValue * 0.3 + targetValue * 0.7
                );
                
                // Asegurar que esté dentro del rango
                stats[stat] = Math.max(range.min, Math.min(range.max, stats[stat]));
            });
        } else {
            // Sin stats actuales, distribuimos según los pesos
            statNames.forEach(stat => {
                const weight = weights[stat];
                
                // Las estadísticas con mayor peso obtienen valores más altos dentro del rango
                const adjustment = (weight - 0.167) * variance * 3; // 0.167 es el peso promedio (1/6)
                stats[stat] = Math.round(baseValue + adjustment);
                
                // Asegurar que esté dentro del rango válido
                stats[stat] = Math.max(range.min, Math.min(range.max, stats[stat]));
            });
        }
        
        // Añadir algo de variación aleatoria (±2 puntos)
        statNames.forEach(stat => {
            const randomAdjustment = Math.floor(Math.random() * 5) - 2;
            stats[stat] = Math.max(
                range.min, 
                Math.min(range.max, stats[stat] + randomAdjustment)
            );
        });
        
        return stats;
    }

    /**
     * Calcula el OVR a partir de estadísticas individuales y posición
     * @param {Object} stats - Estadísticas del jugador
     * @param {string} position - Posición del jugador
     * @returns {number} OVR calculado
     */
    calculateOVR(stats, position) {
        const weights = this.positionWeights[position] || this.positionWeights['Mediocampista Central'];
        let weightedSum = 0;
        let totalWeight = 0;
        
        Object.keys(stats).forEach(stat => {
            if (weights[stat]) {
                weightedSum += stats[stat] * weights[stat];
                totalWeight += weights[stat];
            }
        });
        
        return Math.round(weightedSum / totalWeight);
    }

    /**
     * Convierte estadísticas a una calificación general (1-10)
     * @param {Object} stats - Estadísticas del jugador
     * @returns {number} Calificación general (1-10)
     */
    statsToGeneralRating(stats) {
        const average = Object.values(stats).reduce((a, b) => a + b, 0) / Object.keys(stats).length;
        
        // Encontrar el rango que mejor se ajusta
        for (let rating = 10; rating >= 1; rating--) {
            const range = this.ratingRanges[rating];
            if (average >= range.min) {
                return rating;
            }
        }
        
        return 1;
    }
}

// Ejemplo de uso
function demonstrateDistribution() {
    const evaluator = new EvaluationDistribution();
    
    // Ejemplo 1: Messi (Delantero) recibe una calificación de 9/10
    console.log("=== Ejemplo 1: Messi (Delantero) - Calificación 9/10 ===");
    const messiStats = evaluator.distributeRating(9, 'Delantero');
    console.log("Estadísticas distribuidas:", messiStats);
    console.log("OVR calculado:", evaluator.calculateOVR(messiStats, 'Delantero'));
    
    // Ejemplo 2: Modrić (Mediocampista Central) recibe 8/10
    console.log("\n=== Ejemplo 2: Modrić (MC) - Calificación 8/10 ===");
    const modricCurrentStats = {
        pace: 75,
        shooting: 82,
        passing: 92,
        dribbling: 88,
        defending: 70,
        physical: 65
    };
    const modricNewStats = evaluator.distributeRating(8, 'Mediocampista Central', modricCurrentStats);
    console.log("Stats actuales:", modricCurrentStats);
    console.log("Stats después de evaluación:", modricNewStats);
    console.log("OVR calculado:", evaluator.calculateOVR(modricNewStats, 'Mediocampista Central'));
    
    // Ejemplo 3: Van Dijk (Defensa Central) recibe 9/10
    console.log("\n=== Ejemplo 3: Van Dijk (DC) - Calificación 9/10 ===");
    const vanDijkStats = evaluator.distributeRating(9, 'Defensa Central');
    console.log("Estadísticas distribuidas:", vanDijkStats);
    console.log("OVR calculado:", evaluator.calculateOVR(vanDijkStats, 'Defensa Central'));
    
    // Mostrar cómo los pesos afectan la distribución
    console.log("\n=== Comparación de Distribución por Posición (Rating: 8/10) ===");
    const positions = ['Portero', 'Defensa Central', 'Mediocampista Central', 'Extremo', 'Delantero'];
    
    positions.forEach(pos => {
        const stats = evaluator.distributeRating(8, pos);
        console.log(`\n${pos}:`);
        console.log(`  Ritmo: ${stats.pace} | Tiro: ${stats.shooting} | Pase: ${stats.passing}`);
        console.log(`  Regate: ${stats.dribbling} | Defensa: ${stats.defending} | Físico: ${stats.physical}`);
        console.log(`  OVR: ${evaluator.calculateOVR(stats, pos)}`);
    });
}

// Exportar para uso en el sistema
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvaluationDistribution;
}