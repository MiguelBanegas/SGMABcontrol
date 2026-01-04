# SGMABControl Mobile Build Script
# Este script automatiza la compilacion del frontend, sincronizacion de Capacitor y generacion del APK.

Write-Host "--- Iniciando proceso de generacion del APK ---" -ForegroundColor Cyan

# 1. Build Vite
Write-Host "[1/3] Compilando Frontend (Vite)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo la compilacion de Vite"; exit $LASTEXITCODE }

# 2. Capacitor Sync
Write-Host "[2/3] Sincronizando con Capacitor (Android)..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo la sincronizacion de Capacitor"; exit $LASTEXITCODE }

# 3. Gradle Build
Write-Host "[3/3] Generando APK con Gradle..." -ForegroundColor Yellow
Set-Location android
./gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo la generacion del APK con Gradle"; exit $LASTEXITCODE }

$apkPath = "app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "Exito! APK generado correctamente en:" -ForegroundColor Green
    Write-Host (Get-Item $apkPath).FullName -ForegroundColor White
}
else {
    Write-Warning "El APK no se encuentra en la ruta esperada."
}

Set-Location ..
