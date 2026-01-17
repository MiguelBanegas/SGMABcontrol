@echo off
setlocal
set /p backupFile="Ingrese la ruta completa al archivo .sql (ej: sgm_backup_2024-01-17.sql): "
if "%backupFile%"=="" (
    echo Error: Debe ingresar una ruta de archivo.
    pause
    exit /b 1
)
node server/scripts/restore_db.js %backupFile%
pause
