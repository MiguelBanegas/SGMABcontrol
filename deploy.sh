#!/usr/bin/env bash
set -euo pipefail

# Script de Despliegue Automático para SGMABcontrol
# Ejecutar desde la raíz del repo en el VPS: /var/www/SGMABcontrol

BRANCH="${BRANCH:-master}"
PM2_APP="${PM2_APP:-sgm-backend}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:5051}"

echo "[deploy] Iniciando despliegue..."
echo "[deploy] Branch: ${BRANCH}"

if [[ ! -f "server/pnpm-lock.yaml" ]]; then
  echo "[deploy] ERROR: No se encontró server/pnpm-lock.yaml."
  exit 1
fi

if [[ ! -f "client/pnpm-lock.yaml" ]]; then
  echo "[deploy] ERROR: No se encontró client/pnpm-lock.yaml."
  exit 1
fi

echo "[deploy] Versiones:"
node -v
pnpm -v

echo "[deploy] Actualizando código desde origin/${BRANCH}..."
git fetch --all --prune
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
chmod +x deploy.sh
echo "[deploy] Último commit aplicado:"
git log -1 --pretty=format:"%h %s (%an, %ar)"
echo ""

echo "[deploy] Instalando dependencias backend..."
cd server
pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile
pnpm run migrate:prod

echo "[deploy] Instalando dependencias frontend..."
cd ../client
pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile
pnpm run build

echo "[deploy] Reiniciando backend con PM2..."
cd ..
if pm2 describe "${PM2_APP}" >/dev/null 2>&1; then
  pm2 reload "${PM2_APP}"
else
  pm2 start server/index.js --name "${PM2_APP}"
fi
pm2 save

echo "[deploy] Verificando healthcheck en ${HEALTH_URL}..."
if curl -fsS "${HEALTH_URL}" >/dev/null; then
  echo "[deploy] Healthcheck OK"
else
  echo "[deploy] ERROR: Healthcheck falló en ${HEALTH_URL}"
  pm2 logs "${PM2_APP}" --lines 80
  exit 1
fi

echo "-------------------------------------------"
echo "[deploy] Despliegue completado."
echo "[deploy] URL: https://sgm.mabcontrol.ar"
echo "-------------------------------------------"
