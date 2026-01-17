@echo off
setlocal
set /p backupFile="Ingrese el NOMBRE del archivo .sql (ej: sgm_backup_2026-01-17.sql): "
if "%backupFile%"=="" (
    echo Error: Debe ingresar una ruta de archivo.
    pause
    exit /b 1
)
node server/scripts/restore_db.js %backupFile%
pause
