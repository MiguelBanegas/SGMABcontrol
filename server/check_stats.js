const db = require("./db");

async function checkData() {
  try {
    const sales = await db("sales").select("*");
    console.log("--- Sales Table Content ---");
    console.log(sales);

    const stats = await db("sales")
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw("SUM(total)::FLOAT as total_day")
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(7);
    console.log("--- Calculated Stats ---");
    console.log(stats);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
