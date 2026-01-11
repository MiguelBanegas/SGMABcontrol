const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  console.log(`[AUTH] Solicitando: ${req.method} ${req.originalUrl}`);

  if (!token) {
    console.log(`[AUTH] 403 - Token no proporcionado para ${req.originalUrl}`);
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "supersecretkey",
    (err, decoded) => {
      if (err) {
        console.log(`[AUTH] 401 - Token inválido para ${req.originalUrl}`);
        return res.status(401).json({ message: "Token inválido" });
      }
      req.user = decoded;
      next();
    }
  );
};

exports.isAdmin = (req, res, next) => {
  const role = req.user?.role;
  const username = req.user?.username;

  console.log(
    `[AUTH] Verificando Admin - User: ${username}, Role: "${role}" (${typeof role}), Length: ${
      role?.length
    }, BusinessID: ${req.user?.business_id}`
  );

  if (role && typeof role === "string" && role.toLowerCase() === "admin") {
    next();
  } else {
    console.log(`[AUTH] Acceso denegado para user: ${username}, role: ${role}`);
    res.status(403).json({ message: "Requiere rol de administrador" });
  }
};
