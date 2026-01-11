---
description: Pasos para configurar la notebook como servidor central del SGM.
---

# Configuración del Servidor SGM (Notebook Local)

Siga este flujo para dejar el sistema funcionando permanentemente en este equipo y accesible desde otros dispositivos.

### 1. Configurar IP Estática en Windows

Para que las terminales no pierdan la conexión, la notebook debe tener siempre la misma IP.

1. Abra **Panel de Control** > **Centro de redes y recursos compartidos**.
2. Click en su conexión (WiFi o Ethernet) > **Propiedades**.
3. Seleccione **Protocolo de Internet versión 4 (TCP/IPv4)** > **Propiedades**.
4. Elija "Usar la siguiente dirección IP" y asigne una (ej: `192.168.1.50`).
5. Máscara de subred: `255.255.255.0`. Puerta de enlace: la de su router (ej: `192.168.1.1`).
6. DNS: Use los de Google (`8.8.8.8` y `8.8.4.4`).

### 2. Abrir Puerto en el Firewall

1. Busque "Firewall de Windows con seguridad avanzada".
2. **Reglas de entrada** > **Nueva regla**.
3. Tipo: **Puerto** > TCP > Puertos locales específicos: `5051`.
4. **Permitir la conexión**.
5. Tilde Perfil, Privado y Público. Nombre: "SGM Backend".

### 3. Preparar e Iniciar el Sistema (Terminal)

// turbo-all
Ejecute estos pasos en la terminal dentro de la carpeta del proyecto:

1. Instalar PM2 globalmente (si no lo tiene):
   `npm install -g pm2`

2. Construir el Frontend (Client):
   `cd client`
   `npm run build`
   `cd ..`

3. Iniciar el servidor con PM2:
   `cd server`
   `pm2 start index.js --name "sgm-server"`
   `pm2 save`

4. Configurar para que PM2 inicie con Windows:
   `npm install -g pm2-windows-startup`
   `pm2-startup install`
