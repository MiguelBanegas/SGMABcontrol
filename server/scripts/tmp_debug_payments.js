const db = require('../db');
(async () => {
  try {
    const result = await db.raw(`
      SELECT s.id, s.total, s.payment_method, s.cash_discount,
        COUNT(sp.id) AS payment_count,
        COALESCE(SUM(sp.amount),0) AS payment_sum,
        array_agg(sp.payment_method) FILTER (WHERE sp.payment_method IS NOT NULL) AS methods,
        array_agg(sp.amount) FILTER (WHERE sp.amount IS NOT NULL) AS amounts
      FROM sales s
      LEFT JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE s.payment_method != 'Cta Cte'
      GROUP BY s.id, s.total, s.payment_method, s.cash_discount
      HAVING ABS(s.total - COALESCE(SUM(sp.amount),0)) > 0.01
      ORDER BY s.created_at DESC
      LIMIT 10
    `);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await db.destroy();
  }
})();
