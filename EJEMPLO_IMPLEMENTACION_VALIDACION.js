/**
 * EJEMPLO: Cómo implementar validación de queries en rutas
 * 
 * Agregar este middleware a las rutas que tienen filtros de usuario
 */

// Importar el validador
// const { validateQueryParams, sanitizeSearchParams, validators } = require('../middleware/queryValidator');

/**
 * EJEMPLO 1: getSalesHistory con validación
 * 
 * Archivo: server/routes/saleRoutes.js o similar
 */

// router.get(
//   "/history",
//   authenticateToken,
//   sanitizeSearchParams(), // Sanitizar primero
//   validateQueryParams({
//     // Validar parámetros
//     date: validators.date,
//     seller: (v) => validators.string(v, 100) && validators.safe(v),
//     customer: (v) => validators.string(v, 100) && validators.safe(v),
//     payment: validators.enum(["cash", "card", "check", "transfer"]),
//     status: validators.enum(["completed", "pending", "cancelled"]),
//   }),
//   saleController.getSalesHistory
// );

/**
 * EJEMPLO 2: Búsqueda de productos con validación
 */

// router.get(
//   "/search",
//   authenticateToken,
//   sanitizeSearchParams(),
//   validateQueryParams({
//     q: (v) => validators.string(v, 100) && validators.safe(v),
//     category_id: validators.positiveInt,
//     limit: (v) => validators.positiveInt(v) && parseInt(v) <= 100,
//   }),
//   productController.searchProducts
// );

/**
 * EJEMPLO 3: Filtrado de reportes
 */

// router.get(
//   "/reports",
//   authenticateToken,
//   sanitizeSearchParams(),
//   validateQueryParams({
//     start_date: validators.date,
//     end_date: validators.date,
//     report_type: validators.enum(["daily", "weekly", "monthly", "yearly"]),
//     format: validators.enum(["json", "csv", "pdf"]),
//   }),
//   reportController.getReport
// );

/**
 * PASO A PASO para implementar:
 * 
 * 1. Crear archivo middleware/queryValidator.js (ya creado)
 * 
 * 2. En cada ruta que tenga filtros, agregar middleware:
 *    
 *    router.get('/endpoint',
 *      authenticateToken,
 *      sanitizeSearchParams(),
 *      validateQueryParams({
 *        param1: validatorFunction,
 *        param2: validatorFunction,
 *      }),
 *      controller
 *    );
 * 
 * 3. Testing:
 *    // Válido
 *    GET /api/sales-history?seller=John&date=2026-05-08
 *    // Respuesta: 200 OK
 * 
 *    // Inválido
 *    GET /api/sales-history?seller='; DROP TABLE--&date=invalid
 *    // Respuesta: 400 INVALID_QUERY_PARAMS
 */

/**
 * ALTERNATIVA: Validación rápida en controlador
 * 
 * Si no quieres crear middleware por cada ruta, puedes hacerlo en el controlador:
 */

// exports.getSalesHistory = async (req, res) => {
//   try {
//     const { date, seller, customer, payment, status } = req.query;
//     
//     // Validar parámetros
//     if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//       return res.status(400).json({ message: "Fecha inválida" });
//     }
//     
//     if (seller && (typeof seller !== "string" || seller.length > 100)) {
//       return res.status(400).json({ message: "Vendedor inválido" });
//     }
//     
//     if (customer && (typeof customer !== "string" || customer.length > 100)) {
//       return res.status(400).json({ message: "Cliente inválido" });
//     }
//     
//     const validPayments = ["cash", "card", "check"];
//     if (payment && !validPayments.includes(payment)) {
//       return res.status(400).json({ message: "Método de pago inválido" });
//     }
//     
//     // ... resto del controlador
//   } catch (error) {
//     // error handling
//   }
// };

/**
 * MONITOREO:
 * 
 * Habilitar logSuspiciousQueries() a nivel global:
 * 
 * const { logSuspiciousQueries } = require('./middleware/queryValidator');
 * app.use(logSuspiciousQueries());
 * 
 * Esto loguará automáticamente queries con patrones sospechosos
 */
