#!/bin/bash

echo "========================================"
echo "  INICIANDO SERVIDOR LOCAL"
echo "  Futbol Stats - FC MIL DISCULPIS"
echo "========================================"
echo ""
echo "Iniciando servidor en http://localhost:8080"
echo ""
echo "Para detener el servidor, presiona Ctrl+C"
echo ""

# Try different Python commands
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
else
    echo "ERROR: Python no está instalado"
    echo ""
    echo "Por favor instala Python:"
    echo "  - macOS: brew install python3"
    echo "  - Ubuntu/Debian: sudo apt-get install python3"
    echo "  - Fedora: sudo dnf install python3"
    echo ""
    exit 1
fi