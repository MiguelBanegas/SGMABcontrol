const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token)
    return res.status(403).json({ message: "Token no proporcionado" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "supersecretkey",
    (err, decoded) => {
      if (err) return res.status(401).json({ message: "Token inválido" });
      req.user = decoded;
      next();
    }
  );
};

exports.isAdmin = (req, res, next) => {
  console.log(
    "Verificando Admin - Usuario:",
    req.user?.username,
    "Rol:",
    req.user?.role
  );
  if (req.user && req.user.role && req.user.role.toLowerCase() === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Requiere rol de administrador" });
  }
};
