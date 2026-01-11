const db = require("../db");

exports.getSettings = async (req, res) => {
  try {
    const settings = await db("settings")
      .where({ business_id: req.user.business_id })
      .select("*");
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
    const existing = await db("settings")
      .where({ key, business_id: req.user.business_id })
      .first();

    if (existing) {
      await db("settings")
        .where({ key, business_id: req.user.business_id })
        .update({ value });
    } else {
      await db("settings").insert({
        key,
        value,
        business_id: req.user.business_id,
      });
    }

    res.json({ message: "Configuración actualizada" });
  } catch (error) {
    console.error("Error en updateSetting:", error);
    res.status(500).json({ message: "Error al actualizar configuración" });
  }
};
