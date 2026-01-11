const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db("users").where({ username }).first();
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        business_id: user.business_id,
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        business_id: user.business_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.register = async (req, res) => {
  const { username, password, role, business_id } = req.body;

  try {
    const existingUser = await db("users").where({ username }).first();
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db("users")
      .insert({
        username,
        password: hashedPassword,
        role: role || "vendedor",
        business_id: business_id || 1, // Por ahora default al 1 si no se envía
      })
      .returning("id");

    res.status(201).json({ message: "Usuario creado", userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
