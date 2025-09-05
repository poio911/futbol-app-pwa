class DataExport {
    constructor(firebaseService, supabaseService) {
        this.firebase = firebaseService;
        this.supabase = supabaseService;
        this.exportInProgress = false;
    }

    async exportData(format = 'json', includeImages = false) {
        if (this.exportInProgress) {
            UI.showNotification('Ya hay una exportación en progreso...', 'warning');
            return;
        }

        this.exportInProgress = true;
        UI.showNotification('Iniciando exportación de datos...', 'info');

        try {
            const groupId = this.getCurrentGroupId();
            if (!groupId) {
                throw new Error('No hay grupo seleccionado');
            }

            const exportData = await this.gatherAllData(groupId, includeImages);
            
            switch (format.toLowerCase()) {
                case 'json':
                    await this.exportAsJSON(exportData);
                    break;
                case 'csv':
                    await this.exportAsCSV(exportData);
                    break;
                case 'pdf':
                    await this.exportAsPDF(exportData);
                    break;
                case 'xlsx':
                    await this.exportAsExcel(exportData);
                    break;
                default:
                    throw new Error('Formato de exportación no soportado');
            }

            UI.showNotification('Datos exportados exitosamente', 'success');
        } catch (error) {
            console.error('Error en exportación:', error);
            UI.showNotification('Error al exportar datos: ' + error.message, 'error');
        } finally {
            this.exportInProgress = false;
        }
    }

    async gatherAllData(groupId, includeImages) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                groupId: groupId,
                appVersion: '1.0.0',
                exportType: includeImages ? 'complete' : 'data-only'
            },
            group: null,
            players: [],
            matches: [],
            tournaments: [],
            playerHistory: [],
            statistics: null,
            images: includeImages ? {} : null
        };

        try {
            // Obtener datos del grupo usando Storage
            if (typeof Storage !== 'undefined') {
                exportData.group = Storage.getGroupById(groupId);
                
                // Obtener jugadores
                const players = Storage.getPlayers() || [];
                exportData.players = players;

                // Obtener partidos
                const matches = Storage.getMatches() || [];
                exportData.matches = matches;
            } else {
                // Fallback directo a Firebase
                if (this.firebase && this.firebase.getPlayers) {
                    exportData.players = await this.firebase.getPlayers() || [];
                }
                if (this.firebase && this.firebase.getMatches) {
                    exportData.matches = await this.firebase.getMatches() || [];
                }
            }

            // Obtener torneos
            if (window.TournamentSystem) {
                try {
                    const tournaments = await window.TournamentSystem.getAllTournaments(groupId);
                    exportData.tournaments = tournaments || [];
                } catch (error) {
                    console.warn('Error getting tournaments:', error);
                    exportData.tournaments = [];
                }
            }

            // Obtener historial de jugadores
            if (window.PlayerHistory && exportData.players.length > 0) {
                for (const player of exportData.players) {
                    try {
                        const history = await window.PlayerHistory.getPlayerHistory(player.id);
                        if (history && history.length > 0) {
                            exportData.playerHistory.push({
                                playerId: player.id,
                                playerName: player.name,
                                history: history
                            });
                        }
                    } catch (error) {
                        console.warn(`Error getting history for player ${player.name}:`, error);
                    }
                }
            }

            // Calcular estadísticas generales
            exportData.statistics = await this.calculateGeneralStatistics(exportData.players, exportData.matches);

            // Obtener imágenes si se solicita
            if (includeImages && exportData.players.length > 0) {
                exportData.images = await this.gatherPlayerImages(exportData.players);
            }

        } catch (error) {
            console.error('Error gathering export data:', error);
            throw new Error('Error al recopilar datos: ' + error.message);
        }

        return exportData;
    }

    async calculateGeneralStatistics(players, matches) {
        const stats = {
            totalPlayers: players.length,
            totalMatches: matches.length,
            totalGoals: 0,
            averageOVR: 0,
            topScorer: null,
            topRated: null,
            matchesPerPlayer: {},
            positionDistribution: {}
        };

        // Calcular estadísticas de jugadores
        let totalOVR = 0;
        let maxGoals = 0;
        let maxOVR = 0;

        players.forEach(player => {
            totalOVR += player.ovr || 0;
            
            const goals = player.stats?.goals || 0;
            stats.totalGoals += goals;
            
            if (goals > maxGoals) {
                maxGoals = goals;
                stats.topScorer = {
                    name: player.name,
                    goals: goals
                };
            }

            if (player.ovr > maxOVR) {
                maxOVR = player.ovr;
                stats.topRated = {
                    name: player.name,
                    ovr: player.ovr
                };
            }

            // Distribución por posición
            const position = player.position || 'N/A';
            stats.positionDistribution[position] = (stats.positionDistribution[position] || 0) + 1;
        });

        stats.averageOVR = Math.round(totalOVR / players.length);

        return stats;
    }

    async gatherPlayerImages(players) {
        const images = {};
        
        for (const player of players) {
            if (player.avatar_url) {
                try {
                    // Convertir imagen a base64
                    const response = await fetch(player.avatar_url);
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);
                    
                    images[player.id] = {
                        playerId: player.id,
                        playerName: player.name,
                        originalUrl: player.avatar_url,
                        base64: base64,
                        contentType: blob.type
                    };
                } catch (error) {
                    console.warn(`No se pudo obtener imagen del jugador ${player.name}:`, error);
                }
            }
        }

        return images;
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async exportAsJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadFile(blob, `futbol-app-export-${this.getDateString()}.json`);
    }

    async exportAsCSV(data) {
        // Crear CSVs separados para cada tipo de datos
        const csvData = {
            players: this.convertToCSV(data.players, 'players'),
            matches: this.convertToCSV(data.matches, 'matches'),
            statistics: this.convertToCSV([data.statistics], 'statistics')
        };

        // Crear archivo ZIP con todos los CSVs
        if (window.JSZip) {
            const zip = new JSZip();
            
            Object.keys(csvData).forEach(key => {
                if (csvData[key]) {
                    zip.file(`${key}.csv`, csvData[key]);
                }
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            this.downloadFile(zipBlob, `futbol-app-export-${this.getDateString()}.zip`);
        } else {
            // Si no hay JSZip, exportar solo jugadores
            const blob = new Blob([csvData.players], { type: 'text/csv;charset=utf-8;' });
            this.downloadFile(blob, `jugadores-export-${this.getDateString()}.csv`);
        }
    }

    convertToCSV(data, type) {
        if (!data || data.length === 0) return '';

        const headers = this.getCSVHeaders(type);
        const csvContent = [
            headers.join(','),
            ...data.map(item => headers.map(header => {
                const value = this.getNestedValue(item, header);
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(','))
        ].join('\n');

        return csvContent;
    }

    getCSVHeaders(type) {
        const headerMap = {
            players: ['id', 'name', 'position', 'ovr', 'stats.goals', 'stats.assists', 'stats.matches'],
            matches: ['id', 'date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'tournament'],
            statistics: ['totalPlayers', 'totalMatches', 'totalGoals', 'averageOVR']
        };

        return headerMap[type] || Object.keys(data[0] || {});
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    }

    async exportAsPDF(data) {
        // Crear un reporte PDF básico
        const pdfContent = this.generatePDFContent(data);
        
        if (window.jsPDF) {
            const doc = new jsPDF();
            
            // Configurar fuente
            doc.setFont('helvetica');
            
            // Título
            doc.setFontSize(20);
            doc.text('Reporte Futbol App', 20, 30);
            
            // Información del grupo
            doc.setFontSize(12);
            let yPos = 50;
            
            doc.text(`Grupo: ${data.group?.name || 'N/A'}`, 20, yPos);
            yPos += 10;
            doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 20, yPos);
            yPos += 20;
            
            // Estadísticas generales
            doc.setFontSize(16);
            doc.text('Estadísticas Generales', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(12);
            doc.text(`Total de jugadores: ${data.statistics.totalPlayers}`, 20, yPos);
            yPos += 8;
            doc.text(`Total de partidos: ${data.statistics.totalMatches}`, 20, yPos);
            yPos += 8;
            doc.text(`Promedio OVR: ${data.statistics.averageOVR}`, 20, yPos);
            yPos += 8;
            doc.text(`Total de goles: ${data.statistics.totalGoals}`, 20, yPos);
            yPos += 20;
            
            // Top jugadores
            if (data.statistics.topScorer) {
                doc.setFontSize(16);
                doc.text('Destacados', 20, yPos);
                yPos += 10;
                
                doc.setFontSize(12);
                doc.text(`Máximo goleador: ${data.statistics.topScorer.name} (${data.statistics.topScorer.goals} goles)`, 20, yPos);
                yPos += 8;
                
                if (data.statistics.topRated) {
                    doc.text(`Mayor OVR: ${data.statistics.topRated.name} (${data.statistics.topRated.ovr} OVR)`, 20, yPos);
                }
            }
            
            const pdfBlob = doc.output('blob');
            this.downloadFile(pdfBlob, `futbol-app-report-${this.getDateString()}.pdf`);
        } else {
            throw new Error('jsPDF no está disponible');
        }
    }

    async exportAsExcel(data) {
        if (window.XLSX) {
            const workbook = XLSX.utils.book_new();
            
            // Crear hojas para diferentes tipos de datos
            const playersSheet = XLSX.utils.json_to_sheet(data.players);
            XLSX.utils.book_append_sheet(workbook, playersSheet, 'Jugadores');
            
            const matchesSheet = XLSX.utils.json_to_sheet(data.matches);
            XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Partidos');
            
            const statsSheet = XLSX.utils.json_to_sheet([data.statistics]);
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');
            
            if (data.tournaments.length > 0) {
                const tournamentsSheet = XLSX.utils.json_to_sheet(data.tournaments);
                XLSX.utils.book_append_sheet(workbook, tournamentsSheet, 'Torneos');
            }
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            this.downloadFile(blob, `futbol-app-export-${this.getDateString()}.xlsx`);
        } else {
            throw new Error('SheetJS (XLSX) no está disponible');
        }
    }

    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    getDateString() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }

    getCurrentGroupId() {
        // Try multiple sources for group ID
        const groupId = localStorage.getItem('currentGroupId') || 
                       sessionStorage.getItem('selectedGroupId') ||
                       localStorage.getItem('futbol_stats_current_group') ||
                       window.currentGroupId;
        
        if (!groupId) {
            // Try to get from Storage if available
            if (typeof Storage !== 'undefined' && Storage.getCurrentGroupId) {
                return Storage.getCurrentGroupId();
            }
        }
        
        return groupId;
    }

    // Método para mostrar el modal de exportación
    showExportDialog() {
        const existingModal = document.getElementById('exportModal');
        if (existingModal) {
            existingModal.style.display = 'flex';
            return;
        }

        const modalHTML = `
            <div id="exportModal" class="modal-overlay">
                <div class="modal-content export-modal">
                    <div class="modal-header">
                        <h3>Exportar Datos</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="export-options">
                            <div class="option-group">
                                <label>Formato de exportación:</label>
                                <div class="format-buttons">
                                    <button class="format-btn active" data-format="json">
                                        <i class="fas fa-code"></i>
                                        JSON
                                    </button>
                                    <button class="format-btn" data-format="csv">
                                        <i class="fas fa-table"></i>
                                        CSV
                                    </button>
                                    <button class="format-btn" data-format="pdf">
                                        <i class="fas fa-file-pdf"></i>
                                        PDF
                                    </button>
                                    <button class="format-btn" data-format="xlsx">
                                        <i class="fas fa-file-excel"></i>
                                        Excel
                                    </button>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <label>
                                    <input type="checkbox" id="includeImages" checked>
                                    Incluir imágenes de jugadores (aumenta el tamaño del archivo)
                                </label>
                            </div>
                            
                            <div class="export-info">
                                <h4>¿Qué se incluye en la exportación?</h4>
                                <ul>
                                    <li>Información del grupo</li>
                                    <li>Lista completa de jugadores y estadísticas</li>
                                    <li>Historial de partidos</li>
                                    <li>Torneos y competiciones</li>
                                    <li>Historial de eventos de jugadores</li>
                                    <li>Estadísticas generales</li>
                                    <li>Imágenes de jugadores (opcional)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">
                            Cancelar
                        </button>
                        <button class="btn-primary" id="startExportBtn">
                            <i class="fas fa-download"></i>
                            Exportar Datos
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar event listeners
        this.setupExportModalEvents();
    }

    setupExportModalEvents() {
        // Selección de formato
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Botón de exportar
        document.getElementById('startExportBtn').addEventListener('click', async () => {
            const selectedFormat = document.querySelector('.format-btn.active').dataset.format;
            const includeImages = document.getElementById('includeImages').checked;
            
            document.getElementById('exportModal').style.display = 'none';
            
            await this.exportData(selectedFormat, includeImages);
        });
    }
}

// Inicializar el sistema de exportación cuando sea necesario
window.DataExport = DataExport;

// Auto-initialize export system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other systems to load first
    setTimeout(() => {
        try {
            // Initialize DataExport system
            const dataExporter = new DataExport(
                typeof FirebaseSimple !== 'undefined' ? FirebaseSimple : null,
                typeof SupabaseStorage !== 'undefined' ? SupabaseStorage : null
            );
            
            // Setup export button in settings menu
            const exportBtn = document.getElementById('export-data-option');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    dataExporter.showExportDialog();
                });
                console.log('📊 Data Export system initialized successfully');
            }
            
            // Make it globally available
            window.dataExporter = dataExporter;
            
        } catch (error) {
            console.warn('Could not initialize DataExport system:', error);
        }
    }, 1000); // Wait 1 second for all other systems to load
});