const db = require("../db");

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
        (product.price_sell - effectiveUnitPrice) * item.quantity
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

    // Aplicar descuento por efectivo
    let cashDiscount = 0;
    if (payment_method === "Efectivo" && cashDiscountPercent > 0) {
      cashDiscount = subtotal * (cashDiscountPercent / 100);
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

    await trx("sales").insert({
      id,
      user_id,
      business_id: req.user.business_id,
      customer_id: customer_id || null,
      subtotal,
      cash_discount: cashDiscount,
      total,
      payment_method: payment_method || "Efectivo",
      amount_paid: amount_paid || null,
      change_given: change_given || null,
      debt_amount: null, // Initial debt is null, will be updated
      credit_applied: 0, // Initial credit applied is 0, will be updated
      status: "completado", // Initial status, will be updated
      settled_at: null, // Initial settled_at, will be updated
      cash_register_id: cash_register_id, // Asociar con caja abierta
      created_at: created_at || trx.fn.now(),
    });

    // Guardar items
    await trx("sale_items").insert(saleItems);

    // Registrar transacción en cuenta corriente del cliente (Siempre que haya cliente para trazabilidad)
    if (customer_id) {
      // Obtener el cliente para verificar si es Consumidor Final
      const customer = await trx("customers")
        .where({ id: customer_id })
        .first();

      if (customer && !customer.name.toLowerCase().includes("cons. final")) {
        // Calcular cuánto pagó realmente (descontando el vuelto)
        const netPaid =
          parseFloat(amount_paid || 0) - parseFloat(change_given || 0);
        const remainingDebt = total - netPaid; // Deuda después del pago en efectivo

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
              2
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
            currentBalance
          );
          let creditUsed = 0;

          // Si tenía crédito (balance negativo) y ahora tiene deuda (balance positivo)
          if (creditAvailable > 0 && currentBalance > 0) {
            creditUsed = Math.min(creditAvailable, currentBalance);
            currentBalance -= creditUsed;
            console.log(
              "DEBUG: Applying credit. creditUsed=",
              creditUsed,
              "new currentBalance=",
              currentBalance
            );

            await trx("customer_account_transactions").insert({
              customer_id,
              sale_id: id,
              type: "payment",
              amount: creditUsed,
              balance: currentBalance,
              description: `Crédito aplicado en Venta #${id.substring(0, 8)}`,
              business_id: req.user.business_id,
            });

            // Actualizar credit_applied en la venta
            await trx("sales")
              .where({ id })
              .update({
                credit_applied: creditUsed,
                debt_amount: currentBalance > 0 ? currentBalance : null,
                status: currentBalance > 0 ? "pendiente" : "completado",
                settled_at: currentBalance <= 0 ? trx.fn.now() : null,
              });
          } else if (creditAvailable > 0 && currentBalance <= 0) {
            // El crédito cubrió TODA la deuda y aún sobra
            creditUsed = total - netPaid; // Usó exactamente lo necesario para cubrir la deuda
            console.log(
              "DEBUG: Credit covered all debt. creditUsed=",
              creditUsed,
              "remaining credit=",
              Math.abs(currentBalance)
            );

            await trx("customer_account_transactions").insert({
              customer_id,
              sale_id: id,
              type: "payment",
              amount: creditUsed,
              balance: currentBalance,
              description: `Crédito aplicado en Venta #${id.substring(0, 8)}`,
              business_id: req.user.business_id,
            });

            // Actualizar credit_applied en la venta
            await trx("sales").where({ id }).update({
              credit_applied: creditUsed,
              debt_amount: null,
              status: "completado",
              settled_at: trx.fn.now(),
            });
          } else {
            // Si no se aplicó crédito, actualizar la venta con la deuda actual
            await trx("sales")
              .where({ id })
              .update({
                debt_amount: currentBalance > 0 ? currentBalance : null,
                status: currentBalance > 0 ? "pendiente" : "completado",
                settled_at: currentBalance <= 0 ? trx.fn.now() : null,
              });
          }

          console.log(
            "Traceability split transactions recorded successfully. Final Customer Balance:",
            currentBalance
          );
        } else {
          // Venta pagada completamente en efectivo, no hay deuda
          console.log(
            "Sale fully paid in cash, no customer account transactions needed."
          );
        }
      }
    }

    // Actualizar stock
    for (const item of items) {
      await trx("products")
        .where({ id: item.product_id, business_id: req.user.business_id })
        .decrement("stock", item.quantity);
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
        db.raw("SUM(total)::FLOAT as total_day")
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
              "SUM(sale_items.quantity * COALESCE(sale_items.cost_at_sale, 0))::FLOAT as total_cost"
            )
          )
          .first();

        const totalCost = costRes.total_cost || 0;
        return {
          date: dayStat.date,
          total_day: dayStat.total_day,
          profit_day: dayStat.total_day - totalCost,
        };
      })
    );

    res.json(stats);
  } catch (error) {
    console.error("Error en getSalesStats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

exports.getSalesHistory = async (req, res) => {
  try {
    const sales = await db("sales")
      .leftJoin("users", "sales.user_id", "users.id")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .where("sales.business_id", req.user.business_id)
      .select(
        "sales.*",
        "users.username as seller_name",
        "customers.name as customer_name"
      )
      .orderBy("sales.created_at", "desc");

    const history = await Promise.all(
      sales.map(async (sale) => {
        const items = await db("sale_items")
          .join("products", "sale_items.product_id", "products.id")
          .where({ sale_id: sale.id })
          .select("sale_items.*", "products.name as product_name");
        return { ...sale, items };
      })
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
          customer_id: customer_id || null,
          payment_method: payment_method || "Efectivo",
          updated_at: db.fn.now(),
        });
    } else {
      // Insertar
      await db("pending_sales").insert({
        user_id,
        business_id: req.user.business_id,
        cart_data: cartData,
        customer_id: customer_id || null,
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
      .where({
        "sales.user_id": user_id,
        "sales.business_id": req.user.business_id,
      })
      .select("sales.*", "customers.name as customer_name")
      .orderBy("sales.created_at", "desc")
      .limit(perPage)
      .offset(offset);

    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await db("sale_items")
          .join("products", "sale_items.product_id", "products.id")
          .where({ sale_id: sale.id })
          .select("sale_items.*", "products.name as product_name");
        return { ...sale, items };
      })
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
        "users.username as seller_name"
      )
      .first();

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const items = await db("sale_items")
      .join("products", "sale_items.product_id", "products.id")
      .where({ sale_id: sale.id })
      .select("sale_items.*", "products.name as product_name");

    res.json({ ...sale, items });
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
        db.raw("SUM(sale_items.subtotal)::FLOAT as revenue")
      )
      .groupBy(db.raw("DATE(sales.created_at)"))
      .orderBy("date", "asc");

    // Calcular estadísticas
    const totalQuantity = timeline.reduce(
      (sum, day) => sum + parseFloat(day.quantity || 0),
      0
    );
    const totalRevenue = timeline.reduce(
      (sum, day) => sum + parseFloat(day.revenue || 0),
      0
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
        db.raw("SUM(sale_items.subtotal)::FLOAT as total_revenue")
      )
      .groupBy("products.id", "products.name", "products.sku")
      .orderBy("total_quantity", "desc");

    res.json(report);
  } catch (error) {
    console.error("Error en getProductsReport:", error);
    res.status(500).json({ message: "Error al obtener reporte de productos" });
  }
};
