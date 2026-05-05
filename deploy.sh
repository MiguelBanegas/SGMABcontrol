#!/bin/bash

# Script de Despliegue Automático para SGMABcontrol
# Ubicación recomendada: /var/www/SGMABcontrol/deploy.sh

echo "🚀 Iniciando despliegue de SGMABcontrol..."

# 1. Obtener los últimos cambios de GitHub
echo "📥 Tirando cambios desde el repositorio (master)..."
# Guardamos cambios locales (como permisos o ediciones accidentales) para evitar conflictos
git stash
git pull origin master
# Autocuración: Asegurar que el script mantenga permisos de ejecución para la próxima vez
chmod +x deploy.sh
echo "📝 Último commit aplicado:"
git log -1 --pretty=format:"%C(yellow)%h%C(reset) %s %C(blue)(%an, %ar)%C(reset)"
echo ""

# 2. Configurar el Backend
echo "⚙️  Configurando Backend..."
cd server
npm install
# Asegurar que las dependencias estén actualizadas y sin vulnerabilidades críticas
npm audit fix --quiet
npm run migrate:prod

# 3. Configurar y Compilar el Frontend
echo "💻 Compilando Frontend (React)..."
cd ../client
npm install
npm audit fix --quiet
npm run build

# 4. Reiniciar los procesos en PM2
echo "🔄 Reiniciando servidores en PM2..."
cd ..
pm2 restart sgm-backend

# 5. Limpieza (opcional)
# echo "🧹 Limpiando archivos temporales..."

echo "-------------------------------------------"
echo "✅ ¡Despliegue completado con éxito! ✨"
echo "🌐 URL: https://sgm.mabcontrol.ar"
echo "-------------------------------------------"
