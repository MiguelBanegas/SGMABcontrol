const db = require("../db");

exports.getSettings = async (req, res) => {
  try {
    const settings = await db("settings").select("*");
    const settingsObj = {};
    settings.forEach((s) => (settingsObj[s.key] = s.value));
    res.json(settingsObj);
  } catch (error) {
    console.error("Error en getSettings:", error);
    res.status(500).json({ message: "Error al obtener configuración" });
  }
};

exports.updateSetting = async (req, res) => {
  const { key, value } = req.body;
  try {
    const existing = await db("settings").where({ key }).first();

    if (existing) {
      await db("settings").where({ key }).update({ value });
    } else {
      await db("settings").insert({ key, value });
    }

    res.json({ message: "Configuración actualizada" });
  } catch (error) {
    console.error("Error en updateSetting:", error);
    res.status(500).json({ message: "Error al actualizar configuración" });
  }
};
