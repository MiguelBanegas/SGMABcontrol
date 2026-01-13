require("dotenv").config();
const os = require("os");

console.log(
  ">>> SISTEMA INICIADO: Versión 1.5.0 - Puerto:",
  process.env.PORT || 5051
);
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const saleRoutes = require("./routes/saleRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerAccountRoutes = require("./routes/customerAccounts");
const notificationRoutes = require("./routes/notificationRoutes");
const printRoutes = require("./routes/printRoutes");
const { startSpooler } = require("./services/printService");
const path = require("path");

// Detectar la IP local para que Bonjour publique en la interfaz correcta (evitar WSL)
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (iface.address.startsWith("192.168.")) return iface.address;
      }
    }
  }
  return undefined;
};

const bonjour = require("bonjour")();

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const WEB_VERSION = "1.5.1";
const MOBILE_VERSION = "1.0.1";

app.set("io", io);
app.set("version", WEB_VERSION);
app.set("mobile_version", MOBILE_VERSION);

const PORT = process.env.PORT || 5051;
const fs = require("fs");
// Asegurar que la carpeta de subidas exista
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Carpeta 'uploads' creada correctamente");
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer-accounts", customerAccountRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/print", printRoutes);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SGM Backend is running with Socket.io" });
});

// Endpoint para auto-descubrimiento en redes sin mDNS
app.get("/api/server-info", (req, res) => {
  const localIp = getLocalIp();
  res.json({
    ip: localIp || "unknown",
    port: PORT,
    hostname: os.hostname(),
    serviceName: "sgm",
    version: WEB_VERSION,
  });
});

// Servir Frontend (Busca la carpeta dist)
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  console.log("Serviendo frontend desde:", clientDistPath);
  app.use(express.static(clientDistPath));

  app.get(/.*/, (req, res, next) => {
    // Si la ruta empieza con /api, no servir index.html
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Manejo de conexiones de Socket.io
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  // Enviar versión actual al cliente al conectar
  socket.emit("version_check", { web: WEB_VERSION, mobile: MOBILE_VERSION });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Emitir la versión cada 30 segundos a todos para forzar actualización si cambió
setInterval(() => {
  io.emit("version_check", { web: WEB_VERSION, mobile: MOBILE_VERSION });
}, 30000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  startSpooler();

  // Publicar el servidor en la red local vía mDNS (Bonjour)
  try {
    bonjour.publish({
      name: "sgm",
      type: "http",
      port: PORT,
    });
    console.log(
      `Servicio Servidor-Node publicado vía Bonjour en puerto ${PORT}`
    );
  } catch (error) {
    console.error("Error al publicar servicio Bonjour:", error);
  }
});
