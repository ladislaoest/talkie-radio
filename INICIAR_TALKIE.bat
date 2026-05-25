@echo off
title PROBADOR DE TALKIE
echo ==========================================
echo    INTENTANDO INICIAR EL SERVIDOR
echo ==========================================
echo.

:: Ir a la carpeta del script
cd /d "%~dp0"

echo Carpeta actual: %cd%
echo.

echo Verificando Node.js...
call node -v
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no parece estar instalado o accesible.
    echo Por favor, instalalo desde https://nodejs.org/
    pause
    exit
)

echo Verificando NPM...
call npm -v
if %errorlevel% neq 0 (
    echo [ERROR] NPM no esta accesible.
    pause
    exit
)

echo.
echo Intentando arrancar el servidor...
echo ------------------------------------------
:: Abrir navegador en segundo plano
start http://localhost:3001

:: Ejecutar el servidor directamente
node server.js

echo.
echo ------------------------------------------
echo El proceso ha terminado.
pause
