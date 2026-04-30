const db = require("./db");

async function testStats() {
  try {
    const salesData = await db("sales")
      .where({ business_id: 1 })
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw("SUM(total)::FLOAT as total_day"),
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(3);

    console.log("--- Query Results ---");
    salesData.forEach((row, i) => {
      console.log(
        `Row ${i}: date type = ${typeof row.date}, value =`,
        row.date,
      );
      if (row.date instanceof Date) {
        console.log(
          `  ISO simplified: ${row.date.toISOString().split("T")[0]}`,
        );
      }
    });

    const today = new Date().toISOString().split("T")[0];
    console.log("\nToday (JS string):", today);

    const todayFound = salesData.find((s) => {
      const rowDateStr =
        s.date instanceof Date
          ? s.date.toISOString().split("T")[0]
          : String(s.date);
      return rowDateStr === today;
    });

    console.log("Today found with fixed check?", !!todayFound);

    const originalCheck = salesData.find((s) => s.date === today);
    console.log(
      "Today found with original check (s.date === today)?",
      !!originalCheck,
    );

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testStats();
