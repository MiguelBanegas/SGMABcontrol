const bonjour = require("bonjour")();

console.log("Buscando servicios HTTP en la red local...");

bonjour.find({ type: "http" }, function (service) {
  console.log(
    "Servicio encontrado:",
    service.name,
    "en",
    service.referer.address + ":" + service.port
  );
  if (service.name === "sgm") {
    console.log("✅ ¡ÉXITO! El servidor está siendo detectado correctamente.");
  }
});

// Detener después de 5 segundos
setTimeout(() => {
  console.log("Escaneo finalizado.");
  process.exit(0);
}, 5000);
