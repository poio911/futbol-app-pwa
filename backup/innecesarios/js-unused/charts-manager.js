/**
 * Charts Manager - Sistema de Gráficos y Estadísticas Avanzadas
 * Utiliza Chart.js para visualización de datos
 */

const ChartsManager = {
    charts: {},
    
    /**
     * Inicializa el sistema de gráficos
     */
    init() {
        console.log('📊 Charts Manager initialized');
        this.setupChartDefaults();
    },
    
    /**
     * Configuración global de Chart.js
     */
    setupChartDefaults() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }
        
        Chart.defaults.color = '#e0e0e0';
        Chart.defaults.font.family = 'Poppins';
        Chart.defaults.plugins.legend.labels.color = '#e0e0e0';
    },
    
    /**
     * Crea gráfico de evolución de OVR
     */
    createOVREvolutionChart(canvasId, playerData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        // Destruir gráfico anterior si existe
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: playerData.dates,
                datasets: [{
                    label: 'OVR',
                    data: playerData.ovr,
                    borderColor: '#00ff9d',
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#00ff9d',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolución del OVR',
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00ff9d',
                        bodyColor: '#e0e0e0',
                        borderColor: '#00ff9d',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Crea gráfico de radar para atributos de jugador
     */
    createPlayerRadarChart(canvasId, player) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const attributes = player.attributes || {};
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Ritmo', 'Tiro', 'Pase', 'Regate', 'Defensa', 'Físico'],
                datasets: [{
                    label: player.name,
                    data: [
                        attributes.pac || 50,
                        attributes.sho || 50,
                        attributes.pas || 50,
                        attributes.dri || 50,
                        attributes.def || 50,
                        attributes.phy || 50
                    ],
                    borderColor: this.getPositionColor(player.position),
                    backgroundColor: this.getPositionColor(player.position, 0.2),
                    borderWidth: 2,
                    pointBackgroundColor: this.getPositionColor(player.position),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Atributos de ${player.name}`,
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#e0e0e0',
                            font: { size: 12 }
                        },
                        ticks: {
                            color: '#e0e0e0',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Crea gráfico de comparación entre jugadores
     */
    createPlayersComparisonChart(canvasId, players) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const datasets = players.map(player => ({
            label: player.name,
            data: [
                player.attributes.pac,
                player.attributes.sho,
                player.attributes.pas,
                player.attributes.dri,
                player.attributes.def,
                player.attributes.phy
            ],
            borderColor: this.getPositionColor(player.position),
            backgroundColor: this.getPositionColor(player.position, 0.1),
            borderWidth: 2
        }));
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Ritmo', 'Tiro', 'Pase', 'Regate', 'Defensa', 'Físico'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparación de Jugadores',
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 15
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#e0e0e0'
                        },
                        ticks: {
                            color: '#e0e0e0',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Crea gráfico de estadísticas del grupo
     */
    createGroupStatsChart(canvasId, stats) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Victorias', 'Empates', 'Derrotas'],
                datasets: [{
                    data: [stats.wins || 0, stats.draws || 0, stats.losses || 0],
                    backgroundColor: [
                        'rgba(0, 255, 157, 0.8)',
                        'rgba(255, 157, 0, 0.8)',
                        'rgba(255, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#00ff9d',
                        '#ff9d00',
                        '#ff4444'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Resultados del Grupo',
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Crea heatmap de rendimiento por posición
     */
    createPositionHeatmap(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Porteros', 'Defensas', 'Mediocampistas', 'Delanteros'],
                datasets: [{
                    label: 'OVR Promedio',
                    data: [
                        data.por || 0,
                        data.def || 0,
                        data.med || 0,
                        data.del || 0
                    ],
                    backgroundColor: [
                        'rgba(255, 149, 0, 0.8)',
                        'rgba(68, 102, 255, 0.8)',
                        'rgba(34, 170, 34, 0.8)',
                        'rgba(255, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#ff9500',
                        '#4466ff',
                        '#22aa22',
                        '#ff4444'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Rendimiento por Posición',
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Crea gráfico de progreso temporal
     */
    createProgressChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Partidos Jugados',
                    data: data.matches,
                    borderColor: '#00ff9d',
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4
                }, {
                    label: 'OVR Promedio',
                    data: data.avgOvr,
                    borderColor: '#ff00e6',
                    backgroundColor: 'rgba(255, 0, 230, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Progreso del Grupo',
                        color: '#00ff9d',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#00ff9d'
                        },
                        title: {
                            display: true,
                            text: 'Partidos',
                            color: '#00ff9d'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#ff00e6'
                        },
                        title: {
                            display: true,
                            text: 'OVR Promedio',
                            color: '#ff00e6'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Helper: Obtiene color según posición
     */
    getPositionColor(position, alpha = 1) {
        const colors = {
            'POR': `rgba(255, 149, 0, ${alpha})`,
            'DEF': `rgba(68, 102, 255, ${alpha})`,
            'MED': `rgba(34, 170, 34, ${alpha})`,
            'DEL': `rgba(255, 68, 68, ${alpha})`
        };
        return colors[position] || `rgba(224, 224, 224, ${alpha})`;
    },
    
    /**
     * Destruye todos los gráficos
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });
    },
    
    /**
     * Actualiza un gráfico existente
     */
    updateChart(canvasId, newData) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].data = newData;
            this.charts[canvasId].update();
        }
    }
};

// Exportar para uso global
window.ChartsManager = ChartsManager;