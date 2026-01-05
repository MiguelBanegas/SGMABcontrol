const db = require("../db");

exports.createSale = async (req, res) => {
  const { id, items, total, customer_id, created_at, payment_method } =
    req.body;
  const user_id = req.user.id;

  const trx = await db.transaction();
  try {
    await trx("sales").insert({
      id,
      user_id,
      customer_id: customer_id || null,
      total,
      payment_method: payment_method || "Efectivo",
      status: payment_method === "Cta Cte" ? "pendiente" : "completado",
      created_at: created_at || trx.fn.now(),
    });

    const saleItems = await Promise.all(
      items.map(async (item) => {
        const product = await trx("products")
          .where({ id: item.product_id })
          .first();
        // Sugerencia: El cliente envía item.price_unit.
        // Calculamos el descuento comparando con el precio_sell original del producto.
        const discount = Math.max(
          0,
          (product.price_sell || 0) - item.price_unit
        );

        return {
          sale_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_unit: item.price_unit,
          subtotal: item.subtotal,
          cost_at_sale: product.price_buy || 0,
          discount_amount: discount,
        };
      })
    );

    await trx("sale_items").insert(saleItems);

    for (const item of items) {
      await trx("products")
        .where({ id: item.product_id })
        .decrement("stock", item.quantity);
    }

    await trx.commit();
    req.app.get("io").emit("catalog_updated");
    req.app.get("io").emit("sales_updated");
    res.status(201).json({ message: "Venta registrada con éxito" });
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
    const stats = await db("sales")
      .leftJoin("sale_items", "sales.id", "sale_items.sale_id")
      .select(
        db.raw("DATE(sales.created_at) as date"),
        db.raw("SUM(DISTINCT sales.total)::FLOAT as total_day"),
        db.raw(
          "SUM(sale_items.subtotal - (sale_items.quantity * sale_items.cost_at_sale))::FLOAT as profit_day"
        )
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(7);
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
    await db("sales").where({ id }).update({ status });
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
    const pendingSale = await db("pending_sales").where({ user_id }).first();

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
    const existing = await db("pending_sales").where({ user_id }).first();

    if (existing) {
      // Actualizar
      await db("pending_sales")
        .where({ user_id })
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
    await db("pending_sales").where({ user_id }).delete();
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
      .where({ user_id })
      .count("* as count")
      .first();

    const totalSales = Math.min(parseInt(totalResult.count), maxTotal);

    // Obtener ventas de la página actual
    const sales = await db("sales")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .where({ "sales.user_id": user_id })
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
