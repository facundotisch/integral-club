@echo off
chcp 65001 > nul
title Racing Club - Sincronizar GPS con Google Sheets
color 0B

echo.
echo  ==============================================================
echo     RACING CLUB  ^|  FUTBOL FORMATIVO  ^|  AREA FISICA Y GPS
echo  ==============================================================
echo     Sincronizador de Datos: Google Sheets -^> Dashboard V3
echo  ==============================================================
echo.

cd /d "C:\Users\facun\Documents\RACING\racing-gps-vercel"

echo [1/3] Verificando rama V3 en Git...
git checkout v3 > nul 2>&1
echo   -> Listo.
echo.

echo [2/3] Descargando ultimas sesiones de Google Sheets...
node scripts\sync_gps_data.mjs
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  [!] ERROR: No se pudieron descargar todas las categorias.
    echo      Verifica tu conexion a internet e intenta de nuevo.
    echo.
    if "%1"=="--silent" exit /b 1
    pause
    exit /b 1
)

echo.
echo [3/3] Publicando datos actualizados en Vercel...
git add public/data/gps/
git commit -m "data(gps): actualizacion de planillas desde Google Sheets" > nul 2>&1
git push origin v3
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo  [!] ERROR al subir a GitHub / Vercel.
    echo.
    if "%1"=="--silent" exit /b 1
    pause
    exit /b 1
)

color 0A
echo.
echo  ==============================================================
echo     [OK] SINCRONIZACION COMPLETADA CON EXITO
echo  ==============================================================
echo     En 30 segundos los datos nuevos estaran disponibles para
echo     todo el mundo en:
echo     https://dashboard-integral-v3.vercel.app
echo  ==============================================================
echo.
if "%1"=="--silent" exit /b 0
pause
