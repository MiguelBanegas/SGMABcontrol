const db = require("../db");

exports.createNotification = async (req, res) => {
  const { message, type } = req.body;
  const user_id = req.user.id;

  try {
    await db("notifications").insert({
      user_id,
      business_id: req.user.business_id,
      message,
      type: type || "nota",
      created_at: db.fn.now(),
    });
    req.app.get("io").emit("notification_received");
    res.status(201).json({ message: "Notificación enviada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar notificación" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await db("notifications")
      .join("users", "notifications.user_id", "users.id")
      .where("notifications.business_id", req.user.business_id)
      .select("notifications.*", "users.username as sender_name")
      .orderBy("created_at", "desc");
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db("notifications")
      .where({ id, business_id: req.user.business_id })
      .update({ is_read: true });
    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar notificación" });
  }
};
