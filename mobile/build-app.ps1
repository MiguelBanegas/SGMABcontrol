# SGMABControl Mobile Build Script
# Este script automatiza la compilación del frontend, sincronización de Capacitor y generación del APK.

Write-Host "🚀 Iniciando proceso de generación del APK..." -ForegroundColor Cyan

# 1. Build Vite
Write-Host "📦 Compilando Frontend (Vite)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Falló la compilación de Vite"; exit $LASTEXITCODE }

# 2. Capacitor Sync
Write-Host "🔄 Sincronizando con Capacitor (Android)..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Error "Falló la sincronización de Capacitor"; exit $LASTEXITCODE }

# 3. Gradle Build
Write-Host "🛠️ Generando APK con Gradle..." -ForegroundColor Yellow
cd android
./gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { Write-Error "Falló la generación del APK con Gradle"; exit $LASTEXITCODE }

$apkPath = "app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "✅ ¡Éxito! APK generado correctamente en:" -ForegroundColor Green
    Write-Host (Get-Item $apkPath).FullName -ForegroundColor White
} else {
    Write-Warning "⚠️ El APK no se encuentra en la ruta esperada."
}

cd ..
