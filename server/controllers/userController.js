const db = require("../db");
const bcrypt = require("bcryptjs");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db("users")
      .where({ business_id: req.user.business_id })
      .select("id", "username", "role", "created_at");
    res.json(users);
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

exports.createUser = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db("users")
      .insert({
        username,
        password: hashedPassword,
        role: role || "vendedor",
        business_id: req.user.business_id,
      })
      .returning("id");
    res.status(201).json({ id: userId, message: "Usuario creado con éxito" });
  } catch (error) {
    console.error("Error en createUser:", error);
    if (error.code === "23505")
      return res.status(400).json({ message: "El usuario ya existe" });
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role, password } = req.body;
  const updateData = { username, role };

  try {
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    await db("users")
      .where({ id, business_id: req.user.business_id })
      .update(updateData);
    res.json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error("Error en updateUser:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Evitar que el admin se borre a sí mismo si fuera necesario, o simplemente proceder
    await db("users").where({ id, business_id: req.user.business_id }).del();
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};
