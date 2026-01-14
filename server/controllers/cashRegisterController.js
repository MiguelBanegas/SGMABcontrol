const db = require("../db");

// Abrir caja
exports.openCashRegister = async (req, res) => {
  const { opening_amount } = req.body;

  try {
    const openRegister = await db("cash_registers")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
        status: "open",
      })
      .first();

    if (openRegister) {
      return res.status(400).json({
        message: "Ya tienes una caja abierta",
        cash_register_id: openRegister.id,
      });
    }

    const [cashRegister] = await db("cash_registers")
      .insert({
        business_id: req.user.business_id,
        user_id: req.user.id,
        opening_amount: opening_amount || 0,
        status: "open",
      })
      .returning("*");

    res.status(201).json(cashRegister);
  } catch (error) {
    console.error("Error en openCashRegister:", error);
    res.status(500).json({ message: "Error al abrir caja" });
  }
};

// Cerrar caja
exports.closeCashRegister = async (req, res) => {
  const { id } = req.params;
  const { closing_amount, notes } = req.body;

  try {
    const cashRegister = await db("cash_registers")
      .where({ id, user_id: req.user.id, status: "open" })
      .first();

    if (!cashRegister) {
      return res
        .status(404)
        .json({ message: "Caja no encontrada o ya cerrada" });
    }

    // Calcular ventas por método de pago
    const salesByMethod = await db("sales")
      .where({ cash_register_id: id })
      .select("payment_method")
      .sum("total as total")
      .groupBy("payment_method");

    const totals = {
      cash: 0,
      transfer: 0,
      debit: 0,
      credit: 0,
    };

    salesByMethod.forEach((row) => {
      const total = parseFloat(row.total || 0);
      switch (row.payment_method) {
        case "Efectivo":
          totals.cash = total;
          break;
        case "Transferencia":
          totals.transfer = total;
          break;
        case "Débito":
          totals.debit = total;
          break;
        case "Crédito":
          totals.credit = total;
          break;
      }
    });

    // Calcular nuevas deudas (ventas a cuenta corriente)
    const debtsResult = await db("sales")
      .where({ cash_register_id: id })
      .sum("debt_amount as total")
      .first();

    const account_sales = parseFloat(debtsResult.total || 0);

    // Obtener cobros de cuenta corriente
    const paymentsResult = await db("cash_movements")
      .where({ cash_register_id: id, type: "account_payment" })
      .sum("amount as total")
      .first();

    const account_payments = parseFloat(paymentsResult.total || 0);

    // Obtener gastos y retiros
    const expenses = parseFloat(cashRegister.expenses || 0);
    const withdrawals = parseFloat(cashRegister.withdrawals || 0);

    // Calcular efectivo esperado
    const expected_amount =
      parseFloat(cashRegister.opening_amount) +
      totals.cash +
      account_payments -
      expenses -
      withdrawals;

    // Calcular diferencia
    const difference = parseFloat(closing_amount) - expected_amount;

    // Cerrar caja
    await db("cash_registers").where({ id }).update({
      closing_amount,
      expected_amount,
      difference,
      cash_sales: totals.cash,
      transfer_sales: totals.transfer,
      debit_sales: totals.debit,
      credit_sales: totals.credit,
      account_sales,
      account_payments,
      status: "closed",
      closed_at: db.fn.now(),
      notes,
    });

    res.json({
      message: "Caja cerrada exitosamente",
      expected_amount,
      difference,
      totals: {
        cash: totals.cash,
        transfer: totals.transfer,
        debit: totals.debit,
        credit: totals.credit,
        account_sales,
        account_payments,
      },
    });
  } catch (error) {
    console.error("Error en closeCashRegister:", error);
    res.status(500).json({ message: "Error al cerrar caja" });
  }
};

// Obtener caja actual del usuario
exports.getCurrentCashRegister = async (req, res) => {
  try {
    const cashRegister = await db("cash_registers")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
        status: "open",
      })
      .first();

    if (!cashRegister) {
      return res.json(null);
    }

    // Calcular ventas por método de pago
    const salesByMethod = await db("sales")
      .where({ cash_register_id: cashRegister.id })
      .select("payment_method")
      .sum("total as total")
      .groupBy("payment_method");

    const totals = {
      cash: 0,
      transfer: 0,
      debit: 0,
      credit: 0,
    };

    salesByMethod.forEach((row) => {
      const total = parseFloat(row.total || 0);
      switch (row.payment_method) {
        case "Efectivo":
          totals.cash = total;
          break;
        case "Transferencia":
          totals.transfer = total;
          break;
        case "Débito":
          totals.debit = total;
          break;
        case "Crédito":
          totals.credit = total;
          break;
      }
    });

    // Calcular nuevas deudas
    const debtsResult = await db("sales")
      .where({ cash_register_id: cashRegister.id })
      .sum("debt_amount as total")
      .first();

    const account_sales = parseFloat(debtsResult.total || 0);

    // Obtener cobros de cuenta corriente
    const paymentsResult = await db("cash_movements")
      .where({ cash_register_id: cashRegister.id, type: "account_payment" })
      .sum("amount as total")
      .first();

    const account_payments = parseFloat(paymentsResult.total || 0);

    // Calcular efectivo esperado actual
    const expenses = parseFloat(cashRegister.expenses || 0);
    const withdrawals = parseFloat(cashRegister.withdrawals || 0);

    const current_expected =
      parseFloat(cashRegister.opening_amount) +
      totals.cash +
      account_payments -
      expenses -
      withdrawals;

    // Calcular total vendido
    const total_sales =
      totals.cash +
      totals.transfer +
      totals.debit +
      totals.credit +
      account_sales;

    res.json({
      ...cashRegister,
      current_cash_sales: totals.cash,
      current_transfer_sales: totals.transfer,
      current_debit_sales: totals.debit,
      current_credit_sales: totals.credit,
      current_account_sales: account_sales,
      current_account_payments: account_payments,
      current_expected,
      total_sales,
    });
  } catch (error) {
    console.error("Error en getCurrentCashRegister:", error);
    res.status(500).json({ message: "Error al obtener caja actual" });
  }
};

// Registrar movimiento de efectivo (gasto, retiro o cobro de cuenta corriente)
exports.addCashMovement = async (req, res) => {
  const { cash_register_id, type, amount, description } = req.body;

  try {
    const cashRegister = await db("cash_registers")
      .where({
        id: cash_register_id,
        user_id: req.user.id,
        status: "open",
      })
      .first();

    if (!cashRegister) {
      return res.status(404).json({ message: "Caja no encontrada o cerrada" });
    }

    // Registrar movimiento
    await db("cash_movements").insert({
      cash_register_id,
      type,
      amount,
      description,
    });

    // Actualizar total en cash_register
    if (type === "expense") {
      await db("cash_registers")
        .where({ id: cash_register_id })
        .increment("expenses", amount);
    } else if (type === "withdrawal") {
      await db("cash_registers")
        .where({ id: cash_register_id })
        .increment("withdrawals", amount);
    }
    // account_payment se suma automáticamente al consultar

    res.status(201).json({ message: "Movimiento registrado" });
  } catch (error) {
    console.error("Error en addCashMovement:", error);
    res.status(500).json({ message: "Error al registrar movimiento" });
  }
};

// Obtener historial de arqueos
exports.getCashRegisterHistory = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = db("cash_registers")
      .leftJoin("users", "cash_registers.user_id", "users.id")
      .where("cash_registers.business_id", req.user.business_id);

    if (req.user.role !== "admin") {
      query = query.where("cash_registers.user_id", req.user.id);
    }

    if (startDate && endDate) {
      query = query.whereBetween("cash_registers.opened_at", [
        startDate,
        endDate,
      ]);
    }

    const registers = await query
      .select("cash_registers.*", "users.username as user_name")
      .orderBy("cash_registers.opened_at", "desc");

    res.json(registers);
  } catch (error) {
    console.error("Error en getCashRegisterHistory:", error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};

// Obtener detalle de un arqueo específico
exports.getCashRegisterDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const cashRegister = await db("cash_registers")
      .leftJoin("users", "cash_registers.user_id", "users.id")
      .where({
        "cash_registers.id": id,
        "cash_registers.business_id": req.user.business_id,
      })
      .select("cash_registers.*", "users.username as user_name")
      .first();

    if (!cashRegister) {
      return res.status(404).json({ message: "Caja no encontrada" });
    }

    // Obtener ventas
    const sales = await db("sales")
      .where({ cash_register_id: id })
      .select("id", "total", "payment_method", "debt_amount", "created_at")
      .orderBy("created_at", "asc");

    // Obtener movimientos
    const movements = await db("cash_movements")
      .where({ cash_register_id: id })
      .orderBy("created_at", "asc");

    // Calcular total vendido
    const total_sales =
      parseFloat(cashRegister.cash_sales || 0) +
      parseFloat(cashRegister.transfer_sales || 0) +
      parseFloat(cashRegister.debit_sales || 0) +
      parseFloat(cashRegister.credit_sales || 0) +
      parseFloat(cashRegister.account_sales || 0);

    res.json({
      ...cashRegister,
      total_sales,
      sales,
      movements,
    });
  } catch (error) {
    console.error("Error en getCashRegisterDetail:", error);
    res.status(500).json({ message: "Error al obtener detalle" });
  }
};

module.exports = exports;
