const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const { validators } = require("../middleware/queryValidator");

function normalizePaymentsWithDiscount(payments, total) {
  if (!Array.isArray(payments) || payments.length === 0) return [];

  const normalized = payments
    .map((p) => ({
      method: p.method || p.payment_method || "Efectivo",
      amount: parseFloat(p.amount || 0),
    }))
    .filter((p) => p.amount > 0);

  const target = parseFloat(total || 0);
  const accountSum = normalized
    .filter((p) => p.method === "Cta Cte")
    .reduce((sum, p) => sum + p.amount, 0);
  const nonAccountSum = normalized
    .filter((p) => p.method !== "Cta Cte")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCurrentSum = accountSum + nonAccountSum;

  if (totalCurrentSum <= 0 || target < 0) return normalized;
  if (Math.abs(totalCurrentSum - target) <= 0.01) return normalized;

  // Ajustar proporcionalmente solo medios no Cta Cte (Efectivo, MP, etc.)
  // El monto de Cta Cte se considera fijo ya que es la deuda asignada.
  const remainingToCover = target - accountSum;
  if (nonAccountSum <= 0) return normalized;

  const factor = remainingToCover / nonAccountSum;
  let adjustedNonAccountSum = 0;
  const adjusted = normalized.map((p) => {
    if (p.method === "Cta Cte") return p;
    const newAmount = parseFloat((p.amount * factor).toFixed(2));
    adjustedNonAccountSum += newAmount;
    return { ...p, amount: newAmount };
  });

  // Corregir diferencia de redondeo en efectivo (o último medio no Cta Cte).
  const roundingDiff = parseFloat((remainingToCover - adjustedNonAccountSum).toFixed(2));
  if (Math.abs(roundingDiff) > 0.009) {
    const idxCash = adjusted.findIndex((p) => p.method === "Efectivo");
    const idxFallback = adjusted.findIndex((p) => p.method !== "Cta Cte");
    const idx = idxCash >= 0 ? idxCash : idxFallback;
    if (idx >= 0) {
      adjusted[idx].amount = parseFloat(
        (adjusted[idx].amount + roundingDiff).toFixed(2),
      );
    }
  }

  return adjusted;
}


exports.createSale = async (req, res) => {
  const {
    id,
    items,
    customer_id,
    created_at,
    payment_method,
    amount_paid,
    change_given,
    debt_amount,
    payments,
  } = req.body;
  const user_id = req.user.id;

  // Debug: Log payment data
  console.log("Payment data received:", {
    amount_paid,
    change_given,
    debt_amount,
    customer_id,
  });

  // Validación: Si hay deuda, debe haber cliente
  if (debt_amount && debt_amount > 0 && !customer_id) {
    return res.status(400).json({
      message: "No se puede registrar una deuda sin un cliente asociado",
    });
  }

  // Verificar si hay una caja abierta para este usuario
  const openRegisterCheck = await db("cash_registers")
    .where({
      user_id: req.user.id,
      business_id: req.user.business_id,
      status: "open",
    })
    .first();

  if (!openRegisterCheck) {
    return res.status(400).json({
      message: "Debe abrir la caja antes de realizar una venta",
    });
  }

  // Validación: Si hay envases, debe haber cliente REAL para trazabilidad
  try {
    const productIds = items.map((i) => i.product_id);
    const containers = await db("products")
      .whereIn("id", productIds)
      .andWhere("is_container", true)
      .andWhere("business_id", req.user.business_id);

    if (containers.length > 0) {
      if (!customer_id) {
        return res.status(400).json({
          message: "Para ventas con envases, debe seleccionar un cliente",
        });
      }

      // Verificar si es Consumidor Final
      const customer = await db("customers")
        .where({ id: customer_id, business_id: req.user.business_id })
        .first();
      
      if (!customer || 
          customer.name.toLowerCase().includes("cons. final") || 
          customer.name.toLowerCase().includes("consumidor final")) {
        return res.status(400).json({
          message: "No se pueden prestar envases a un Consumidor Final. Por favor seleccione un cliente real.",
        });
      }
    }
  } catch (error) {
    console.error("Error validando envases:", error);
  }

  const trx = await db.transaction();
  try {
    // Obtener descuento por efectivo desde settings
    const cashDiscountSetting = await trx("settings")
      .where({
        key: "cash_discount_percent",
        business_id: req.user.business_id,
      })
      .first();
    const cashDiscountPercent = parseFloat(cashDiscountSetting?.value || 0);

    let subtotal = 0;
    const saleItems = [];

    // Procesar cada item y calcular promociones
    for (const item of items) {
      const product = await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .first();

      let itemTotal = 0;
      let effectiveUnitPrice = product.price_sell;

      // Calcular precio según tipo de promoción
      switch (product.promo_type) {
        case "price":
          // Solo precio oferta
          if (product.price_offer) {
            itemTotal = item.quantity * product.price_offer;
            effectiveUnitPrice = product.price_offer;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;

        case "quantity":
          // Solo promoción XxY sobre precio lista
          if (product.promo_buy && product.promo_pay) {
            const sets = Math.floor(item.quantity / product.promo_buy);
            const remaining = item.quantity % product.promo_buy;
            const paidItems = sets * product.promo_pay + remaining;
            itemTotal = paidItems * product.price_sell;
            effectiveUnitPrice = itemTotal / item.quantity;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;

        case "both":
          // Ambas: XxY sobre precio oferta
          if (product.promo_buy && product.promo_pay && product.price_offer) {
            const sets = Math.floor(item.quantity / product.promo_buy);
            const remaining = item.quantity % product.promo_buy;
            const paidItems = sets * product.promo_pay + remaining;
            itemTotal = paidItems * product.price_offer; // XxY sobre precio oferta
            effectiveUnitPrice = itemTotal / item.quantity;
          } else if (product.price_offer) {
            // Si falta XxY, solo aplicar precio oferta
            itemTotal = item.quantity * product.price_offer;
            effectiveUnitPrice = product.price_offer;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;

        default:
          // Sin promoción o promo_type = 'none'
          itemTotal = item.quantity * product.price_sell;
      }

      subtotal += itemTotal;

      // Calcular descuento (diferencia entre precio normal y precio efectivo)
      const discount = Math.max(
        0,
        (product.price_sell - effectiveUnitPrice) * item.quantity,
      );

      saleItems.push({
        sale_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_unit: effectiveUnitPrice,
        subtotal: itemTotal,
        cost_at_sale: product.price_buy || 0,
        discount_amount: discount,
        promo_type: product.promo_type || "none",
        promo_buy: product.promo_buy,
        promo_pay: product.promo_pay,
        price_sell_at_sale: product.price_sell,
        price_offer_at_sale: product.price_offer,
        sell_by_weight: product.sell_by_weight ? 1 : 0,
      });
    }

    // Aplicar descuento por efectivo: SOLO si el pago es íntegramente en efectivo
    let cashDiscount = 0;
    if (cashDiscountPercent > 0) {
      let isTotalCash = false;

      if (payments && Array.isArray(payments) && payments.length > 0) {
        // Si hay desglose de pagos, comprobamos que solo haya Efectivo
        const activePayments = payments.filter(p => parseFloat(p.amount || 0) > 0.01);
        if (activePayments.length === 1 && (activePayments[0].method || activePayments[0].payment_method) === "Efectivo") {
          isTotalCash = true;
        }
      } else if (payment_method === "Efectivo") {
        isTotalCash = true;
      }

      if (isTotalCash) {
        cashDiscount = subtotal * (cashDiscountPercent / 100);
      }
    }

    const total = subtotal - cashDiscount;

    // Guardar venta (creditUsed se calculará después)
    const finalDebtAfterCredit = 0; // Se calculará después

    // Buscar caja abierta (para cualquier método de pago)
    let cash_register_id = null;
    const openRegister = await trx("cash_registers")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
        status: "open",
      })
      .first();

    if (openRegister) {
      cash_register_id = openRegister.id;
    }

    const effectivePaymentMethod = payments && payments.length > 1 
      ? "Múltiple" 
      : (payment_method || "Efectivo");

    await trx("sales").insert({
      id,
      user_id,
      business_id: req.user.business_id,
      customer_id: customer_id || null,
      subtotal,
      cash_discount: cashDiscount,
      total,
      payment_method: effectivePaymentMethod,
      amount_paid: amount_paid || null,
      change_given: change_given || null,
      debt_amount: null, // Initial debt is null, will be updated
      credit_applied: 0, // Initial credit applied is 0, will be updated
      status: "completado", // Initial status, will be updated
      settled_at: null, // Initial settled_at, will be updated
      cash_register_id: cash_register_id, // Asociar con caja abierta
      created_at: created_at || trx.fn.now(),
    });

    // Guardar desglose de pagos
    if (payments && Array.isArray(payments) && payments.length > 0) {
      const normalizedPayments = normalizePaymentsWithDiscount(payments, total);
      const paymentRecords = normalizedPayments.map((p) => ({
        id: uuidv4(),
        sale_id: id,
        payment_method: p.method,
        amount: parseFloat(p.amount),
        business_id: req.user.business_id,
        created_at: created_at || trx.fn.now(),
      }));
      await trx("sale_payments").insert(paymentRecords);
    } else {
      // Compatibilidad: crear un único registro de pago
      await trx("sale_payments").insert({
        id: uuidv4(),
        sale_id: id,
        payment_method: payment_method || "Efectivo",
        amount: payment_method === "Cta Cte" ? 0 : total,
        business_id: req.user.business_id,
        created_at: created_at || trx.fn.now(),
      });
    }

    // Guardar items
    await trx("sale_items").insert(saleItems);

    // Registrar transacción en cuenta corriente del cliente (Siempre que haya cliente para trazabilidad)
    if (customer_id) {
      // Obtener el cliente para verificar si es Consumidor Final
      const customer = await trx("customers")
        .where({ id: customer_id })
        .first();

      if (customer && !customer.name.toLowerCase().includes("cons. final")) {
        const normalizedPayments = normalizePaymentsWithDiscount(payments || [], total);
        
        // Calcular cuánto pagó realmente (descontando el vuelto)
        let netPaid = 0;
        if (payments && Array.isArray(payments) && payments.length > 0) {
          if (normalizedPayments.length > 0) {
            // El pago neto es todo lo que NO es Cta Cte
            netPaid = normalizedPayments
              .filter((p) => p.method !== "Cta Cte")
              .reduce((sum, p) => sum + parseFloat(p.amount), 0);
          } else {
            netPaid =
              payment_method === "Cta Cte"
                ? 0
                : parseFloat(amount_paid || 0) - parseFloat(change_given || 0);
          }
        } else {
          netPaid =
            payment_method === "Cta Cte"
              ? 0
              : parseFloat(amount_paid || 0) - parseFloat(change_given || 0);
        }
        const remainingDebt = total - netPaid; // Deuda de la venta antes de aplicar crédito previo

        // Obtener el balance ANTES de esta venta para la condición
        const lastTxBeforeCondition = await trx("customer_account_transactions")
          .where({ customer_id, business_id: req.user.business_id })
          .orderBy("created_at", "desc")
          .orderBy("id", "desc")
          .first();
        const balanceBeforeSale = lastTxBeforeCondition
          ? parseFloat(lastTxBeforeCondition.balance)
          : 0;

        // Solo registrar transacciones si hay deuda o crédito involucrado
        if (remainingDebt > 0.01 || balanceBeforeSale < 0) {
          const creditAvailable =
            balanceBeforeSale < 0 ? Math.abs(balanceBeforeSale) : 0;

          // 1. Registrar la VENTA completa como Deuda
          let currentBalance = balanceBeforeSale + total;
          await trx("customer_account_transactions").insert({
            customer_id,
            sale_id: id,
            type: "debt",
            amount: total,
            balance: currentBalance,
            description: `Venta #${id.substring(0, 8)} (Total: $${total.toFixed(
              2,
            )})`,
            business_id: req.user.business_id,
          });

          // 2. Registrar el PAGO en efectivo si hubo
          if (netPaid > 0) {
            currentBalance -= netPaid;
            await trx("customer_account_transactions").insert({
              customer_id,
              sale_id: id,
              type: "payment",
              amount: netPaid,
              balance: currentBalance,
              description: `Pago contado en Venta #${id.substring(0, 8)}`,
              business_id: req.user.business_id,
            });
          }

          // 3. Aplicar CRÉDITO si había saldo a favor ANTES de la venta
          console.log(
            "DEBUG: balanceBeforeSale=",
            balanceBeforeSale,
            "creditAvailable=",
            creditAvailable,
            "currentBalance=",
            currentBalance,
          );
          const creditUsed = Math.max(
            0,
            Math.min(creditAvailable, Math.max(0, remainingDebt)),
          );
          const finalDebtForSale = Math.max(0, remainingDebt - creditUsed);

          if (creditUsed > 0) {
            // El crédito aplicado no debe restar el balance de nuevo aquí porque el crédito ya existe
            // como un pago negativo previo. Al sumar la deuda total arriba, ya se consume.
            // Registramos la transacción vinculada únicamente para trazabilidad de la venta.
            await trx("customer_account_transactions").insert({
              customer_id,
              sale_id: id,
              type: "payment",
              amount: creditUsed,
              balance: currentBalance,
              description: `Crédito aplicado en Venta #${id.substring(0, 8)}`,
              business_id: req.user.business_id,
            });
          }

          // El estado/saldo de la venta debe depender de su deuda propia,
          // no del balance global del cliente.
          await trx("sales")
            .where({ id })
            .update({
              credit_applied: creditUsed,
              debt_amount: finalDebtForSale > 0 ? finalDebtForSale : null,
              status: finalDebtForSale > 0 ? "pendiente" : "completado",
              settled_at: finalDebtForSale <= 0 ? trx.fn.now() : null,
            });

          console.log(
            "Traceability split transactions recorded successfully. Final Customer Balance:",
            currentBalance,
          );
        } else {
          // Venta pagada completamente en efectivo, no hay deuda
          console.log(
            "Sale fully paid in cash, no customer account transactions needed.",
          );
        }
      }
    }

    // Actualizar stock y gestionar envases
    for (const item of items) {
      const product = await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .first();

      // 1. Decrementar stock
      await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .decrement("stock", item.quantity);

      // 2. Si es envase y hay cliente, registrar préstamo
      if (product.is_container && customer_id) {
        console.log(
          `[ENVASES] Registrando préstamo: Producto=${product.name}, ClienteID=${customer_id}, Cantidad=${item.quantity}`,
        );
        // Buscar balance actual
        const currentBalanceRec = await trx("container_balances")
          .where({
            customer_id: customer_id,
            product_id: item.product_id,
            business_id: req.user.business_id,
          })
          .first();

        const currentBalance = currentBalanceRec
          ? parseFloat(currentBalanceRec.balance)
          : 0;
        const newBalance = currentBalance + parseFloat(item.quantity);

        if (currentBalanceRec) {
          await trx("container_balances")
            .where({ id: currentBalanceRec.id })
            .update({
              balance: newBalance,
              updated_at: trx.fn.now(),
            });
        } else {
          await trx("container_balances").insert({
            customer_id: customer_id,
            product_id: item.product_id,
            balance: newBalance,
            business_id: req.user.business_id,
          });
        }

        // Registrar transacción de préstamo
        await trx("container_transactions").insert({
          customer_id: customer_id,
          product_id: item.product_id,
          sale_id: id,
          type: "loan",
          amount: parseFloat(item.quantity),
          balance_after: newBalance,
          description: `Préstamo en Venta #${id.substring(0, 8)}`,
          business_id: req.user.business_id,
        });
        console.log(
          `[ENVASES] Balance actualizado para ${product.name}: ${newBalance}`,
        );
      }
    }

    await trx.commit();

    // Obtener productos actualizados para enviar delta por socket
    try {
      const productIds = items.map((item) => item.product_id);
      const updatedProducts = await db("products")
        .leftJoin("categories", "products.category_id", "categories.id")
        .whereIn("products.id", productIds)
        .andWhere("products.business_id", req.user.business_id)
        .select("products.*", "categories.name as category_name");

      req.app.get("io").emit("catalog_updated", updatedProducts);
    } catch (socketError) {
      console.error("Error al enviar delta de catálogo:", socketError);
      req.app.get("io").emit("catalog_updated"); // Fallback a recarga completa
    }

    req.app.get("io").emit("sales_updated");

    res.status(201).json({
      message: "Venta registrada con éxito",
      subtotal,
      cash_discount: cashDiscount,
      total,
    });
  } catch (error) {
    if (trx) await trx.rollback();
    console.error("CREATE_SALE_ERROR:", error);
    res.status(500).json({
      message: "Error al registrar la venta",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    // 1. Obtener totales diarios de ventas (sin usar DISTINCT para evitar errores)
    const salesData = await db("sales")
      .where({ business_id: req.user.business_id })
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw("SUM(total)::FLOAT as total_day"),
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(7);

    // 2. Para cada día, calcular el costo total de los productos vendidos
    const stats = await Promise.all(
      salesData.map(async (dayStat) => {
        const costRes = await db("sale_items")
          .join("sales", "sale_items.sale_id", "sales.id")
          .whereRaw("DATE(sales.created_at) = ?", [dayStat.date])
          .andWhere("sales.business_id", req.user.business_id)
          .select(
            db.raw(
              "SUM(sale_items.quantity * COALESCE(sale_items.cost_at_sale, 0))::FLOAT as total_cost",
            ),
          )
          .first();

        const totalCost = costRes.total_cost || 0;
        return {
          date: dayStat.date,
          total_day: dayStat.total_day,
          profit_day: dayStat.total_day - totalCost,
        };
      }),
    );

    // 3. Asegurar que el primer elemento sea siempre HOY (en horario local del servidor/negocio)
    // Usamos una fecha local manual para evitar desfases de UTC
    const now = new Date();
    // Ajuste simple a UTC-3 (o la del servidor) para obtener el YYYY-MM-DD correcto
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().split("T")[0];

    // Normalizar todas las fechas de stats a string YYYY-MM-DD para comparación segura
    const normalizedStats = stats.map((s) => ({
      ...s,
      date:
        s.date instanceof Date
          ? s.date.toISOString().split("T")[0]
          : String(s.date),
    }));

    const todayStats = normalizedStats.find((s) => s.date === localISOTime);

    if (!todayStats) {
      // Si no hay ventas hoy, agregar un registro con ceros al inicio
      normalizedStats.unshift({
        date: localISOTime,
        total_day: 0,
        profit_day: 0,
      });
      // Limitar a 7 días
      if (normalizedStats.length > 7) {
        normalizedStats.pop();
      }
    } else if (normalizedStats[0].date !== localISOTime) {
      // Si hay ventas hoy pero no es el primer elemento, reordenar
      const index = normalizedStats.findIndex((s) => s.date === localISOTime);
      const todayData = normalizedStats.splice(index, 1)[0];
      normalizedStats.unshift(todayData);
    }

    res.json(normalizedStats);
  } catch (error) {
    console.error("Error en getSalesStats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

exports.getSalesHistory = async (req, res) => {
  try {
    const { date, seller, customer, payment, status } = req.query;

    let query = db("sales")
      .leftJoin("users", "sales.user_id", "users.id")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .where("sales.business_id", req.user.business_id);

    // Filtro por fecha (por defecto: hoy)
    if (date) {
      if (!validators.date(date)) {
        return res.status(400).json({ message: "Parámetro de fecha inválido" });
      }
      query = query.whereRaw("DATE(sales.created_at) = ?", [date]);
    }

    // Filtro por vendedor
    if (seller) {
      query = query.whereRaw("users.username LIKE ?", [`%${seller}%`]);
    }

    // Filtro por cliente
    if (customer) {
      query = query.whereRaw("customers.name LIKE ?", [`%${customer}%`]);
    }

    // Filtro por método de pago
    if (payment) {
      query = query.where("sales.payment_method", payment);
    }

    // Filtro por estado
    if (status) {
      query = query.where("sales.status", status);
    }

    const sales = await query
      .select(
        "sales.*",
        "users.username as seller_name",
        "customers.name as customer_name",
        "customers.phone as customer_phone",
      )
      .orderBy("sales.created_at", "desc");

    const history = await Promise.all(
      sales.map(async (sale) => {
        const items = await db("sale_items")
          .join("products", "sale_items.product_id", "products.id")
          .where({ sale_id: sale.id })
          .select(
            "sale_items.*",
            "products.name as product_name",
            "products.sku",
            "products.image_url",
          );
        return { ...sale, items };
      }),
    );

    res.json(history);
  } catch (error) {
    console.error("Error en getSalesHistory:", error);
    res.status(500).json({ message: "Error al obtener historial de ventas" });
  }
};

exports.toggleSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db("sales")
      .where({ id, business_id: req.user.business_id })
      .update({ status });
    req.app.get("io").emit("sales_updated");
    res.json({ message: "Estado de venta actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
};

// Obtener venta en progreso del usuario
exports.getPendingSale = async (req, res) => {
  const user_id = req.user.id;

  try {
    const pendingSale = await db("pending_sales")
      .where({ user_id, business_id: req.user.business_id })
      .first();

    if (!pendingSale) {
      return res.json(null);
    }

    res.json({
      cart: JSON.parse(pendingSale.cart_data),
      customer_id: pendingSale.customer_id,
      payment_method: pendingSale.payment_method,
      updated_at: pendingSale.updated_at,
    });
  } catch (error) {
    console.error("Error en getPendingSale:", error);
    res.status(500).json({ message: "Error al obtener venta en progreso" });
  }
};

// Guardar/actualizar venta en progreso
exports.savePendingSale = async (req, res) => {
  const user_id = req.user.id;
  const { cart, customer_id, payment_method } = req.body;

  try {
    const cartData = JSON.stringify(cart);

    // Validar si el cliente existe antes de guardar
    let activeCustomerId = customer_id || null;
    if (activeCustomerId) {
      const customerExists = await db("customers")
        .where({ id: activeCustomerId, business_id: req.user.business_id })
        .first();
      if (!customerExists) {
        console.warn(
          `savePendingSale: El cliente ${activeCustomerId} no existe o no pertenece al negocio. Guardando como null.`,
        );
        activeCustomerId = null;
      }
    }

    // Verificar si ya existe una venta en progreso para este usuario
    const existing = await db("pending_sales")
      .where({ user_id, business_id: req.user.business_id })
      .first();

    if (existing) {
      // Actualizar
      await db("pending_sales")
        .where({ user_id, business_id: req.user.business_id })
        .update({
          cart_data: cartData,
          customer_id: activeCustomerId,
          payment_method: payment_method || "Efectivo",
          updated_at: db.fn.now(),
        });
    } else {
      // Insertar
      await db("pending_sales").insert({
        user_id,
        business_id: req.user.business_id,
        cart_data: cartData,
        customer_id: activeCustomerId,
        payment_method: payment_method || "Efectivo",
      });
    }

    res.json({ message: "Venta en progreso guardada" });
  } catch (error) {
    console.error("Error en savePendingSale:", error);
    res.status(500).json({ message: "Error al guardar venta en progreso" });
  }
};

// Limpiar venta en progreso
exports.clearPendingSale = async (req, res) => {
  const user_id = req.user.id;

  try {
    await db("pending_sales")
      .where({ user_id, business_id: req.user.business_id })
      .delete();
    res.json({ message: "Venta en progreso eliminada" });
  } catch (error) {
    console.error("Error en clearPendingSale:", error);
    res.status(500).json({ message: "Error al limpiar venta en progreso" });
  }
};

// Obtener ventas del vendedor actual con paginación
exports.getMySales = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const maxTotal = 100; // Máximo total de ventas

  try {
    // Calcular offset
    const offset = (page - 1) * perPage;

    // Limitar a máximo 100 ventas totales
    if (offset >= maxTotal) {
      return res.json({ sales: [], total: 0, hasMore: false });
    }

    // Obtener total de ventas del usuario (limitado a 100)
    const totalResult = await db("sales")
      .where({ user_id, business_id: req.user.business_id })
      .count("* as count")
      .first();

    const totalSales = Math.min(parseInt(totalResult.count), maxTotal);

    // Obtener ventas de la página actual
    const sales = await db("sales")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .leftJoin("users", "sales.user_id", "users.id")
      .where({
        "sales.user_id": user_id,
        "sales.business_id": req.user.business_id,
      })
      .select(
        "sales.*",
        "customers.name as customer_name",
        "customers.phone as customer_phone",
        "users.username as seller_name",
      )
      .orderBy("sales.created_at", "desc")
      .limit(perPage)
      .offset(offset);

    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await db("sale_items")
          .join("products", "sale_items.product_id", "products.id")
          .where({ sale_id: sale.id })
          .select(
            "sale_items.*",
            "products.name as product_name",
            "products.sku",
            "products.image_url",
          );
        const payments = await db("sale_payments")
          .where({ sale_id: sale.id })
          .select("*"); // Seleccionar todos los campos de pago
        return { ...sale, items, payments }; // ¡Faltaba este return!
      }),
    );

    res.json({
      sales: salesWithItems,
      total: totalSales,
      currentPage: page,
      perPage: perPage,
      totalPages: Math.ceil(totalSales / perPage),
      hasMore: offset + perPage < totalSales,
    });
  } catch (error) {
    console.error("Error en getMySales:", error);
    res.status(500).json({ message: "Error al obtener ventas" });
  }
};

exports.getSaleDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await db("sales")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .leftJoin("users", "sales.user_id", "users.id")
      .where({
        "sales.id": id,
        "sales.business_id": req.user.business_id,
      })
      .select(
        "sales.*",
        "customers.name as customer_name",
        "customers.phone as customer_phone",
        "users.username as seller_name",
      )
      .first();

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const items = await db("sale_items")
      .join("products", "sale_items.product_id", "products.id")
      .where({ sale_id: sale.id })
      .select(
        "sale_items.*",
        "products.name as product_name",
        "products.sku",
        "products.image_url",
      );
    const payments = await db("sale_payments")
      .where({ sale_id: sale.id })
      .select("*"); // Seleccionar todos los campos de pago

    res.json({ ...sale, items, payments });
  } catch (error) {
    console.error("Error en getSaleDetail:", error);
    res.status(500).json({ message: "Error al obtener detalle de la venta" });
  }
};

// Obtener estadísticas de ventas por producto
exports.getProductSalesStats = async (req, res) => {
  const { productId } = req.params;
  const { days = 30 } = req.query;

  try {
    // Obtener producto
    const product = await db("products")
      .where({ id: productId, business_id: req.user.business_id })
      .first();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Obtener ventas agrupadas por fecha
    const timeline = await db("sale_items")
      .join("sales", "sale_items.sale_id", "sales.id")
      .where("sale_items.product_id", productId)
      .where("sales.business_id", req.user.business_id)
      .where("sales.created_at", ">=", startDate)
      .select(
        db.raw("DATE(sales.created_at) as date"),
        db.raw("SUM(sale_items.quantity)::FLOAT as quantity"),
        db.raw("SUM(sale_items.subtotal)::FLOAT as revenue"),
      )
      .groupBy(db.raw("DATE(sales.created_at)"))
      .orderBy("date", "asc");

    // Calcular estadísticas
    const totalQuantity = timeline.reduce(
      (sum, day) => sum + parseFloat(day.quantity || 0),
      0,
    );
    const totalRevenue = timeline.reduce(
      (sum, day) => sum + parseFloat(day.revenue || 0),
      0,
    );
    const averageDaily = totalQuantity / parseInt(days);

    res.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price_sell: product.price_sell,
      },
      stats: {
        totalQuantity,
        totalRevenue,
        averageDaily,
        days: parseInt(days),
      },
      timeline,
    });
  } catch (error) {
    console.error("Error en getProductSalesStats:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas del producto" });
  }
};

// Obtener reporte de productos vendidos por período
exports.getProductsReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // Validar que se proporcionen las fechas
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Se requieren startDate y endDate",
      });
    }

    // Obtener reporte de productos vendidos
    const report = await db("sale_items")
      .join("sales", "sale_items.sale_id", "sales.id")
      .join("products", "sale_items.product_id", "products.id")
      .where("sales.business_id", req.user.business_id)
      .whereBetween("sales.created_at", [startDate, endDate])
      .select(
        "products.id as product_id",
        "products.name as product_name",
        "products.sku",
        db.raw("SUM(sale_items.quantity)::FLOAT as total_quantity"),
        db.raw("SUM(sale_items.subtotal)::FLOAT as total_revenue"),
      )
      .groupBy("products.id", "products.name", "products.sku")
      .orderBy("total_quantity", "desc");

    res.json(report);
  } catch (error) {
    console.error("Error en getProductsReport:", error);
    res.status(500).json({ message: "Error al obtener reporte de productos" });
  }
};

// Actualizar una venta existente
exports.updateSale = async (req, res) => {
  const { id } = req.params;
  const {
    items,
    customer_id,
    payment_method,
    amount_paid,
    change_given,
    payments,
    created_at, // Opcional, por si se quiere cambiar la fecha
  } = req.body;
  const user_id = req.user.id;
  const business_id = req.user.business_id;

  // Verificar si hay una caja abierta para este usuario
  const openRegister = await db("cash_registers")
    .where({ user_id, business_id, status: "open" })
    .first();

  if (!openRegister) {
    return res.status(400).json({
      message: "Debe abrir la caja antes de editar una venta",
    });
  }

  const trx = await db.transaction();
  try {
    // 1. Obtener la venta actual
    const oldSale = await trx("sales")
      .where({ id, business_id: req.user.business_id })
      .first();
    if (!oldSale) {
      await trx.rollback();
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Validar permisos: Admin o Dueño de la venta
    if (req.user.role !== "admin" && oldSale.user_id !== req.user.id) {
      await trx.rollback();
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar esta venta" });
    }

    // Validación: Si hay envases en los NUEVOS items, debe haber cliente
    const productIdsInNewItems = items.map((i) => i.product_id);
    const containerProducts = await trx("products")
      .whereIn("id", productIdsInNewItems)
      .andWhere("is_container", true)
      .andWhere("business_id", req.user.business_id);

    if (containerProducts.length > 0 && !customer_id) {
      await trx.rollback();
      return res.status(400).json({
        message: "Para ventas con envases, debe seleccionar un cliente",
      });
    }

    const oldItems = await trx("sale_items").where({ sale_id: id });
    const oldCustomerId = oldSale.customer_id;
    const oldPaymentMethod = oldSale.payment_method;
    const oldTotal = parseFloat(oldSale.total);
    const oldCashDiscount = parseFloat(oldSale.cash_discount || 0);

    // 2. Revertir Stock y balances de envases de items anteriores
    for (const item of oldItems) {
      // Revertir Stock
      await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .increment("stock", item.quantity);

      // Revertir Balance de Envases si corresponde
      const product = await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .first();

      if (product && product.is_container && oldCustomerId) {
        console.log(
          `[STOCK-ENVASES] Revirtiendo préstamo: Producto=${product.name}, StockActual=${product.stock}, Reversión=+${item.quantity}`,
        );
        await trx("container_balances")
          .where({
            customer_id: oldCustomerId,
            product_id: item.product_id,
            business_id: req.user.business_id,
          })
          .decrement("balance", item.quantity);
      }
    }

    // Limpiar transacciones de envases viejas
    await trx("container_transactions").where({ sale_id: id }).delete();

    // 3. Calcular nueva venta (Copiar lógica de createSale)
    const cashDiscountSetting = await trx("settings")
      .where({
        key: "cash_discount_percent",
        business_id: req.user.business_id,
      })
      .first();
    const cashDiscountPercent = parseFloat(cashDiscountSetting?.value || 0);

    let subtotal = 0;
    const newSaleItems = [];

    for (const item of items) {
      const product = await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .first();

      let itemTotal = 0;
      let effectiveUnitPrice = product.price_sell;

      switch (product.promo_type) {
        case "price":
          if (product.price_offer) {
            itemTotal = item.quantity * product.price_offer;
            effectiveUnitPrice = product.price_offer;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;
        case "quantity":
          if (product.promo_buy && product.promo_pay) {
            const sets = Math.floor(item.quantity / product.promo_buy);
            const remaining = item.quantity % product.promo_buy;
            const paidItems = sets * product.promo_pay + remaining;
            itemTotal = paidItems * product.price_sell;
            effectiveUnitPrice = itemTotal / item.quantity;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;
        case "both":
          if (product.promo_buy && product.promo_pay && product.price_offer) {
            const sets = Math.floor(item.quantity / product.promo_buy);
            const remaining = item.quantity % product.promo_buy;
            const paidItems = sets * product.promo_pay + remaining;
            itemTotal = paidItems * product.price_offer;
            effectiveUnitPrice = itemTotal / item.quantity;
          } else if (product.price_offer) {
            itemTotal = item.quantity * product.price_offer;
            effectiveUnitPrice = product.price_offer;
          } else {
            itemTotal = item.quantity * product.price_sell;
          }
          break;
        default:
          itemTotal = item.quantity * product.price_sell;
      }

      subtotal += itemTotal;
      const discount = Math.max(
        0,
        (product.price_sell - effectiveUnitPrice) * item.quantity,
      );

      newSaleItems.push({
        sale_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_unit: effectiveUnitPrice,
        subtotal: itemTotal,
        cost_at_sale: product.price_buy || 0,
        discount_amount: discount,
        promo_type: product.promo_type || "none",
        promo_buy: product.promo_buy,
        promo_pay: product.promo_pay,
        price_sell_at_sale: product.price_sell,
        price_offer_at_sale: product.price_offer,
        sell_by_weight: product.sell_by_weight ? 1 : 0,
      });
    }

    let cashDiscount = 0;
    if (cashDiscountPercent > 0) {
      let eligibleCashAmount = 0;
      if (payments && Array.isArray(payments) && payments.length > 0) {
        eligibleCashAmount = payments
          .filter((p) => (p.method || p.payment_method) === "Efectivo")
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      } else if (payment_method === "Efectivo") {
        eligibleCashAmount = subtotal;
      }
      eligibleCashAmount = Math.max(0, Math.min(eligibleCashAmount, subtotal));
      cashDiscount = eligibleCashAmount * (cashDiscountPercent / 100);
    }
    const total = subtotal - cashDiscount;

    // 4. Actualizar Caja (Si la caja existe)
    if (oldSale.cash_register_id) {
      const register = await trx("cash_registers")
        .where({ id: oldSale.cash_register_id })
        .first();
      // Solo actualizamos totales si la caja está cerrada (si está abierta se calculan al cerrar)
      // Pero mejor actualizamos siempre para consistencia visual
      // Calcular diferencias netas por método de pago
      const netChanges = {
        cash_sales: 0,
        transfer_sales: 0,
        debit_sales: 0,
        credit_sales: 0,
        account_sales: 0,
      };

      const getMethodKey = (method) => {
        switch (method) {
          case "Efectivo":
            return "cash_sales";
          case "Transferencia":
          case "MP":
            return "transfer_sales";
          case "Débito":
            return "debit_sales";
          case "Crédito":
            return "credit_sales";
          default:
            return null;
        }
      };

      // Restar totales viejos (monto neto cobrado)
      const oldKey = getMethodKey(oldPaymentMethod);
      const oldNetPaid = oldTotal - parseFloat(oldSale.debt_amount || 0);
      if (oldKey) netChanges[oldKey] -= oldNetPaid;

      if (oldSale.debt_amount)
        netChanges.account_sales -= parseFloat(oldSale.debt_amount);

      // Sumar totales nuevos (monto neto cobrado)
      const newKey = getMethodKey(payment_method);
      const netPaid =
        parseFloat(amount_paid || 0) - parseFloat(change_given || 0);
      const newDebt = Math.max(0, total - netPaid);

      if (newKey) netChanges[newKey] += netPaid;
      if (newDebt > 0 && customer_id) netChanges.account_sales += newDebt;

      const updateData = {};
      for (const [key, diff] of Object.entries(netChanges)) {
        if (diff !== 0) updateData[key] = db.raw(`?? + ?`, [key, diff]);
      }

      if (Object.keys(updateData).length > 0) {
        await trx("cash_registers")
          .where({ id: oldSale.cash_register_id })
          .update(updateData);
      }
    }

    // 5. Reemplazar Items de Venta
    await trx("sale_items").where({ sale_id: id }).delete();
    await trx("sale_items").insert(newSaleItems);

    // 6. Actualizar Stock nuevo e impactos de envases
    for (const item of items) {
      const product = await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .first();

      // Decrementar stock
      await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .decrement("stock", item.quantity);

      // Impacto en Envases (Igual que en createSale)
      if (product.is_container && customer_id) {
        console.log(
          `[STOCK-ENVASES] Nuevo préstamo: Producto=${product.name}, StockAnterior=${product.stock}, NuevoAjuste=-${item.quantity}`,
        );
        const currentBalanceRec = await trx("container_balances")
          .where({
            customer_id: customer_id,
            product_id: item.product_id,
            business_id: req.user.business_id,
          })
          .first();

        let newBalance = 0;
        if (!currentBalanceRec) {
          newBalance = parseFloat(item.quantity);
          await trx("container_balances").insert({
            customer_id: customer_id,
            product_id: item.product_id,
            balance: newBalance,
            business_id: req.user.business_id,
          });
        } else {
          newBalance =
            parseFloat(currentBalanceRec.balance) + parseFloat(item.quantity);
          await trx("container_balances")
            .where({ id: currentBalanceRec.id })
            .update({
              balance: newBalance,
              updated_at: trx.fn.now(),
            });
        }

        await trx("container_transactions").insert({
          customer_id: customer_id,
          product_id: item.product_id,
          sale_id: id,
          type: "loan",
          amount: parseFloat(item.quantity),
          balance_after: newBalance,
          description: `Préstamo en Venta (Editada) #${id.substring(0, 8)}`,
          business_id: req.user.business_id,
        });
        console.log(
          `[ENVASES-EDIT] Balance actualizado para ${product.name}: ${newBalance}`,
        );
      }
    }

    // 7. Gestionar Cuenta Corriente (Complejo y Robusto)
    if (customer_id) {
      const netPaidInEdit =
        parseFloat(amount_paid || 0) - parseFloat(change_given || 0);

      // Obtener transacciones EXISTENTES para esta venta
      const existingTxs = await trx("customer_account_transactions")
        .where({ sale_id: id })
        .orderBy("created_at", "asc")
        .orderBy("id", "asc");

      // Separar la deuda original (debt) y los pagos posteriores (payment)
      const debtTx = existingTxs.find((t) => t.type === "debt");
      // Pagos vinculados (pueden ser el inicial de la venta original + cobros posteriores por ventanilla)
      const paymentTxs = existingTxs.filter((t) => t.type === "payment");

      // Calcular cuánto ya pagó el cliente para esta venta (excluyendo el pago inicial si vamos a "reemplazarlo" con netPaidInEdit)
      // Pero mejor: tratamos a netPaidInEdit como el NUEVO pago inicial.
      // Sumamos todos los pagos vinculados excepto el primero (si era el pago inicial original)
      // Nota: Si la venta original fue 100% cta cte, el primer pago vinculado ya sería uno posterior.
      // Para simplificar: Calculamos el total pagado por el cliente para esta factura hasta ahora.
      const totalAlreadyPaid = paymentTxs.reduce(
        (acc, t) => acc + parseFloat(t.amount || 0),
        0,
      );

      // Borrar transacciones viejas de esta venta para recalcular balance limpio
      await trx("customer_account_transactions")
        .where({ sale_id: id })
        .delete();

      // Buscamos el balance anterior a esta venta
      const prevTx = await trx("customer_account_transactions")
        .where({ customer_id, business_id: req.user.business_id })
        .where("created_at", "<", oldSale.created_at)
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .first();

      let runningBalance = prevTx ? parseFloat(prevTx.balance) : 0;

      // A. Insertar la nueva DEUDA (Total de la venta editada)
      runningBalance += total;
      await trx("customer_account_transactions").insert({
        customer_id,
        sale_id: id,
        type: "debt",
        amount: total,
        balance: runningBalance,
        description: `Venta #${id.substring(0, 8)} (Editada)`,
        business_id: req.user.business_id,
        created_at: oldSale.created_at,
      });

      // B. Insertar el NUEVO PAGO inicial (si el cajero puso algo en la edición)
      if (netPaidInEdit > 0) {
        runningBalance -= netPaidInEdit;
        await trx("customer_account_transactions").insert({
          customer_id,
          sale_id: id,
          type: "payment",
          amount: netPaidInEdit,
          balance: runningBalance,
          description: `Pago en Venta #${id.substring(0, 8)} (Editada)`,
          business_id: req.user.business_id,
          created_at: oldSale.created_at,
          payment_method: payment_method || "Efectivo",
        });
      }

      // C. Re-insertar los pagos POSTERIORES (si existían y no eran el inicial)
      // Para saber si eran posteriores, simplemente los re-insertamos con su fecha original
      // Si el usuario simplemente está editando productos, no queremos perder los cobros que ya hizo.
      // IMPORTANTE: El pago inicial original suele tener la misma fecha que la venta.
      // Los pagos por ventanilla suelen tener fecha posterior o ID mayor.
      // Filtramos para NO REPETIR el pago inicial si ya lo pusimos en el punto B.
      // Pero como borramos todo arriba, mejor re-insertamos los que no coincidan con la descripción de "pago contado".
      // Una forma más segura: re-insertar todos los 'payment' que NO coincidan con la lógica de pago de la venta original.
      // En SGM, el pago inicial se identifica porque tiene el mismo sale_id.
      // Si el cliente cambió, estos pagos ya no aplican a este cliente.

      let extraPaymentsFromBefore = 0;
      if (oldCustomerId === customer_id) {
        // Si es el mismo cliente, conservamos los pagos realizados por fuera de la pantalla de ventas (cobros de cta cte)
        // que estaban vinculados a este sale_id.
        for (const pTx of paymentTxs) {
          // Si la descripción NO contiene "Pago contado en Venta" o similar, es un cobro posterior
          // O si la fecha es distinta (pero a veces es el mismo día).
          // Usualmente los pagos de Venta tienen una descripción específica.
          if (
            pTx.description.includes("Cobro de cuenta corriente") ||
            !pTx.description.includes("Pago contado")
          ) {
            runningBalance -= parseFloat(pTx.amount);
            await trx("customer_account_transactions").insert({
              customer_id,
              sale_id: id,
              type: "payment",
              amount: pTx.amount,
              balance: runningBalance,
              description: pTx.description,
              business_id: req.user.business_id,
              created_at: pTx.created_at,
              payment_method: pTx.payment_method,
            });
            extraPaymentsFromBefore += parseFloat(pTx.amount);
          }
        }
      }

      // RECALCULAR balances posteriores para este cliente
      const subsequentTxs = await trx("customer_account_transactions")
        .where({ customer_id, business_id: req.user.business_id })
        .where("created_at", ">", oldSale.created_at)
        .orderBy("created_at", "asc")
        .orderBy("id", "asc");

      for (const tx of subsequentTxs) {
        if (tx.type === "debt") runningBalance += parseFloat(tx.amount);
        else runningBalance -= parseFloat(tx.amount);

        await trx("customer_account_transactions")
          .where({ id: tx.id })
          .update({ balance: runningBalance });
      }

      // Si el cliente cambió, recalcular para el viejo (ya borramos sus tx vinculadas a esta venta)
      if (oldCustomerId && oldCustomerId !== customer_id) {
        const oldCustBalanceRes = await trx("customer_account_transactions")
          .where({
            customer_id: oldCustomerId,
            business_id: req.user.business_id,
          })
          .orderBy("created_at", "asc")
          .orderBy("id", "asc");

        let oldRunningBalance = 0;
        for (const tx of oldCustBalanceRes) {
          if (tx.type === "debt") oldRunningBalance += parseFloat(tx.amount);
          else oldRunningBalance -= parseFloat(tx.amount);
          await trx("customer_account_transactions")
            .where({ id: tx.id })
            .update({ balance: oldRunningBalance });
        }
      }

      // 8. Actualizar el objeto Sales con la deuda REAL restante
      // La deuda es: Nuevo Total - Nuevo Pago inicial - Pagos anteriores conservados
      const finalDebt = Math.max(
        0,
        total - netPaidInEdit - extraPaymentsFromBefore,
      );

      await trx("sales")
        .where({ id })
        .update({
          customer_id: customer_id || null,
          subtotal,
          cash_discount: cashDiscount,
          total,
          payment_method: effectivePaymentMethod,
          amount_paid: amount_paid || null,
          change_given: change_given || null,
          debt_amount: finalDebt > 0.01 ? finalDebt : null,
          status: finalDebt > 0.01 ? "pendiente" : "completado",
          settled_at:
            finalDebt <= 0.01 ? oldSale.settled_at || trx.fn.now() : null,
          created_at: created_at || oldSale.created_at,
        });

      // 9. Actualizar sale_payments para reflejar el nuevo total con descuentos
      await trx("sale_payments").where({ sale_id: id }).delete();

      if (payments && Array.isArray(payments) && payments.length > 0) {
        const normalizedPayments = normalizePaymentsWithDiscount(payments, total);
        const paymentRecords = normalizedPayments.map((p) => ({
          id: uuidv4(),
          sale_id: id,
          payment_method: p.method || p.payment_method || "Efectivo",
          amount: parseFloat(p.amount || 0),
          business_id: req.user.business_id,
          created_at: created_at || oldSale.created_at,
        }));
        await trx("sale_payments").insert(paymentRecords);
      } else {
        await trx("sale_payments").insert({
          id: uuidv4(),
          sale_id: id,
          payment_method: payment_method || "Efectivo",
          amount: payment_method === "Cta Cte" ? 0 : total,
          business_id: req.user.business_id,
          created_at: created_at || oldSale.created_at,
        });
      }
    }

    await trx.commit();

    // Notificar cambios por socket
    req.app.get("io").emit("sales_updated");
    req.app.get("io").emit("catalog_updated");

    res.json({ message: "Venta actualizada con éxito" });
  } catch (error) {
    if (trx) await trx.rollback();
    console.error("UPDATE_SALE_ERROR:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar la venta", error: error.message });
  }
};

// Obtener historial de evolución de ventas y precios de un producto
exports.getProductEvolutionHistory = async (req, res) => {
  const { productId } = req.params;
  const { days = 90, period = "day" } = req.query;

  try {
    // Obtener producto
    const product = await db("products")
      .where({ id: productId, business_id: req.user.business_id })
      .first();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Determinar formato de agrupación según el período
    let dateFormat;
    switch (period) {
      case "week":
        dateFormat = "DATE_TRUNC('week', sales.created_at)";
        break;
      case "month":
        dateFormat = "DATE_TRUNC('month', sales.created_at)";
        break;
      default: // 'day'
        dateFormat = "DATE(sales.created_at)";
    }

    // Obtener evolución de ventas agrupadas por período
    const salesEvolution = await db("sale_items")
      .join("sales", "sale_items.sale_id", "sales.id")
      .where("sale_items.product_id", productId)
      .where("sales.business_id", req.user.business_id)
      .where("sales.created_at", ">=", startDate)
      .select(
        db.raw(`${dateFormat} as period`),
        db.raw("SUM(sale_items.quantity)::FLOAT as quantity"),
        db.raw("SUM(sale_items.subtotal)::FLOAT as revenue"),
        db.raw("AVG(sale_items.price_unit)::FLOAT as avg_price"),
        db.raw("MIN(sale_items.price_unit)::FLOAT as min_price"),
        db.raw("MAX(sale_items.price_unit)::FLOAT as max_price"),
        db.raw("COUNT(DISTINCT sales.id) as sales_count"),
      )
      .groupBy(db.raw(dateFormat))
      .orderBy("period", "asc");

    // Obtener historial de cambios de precio (agrupando por día y tomando el máximo para filtrar promociones)
    const priceHistory = await db("sale_items")
      .join("sales", "sale_items.sale_id", "sales.id")
      .where("sale_items.product_id", productId)
      .where("sales.business_id", req.user.business_id)
      .where("sales.created_at", ">=", startDate)
      .select(
        db.raw("DATE(sales.created_at) as date"),
        db.raw("MAX(sale_items.price_sell_at_sale)::FLOAT as price_sell"),
        db.raw("MAX(sale_items.cost_at_sale)::FLOAT as price_cost"),
      )
      .groupBy(db.raw("DATE(sales.created_at)"))
      .orderBy("date", "asc");

    // Detectar cambios significativos de precio (más de 0.01 de diferencia en precio de venta o costo)
    const priceChanges = [];
    let lastPriceSell = null;
    let lastPriceCost = null;

    for (const record of priceHistory) {
      const currentPriceSell = parseFloat(record.price_sell);
      const currentPriceCost = parseFloat(record.price_cost);

      // Detectar cambio en precio de venta:
      // Solo registramos el cambio si el precio sube (para ignorar promociones)
      // O si es el primer registro de precio
      const sellChanged =
        lastPriceSell === null || currentPriceSell > lastPriceSell + 0.01;

      // Para el costo, seguimos detectando cualquier cambio significativo
      const costChanged =
        lastPriceCost === null ||
        Math.abs(currentPriceCost - lastPriceCost) > 0.01;

      if (sellChanged || costChanged) {
        // Si el precio de venta es menor al último registrado (promoción),
        // mantenemos el último precio de venta alto en el registro de este cambio de costo
        const priceToRecord = sellChanged ? currentPriceSell : lastPriceSell;

        priceChanges.push({
          date: record.date,
          price_sell: priceToRecord,
          price_cost: currentPriceCost,
          sell_change: lastPriceSell
            ? ((priceToRecord - lastPriceSell) / lastPriceSell) * 100
            : 0,
          cost_change: lastPriceCost
            ? ((currentPriceCost - lastPriceCost) / lastPriceCost) * 100
            : 0,
        });

        if (sellChanged) lastPriceSell = currentPriceSell;
        lastPriceCost = currentPriceCost;
      }
    }

    // Calcular estadísticas generales
    const totalQuantity = salesEvolution.reduce(
      (sum, period) => sum + parseFloat(period.quantity || 0),
      0,
    );
    const totalRevenue = salesEvolution.reduce(
      (sum, period) => sum + parseFloat(period.revenue || 0),
      0,
    );
    const totalSales = salesEvolution.reduce(
      (sum, period) => sum + parseInt(period.sales_count || 0),
      0,
    );

    // Calcular precio promedio ponderado
    const weightedAvgPrice =
      totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

    // Obtener precio actual y primer precio
    const currentPrice = parseFloat(product.price_sell);
    const firstPrice =
      priceChanges.length > 0 ? priceChanges[0].price_sell : currentPrice;
    const priceIncrease =
      firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    // Calcular tendencia de ventas (comparar primera mitad vs segunda mitad)
    const midPoint = Math.floor(salesEvolution.length / 2);
    const firstHalf = salesEvolution.slice(0, midPoint);
    const secondHalf = salesEvolution.slice(midPoint);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0) /
          firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0) /
          secondHalf.length
        : 0;

    const salesTrend =
      firstHalfAvg > 0
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;

    // Obtener precio mínimo y máximo histórico (venta y costo)
    const allPricesSell = priceHistory.map((p) => parseFloat(p.price_sell));
    const allPricesCost = priceHistory.map((p) => parseFloat(p.price_cost));

    const minHistoricalPriceSell =
      allPricesSell.length > 0 ? Math.min(...allPricesSell) : currentPrice;
    const maxHistoricalPriceSell =
      allPricesSell.length > 0 ? Math.max(...allPricesSell) : currentPrice;

    const currentCost = parseFloat(product.price_buy || 0);
    const minHistoricalPriceCost =
      allPricesCost.length > 0 ? Math.min(...allPricesCost) : currentCost;
    const maxHistoricalPriceCost =
      allPricesCost.length > 0 ? Math.max(...allPricesCost) : currentCost;

    res.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        current_price: parseFloat(product.price_sell),
        current_cost: parseFloat(product.price_buy || 0),
        image_url: product.image_url,
      },
      stats: {
        totalQuantity: parseFloat(totalQuantity.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalSales,
        averageDaily: parseFloat((totalQuantity / parseInt(days)).toFixed(2)),
        weightedAvgPrice: parseFloat(weightedAvgPrice.toFixed(2)),
        days: parseInt(days),
        period,
      },
      priceStats: {
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        currentCost: parseFloat(currentCost.toFixed(2)),
        firstPrice: parseFloat(firstPrice.toFixed(2)),
        minHistoricalPriceSell: parseFloat(minHistoricalPriceSell.toFixed(2)),
        maxHistoricalPriceSell: parseFloat(maxHistoricalPriceSell.toFixed(2)),
        minHistoricalPriceCost: parseFloat(minHistoricalPriceCost.toFixed(2)),
        maxHistoricalPriceCost: parseFloat(maxHistoricalPriceCost.toFixed(2)),
        priceIncrease: parseFloat(priceIncrease.toFixed(2)),
        priceChangesCount: priceChanges.length,
      },
      trends: {
        salesTrend: parseFloat(salesTrend.toFixed(2)),
        trendDirection:
          salesTrend > 5 ? "growing" : salesTrend < -5 ? "declining" : "stable",
      },
      salesEvolution,
      priceChanges,
    });
  } catch (error) {
    console.error("Error en getProductEvolutionHistory:", error);
    res.status(500).json({
      message: "Error al obtener historial de evolución del producto",
    });
  }
};
