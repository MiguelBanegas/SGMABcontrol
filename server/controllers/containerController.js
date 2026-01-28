const db = require("../db");

// Obtener balances de envases por cliente
exports.getCustomerBalances = async (req, res) => {
  const { customerId } = req.params;
  const business_id = req.user.business_id;

  try {
    const balances = await db("container_balances")
      .join("products", "container_balances.product_id", "products.id")
      .where({
        "container_balances.customer_id": customerId,
        "container_balances.business_id": business_id,
      })
      .andWhere("container_balances.balance", ">", 0)
      .select(
        "container_balances.product_id",
        "products.name as product_name",
        "container_balances.balance",
      );

    res.json(balances);
  } catch (error) {
    console.error("GET_CUSTOMER_BALANCES_ERROR:", error);
    res.status(500).json({ message: "Error al obtener saldos de envases" });
  }
};

// Registrar devolución de envases
exports.recordReturn = async (req, res) => {
  const { customerId } = req.params;
  const { productId, amount, description } = req.body;
  const business_id = req.user.business_id;

  if (!customerId || !productId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Datos de devolución inválidos" });
  }

  const trx = await db.transaction();
  try {
    // 1. Obtener balance actual
    const currentBalanceRec = await trx("container_balances")
      .where({
        customer_id: customerId,
        product_id: productId,
        business_id: business_id,
      })
      .first();

    const currentBalance = currentBalanceRec
      ? parseFloat(currentBalanceRec.balance)
      : 0;
    const newBalance = currentBalance - parseFloat(amount);

    if (newBalance < 0) {
      await trx.rollback();
      return res
        .status(400)
        .json({ message: "La cantidad devuelta supera la deuda actual" });
    }

    // 2. Actualizar balance
    await trx("container_balances")
      .where({
        customer_id: customerId,
        product_id: productId,
        business_id: business_id,
      })
      .update({
        balance: newBalance,
        updated_at: trx.fn.now(),
      });

    // 3. Registrar transacción
    await trx("container_transactions").insert({
      customer_id: customerId,
      product_id: productId,
      type: "return",
      amount: parseFloat(amount),
      balance_after: newBalance,
      description: description || "Devolución manual de envases",
      business_id: business_id,
    });

    await trx.commit();
    res.json({ message: "Devolución registrada con éxito", newBalance });
  } catch (error) {
    await trx.rollback();
    console.error("RECORD_RETURN_ERROR:", error);
    res.status(500).json({ message: "Error al registrar la devolución" });
  }
};

// Obtener historial de transacciones de envases de un cliente
exports.getTransactionHistory = async (req, res) => {
  const { customerId } = req.params;
  const business_id = req.user.business_id;

  try {
    const history = await db("container_transactions")
      .join("products", "container_transactions.product_id", "products.id")
      .leftJoin("sales", "container_transactions.sale_id", "sales.id")
      .where({
        "container_transactions.customer_id": customerId,
        "container_transactions.business_id": business_id,
      })
      .select(
        "container_transactions.*",
        "products.name as product_name",
        "sales.id as sale_uuid",
      )
      .orderBy("container_transactions.created_at", "desc");

    res.json(history);
  } catch (error) {
    console.error("GET_CONTAINER_HISTORY_ERROR:", error);
    res.status(500).json({ message: "Error al obtener historial de envases" });
  }
};
