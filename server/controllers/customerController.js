const db = require("../db");

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await db("customers").select("*").orderBy("name", "asc");
    res.json(customers);
  } catch (error) {
    console.error("Error en getAllCustomers:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

exports.createCustomer = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [result] = await db("customers")
      .insert({ name, email, phone })
      .returning("id");

    // Extraer ID ya sea [1] o [{id: 1}]
    const id = typeof result === "object" ? result.id : result;

    res.status(201).json({ id, message: "Cliente creado con éxito" });
  } catch (error) {
    console.error("Error en createCustomer:", error);
    res.status(500).json({ message: "Error al crear cliente" });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    await db("customers").where({ id }).update({ name, email, phone });
    res.json({ message: "Cliente actualizado con éxito" });
  } catch (error) {
    console.error("Error en updateCustomer:", error);
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db("customers").where({ id }).del();
    res.json({ message: "Cliente eliminado" });
  } catch (error) {
    console.error("Error en deleteCustomer:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
};
