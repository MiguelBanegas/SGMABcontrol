const db = require("../db");

// Helper para calcular el balance ajustado por inflación de un cliente
exports.getCustomerAdjustedBalance = async function (customerId, businessId) {
  // 1. Obtener todas las transacciones del cliente
  const transactions = await db("customer_account_transactions").where({
    customer_id: customerId,
    business_id: businessId,
  });

  // 2. Pagos y deudas sin vinculación a una venta
  const unlinkedPayments = transactions
    .filter((t) => t.type === "payment" && !t.sale_id)
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const unlinkedDebts = transactions
    .filter((t) => t.type === "debt" && !t.sale_id)
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const adjustments = transactions
    .filter((t) => t.type === "adjustment")
    .reduce(
      (acc, t) =>
        acc +
        (t.type === "debt"
          ? parseFloat(t.amount || 0)
          : -parseFloat(t.amount || 0)),
      0
    );

  // 3. Ventas vinculadas
  const saleIds = [
    ...new Set(transactions.filter((t) => t.sale_id).map((t) => t.sale_id)),
  ];
  let totalLinkedDebt = 0;

  for (const saleId of saleIds) {
    const sale = await db("sales").where({ id: saleId }).first();
    if (!sale) continue;

    const originalTotal = parseFloat(sale.total || 0);
    const initialPaid = parseFloat(sale.amount_paid || 0);
    const originalDebt = originalTotal - initialPaid;

    // Pagos posteriores hechos a esta venta específica
    const linkedPayments = transactions
      .filter((t) => t.type === "payment" && t.sale_id === saleId)
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    // Si la deuda original está SALDADA (se pagó el 100% de la deuda histórica),
    // dejamos de revalorizar. El cliente ya cumplió.
    if (linkedPayments >= originalDebt && originalDebt > 0) {
      // Deuda saldada = 0 pendiente (el pago excedente si lo hubiera ya se restó del total debt arriba si fuera unlinked)
      // Pero aquí estamos procesando venta por venta.
      totalLinkedDebt += 0;
    } else if (originalDebt > 0) {
      const items = await db("sale_items")
        .join("products", "sale_items.product_id", "products.id")
        .where({ sale_id: saleId })
        .select("sale_items.quantity", "products.price_sell");

      const currentTotal = items.reduce(
        (acc, item) =>
          acc + parseFloat(item.quantity) * parseFloat(item.price_sell),
        0
      );
      const pendingForThisSale = Math.max(
        0,
        currentTotal - initialPaid - linkedPayments
      );
      totalLinkedDebt += pendingForThisSale;
    } else {
      // Contado o pago en exceso
      totalLinkedDebt -= linkedPayments;
    }
  }

  return totalLinkedDebt + unlinkedDebts - unlinkedPayments + adjustments;
};

// Obtener transacciones de un cliente
exports.getCustomerTransactions = async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await db("customers")
      .where({ id, business_id: req.user.business_id })
      .first();

    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Obtener el balance de la última transacción (sistema de partida doble)
    const lastTransaction = await db("customer_account_transactions")
      .where({ customer_id: id, business_id: req.user.business_id })
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .first();

    const balance = lastTransaction ? parseFloat(lastTransaction.balance) : 0;

    const transactions = await db("customer_account_transactions")
      .where({ customer_id: id, business_id: req.user.business_id })
      .orderBy("created_at", "desc")
      .orderBy("id", "desc");

    const transactionsWithItemsAndPayments = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.sale_id) {
          const sale = await db("sales")
            .where({ id: transaction.sale_id })
            .first();

          const items = await db("sale_items")
            .join("products", "sale_items.product_id", "products.id")
            .where({ sale_id: transaction.sale_id })
            .select(
              "sale_items.*",
              "products.name as product_name",
              "products.price_sell as current_price_sell"
            );

          // Obtener pagos POSTERIORES para esta venta (excluyendo pagos iniciales)
          // Los pagos iniciales tienen el mismo created_at que la venta
          const saleCreatedAt = new Date(sale.created_at).getTime();
          const linkedPaymentsSum = transactions
            .filter((t) => {
              if (t.type !== "payment" || t.sale_id !== transaction.sale_id)
                return false;
              // Excluir pagos que se hicieron al mismo tiempo que la venta (pagos iniciales)
              const paymentCreatedAt = new Date(t.created_at).getTime();
              // Considerar un margen de 5 segundos para pagos iniciales
              return Math.abs(paymentCreatedAt - saleCreatedAt) > 5000;
            })
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

          // Revalorización para el registro individual
          let revaluedAmount = parseFloat(transaction.amount);
          const originalDebt =
            parseFloat(sale.total || 0) - parseFloat(sale.amount_paid || 0);

          if (transaction.type === "debt" && linkedPaymentsSum < originalDebt) {
            const currentTotal = items.reduce(
              (acc, item) =>
                acc +
                parseFloat(item.quantity) * parseFloat(item.current_price_sell),
              0
            );
            revaluedAmount =
              currentTotal -
              parseFloat(sale.amount_paid || 0) -
              linkedPaymentsSum;
          } else if (
            transaction.type === "debt" &&
            linkedPaymentsSum >= originalDebt
          ) {
            // Ya se pagó la histórica, la deuda actual de esta fila es 0
            revaluedAmount = 0;
          }

          return {
            ...transaction,
            items,
            original_sale: sale,
            linked_payments_sum: linkedPaymentsSum,
            revalued_amount: Math.max(0, revaluedAmount),
          };
        }
        return transaction;
      })
    );

    res.json({
      customer,
      balance,
      transactions: transactionsWithItemsAndPayments,
    });
  } catch (error) {
    console.error("Error en getCustomerTransactions:", error);
    res.status(500).json({ message: "Error al obtener transacciones" });
  }
};

// Obtener balances de todos los clientes
exports.getCustomerBalances = async (req, res) => {
  try {
    const customers = await db("customers")
      .where({ business_id: req.user.business_id })
      .select("id", "name", "email", "phone");

    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        // Obtener el balance de la última transacción
        const lastTransaction = await db("customer_account_transactions")
          .where({
            customer_id: customer.id,
            business_id: req.user.business_id,
          })
          .orderBy("created_at", "desc")
          .orderBy("id", "desc")
          .first();

        const balance = lastTransaction
          ? parseFloat(lastTransaction.balance)
          : 0;

        return {
          ...customer,
          balance: parseFloat(balance.toFixed(2)),
        };
      })
    );

    // Ordenar por balance descendente (los que más deben primero)
    customersWithBalances.sort((a, b) => b.balance - a.balance);

    const totalDebt = customersWithBalances.reduce(
      (acc, curr) => acc + Math.max(0, curr.balance),
      0
    );
    const customersWithDebt = customersWithBalances.filter(
      (c) => c.balance > 0
    ).length;

    res.json({
      customers: customersWithBalances,
      summary: {
        totalDebt,
        customersWithDebt,
      },
    });
  } catch (error) {
    console.error("Error en getCustomerBalances:", error);
    res.status(500).json({ message: "Error al obtener balances" });
  }
};

// Registrar pago de un cliente (soporta pago único o por lote)
exports.recordPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, description, sale_id, batchPayments, payment_method } =
    req.body;
  const effectivePaymentMethod = payment_method || "Efectivo";

  if (
    (!amount || amount <= 0) &&
    (!batchPayments || batchPayments.length === 0)
  ) {
    return res.status(400).json({
      message: "El monto debe ser mayor a 0 o enviar un lote de pagos",
    });
  }

  const trx = await db.transaction();
  try {
    const customer = await trx("customers")
      .where({ id, business_id: req.user.business_id })
      .first();

    if (!customer) {
      await trx.rollback();
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Obtener balance actual de la última transacción (sistema de partida doble)
    const lastTransaction = await trx("customer_account_transactions")
      .where({ customer_id: id, business_id: req.user.business_id })
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .first();

    let currentBalance = lastTransaction
      ? parseFloat(lastTransaction.balance)
      : 0;
    const results = [];

    // Helper para marcar venta como saldada si corresponde
    const checkAndMarkSettled = async (saleId) => {
      const sale = await trx("sales").where({ id: saleId }).first();
      if (!sale || sale.settled_at) return;

      const items = await trx("sale_items")
        .join("products", "sale_items.product_id", "products.id")
        .where({ sale_id: saleId })
        .select("sale_items.quantity", "products.price_sell");

      const transactions = await trx("customer_account_transactions").where({
        sale_id: saleId,
        type: "payment",
        customer_id: id,
      });

      const linkedPaymentsSum = transactions.reduce(
        (acc, t) => acc + parseFloat(t.amount || 0),
        0
      );

      const originalDebt =
        parseFloat(sale.total || 0) - parseFloat(sale.amount_paid || 0);

      // Si se pagó la histórica O la revalorizada llega a 0
      if (linkedPaymentsSum >= originalDebt) {
        await trx("sales")
          .where({ id: saleId })
          .update({ settled_at: trx.fn.now() });
      } else {
        const currentTotal = items.reduce(
          (acc, item) =>
            acc + parseFloat(item.quantity) * parseFloat(item.price_sell),
          0
        );
        const revaluedPending =
          currentTotal - parseFloat(sale.amount_paid || 0) - linkedPaymentsSum;
        if (revaluedPending <= 0.01) {
          await trx("sales")
            .where({ id: saleId })
            .update({ settled_at: trx.fn.now() });
        }
      }
    };

    // Caso A: Pago por lote (Selección múltiple)
    if (
      batchPayments &&
      Array.isArray(batchPayments) &&
      batchPayments.length > 0
    ) {
      for (const pay of batchPayments) {
        currentBalance -= parseFloat(pay.amount);

        const [inserted] = await trx("customer_account_transactions")
          .insert({
            customer_id: id,
            sale_id: pay.sale_id || null,
            type: "payment",
            amount: parseFloat(pay.amount),
            balance: currentBalance,
            description:
              pay.description ||
              `Pago vinculado a venta - $${parseFloat(pay.amount).toFixed(2)}`,
            payment_method: effectivePaymentMethod,
            business_id: req.user.business_id,
          })
          .returning("*");

        results.push(inserted);
        if (pay.sale_id) {
          await checkAndMarkSettled(pay.sale_id);
        }
      }
    } else {
      // Caso B: Pago único tradicional
      currentBalance -= parseFloat(amount);
      const [inserted] = await trx("customer_account_transactions")
        .insert({
          customer_id: id,
          sale_id: sale_id || null,
          type: "payment",
          amount: parseFloat(amount),
          balance: currentBalance,
          description:
            description || `Pago recibido - $${parseFloat(amount).toFixed(2)}`,
          payment_method: effectivePaymentMethod,
          business_id: req.user.business_id,
        })
        .returning("*");
      results.push(inserted);
      if (sale_id) {
        await checkAndMarkSettled(sale_id);
      }
    }

    // Registrar en caja abierta si existe
    const openRegister = await trx("cash_registers")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
        status: "open",
      })
      .first();

    if (openRegister) {
      // Calcular el total de pagos registrados
      const totalPayments = batchPayments
        ? batchPayments.reduce((acc, pay) => acc + parseFloat(pay.amount), 0)
        : parseFloat(amount);

      // Registrar movimiento en cash_movements
      await trx("cash_movements").insert({
        cash_register_id: openRegister.id,
        type: "account_payment",
        amount: totalPayments,
        payment_method: effectivePaymentMethod,
        description: batchPayments
          ? `Cobro de cuenta corriente - ${customer.name} (${batchPayments.length} pagos)`
          : `Cobro de cuenta corriente - ${customer.name}`,
      });
    }

    await trx.commit();

    res.json({
      message: batchPayments
        ? "Pagos por lote registrados exitosamente"
        : "Pago registrado exitosamente",
      results,
      finalBalance: currentBalance,
    });
  } catch (error) {
    await trx.rollback();
    console.error("Error en recordPayment:", error);
    res.status(500).json({ message: "Error al registrar pago" });
  }
};
