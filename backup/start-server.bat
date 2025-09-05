@echo off
echo ========================================
echo   INICIANDO SERVIDOR LOCAL
echo   Futbol Stats - FC MIL DISCULPIS
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8080
echo.
echo Para detener el servidor, presiona Ctrl+C
echo.
python -m http.server 8080 2>nul || python3 -m http.server 8080 2>nul || py -m http.server 8080 2>nul || (
    echo.
    echo ERROR: Python no esta instalado o no esta en el PATH
    echo.
    echo Por favor instala Python desde: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
pause